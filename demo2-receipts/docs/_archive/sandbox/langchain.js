import { AzureChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config(); 

const model = new AzureChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o",
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview",
  temperature: 0.7,
});

let prompt = "You are "
let userMessage = "How are you today?";


console.log("\n"); // New line after streaming
// Response is already parsed by the parser, so it's the object directly
//console.log(response);
//  process.stdout.write(chunk.content);




var input = "This would be some block of text from the user";