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
ROLE_VALUE = os.getenv('ROLE_VALUE', 'Start Member')
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

@bot.command(name='finishmygameforme', help='Asks the bot to help finish your game for you.')
async def finishmygameforme(ctx):
    await ctx.send("Don't tell me what to do!")

@bot.command(name='verify', help='Verifies your Discord username against your Oculus Forum profile.')
async def verify(ctx, forumUsername: str):
    if forumUsername is None:
        await ctx.send(content="Please include a valid Oculus Forum username with this command!")
    else:
        addr = "https://forums.oculusvr.com/start/profile/{0}".format(forumUsername)
        # print("Fetching for {0} at {1}".format(name, addr))
        startParser = OculusStartValidator(forumUsername)

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
                    elif startParser.discordUsername is None and startParser.mismatchCommentAuthor is not None:
                        embed.add_field(name=":x:", value="I was expecting a comment from {0} but it was actually made by {1}! Please comment from the same account as the profile!".format(forumUsername, startParser.mismatchCommentAuthor))
                        embed.set_image(url="https://cdn.discordapp.com/attachments/711883614266064986/712060083478986772/unknown.png")
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

@bot.command(name='status', help='Details the list of information stored ofr you. This will be DM\'d to you for privacy reasons.')
async def status(ctx):
    await ctx.message.delete()

    print("Checking verification status of {0}".format(str(ctx.author)))
    user = start_users.get_verified_user(str(ctx.author))

    embed = discord.Embed(title="Oculus Start Status for {0}".format(str(ctx.author)), colour=discord.Colour(0x254f63))
    embed.set_thumbnail(url=get_user_profile_img(str(ctx.author)))

    if user is not None and user['discordHandle'] == str(ctx.author) and user['forumUsername'] is not None:
        addr = "https://forums.oculusvr.com/start/profile/{0}".format(user['forumUsername'])

        if 'hardware' not in user or len(user['hardware']) < 1:
            hardware = '\nYou have no hardware on your profile.\n'
        else:
            hardware = '\nYou have the following hardware on your profile:\n'
            for hw in user['hardware']:
                hardware += '- {0}\n'.format(hw)
        if 'email' not in user:
            email = '\nYou do not have an email address registered!\n'
        else:
            email = '\nYour email address is registered as {0}\n'.format(user['email'])
        embed.add_field(name=":white_check_mark:", value="You've been previously verified as a member of Oculus Start {0}! This was done with the Oculus username [{1}]({2}).\n{3}{4}".format(ctx.author, user['forumUsername'], addr, email, hardware))
    else:
        embed.add_field(name=":x:", value="You have not been verified as a member of Oculus Start! Please see https://forums.oculusvr.com/start/discussion/89186/official-oculus-start-discord-access/p1 for instructions.")
    
    await ctx.author.create_dm()
    await ctx.author.dm_channel.send(content="", embed=embed)

@bot.command(name='email', help='Attaches your email address to your Discord handle for the bot. Use this for registering for events and such!')
async def email(ctx, email: str):
    await ctx.message.delete()

    embed = discord.Embed(title="Oculus Start Status for {0}".format(str(ctx.author)), colour=discord.Colour(0x254f63))
    embed.set_thumbnail(url=get_user_profile_img(str(ctx.author)))

    if start_users.is_verified(str(ctx.author)):
        if start_users.add_oculus_email(str(ctx.author), email):
            user = start_users.get_verified_user(str(ctx.author))
            if user is not None and user['email'] is not None and user['email'] == email:
                embed.add_field(name=":white_check_mark:", value="Added the email address [{0}]({0}) for user {1}! You can change this at any time, but note that this should be the same as used on your Oculus account to participate in events!".format(email, str(ctx.author)))
            else:
                embed.add_field(name=":x:", value="Failed to add an email address for user {0}!".format(str(ctx.author)))
        else:
            embed.add_field(name=":x:", value="Failed to add an email address for user {0}!".format(str(ctx.author)))
    else:
        embed.add_field(name=":x:", value="You have not been verified as a member of Oculus Start! Please see https://forums.oculusvr.com/start/discussion/89186/official-oculus-start-discord-access/p1 for instructions.")

    await ctx.author.create_dm()
    await ctx.author.dm_channel.send(content="", embed=embed)

