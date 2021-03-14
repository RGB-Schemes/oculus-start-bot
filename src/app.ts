import { App } from '@aws-cdk/core';
import { DiscordBotStack } from './stacks/discord-bot-stack';
import { StartAPIStack } from './stacks/start-api-stack';
import { DiscordConfigStack } from './stacks/discord-config-stack';

const stackEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
};

const app = new App();
const discordConfigStack = new DiscordConfigStack(app, 'DiscordConfigStack', {
  env: stackEnv
});
const startAPIStack = new StartAPIStack(app, 'StartAPIStack', {
  discordAPISecrets: discordConfigStack.discordAPISecrets,
  domainAddress: 'rgbschemes.com',
  env: stackEnv
});
const discordBotStack = new DiscordBotStack(app, 'DiscordBotStack', {
  discordAPISecrets: discordConfigStack.discordAPISecrets,
  usersTable: startAPIStack.usersTable,
  env: stackEnv
});
