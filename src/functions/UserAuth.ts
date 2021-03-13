import {Context, Callback} from 'aws-lambda';
import {PutItemInput} from 'aws-sdk/clients/dynamodb';
import {usersTableName} from './constants/EnvironmentProps';
import {discordMemberExists, oculusHandleExists, usersTable} from './utils/Users';
import {ROLE_MAP, START_TRACKS} from './constants/DiscordServerProps';
import {getDiscordMember, setMemberRole} from './utils/Discord';

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
    if (await oculusHandleExists(event.oculusHandle)) {
      return {
        statusCode: 409,
        errorMessage: 'This user has already registered their Discord handle before!',
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

    const putParams: PutItemInput = {
      TableName: usersTableName,
      Item: {
        'discordMemberId': {
          'S': `${discordMember.user.id}`,
        },
        'oculusHandle': {
          'S': event.oculusHandle,
        },
        'startTrack': {
          'S': event.startTrack.toLowerCase(),
        },
      },
    };
    try {
      await usersTable.putItem(putParams).promise();

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
    } catch (err) {
      console.log(`An error occurred when adding the new user: ${err}`);
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
