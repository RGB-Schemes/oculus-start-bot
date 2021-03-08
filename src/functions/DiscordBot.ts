import { Context, Callback } from 'aws-lambda';
import { SecretsManager } from 'aws-sdk';
import { discordBotAPIKeyName } from './constants/EnvironmentProps'
import * as nacl from 'tweetnacl';

export interface DiscordEventRequest {
    timestamp: string;
    signature: string;
    body_json: any;
}

export interface DiscordEventResponse {
    type: number;
    data?: DiscordDataResponse;
}

export interface DiscordDataResponse {
    tts: boolean;
    content: string;
    embeds: any[];
    allowed_mentions: string[];
}

const secretsManager = new SecretsManager();

export async function handler(event: DiscordEventRequest, context: Context, callback: Callback): Promise<DiscordEventResponse> {
    console.log(`Received event: ${JSON.stringify(event)}`);

    if (event && await verifyEvent(event)) {
        if (event.body_json.type == 1) {
            return {
                type: 1
            }
        }

        return {
            type: 3,
            data: {
                tts: false,
                content: "beep boop",
                embeds: [],
                allowed_mentions: []
            }
        }
    }

    throw new Error('[UNAUTHORIZED] invalid request signature');
}

export async function verifyEvent(event: DiscordEventRequest): Promise<boolean> {
    const discordAPIKey = await secretsManager.getSecretValue({
        SecretId: discordBotAPIKeyName
    }).promise();

    try {
        if (discordAPIKey.SecretString) {
            const isVerified = nacl.sign.detached.verify(
                Buffer.from(event.timestamp + JSON.stringify(event.body_json)),
                Buffer.from(event.signature, 'hex'),
                Buffer.from(discordAPIKey.SecretString, 'hex')
            );
            return isVerified;
        }
    } catch (exception) {
        console.log(exception);
    }

    return false;
}