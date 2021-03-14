import {AWSError, SecretsManager} from 'aws-sdk';
import {GetSecretValueResponse} from 'aws-sdk/clients/secretsmanager';
import {DiscordInteractions, PartialApplicationCommand} from 'slash-commands';
import {DiscordSecrets} from '../types';
import * as Stacks from '../configs/outputs.json';

const commands: PartialApplicationCommand[] = [
  {
    name: 'hello-world',
    description: 'A simple hello command to test.',
  },
];

const secretsManager = new SecretsManager({
  region: 'us-west-2',
});

secretsManager.getSecretValue({
  SecretId: Stacks.DiscordConfigStack.discordSecretsName,
}, async (err?: AWSError, data?: GetSecretValueResponse) => {
  if (data?.SecretString) {
    try {
      const discordSecrets: DiscordSecrets = JSON.parse(data.SecretString);
      const interaction = new DiscordInteractions({
        applicationId: discordSecrets.appId,
        authToken: discordSecrets.authToken,
        publicKey: discordSecrets.publicKey,
      });

      const inputArgs = process.argv.slice(2);

      switch (inputArgs[0]) {
        case 'setup':
          commands.forEach(async (command) => {
            await interaction.createApplicationCommand(command).then(() => {
              console.log(`Created command ${command.name}!`);
            }).catch(console.log);
          });
          break;
        case 'reset':
          const existingCommands = await interaction.getApplicationCommands();
          existingCommands.forEach(async (command) => {
            await interaction
                .deleteApplicationCommand(command.id)
                .then(() => {
                  console.log(`Deleted command ${command.name}!`);
                })
                .catch(console.error);
          });
          break;
      }
    } catch (exception) {
      console.log(`There was an error parsing the secret JSON: ${exception}`);
      console.log('Please make sure that you have setup your secrets in the AWS console!');
    }
  } else {
    console.log('There was a problem retrieving your deployment results.\
    Make sure you\'ve run "npm run deploy" before running this command.');
  }
});
