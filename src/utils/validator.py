import re
import requests
from lxml import html

class OculusStartValidator:
    # Google Form Valid Version - ^[^@#:`]{2,32}#[0-9]{4}$
    pattern = re.compile("^((?!discordtag|everyone|here)[^@#:```]){2,32}#[0-9]{4}$")

    exists = False
    forumPicture = None
    forumUsername = None
    discordUsername = None
    isOculusStartMember = False
    invalidDiscordUsername = None
    mismatchCommentAuthor = None

    def __init__(self, forumUsername):
        self.forumUsername = forumUsername
        addr = "https://forums.oculusvr.com/start/profile/{0}".format(self.forumUsername)
        page = requests.get(addr)
        tree = html.fromstring(page.content)
        
        center_splashes = tree.xpath('//div[@class="Center SplashInfo"]')
        for center_splash in center_splashes:
            if 'user not found' in center_splash.text_content().lower():
                self.exists = False
                return

        self.exists = True
        # Verify the user is an Oculus Start member.
        titles = tree.xpath('//span[@class="Rank"]')
        for title in titles:
            if title.get('title') == 'Oculus Start':
                self.isOculusStartMember = True
                break

        if self.isOculusStartMember:
            profilePic = tree.xpath('//img[@class="ProfilePhotoLarge"]')
            if profilePic is not None and len(profilePic) > 0:
                self.forumPicture = profilePic[0].get('src')

                # Default profile pics do not have the 'https:' in front of their
                # urls for some reason, so manually add that in.
                if not self.forumPicture.startswith('https:'):
                    self.forumPicture = 'https:{0}'.format(self.forumPicture)

            comments = tree.xpath('//div[@class="ItemContent Activity"]')
            for comment in comments:
                author = comment.find('./div[@class="Title"]')
                if author is not None:
                    details = comment.find('./div[@class="Excerpt userContent"]')
                    if details is not None:
                        result = details.text_content()
                        if self.pattern.match(result.strip()):
                            if author.text_content() == self.forumUsername:
                                self.discordUsername = result.strip()
                                self.invalidDiscordUsername = None
                                print('{0} is a valid Start user with the Discord handle {1}!'.format(self.forumUsername, self.discordUsername))
                                break
                            else:
                                self.mismatchCommentAuthor = author.text_content().split(' → ')[0]
                                print('Expected the comment from {0} but was actually from {1}!'.format(self.forumUsername, self.mismatchCommentAuthor))
                        else:
                            self.invalidDiscordUsername = result.strip()
        else:
            print('{0} is not a valid Start user!'.format(self.forumUsername))
