import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import '@aws-cdk/assert/jest';
import * as DiscordBot from '../../src/stacks/discord-bot-stack';

test('Empty Stack', () => {
    const app = new cdk.App();

    const stack = new DiscordBot.DiscordBotStack(app, 'MyTestStack');
    expect(stack).toHaveResource('AWS::SecretsManager::Secret');
    expect(stack).toHaveResource('AWS::Lambda::Function');
    expect(stack).toHaveResource('AWS::ApiGateway::RestApi');
    // TODO: Properly test each of these resources for permissions, environment variables, etc.
});
