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
                result = len(result['Item']['Participants'][registrationType]['Users']) < result['Item']['Participants'][registrationType]['Max']
                message = None if result else 'Too many people have registered as a {0} for \'{1}\'. Please try again for the next event!'.format(registrationType, eventName)
                return result, message
            else:
                return True, None
        else:
            return False, 'The event \'{0}\' has already started or ended, and registration is now closed.'
    elif result != None and 'Item' in result:
        return False, 'Could not find {0} as a registration type for \'{1}\''.format(registrationType, eventName)
    else:
        return False, 'No such event with the name \'{0}\' found!'.format(eventName)

def register_for_event(eventName, registrationType, discordHandle):
    canRegister, error = can_register(eventName, registrationType)
    if canRegister:
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
    return False, error

def unregister_for_event(eventName, registrationType, discordHandle):
    key = {
            'EventName': eventName
        }
    user_results = table.get_item(Key=key)
    if user_results != None and 'Item' in user_results and registrationType in user_results['Item']['Participants']:
        participants = user_results['Item']['Participants']
        if discordHandle in participants[registrationType]['Users']:
            participants[registrationType]['Users'].remove(discordHandle)

        # print(participants)

        result = table.update_item(
            Key=key,
            UpdateExpression="set Participants=:p",
            ExpressionAttributeValues={
                ':p': participants
            },
            ReturnValues="UPDATED_NEW"
        )
        return result is not None, 'Success'
    return False, 'Could not unregister \'{0}\' as a {1} for \'{2}\'!'.format(discordHandle, registrationType, eventName)
