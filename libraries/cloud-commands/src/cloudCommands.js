import { exec } from 'child_process';

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
    exec(`aws ec2 associate-address --output json --instance-id ${instanceId} --public-ip ${publicIP} --allow-reassociation`, (error, stdout, stderr) => {
      if (error) {
        console.log(`There was a problem associating elastic IP ${publicIP} with instance ${instanceId}`);
        reject(error);
      }

      console.log(stderr);
      resolve(JSON.parse(stdout));
    });
  });
};

/**
 * Run an AWS EC2 instance from a predefined launch template.
 * @param {string} [templateId] Id of an EC2 launch template
 * @returns {Promise<any>} Output of the aws-cli command in JSON format.
 */
export const launchInstanceFromTemplate = async (templateId = 'lt-0b091f225fe894a12') => {
  return new Promise((resolve, reject) => {
    // https://awscli.amazonaws.com/v2/documentation/api/latest/reference/index.html#cli-aws
    // https://awscli.amazonaws.com/v2/documentation/api/latest/reference/ec2/run-instances.html
    exec(`aws ec2 run-instances --output json --launch-template LaunchTemplateId=${templateId}`, (error, stdout, stderr) => {
      if (error) {
        console.log(`There was a problem launching an EC2 instance from template with Id ${templateId}:`, error);
        reject(error);
      }
      console.log(stderr);
      resolve(JSON.parse(stdout));
    });
  });
};
