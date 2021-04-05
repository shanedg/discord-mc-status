/**
 * FYI: This is not really a test,
 * this exercises the package exports
 * and creates real resources in the AWS environment.
 */

import {
  launchInstanceFromTemplate,
  terminateInstance,
} from './index.js';

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
