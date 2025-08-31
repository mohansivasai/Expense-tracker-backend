// Test setup file
process.env.NODE_ENV = 'test';
process.env.DYNAMODB_TABLE = 'expense-tracker-backend-test';
process.env.AWS_REGION = 'us-east-1';

// Mock AWS SDK for testing
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('@aws-sdk/util-dynamodb');

// Global test timeout
jest.setTimeout(10000);