@bot.command(name='hardware', help='Manage adding and removing hardware! Use \'add\' to add hardware and \'remove\' to remove hardware with this command. {0}'.format(hardware_utils.get_supported_hardware()))
async def hardware(ctx, action: str, hw: str):
    await ctx.message.delete()

    embed = discord.Embed(title="Oculus Start Status for {0}".format(str(ctx.author)), colour=discord.Colour(0x254f63))
    embed.set_thumbnail(url=get_user_profile_img(str(ctx.author)))

    if start_users.is_verified(str(ctx.author)):
        hardware = hardware_utils.get_hardware(hw)

        if hardware is not None and action.lower() == 'add':
            result, error_msg = start_users.add_hardware(str(ctx.author), hardware)
            if result:
                embed.add_field(name=":white_check_mark:", value="Added \'{0}\' as hardware to your profile!".format(hardware))
        elif hardware is not None and action.lower() == 'remove':
            result, error_msg = start_users.remove_hardware(str(ctx.author), hardware)
            if result:
                embed.add_field(name=":white_check_mark:", value="Removed \'{0}\' as hardware from your profile!".format(hardware))
        elif hardware is None:
            result = False
            error_msg = hardware_utils.get_hw_error_msg(hw)
        else:
            result = False
            error_msg = 'No valid subcommand found! Please specify if you want to add or remove hardware!'

        if not result:
            embed.add_field(name=":x:", value=error_msg)
    else:
        embed.add_field(name=":x:", value="You have not been verified as a member of Oculus Start! Please see https://forums.oculusvr.com/start/discussion/89186/official-oculus-start-discord-access/p1 for instructions.")

    await ctx.author.create_dm()
    await ctx.author.dm_channel.send(content="", embed=embed)

@bot.command(name='project', help='Manage adding and removing projects! Use \'add\' to add projects and \'remove\' to remove projects with this command. When adding a project, please specify a project name, logo, description, trailer, link, and the list of supported devices.\n\nIf you have spaces between words, please encapsulate them in double quotes.\n\nExample usage: !project add \"Test Project\" http://www.example.com/logo.png \"This is where the description goes.\" http://www.example.com/trailer http://www.example.com/project RIFT RIFTS GO\n\nExample usage: !project remove \"Test Project\"')
async def project(ctx, action: str, projectName: str, projectLogo: str=None, projectDescription: str="No description available.", projectTrailer: str=None, projectLink: str=None, *projectHW):
    embed = discord.Embed(title="Projects for {0}".format(str(ctx.author)), colour=discord.Colour(0x254f63))
    embed.set_thumbnail(url=get_user_profile_img(str(ctx.author)))

    if start_users.is_verified(str(ctx.author)):
        if action.lower() == 'add':
            hardwareList = []
            result = False
            error_msg = None
            for hw in projectHW:
                hardware = hardware_utils.get_hardware(hw)
                if hardware is None:
                    result = False
                    error_msg = hardware_utils.get_hw_error_msg(hw)
                    break
                else:
                    result = True
                    hardwareList.append(hw.upper())
            if result:
                result, error_msg = start_users.add_project(str(ctx.author), projectName, projectLogo, projectDescription, projectTrailer, projectLink, hardwareList)
                if result:
                    await ctx.message.delete()
                    embed.add_field(name=":white_check_mark:", value="Added \'{0}\' as a project to your profile!".format(projectName))
            elif error_msg is None:
                error_msg = "No hardware specified for this project! Please select a valid set of hardware to associate with this project!"
        elif action.lower() == 'remove':
            result, error_msg = start_users.remove_project(str(ctx.author), projectName)
            if result:
                await ctx.message.delete()
                embed.add_field(name=":white_check_mark:", value="Removed \'{0}\' as a project from your profile!".format(projectName))
        else:
            result = False
            error_msg = 'No valid subcommand found! Please specify if you want to add or remove hardware!'

        if not result:
            embed.add_field(name=":x:", value=error_msg)
    else:
        embed.add_field(name=":x:", value="You have not been verified as a member of Oculus Start! Please see https://forums.oculusvr.com/start/discussion/89186/official-oculus-start-discord-access/p1 for instructions.")

    await ctx.author.create_dm()
    await ctx.author.dm_channel.send(content="", embed=embed)

