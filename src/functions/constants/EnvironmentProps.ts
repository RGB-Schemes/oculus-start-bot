/**
 * The name of the table with users in it, as defined by the CDK code.
 */
export const usersTableName = process.env['USERS_TABLE_NAME'] ?? 'usersTable';
/**
 * The name of the secret key to retrieve.
 */
export const discordBotAPIKeyName = process.env['DISCORD_BOT_API_KEY_NAME'] ?? 'apiKeyName';