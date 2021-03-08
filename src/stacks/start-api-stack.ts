import { AttributeType, Table } from '@aws-cdk/aws-dynamodb';
import { Runtime } from '@aws-cdk/aws-lambda';
import { LambdaIntegration, RequestValidator, RestApi } from '@aws-cdk/aws-apigateway';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import * as cdk from '@aws-cdk/core';
import * as path from 'path';
import { Queue } from '@aws-cdk/aws-sqs';

export class StartAPIStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create our DynamoDB tables first.
    const usersTable = new Table(this, 'user-auth-table', {
      partitionKey: {
        name: 'discordHandle',
        type: AttributeType.STRING
      }
    });

    const eventsTable = new Table(this, 'events-table', {
      partitionKey: {
        name: 'name',
        type: AttributeType.STRING
      }
    });

    // Next up: SQS Queue for the Discord bot to consume.
    const discordBotQueue = new Queue(this, 'discord-bot-event-queue');

    // Create the Lambdas next.
    const userAuthLambda = new NodejsFunction(this, 'user-auth-lambda', {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, '../functions/UserAuth.ts'),
      handler: 'handler',
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
        DISCORD_BOT_EVENT_QUEUE: discordBotQueue.queueUrl
      }
    });
    usersTable.grantReadWriteData(userAuthLambda);
    discordBotQueue.grantSendMessages(userAuthLambda);

    // Create our API Gateway
    const discordBotAPI = new RestApi(this, 'start-bot-api');
    const discordBotAPIValidator = new RequestValidator(this, 'start-bot-api-validator', {
      restApi: discordBotAPI,
      validateRequestBody: true,
      validateRequestParameters: true
    });

    // User authentication endpoint configuration
    const userAuthItems = discordBotAPI.root.addResource('auth');
    const userAuthIntegration: LambdaIntegration = new LambdaIntegration(userAuthLambda, {
      proxy: false,
      requestTemplates: {
        'application/json': '{\
            "discordHandle": "$input.params(\'discordHandle\')",\
            "oculusHandle": "$input.params(\'oculusHandle\')",\
            "startTrack": "$input.params(\'startTrack\')"\
        }'
      },
      integrationResponses: [
        {
          statusCode: "200"
        }
      ]
    });
    userAuthItems.addMethod('POST', userAuthIntegration, {
      apiKeyRequired: true,
      requestValidator: discordBotAPIValidator,
      methodResponses: [
        {
          statusCode: "200"
        }
      ],
      requestParameters: {
        'method.request.querystring.discordHandle': true,
        'method.request.querystring.oculusHandle': true,
        'method.request.querystring.startTrack': true
      }
    });
  }
}
