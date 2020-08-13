#!/bin/bash
echo Killing bot...
kill -9 $(<"/home/ec2-user/bot.pid")
rm /home/ec2-user/bot.pid
