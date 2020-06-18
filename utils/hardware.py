oculus_hardware = {
    'RIFT': 'Oculus Rift',
    'CV1': 'Oculus Rift',
    'GO': 'Oculus Go',
    'RIFTS': 'Oculus Rift S',
    'QUEST': 'Oculus Quest'
}

def get_supported_hardware():
    return 'Hardware Available:\n\n{0}'.format('\n'.join(['- %s (%s)' % (key, value) for (key, value) in oculus_hardware.items()]))

def get_hw_error_msg(hw):
    return 'Could not find the hardware for \'{0}\', please specify a valid device from this list:\n\n{1}'.format(hw, '\n'.join(['- %s (%s)' % (key, value) for (key, value) in oculus_hardware.items()]))

def get_hardware(hw):
    if hw.upper() in oculus_hardware:
        return oculus_hardware[hw.upper()]
    # Special override for the bot's hardware ;)
    if hw == 'The Internet':
        return 'The Internet'
    return None
