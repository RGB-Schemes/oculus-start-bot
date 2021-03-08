#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DiscordBotStack } from './stacks/discord-bot-stack';
import { StartAPIStack } from './stacks/start-api-stack';

const app = new cdk.App();
const startAPIStack = new StartAPIStack(app, 'StartAPIStack');
new DiscordBotStack(app, 'DiscordBotStack', {
  usersTable: startAPIStack.usersTable
});

