#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DiscordBotStack } from './stacks/discord-bot-stack';
import { StartAPIStack } from './stacks/start-api-stack';

const app = new cdk.App();
new StartAPIStack(app, 'StartAPIStack');
new DiscordBotStack(app, 'DiscordBotStack');
