import { DynamoDB } from 'aws-sdk';

const mockScan = {
    promise: jest.fn()
}
const mockQuery = {
    promise: jest.fn()
}
const mockDynamoDB = {
    scan: jest.fn(() => mockScan),
    query: jest.fn(() => mockQuery)
};

jest.mock('aws-sdk', () => {
    return {
        DynamoDB: jest.fn(() => mockDynamoDB),
    };
});

// Import our code after mocking the DynamoDB calls.
import * as Users from '../../../src/functions/utils/Users';

describe('Test Users Utils', () => {
    let mockDynamoDB: DynamoDB;

    beforeAll(() => {
        mockDynamoDB = new DynamoDB();
    });

    afterEach(() => {
        mockScan.promise.mockReset();
        mockQuery.promise.mockReset();
    });
    
    test('Verify Oculus Handle - No Results Success', async() => {
        mockScan.promise.mockResolvedValueOnce({});
        expect(await Users.oculusHandleExists('Test')).toBe(false);
        expect(mockDynamoDB.scan().promise).toBeCalledTimes(1);
    });

    test('Verify Oculus Handle - Empty Results Success', async() => {
        mockScan.promise.mockResolvedValueOnce({
            Items: [],
            Count: 0
        });
        expect(await Users.oculusHandleExists('Test')).toBe(false);
        expect(mockDynamoDB.scan().promise).toBeCalledTimes(1);
    });

    test('Verify Oculus Handle - Multiple Empty Results Success', async() => {
        mockScan.promise.mockResolvedValueOnce({
            Items: [],
            Count: 0,
            LastEvaluatedKey: {
                "discordHandle": "User#0001"
            }
        }).mockResolvedValueOnce({
            Items: [],
            Count: 0,
        });
        expect(await Users.oculusHandleExists('Test')).toBe(false);
        expect(mockDynamoDB.scan().promise).toBeCalledTimes(2);
    });

    test('Verify Oculus Handle - Failure', async() => {
        mockScan.promise.mockResolvedValueOnce({
            Items: [
                {
                    "oculusHandle": {
                        "S": "Test"
                    },
                    "discordHandle": {
                        "S": "Test#0001"
                    }
                }
            ],
            Count: 1
        });
        expect(await Users.oculusHandleExists('Test')).toBe(true);
        expect(mockDynamoDB.scan().promise).toBeCalledTimes(1);
    });

    test('Verify Oculus Handle - Multiple Empty Results Failure', async() => {
        mockScan.promise.mockResolvedValueOnce({
            Items: [],
            Count: 0,
            LastEvaluatedKey: {
                "discordHandle": "User#0001"
            }
        }).mockResolvedValueOnce({
            Items: [
                {
                    "oculusHandle": {
                        "S": "Test"
                    },
                    "discordHandle": {
                        "S": "Test#0001"
                    }
                }
            ],
            Count: 1
        });
        expect(await Users.oculusHandleExists('Test#0001')).toBe(true);
        expect(mockDynamoDB.scan().promise).toBeCalledTimes(2);
    });
    
    test('Verify Discord Handle - No Results Success', async() => {
        mockQuery.promise.mockResolvedValueOnce({});
        expect(await Users.discordHandleExists('Test#0001')).toBe(false);
        expect(mockDynamoDB.query().promise).toBeCalledTimes(1);
    });

    test('Verify Discord Handle - Empty Results Success', async() => {
        mockQuery.promise.mockResolvedValueOnce({
            Items: [],
            Count: 0
        });
        expect(await Users.discordHandleExists('Test#0001')).toBe(false);
        expect(mockDynamoDB.query().promise).toBeCalledTimes(1);
    });

    test('Verify Discord Handle - Multiple Empty Results Success', async() => {
        mockQuery.promise.mockResolvedValueOnce({
            Items: [],
            Count: 0,
            LastEvaluatedKey: {
                "discordHandle": "User#0001"
            }
        }).mockResolvedValueOnce({
            Items: [],
            Count: 0,
        });
        expect(await Users.discordHandleExists('Test#0001')).toBe(false);
        expect(mockDynamoDB.query().promise).toBeCalledTimes(2);
    });

    test('Verify Discord Handle - Failure', async() => {
        mockQuery.promise.mockResolvedValueOnce({
            Items: [
                {
                    "oculusHandle": {
                        "S": "Test"
                    },
                    "discordHandle": {
                        "S": "Test#0001"
                    }
                }
            ],
            Count: 1
        });
        expect(await Users.discordHandleExists('Test#0001')).toBe(true);
        expect(mockDynamoDB.query().promise).toBeCalledTimes(1);
    });

    test('Verify Discord Handle - Multiple Empty Results Failure', async() => {
        mockQuery.promise.mockResolvedValueOnce({
            Items: [],
            Count: 0,
            LastEvaluatedKey: {
                "discordHandle": "User#0001"
            }
        }).mockResolvedValueOnce({
            Items: [
                {
                    "oculusHandle": {
                        "S": "Test"
                    },
                    "discordHandle": {
                        "S": "Test#0001"
                    }
                }
            ],
            Count: 1
        });
        expect(await Users.discordHandleExists('Test#0001')).toBe(true);
        expect(mockDynamoDB.query().promise).toBeCalledTimes(2);
    });
});
