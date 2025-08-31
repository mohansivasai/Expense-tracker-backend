import { APIGatewayProxyResult, Context } from 'aws-lambda';

export const handler = async (
  context: Context
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
    },
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'expense-tracker-backend',
      environment: process.env['STAGE'] || 'dev',
      region: process.env['AWS_REGION'] || 'us-east-1',
      lambda: {
        functionName: context.functionName,
        functionVersion: context.functionVersion,
        memoryLimitInMB: context.memoryLimitInMB,
        remainingTimeInMillis: context.getRemainingTimeInMillis(),
      },
    }),
  };
};
