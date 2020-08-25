variable "functionName" {
  type = string
  default = "gp2gpAdaptor"
}

variable "handler" {
  type = string
  default = "build/lambda.handler"
}

variable "filename" {
  type = string
  default = "../gp2gp.zip"
}

variable "security_group_id" {
  type = string
}
