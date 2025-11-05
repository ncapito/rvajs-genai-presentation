/*Quick Answer (What to Say):
LangChain:

"A JavaScript/Python framework that gives you pre-built patterns for AI workflows. Think of it like Express for web servers - you could build it yourself, but this saves time."

Azure AI Foundry:

"Microsoft's enterprise platform for AI. Gives you model access (Claude, GPT-4, Llama), infrastructure, security, compliance, and monitoring in one place. Think of it like AWS, but for AI."*/





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

// ============================================================================
// 1. SIMPLE INVOKE - Basic model call
// ============================================================================
console.log("\n=== 1. SIMPLE INVOKE ===");
const simpleResponse = await model.invoke("How are you today?");
console.log(simpleResponse.content);

// ============================================================================
// 2. BATCH - Process multiple inputs at once
// ============================================================================
console.log("\n=== 2. BATCH - Process multiple inputs ===");
const batchInputs = [
  "What is the capital of France?",
  "What is the capital of Japan?",
  "What is the capital of Australia?"
];

const batchResponses = await model.batch(batchInputs);
batchResponses.forEach((response, i) => {
  console.log(`Q${i + 1}: ${batchInputs[i]}`);
  console.log(`A${i + 1}: ${response.content}\n`);
});

// ============================================================================
// 3. STREAMING - Real-time token generation
// ============================================================================
console.log("\n=== 3. STREAMING - Real-time output ===");
console.log("Streaming response:");
const stream = await model.stream("Tell me a short story about AI in 2 sentences.");
for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
console.log("\n"); // New line after streaming


// ============================================================================
// 4. SIMPLE CHAIN - Connecting prompts and model
// ============================================================================
console.log("\n=== 4. SIMPLE CHAIN - Basic prompt + model ===");

// Create a simple prompt template
const simplePrompt = ChatPromptTemplate.fromTemplate(
  "Write a {tone} explanation of {topic} in one sentence."
);

// Create a chain by connecting the prompt to the model
const simpleChain = simplePrompt.pipe(model);

// Use the chain
const chainResponse = await simpleChain.invoke({
  tone: "friendly",
  topic: "artificial intelligence"
});

console.log("Chain result:", chainResponse.content);


// ============================================================================
// 5. PROMPT TEMPLATES - Reusable prompts with variables
// ============================================================================
console.log("\n=== 5. PROMPT TEMPLATES - Multiple variables ===");
const multiVarPrompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant that {tone} explains {topic}."],
  ["human", "{question}"]
]);

const formattedPrompt = await multiVarPrompt.formatMessages({
  tone: "clearly and concisely",
  topic: "LangChain",
  question: "What is LangChain?"
});

const templateResponse = await model.invoke(formattedPrompt);
console.log(templateResponse.content);

// ============================================================================
// 6. STRUCTURED OUTPUT + CHAINING - Type-safe responses
// ============================================================================
console.log("\n=== 6. STRUCTURED OUTPUT + CHAINING ===");
const keywordSchema = z.object({ 
  keywords: z.array(z.string()) 
});

const outputParser = StructuredOutputParser.fromZodSchema(keywordSchema);

const prompt = ChatPromptTemplate.fromTemplate(
  "Extract keywords from: {input}\n\n{format_instructions}"
);

const chain = prompt
    .pipe(model)
    .pipe(outputParser);

const structuredResponse = await chain.invoke({
  input: "LangChain makes it easy to build LLM applications with structured outputs",
  format_instructions: outputParser.getFormatInstructions(),
});

console.log(structuredResponse); // Already parsed as an object!
