import {Context, Callback} from 'aws-lambda';
import {SecretsManager} from 'aws-sdk';
import {discordBotAPIKeyName} from './constants/EnvironmentProps';
import * as nacl from 'tweetnacl';
import {DiscordSecrets} from '../types';
import {isUserAuthorized} from './utils/Users';
import {Embed} from 'slash-commands';

export interface DiscordEventRequest {
  timestamp: string;
  signature: string;
  jsonBody: DiscordRequestJsonBody;
}

export interface DiscordRequestJsonBody {
  data?: DiscordRequestData;
  member?: DiscordRequestMember;
  type: number;
  version: number;
}

export interface DiscordRequestMember {
  deaf: boolean;
  roles: string[];
  user: DiscordRequestUser;
}

export interface DiscordRequestUser {
  username: string;
  discriminator: string;
}

export interface DiscordRequestData {
  id: string;
  name: string;
}

export interface DiscordEventResponse {
  type: number;
  data?: DiscordResponseData;
}

export interface DiscordResponseData {
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
    }

    switch (event.jsonBody.type) {
      case 1:
        return {
          type: 1,
        };
      case 2:
        return await handleCommand(event);
      default:
        return {
          type: 3,
          data: {
            tts: false,
            content: 'beep boop - I\'m still learning how to respond to that command.',
            embeds: [],
            allowed_mentions: [],
          },
        };
    }
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

/**
 * Handles an incoming command for a user.
 * @param {DiscordEventRequest} event The incoming event with the command to handle.
 * @return {DiscordEventResponse} Returns a response that can be outputted to the user.
 */
export async function handleCommand(event: DiscordEventRequest): Promise<DiscordEventResponse> {
  if (event.jsonBody.member) {
    switch (event.jsonBody.data?.name) {
      case 'hello-world':
        const username = (event.jsonBody.member.user.username) +
          '#' + (event.jsonBody.member.user.discriminator);
        if (await isUserAuthorized(username)) {
          return generateStandardResponse(`Hello ${event.jsonBody.member.user.username}!`);
        } else {
          return generateStandardResponse(`You are not authorized for that command ` +
            `${event.jsonBody.member.user.username}.`);
        }
      default:
        return generateStandardResponse('Hey, that\'s a new command!');
    }
  } else {
    return generateStandardResponse('Sorry, there is no member info with this request.');
  }
}

/**
 * A helper for generating a standard response for Discord.
 * @param {string} content The string content to return.
 * @param {Embed[]} embeds A list of embeds to return.
 * @return {DiscordEventResponse} The fully-formed response.
 */
function generateStandardResponse(content: string, embeds: Embed[] = []): DiscordEventResponse {
  return {
    type: 3,
    data: {
      tts: false,
      content,
      embeds,
      allowed_mentions: [],
    },
  };
}
