import { Context, Callback } from 'aws-lambda';
import { AWSError, SQS } from 'aws-sdk';
import { PutItemInput } from 'aws-sdk/clients/dynamodb';
import { SendMessageRequest } from 'aws-sdk/clients/sqs';
import { usersTableName, discordBotEventQueueURL } from './constants/EnvironmentProps';
import { discordHandleExists, oculusHandleExists, usersTable } from './utils/Users';

/**
 * The list of valid tracks that a developer can be on.
 */
const START_TRACKS = [
    "normal",
    "growth",
    "alumni"
]

/**
 * A regular expression for validating Discord handle formats.
 */
const discordRegex = new RegExp('^((?!discordtag|everyone|here)[^@#:```]){2,32}#[0-9]{4}$');

const discordBotEventQueue = new SQS();

export interface UserAuthRequest {
    discordHandle: string;
    oculusHandle: string;
    startTrack: string;
}

export interface UserAuthRepsponse {
    statusCode: number;
    errorMessage?: string;
}

export async function handler(event: UserAuthRequest, context: Context, callback: Callback) {
    console.log(`Received event: ${event}`);

    if (event) {
        if (await oculusHandleExists(event.oculusHandle)) {
            return {
                statusCode: 409,
                errorMessage: 'This user has already registered their Discord handle before!'
            };
        }

        if (!discordRegex.test(event.discordHandle)) {
            return {
                statusCode: 409,
                errorMessage: `'${event.discordHandle}' is not a valid Discord handle!`
            }
        }

        if (await discordHandleExists(event.discordHandle)) {
            return {
                statusCode: 409,
                errorMessage: 'This Discord user is already registered!'
            };
        }

        if (!START_TRACKS.includes(event.startTrack.toLowerCase())) {
            return {
                statusCode: 409,
                errorMessage: `The Start Track '${event.startTrack.toLowerCase()}' is not valid!`
            }
        }

        const putParams: PutItemInput = {
            TableName: usersTableName,
            Item: {
                "discordHandle": {
                    "S": event.discordHandle
                },
                "oculusHandle": {
                    "S": event.oculusHandle
                },
                "startTrack": {
                    "S": event.startTrack.toLowerCase()
                }
            }
        }
        try {
            await usersTable.putItem(putParams).promise();
            const successQueueInput: SendMessageRequest = {
                QueueUrl: discordBotEventQueueURL,
                MessageAttributes: {
                    'EventType': {
                        DataType: 'String',
                        StringValue: 'NewMember'
                    },
                    'Publisher': {
                        DataType: 'String',
                        StringValue: 'AuthAPILambda'
                    }
                },
                MessageBody: JSON.stringify({
                    discordHandle: event.discordHandle,
                    startTrack: event.startTrack.toLowerCase()
                })
            };
            await discordBotEventQueue.sendMessage(successQueueInput).promise();
            return {
                statusCode: 200
            };
        } catch (err) {
            console.log(`An error occurred when adding the new user: ${err}`);
            return {
                statusCode: 500,
                errorMessage: 'There was an adding the new user!'
            }
        }
    }

    return {
        statusCode: 409,
        errorMessage: 'Invalid inputs given for the request.'
    };
}
