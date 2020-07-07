import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
table = dynamodb.Table('Oculus_Start_Discord_Events')

def can_register(eventName, registrationType):
    result = table.get_item(
        Key={
            'EventName': eventName
        }
    )
    if result != None and 'Item' in result and registrationType in result['Item']['Participants']:
        startDate = datetime.strptime(result['Item']['EventDate']['Start'], '%m-%d-%y %H:%M:%S')
        if datetime.now() < startDate:
            if 'Max' in result['Item']['Participants'][registrationType]:
                return len(result['Item']['Participants'][registrationType]['Users']) < result['Item']['Participants'][registrationType]['Max']
            else:
                return True
        else:
            return False
    else:
        return False

def register_for_event(eventName, registrationType, discordHandle):
    if can_register(eventName, registrationType):
        key = {
                'EventName': eventName
            }
        user_results = table.get_item(Key=key)
        participants = user_results['Item']['Participants']
        if discordHandle not in participants[registrationType]['Users']:
            participants[registrationType]['Users'].append(discordHandle)

        result = table.update_item(
            Key=key,
            UpdateExpression="set Participants=:p",
            ExpressionAttributeValues={
                ':p': participants
            },
            ReturnValues="UPDATED_NEW"
        )
        return result is not None, 'Success'
    return False, 'Could not register \'{0}\' for event!'.format(discordHandle)

def unregister_for_event(eventName, registrationType, discordHandle):
    key = {
            'EventName': eventName
        }
    user_results = table.get_item(Key=key)
    if user_results != None and 'Item' in user_results and registrationType in user_results['Item']['Participants']:
        participants = user_results['Item']['Participants']
        if discordHandle in participants[registrationType]['Users']:
            participants[registrationType]['Users'].remove(discordHandle)

        print(participants)

        result = table.update_item(
            Key=key,
            UpdateExpression="set Participants=:p",
            ExpressionAttributeValues={
                ':p': participants
            },
            ReturnValues="UPDATED_NEW"
        )
        return result is not None, 'Success'
    return False, 'Could not unregister \'{0}\' for event!'.format(discordHandle)
