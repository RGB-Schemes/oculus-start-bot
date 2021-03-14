import { DynamoDB } from "aws-sdk";
import { QueryInput, QueryOutput } from "aws-sdk/clients/dynamodb";
import { authTableName } from "../constants/EnvironmentProps";

/**
 * The actual table instance for the users to read and write from.
 */
export const authKeysTable = new DynamoDB();

function hasAuthorizedResults(apiKey: string, queryResults: QueryOutput, validationTag: string): boolean {
  if (queryResults.Count && queryResults.Count > 0) {
    const hasResult = queryResults.Items?.map(item => {
      return item?.apiKey?.S == apiKey &&
        item.validationTags?.SS?.includes(validationTag);
    }).filter(x => x).length;
    return hasResult == 1;
  }
  return false;
}

/**
 * Used to validate that a given API Key is authorized for an API.
 * 
 * @param {string} apiKey The API Key to validate the tag of.
 * @param {string} validationTag The name of the tag to validate.
 * @returns {boolean} Returns true if the tag on the chosen API Key is true, false otherwise.
 */
export async function isAuthorized(apiKey: string, validationTag: string): Promise<boolean> {
  var queryParams: QueryInput = {
    TableName: authTableName,
    KeyConditionExpression: 'apiKey = :apiKey',
    ExpressionAttributeValues: {
      ':apiKey': {
        S: apiKey
      }
    },
    ProjectionExpression: 'apiKey, validationTags'
  };
  var queryResults = await authKeysTable.query(queryParams).promise();
  do {
    if (hasAuthorizedResults(apiKey, queryResults, validationTag)) {
      return true;
    }
    if (queryResults.LastEvaluatedKey) {
      queryParams.ExclusiveStartKey = queryResults.LastEvaluatedKey;
      queryResults = await authKeysTable.query(queryParams).promise();
    }
  } while (queryResults.LastEvaluatedKey)

  return hasAuthorizedResults(apiKey, queryResults, validationTag);
}
