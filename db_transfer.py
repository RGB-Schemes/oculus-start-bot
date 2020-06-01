import utils.start_users_db as start_users
from sqlitedict import SqliteDict

existingVerifications = SqliteDict('./verified_members.sqlite', autocommit=True)

for key in existingVerifications:
    print("Adding {0} - {1} to the DynamoTable...".format(key, existingVerifications[key]))
    start_users.add_verified_user(existingVerifications[key], key)
