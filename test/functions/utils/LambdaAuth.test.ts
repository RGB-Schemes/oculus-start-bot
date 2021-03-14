import { DynamoDB } from 'aws-sdk';

const mockQuery = {
  promise: jest.fn()
}
const mockDynamoDB = {
  query: jest.fn(() => mockQuery)
};

jest.mock('aws-sdk', () => {
  return {
    DynamoDB: jest.fn(() => mockDynamoDB),
  };
});

// Import our code after mocking the DynamoDB calls.
import * as LambdaAuth from '../../../src/functions/utils/LambdaAuth';

describe('Test Lambda Authorization Utils', () => {
  let mockDynamoDB: DynamoDB;

  beforeAll(() => {
    mockDynamoDB = new DynamoDB();
  });

  afterEach(() => {
    mockQuery.promise.mockReset();
  });

  test('Verify Authorization - Success', async () => {
    mockQuery.promise.mockResolvedValueOnce({
      Items: [
        {
          "apiKey": {
            "S": "Test"
          },
          "validationTags": {
            "SS": [
              "1111"
            ]
          }
        }
      ],
      Count: 1
    });
    expect(await LambdaAuth.isAuthorized('Test', '1111')).toBe(true);
    expect(mockDynamoDB.query().promise).toBeCalledTimes(1);
  });

  test('Verify Authorization - Multiple Empty Results Success', async () => {
    mockQuery.promise.mockResolvedValueOnce({
      Items: [],
      Count: 0,
      LastEvaluatedKey: {
        "apiKey": "Test"
      }
    }).mockResolvedValueOnce({
      Items: [
        {
          "apiKey": {
            "S": "Test"
          },
          "validationTags": {
            "SS": [
              "1111"
            ]
          }
        }
      ],
      Count: 1
    });
    expect(await LambdaAuth.isAuthorized('Test', '1111')).toBe(true);
    expect(mockDynamoDB.query().promise).toBeCalledTimes(2);
  });

  test('Verify Authorization - Empty String Set Failure', async () => {
    mockQuery.promise.mockResolvedValueOnce({
      Items: [
        {
          "apiKey": {
            "S": "Test"
          },
          "validationTags": {
            "SS": undefined
          }
        }
      ],
      Count: 1
    });
    expect(await LambdaAuth.isAuthorized('Test', '1111')).toBe(false);
    expect(mockDynamoDB.query().promise).toBeCalledTimes(1);
  });

  test('Verify Authorization - No Validation Tags Failure', async () => {
    mockQuery.promise.mockResolvedValueOnce({
      Items: [
        {
          "apiKey": {
            "S": "Test"
          }
        }
      ],
      Count: 1
    });
    expect(await LambdaAuth.isAuthorized('Test', '1111')).toBe(false);
    expect(mockDynamoDB.query().promise).toBeCalledTimes(1);
  });

  test('Verify Authorization - No Results Failure', async () => {
    mockQuery.promise.mockResolvedValueOnce({
      Items: [],
      Count: 0
    });
    expect(await LambdaAuth.isAuthorized('Test', '1111')).toBe(false);
    expect(mockDynamoDB.query().promise).toBeCalledTimes(1);
  });

  test('Verify Authorization - Undefined Results Failure', async () => {
    mockQuery.promise.mockResolvedValueOnce({
      Items: undefined,
      Count: 1
    });
    expect(await LambdaAuth.isAuthorized('Test', '1111')).toBe(false);
    expect(mockDynamoDB.query().promise).toBeCalledTimes(1);
  });

  test('Verify Authorization - Bad Item Failure', async () => {
    mockQuery.promise.mockResolvedValueOnce({
      Items: [
        undefined
      ],
      Count: 1
    });
    expect(await LambdaAuth.isAuthorized('Test', '1111')).toBe(false);
    expect(mockDynamoDB.query().promise).toBeCalledTimes(1);
  });
});
