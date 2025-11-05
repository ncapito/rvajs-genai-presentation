# LangChain Demo - 5 Minute Quick Guide

## Setup (Before Demo)
- Make sure `.env` is configured with Azure OpenAI credentials
- Run: `node langchain.demo.js` to test everything works

## Demo Flow (5 Minutes)

### 1. Simple Invoke (30 seconds)
**Show:** Basic model call - simplest way to use LangChain
**Code:** Section 1 in `langchain.demo.js`
**Talk about:**
- Direct model invocation
- Just pass a string, get a response
- `.content` property to extract text

**Live code:**
```javascript
const response = await model.invoke("How are you today?");
console.log(response.content);
```

---

### 2. Batch (1 minute)
**Show:** Process multiple inputs efficiently
**Code:** Section 2 in `langchain.demo.js`
**Talk about:**
- Parallel processing
- More efficient than loops
- Same API, just pass an array

**Live code:**
```javascript
const responses = await model.batch([
  "Question 1",
  "Question 2",
  "Question 3"
]);
```

---

### 3. Streaming (1 minute)
**Show:** Real-time token generation
**Code:** Section 3 in `langchain.demo.js`
**Talk about:**
- Better UX for longer responses
- Stream tokens as they're generated
- Use `for await` to handle chunks

**Live code:**
```javascript
const stream = await model.stream("Tell me a story...");
for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

---

### 4. Prompt Templates (1 minute)
**Show:** Reusable prompts with multiple variables
**Code:** Section 4 in `langchain.demo.js`
**Talk about:**
- Prompts as templates
- Multiple variables
- System + human message structure

**Live code:**
```javascript
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are {tone} assistant"],
  ["human", "{question}"]
]);
```

---

### 5. Structured Output + Chaining (1.5 minutes)
**Show:** Type-safe responses with Zod schemas + chaining
**Code:** Section 5 in `langchain.demo.js`
**Talk about:**
- Structured output parser for type safety
- Zod schema definition
- Chaining with `.pipe()` - composable
- Format instructions automatically injected

**Live code:**
```javascript
const schema = z.object({ keywords: z.array(z.string()) });
const parser = StructuredOutputParser.fromZodSchema(schema);
const chain = prompt.pipe(model).pipe(parser);
```

---

## Quick Tips for Live Demo
1. **Have code ready** - Either copy/paste or have it typed out
2. **Test first** - Run each section individually if needed
3. **Explain the concept** before showing code
4. **Show the output** - Let them see it work in real-time
5. **Keep it simple** - Don't get bogged down in details

## If You Have Extra Time
- Show error handling
- Show temperature adjustments
- Show message history/conversation
- Show different model configurations

## Troubleshooting
- If batch is slow, mention it's making parallel API calls
- If streaming doesn't show, check terminal output settings
- If parser fails, show raw response first, then add parser
