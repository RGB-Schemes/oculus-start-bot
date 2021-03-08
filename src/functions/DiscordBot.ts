import {Context, Callback} from 'aws-lambda';
import {SecretsManager} from 'aws-sdk';
import {discordBotAPIKeyName} from './constants/EnvironmentProps';
import * as nacl from 'tweetnacl';
import {DiscordSecrets} from '../types';

export interface DiscordEventRequest {
    timestamp: string;
    signature: string;
    jsonBody: any;
}

export interface DiscordEventResponse {
    type: number;
    data?: DiscordDataResponse;
}

export interface DiscordDataResponse {
    tts: boolean;
    content: string;
    embeds: any[];
    /* eslint-disable camelcase */
    allowed_mentions: string[];
    /* eslint-enable camelcase */
}

const secretsManager = new SecretsManager();

/**
 * Handles incoming events from the Discord bot.
 * @param {DiscordEventRequest} event The incoming request to handle.
 * @param {Context} context The context this request was called with.
 * @param {Callback} callback A callback to handle the request.
 * @return {DiscordEventResponse} Returns a response to send back to Discord.
 */
export async function handler(event: DiscordEventRequest, context: Context,
    callback: Callback): Promise<DiscordEventResponse> {
  console.log(`Received event: ${JSON.stringify(event)}`);

  if (event && await verifyEvent(event)) {
    if (event.jsonBody.type == 1) {
      return {
        type: 1,
      };
    }

    return {
      type: 3,
      data: {
        tts: false,
        content: 'beep boop',
        embeds: [],
        allowed_mentions: [],
      },
    };
  }

  throw new Error('[UNAUTHORIZED] invalid request signature');
}

/**
 * Verifies that an event coming from Discord is legitimate.
 * @param {DiscordEventRequest} event The event to verify from Discord.
 * @return {boolean} Returns true if the event was verified, false otherwise.
 */
export async function verifyEvent(event: DiscordEventRequest): Promise<boolean> {
  const discordAPIKey = await secretsManager.getSecretValue({
    SecretId: discordBotAPIKeyName,
  }).promise();

  try {
    if (discordAPIKey.SecretString) {
      const discordSecrets: DiscordSecrets = JSON.parse(discordAPIKey.SecretString);
      const isVerified = nacl.sign.detached.verify(
          Buffer.from(event.timestamp + JSON.stringify(event.jsonBody)),
          Buffer.from(event.signature, 'hex'),
          Buffer.from(discordSecrets.publicKey, 'hex'),
      );
      return isVerified;
    }
  } catch (exception) {
    console.log(exception);
  }

  return false;
}
