# Oculus Start Discord Bot

![Version Badge](https://img.shields.io/github/package-json/v/RGB-Schemes/oculus-start-bot?color=blue&logo=oculus) ![Build Status Badge](https://img.shields.io/github/workflow/status/RGB-Schemes/oculus-start-bot/Build%20Status?logo=node.js) ![Coverage Badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/GEMISIS/d16ca0b787ba038971dd1308518c190d/raw/oculus-start-bot__heads_mainline.json) [![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)

This project is for setting up the Oculus Start Discord Bot! Using it, you can develop for, deploy locally, and maintain the Oculus Start Bot. It is built with CDK (entirely in TypeScript). It is currently maintained and deployed by **RGB Schemes** in order to help the Oculus Start program continue to grow, though we are attempting to work with Oculus to get this officially supported by them as well. You can learn more about the program and its benefits [here](https://developer.oculus.com/oculus-start/). We highly recommend other developers join!

# Setup
When deploying, the order in which you run everything is currently important. There are 2 stages to deploying:

1. Deploying the actual infrastructure
2. Configuring the Discord server to use the infrastructure.

Prior to deployment, you'll want to update `src/app.ts` to use a different domain name that you have setup in Route 53 to have the endpoint accessible by. You can also remove this field to allow for it to go unused, in which case you will need to manually note the endpoint URls that are generated. To deploy the infrastructure, you will want to do the following:

1. Run `npm run build`  - Compiles the TypeScript into JavaScript
2. Run `npm run synth`  - Synthesizes the CDK templates into CloudFormation templates.
3. Run `npm run deploy` - Deploys all of the infrastructure code to AWS and then outputs the necessary results to a configuration file in the dist folder.
4. Login to your AWS Account and navigate to the Secrets Manager. Here, you'll want to update your Discord secrets as a JSON configuration that looks something like this:
```json
{
  "appId": "XXXXX",
  "publicKey": "XXXXX",
  "clientId": "XXXXX",
  "authToken": "XXXXX",
  "serverId": "XXXXX"
}
```
5. Run `npm run config`  - Sets up the Discord server's Slash Commands and other configuration properties. This uses your secrets configured above so that you can securely deploy everything.
6. Going back into your AWS Account, add API Keys and add them to the `Start API Usage Plan` so that you can access them.

At this stage, you should be able to use the bot on your server and use the various REST APIs! Note that there may be some time delays as things propogate through the system, so you may need to wait for some time (for example: Discord can be slow when updating the available Slash Commands).

# Architecture Overview
This is the architecture for how this project is laid out server-side. The tools used to create these diagrams are:
- [Architecture Diagrams](https://app.diagrams.net)
- [Sequence Diagrams](https://sequencediagram.org)


The Oculus Start Discord Bot is architectured around a serverless design, allowing for it to be both low cost and highly scalable. It is built using the CDK (Cloud Development Kit) by AWS (Amazon Web Services), and thus is run entirely on AWS. This ensures no downtimes and low costs, as well as high scalability.
![The architecture diagram for the project.](diagrams/architecture.png?raw=true)

# Table Layouts
We have three DynamoDB tables at the moment: One used for storing API Keys and what they are authorized for, one used for storing authenticated users and their data, and one for storing events for the server.

## Authorization Table
|**Column**|apiKey|validationTags|
|--|-|-|
|**Format**|string (Primary Key)|Set of strings|
|**Description**|The API Key stored here.|The validation tags for what this API Key is allowed to access.

## Authenticated Users Table
|**Column**|discordMemberId|oculusHandle|startTrack|email|hardware|projects|
|--|-|-|---|--------|-----|---------|
|**Format**|string (Primary Key)|string|string|string|List of strings|List of Project objects|
|**Description**|The user's Discord user ID. This is their specific Discord user ID, which is unique throughout Discord.|The user's Oculus handle. Used to validate that they are a member of Oculus Start, as well as for certain events.|The track that the user is on. Currently this is just one of three values: "Normal", "Growth", or "Alumni".|The user's email address **associated with their Oculus account**. That last part is key, as it will be used in certain events to allow them to be added to release channels for Oculus apps.|A list of devices the user owns. Currently limited to just Oculus devices.|A list of projects the user has created. These projects have a specific format. See below for more details.

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
|**Description**|The name of the event.|The time at which the event starts.|The time at which the event ends.|The maximum number of presentors the event can have.|A list of Discord user IDs for people presenting at the event.|The maximum number of attendees an event can have.|A list of Discord user IDs for people attending the event.|

# User Flow Diagrams
Users can interact with the bot in one of two primary ways: Via Discord with various commands from the bot, or via a website that uses the API endpoints. **As of this moment, the bot only accessible via the Discord commands. The user flows for the website examples are for potential future additions.**

## Website - User Authentication Example
![User authentication flow diagram](diagrams/user-auth.png?raw=true)

## Discord Bot - Register for Event Example
![Registering for an event on Discord](diagrams/discord-event-registration.png?raw=true)

# Contributing
When contributing, you will want to fork this project, and make your changes in your fork of this, after which you can submit a pull request to merge your changes back into the project. Please ensure that the unit tests still pass (and that you've added any additional ones to maintain good code coverage), and ensure that you have verified you are following the lint rules that have been setup.

# Useful commands

 * `npm run build`      compile typescript to js
 * `npm run watch`      watch for changes and compile
 * `npm run test`       perform the jest unit tests
 * `npm run lint`       perform a lint check across the code
 * `npm run fix-lint`   fix any lint issues automatically where possible
 * `npm run synth`      emits the synthesized CloudFormation template
 * `npm run deploy`     deploy this stack to your default AWS account/region and generate outputs for creating slash commands
 * `npm run config`      configures the setup for a Discord server (run `npm run deploy` and configure your Secrets Manager first)
 * `cdk diff`           compare deployed stack with current state
