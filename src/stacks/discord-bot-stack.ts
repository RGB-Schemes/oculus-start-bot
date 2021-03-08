import {Runtime} from '@aws-cdk/aws-lambda';
import {LambdaIntegration, RequestValidator, RestApi} from '@aws-cdk/aws-apigateway';
import {NodejsFunction} from '@aws-cdk/aws-lambda-nodejs';
import {CfnOutput, Construct, Stack, StackProps} from '@aws-cdk/core';
import {Secret} from '@aws-cdk/aws-secretsmanager';
import * as path from 'path';

/**
 * A stack for creating the Discord bot itself. Creates an API Gateway endpoint
 * that Discord can reach for events.
 */
export class DiscordBotStack extends Stack {
  public readonly discordAPISecrets: Secret;

  /**
   * The constructor for building the stack.
   * @param {Construct} scope The Construct scope to create the stack in.
   * @param {string} id The ID of the stack to use.
   * @param {StackProps} props The properties to configure the stack.
   */
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.discordAPISecrets = new Secret(this, 'oculus-start-discord-api-key', {
      secretName: `oculusStartDiscordSecrets${scope.node.addr}`,
    });
    new CfnOutput(this, 'discordSecretsName', {value: this.discordAPISecrets.secretName});

    // Create the Lambdas next.
    const discordBotLambda = new NodejsFunction(this, 'discord-bot-lambda', {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, '../functions/DiscordBot.ts'),
      handler: 'handler',
      environment: {
        DISCORD_BOT_API_KEY_NAME: this.discordAPISecrets.secretName,
      },
    });

    this.discordAPISecrets.grantRead(discordBotLambda);

    // Create our API Gateway
    const discordBotAPI = new RestApi(this, 'discord-bot-api', {
      defaultCorsPreflightOptions: {
        allowOrigins: [
          '*',
        ],
      },
    });
    const discordBotAPIValidator = new RequestValidator(this, 'discord-bot-api-validator', {
      restApi: discordBotAPI,
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    // User authentication endpoint configuration
    const discordBotEventItems = discordBotAPI.root.addResource('event', {
      defaultCorsPreflightOptions: {
        allowOrigins: [
          '*',
        ],
      },
    });
    const discordBotIntegration: LambdaIntegration = new LambdaIntegration(discordBotLambda, {
      proxy: false,
      requestTemplates: {
        'application/json': '{\r\n\
              "timestamp": "$input.params(\'x-signature-timestamp\')",\r\n\
              "signature": "$input.params(\'x-signature-ed25519\')",\r\n\
              "jsonBody" : $input.json(\'$\')\r\n\
            }',
      },
      integrationResponses: [
        {
          statusCode: '200',
        },
        {
          statusCode: '401',
          selectionPattern: '.*[UNAUTHORIZED].*',
          responseTemplates: {
            'application/json': 'invalid request signature',
          },
        },
      ],
    });
    discordBotEventItems.addMethod('POST', discordBotIntegration, {
      apiKeyRequired: false,
      requestValidator: discordBotAPIValidator,
      methodResponses: [
        {
          statusCode: '200',
        },
        {
          statusCode: '401',
        },
      ],
    });
  }
}
