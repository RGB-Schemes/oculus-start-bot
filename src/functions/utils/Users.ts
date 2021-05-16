import { PutItemInput, QueryInput, QueryOutput, ScanInput } from 'aws-sdk/clients/dynamodb';
import { DynamoDB } from 'aws-sdk';
import { usersTableName } from '../constants/EnvironmentProps';
import { START_TRACKS } from '../constants/DiscordServerProps';
import { DiscordMember } from 'discord-bot-cdk-construct';

/**
 * The actual table instance for the users to read and write from.
 */
const usersTable = new DynamoDB();

function hasAuthorizedResults(discordMember: DiscordMember, queryResults: QueryOutput, authorizedRoles: string[]): boolean {
    if (queryResults.Count && queryResults.Count > 0) {
        const hasResult = queryResults.Items?.map(item => {
            return item?.discordMemberId?.S == `${discordMember.user.id}` &&
                item.oculusHandle.S &&
                authorizedRoles.includes(item.startTrack?.S ?? 'does-not-exist');
        }).filter(x => x).length;
        return hasResult == 1;
    }
    return false;
}

/**
 * Checks if a Discord member is authorized for a desired role.
 * @param {DiscordMember} discordMember The Discord member to see if they are authorized.
 * @param {string[]} authorizedRoles The roles that the user must be authorized for at least one of.
 * @returns Returns true if the user is authorized for the chosen role, false otherwise.
 */
export async function isUserAuthorized(discordMember: DiscordMember,
    authorizedRoles: string[] = START_TRACKS) {
    var queryParams: QueryInput = {
        TableName: usersTableName,
        KeyConditionExpression: 'discordMemberId = :discordMemberId',
        ExpressionAttributeValues: {
            ':discordMemberId': {
                S: `${discordMember.user.id}`
            }
        },
        ProjectionExpression: 'oculusHandle, discordMemberId, startTrack'
    };
    var queryResults = await usersTable.query(queryParams).promise();
    do {
        if (hasAuthorizedResults(discordMember, queryResults, authorizedRoles)) {
            return true;
        }
        if (queryResults.LastEvaluatedKey) {
            queryParams.ExclusiveStartKey = queryResults.LastEvaluatedKey;
            queryResults = await usersTable.query(queryParams).promise();
        }
    } while (queryResults.LastEvaluatedKey)

    return hasAuthorizedResults(discordMember, queryResults, authorizedRoles);
}

/**
 * Checks to see if an Oculus handle has already been used to register an account.
 * @param oculusHandle The Oculus handle to check and see if exists.
 */
export async function oculusHandleExists(oculusHandle: string): Promise<boolean> {
    var scanParams: ScanInput = {
        TableName: usersTableName,
        FilterExpression: 'oculusHandle = :oculusHandle',
        ExpressionAttributeValues: {
            ':oculusHandle': {
                S: oculusHandle
            }
        },
        ProjectionExpression: 'oculusHandle, discordMemberId'
    };
    var scanResults = await usersTable.scan(scanParams).promise();
    do {
        if (scanResults.Count && scanResults.Count > 0) {
            return true;
        }
        if (scanResults.LastEvaluatedKey) {
            scanParams.ExclusiveStartKey = scanResults.LastEvaluatedKey;
            scanResults = await usersTable.scan(scanParams).promise();
        }
    } while (scanResults.LastEvaluatedKey)

    return (scanResults.Count && scanResults.Count > 0) ? true : false;
}

/**
 * Checks to see if a Discord member has already been registered.
 * @param {DiscordMember} discordMember The Discord member to check and see if has already been registered.
 */
export async function discordMemberExists(discordMember: DiscordMember): Promise<boolean> {
    var queryParams: QueryInput = {
        TableName: usersTableName,
        KeyConditionExpression: 'discordMemberId = :discordMemberId',
        ExpressionAttributeValues: {
            ':discordMemberId': {
                S: `${discordMember.user.id}`
            }
        },
        ProjectionExpression: 'oculusHandle, discordMemberId'
    };
    var queryResults = await usersTable.query(queryParams).promise();
    do {
        if (queryResults.Count && queryResults.Count > 0) {
            return true;
        }
        if (queryResults.LastEvaluatedKey) {
            queryParams.ExclusiveStartKey = queryResults.LastEvaluatedKey;
            queryResults = await usersTable.query(queryParams).promise();
        }
    } while (queryResults.LastEvaluatedKey)

    return (queryResults.Count && queryResults.Count > 0) ? true : false;
}

/**
 * Updates a user in the users table.
 *
 * @param {DiscordMember} discordMember The Discord member to update for.
 * @param {string} oculusHandle The Oculus handle of this user.
 * @param {string} startTrack The track that this user is on.
 * @return {boolean} True on success, false otherwise.
 */
export async function updateUser(discordMember: DiscordMember,
    oculusHandle: string, startTrack: string): Promise<boolean> {
    const putParams: PutItemInput = {
        TableName: usersTableName,
        Item: {
            'discordMemberId': {
                'S': `${discordMember.user.id}`,
            },
            'oculusHandle': {
                'S': oculusHandle,
            },
            'startTrack': {
                'S': startTrack.toLowerCase(),
            },
        },
    };
    try {
        await usersTable.putItem(putParams).promise();
        return true;
    } catch (err) {
        console.log(`An error occurred when adding the new user: ${err}`);
    }
    return false;
}
