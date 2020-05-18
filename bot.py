import os
import sys
import requests
import discord
from discord import utils
from discord.ext import commands
from dotenv import load_dotenv
from sqlitedict import SqliteDict
from validator import OculusStartValidator

# Start of the actual bot here.
print("Starting bot with DiscordPY version {0}...".format(discord.__version__))

load_dotenv()
TOKEN = os.getenv('DISCORD_TOKEN')
ROLE_VALUE = os.getenv('ROLE_VALUE')
bot = commands.Bot(command_prefix='!')
existingVerifications = SqliteDict('./my_db.sqlite', autocommit=True)

@bot.command(name='verify', help='Verifies your Discord username against your Oculus Forum profile.')
async def verify(ctx, forumUsername: str):
    addr = "https://forums.oculusvr.com/start/profile/{0}".format(forumUsername)
    # print("Fetching for {0} at {1}".format(name, addr))
    startParser = OculusStartValidator(forumUsername)
    startParser.feed(requests.get(addr).text)

    response = ""
    if str(ctx.author) not in existingVerifications:
        if startParser.isOculusStartMember:
            if str(startParser.discordUsername) == str(ctx.author):
                """
                TODO: Uncomment for production.
                role = utils.get(ctx.guild.roles, name=ROLE_VALUE)
                await ctx.message.author.add_roles(role)
                """
                existingVerifications[str(ctx.author)] = startParser.discordUsername
                response = "Confirmed that {0} is a member of Oculus Start! Assigning the role of {1}! If this does not work, please reach out to the moderators.".format(startParser.discordUsername, ROLE_VALUE)
            else:
                response = "Confirmed that {0} is a member of Oculus Start but their Discord username wasn't {1}!".format(forumUsername, ctx.author)
        else:
            response = "{0} is NOT a member of Oculus Start!".format(forumUsername)
    else:
        response = "{0} has already verified {1} as their Discord username! Please contact a moderator if this is incorrect!".format(forumUsername, str(ctx.author))
    print(response)
    await ctx.send(response)

bot.run(TOKEN)
print("Closing bot...")
existingVerifications.close()
print("Done!")
