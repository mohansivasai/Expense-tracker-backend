#!/bin/bash

# Expense Tracker Backend Deployment Script
# Usage: ./deploy.sh [dev|prod]

set -e

# Default to dev if no stage specified
STAGE=${1:-dev}
REGION=${2:-us-east-1}

echo "🚀 Deploying Expense Tracker Backend to $STAGE environment in $REGION..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if Serverless Framework is installed
if ! command -v serverless &> /dev/null; then
    echo "❌ Serverless Framework is not installed. Installing globally..."
    npm install -g serverless
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building TypeScript project..."
npm run build

# Deploy using Serverless Framework
echo "🚀 Deploying to AWS..."
serverless deploy --stage $STAGE --region $REGION

echo "✅ Deployment completed successfully!"
echo "🌐 API Gateway URL will be displayed above"
echo "📊 Check CloudFormation console for deployment details"

# Optional: Display the API URL
if [ "$STAGE" = "dev" ]; then
    echo "🔍 To get the API URL, run:"
    echo "   aws apigateway get-rest-apis --region $REGION"
fi
