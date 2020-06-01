import os
import sys
import requests
import dotenv

import discord
from discord.ext import commands

import utils.start_users_db as start_users
from utils.validator import OculusStartValidator

# Start of the actual bot here.
print("Starting bot with DiscordPY version {0}...".format(discord.__version__))

dotenv.load_dotenv()
TOKEN = os.getenv('DISCORD_TOKEN')
ROLE_VALUE = os.getenv('ROLE_VALUE')
bot = commands.Bot(command_prefix='!')

@bot.event
async def on_command_error(ctx, error):
    await ctx.send("There was an error with the command given! {0}".format(error))

@bot.command(name='finishmygameforme')
async def finishmygameforme(ctx):
    await ctx.send("Don't tell me what to do!")

@bot.command(name='status', help='Verifies your Discord username against your Oculus Forum profile.')
async def status(ctx):
    print("Checking verification status of {0}".format(str(ctx.author)))
    user = start_users.get_verified_user(str(ctx.author))

    embed = discord.Embed(title="Oculus Start Status for {0}".format(str(ctx.author)), colour=discord.Colour(0x254f63))
    embed.set_thumbnail(url="https://cdn.discordapp.com/embed/avatars/0.png")

    if user is not None and user['discordHandle'] == str(ctx.author) and user['forumUsername'] is not None:
        addr = "https://forums.oculusvr.com/start/profile/{0}".format(user['forumUsername'])
        startParser = OculusStartValidator(user['forumUsername'])
        startParser.feed(requests.get(addr).text)
        if startParser.forumPicture != None:
            embed.set_thumbnail(url=startParser.forumPicture)
        embed.add_field(name=":white_check_mark:", value="You've been previously verified as a member of Oculus Start {0}! This was done with the Oculus username [{1}]({2}).".format(ctx.author, user['forumUsername'], addr))
    else:
        embed.add_field(name=":x:", value="You have not been verified as a member of Oculus Start! Please see https://forums.oculusvr.com/start/discussion/89186/official-oculus-start-discord-access/p1 for instructions.")
    await ctx.send(content="", embed=embed)

@bot.command(name='verify', help='Verifies your Discord username against your Oculus Forum profile.')
async def verify(ctx, forumUsername: str):
    if forumUsername is None:
        await ctx.send(content="Please include a valid Oculus Forum username with this command!")
    else:
        addr = "https://forums.oculusvr.com/start/profile/{0}".format(forumUsername)
        # print("Fetching for {0} at {1}".format(name, addr))
        startParser = OculusStartValidator(forumUsername)
        startParser.feed(requests.get(addr).text)

        embed = discord.Embed(title="Oculus Start Verification for {0}".format(str(ctx.author)), colour=discord.Colour(0x254f63), url=addr)
        if startParser.forumPicture != None:
            embed.set_thumbnail(url=startParser.forumPicture)
        else:
            embed.set_thumbnail(url="https://cdn.discordapp.com/embed/avatars/0.png")

        user = start_users.get_verified_user(str(ctx.author))

        if user is None:
            if startParser.exists and startParser.isOculusStartMember:
                if str(startParser.discordUsername) == str(ctx.author):
                    role = discord.utils.get(ctx.guild.roles, name=ROLE_VALUE)
                    await ctx.message.author.add_roles(role)
                    start_users.add_verified_user(str(ctx.author), forumUsername)
                    embed.add_field(name=":white_check_mark:", value="Confirmed that [{0}]({2}) is a member of Oculus Start! Assigning the role of {1}! If this does not work, please reach out to the moderators.".format(startParser.discordUsername, ROLE_VALUE, addr))
                else:
                    if startParser.discordUsername is None and startParser.invalidDiscordUsername is not None:
                        embed.add_field(name=":x:", value="I found a comment with the Discord username {0} which is invalid! Please comment on [your profile]({1}) with the **exact** Discord handle (it is case sensative and will contain numbers at the end). See the below image for how this should look on your profile:".format(startParser.invalidDiscordUsername, addr))
                        embed.set_image(url="https://cdn.discordapp.com/attachments/711883614266064986/712060083478986772/unknown.png")
                        embed.add_field(name="Note", value="There may be caching delays if you have just commented, so please try this command again after a minute or two. Again, Discord names are case sensative, so make sure your capitalization is correct!")
                    elif startParser.discordUsername is None and startParser.invalidDiscordUsername is None:
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
            if user['discordHandle'] == str(ctx.author):
                embed.add_field(name=":white_check_mark:", value="You've already been verified as a member of Oculus Start {0}!".format(user['discordHandle']))
            else:
                embed.add_field(name=":x:", value="[{0}]({2}) has already verified {1} as their Discord username! Please contact a moderator if this is incorrect!".format(user['forumUsername'], user['discordHandle'], addr))
        await ctx.send(content="", embed=embed)

bot.run(TOKEN)
print("Closing bot...")
# existingVerifications.close()
print("Done!")
