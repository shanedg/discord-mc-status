import { exec, execSync } from 'child_process';

// TODO: replace 'map' subdomain with 'craft'
const legacySMPNetworkInterfaceId = 'eni-01eb358d0340eee1e';

/**
 * Attach an Elastic IP address to a running instance.
 * UNUSED: The `associate-address` operation cannot succeed against "pending" instances.
 * To avoid solving an inconvenient polling problem when launching a new instance,
 * the Elastic IP is instead attached to a network interface
 * and associated with the instance as part of the launch template.
 * @deprecated
 * @param {string} publicIP A public Elastic IP address
 * @param {string} instanceId Id of an EC2 instance
 * @returns {Promise<any>} Output of the aws-cli command in JSON format.
 */
export const associateElasticIPWithInstance = async (publicIP, instanceId) => {
  return new Promise((resolve, reject) => {
    exec(`aws ec2 associate-address --output json --instance-id ${instanceId} --public-ip ${publicIP} --allow-reassociation`, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(JSON.parse(stdout));
      }
    });
  });
};

/**
 * Run an AWS EC2 instance from a predefined launch template.
 * @param {string} [templateId] Id of an EC2 launch template
 * @returns {Promise<*>} Output of the aws-cli command in JSON format.
 */
export const launchInstanceFromTemplate = async (templateId = 'lt-0b091f225fe894a12', region = 'us-east-1') => {
  return new Promise((resolve, reject) => {
    // https://awscli.amazonaws.com/v2/documentation/api/latest/reference/index.html#cli-aws
    // https://awscli.amazonaws.com/v2/documentation/api/latest/reference/ec2/run-instances.html
    exec(`aws ec2 run-instances --output json --launch-template LaunchTemplateId=${templateId} --region ${region} --network-interfaces NetworkInterfaceId=${legacySMPNetworkInterfaceId},DeviceIndex=0`, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(JSON.parse(stdout));
      }
    });
  });
};

/**
 * Get a secure value from AWS SSM Parameter store.
 * @param {string} path SSM Parameter name
 * @param {string} region AWS Region
 * @returns {*} Output of the aws-cli command in JSON format.
 */
const getSSMParameter = (path, region = 'us-east-1') => {
  // https://awscli.amazonaws.com/v2/documentation/api/latest/reference/ssm/get-parameter.html
  const results = execSync(`aws ssm get-parameter --output json --name "${path}" --with-decryption --region ${region}`, { encoding: 'utf-8' });
  return JSON.parse(results);
};

/**
 * Run an AWS EC2 instance from a predefined launch template.
 * Override the template user data to support creating new worlds
 * and loading existing ones from a backup.
 * @param {*} launchOptions Specify template, region, and user data for run-instances command;
 * also, the world name
 * @returns {Promise<*>} Output of the aws-cli command in JSON format.
 */
export const launchInstanceFromTemplateWithUserData = async (launchOptions) => {
  const defaultOptions = {
    templateId: 'lt-0b091f225fe894a12',
    region: 'us-east-1',
  };

  const { templateId, region, userData, worldName } = {
    ...defaultOptions,
    ...launchOptions,
  };

  if (!templateId ||
    !region ||
    !userData ||
    !worldName
  ) {
    throw new Error('launchInstanceFromTemplateWithUserData: Missing required options');
  }

  return new Promise((resolve, reject) => {
    const populatedWorldName = userData.replace('<REPLACE_ME_WORLD_NAME>', worldName);
    const results = getSSMParameter('/mc/rcon/secret');
    const rconSecret = results.Parameter.Value.replace('$', '\\$');
    const populatedRconSecret = populatedWorldName.replace('<REPLACE_ME_RCON_SECRET>', rconSecret);
    const encodedBase64 = Buffer.from(populatedRconSecret).toString('base64');

    const command = `aws ec2 run-instances --output json --launch-template LaunchTemplateId=${templateId} --region ${region} --user-data '${encodedBase64}'`;

    exec(command, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(JSON.parse(stdout));
      }
    });
  });
};

/**
 * Terminate an AWS EC2 instance.
 * @param {string} instanceId ID of an EC2 instance
 * @returns {Promise<*>} Output of the aws-cli command in JSON format.
 */
export const terminateInstance = async instanceId => {
  return new Promise((resolve, reject) => {
    exec(`aws ec2 terminate-instances --output json --instance-ids ${instanceId}`, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(JSON.parse(stdout));
      }
    });
  });
};
