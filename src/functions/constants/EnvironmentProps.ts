/**
 * The name of the table with authorization of API keys in it.
 */
export const authTableName = process.env['AUTH_TABLE_NAME'] ?? 'authTable';
/**
 * The name of the table with users in it, as defined by the CDK code.
 */
export const usersTableName = process.env['USERS_TABLE_NAME'] ?? 'usersTable';
/**
 * The name of the secret key to retrieve.
 */
export const discordBotAPIKeyName = process.env['DISCORD_BOT_API_KEY_NAME'] ?? 'apiKeyName';
/**
 * The tag to verify permission to the auth API.
 */
export const authAPIKeyTag = process.env['AUTH_API_KEY_TAG'] ?? '';
/**
 * The ARN for the Discord command lambda.
 */
export const commandLambdaARN = process.env['COMMAND_LAMBDA_ARN'] ?? '';
