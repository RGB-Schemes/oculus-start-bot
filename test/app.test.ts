import * as cdk from '@aws-cdk/core';
import '@aws-cdk/assert/jest';
import * as StartAPI from '../src/stacks/start-api-stack';

test('Test all stacks', () => {
    const app = new cdk.App();
    const testEnv = {
        account: 'testAccount',
        region: 'testRegion'
    }

    const startAPIStack = new StartAPI.StartAPIStack(app, 'StartAPIStack', {
        domainAddress: 'example.com',
        env: testEnv
    });
    expect(startAPIStack).toHaveResource('AWS::SecretsManager::Secret');
    expect(startAPIStack).toHaveResource('AWS::DynamoDB::Table');
    expect(startAPIStack).toHaveResource('AWS::Lambda::Function');
    expect(startAPIStack).toHaveResource('AWS::ApiGateway::RestApi');
    expect(startAPIStack).toHaveResource('AWS::Route53::RecordSet');
    expect(startAPIStack).toHaveResource('AWS::ApiGateway::UsagePlan');
    expect(startAPIStack).toHaveResource('AWS::Lambda::Function');
    expect(startAPIStack).toHaveResource('AWS::ApiGateway::RestApi');

    const startAPIStack_no_domain = new StartAPI.StartAPIStack(app, 'StartAPIStack-no-domain', {
        env: testEnv
    });
    expect(startAPIStack_no_domain).toHaveResource('AWS::SecretsManager::Secret');
    expect(startAPIStack_no_domain).toHaveResource('AWS::DynamoDB::Table');
    expect(startAPIStack_no_domain).toHaveResource('AWS::Lambda::Function');
    expect(startAPIStack_no_domain).toHaveResource('AWS::ApiGateway::RestApi');
    expect(startAPIStack_no_domain).toHaveResource('AWS::ApiGateway::UsagePlan');
    expect(startAPIStack_no_domain).toHaveResource('AWS::Lambda::Function');
    expect(startAPIStack_no_domain).toHaveResource('AWS::ApiGateway::RestApi');
});
