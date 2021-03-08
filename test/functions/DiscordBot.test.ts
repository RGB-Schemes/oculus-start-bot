import { Context, Callback } from 'aws-lambda';

const mockGetSecretValue = jest.fn().mockReturnValue({
    SecretString: JSON.stringify({
                appId: 'appId',
                publicKey: 'publicKey',
                clientId: 'clientId'
            })
});

const mockGetSecretValuePromise = {
    promise: mockGetSecretValue
}

const mockSecretsManager = {
    getSecretValue: jest.fn(() => mockGetSecretValuePromise)
}

jest.mock('aws-sdk', () => {
    return {
        SecretsManager: jest.fn(() => mockSecretsManager),
    };
});

const mockVerify = jest.fn();

jest.mock('tweetnacl', () => {
    return {
        sign: {
            detached: {
                verify: mockVerify
            }
        }
    }
});

import * as DiscordBot from '../../src/functions/DiscordBot';

describe('Test DiscordBot', () => {
    afterEach(() => {
        mockGetSecretValuePromise.promise.mockReset();
        mockVerify.mockReset();
    });

    test('Test Verify - Success', async () => {
        mockGetSecretValue.mockReturnValueOnce({
            SecretString: JSON.stringify({
                appId: 'appId',
                publicKey: 'publicKey',
                clientId: 'clientId'
            })
        });
        mockVerify.mockReturnValueOnce(true);
        const result = await DiscordBot.verifyEvent({
            timestamp: '',
            signature: '',
            jsonBody: {}
        });

        expect(mockGetSecretValuePromise.promise).toBeCalledTimes(1);
        expect(mockVerify).toBeCalledTimes(1);
        expect(result).toEqual(true);
    });

    test('Test Verify - Fail', async () => {
        mockGetSecretValue.mockReturnValueOnce({
            SecretString: JSON.stringify({
                appId: 'appId',
                publicKey: 'publicKey',
                clientId: 'clientId'
            })
        });
        mockVerify.mockReturnValueOnce(false);
        const result = await DiscordBot.verifyEvent({
            timestamp: '',
            signature: '',
            jsonBody: {}
        });

        expect(mockGetSecretValuePromise.promise).toBeCalledTimes(1);
        expect(mockVerify).toBeCalledTimes(1);
        expect(result).toEqual(false);
    });

    test('Test Verify - No Secret Key', async () => {
        mockGetSecretValue.mockReturnValueOnce({});
        mockVerify.mockReturnValueOnce(true);

        const result = await DiscordBot.verifyEvent({
            timestamp: '',
            signature: '',
            jsonBody: {}
        });

        expect(mockGetSecretValuePromise.promise).toBeCalledTimes(1);
        expect(mockVerify).toBeCalledTimes(0);
        expect(result).toEqual(false);
    });

    test('Test Verify - nacl Exception', async () => {
        mockGetSecretValue.mockReturnValueOnce({
            SecretString: JSON.stringify({
                appId: 'appId',
                publicKey: 'publicKey',
                clientId: 'clientId'
            })
        });
        mockVerify.mockImplementationOnce(() => {
            throw new Error('Handle errors');
        })

        const result = await DiscordBot.verifyEvent({
            timestamp: '',
            signature: '',
            jsonBody: {}
        });

        expect(mockGetSecretValuePromise.promise).toBeCalledTimes(1);
        expect(mockVerify).toBeCalledTimes(1);
        expect(result).toEqual(false);
    });

    test('Test Handler - Success', async () => {
        mockGetSecretValue.mockReturnValueOnce({
            SecretString: JSON.stringify({
                appId: 'appId',
                publicKey: 'publicKey',
                clientId: 'clientId'
            })
        });
        mockVerify.mockReturnValueOnce(true);
        const result = await DiscordBot.handler({
            timestamp: '',
            signature: '',
            jsonBody: {}
        }, (null as unknown) as Context, (null as unknown) as Callback);

        expect(result).toEqual({
            type: 3,
            data: {
                tts: false,
                content: "beep boop",
                embeds: [],
                allowed_mentions: []
            }
        });
    });

    test('Test Handler (No Event Type) - Success', async () => {
        mockGetSecretValue.mockReturnValueOnce({
            SecretString: JSON.stringify({
                appId: 'appId',
                publicKey: 'publicKey',
                clientId: 'clientId'
            })
        });
        mockVerify.mockReturnValueOnce(true);
        const result = await DiscordBot.handler(({
            timestamp: '',
            signature: '',
            jsonBody: {}
        } as unknown) as DiscordBot.DiscordEventRequest, (null as unknown) as Context, (null as unknown) as Callback);

        expect(result).toEqual({
            type: 3,
            data: {
                tts: false,
                content: "beep boop",
                embeds: [],
                allowed_mentions: []
            }
        });
    });

    test('Test Handler - Ping', async () => {
        mockGetSecretValue.mockReturnValueOnce({
            SecretString: JSON.stringify({
                appId: 'appId',
                publicKey: 'publicKey',
                clientId: 'clientId'
            })
        });
        mockVerify.mockReturnValueOnce(true);
        const result = await DiscordBot.handler({
            timestamp: '',
            signature: '',
            jsonBody: {
                type: 1
            }
        }, (null as unknown) as Context, (null as unknown) as Callback);

        expect(result).toEqual({
            type: 1
        });
    });

    test('Test Handler - Error', async () => {
        mockGetSecretValue.mockReturnValueOnce({
            SecretString: JSON.stringify({
                appId: 'appId',
                publicKey: 'publicKey',
                clientId: 'clientId'
            })
        });
        mockVerify.mockReturnValueOnce(false);
        expect(async() => {
            await DiscordBot.handler({
                timestamp: '',
                signature: '',
                jsonBody: {}
            }, (null as unknown) as Context, (null as unknown) as Callback);
        }).rejects.toThrow(Error);
    });
});