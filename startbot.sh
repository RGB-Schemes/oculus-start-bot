#!/bin/bash
echo Starting bot...
python bot.py &
echo Writing bot pid to file...
echo $! > /var/run/bot.pid
