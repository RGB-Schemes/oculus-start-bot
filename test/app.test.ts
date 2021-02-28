import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import '@aws-cdk/assert/jest';
import * as OculusStartBot from '../src/stacks/oculus-start-bot-stack';

test('Empty Stack', () => {
    const app = new cdk.App();

    const stack = new OculusStartBot.OculusStartBotStack(app, 'MyTestStack');
    expect(stack).toHaveResource('AWS::DynamoDB::Table');
    expect(stack).toHaveResource('AWS::SQS::Queue');
    expect(stack).toHaveResource('AWS::Lambda::Function');
    expect(stack).toHaveResource('AWS::ApiGateway::RestApi');
    // TODO: Properly test each of these resources for permissions, environment variables, etc.
});
