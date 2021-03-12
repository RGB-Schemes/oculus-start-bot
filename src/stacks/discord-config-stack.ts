import {CfnOutput, Construct, Stack, StackProps} from '@aws-cdk/core';
import {Secret} from '@aws-cdk/aws-secretsmanager';

/**
 * A stack for configuring the Discord bot. Handles setting up anything the bot will
 * need for configuration purposes.
 */
export class DiscordConfigStack extends Stack {
  public readonly discordAPISecrets: Secret;

  /**
   * The constructor for building the stack.
   * @param {Construct} scope The Construct scope to create the stack in.
   * @param {string} id The ID of the stack to use.
   * @param {StackProps} props The properties to configure the stack.
   */
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.discordAPISecrets = new Secret(this, 'oculus-start-discord-api-key');
    new CfnOutput(this, 'discordSecretsName', {value: this.discordAPISecrets.secretName});
  }
}
