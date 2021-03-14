import { DiscordMember, DiscordRole} from '../../../src/types';

const mockDiscordSecrets = jest.fn();

jest.mock('../../../src/functions/utils/DiscordSecrets', () => {
  return {
    getDiscordSecrets: mockDiscordSecrets
  }
});

jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

import * as Discord from '../../../src/functions/utils/Discord';

describe('Test Discord APIs', () => {
  const member = {
    deaf: false,
    roles: [],
    user: {
      discriminator: '0005',
      id: 5,
      username: 'test'
    }
  };

  afterEach(() => {
    mockDiscordSecrets.mockReset();
    mockedAxios.get.mockReset();
    mockedAxios.put.mockReset();
  });

  test('Test getDiscordMember - Success', async () => {
    mockDiscordSecrets.mockReturnValue(Promise.resolve({
      serverId: 'serverId',
      authToken: 'authToken'
    }));
    let memberData: DiscordMember[] = [];
    for (var i = 1;i <= 2000;i += 1) {
      const id = i;
      const discriminator = `0000${id}`.slice(-4);
      memberData.push({
        deaf: false,
        roles: [],
        user: {
          discriminator: discriminator,
          id: id,
          username: 'test'
        }
      })
    }
    mockedAxios.get.mockReturnValueOnce(Promise.resolve({
      data: memberData.slice(0, 1000)
    })).mockReturnValueOnce(Promise.resolve({
      data: memberData.slice(1000, 2000)
    }));
    expect(await Discord.getDiscordMember('test#1555')).toEqual({
      deaf: false,
      roles: [],
      user: {
        discriminator: '1555',
        id: 1555,
        username: 'test'
      }
    });
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  test('Test getDiscordMember - Custom Discord Key', async () => {
    mockDiscordSecrets.mockReturnValueOnce(Promise.resolve(undefined));
    mockedAxios.get.mockReturnValueOnce(Promise.resolve({
      data: [
        member,
        {
          deaf: false,
          roles: [],
          user: {
            discriminator: '0007',
            id: 7,
            username: 'test'
          }
        } as DiscordMember
      ]
    }));
    expect(await Discord.getDiscordMember('test#0005')).toEqual(member);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  test('Test getDiscordMember - Get Exception', async () => {
    mockDiscordSecrets.mockReturnValue(Promise.resolve({
      serverId: 'serverId',
      authToken: 'authToken'
    }));
    mockedAxios.get.mockImplementationOnce(() => {
      throw new Error('Handle errors');
    });
    expect(await Discord.getDiscordMember('test#0005')).toEqual(undefined);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  test('Test setMemberRole - Success', async () => {
    mockDiscordSecrets.mockReturnValue(Promise.resolve({
      serverId: 'serverId',
      authToken: 'authToken'
    }));
    mockedAxios.get.mockReturnValueOnce(Promise.resolve({
      data: [
        {
          id: '5',
          name: 'testRole'
        } as DiscordRole
      ]
    }));
    mockedAxios.put.mockReturnValueOnce(Promise.resolve({
      status: 204
    }));
    expect(await Discord.setMemberRole({
      deaf: false,
      roles: [],
      user: {
        discriminator: '1',
        id: 1,
        username: 'test'
      }
    }, 'testRole')).toEqual(true);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.put).toHaveBeenCalledTimes(1);
  });

  test('Test setMemberRole - Already Exists Success', async () => {
    mockedAxios.get.mockReturnValueOnce(Promise.resolve({
      data: [
        {
          id: '5',
          name: 'testRole'
        } as DiscordRole
      ]
    }));
    mockedAxios.put.mockReturnValueOnce(Promise.resolve({
      status: 204
    }));
    expect(await Discord.setMemberRole({
      deaf: false,
      roles: ['5'],
      user: {
        discriminator: '1',
        id: 1,
        username: 'test'
      }
    }, 'testRole')).toEqual(true);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.put).toHaveBeenCalledTimes(0);
  });

  test('Test setMemberRole - Custom Discord Key', async () => {
    mockDiscordSecrets.mockReturnValueOnce(Promise.resolve(undefined));
    mockedAxios.get.mockReturnValueOnce(Promise.resolve({
      data: [
        {
          id: '5',
          name: 'testRole'
        } as DiscordRole
      ]
    }));
    mockedAxios.put.mockReturnValueOnce(Promise.resolve({
      status: 204
    }));
    expect(await Discord.setMemberRole({
      deaf: false,
      roles: [],
      user: {
        discriminator: '1',
        id: 1,
        username: 'test'
      }
    }, 'testRole')).toEqual(true);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.put).toHaveBeenCalledTimes(1);
  });

  test('Test setMemberRole - Can\'t get roles', async () => {
    mockedAxios.get.mockImplementationOnce(() => {
      throw new Error('Handle errors');
    });
    expect(await Discord.setMemberRole({
      deaf: false,
      roles: [],
      user: {
        discriminator: '1',
        id: 1,
        username: 'test'
      }
    }, 'testRole')).toEqual(false);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.put).toHaveBeenCalledTimes(0);
  });

  test('Test setMemberRole - Can\'t set user role', async () => {
    mockedAxios.get.mockReturnValueOnce(Promise.resolve({
      data: [
        {
          id: '5',
          name: 'testRole'
        } as DiscordRole
      ]
    }));
    mockedAxios.put.mockImplementationOnce(() => {
      throw new Error('Handle errors');
    });
    expect(await Discord.setMemberRole({
      deaf: false,
      roles: [],
      user: {
        discriminator: '1',
        id: 1,
        username: 'test'
      }
    }, 'testRole')).toEqual(false);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.put).toHaveBeenCalledTimes(1);
  });

  test('Test setMemberRole - No Valid Role', async () => {
    mockedAxios.get.mockReturnValueOnce(Promise.resolve({
      data: [
      ]
    }));
    mockedAxios.put.mockReturnValueOnce(Promise.resolve({
      status: 204
    }));
    expect(await Discord.setMemberRole({
      deaf: false,
      roles: [],
      user: {
        discriminator: '1',
        id: 1,
        username: 'test'
      }
    }, 'testRole')).toEqual(false);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.put).toHaveBeenCalledTimes(0);
  });

  test('Test hasMemberRole - Success', async () => {
    mockDiscordSecrets.mockReturnValue(Promise.resolve({
      serverId: 'serverId',
      authToken: 'authToken'
    }));
    mockedAxios.get.mockReturnValueOnce(Promise.resolve({
      data: [
        {
          id: '5',
          name: 'testRole'
        } as DiscordRole
      ]
    }));
    expect(await Discord.hasMemberRole({
      deaf: false,
      roles: ['5'],
      user: {
        discriminator: '1',
        id: 1,
        username: 'test'
      }
    }, 'testRole')).toEqual(true);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  test('Test hasMemberRole - Custom Discord Key', async () => {
    mockDiscordSecrets.mockReturnValueOnce(Promise.resolve(undefined));
    mockedAxios.get.mockReturnValueOnce(Promise.resolve({
      data: [
        {
          id: '5',
          name: 'testRole'
        } as DiscordRole
      ]
    }));
    expect(await Discord.hasMemberRole({
      deaf: false,
      roles: ['5'],
      user: {
        discriminator: '1',
        id: 1,
        username: 'test'
      }
    }, 'testRole')).toEqual(true);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  test('Test hasMemberRole - No Role Failure', async () => {
    mockDiscordSecrets.mockReturnValue(Promise.resolve({
      serverId: 'serverId',
      authToken: 'authToken'
    }));
    mockedAxios.get.mockReturnValueOnce(Promise.resolve({
      data: [
      ]
    }));
    expect(await Discord.hasMemberRole({
      deaf: false,
      roles: ['5'],
      user: {
        discriminator: '1',
        id: 1,
        username: 'test'
      }
    }, 'testRole')).toEqual(false);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  test('Test hasMemberRole - Success', async () => {
    mockDiscordSecrets.mockReturnValue(Promise.resolve({
      serverId: 'serverId',
      authToken: 'authToken'
    }));
    mockedAxios.get.mockImplementationOnce(() => {
      throw new Error('Handle errors');
    });
    expect(await Discord.hasMemberRole({
      deaf: false,
      roles: ['5'],
      user: {
        discriminator: '1',
        id: 1,
        username: 'test'
      }
    }, 'testRole')).toEqual(false);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });
});