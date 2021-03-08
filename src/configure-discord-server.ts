import { AWSError, SecretsManager } from "aws-sdk";
import { GetSecretValueResponse } from "aws-sdk/clients/secretsmanager";
import DiscordInteractions from "slash-commands";
import { DiscordSecrets } from "./types";
import * as Stacks from './configs/outputs.json';

const secretsManager = new SecretsManager({
  region: 'us-west-2'
});

secretsManager.getSecretValue({
  SecretId: Stacks.DiscordBotStack.discordSecretsName
}, (err?: AWSError, data?: GetSecretValueResponse) => {
  if (data?.SecretString) {
    try {
      const discordSecrets: DiscordSecrets = JSON.parse(data.SecretString);
      new DiscordInteractions({
        applicationId: discordSecrets.appId,
        authToken: discordSecrets.clientId,
        publicKey: discordSecrets.publicKey,
      });

      console.log('Ready to create interactions!');
      // TODO: Handle here
    } catch(exception) {
      console.log(`There was an error parsing the secret JSON: ${exception}`);
      console.log('Please make sure that you have setup your secrets in the AWS console!');
    }
  }
});
