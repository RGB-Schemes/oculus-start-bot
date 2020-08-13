#!/bin/bash
bot_pid_file=/home/ec2-user/bot.pid
if test -f "$bot_pid_file"; then
    echo Killing bot...
    kill -9 $(<"$bot_pid_file")
    rm /home/ec2-user/bot.pid
else
    echo No bot to kill!
fi
