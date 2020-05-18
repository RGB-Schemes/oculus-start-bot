import re
from html.parser import HTMLParser

class OculusStartValidator(HTMLParser):
    pattern = re.compile("^[a-zA-z ]{2,32}#[0-9]{4}$")

    # Used to find if the user is an Oculus Start member.
    inRankSpan = False

    commentAuthorVerified = False
    isInCommentDiv = False
    isInCommentAuthorDiv = False
    isInCommentTextDiv = False

    forumUsername = None
    discordUsername = None
    isOculusStartMember = False

    def __init__(self, forumUsername):
        HTMLParser.__init__(self)
        self.forumUsername = forumUsername

    def handle_starttag(self, tag, attrs):
        if tag == "span":
            for x, y in attrs:
                if x == "class" and y == "Rank":
                    self.inRankSpan = True
                    break
        if tag == "div":
            for x, y in attrs:
                if x == "class":
                    if y == "ItemContent Activity":
                        self.isInCommentDiv = True
                    elif y == "Title":
                        self.isInCommentAuthorDiv = True
                    elif y == "Excerpt userContent":
                        self.isInCommentTextDiv = True
                    break

    def handle_endtag(self, tag):
        if self.inRankSpan and tag == "span":
            self.inRankSpan = False
        if self.isInCommentDiv and tag == "div":
            if self.isInCommentAuthorDiv:
                self.isInCommentAuthorDiv = False
            elif self.isInCommentTextDiv:
                self.isInCommentTextDiv = False
            else:
                self.commentAuthorVerified = False
                self.isInCommentDiv = False

    def handle_data(self, data):
        if self.inRankSpan:
            if data.strip() == "Oculus Start Member":
                self.isOculusStartMember = True
            else:
                self.isOculusStartMember = False
        if self.isInCommentDiv:
            if self.isInCommentAuthorDiv:
                if str(data).lower() == self.forumUsername.lower():
                    self.commentAuthorVerified = True
                else:
                    self.isInCommentAuthorDiv = False
            elif self.isInCommentTextDiv and self.commentAuthorVerified:
                print("Comment: {0}".format(data.strip()))
                if self.pattern.match(data.strip()):
                    self.discordUsername = data.strip()
