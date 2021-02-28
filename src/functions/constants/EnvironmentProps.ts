/**
 * The name of the table with users in it, as defined by the CDK code.
 */
export const usersTableName = process.env['USERS_TABLE_NAME'] ?? 'usersTable';

export const discordBotEventQueueURL = process.env['DISCORD_BOT_EVENT_QUEUE'] ?? 'uqueueURL';