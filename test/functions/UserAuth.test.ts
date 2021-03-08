import { Context, Callback } from 'aws-lambda';

const mockPutItem = {
    promise: jest.fn()
}
const mockDynamoDB = {
    putItem: jest.fn(() => mockPutItem)
};

const mockSendMessage = {
    promise: jest.fn()
}

const mockSQS = {
    sendMessage: jest.fn(() => mockSendMessage)
}

const mockOculusHandleExists = jest.fn().mockReturnValue(false);
const mockDiscordHandleExists = jest.fn().mockReturnValue(false);

jest.mock('../../src/functions/utils/Users', () => {
    return {
        usersTable: mockDynamoDB,
        oculusHandleExists: mockOculusHandleExists,
        discordHandleExists: mockDiscordHandleExists
    };
});

import * as UserAuth from '../../src/functions/UserAuth';

jest.mock('aws-sdk', () => {
    return {
        SQS: jest.fn(() => mockSQS),
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
        mockDiscordHandleExists.mockReset();
    });

    test('Test Handle New User - Success', async() => {
        expect(await UserAuth.handler(inputParams, (null as unknown) as Context, (null as unknown) as Callback)).toStrictEqual({
            statusCode: 200
        });
        expect(mockOculusHandleExists).toHaveBeenCalledTimes(1);
        expect(mockDiscordHandleExists).toHaveBeenCalledTimes(1);
        expect(mockPutItem.promise).toHaveBeenCalledTimes(1);
        expect(mockSendMessage.promise).toHaveBeenCalledTimes(1);
    });

    test('Test Handle New User - Invalid Event Failure', async() => {
        expect(await UserAuth.handler((undefined as unknown) as UserAuth.UserAuthRequest, (null as unknown) as Context, (null as unknown) as Callback)).toStrictEqual({
            statusCode: 409,
            errorMessage: 'Invalid inputs given for the request.'
        });
        expect(mockOculusHandleExists).toHaveBeenCalledTimes(0);
        expect(mockDiscordHandleExists).toHaveBeenCalledTimes(0);
        expect(mockPutItem.promise).toHaveBeenCalledTimes(0);
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
        expect(mockDiscordHandleExists).toHaveBeenCalledTimes(0);
        expect(mockPutItem.promise).toHaveBeenCalledTimes(0);
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
        expect(mockDiscordHandleExists).toHaveBeenCalledTimes(0);
        expect(mockPutItem.promise).toHaveBeenCalledTimes(0);
    });

    test('Test Handle New User - Discord User Already Registered Failure', async() => {
        mockDiscordHandleExists.mockReturnValueOnce(true);
        expect(await UserAuth.handler({
            discordHandle: 'Test#0001',
            oculusHandle: 'Test',
            startTrack: 'Normal'
        }, (null as unknown) as Context, (null as unknown) as Callback)).toStrictEqual({
            statusCode: 409,
            errorMessage: 'This Discord user is already registered!'
        });
        expect(mockOculusHandleExists).toHaveBeenCalledTimes(1);
        expect(mockDiscordHandleExists).toHaveBeenCalledTimes(1);
        expect(mockPutItem.promise).toHaveBeenCalledTimes(0);
    });

    test('Test Handle New User - Invalid Start Track Failure', async() => {
        expect(await UserAuth.handler({
            ...inputParams,
            startTrack: 'invalid'
        }, (null as unknown) as Context, (null as unknown) as Callback)).toStrictEqual({
            statusCode: 409,
            errorMessage: `The Start Track 'invalid' is not valid!`
        });
        expect(mockOculusHandleExists).toHaveBeenCalledTimes(1);
        expect(mockDiscordHandleExists).toHaveBeenCalledTimes(1);
        expect(mockPutItem.promise).toHaveBeenCalledTimes(0);
    });

    test('Test Handle New User - DynamoDB Failure', async() => {
        mockPutItem.promise.mockImplementationOnce(() => {
            throw new Error();
        });
        expect(await UserAuth.handler(inputParams, (null as unknown) as Context, (null as unknown) as Callback)).toStrictEqual({
            statusCode: 500,
            errorMessage: 'There was an adding the new user!'
        });
        expect(mockOculusHandleExists).toHaveBeenCalledTimes(1);
        expect(mockDiscordHandleExists).toHaveBeenCalledTimes(1);
        expect(mockPutItem.promise).toHaveBeenCalledTimes(1);
    });
});