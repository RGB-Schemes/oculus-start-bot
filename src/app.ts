#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { OculusStartBotStack } from './stacks/oculus-start-bot-stack';
import { StartAPIStack } from './stacks/start-api-stack';

const app = new cdk.App();
new StartAPIStack(app, 'StartAPIStack');
