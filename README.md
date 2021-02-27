# Oculus Start Discord Bot

This project is for setting up the Oculus Start Discord Bot! Using it, you can develop for, deploy locally, and maintain the Oculus Start Bot. It is built using a combination of CDK (entirely in TypeScript) and a *small* bit of Python for the actual bot itself (serverless solutions for the bot's code are being investigated, but are cost prohibitive at the moment). It is currently maintained and deployed by **RGB Schemes** in order to help the Oculus Start program continue to grow, though we are attempting to work with Oculus to get this officially supported by them as well. You can learn more about the program and its benefits [here](https://developer.oculus.com/oculus-start/). We highly recommend other developers join!

# Architecture Overview
The Oculus Start Discord Bot is architectured around a serverless design, allowing for it to be both low cost and highly scalable. It is built using the CDK (Cloud Development Kit) by AWS (Amazon Web Services), and thus is run entirely on AWS. This ensures no downtimes and low costs, as well as high scalability.
![The architecture diagram for the project.](diagrams/architecture.png?raw=true)

# Table Layouts
We have two DynamoDB tables at the moment: One used for storing authenticated users and one for storing events for the server.

## Authenticated Users Table
|**Column**|discordHandle|oculusHandle|startTrack|email|hardware|projects|
|--|-|-|---|--------|-----|---------|
|**Format**|string (Primary Key)|string|string|string|List of strings|List of Project objects|
|**Description**|The user's Discord handle. This is their specific Discord handle as the format is described [here](https://discord.com/developers/docs/resources/user).|The user's Oculus handle. Used to validate that they are a member of Oculus Start, as well as for certain events.|The track that the user is on. Currently this is just one of three values: "Normal", "Growth", or "Alumni".|The user's email address **associated with their Oculus account**. That last part is key, as it will be used in certain events to allow them to be added to release channels for Oculus apps.|A list of devices the user owns. Currently limited to just Oculus devices.|A list of projects the user has created. These projects have a specific format. See below for more details.

A user's projects are formatted as a JSON document. As an example project:
```json
{
    "name": "Play Bunker",
    "description": "Play Bunker is a social experience for playing board games, designed from the ground up for virtual reality. Jump into a room with friends and family anywhere in the world and play a wide variety of board games together. Not satisfied with the included games? Make your own using your own 3D models! Play Bunker is designed to give you the flexibility to have game night anytime, anywhere!",
    "supportedPlatforms": [
        "Oculus PCVR Store",
        "Oculus Quest Store"
    ],
    "link": "https://www.rgbschemes.com/products/play-bunker/",
    "logo": "https://www.rgbschemes.com/products/play-bunker/img/header.png",
    "trailer": "https://www.youtube.com/watch?v=KmrvAH9UPls"
}
```
## Events Table
|**Column**|name|startDate|endDate|maxPresentors|presentors|maxAttendees|attendees|
|-|-|---|--------|-----|---------|-|-|
|**Format**|string (Primary Key)|string of ISO8601 time format|string of ISO8601 time format|Number|List of strings|Number|List of strings|
|**Description**|The name of the event.|The time at which the event starts.|The time at which the event ends.|The maximum number of presentors the event can have.|A list of Discord handles for people presenting at the event.|The maximum number of attendees an event can have.|A list of Discord handles for people attending the event.|

# User Flow Diagrams
Users can interact with the bot in one of two primary ways: Via Discord with various commands from the bot, or via a website that uses the API endpoints. **As of this moment, the bot only accessible via the Discord commands. The user flows for the website examples are for potential future additions.**

## User Authentication
![User authentication flow diagram](diagrams/user-auth.png?raw=true)

## Discord Bot - Register for Event
![Registering for an event on Discord](diagrams/discord-event-registration.png?raw=true)

# Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
