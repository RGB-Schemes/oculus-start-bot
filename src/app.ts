#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DiscordBotStack } from './stacks/discord-bot-stack';
import { StartAPIStack } from './stacks/start-api-stack';
import { DiscordConfigStack } from './stacks/discord-config-stack';

const app = new cdk.App();
const discordConfigStack = new DiscordConfigStack(app, 'DiscordConfigStack');
const startAPIStack = new StartAPIStack(app, 'StartAPIStack', {
  discordAPISecrets: discordConfigStack.discordAPISecrets
});
const discordBotStack = new DiscordBotStack(app, 'DiscordBotStack', {
  discordAPISecrets: discordConfigStack.discordAPISecrets,
  usersTable: startAPIStack.usersTable
});
