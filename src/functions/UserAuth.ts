import {Context, Callback} from 'aws-lambda';
import {authAPIKeyTag} from './constants/EnvironmentProps';
import {discordMemberExists, oculusHandleExists, updateUser} from './utils/Users';
import {ROLE_MAP, START_TRACKS} from './constants/DiscordServerProps';
import {getDiscordMember, setMemberRole} from './utils/Discord';
import {isAuthorized} from './utils/LambdaAuth';

/**
 * A regular expression for validating Discord handle formats.
 */
const discordRegex = new RegExp(
    '^((?!discordtag|everyone|here)[^@#:```]){2,32}#[0-9]{4}$',
);

export interface UserAuthRequest {
    discordHandle: string;
    oculusHandle: string;
    startTrack: string;
    apiKey: string;
}

export interface UserAuthResponse {
    statusCode: number;
    errorMessage?: string;
}

/**
 * Authorizes a user for the Discord server.
 * @param {UserAuthRequest} event The incoming request for authorizing a user.
 * @param {Context} context The context in which this was called.
 * @param {Callback} callback The callback to use when calling this event.
 * @return {UserAuthResponse} Responds with a status code and optional error message.
 */
export async function handler(event: UserAuthRequest, context: Context, callback: Callback) {
  console.log(`Received event: ${JSON.stringify(event)}`);

  if (event) {
    if (await isAuthorized(event.apiKey, authAPIKeyTag) == false) {
      return {
        statusCode: 401,
        errorMessage: 'You are not authorized for this API!',
      };
    }
    if (await oculusHandleExists(event.oculusHandle)) {
      return {
        statusCode: 409,
        errorMessage: 'This user has already registered their Discord account before!',
      };
    }

    if (!discordRegex.test(event.discordHandle)) {
      return {
        statusCode: 409,
        errorMessage: `'${event.discordHandle}' is not a valid Discord handle!`,
      };
    }

    const discordMember = await getDiscordMember(event.discordHandle);
    if (discordMember == undefined) {
      return {
        statusCode: 409,
        errorMessage: `The Discord member ${event.discordHandle} is not in the server!`,
      };
    }

    if (await discordMemberExists(discordMember)) {
      return {
        statusCode: 409,
        errorMessage: 'This Discord user is already registered!',
      };
    }

    if (!START_TRACKS.includes(event.startTrack.toLowerCase())) {
      return {
        statusCode: 409,
        errorMessage: `The Start Track '${event.startTrack.toLowerCase()}' is not valid!`,
      };
    }

    if (await updateUser(discordMember, event.oculusHandle, event.startTrack)) {
      if (await setMemberRole(discordMember, ROLE_MAP[event.startTrack.toLowerCase()])) {
        return {
          statusCode: 200,
        };
      } else {
        return {
          statusCode: 500,
          errorMessage: 'There was an error setting the user\'s role!',
        };
      }
    } else {
      return {
        statusCode: 500,
        errorMessage: 'There was an adding the new user!',
      };
    }
  }

  return {
    statusCode: 409,
    errorMessage: 'Invalid inputs given for the request.',
  };
}
