provider "aws" {
  region = "us-east-2"
  profile = "nhsdev"
}

variable "myregion" {
  default = "us-east-2"
}

variable "accountId" {
  default = "979473778894"
}

//TODO refactor role outside of the lambda as it's gonna be the same across different types of lambda
resource "aws_iam_role" "iam_for_lambda" {
  name = "iam_for_lambda_node"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "ecs_for_lambda" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
  role = aws_iam_role.iam_for_lambda.id
}

data "aws_security_group" "gp2gp" {
  id = var.security_group_id
}

data "aws_subnet_ids" "lambda" {
  vpc_id = data.aws_security_group.gp2gp.vpc_id
}

data "aws_vpc_endpoint" "apigw_endpoint" {
  vpc_id = data.aws_security_group.gp2gp.vpc_id
  service_name = "com.amazonaws.us-east-2.execute-api"
}

resource "aws_lambda_function" "lambda" {
  function_name = var.functionName
  source_code_hash = filebase64sha256(var.filename)
  handler = var.handler
  role = aws_iam_role.iam_for_lambda.arn
  runtime = "nodejs12.x"
  filename = var.filename
  timeout = 30
  memory_size = 256
  vpc_config {
    security_group_ids = [data.aws_security_group.gp2gp.id]
    subnet_ids = data.aws_subnet_ids.lambda.ids
  }

  environment {
    variables = {
      AUTHORIZATION_KEYS = var.auth_key
      MHS_OUTBOUND_URL = var.mhs_outbound_url
    }
  }
}

data "template_file" "gateway_policy" {
  template = file("gateway_policy.json")
  vars = {
    vpc_id = data.aws_subnet_ids.lambda.vpc_id
  }
}

resource "aws_api_gateway_rest_api" "api" {
  name = "gp2gpApi"
  endpoint_configuration {
    types = ["PRIVATE"]
    vpc_endpoint_ids = [data.aws_vpc_endpoint.apigw_endpoint.id]
  }
  policy = data.template_file.gateway_policy.rendered
}

resource "aws_api_gateway_resource" "resource" {
  path_part   = "{proxy+}"
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  rest_api_id = aws_api_gateway_rest_api.api.id
}

resource "aws_api_gateway_method" "method" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.resource.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.resource.id
  http_method             = aws_api_gateway_method.method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda.invoke_arn
}

resource "aws_lambda_permission" "apigw_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda.function_name
  principal     = "apigateway.amazonaws.com"

  # More: http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-control-access-using-iam-policies-to-invoke-api.html
  source_arn = "arn:aws:execute-api:${var.myregion}:${var.accountId}:${aws_api_gateway_rest_api.api.id}/*/*/*"
}

resource "aws_api_gateway_deployment" "dev_deployment" {
  depends_on = [aws_api_gateway_integration.integration]

  rest_api_id = aws_api_gateway_rest_api.api.id
  stage_name  = "dev"

  lifecycle {
    create_before_destroy = true
  }
}