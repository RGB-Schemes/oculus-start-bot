import * as cdk from '@aws-cdk/core';
import '@aws-cdk/assert/jest';
import * as DiscordConfig from '../src/stacks/discord-config-stack';
import * as DiscordBot from '../src/stacks/discord-bot-stack';
import * as StartAPI from '../src/stacks/start-api-stack';

test('Test all stacks', () => {
    const app = new cdk.App();

    const discordConfigStack = new DiscordConfig.DiscordConfigStack(app, 'DiscordConfigStack');
    expect(discordConfigStack).toHaveResource('AWS::SecretsManager::Secret');

    const startAPIStack = new StartAPI.StartAPIStack(app, 'StartAPIStack', {
        discordAPISecrets: discordConfigStack.discordAPISecrets
    });
    expect(startAPIStack).toHaveResource('AWS::DynamoDB::Table');
    expect(startAPIStack).toHaveResource('AWS::Lambda::Function');
    expect(startAPIStack).toHaveResource('AWS::ApiGateway::RestApi');

    const discordBotStack = new DiscordBot.DiscordBotStack(app, 'DiscordBotStack', {
        discordAPISecrets: discordConfigStack.discordAPISecrets,
        usersTable: startAPIStack.usersTable
    });
    expect(discordBotStack).toHaveResource('AWS::Lambda::Function');
    expect(discordBotStack).toHaveResource('AWS::ApiGateway::RestApi');
});
