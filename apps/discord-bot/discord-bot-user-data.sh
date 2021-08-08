#!/usr/bin/env bash

# mc-discord-bot

# Bash "strict mode"
set -euo pipefail

sudo yum update -y
sudo yum install git htop -y

# BEGIN AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
# END AWS CLI

# BEGIN NODE AND RUSH
ec2_user_home="/home/ec2-user"

curl https://nodejs.org/dist/v14.16.1/node-v14.16.1-linux-x64.tar.xz --output $ec2_user_home/node-v14.16.1-linux-x64.tar.xz

# tar wants to be in the same directory as the archive.
(cd $ec2_user_home && tar -xf node-v14.16.1-linux-x64.tar.xz)

sudo chown -R ec2-user:ec2-user $ec2_user_home/node-v14.16.1-linux-x64
node_binary_location="$ec2_user_home/node-v14.16.1-linux-x64/bin"

export PATH=$node_binary_location:$PATH
echo PATH="$node_binary_location:$PATH" >> $ec2_user_home/.bashrc

node -v
npm -v

npm install --global @microsoft/rush
# END NODE AND RUSH

# BEGIN DISCORD BOT
git clone https://github.com/shanedg/discord-mc-status.git $ec2_user_home/discord-mc-status
# TODO: DO NOT COMMIT ANY OF THESE SECRETS!
echo "
BOT_TOKEN=<DISCORD_BOT_TOKEN>
LIFECYCLE_PORT=3000
" > $ec2_user_home/discord-mc-status/apps/discord-bot/.env

sudo chown -R ec2-user:ec2-user $ec2_user_home/discord-mc-status
(cd $ec2_user_home/discord-mc-status && su ec2-user -c 'rush install')

discord_bot_working_directory=$ec2_user_home/discord-mc-status/apps/discord-bot

# systemd "simple" service unit configuration
echo "[Unit]
Description=Discord Bot for Minecraft Server
# https://www.freedesktop.org/wiki/Software/systemd/NetworkTarget/
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=$discord_bot_working_directory
ExecStart=$node_binary_location/node \
  src/index.js" > /etc/systemd/system/mc-discord-bot.service

sudo systemctl daemon-reload

sudo service mc-discord-bot start
# END DISCORD BOT

# Debugging, connect and run:
# sudo tail -f /var/log/cloud-init-output.log
