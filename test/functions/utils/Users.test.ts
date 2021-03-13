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
    
    test('Verify Authorization - Success', async () => {
        mockQuery.promise.mockResolvedValueOnce({
            Items: [
                {
                    "oculusHandle": {
                        "S": "Test"
                    },
                    "discordMemberId": {
                        "S": "1111"
                    },
                    "startTrack": {
                        "S": "normal"
                    }
                }
            ],
            Count: 1
        });
        expect(await Users.isUserAuthorized({
            deaf: false,
            roles: [],
            user: {
                discriminator: '5',
                id: 1111,
                username: 'test'
            }
        })).toBe(true);
        expect(mockDynamoDB.query().promise).toBeCalledTimes(1);
    });

    test('Verify Authorization - Wrong Authorization Failure', async () => {
        mockQuery.promise.mockResolvedValueOnce({
            Items: [
                {
                    "oculusHandle": {
                        "S": "Test"
                    },
                    "discordMemberId": {
                        "S": "1111"
                    },
                    "startTrack": {
                        "S": "none"
                    }
                }
            ],
            Count: 1
        });
        expect(await Users.isUserAuthorized({
            deaf: false,
            roles: [],
            user: {
                discriminator: '5',
                id: 1111,
                username: 'test'
            }
        })).toBe(false);
        expect(mockDynamoDB.query().promise).toBeCalledTimes(1);
    });

    test('Verify Authorization - No Results Failure', async () => {
        mockQuery.promise.mockResolvedValueOnce({
            Items: [],
            Count: 0
        });
        expect(await Users.isUserAuthorized({
            deaf: false,
            roles: [],
            user: {
                discriminator: '5',
                id: 1111,
                username: 'test'
            }
        })).toBe(false);
        expect(mockDynamoDB.query().promise).toBeCalledTimes(1);
    });

    test('Verify Authorization - Undefined Results Failure', async () => {
        mockQuery.promise.mockResolvedValueOnce({
            Items: undefined,
            Count: 1
        });
        expect(await Users.isUserAuthorized({
            deaf: false,
            roles: [],
            user: {
                discriminator: '5',
                id: 1111,
                username: 'test'
            }
        })).toBe(false);
        expect(mockDynamoDB.query().promise).toBeCalledTimes(1);
    });

    test('Verify Authorization - Bad Authorization Type Failure', async () => {
        mockQuery.promise.mockResolvedValueOnce({
            Items: [
                {
                    "oculusHandle": {
                        "S": "Test"
                    },
                    "discordMemberId": {
                        "S": "1111"
                    }
                }
            ],
            Count: 1
        });
        expect(await Users.isUserAuthorized({
            deaf: false,
            roles: [],
            user: {
                discriminator: '5',
                id: 1111,
                username: 'test'
            }
        })).toBe(false);
        expect(mockDynamoDB.query().promise).toBeCalledTimes(1);
    });

    test('Verify Authorization - Bad Item Failure', async () => {
        mockQuery.promise.mockResolvedValueOnce({
            Items: [
                undefined
            ],
            Count: 1
        });
        expect(await Users.isUserAuthorized({
            deaf: false,
            roles: [],
            user: {
                discriminator: '5',
                id: 1111,
                username: 'test'
            }
        })).toBe(false);
        expect(mockDynamoDB.query().promise).toBeCalledTimes(1);
    });

    test('Verify Authorization - Multiple Empty Results Success', async () => {
        mockQuery.promise.mockResolvedValueOnce({
            Items: [],
            Count: 0,
            LastEvaluatedKey: {
                "discordMemberId": "5555"
            }
        }).mockResolvedValueOnce({
            Items: [
                {
                    "oculusHandle": {
                        "S": "Test"
                    },
                    "discordMemberId": {
                        "S": "1111"
                    },
                    "startTrack": {
                        "S": "normal"
                    }
                }
            ],
            Count: 1
        });
        expect(await Users.isUserAuthorized({
            deaf: false,
            roles: [],
            user: {
                discriminator: '5',
                id: 1111,
                username: 'test'
            }
        })).toBe(true);
        expect(mockDynamoDB.query().promise).toBeCalledTimes(2);
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
                "discordMemberId": "1111"
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
                    "discordMemberId": {
                        "S": "1111"
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
                "discordMemberId": "5555"
            }
        }).mockResolvedValueOnce({
            Items: [
                {
                    "oculusHandle": {
                        "S": "Test"
                    },
                    "discordMemberId": {
                        "S": "1111"
                    }
                }
            ],
            Count: 1
        });
        expect(await Users.oculusHandleExists('Test#0001')).toBe(true);
        expect(mockDynamoDB.scan().promise).toBeCalledTimes(2);
    });
    
    test('Verify Discord Member - No Results Success', async() => {
        mockQuery.promise.mockResolvedValueOnce({});
        expect(await Users.discordMemberExists({
            deaf: false,
            roles: [],
            user: {
                discriminator: '5',
                id: 1111,
                username: 'test'
            }
        })).toBe(false);
        expect(mockDynamoDB.query().promise).toBeCalledTimes(1);
    });

    test('Verify Discord Member - Empty Results Success', async() => {
        mockQuery.promise.mockResolvedValueOnce({
            Items: [],
            Count: 0
        });
        expect(await Users.discordMemberExists({
            deaf: false,
            roles: [],
            user: {
                discriminator: '5',
                id: 1111,
                username: 'test'
            }
        })).toBe(false);
        expect(mockDynamoDB.query().promise).toBeCalledTimes(1);
    });

    test('Verify Discord Member - Multiple Empty Results Success', async() => {
        mockQuery.promise.mockResolvedValueOnce({
            Items: [],
            Count: 0,
            LastEvaluatedKey: {
                "discordMemberId": "5555"
            }
        }).mockResolvedValueOnce({
            Items: [],
            Count: 0,
        });
        expect(await Users.discordMemberExists({
            deaf: false,
            roles: [],
            user: {
                discriminator: '5',
                id: 1111,
                username: 'test'
            }
        })).toBe(false);
        expect(mockDynamoDB.query().promise).toBeCalledTimes(2);
    });

    test('Verify Discord Member - Failure', async() => {
        mockQuery.promise.mockResolvedValueOnce({
            Items: [
                {
                    "oculusHandle": {
                        "S": "Test"
                    },
                    "discordMemberId": {
                        "S": "1111"
                    }
                }
            ],
            Count: 1
        });
        expect(await Users.discordMemberExists({
            deaf: false,
            roles: [],
            user: {
                discriminator: '5',
                id: 1111,
                username: 'test'
            }
        })).toBe(true);
        expect(mockDynamoDB.query().promise).toBeCalledTimes(1);
    });

    test('Verify Discord Member - Multiple Empty Results Failure', async() => {
        mockQuery.promise.mockResolvedValueOnce({
            Items: [],
            Count: 0,
            LastEvaluatedKey: {
                "discordMemberId": "5555"
            }
        }).mockResolvedValueOnce({
            Items: [
                {
                    "oculusHandle": {
                        "S": "Test"
                    },
                    "discordMemberId": {
                        "S": "1111"
                    }
                }
            ],
            Count: 1
        });
        expect(await Users.discordMemberExists({
            deaf: false,
            roles: [],
            user: {
                discriminator: '5',
                id: 1111,
                username: 'test'
            }
        })).toBe(true);
        expect(mockDynamoDB.query().promise).toBeCalledTimes(2);
    });
});
