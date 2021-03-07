import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import '@aws-cdk/assert/jest';
import * as StartAPI from '../../src/stacks/start-api-stack';

test('Empty Stack', () => {
    const app = new cdk.App();

    const stack = new StartAPI.StartAPIStack(app, 'MyTestStack');
    expect(stack).toHaveResource('AWS::DynamoDB::Table');
    expect(stack).toHaveResource('AWS::SQS::Queue');
    expect(stack).toHaveResource('AWS::Lambda::Function');
    expect(stack).toHaveResource('AWS::ApiGateway::RestApi');
    // TODO: Properly test each of these resources for permissions, environment variables, etc.
});
