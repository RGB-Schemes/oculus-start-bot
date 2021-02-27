#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { OculusStartBotStack } from './stacks/oculus-start-bot-stack';

const app = new cdk.App();
new OculusStartBotStack(app, 'OculusStartBotStack');
