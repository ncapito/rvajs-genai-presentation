import { AzureChatOpenAI } from '@langchain/openai';
import { AzureOpenAI } from "openai";
import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'AZURE_OPENAI_API_KEY',
  'AZURE_OPENAI_ENDPOINT',
  'AZURE_OPENAI_DEPLOYMENT_NAME',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Azure OpenAI configuration for LangChain (main model for content generation)
export const azureLLM = new AzureChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY!,
  azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview',
  temperature: 0.7,
});

// Grok Code Fast model for HTML/code generation tasks
export const codeLLM = new AzureChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY!,
  azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  azureOpenAIApiDeploymentName: process.env.CODE_DEPLOYMENT || process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview',
  temperature: 0.3, // Lower temperature for more deterministic code generation
});

// Azure OpenAI client for direct API calls (e.g., DALL-E)
export const azureImageClient = new AzureOpenAI({
  apiKey: process.env.IMAGE_API_KEY || process.env.AZURE_OPENAI_API_KEY!,
  endpoint: process.env.IMAGE_ENDPOINT_URL  ?? process.env.AZURE_OPENAI_ENDPOINT!,
  apiVersion: process.env.IMAGE_API_VERSION ?? process.env.AZURE_OPENAI_API_VERSION ?? "2024-08-01-preview",
});

// Meme generation configuration
export const memeConfig = {
  enabled: true, // Toggle this for meme generation (ENABLED FOR DEMO!)
  generationTimeout: 3000000, // 3000 seconds (DALL-E can take 10-20s per image)
  fallbackToText: true,
  imageDeployment: process.env.IMAGE_DEPLOYMENT_NAME ?? 'dall-e-3',
};
