import re
import os
import sys
import requests
import discord
from discord import utils
from discord.ext import commands
from dotenv import load_dotenv
from html.parser import HTMLParser
from sqlitedict import SqliteDict

class OculusStartValidator(HTMLParser):
    pattern = re.compile("^[a-zA-z]{2,32}#[0-9]{4}$")

    # Used to find if the user is an Oculus Start member.
    inRankSpan = False

    commentAuthorVerified = False
    isInCommentDiv = False
    isInCommentAuthorDiv = False
    isInCommentTextDiv = False

    forumUsername = None
    discordUsername = None
    isOculusStartMember = False

    def __init__(self, forumUsername):
        HTMLParser.__init__(self)
        self.forumUsername = forumUsername

    def handle_starttag(self, tag, attrs):
        if tag == "span":
            for x, y in attrs:
                if x == "class" and y == "Rank":
                    self.inRankSpan = True
                    break
        if tag == "div":
            for x, y in attrs:
                if x == "class":
                    if y == "ItemContent Activity":
                        self.isInCommentDiv = True
                    elif y == "Title":
                        self.isInCommentAuthorDiv = True
                    elif y == "Excerpt userContent":
                        self.isInCommentTextDiv = True
                    break

    def handle_endtag(self, tag):
        if self.inRankSpan and tag == "span":
            self.inRankSpan = False
        if self.isInCommentDiv and tag == "div":
            if self.isInCommentAuthorDiv:
                self.isInCommentAuthorDiv = False
            elif self.isInCommentTextDiv:
                self.isInCommentTextDiv = False
            else:
                self.commentAuthorVerified = False
                self.isInCommentDiv = False

    def handle_data(self, data):
        if self.inRankSpan:
            if data.strip() == "Oculus Start Member":
                self.isOculusStartMember = True
            else:
                self.isOculusStartMember = False
        if self.isInCommentDiv:
            if self.isInCommentAuthorDiv:
                if str(data).lower() == self.forumUsername.lower():
                    self.commentAuthorVerified = True
                else:
                    self.isInCommentAuthorDiv = False
            elif self.isInCommentTextDiv and self.commentAuthorVerified:
                if self.pattern.match(data.strip()):
                    self.discordUsername = data.strip()

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

"""
if len(sys.argv) >= 2:
    for i in range(1, len(sys.argv)):
        name = sys.argv[i]
        addr = "https://forums.oculusvr.com/start/profile/{0}".format(name)
        # print("Fetching for {0} at {1}".format(name, addr))
        startParser = OculusStartValidator()
        startParser.feed(requests.get(addr).text)

        if startParser.isOculusStartMember:
            if startParser.discordUsername is not None:
                print("Confirmed that {0} is a member of Oculus Start!".format(startParser.discordUsername))
            else:
                print("Confirmed that {0} is a member of Oculus Start but couldn't find their Discord username!".format(name))
        else:
            print("{0} is NOT a member of Oculus Start!".format(name))
else:
    print("Please add any users as input parameters.")
"""