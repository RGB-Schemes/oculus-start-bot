import {AttributeType, Table} from '@aws-cdk/aws-dynamodb';
import {Runtime} from '@aws-cdk/aws-lambda';
import {LambdaIntegration, RequestValidator, RestApi} from '@aws-cdk/aws-apigateway';
import {NodejsFunction} from '@aws-cdk/aws-lambda-nodejs';
import {Construct, Stack, StackProps} from '@aws-cdk/core';
import * as path from 'path';
import {Secret} from '@aws-cdk/aws-secretsmanager';

export interface StartAPIStackProps extends StackProps {
  discordAPISecrets: Secret;
}

/**
 * Creates the APIs and code behind them for managing various
 * things in the backend of the Oculus Start bot (user authorization, event
 * management, etc.)
 */
export class StartAPIStack extends Stack {
  public readonly usersTable: Table;

  /**
   * The constructor for building the stack.
   * @param {Construct} scope The Construct scope to create the stack in.
   * @param {string} id The ID of the stack to use.
   * @param {StartAPIStackProps} props The properties to configure the stack.
   */
  constructor(scope: Construct, id: string, props: StartAPIStackProps) {
    super(scope, id, props);

    // Create our DynamoDB tables first.
    this.usersTable = new Table(this, 'user-auth-table', {
      partitionKey: {
        name: 'discordHandle',
        type: AttributeType.STRING,
      },
    });

    // const eventsTable = new Table(this, 'events-table', {
    //   partitionKey: {
    //     name: 'name',
    //     type: AttributeType.STRING,
    //   },
    // });

    // Create the Lambdas next.
    const userAuthLambda = new NodejsFunction(this, 'user-auth-lambda', {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, '../functions/UserAuth.ts'),
      handler: 'handler',
      environment: {
        DISCORD_BOT_API_KEY_NAME: props.discordAPISecrets.secretName,
        USERS_TABLE_NAME: this.usersTable.tableName,
      },
    });
    this.usersTable.grantReadWriteData(userAuthLambda);
    props.discordAPISecrets.grantRead(userAuthLambda);

    // Create our API Gateway
    const discordBotAPI = new RestApi(this, 'start-bot-api');
    const discordBotAPIValidator = new RequestValidator(this, 'start-bot-api-validator', {
      restApi: discordBotAPI,
      validateRequestBody: true,
      validateRequestParameters: true,
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
        }',
      },
      integrationResponses: [
        {
          statusCode: '200',
        },
      ],
    });
    userAuthItems.addMethod('POST', userAuthIntegration, {
      apiKeyRequired: true,
      requestValidator: discordBotAPIValidator,
      methodResponses: [
        {
          statusCode: '200',
        },
      ],
      requestParameters: {
        'method.request.querystring.discordHandle': true,
        'method.request.querystring.oculusHandle': true,
        'method.request.querystring.startTrack': true,
      },
    });
  }
}
