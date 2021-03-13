import { Context, Callback } from 'aws-lambda';

const mockPutItem = {
    promise: jest.fn()
}
const mockDynamoDB = {
    putItem: jest.fn(() => mockPutItem)
};

const mockOculusHandleExists = jest.fn().mockReturnValue(false);
const mockDiscordMemberExists = jest.fn().mockReturnValue(false);

jest.mock('../../src/functions/utils/Users', () => {
    return {
        usersTable: mockDynamoDB,
        oculusHandleExists: mockOculusHandleExists,
        discordMemberExists: mockDiscordMemberExists
    };
});

const mockSetMemberRole = jest.fn().mockReturnValue(false);
const mockGetDiscordMember = jest.fn().mockReturnValue(undefined);

jest.mock('../../src/functions/utils/Discord', () => {
    return {
        setMemberRole: mockSetMemberRole,
        getDiscordMember: mockGetDiscordMember
    }
});

import * as UserAuth from '../../src/functions/UserAuth';
import { DiscordMember } from '../../src/types';

jest.mock('aws-sdk', () => {
    return {
        SecretsManager: jest.fn()
    };
});

describe('Test UserAuth', () => {
    const inputParams = {
        discordHandle: 'Test#0001',
        oculusHandle: 'Test',
        startTrack: 'Normal'
    };

    afterEach(() => {
        mockPutItem.promise.mockReset();
        mockOculusHandleExists.mockReset();
        mockDiscordMemberExists.mockReset();
        mockSetMemberRole.mockReset();
        mockGetDiscordMember.mockReset();
    });

    test('Test Handle New User - Success', async() => {
        mockSetMemberRole.mockReturnValueOnce(true);
        mockGetDiscordMember.mockReturnValueOnce({
            deaf: false,
            roles: [],
            user: {
                discriminator: '5',
                id: 5,
                username: 'test'
            }
        } as DiscordMember);
        expect(await UserAuth.handler(inputParams, (null as unknown) as Context, (null as unknown) as Callback)).toStrictEqual({
            statusCode: 200
        });
        expect(mockOculusHandleExists).toHaveBeenCalledTimes(1);
        expect(mockGetDiscordMember).toHaveBeenCalledTimes(1);
        expect(mockDiscordMemberExists).toHaveBeenCalledTimes(1);
        expect(mockPutItem.promise).toHaveBeenCalledTimes(1);
        expect(mockSetMemberRole).toHaveBeenCalledTimes(1);
    });

    test('Test Handle New User - Invalid Event Failure', async() => {
        expect(await UserAuth.handler((undefined as unknown) as UserAuth.UserAuthRequest, (null as unknown) as Context, (null as unknown) as Callback)).toStrictEqual({
            statusCode: 409,
            errorMessage: 'Invalid inputs given for the request.'
        });
        expect(mockOculusHandleExists).toHaveBeenCalledTimes(0);
        expect(mockGetDiscordMember).toHaveBeenCalledTimes(0);
        expect(mockDiscordMemberExists).toHaveBeenCalledTimes(0);
        expect(mockPutItem.promise).toHaveBeenCalledTimes(0);
        expect(mockSetMemberRole).toHaveBeenCalledTimes(0);
    });

    test('Test Handle New User - Oculus User Already Registered Failure', async() => {
        mockOculusHandleExists.mockReturnValueOnce(true);
        expect(await UserAuth.handler({
            discordHandle: 'Test#0001',
            oculusHandle: 'Test',
            startTrack: 'Normal'
        }, (null as unknown) as Context, (null as unknown) as Callback)).toStrictEqual({
            statusCode: 409,
            errorMessage: 'This user has already registered their Discord handle before!'
        });
        expect(mockOculusHandleExists).toHaveBeenCalledTimes(1);
        expect(mockGetDiscordMember).toHaveBeenCalledTimes(0);
        expect(mockDiscordMemberExists).toHaveBeenCalledTimes(0);
        expect(mockPutItem.promise).toHaveBeenCalledTimes(0);
        expect(mockSetMemberRole).toHaveBeenCalledTimes(0);
    });

    test('Test Handle New User - Discord User Invalid Format Failure', async() => {
        expect(await UserAuth.handler({
            ...inputParams,
            discordHandle: 'Test0001'
        }, (null as unknown) as Context, (null as unknown) as Callback)).toStrictEqual({
            statusCode: 409,
            errorMessage: `'Test0001' is not a valid Discord handle!`
        });
        expect(mockOculusHandleExists).toHaveBeenCalledTimes(1);
        expect(mockGetDiscordMember).toHaveBeenCalledTimes(0);
        expect(mockDiscordMemberExists).toHaveBeenCalledTimes(0);
        expect(mockPutItem.promise).toHaveBeenCalledTimes(0);
        expect(mockSetMemberRole).toHaveBeenCalledTimes(0);
    });

    test('Test Handle New User - Discord User Not on Server Failure', async () => {
        mockSetMemberRole.mockReturnValueOnce(true);
        mockGetDiscordMember.mockReturnValueOnce(undefined);
        expect(await UserAuth.handler(inputParams, (null as unknown) as Context, (null as unknown) as Callback)).toStrictEqual({
            statusCode: 409,
            errorMessage: `The Discord member ${inputParams.discordHandle} is not in the server!`
        });
        expect(mockOculusHandleExists).toHaveBeenCalledTimes(1);
        expect(mockGetDiscordMember).toHaveBeenCalledTimes(1);
        expect(mockDiscordMemberExists).toHaveBeenCalledTimes(0);
        expect(mockPutItem.promise).toHaveBeenCalledTimes(0);
        expect(mockSetMemberRole).toHaveBeenCalledTimes(0);
    });

    test('Test Handle New User - Discord User Already Registered Failure', async() => {
        mockDiscordMemberExists.mockReturnValueOnce(true);
        mockGetDiscordMember.mockReturnValueOnce({
            deaf: false,
            roles: [],
            user: {
                discriminator: '5',
                id: 5,
                username: 'test'
            }
        } as DiscordMember);
        expect(await UserAuth.handler({
            discordHandle: 'Test#0001',
            oculusHandle: 'Test',
            startTrack: 'Normal'
        }, (null as unknown) as Context, (null as unknown) as Callback)).toStrictEqual({
            statusCode: 409,
            errorMessage: 'This Discord user is already registered!'
        });
        expect(mockOculusHandleExists).toHaveBeenCalledTimes(1);
        expect(mockGetDiscordMember).toHaveBeenCalledTimes(1);
        expect(mockDiscordMemberExists).toHaveBeenCalledTimes(1);
        expect(mockPutItem.promise).toHaveBeenCalledTimes(0);
        expect(mockSetMemberRole).toHaveBeenCalledTimes(0);
    });

    test('Test Handle New User - Invalid Start Track Failure', async() => {
        mockGetDiscordMember.mockReturnValueOnce({
            deaf: false,
            roles: [],
            user: {
                discriminator: '5',
                id: 5,
                username: 'test'
            }
        } as DiscordMember);
        expect(await UserAuth.handler({
            ...inputParams,
            startTrack: 'invalid'
        }, (null as unknown) as Context, (null as unknown) as Callback)).toStrictEqual({
            statusCode: 409,
            errorMessage: `The Start Track 'invalid' is not valid!`
        });
        expect(mockOculusHandleExists).toHaveBeenCalledTimes(1);
        expect(mockGetDiscordMember).toHaveBeenCalledTimes(1);
        expect(mockDiscordMemberExists).toHaveBeenCalledTimes(1);
        expect(mockPutItem.promise).toHaveBeenCalledTimes(0);
        expect(mockSetMemberRole).toHaveBeenCalledTimes(0);
    });

    test('Test Handle New User - DynamoDB Failure', async() => {
        mockGetDiscordMember.mockReturnValueOnce({
            deaf: false,
            roles: [],
            user: {
                discriminator: '5',
                id: 5,
                username: 'test'
            }
        } as DiscordMember);
        mockPutItem.promise.mockImplementationOnce(() => {
            throw new Error();
        });
        expect(await UserAuth.handler(inputParams, (null as unknown) as Context, (null as unknown) as Callback)).toStrictEqual({
            statusCode: 500,
            errorMessage: 'There was an adding the new user!'
        });
        expect(mockOculusHandleExists).toHaveBeenCalledTimes(1);
        expect(mockGetDiscordMember).toHaveBeenCalledTimes(1);
        expect(mockDiscordMemberExists).toHaveBeenCalledTimes(1);
        expect(mockPutItem.promise).toHaveBeenCalledTimes(1);
        expect(mockSetMemberRole).toHaveBeenCalledTimes(0);
    });

    test('Test Handle New User - Set Discord Role Failure', async () => {
        mockSetMemberRole.mockReturnValueOnce(false);
        mockGetDiscordMember.mockReturnValueOnce({
            deaf: false,
            roles: [],
            user: {
                discriminator: '5',
                id: 5,
                username: 'test'
            }
        } as DiscordMember);
        expect(await UserAuth.handler(inputParams, (null as unknown) as Context, (null as unknown) as Callback)).toStrictEqual({
            statusCode: 500,
            errorMessage: 'There was an error setting the user\'s role!'
        });
        expect(mockOculusHandleExists).toHaveBeenCalledTimes(1);
        expect(mockGetDiscordMember).toHaveBeenCalledTimes(1);
        expect(mockDiscordMemberExists).toHaveBeenCalledTimes(1);
        expect(mockPutItem.promise).toHaveBeenCalledTimes(1);
        expect(mockSetMemberRole).toHaveBeenCalledTimes(1);
    });
});