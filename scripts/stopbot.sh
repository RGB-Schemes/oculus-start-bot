#!/bin/bash
echo Killing bot...
kill -9 $(<"/var/run/bot.pid")