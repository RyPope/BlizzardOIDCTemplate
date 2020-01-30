import { Callback, Context } from 'aws-lambda';
import AWS from 'aws-sdk';
import sendResponse from './CloudFormationSendResponse';

export default async (
  event: any,
  context: Context,
  callback: Callback<any>) => {
  try {
    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

    switch (event.RequestType) {
      case 'Create':
        await cognitoIdentityServiceProvider.createUserPoolDomain({
          UserPoolId: event.ResourceProperties.UserPoolId,
          Domain: event.ResourceProperties.Domain,
        }).promise();
        break;

      case 'Update':
        await deleteUserPoolDomain(
          cognitoIdentityServiceProvider,
          event.OldResourceProperties.Domain,
        );

        await cognitoIdentityServiceProvider.createUserPoolDomain({
          UserPoolId: event.ResourceProperties.UserPoolId,
          Domain: event.ResourceProperties.Domain,
        }).promise();
        break;

      case 'Delete':
        await deleteUserPoolDomain(
            cognitoIdentityServiceProvider,
            event.ResourceProperties.Domain,
          );
        break;
    }

    await sendCloudFormationResponse(event, 'SUCCESS', context.logStreamName);
    console.info(`CognitoUserPoolDomain Success for request type ${event.RequestType}`);
  } catch (error) {
    console.error(`CognitoUserPoolDomain Error for request type ${event.RequestType}:`, error);
    await sendCloudFormationResponse(event, 'FAILED', context.logStreamName);
  }
};

async function deleteUserPoolDomain(cognitoIdentityServiceProvider: any, domain: any) {
  const response = await cognitoIdentityServiceProvider.describeUserPoolDomain({
      Domain: domain,
  }).promise();

  if (response.DomainDescription.Domain) {
    await cognitoIdentityServiceProvider.deleteUserPoolDomain({
      UserPoolId: response.DomainDescription.UserPoolId,
      Domain: domain,
    }).promise();
  }
}

async function sendCloudFormationResponse(
  event: any,
  responseStatus: any,
  logStreamName: string,
  responseData?: any,
) {
  const request = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    ResponseURL: event.ResponseURL,
    ResponseStatus: responseStatus,
    ResponseData: responseData,
  };

  await sendResponse(request, logStreamName);
}
