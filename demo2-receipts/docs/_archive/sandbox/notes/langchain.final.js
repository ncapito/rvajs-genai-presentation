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

// Define the schema
const keywordSchema = z.object({ 
  keywords: z.array(z.string()) 
});

// Create parser from Zod schema
const outputParser = StructuredOutputParser.fromZodSchema(keywordSchema);

// Create prompt with format instructions
const prompt = ChatPromptTemplate.fromTemplate(
  "You are a keyword extractor. Extract the keywords from the following text: {input}\n\n{format_instructions}"
);

// Create the chain
const chain = prompt
    .pipe(model)
    .pipe(outputParser);

// Invoke the chain with format instructions included
const response = await chain.invoke({
  input: "Make sure your .env file has AZURE_OPENAI_DEPLOYMENT_NAME set to your Azure deployment name (e.g., 'gpt-4o'). If it's not set, the code defaults to 'gpt-4o'.",
  format_instructions: outputParser.getFormatInstructions(),
});

// Response is already parsed by the parser, so it's the object directly
console.log(response);