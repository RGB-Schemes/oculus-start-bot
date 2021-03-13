import {AttributeType, Table} from '@aws-cdk/aws-dynamodb';
import {Runtime} from '@aws-cdk/aws-lambda';
import {LambdaIntegration, RequestValidator, RestApi} from '@aws-cdk/aws-apigateway';
import {NodejsFunction} from '@aws-cdk/aws-lambda-nodejs';
import {Construct, Stack, StackProps} from '@aws-cdk/core';
import * as path from 'path';
import {Secret} from '@aws-cdk/aws-secretsmanager';
import {DnsValidatedCertificate} from '@aws-cdk/aws-certificatemanager';
import {ARecord, HostedZone, RecordTarget} from '@aws-cdk/aws-route53';
import {ApiGateway} from '@aws-cdk/aws-route53-targets';

export interface StartAPIStackProps extends StackProps {
  discordAPISecrets: Secret;
  domainAddress: string;
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
        name: 'discordMemberId',
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
    const hostedZone = HostedZone.fromLookup(this, 'rgbschemes-hosted-zone', {
      domainName: props.domainAddress,
    });
    const startAPICertificate = new DnsValidatedCertificate(this, 'start-api-cert', {
      domainName: `oculusstart.${props.domainAddress}`,
      hostedZone: hostedZone,
    }); ;
    const startAPI = new RestApi(this, 'start-api', {
      domainName: {
        domainName: `oculusstart.${props.domainAddress}`,
        certificate: startAPICertificate,
      },
    });
    new ARecord(this, 'start-api-alias-record', {
      zone: hostedZone,
      target: RecordTarget.fromAlias(new ApiGateway(startAPI)),
      recordName: `oculusstart.${props.domainAddress}`,
    });
    const startAPIValidator = new RequestValidator(this, 'start-api-validator', {
      restApi: startAPI,
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    // User authentication endpoint configuration
    const userAuthItems = startAPI.root.addResource('auth');
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
      requestValidator: startAPIValidator,
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

    // Setup the usage plans here. Don't add any API keys though! Those should be manually added!
    const startApiUsagePlan = startAPI.addUsagePlan('startApiUsagePlan', {
      name: 'Start API Usage Plan',
    });
    startApiUsagePlan.addApiStage({
      stage: startAPI.deploymentStage,
    });
  }
}
