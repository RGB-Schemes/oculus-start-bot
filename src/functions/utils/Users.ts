import { QueryInput, QueryOutput, ScanInput } from 'aws-sdk/clients/dynamodb';
import { DynamoDB } from 'aws-sdk';
import { usersTableName } from '../constants/EnvironmentProps';
import { START_TRACKS } from '../../types';

/**
 * The actual table instance for the users to read and write from.
 */
export const usersTable = new DynamoDB();

function hasAuthorizedResults(discordHandle: string, queryResults: QueryOutput, authorizedRoles: string[]): boolean {
    if (queryResults.Count && queryResults.Count > 0) {
        const hasResult = queryResults.Items?.map(item => {
            return item?.discordHandle?.S == discordHandle &&
                item.oculusHandle.S &&
                authorizedRoles.includes(item.startTrack?.S ?? 'does-not-exist');
        }).filter(x => x).length;
        return hasResult == 1;
    }
    return false;
}

/**
 * Checks if a user is authorized for a desired role.
 * @param {string} discordHandle The Discord handle to see if it is authorized.
 * @param {string[]} authorizedRoles The roles that the user must be authorized for at least one of.
 * @returns Returns true if the user is authorized for the chosen role, false otherwise.
 */
export async function isUserAuthorized(discordHandle: string,
    authorizedRoles: string[] = START_TRACKS) {
    var queryParams: QueryInput = {
        TableName: usersTableName,
        KeyConditionExpression: 'discordHandle = :discordHandle',
        ExpressionAttributeValues: {
            ':discordHandle': {
                S: discordHandle
            }
        },
        ProjectionExpression: 'oculusHandle, discordHandle, startTrack'
    };
    var queryResults = await usersTable.query(queryParams).promise();
    do {
        if (hasAuthorizedResults(discordHandle, queryResults, authorizedRoles)) {
            return true;
        }
        if (queryResults.LastEvaluatedKey) {
            queryParams.ExclusiveStartKey = queryResults.LastEvaluatedKey;
            queryResults = await usersTable.query(queryParams).promise();
        }
    } while (queryResults.LastEvaluatedKey)

    return hasAuthorizedResults(discordHandle, queryResults, authorizedRoles);
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
        ProjectionExpression: 'oculusHandle, discordHandle'
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
 * Checks to see if a Discord handle has already been registered.
 * @param discordHandle The Discord handle to check and see if has already been registered.
 */
export async function discordHandleExists(discordHandle: string): Promise<boolean> {
    var queryParams: QueryInput = {
        TableName: usersTableName,
        KeyConditionExpression: 'discordHandle = :discordHandle',
        ExpressionAttributeValues: {
            ':discordHandle': {
                S: discordHandle
            }
        },
        ProjectionExpression: 'oculusHandle, discordHandle'
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