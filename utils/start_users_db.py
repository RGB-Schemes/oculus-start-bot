import boto3

dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
table = dynamodb.Table('Oculus_Start_Discord_Members')

def is_verified(discordHandle):
    result = table.get_item(
        Key={
            'discordHandle': discordHandle
        }
    )
    return result != None and 'Item' in result and result['Item']['discordHandle'] == discordHandle and result['Item']['forumUsername'] is not None

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

def add_oculus_email(discordHandle, email):
    if is_verified(discordHandle):
        result = table.update_item(
            Key={
                'discordHandle': discordHandle
            },
            UpdateExpression="set email=:e",
            ExpressionAttributeValues={
                ':e': email
            },
            ReturnValues="UPDATED_NEW"
        )
        return result is not None
    return False
