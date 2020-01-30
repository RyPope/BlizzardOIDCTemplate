import { Callback, Context } from 'aws-lambda';
import AWS from 'aws-sdk';
import sendResponse from './CloudFormationSendResponse';

export default async (
  event: any,
  context: Context,
  callback: Callback<any>) => {
  try {
    switch (event.RequestType) {
      case 'Create':
      case 'Update':
        const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

        await cognitoIdentityServiceProvider.updateUserPoolClient({
          UserPoolId: event.ResourceProperties.UserPoolId,
          ClientId: event.ResourceProperties.UserPoolClientId,
          SupportedIdentityProviders: event.ResourceProperties.SupportedIdentityProviders,
          CallbackURLs: [event.ResourceProperties.CallbackURL],
          LogoutURLs: [event.ResourceProperties.LogoutURL],
          AllowedOAuthFlowsUserPoolClient:
            (event.ResourceProperties.AllowedOAuthFlowsUserPoolClient === 'true'),
          AllowedOAuthFlows: event.ResourceProperties.AllowedOAuthFlows,
          AllowedOAuthScopes: event.ResourceProperties.AllowedOAuthScopes,
        }).promise();

        await sendCloudFormationResponse(event, 'SUCCESS', context.logStreamName);
        break;

      case 'Delete':
        await sendCloudFormationResponse(event, 'SUCCESS', context.logStreamName);
        break;
    }

    console.info(`CognitoUserPoolClientSettings Success for request type ${event.RequestType}`);
  } catch (error) {
    console.error(
      `CognitoUserPoolClientSettings Error for request type ${event.RequestType}:`,
      error)
    ;
    await sendCloudFormationResponse(event, 'FAILED', context.logStreamName);
  }
};

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
