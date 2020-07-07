import sys
import argparse
import requests
import utils.start_users_db as start_users
import utils.events_db as start_events
from utils.validator import OculusStartValidator

parser = argparse.ArgumentParser(description='Used to test out the utilities available to the bot.')
parser.add_argument('--verify', help='Verify that a user exists. Requires an Oculus username.', nargs='+')
parser.add_argument('--status', help='Gets the status of a Discord user. Requires a Discord username.', nargs='+')
parser.add_argument('--email', help='Adds an email address to a specified user. Requires a Discord username and email address.', nargs=2)
parser.add_argument('--hardware', help='Add or remove hardware to a specified user. Requires a Discord username, add/remove, and the hardware to add/remove.', nargs=3)
parser.add_argument('--project', help='Add or remove project to a specified user. Requires a Discord username, add/remove, and the project to add/remove.', nargs=7)
parser.add_argument('--events', help='Register and unregister for an event. Requires a Discord username, register/unregister, and the event to register/unregister from.', nargs=4)

args = parser.parse_args()

if args.verify is not None:
    for i in range(0, len(args.verify)):
        print('-------------------------------------------')
        name = args.verify[i]
        addr = "https://forums.oculusvr.com/start/profile/{0}".format(name)
        # print("Fetching for {0} at {1}".format(name, addr))
        startParser = OculusStartValidator(name)
        startParser.feed(requests.get(addr).text)

        print("Forum picture: {0}".format(startParser.forumPicture))
        if startParser.exists and startParser.isOculusStartMember:
            if startParser.discordUsername is not None:
                print("Confirmed that {0} is a member of Oculus Start!".format(startParser.discordUsername))
            else:
                print("Confirmed that {0} is a member of Oculus Start but couldn't find a valid Discord username!".format(name))
        else:
            if startParser.exists == False:
                print("{0} is not a valid Oculus username!".format(name))
            else:
                print("{0} is NOT a member of Oculus Start!".format(name))

if args.status is not None:
    for i in range(0, len(args.status)):
        print('-------------------------------------------')
        user = start_users.get_verified_user(args.status[i])

        if user is not None:
            print("{0} is a member of Oculus Start! Their Oculus username is {1}.".format(args.status[i], user['forumUsername']))
            if 'email' in user:
                print("Their email address is {0}".format(user['email']))
            else:
                print("They do not have an email address registered!")
        else:
            print("{0} is not a validated member of Oculus Start!".format(args.status[i]))

if args.email is not None:
    if start_users.add_oculus_email(args.email[0], args.email[1]):
        user = start_users.get_verified_user(args.email[0])
        if user is not None and user['email'] is not None:
            print("Email address added for user {0}!".format(args.email[0]))
        else:
            print("Failed to add an email address for user {0}!".format(args.email[0]))
    else:
        print("No valid user {0}!".format(args.email[0]))

if args.hardware is not None:
    if args.hardware[1].lower() == 'add':
        result, error = start_users.add_hardware(args.hardware[0], args.hardware[2])
        if result:
            user = start_users.get_verified_user(args.hardware[0])
            if user is not None and user['hardware'] is not None and len(user['hardware']) > 0:
                print("Hardware for {0}: {1}".format(args.hardware[0], user['hardware']))
            else:
                print("Failed to add hardware for user {0}!".format(args.hardware[0]))
        else:
            print(error)

    if args.hardware[1].lower() == 'remove':
        result, error = start_users.remove_hardware(args.hardware[0], args.hardware[2])
        if result:
            user = start_users.get_verified_user(args.hardware[0])
            if user is not None and user['hardware'] is not None and len(user['hardware']) > 0:
                print("Hardware for {0}: {1}".format(args.hardware[0], user['hardware']))
            else:
                print("Failed to remove hardware for user {0}!".format(args.hardware[0]))
        else:
            print(error)

if args.project is not None:
    if args.project[1].lower() == 'add':
        # TODO: Add support for testing hardware being added to projects!
        result, error = start_users.add_project(args.project[0], args.project[2], args.project[3], args.project[4], args.project[5], args.project[6], [])
        if result:
            user = start_users.get_verified_user(args.project[0])
            if user is not None and user['projects'] is not None and len(user['projects']) > 0:
                print("Project for {0}: {1}".format(args.project[0], user['projects']))
            else:
                print("Failed to add project for user {0}!".format(args.project[0]))
        else:
            print(error)

    if args.project[1].lower() == 'remove':
        result, error = start_users.remove_project(args.project[0], args.project[2])
        if result:
            user = start_users.get_verified_user(args.project[0])
            if user is not None and user['projects'] is not None and len(user['projects']) > 0:
                print("Project for {0}: {1}".format(args.project[0], user['projects']))
            else:
                print("No projects found for {0}!".format(args.project[0]))
        else:
            print(error)

if args.events is not None:
    print(args.events[0].lower())
    if args.events[0].lower() == 'register':
        result, error = start_events.register_for_event(args.events[1], args.events[2], args.events[3])
        print(result)
        print(error)

    if args.events[0].lower() == 'unregister':
        result, error = start_events.unregister_for_event(args.events[1], args.events[2], args.events[3])
        print(result)
        print(error)
