#!/usr/bin/env bash

# This script creates a backup of all files in the Minecraft server working directory
# and uploads the resulting zip file archive to an AWS S3 bucket.
#
# The script assumes aws-cli is configured for the shell
# and the associated IAM profile has the appropriate S3 permissions.
#
# The script expects the following environment variables to be set:
# - MC_WORKING_DIRECTORY
# - MC_WORLD_NAME
# If executed by the lifecycle-manager application,
# the script will inherit from process.env.
# If executed as a standalone script,
# they'll need to made available explicitly, e.g.:
# MC_WORKING_DIRECTORY=/Users/shanegarrity/dev-minecraft/localserver/ MC_WORLD_NAME=localhost ./backup.sh

# Bash "strict mode"
set -euo pipefail

exitBackup() {
  echo "[backup]" "Exiting backup"
}

trap exitBackup EXIT

echo "[backup]" "Starting backup..."

s3_bucket="s3://minecraft.trshcmpctr.com"

# https://stackoverflow.com/a/1401495
# https://unix.stackexchange.com/questions/48101/how-can-i-have-date-output-the-time-from-a-different-timezone
backup_date=$(TZ=America/New_York date '+%Y-%m-%d')
backup_of_the_day=1
backup_path="/backup/$MC_WORLD_NAME/versions/1-16-5/"
bucket_folder="$s3_bucket$backup_path"

echo "[backup]" "Determining backup name and destination..."

# `s3 ls` returns a non-zero exit code when the bucket doesn't exist
# or hasn't been created yet
# https://awscli.amazonaws.com/v2/documentation/api/latest/reference/s3/ls.html
# https://awscli.amazonaws.com/v2/documentation/api/latest/topic/return-codes.html#cli-aws-help-return-codes
set +e
existing_backups=$(aws s3 ls "$bucket_folder")
set -e
# https://linuxize.com/post/how-to-check-if-string-contains-substring-in-bash/#using-wildcards
while [[ "$existing_backups" == *"$backup_date-$backup_of_the_day"* ]]
do
  # https://linuxize.com/post/bash-increment-decrement-variable/
  backup_of_the_day=$((backup_of_the_day+1))
done

backup_name="$backup_date-$backup_of_the_day.zip"
backup_destination="$bucket_folder$backup_name"
cached_backup="$HOME/latest-backup.zip"

cd "$MC_WORKING_DIRECTORY" || exit 1

echo "[backup]" "Zipping backup to $cached_backup..."
# https://linuxize.com/post/bash-check-if-file-exists/#check-if-file-exists
if test -f "$cached_backup"
then
  # `zip` returns a non-zero exit code when there are no updates to make to the archive.
  set +e
  if ! time zip -ru "$cached_backup" ./*
  then
    echo "[backup]" "No updates to add to archive, skipping upload"
    exit 0
  fi
  set -e
else
  time zip -r "$cached_backup" ./*
fi

echo "[backup]" "Uploading backup"

time aws s3 cp "$cached_backup" "$backup_destination"

echo "[backup]" "Backed up to $backup_destination"
