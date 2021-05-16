import axios from 'axios';
import {AWSError, DynamoDB, SecretsManager} from 'aws-sdk';
import {BatchWriteItemInput, ScanInput, ScanOutput} from 'aws-sdk/clients/dynamodb';
import * as Stacks from '../configs/outputs.json';
import {DiscordMember, DiscordSecrets} from 'discord-bot-cdk-construct';

interface OlderUser {
  discordHandle: string;
  forumUsername: string;
  email: string;
}

const dynamoDB = new DynamoDB({
  region: 'us-west-2',
});

const secretsManager = new SecretsManager({
  region: 'us-west-2',
});


const inputArgs = process.argv.slice(2);

const inputDB = inputArgs[0];
const outputDB = inputArgs[1];

const scanParams: ScanInput = {
  TableName: inputDB,
  ProjectionExpression: 'discordHandle, forumUsername, email',
  Limit: 25,
};
dynamoDB.scan(scanParams, async (err?: AWSError | undefined, data?: ScanOutput | undefined) => {
  if (err) {
    console.log(`There was an error querying the table: ${err}`);
  } else if (data) {
    do {
      const users: OlderUser[] = [];
      data.Items?.forEach((item) => {
        const user: OlderUser = {
          discordHandle: item?.discordHandle?.S ?? '',
          email: item?.email?.S ?? '',
          forumUsername: item?.forumUsername?.S ?? '',
        };
        users.push(user);
      });
      submitOlderUsers(users);

      if (data.LastEvaluatedKey) {
        scanParams.ExclusiveStartKey = data.LastEvaluatedKey;
        data = await dynamoDB.scan(scanParams).promise();
      }
    } while (data && data.LastEvaluatedKey);
  }
});

/**
 * Submits a list of older users.
 * @param {OlderUser[]} users Older users to submit.
 */
async function submitOlderUsers(users: OlderUser[]) {
  const batchWriteRequest: BatchWriteItemInput = {
    RequestItems: {
      [outputDB]: [],
    },
  };
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const discordMember = await getDiscordMember(user.discordHandle);
    if (discordMember) {
      batchWriteRequest.RequestItems[outputDB].push({
        PutRequest: {
          Item: {
            'discordMemberId': {
              'S': `${discordMember.user.id}`,
            },
            'oculusHandle': {
              'S': user.forumUsername,
            },
            'startTrack': {
              'S': 'normal',
            },
            'email': {
              'S': user.email,
            },
          },
        },
      });
    }
    // We need to delay a smidge or Discord's APIs will 429 us.
    await delay(5000);
  }

  try {
    await dynamoDB.batchWriteItem(batchWriteRequest).promise();
    console.log(`Submitted the the users!`);
  } catch (exception) {
    console.log(`There was an error adding users: ${exception}`);
  }
}

/**
 * Waits for a set amount of time.
 *
 * @param {number} ms The amount of time to delay by (in milliseconds).
 * @return {Promise} The promise to await on.
 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gets the Discord member object for a given handle.
 *
 * @param {string} discordHandle The Discord handle to get the member object of.
 * @return {Promise<DiscordMember | undefined>} If the user exists, the DiscordMember object.
 */
async function getDiscordMember(discordHandle: string): Promise<DiscordMember | undefined> {
  const secrets = await secretsManager.getSecretValue({
    SecretId: Stacks.DiscordConfigStack.discordSecretsName,
  }).promise();
  if (secrets?.SecretString) {
    try {
      const discordSecrets: DiscordSecrets = JSON.parse(secrets.SecretString);
      const authConfig = {
        headers: {
          'Authorization': `Bot ${discordSecrets?.authToken}`,
        },
      };
      let highestMemberId: number = 0;
      let discordMember: DiscordMember | undefined = undefined;

      let url = `https://discord.com/api/v8/guilds/${discordSecrets?.serverId}`;
      url += `/members?limit=1000&after=${highestMemberId}`;
      try {
        do {
          highestMemberId = 0;
          discordMember = ((await axios.get(url, authConfig))
              .data as DiscordMember[]).filter((member) => {
            highestMemberId = Math.max(highestMemberId, member.user.id);
            return discordHandle == `${member.user.username}#${member.user.discriminator}`;
          }).pop();
        } while (discordMember == undefined && highestMemberId > 0);
        return discordMember;
      } catch (exception) {
        console.log(`There was an error finding this Discord member: ${exception}`);
        return undefined;
      }
    } catch (exception) {
      console.log(`There was an error parsing the secret JSON: ${exception}`);
      console.log('Please make sure that you have setup your secrets in the AWS console!');
    }
  }
  return undefined;
}

