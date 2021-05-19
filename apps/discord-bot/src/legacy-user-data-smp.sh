#!/usr/bin/env bash

# mc-sidecar

# This script is meant to run on a newly created AWS EC2 instance
# as part of the launch template user data.
# It pulls the latest backup of the smp world
# and starts two systemd services:
# 1. a Minecraft server
# 2. a small "sidecar" web server

# The sidecar manages the lifecycle of the Minecraft server
# and exposes HTTP endpoints for starting,
# stopping, restarting, creating backups, and checking who's online.

# Bash "strict mode"
set -euo pipefail

sudo yum update -y
sudo amazon-linux-extras install java-openjdk11
sudo yum install git htop -y

# BEGIN MINECRAFT SERVER
mc_directory="/minecraft/"
sudo mkdir "$mc_directory"

s3_bucket="s3://minecraft.trshcmpctr.com"
local_jar="${mc_directory}server.jar"

# Don't request more memory than is available or the server won't start!
minimum_memory="1024M"
maximum_memory="14G"
max_gc_pause="50"

# systemd "simple" service unit configuration
echo "[Unit]
Description=Vanilla Minecraft Server
# https://www.freedesktop.org/wiki/Software/systemd/NetworkTarget/
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=$mc_directory
ExecStart=/usr/bin/java \
  -server \
  -Xms$minimum_memory \
  -Xmx$maximum_memory \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=$max_gc_pause \
  -jar \
  $local_jar \
  nogui" > /etc/systemd/system/minecraft.service

sudo systemctl daemon-reload

mc_world_name="smp"
backup_path="/backup/$mc_world_name/versions/1-16-5/"
bucket_folder="$s3_bucket$backup_path"

backups_available=$(aws s3 ls $bucket_folder)
echo "[restore]" "backups available:"
echo "\`\`\`"
echo "$backups_available"
echo "\`\`\`"
backup_name=$(echo "$backups_available" | sort | awk 'END{ print $4 }')

echo "[restore]" "found latest $backup_name"
echo "[restore]" "starting restore of $backup_name"

time aws s3 cp "$bucket_folder$backup_name" /home/ec2-user/latest-backup.zip
time sudo rm -rf /minecraft/*
time unzip -o /home/ec2-user/latest-backup.zip -d /minecraft/

sudo chown -R ec2-user:ec2-user /home/ec2-user
sudo chown -R ec2-user:ec2-user /minecraft

echo "[restore]" "successfully restored $backup_name"
echo "\`\`\`"
ls -alh "$mc_directory"
echo "\`\`\`"

# check /var/log/cloud-init-output.log for output
echo "[setup]" "setup and restore complete"
echo "[setup]" "starting minecraft service"

sudo service minecraft start
# END MINECRAFT SERVER

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

# BEGIN LIFECYCLE-MANAGER
git clone https://github.com/shanedg/discord-mc-status.git $ec2_user_home/discord-mc-status
# TODO: DO NOT COMMIT ANY OF THESE SECRETS!
echo "
MC_JAVA_EXECUTABLE=java
MC_MAX_GC_PAUSE=100
MC_MAXIMUM_MEMORY=4G
MC_MINIMUM_MEMORY=512M
MC_WORKING_DIRECTORY=<REPLACE_ME_WORKING_DIRECTORY>
MC_WORLD_NAME=<REPLACE_ME_WORLD_NAME>
MC_USE_SYSTEMD=true
PORT=3000
RCON_HOST=localhost
RCON_PORT=25575
RCON_SECRET=<REPLACE_ME_RCON_SECRET>
" > $ec2_user_home/discord-mc-status/apps/lifecycle-manager/.env

sudo chown -R ec2-user:ec2-user $ec2_user_home/discord-mc-status
(cd $ec2_user_home/discord-mc-status && su ec2-user -c 'rush install')

lifecycle_manager_working_directory=$ec2_user_home/discord-mc-status/apps/lifecycle-manager

# another systemd service unit
echo "[Unit]
Description=Custom Server Sidecar
# https://www.freedesktop.org/wiki/Software/systemd/NetworkTarget/
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=$lifecycle_manager_working_directory
ExecStart=$node_binary_location/node \
  src/index.js
" > /etc/systemd/system/mc-sidecar.service

sudo systemctl daemon-reload

sudo service mc-sidecar start
# END LIFECYCLE-MANAGER

# Debugging, connect and run:
# sudo tail -f /var/log/cloud-init-output.log
