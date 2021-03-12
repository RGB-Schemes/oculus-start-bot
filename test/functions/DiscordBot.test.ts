import { Context, Callback } from 'aws-lambda';

const mockPutItem = {
    promise: jest.fn()
}
const mockDynamoDB = {
    putItem: jest.fn(() => mockPutItem)
};

const mockIsUserAuthorized = jest.fn().mockReturnValue(false);
const mockOculusHandleExists = jest.fn().mockReturnValue(false);
const mockDiscordHandleExists = jest.fn().mockReturnValue(false);

jest.mock('../../src/functions/utils/Users', () => {
    return {
        usersTable: mockDynamoDB,
        isUserAuthorized: mockIsUserAuthorized,
        oculusHandleExists: mockOculusHandleExists,
        discordHandleExists: mockDiscordHandleExists
    };
});

const mockDiscordSecrets = jest.fn().mockReturnValue(Promise.resolve(undefined));

jest.mock('../../src/functions/utils/DiscordSecrets', () => {
    return {
        getDiscordSecrets: mockDiscordSecrets
    }
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
        mockDiscordSecrets.mockReset();
        mockVerify.mockReset();
        mockIsUserAuthorized.mockReset();
    });

    test('Test Handler - Special Success', async () => {
        mockDiscordSecrets.mockReturnValueOnce(Promise.resolve({
            appId: 'appId',
            publicKey: 'publicKey',
            clientId: 'clientId',
            authToken: 'authToken'
        }));
        mockVerify.mockReturnValueOnce(true);
        const result = await DiscordBot.handler({
            timestamp: '',
            signature: '',
            jsonBody: {
                type: 255,
                version: 1
            }
        }, (null as unknown) as Context, (null as unknown) as Callback);

        expect(result).toEqual({
            type: 3,
            data: {
                tts: false,
                content: "beep boop - I\'m still learning how to respond to that command.",
                embeds: [],
                allowed_mentions: []
            }
        });
    });

    test('Test Handler - Default Command Success', async () => {
        mockDiscordSecrets.mockReturnValueOnce(Promise.resolve({
            appId: 'appId',
            publicKey: 'publicKey',
            clientId: 'clientId',
            authToken: 'authToken'
        }));
        mockVerify.mockReturnValueOnce(true);
        const result = await DiscordBot.handler({
            timestamp: '',
            signature: '',
            jsonBody: {
                type: 2,
                version: 1
            }
        }, (null as unknown) as Context, (null as unknown) as Callback);

        expect(result).toEqual({
            type: 3,
            data: {
                tts: false,
                content: "Sorry, there is no member info with this request.",
                embeds: [],
                allowed_mentions: []
            }
        });
    });

    test('Test Handler (No Event Type) - Success', async () => {
        mockDiscordSecrets.mockReturnValueOnce(Promise.resolve({
            appId: 'appId',
            publicKey: 'publicKey',
            clientId: 'clientId',
            authToken: 'authToken'
        }));
        mockVerify.mockReturnValueOnce(true);
        const result = await DiscordBot.handler(({
            timestamp: '',
            signature: '',
            jsonBody: {
                type: 255,
                version: 1
            }
        } as unknown) as DiscordBot.DiscordEventRequest, (null as unknown) as Context, (null as unknown) as Callback);

        expect(result).toEqual({
            type: 3,
            data: {
                tts: false,
                content: "beep boop - I\'m still learning how to respond to that command.",
                embeds: [],
                allowed_mentions: []
            }
        });
    });

    test('Test Handler - Ping', async () => {
        mockDiscordSecrets.mockReturnValueOnce(Promise.resolve({
            appId: 'appId',
            publicKey: 'publicKey',
            clientId: 'clientId',
            authToken: 'authToken'
        }));
        mockVerify.mockReturnValueOnce(true);
        const result = await DiscordBot.handler({
            timestamp: '',
            signature: '',
            jsonBody: {
                type: 1,
                version: 1
            }
        }, (null as unknown) as Context, (null as unknown) as Callback);

        expect(result).toEqual({
            type: 1
        });
    });

    test('Test Handler - Error', async () => {
        mockDiscordSecrets.mockReturnValueOnce(Promise.resolve({
            appId: 'appId',
            publicKey: 'publicKey',
            clientId: 'clientId',
            authToken: 'authToken'
        }));
        mockVerify.mockReturnValueOnce(false);
        expect(async () => {
            await DiscordBot.handler({
                timestamp: '',
                signature: '',
                jsonBody: {
                    type: 255,
                    version: 1
                }
            }, (null as unknown) as Context, (null as unknown) as Callback);
        }).rejects.toThrow(Error);
    });

    test('Test Verify - Success', async () => {
        mockDiscordSecrets.mockReturnValueOnce(Promise.resolve({
            appId: 'appId',
            publicKey: 'publicKey',
            clientId: 'clientId',
            authToken: 'authToken'
        }));
        mockVerify.mockReturnValueOnce(true);
        const result = await DiscordBot.verifyEvent({
            timestamp: '',
            signature: '',
            jsonBody: {
                type: 255,
                version: 1
            }
        });

        expect(mockDiscordSecrets).toBeCalledTimes(1);
        expect(mockVerify).toBeCalledTimes(1);
        expect(result).toEqual(true);
    });

    test('Test Verify - Fail', async () => {
        mockDiscordSecrets.mockReturnValueOnce(Promise.resolve({
            appId: 'appId',
            publicKey: 'publicKey',
            clientId: 'clientId',
            authToken: 'authToken'
        }));
        mockVerify.mockReturnValueOnce(false);
        const result = await DiscordBot.verifyEvent({
            timestamp: '',
            signature: '',
            jsonBody: {
                type: 255,
                version: 1
            }
        });

        expect(mockDiscordSecrets).toBeCalledTimes(1);
        expect(mockVerify).toBeCalledTimes(1);
        expect(result).toEqual(false);
    });

    test('Test Verify - No Secret Key', async () => {
        mockDiscordSecrets.mockReturnValueOnce(undefined);
        mockVerify.mockReturnValueOnce(false);

        const result = await DiscordBot.verifyEvent({
            timestamp: '',
            signature: '',
            jsonBody: {
                type: 255,
                version: 1
            }
        });

        expect(mockDiscordSecrets).toBeCalledTimes(1);
        expect(mockVerify).toBeCalledTimes(1);
        expect(result).toEqual(false);
    });

    test('Test Verify - nacl Exception', async () => {
        mockDiscordSecrets.mockReturnValueOnce(Promise.resolve({
            appId: 'appId',
            publicKey: 'publicKey',
            clientId: 'clientId',
            authToken: 'authToken'
        }));
        mockVerify.mockImplementationOnce(() => {
            throw new Error('Handle errors');
        })

        const result = await DiscordBot.verifyEvent({
            timestamp: '',
            signature: '',
            jsonBody: {
                type: 255,
                version: 1
            }
        });

        expect(mockDiscordSecrets).toBeCalledTimes(1);
        expect(mockVerify).toBeCalledTimes(1);
        expect(result).toEqual(false);
    });

    test('Test Command - No Member Failure', async () => {
        const result = await DiscordBot.handleCommand({
            timestamp: '',
            signature: '',
            jsonBody: {
                data: {
                    name: 'hello-world',
                    id: '0'
                },
                member: undefined,
                type: 2,
                version: 1
            }
        });

        expect(result).toEqual({
            type: 3,
            data: {
                tts: false,
                content: `Sorry, there is no member info with this request.`,
                embeds: [],
                allowed_mentions: [],
            },
        });
        expect(mockIsUserAuthorized).toBeCalledTimes(0);
    });

    test('Test Command - Invalid Command Failure', async () => {
        const result = await DiscordBot.handleCommand({
            timestamp: '',
            signature: '',
            jsonBody: {
                data: {
                    name: 'invalid-command',
                    id: '0'
                },
                member: {
                    roles: [],
                    deaf: false,
                    user: {
                        username: 'Test',
                        discriminator: '0001'
                    }
                },
                type: 2,
                version: 1
            }
        });

        expect(result).toEqual({
            type: 3,
            data: {
                tts: false,
                content: 'Hey, that\'s a new command!',
                embeds: [],
                allowed_mentions: [],
            },
        });
        expect(mockIsUserAuthorized).toBeCalledTimes(0);
    });

    test('Test Command - No JSON Body Data Failure', async () => {
        const result = await DiscordBot.handleCommand({
            timestamp: '',
            signature: '',
            jsonBody: {
                data: undefined,
                member: {
                    roles: [],
                    deaf: false,
                    user: {
                        username: 'Test',
                        discriminator: '0001'
                    }
                },
                type: 2,
                version: 1
            }
        });

        expect(result).toEqual({
            type: 3,
            data: {
                tts: false,
                content: 'Hey, that\'s a new command!',
                embeds: [],
                allowed_mentions: [],
            },
        });
        expect(mockIsUserAuthorized).toBeCalledTimes(0);
    });

    test('Test Command - hello-world - Success', async () => {
        mockIsUserAuthorized.mockReturnValueOnce(true);
        const result = await DiscordBot.handleCommand({
            timestamp: '',
            signature: '',
            jsonBody: {
                data: {
                    name: 'hello-world',
                    id: '0'
                },
                member: {
                    roles: [],
                    deaf: false,
                    user: {
                        username: 'Test',
                        discriminator: '0001'
                    }
                },
                type: 2,
                version: 1
            }
        });

        expect(result).toEqual({
            type: 3,
            data: {
                tts: false,
                content: `Hello Test!`,
                embeds: [],
                allowed_mentions: [],
            },
        });
        expect(mockIsUserAuthorized).toBeCalledTimes(1);
    });

    test('Test Command - hello-world - Failure', async () => {
        mockIsUserAuthorized.mockReturnValueOnce(false);
        const result = await DiscordBot.handleCommand({
            timestamp: '',
            signature: '',
            jsonBody: {
                data: {
                    name: 'hello-world',
                    id: '0'
                },
                member: {
                    roles: [],
                    deaf: false,
                    user: {
                        username: 'Test',
                        discriminator: '0001'
                    }
                },
                type: 2,
                version: 1
            }
        });

        expect(result).toEqual({
            type: 3,
            data: {
                tts: false,
                content: `You are not authorized for that command Test.`,
                embeds: [],
                allowed_mentions: [],
            },
        });
        expect(mockIsUserAuthorized).toBeCalledTimes(1);
    });
});