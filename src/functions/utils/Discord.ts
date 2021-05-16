import axios from 'axios';
import { DiscordEventResponse, DiscordMember, DiscordResponseData, DiscordRole } from 'discord-bot-cdk-construct';
import { getDiscordSecrets } from './DiscordSecrets';

/**
 * Gets the Discord member object of a specific Discord handle.
 * 
 * @param {string} discordHandle The user's Discord handle.
 * @returns {DiscordMember | undefined} Returns the Discord member object.
 */
export async function getDiscordMember(discordHandle: string): Promise<DiscordMember | undefined> {
  const discordSecret = await getDiscordSecrets();
  const authConfig = {
    headers: {
      'Authorization': `Bot ${discordSecret?.authToken}`
    }
  };
  let highestMemberId: number = 0;
  let discordMember: DiscordMember | undefined = undefined;

  try {
    do {
      let url = `https://discord.com/api/v8/guilds/${discordSecret?.serverId}/members?limit=1000&after=${highestMemberId}`;
      highestMemberId = 0;
      discordMember = ((await axios.get(url, authConfig)).data as DiscordMember[]).filter(member => {
        highestMemberId = Math.max(highestMemberId, member.user.id);
        return discordHandle == `${member.user.username}#${member.user.discriminator}`;
      }).pop();
    } while (discordMember == undefined && highestMemberId > 0)
    return discordMember;
  } catch(exception) {
    console.log(`There was an error finding this Discord member: ${exception}`);
    return undefined;
  }
}

export async function sendResponse(response: DiscordResponseData,
  interactionToken: string): Promise<boolean> {
  const discordSecret = await getDiscordSecrets();
  const authConfig = {
    headers: {
      'Authorization': `Bot ${discordSecret?.authToken}`
    }
  };

  try {
    let url = `https://discord.com/api/v8/webhooks/${discordSecret?.clientId}/${interactionToken}`;
    return (await axios.post(url, response, authConfig)).status == 200;
  } catch (exception) {
    console.log(`There was an error posting a response: ${exception}`);
    return false;
  }
}

/**
 * Verifies if a member has a chosen role.
 * 
 * @param {DiscordMember} discordMember The Discord member to verify has the role.
 * @param {string} discordRole The human readable name of the role to verify.
 * @returns {boolean} Returns true if the user has the role, false otherwise.
 */
export async function hasMemberRole(discordMember: DiscordMember, discordRole: string): Promise<boolean> {
  const discordSecret = await getDiscordSecrets();
  const authConfig = {
    headers: {
      'Authorization': `Bot ${discordSecret?.authToken}`
    }
  };
  let discordRoleId: string | undefined = undefined;

  try {
    discordRoleId = (
      (await axios.get(`https://discord.com/api/v8/guilds/${discordSecret?.serverId}/roles`, authConfig))
        .data as DiscordRole[]).filter(role => {
      return role.name == discordRole;
    }).pop()?.id;
  } catch (exception) {
    console.log(`There was an error retrieving the roles from the server: ${exception}`);
    return false;
  }

  return discordRoleId != undefined && discordMember.roles.includes(discordRoleId);
}

/**
 * Assigns a role to a given Discord member. If the member already has the role, then
 * it will skip giving it again and simply return true.
 * 
 * @param {DiscordMember} discordMember The Discord member to assign the role to.
 * @param {string} discordRole The human readable name of the role to assign.
 * @returns {boolean} Returns true if the user now has the role, false otherwise.
 */
export async function setMemberRole(discordMember: DiscordMember, discordRole: string): Promise<boolean> {
  const discordSecret = await getDiscordSecrets();
  const authConfig = {
    headers: {
      'Authorization': `Bot ${discordSecret?.authToken}`
    }
  };
  let discordRoleId: string | undefined = undefined;

  try {
    discordRoleId = (
      (await axios.get(`https://discord.com/api/v8/guilds/${discordSecret?.serverId}/roles`, authConfig))
        .data as DiscordRole[]).filter(role => {
          return role.name == discordRole;
        }).pop()?.id;
  } catch (exception) {
    console.log(`There was an error retrieving the roles from the server: ${exception}`);
    return false;
  }

  if (discordRoleId != undefined && !discordMember.roles.includes(discordRoleId)) {
    try {
      const roleUrl =
        `https://discord.com/api/v8/guilds/${discordSecret?.serverId}/members/${discordMember.user.id}/roles/${discordRoleId}`;
      return (await axios.put(roleUrl, {}, authConfig)).status == 204;
    } catch (exception) {
      console.log(`There was an error adding the role to the user: ${exception}`);
      return false;
    }
  }

  return discordRoleId != undefined && discordMember.roles.includes(discordRoleId);
}
