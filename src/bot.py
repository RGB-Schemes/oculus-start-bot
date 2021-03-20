import os
import sys
import requests
import dotenv

import discord
from discord.ext import commands

import utils.secrets as secrets
import utils.start_users_db as start_users
import utils.events_db as events
import utils.hardware as hardware_utils
from utils.validator import OculusStartValidator

# Start of the actual bot here.
print("Starting bot with DiscordPY version {0}...".format(discord.__version__))

dotenv.load_dotenv()
TOKEN = os.getenv('DISCORD_TOKEN', secrets.get_secret('oculus-start-discord-key'))
BOT_ROLE_VALUE = os.getenv('BOT_ROLE_VALUE', 'Bots')
ADMIN_ROLE_VALUE = os.getenv('ADMIN_ROLE_VALUE', 'Admin')
VERIFIED_ROLE_VALUE = os.getenv('VERIFIED_ROLE_VALUE', 'Start Member')
UNVERIFIED_ROLE_VALUE = os.getenv('UNVERIFIED_ROLE_VALUE', 'Unverified')
OCULUS_STAFF_ROLE_VALUE = os.getenv('OCULUS_STAFF_ROLE_VALUE', 'Official Oculus')
bot = commands.Bot(command_prefix='!')

def get_user_profile_img(discordHandle):
    user = start_users.get_verified_user(discordHandle)
    if user is not None:
        addr = "https://forums.oculusvr.com/start/profile/{0}".format(user['forumUsername'])
        startParser = OculusStartValidator(user['forumUsername'])
        if startParser.forumPicture != None:
            return startParser.forumPicture
    return 'https://cdn.discordapp.com/embed/avatars/0.png'

def get_project_embed(ctx, userInfo, projectIndex):
    userImg = get_user_profile_img(userInfo['discordHandle'])
    # if userInfo['forumUsername'] == 'Oculus Start Bot':
    #     userImg = ctx.author.avatar_url
    if len(userInfo['projects']) - 1 < projectIndex:
        return None

    projectInfo = userInfo['projects'][projectIndex]
    print(projectInfo)

    embed = discord.Embed(title=projectInfo['projectName'], description=projectInfo['projectDescription'], colour=discord.Colour(0x254f63))
    embed.set_author(name=userInfo['discordHandle'],icon_url=userImg)

    if 'projectLogo' in projectInfo and projectInfo['projectLogo']:
        embed.set_thumbnail(url=projectInfo['projectLogo'])
    if 'projectDevices' in projectInfo and projectInfo['projectDevices']:
        supported_hw = ', '.join(list(map(lambda x: hardware_utils.get_hardware(x), projectInfo['projectDevices'])))
        embed.add_field(name="Supported Devices", value=supported_hw)
    if 'projectLink' in projectInfo and projectInfo['projectLink']:
        embed.add_field(name="Project Link", value=projectInfo['projectLink'])
    if 'projectTrailer' in projectInfo and projectInfo['projectTrailer']:
        embed.add_field(name="Video Trailer", value=projectInfo['projectTrailer'])

    return embed

@bot.event
async def on_command_error(ctx, error):
    await ctx.send("There was an error with the command given! {0}".format(error))

@bot.event
async def on_member_join(member):
    # Add the unverified role when a new user joins.
    role = discord.utils.get(member.guild.roles, name=UNVERIFIED_ROLE_VALUE)
    await member.add_roles(role)

@bot.command(name='finishmygameforme', help='Asks the bot to help finish your game for you.')
async def finishmygameforme(ctx):
    await ctx.send("Don't tell me what to do!")

@bot.command(name='verify', help='Verifies your Discord username against your Oculus Forum profile.')
async def verify(ctx, forumUsername: str):
    await ctx.send(content="The bot is currently undergoing some updates as Oculus changes their forums. Please see the new verification instructions for how to verify your account.")

@bot.command(name='stats', help='Show stats for the server!\n\nRequires the {0} role!'.format(ADMIN_ROLE_VALUE))
@commands.has_role(ADMIN_ROLE_VALUE)
async def stats(ctx):
    unverified_count = 0
    verified_count = 0
    oculus_staff_count = 0
    bot_count = 0
    await ctx.send('Starting to unverify users with only the everyone role...')
    for member in ctx.guild.members:
        if any(x.name == UNVERIFIED_ROLE_VALUE for x in member.roles):
            unverified_count += 1
        elif any(x.name == VERIFIED_ROLE_VALUE for x in member.roles):
            verified_count += 1
        elif any(x.name == OCULUS_STAFF_ROLE_VALUE for x in member.roles):
            oculus_staff_count += 1
        elif any(x.name == BOT_ROLE_VALUE for x in member.roles):
            bot_count += 1
        elif len(member.roles) == 1 and member.roles[0].name == '@everyone':
            # Add the unverified role.
            role = discord.utils.get(ctx.guild.roles, name=UNVERIFIED_ROLE_VALUE)
            await member.add_roles(role)
            unverified_count += 1
    await ctx.send('Done updating unverified users!\nWe have {0} bots, {1} unverified users, {2} verified users, and {3} Oculus Staff.'.format(bot_count, unverified_count, verified_count, oculus_staff_count))

@bot.command(name='dm', help='Sends a private message to all users with the specified role! The input requires a role and a message (between ").\n\nExample usage: !dm @Role "Hello world".\n\nRequires the {0} role!'.format(ADMIN_ROLE_VALUE))
@commands.has_role(ADMIN_ROLE_VALUE)
async def dm(ctx, role: discord.Role, message: str):
    could_not_message = []
    await ctx.send('Starting to DM all users with the role {0} with the message ```{1}```*Note this may take some time if there are a lot of users with the specified role.*'.format(str(role), message))
    for member in ctx.guild.members:
        if role in member.roles:
            if hasattr(member, 'dm_channel') and member.dm_channel is None and hasattr(member, 'create_dm'):
                await member.create_dm()

            if hasattr(member, 'dm_channel') and member.dm_channel is not None:
                await member.dm_channel.send(message)
            else:
                could_not_message.append('**{0}**'.format(str(member.display_name)))
    if len(could_not_message) > 0:
        await ctx.send('Could not message the following people: {0}'.format(', '.join(could_not_message)))
    else:
        await ctx.send('Succesfully sent your message to all users!')

bot.run(TOKEN)
print("Closing bot...")
# existingVerifications.close()
print("Done!")
