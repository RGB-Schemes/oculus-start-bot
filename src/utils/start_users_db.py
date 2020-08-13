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

def add_hardware(discordHandle, hardware):
    if is_verified(discordHandle):
        user = get_verified_user(discordHandle)

        if 'hardware' not in user:
            user['hardware'] = [hardware]
        elif hardware not in user['hardware']:
            user['hardware'].append(hardware)
        else:
            return False, 'Hardware \'{0}\' is already registered for {1}!'.format(hardware, discordHandle)

        result = table.update_item(
            Key={
                'discordHandle': discordHandle
            },
            UpdateExpression="set hardware=:h",
            ExpressionAttributeValues={
                ':h': user['hardware']
            },
            ReturnValues="UPDATED_NEW"
        )
        return result is not None, 'Success'
    return False, 'No valid user \'{0}\'!'.format(discordHandle)

def remove_hardware(discordHandle, hardware):
    if is_verified(discordHandle):
        user = get_verified_user(discordHandle)

        if 'hardware' in user:
            i = -1
            for j in range(0, len(user['hardware'])):
                if user['hardware'][j] == hardware:
                    i = j
                    break

            if i > -1:
                table.update_item(
                    Key={
                        'discordHandle': discordHandle
                    },
                    UpdateExpression="remove hardware[{0}]".format(i),
                    ReturnValues="UPDATED_NEW"
                )
                return True, 'Success'
            else:
                return False, 'No hardware \'{0}\' for user {1}!'.format(hardware, discordHandle)
    return False, 'No valid user \'{0}\''.format(discordHandle)

def add_project(discordHandle, projectName, projectLogo, projectDescription, projectTrailer, projectLink, devices):
    if is_verified(discordHandle):
        user = get_verified_user(discordHandle)
        project = {
            'projectName': projectName,
            'projectLogo': projectLogo,
            'projectDescription': projectDescription,
            'projectTrailer': projectTrailer,
            'projectLink': projectLink,
            'projectDevices': devices
        }

        if 'projects' not in user:
            user['projects'] = [project]
        elif any(x['projectName'] == projectName for x in user['projects']):
            return False, 'Project \'{0}\' is already registered for {1}! Please remove it and then re-add it.'.format(projectName, discordHandle)
        else:
            user['projects'].insert(0, project)

        result = table.update_item(
            Key={
                'discordHandle': discordHandle
            },
            UpdateExpression="set projects=:p",
            ExpressionAttributeValues={
                ':p': user['projects']
            },
            ReturnValues="UPDATED_NEW"
        )
        return result is not None, 'Success'
    return False, 'No valid user \'{0}\'!'.format(discordHandle)

def remove_project(discordHandle, projectName):
    if is_verified(discordHandle):
        user = get_verified_user(discordHandle)

        if 'projects' in user:
            i = -1
            for j in range(0, len(user['projects'])):
                if user['projects'][j]['projectName'] == projectName:
                    i = j
                    break

            if i > -1:
                table.update_item(
                    Key={
                        'discordHandle': discordHandle
                    },
                    UpdateExpression="remove projects[{0}]".format(i),
                    ReturnValues="UPDATED_NEW"
                )
                return True, 'Success'
            else:
                return False, 'No project \'{0}\' for user {1}!'.format(projectName, discordHandle)
    return False, 'No valid user \'{0}\''.format(discordHandle)
