import { App } from '@aws-cdk/core';
import { StartAPIStack } from './stacks/start-api-stack';

const stackEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
};

const app = new App();
const startAPIStack = new StartAPIStack(app, 'StartAPIStack', {
  domainAddress: 'rgbschemes.com',
  env: stackEnv
});
