import boto3

dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
table = dynamodb.Table('Oculus_Start_Discord_Members')

def get_verified_user(discordHandle):
    result = table.get_item(
        Key={
            'discordHandle': discordHandle
        }
    )
    if result != None and 'Item' in result and result['Item']['discordHandle'] == discordHandle:
        return result['Item']
    else:
        return None

def add_verified_user(discordHandle, forumUsername):
    print("Adding {0} - {1} to the DynamoTable...".format(forumUsername, discordHandle))
    entry = {
        "discordHandle": discordHandle,
        "forumUsername": forumUsername
    }
    table.put_item(Item=entry)
    print("Added! Verifying entry...")
    user = get_verified_user(discordHandle)
    if user != None:
        if user['discordHandle'] == discordHandle and user['forumUsername'] == forumUsername:
            print("Verified!")
        else:
            print("There was a problem adding the user with the correct information!")
    else:
        print("There was a problem adding {0}".format(discordHandle))
