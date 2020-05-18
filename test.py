import sys
import requests
from validator import OculusStartValidator

if len(sys.argv) >= 2:
    for i in range(1, len(sys.argv)):
        name = sys.argv[i]
        addr = "https://forums.oculusvr.com/start/profile/{0}".format(name)
        # print("Fetching for {0} at {1}".format(name, addr))
        startParser = OculusStartValidator(name)
        startParser.feed(requests.get(addr).text)

        if startParser.isOculusStartMember:
            if startParser.discordUsername is not None:
                print("Confirmed that {0} is a member of Oculus Start!".format(startParser.discordUsername))
            else:
                print("Confirmed that {0} is a member of Oculus Start but couldn't find their Discord username!".format(name))
                print("Found Discord name {0}".format(startParser.discordUsername))
        else:
            print("{0} is NOT a member of Oculus Start!".format(name))
else:
    print("Please add any users as input parameters.")
