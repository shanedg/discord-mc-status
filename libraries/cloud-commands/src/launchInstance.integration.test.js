/**
 * FYI: This is not really a test,
 * this exercises the `launchInstanceFromTemplate()` method
 * and actually launches an instance in the AWS environment.
 */

import { launchInstanceFromTemplate } from './index.js';

launchInstanceFromTemplate()
  .then(launchResult => {
    const instanceId = launchResult.Instances[0].InstanceId;
    console.log('created instanced with Id:', instanceId);
    return launchResult;
  })
  .catch(error => {
    console.log('there was a problem launching the server:', error);
  });

// TODO: clean up resources
