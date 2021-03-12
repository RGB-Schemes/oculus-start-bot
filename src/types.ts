/**
 * An interface for mapping tracks to their respective
 * roles.
 */
export interface RoleMap {
  [track: string]: string;
}

/**
 * The available secrets for our Discord server.
 */
export interface DiscordSecrets {
  appId: string;
  publicKey: string;
  clientId: string;
  authToken: string;
  serverId: string;
}

/**
 * A Discord member and their properties.
 */
export interface DiscordMember {
  deaf: boolean;
  roles: string[];
  user: DiscordUser;
}

/**
 * The user information for a Discord member.
 */
export interface DiscordUser {
  id: number;
  username: string;
  discriminator: string;
}

/**
 * A server role assigned to a user.
 */
export interface DiscordRole {
  id: string;
  name: string;
}