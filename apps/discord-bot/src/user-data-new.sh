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
sudo amazon-linux-extras install java-openjdk11
sudo yum install git htop -y

echo "starting new server setup"

# BEGIN MINECRAFT SERVER
mc_user="ec2-user"
mc_user_home="/home/$mc_user"
mc_directory="/minecraft"
s3_bucket="s3://minecraft.trshcmpctr.com"
setup_folder="$s3_bucket/setup"
local_jar="${mc_directory}/server.jar"
mc_version="1.16.5"
mc_rcon_secret="<REPLACE_ME_RCON_SECRET>"
mc_world_name="<REPLACE_ME_WORLD_NAME>"

# Don't request more memory than is available or the server won't start!
minimum_memory="1024M"
maximum_memory="14G"
max_gc_pause="50"

# Set up a minimal vanilla server.
# Allow the first run to populate all default values for server.properties
# except for Rcon settings.
sudo mkdir "$mc_directory"
aws s3 cp "$setup_folder/server_$mc_version.jar" "$local_jar"

# Agree to the EULA or the server won't start!
echo "eula=true
" > "$mc_directory/eula.txt"

# TODO: how to customize more properties via bot?

# Rcon is off by default.
# Turn it on but add a password.
echo "
enable-rcon=true
rcon.password=$mc_rcon_secret
" > "$mc_directory/server.properties"

echo '
[
    {
        "uuid": "9a00987d-d245-4f4e-a7fb-402534fa28a8",
        "name": "crossfiresdg",
        "level": 4,
        "bypassesPlayerLimit": false
    },
    {
        "uuid": "70d5c7d4-fbaa-467a-a1bf-42262a100e96",
        "name": "AcidJesus",
        "level": 3,
        "bypassesPlayerLimit": false
    }
]
' > "$mc_directory/ops.json"

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