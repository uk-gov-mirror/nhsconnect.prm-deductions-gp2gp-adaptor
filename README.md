# Deductions GP2GP adaptor

This is a Proof of Concept implementation of a component to handle the sending and receiving of the GP2GP message set used to transfer a patient's Electronic Health Record between GP Practices.

The goal is to confirm the GP2GP message format can be used to transfer orphaned and stranded records into a secure NHS repository.

This component will communicate with the Message Handler Service (MHS) [GitHub nhsconnect/integration-adaptors](https://github.com/nhsconnect/integration-adaptors) and other components being developed by the Orphaned and Stranded Record programme.

The initial version will send and receive health records that are encoded in the HL7 format. A subsequent enhancement will be access to the components of the Health Record so that other services can use this component to send and receive Health Records with the need to implement the encoding and fragmentation strategies of the [GP2GP v2.2a](https://data.developer.nhs.uk/dms/mim/6.3.01/Domains/GP2GP/Document%20files/GP2GP%20IM.htm) message specification .

## Prerequisites

- Node 12.x

## Access to AWS

In order to get sufficient access to work with terraform or AWS CLI:

Make sure to unset the AWS variables:
```
unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY
unset AWS_SESSION_TOKEN
```

As a note, the following set-up is based on the README of assume-role [tool](https://github.com/remind101/assume-role)

Set up a profile for each role you would like to assume in `~/.aws/config`, for example:

```
[profile default]
region = eu-west-2
output = json

[profile admin]
region = eu-west-2
role_arn = <role-arn>
mfa_serial = <mfa-arn>
source_profile = default
```

The `source_profile` needs to match your profile in `~/.aws/credentials`.
```
[default]
aws_access_key_id = <your-aws-access-key-id>
aws_secret_access_key = <your-aws-secret-access-key>
```

## Assume role with elevated permissions

### Install `assume-role` locally:
`brew install remind101/formulae/assume-role`

Run the following command with the profile configured in your `~/.aws/config`:

`assume-role admin`

### Run `assume-role` with dojo:
Run the following command with the profile configured in your `~/.aws/config`:

`eval $(dojo "echo <mfa-code> | assume-role admin"`

Run the following command to confirm the role was assumed correctly:

`aws sts get-caller-identity`

## AWS SSM Parameters Design Principles

When creating the new ssm keys, please follow the agreed convention as per the design specified below:

* all parts of the keys are lower case
* the words are separated by dashes (`kebab case`)
* `env` is optional

### Design:
Please follow this design to ensure the ssm keys are easy to maintain and navigate through:

| Type               | Design                                  | Example                                               |
| -------------------| ----------------------------------------| ------------------------------------------------------|
| **User-specified** |`/repo/<env>?/user-input/`               | `/repo/${var.environment}/user-input/db-username`     |
| **Auto-generated** |`/repo/<env>?/output/<name-of-git-repo>/`| `/repo/output/prm-deductions-base-infra/root-zone-id` |


# Set up

1. Run `npm install` to install all node dependencies.
2. Create a .env file at the root of the directory
4. If you would like to run locally, following the steps below, otherwise fill in the required fields.
   - Note: The `GP2GP_ADAPTOR_AUTHORIZATION_KEYS` should be a string.
5. The app will use a fake MHS when `NHS_ENVIRONMENT` is set to `local` or `dev`. Here is an example for a local environment .env file, that can replace the contents of the .env.

   ```
   GP2GP_ADAPTOR_AUTHORIZATION_KEYS=auth-key-1
   GP2GP_ADAPTOR_MHS_QUEUE_VIRTUAL_HOST="/"
   GP2GP_ADAPTOR_REPOSITORY_ASID=deduction-asid
   GP2GP_ADAPTOR_REPOSITORY_ODS_CODE=deduction-ods
   NHS_ENVIRONMENT=local
   GP2GP_ADAPTOR_MHS_QUEUE_NAME=gp2gp-test
   GP2GP_ADAPTOR_MHS_QUEUE_URL_1=tcp://localhost:61610
   GP2GP_ADAPTOR_MHS_QUEUE_URL_2=tcp://localhost:61613
   GP2GP_ADAPTOR_MHS_QUEUE_VIRTUAL_HOST=/
   GP2GP_ADAPTOR_MHS_QUEUE_USERNAME=
   GP2GP_ADAPTOR_MHS_QUEUE_PASSWORD=
   PDS_ASID=
   GP2GP_ADAPTOR_MHS_OUTBOUND_URL=
   GP2GP_ADAPTOR_MHS_ROUTE_URL=
   ```

- Locally, the variables `GP2GP_ADAPTOR_AUTHORIZATION_KEYS`, `GP2GP_ADAPTOR_REPOSITORY_ASID`, `GP2GP_ADAPTOR_REPOSITORY_ODS_CODE` and `GP2GP_ADAPTOR_MHS_QUEUE_NAME` can be set
  to any value and the variables `GP2GP_ADAPTOR_MHS_QUEUE_USERNAME` and `GP2GP_ADAPTOR_MHS_QUEUE_PASSWORD` do not need to be set at
  all.
- `GP2GP_ADAPTOR_MHS_QUEUE_VIRTUAL_HOST` should be set to `/` on a typical rabbitmq setup, but it might other values depending on what queue hosting is used.

## Running the tests

Run the unit tests with

`npm test` or `./tasks test_unit`

Run the integration tests.

1. Run `docker-compose up` to set up the message queues.
2. Run `npm run test:integration`.

Alternatively, run `./tasks test_integration` (runs the tests within a Dojo container)

Run the coverage tests (unit test and integration test)

1. Run `docker-compose up` to set up the message queues.
2. Run `npm run test:coverage`.

Alternatively, run `./tasks test_coverage` (runs the tests within a Dojo container)

## Start the app locally

1. Run the message queues in docker by using `docker-compose up &`. Make sure your .env has the following config
2. Run a development server with `npm run start:local`, to start together with a linked MQ server. You can access the queues using the Rabbit MQ console on: http://localhost:15672/
3. If successful, it will print a message similar to the following in the terminal:


```.env
// .env
GP2GP_ADAPTOR_MHS_QUEUE_NAME=<any-name>
GP2GP_ADAPTOR_MHS_QUEUE_URL_1=tcp://localhost:61620
GP2GP_ADAPTOR_MHS_QUEUE_URL_2=tcp://localhost:61621
GP2GP_ADAPTOR_MHS_QUEUE_VIRTUAL_HOST=/
GP2GP_ADAPTOR_MHS_QUEUE_USERNAME=admin
GP2GP_ADAPTOR_MHS_QUEUE_PASSWORD=admin
```

```
// console
{
  message: 'Listening on port 3000',
  level: 'info',
  correlationId: undefined,
  timestamp: '2020-01-31T11:47:19.763Z'
}
```

### Swagger

The swagger documentation for the app can be found at http://localhost:3000/swagger. To update it, change the
`src/swagger.json` file. You can use the editor https://editor.swagger.io/ which will validate your changes.

### Example request

```
curl -X POST "http://localhost:3000/ehr-request" -H "accept: application/json" -H "Authorization: auth-key-1" -H "Content-Type: application/json" -d "{ \"nhsNumber\": \"some-nhs-number\", \"odsCode\": \"some-ods-code\"}"
```

## Start the app in production mode

Compile the code with `npm run build`, and then start the server with `npm start`.

# Testing Locally (Dev/Test)

When debugging, it may be useful to be able to connect to either the `dev` or `test` message queues.

## Config

Update the .env file with the following config items can be found in SSM properties under the following locations:

| Parameters         | SSM Parameter                                                             |
|--------------------|---------------------------------------------------------------------------|
| GP2GP_ADAPTOR_MHS_QUEUE_URL_1    | /repo/${NHS_ENVIRONMENT}/output/prm-deductions-infra/amqp-endpoint-0      |
| GP2GP_ADAPTOR_MHS_QUEUE_URL_2    | /repo/${NHS_ENVIRONMENT}/output/prm-deductions-infra/amqp-endpoint-1      |
| GP2GP_ADAPTOR_MHS_QUEUE_USERNAME | /repo/${NHS_ENVIRONMENT}/user-input/mq-admin-username                     |
| GP2GP_ADAPTOR_MHS_QUEUE_PASSWORD | /repo/${NHS_ENVIRONMENT}/user-input/mq-admin-password                     |
| GP2GP_ADAPTOR_MHS_QUEUE_NAME     | Please set this to something different than in Terraform                  |

Ensure you have VPN connection set up to both `dev` and `test` environments:
[CLICK HERE](https://gpitbjss.atlassian.net/wiki/spaces/TW/pages/1832779966/VPN+for+Deductions+Services)

## Setup

In AmazonMQ settings for either the `dev` or `test` provision. Edit the `deductor-amq-broker-${NHS_ENVIRONMENT}`
security group inbound rules. Add new rule that allows All TCP from the `${NHS_ENVIRONMENT} VPN VM security group`,
apply before running the following:

```
// Starts the server locally using `.env`
$ NHS_ENVIRONMENT=test npm run start:local
```
