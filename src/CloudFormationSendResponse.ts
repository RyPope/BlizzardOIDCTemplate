import axios from 'axios';

interface SendRequest {
  ResponseStatus: string;
  StackId: string;
  RequestId: string;
  LogicalResourceId: string;
  ResponseData: any;
  ResponseURL: string;
}

export default async (
  request: SendRequest,
  logStreamName: string) => {
  const reason =
  request.ResponseStatus === 'FAILED'
    ? ('See the details in CloudWatch Log Stream: ' + logStreamName)
    : undefined;

  const responseBody = JSON.stringify({
    Status: request.ResponseStatus,
    Reason: reason,
    PhysicalResourceId: logStreamName,
    StackId: request.StackId,
    RequestId: request.RequestId,
    LogicalResourceId: request.LogicalResourceId,
    Data: request.ResponseData,
  });

  const responseOptions = {
    headers: {
      'content-type': '',
      'content-length': responseBody.length,
    },
  };

  console.info('Response body:\n', responseBody);

  try {
    await axios.put(request.ResponseURL, responseBody, responseOptions);

    console.info('CloudFormationSendResponse Success');
  } catch (error) {
    console.error('CloudFormationSendResponse Error:');

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(error.response.data);
      console.error(error.response.status);
      console.error(error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.error(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error', error.message);
    }

    console.error(error.config);

    throw new Error('Could not send CloudFormation response');
  }
};
