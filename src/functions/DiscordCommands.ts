import {Context, Callback} from 'aws-lambda';
import {DiscordEventRequest, DiscordResponseData, verifyEvent} from 'discord-bot-cdk-construct';
import {Embed} from 'slash-commands';
import {ROLE_MAP, START_TRACKS} from './constants/DiscordServerProps';
import {hasMemberRole, sendResponse} from './utils/Discord';
import {isUserAuthorized, updateUser} from './utils/Users';

/**
 * The actual handler for the lambda.
 * @param {DiscordEventRequest} event The incoming event to handle.
 * @param {Context} context The context to handle.
 * @param {Callback} callback The callback to run for this.
 * @return {string} A simple status code of what was run.
 */
export async function handler(event: DiscordEventRequest, context: Context,
    callback: Callback): Promise<string> {
  console.log('Running Discord command handler...');

  if (await verifyEvent(event)) {
    const response = await handleCommand(event);
    console.log('Sending response...');
    if (event.jsonBody.token && await sendResponse(response, event.jsonBody.token)) {
      console.log('Responded successfully!');
    } else {
      console.log('Failed to send response!');
    }
  } else {
    console.log('Invalid request!');
  }
  return '200';
}

/**
 * Handles an incoming command for a user.
 * @param {DiscordEventRequest} event The incoming event with the command to handle.
 * @return {DiscordResponseData} Returns a response that can be outputted to the user.
 */
export async function handleCommand(event: DiscordEventRequest): Promise<DiscordResponseData> {
  if (event.jsonBody.member) {
    switch (event.jsonBody.data?.name) {
      case 'hello-world':
        if (await isUserAuthorized(event.jsonBody.member)) {
          return generateStandardResponse(`Hello ${event.jsonBody.member.user.username}!`);
        } else {
          return generateStandardResponse(`You are not authorized for that command ` +
            `${event.jsonBody.member.user.username}.`);
        }
      case 'verify':
        let highestRole: string | undefined = undefined;
        for (let i = START_TRACKS.length - 1; i > -1; i--) {
          if (await hasMemberRole(event.jsonBody.member, ROLE_MAP[START_TRACKS[i]])) {
            highestRole = START_TRACKS[i];
            break;
          }
        }
        if (highestRole != undefined) {
          if (event.jsonBody.data.options &&
            event.jsonBody.data.options[0].name == 'oculus_handle' &&
            event.jsonBody.data.options[0].value && await updateUser(event.jsonBody.member,
              event.jsonBody.data.options[0].value, highestRole)) {
            const responseText = 'You have been verified! You can now use the bot commands!';
            return generateStandardResponse(responseText);
          } else {
            return generateStandardResponse('There was a problem verifying you!');
          }
        } else {
          return generateStandardResponse('You do not have an Oculus Start role assigned!');
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
 * @return {DiscordResponseData} The fully-formed response.
 */
function generateStandardResponse(content: string, embeds: Embed[] = []): DiscordResponseData {
  return {
    tts: false,
    content,
    embeds,
    allowed_mentions: [],
  };
}
