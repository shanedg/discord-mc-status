/**
 * FYI: This is not really a test,
 * this exercises the package exports
 * and creates real resources in the AWS environment.
 */

import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import path, { dirname } from 'path';

import {
  describeInstance,
  launchInstanceFromTemplate,
  launchInstanceFromTemplateWithUserData,
  terminateInstance,
} from './index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

launchInstanceFromTemplate()
  .then(launchResult => {
    const instanceId = launchResult.Instances[0].InstanceId;
    console.log('created instanced with Id:', instanceId);
    return instanceId;
  })
  .catch(error => {
    console.log('there was a problem launching the server:', error);
  })
  .then(instanceId => {
    return terminateInstance(instanceId);
  })
  .catch(error => {
    console.log('there was a problem terminating the server:', error);
    console.log('some resources may need to be cleaned up manually!');
  })
  .then(terminationResult => {
    console.log('terminated instance:', terminationResult);
  });

const newUserDataPath = path.join(__dirname, '..', '..', '..', 'apps/discord-bot/src', 'user-data-new.sh');
const newUserData = readFileSync(newUserDataPath, { encoding: 'utf-8' });

// launch new test world
launchInstanceFromTemplateWithUserData({
  userData: newUserData,
  worldName: 'new-test-world',
})
  .then(launchResult => {
    const {
      InstanceId,
    } = launchResult.Instances[0];
    console.log('created instanced with Id:', InstanceId);
    return InstanceId;
  })
  .then(InstanceId => {
    return describeInstance(InstanceId);
  })
  .then(instanceDescription => {
    const { InstanceId, PublicDnsName, PublicIpAddress } = instanceDescription.Reservations[0].Instances[0];
    console.log('public DNS:', PublicDnsName);
    console.log('public IP:', PublicIpAddress);

    return {
      InstanceId,
      PublicDnsName,
      PublicIpAddress,
    };
  })
  .catch(error => {
    console.log('there was a problem launching the server:', error);
  })
  .then(({ InstanceId }) => {
    return terminateInstance(InstanceId);
  })
  .catch(error => {
    console.log('there was a problem terminating the server:', error);
    console.log('some resources may need to be cleaned up manually!');
  })
  .then(terminationResult => {
    console.log('terminated instance:', terminationResult);
  });

const existingUserDataPath = path.join(__dirname, '..', '..', '..', 'apps/discord-bot/src', 'user-data-existing.sh');
const existingUserData = readFileSync(existingUserDataPath, { encoding: 'utf-8' });

// launch existing test world
launchInstanceFromTemplateWithUserData({
  userData: existingUserData,
  worldName: 'this-is-a-test',
})
  .then(launchResult => {
    const {
      InstanceId,
    } = launchResult.Instances[0];
    console.log('created instanced with Id:', InstanceId);
    return InstanceId;
  })
  .then(InstanceId => {
    return describeInstance(InstanceId);
  })
  .then(instanceDescription => {
    const { InstanceId, PublicDnsName, PublicIpAddress } = instanceDescription.Reservations[0].Instances[0];
    console.log('public DNS:', PublicDnsName);
    console.log('public IP:', PublicIpAddress);

    return {
      InstanceId,
      PublicDnsName,
      PublicIpAddress,
    };
  })
  .catch(error => {
    console.log('there was a problem launching the server:', error);
  })
  .then(({ InstanceId }) => {
    return terminateInstance(InstanceId);
  })
  .catch(error => {
    console.log('there was a problem terminating the server:', error);
    console.log('some resources may need to be cleaned up manually!');
  })
  .then(terminationResult => {
    console.log('terminated instance:', terminationResult);
  });
