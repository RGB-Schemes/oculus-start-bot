#!/bin/bash
echo Working directory:
pwd
echo files:
ls /home/ec2-user/
echo Installing python...
yum install -y python3
echo Setting up pip...
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python3 get-pip.py
echo Installing requirements...
pip install -r /home/ec2-user/requirements.txt
