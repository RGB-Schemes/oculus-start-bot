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
existingVerifications = SqliteDict('./verified_members.sqlite', autocommit=True)

@bot.command(name='finishmygameforme')
async def finishmygameforme(ctx):
    await ctx.send("Don't tell me what to do!")

@bot.command(name='verify', help='Verifies your Discord username against your Oculus Forum profile.')
async def verify(ctx, forumUsername: str):
    addr = "https://forums.oculusvr.com/start/profile/{0}".format(forumUsername)
    # print("Fetching for {0} at {1}".format(name, addr))
    startParser = OculusStartValidator(forumUsername)
    startParser.feed(requests.get(addr).text)

    embed = discord.Embed(title="Oculus Start Verification for {0}".format(str(ctx.author)), colour=discord.Colour(0x254f63), url=addr)
    if startParser.forumPicture != None:
        embed.set_thumbnail(url=startParser.forumPicture)
    else:
        embed.set_thumbnail(url="https://cdn.discordapp.com/embed/avatars/0.png")

    if forumUsername not in existingVerifications:
        if startParser.exists and startParser.isOculusStartMember:
            if str(startParser.discordUsername) == str(ctx.author):
                role = utils.get(ctx.guild.roles, name=ROLE_VALUE)
                await ctx.message.author.add_roles(role)
                existingVerifications[forumUsername] = str(ctx.author)
                embed.add_field(name=":white_check_mark:", value="Confirmed that [{0}]({2}) is a member of Oculus Start! Assigning the role of {1}! If this does not work, please reach out to the moderators.".format(startParser.discordUsername, ROLE_VALUE, addr))
            else:
                if startParser.discordUsername == None:
                    embed.add_field(name=":x:", value="Couldn't find a comment from {0} with a Discord handle! Please comment on [your profile]({1}) with the **exact** Discord handle (it is case sensative!). See the below image for how this should look on your profile:".format(forumUsername, addr))
                    embed.set_image(url="https://cdn.discordapp.com/attachments/711883614266064986/712060083478986772/unknown.png")
                    embed.add_field(name="Note", value="There may be caching delays if you have just commented, so please try this command again after a minute or two. Again, Discord names are case sensative, so make sure your capitalization is correct!")
                else:
                    embed.add_field(name=":x:", value="Confirmed that [{0}]({3}) is a member of Oculus Start but their Discord username was listed as {2}, not {1}!".format(forumUsername, ctx.author, startParser.discordUsername, addr))
        else:
            if startParser.exists == False:
                embed.add_field(name=":x:", value="{0} is **NOT** a valid Oculus username! Please enter a valid Oculus username as the input parameter! See this image for where to find your Oculus username on your forum profile:".format(forumUsername, addr))
                embed.set_image(url="https://media.discordapp.net/attachments/712041288836579368/712059524756013176/unknown.png")
            else:
                embed.add_field(name=":x:", value="[{0}]({1}) is not a member of Oculus Start according to their forum profile! You'll want to ensure that you have the **Oculus Start Member** role on your profile! This may take time to appear if you are new to Oculus Start, so please be patient.".format(forumUsername, addr))
    else:
        embed.add_field(name=":x:", value="[{0}]({2}) has already verified {1} as their Discord username! Please contact a moderator if this is incorrect!".format(forumUsername, existingVerifications[forumUsername], addr))

    await ctx.send(content="", embed=embed)

bot.run(TOKEN)
print("Closing bot...")
existingVerifications.close()
print("Done!")
