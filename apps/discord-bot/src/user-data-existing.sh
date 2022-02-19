#!/usr/bin/env bash

# This script is meant to run on a newly created AWS EC2 instance
# as part of the launch template user data.
# It pulls the latest backup of the smp world
# and starts two systemd services:

# 1. minecraft.service - a Minecraft server
# 2. mc-sidecar.service - a small web server

# The sidecar manages the lifecycle of the Minecraft server.
# It exposes HTTP endpoints for starting, stopping, and restarting,
# as well as creating backups
# and checking who's online.

# Bash "strict mode"
set -euo pipefail

sudo yum update -y
# sudo amazon-linux-extras install java-openjdk11
sudo yum install git htop java-17 -y

echo "starting new server setup"

# BEGIN MINECRAFT SERVER
mc_user="ec2-user"
mc_user_home="/home/$mc_user"
mc_directory="/minecraft"
s3_bucket="s3://minecraft.trshcmpctr.com"
local_jar="${mc_directory}/server.jar"
mc_version="1-16-5"
mc_rcon_secret="<REPLACE_ME_RCON_SECRET>"
mc_world_name="<REPLACE_ME_WORLD_NAME>"

# Don't request more memory than is available or the server won't start!
minimum_memory="1024M"
maximum_memory="14G"
max_gc_pause="50"

sudo mkdir "$mc_directory"

backup_path="/backup/$mc_world_name/versions/${mc_version}/"
bucket_folder="$s3_bucket$backup_path"

echo "bucket folder" $bucket_folder

set +e
backups_available=$(aws s3 ls $bucket_folder)
set -e
echo "[restore]" "backups available:"
echo "\`\`\`"
echo "$backups_available"
echo "\`\`\`"
# By default, s3-ls sorts based on the file name strings.
# This puts double-digit numbers out of order.
# e.g.
# asdf-1
# asdf-10
# ...
# asdf-9
# Use sort utility to reorder the list based on the printed timestamp.
backup_name=$(echo "$backups_available" | sort | awk 'END{ print $4 }')

echo "[restore]" "found latest $backup_name"
echo "[restore]" "starting restore of $backup_name"

time aws s3 cp "$bucket_folder$backup_name" $mc_user_home/latest-backup.zip
time unzip -o $mc_user_home/latest-backup.zip -d $mc_directory/

sudo chown -R $mc_user:$mc_user $mc_user_home
sudo chown -R $mc_user:$mc_user $mc_directory

# systemd "simple" service unit configuration
echo "[Unit]
Description=Vanilla Minecraft Server
# https://www.freedesktop.org/wiki/Software/systemd/NetworkTarget/
After=network.target

[Service]
Type=simple
User=$mc_user
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
echo "[setup]" "setup complete"
echo "[setup]" "starting minecraft service"
sudo service minecraft start
# END MINECRAFT SERVER

# BEGIN NODE AND RUSH
curl https://nodejs.org/dist/v14.16.1/node-v14.16.1-linux-x64.tar.xz --output $mc_user_home/node-v14.16.1-linux-x64.tar.xz

# tar wants to be in the same directory as the archive.
(cd $mc_user_home && tar -xf node-v14.16.1-linux-x64.tar.xz)

sudo chown -R $mc_user:$mc_user $mc_user_home/node-v14.16.1-linux-x64
node_binary_location="$mc_user_home/node-v14.16.1-linux-x64/bin"

export PATH=$node_binary_location:$PATH
echo PATH="$node_binary_location:$PATH" >> $mc_user_home/.bashrc

npm install --global @microsoft/rush
# END NODE AND RUSH

# BEGIN LIFECYCLE-MANAGER
git clone https://github.com/shanedg/discord-mc-status.git $mc_user_home/discord-mc-status
echo "
MC_WORKING_DIRECTORY=$mc_directory
MC_WORLD_NAME=$mc_world_name
MC_USE_SYSTEMD=true
PORT=3000
RCON_HOST=localhost
RCON_PORT=25575
RCON_SECRET=$mc_rcon_secret
" > $mc_user_home/discord-mc-status/apps/lifecycle-manager/.env

sudo chown -R $mc_user:$mc_user $mc_user_home/discord-mc-status
(cd $mc_user_home/discord-mc-status && su $mc_user -c 'rush install')

lifecycle_manager_working_directory=$mc_user_home/discord-mc-status/apps/lifecycle-manager

# another systemd service unit
echo "[Unit]
Description=Custom Server Sidecar
# https://www.freedesktop.org/wiki/Software/systemd/NetworkTarget/
After=network.target

[Service]
Type=simple
User=$mc_user
WorkingDirectory=$lifecycle_manager_working_directory
ExecStart=$node_binary_location/node \
  src/index.js
" > /etc/systemd/system/mc-sidecar.service

sudo systemctl daemon-reload

sudo service mc-sidecar start
# END LIFECYCLE-MANAGER

# Debugging, connect and run:
# sudo tail -f /var/log/cloud-init-output.log