@bot.command(name='latest', help='Lists the latest project for another Discord user. Specify an index to get an older project instead.\n\nExample usage: !latest @GEMISIS#0001\n\nExample usage: !latest @GEMISIS#0001 5')
async def latest(ctx, user: discord.User, projectIndex: int=0):
    await ctx.message.delete()

    authorVerified = start_users.is_verified(str(ctx.author))
    userVerified = start_users.is_verified(str(user))

    if authorVerified and userVerified:
        userInfo = start_users.get_verified_user(str(user))
        if 'projects' not in userInfo or len(userInfo['projects']) < 1:
            await ctx.send(content='No projects found for {0}'.format(user))
        else:
            embed = get_project_embed(ctx, userInfo, projectIndex)
            if embed is None:
                await ctx.send(content='{0} only has {1} projects. Please specify an index less than that.'.format(user, len(userInfo['projects'])))
            else:
                await ctx.send(content="", embed=embed)
    elif not userVerified:
        embed = discord.Embed(title="{0} Not Verified".format(str(user)), colour=discord.Colour(0x254f63))
        embed.set_thumbnail(url=get_user_profile_img(str(user)))
        embed.add_field(name=":x:", value="{0} has not been verified as a member of Oculus Start!".format(str(user)))
        await ctx.send(content="", embed=embed)
    else:
        embed = discord.Embed(title="{0} Not Verified".format(str(ctx.author)), colour=discord.Colour(0x254f63))
        embed.set_thumbnail(url=get_user_profile_img(str(ctx.author)))
        embed.add_field(name=":x:", value="You have not been verified as a member of Oculus Start! Please see https://forums.oculusvr.com/start/discussion/89186/official-oculus-start-discord-access/p1 for instructions.")
        await ctx.send(content="", embed=embed)

@bot.command(name='register', help='Register for an event with this command! You\'ll need to know the specific name of the event when registering for right now.\n\nIf you have spaces between words, please encapsulate them in double quotes.\n\nExample usage: !register \"Monthly Feedback Event - July\" Developers')
async def register(ctx, eventName: str, registrationType: str="All"):
    embed = discord.Embed(title="Registration Results for {0}".format(str(ctx.author)), colour=discord.Colour(0x254f63))
    embed.set_thumbnail(url=get_user_profile_img(str(ctx.author)))

    if start_users.is_verified(str(ctx.author)):
        result, error = events.register_for_event(eventName, registrationType, str(ctx.author))
        if result:
            embed.add_field(name=":white_check_mark:", value="Registered for \'{0}\'!".format(eventName))
        else:
            embed.add_field(name=":x:", value=error)
    else:
        embed.add_field(name=":x:", value="You have not been verified as a member of Oculus Start! Please see https://forums.oculusvr.com/start/discussion/89186/official-oculus-start-discord-access/p1 for instructions.")
    await ctx.message.delete()
    await ctx.send(content="", embed=embed)

@bot.command(name='unregister', help='Un-register for an event with this command! You\'ll need to know the specific name of the event when un-registering for right now.\n\nIf you have spaces between words, please encapsulate them in double quotes.\n\nExample usage: !unregister \"Monthly Feedback Event - July\" Developers')
async def register(ctx, eventName: str, registrationType: str="All"):
    embed = discord.Embed(title="Registration Results for {0}".format(str(ctx.author)), colour=discord.Colour(0x254f63))
    embed.set_thumbnail(url=get_user_profile_img(str(ctx.author)))

    if start_users.is_verified(str(ctx.author)):
        result, error = events.unregister_for_event(eventName, registrationType, str(ctx.author))
        if result:
            embed.add_field(name=":white_check_mark:", value="You have been un-registered from \'{0}\'!".format(eventName))
        else:
            embed.add_field(name=":x:", value=error)
    else:
        embed.add_field(name=":x:", value="You have not been verified as a member of Oculus Start! Please see https://forums.oculusvr.com/start/discussion/89186/official-oculus-start-discord-access/p1 for instructions.")
    await ctx.message.delete()
    await ctx.send(content="", embed=embed)

bot.run(TOKEN)
print("Closing bot...")
# existingVerifications.close()
print("Done!")
