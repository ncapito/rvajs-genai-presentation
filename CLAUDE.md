# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a presentation repository demonstrating how GenAI transforms application development through three progressive demos. Each demo contrasts **before** (traditional approach) and **after** (GenAI approach) scenarios.

**Presentation Theme**: Teaching developers to leverage GenAI as a powerful tool through practical before/after comparisons.

**Target Duration**: ~60 minutes total
- Demo 1: 20 minutes (TODO/Task App with Natural Language Querying)
- Demo 2: 15-20 minutes (Receipt Parsing with Vision)
- Demo 3: 20 minutes (Email Personalization with RAG)

## Tech Stack (Consistent Across All Demos)

- **Frontend**: Angular
- **Backend**: Node.js + Express
- **Schema Validation**: Zod (critical for structured LLM outputs)
- **LLM Provider**: Azure OpenAI (via Foundry)
- **AI Framework**: LangChain.js v1
- **Database**: Mock JSON data (optional Cosmos DB)
- **Search**: AI Search (optional)

**Demo-Specific**:
- Demo 2: Claude Vision API for image parsing
- Demo 3: Vector store (in-memory) for RAG, optional DALL-E 3 for meme generation

## Project Structure

```
/demo1-tasks/          - Natural language query parsing demo
  PLAN.md              - Comprehensive planning document

/demo2-receipts/       - Vision + structured output parsing demo
  PLAN.md              - Comprehensive planning document

/demo3-email-generator/ - Content personalization with RAG demo
  PLAN.md              - Comprehensive planning document

README.md              - Main overview and presentation flow
```

## Core Concepts Demonstrated

### 1. Schema-Based Structured Outputs (All Demos)
All demos heavily rely on Zod schemas to constrain LLM outputs. This ensures type safety and prevents hallucination/unsafe outputs.

**Pattern used consistently**:
```typescript
// Discriminated unions for handling multiple response states
const ResultSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('success'),
    data: DataSchema
  }),
  z.object({
    status: z.literal('needs_clarification'),
    message: z.string(),
    suggestions: z.array(z.string()).optional()
  }),
  z.object({
    status: z.literal('invalid'),
    reason: z.string()
  })
]);
```

This pattern appears in:
- Demo 1: `QueryResultSchema` (success, needs_clarification, invalid)
- Demo 2: `ReceiptParseResultSchema` (success, partial, not_a_receipt, unreadable)
- Demo 3: Email generation with graceful degradation

### 2. Architectural Progression

**Demo 1**: Single LLM call pattern (simple)
- Use case: Natural language → structured query
- Pattern: `generateObject()` with Zod schema

**Demo 2**: Shows when to use simple vs orchestrated approaches
- Implementation 1 (primary): Single Claude Vision call
- Implementation 2 (teaching): LangChain multi-step chain
- Decision tree: simple task → single call; complex workflow → chain

**Demo 3**: Full LangChain orchestration with RAG
- Multi-step workflow: analyze → retrieve (RAG) → style → generate
- Demonstrates complex AI application architecture

## Key Implementation Patterns

### Prompt Engineering for Safety (Demo 1)
All prompts must include:
- Schema field constraints (only return defined fields)
- Safety rules (reject unsafe requests)
- Clarification handling (ask when ambiguous)
- Date formatting requirements (ISO format)
- Examples for guidance

### Multimodal AI (Demo 2)
Vision + reasoning in single call:
```typescript
const result = await generateObject({
  model: azure('claude-3-5-sonnet'),
  schema: ReceiptParseResultSchema,
  prompt: `Analyze this image and extract receipt data...`,
  image: receiptImage
});
```

Key: Handle multiple response states (success, partial, error) with actionable feedback.

### RAG Integration (Demo 3)
Pattern for pulling dynamic context:
```typescript
const relevantCommentsChain = RunnableLambda.from(async (input) => {
  const query = `Comments mentioning ${input.user.name}`;
  const relevantComments = await commentVectorStore.similaritySearch(query, 3);
  return { ...input, collaborationContext: relevantComments };
});
```

Chain composition: `analyzeActivityChain.pipe(relevantCommentsChain).pipe(generateEmailChain)`

### Graceful Degradation (Demo 3)
Always provide fallbacks for risky features:
```typescript
// Meme generation with feature flag and timeout
if (memeConfig.enabled && userData.preferences.includeMemes) {
  try {
    const memes = await Promise.race([
      generateMemeImages(emailContent.memeSpots),
      timeout(memeConfig.generationTimeout)
    ]);
    return { ...emailContent, images: memes, format: 'html' };
  } catch (error) {
    // Fall back to text-only version
    return { ...emailContent, format: 'text' };
  }
}
```

## Demo-Specific Notes

### Demo 1: Natural Language Query Parsing
**Before**: Complex FilterBuilder UI (100+ lines)
**After**: Single text input (10 lines)

**Live coding focus**: Iteratively build prompt with safety rules
- Start basic, show it breaking
- Add safety rules one by one
- Add examples to guide behavior
- Demonstrate clarification flow (multiple users named "Sarah")

**Key files to reference**:
- QueryResultSchema with discriminated unions
- Prompt template with safety rules and examples

### Demo 2: Receipt Parsing
**Before**: Brittle regex parsing (text-only)
**After**: Claude Vision + structured output (handles images, handwriting)

**Live coding focus**: Add `taxPercentage` field to schema
- Show LLM can compute derived fields
- Update prompt to calculate (tax/subtotal)*100

**WOW moment**: Handwritten receipt parsing (pre-prepare and test!)

**Two implementations to show**:
1. Simple (single call) - primary, production-ready
2. Orchestrated (LangChain) - teaching moment for when to use what

### Demo 3: Email Personalization
**Before**: Static templates (12% open rate)
**After**: Extreme personalization (58%+ open rate)

**Four personas** (same data, wildly different emails):
1. Detail-oriented (Sarah) - comprehensive stats
2. Action-focused (Mike) - brief, direct
3. Inactive/re-engagement (Alex) - motivational
4. Meme-loving developer (Jamie) - humorous (WOW moment)

**Live coding focus**: Add RAG retrieval step for collaboration context
- Show comment data structure
- Add `relevantCommentsChain` to pipeline
- Re-generate email with richer context

**Connection to Demo 1**: This is the email system FOR the task app from Demo 1

## Important Presentation Considerations

### Testing Requirements
1. **Pre-test all demos** before presentation
2. **Have backup screenshots** of all outputs in case of API failures
3. **Test handwritten receipt** (Demo 2) beforehand
4. **Test meme generation** (Demo 3) - decide if live or pre-generated
5. **Verify RAG retrieval** works (Demo 3)

### Risk Mitigation
- API failures: Have screenshots ready
- Meme generation: Text-only is safe default, images are bonus
- Handwritten receipt: Pre-prepare clear photo, test it
- Live coding: Keep simple additions only
- Timing: Practice pacing for 60-minute total

### Sample Data Requirements
**Demo 1**:
- Mock tasks with various assignees, statuses, dates, priorities
- **Critical**: Multiple users with same first name (Sarah Chen, Sarah Williams) for clarification demo

**Demo 2**:
- 3+ printed receipts (grocery, restaurant, retail)
- 1 handwritten receipt (pre-prepared, tested)
- Optional: faded receipt (partial parsing), non-receipt image (error handling)

**Demo 3**:
- 4 user profiles with different preferences
- Task activity data (same for all users)
- Comments/collaboration data for RAG

## Narrative Arc

The demos build on each other:
1. **Demo 1**: Introduces structured outputs + prompt engineering
2. **Demo 2**: Adds vision capabilities, teaches simple vs orchestrated
3. **Demo 3**: Full orchestration with RAG, connects back to Demo 1

**Key message**: Start simple (single call), add orchestration when needed

## When Working in This Codebase

1. **Focus on before/after contrast** - this is the core teaching tool
2. **Prioritize live coding sections** - these are the "aha moments"
3. **Always use Zod schemas** - type safety for LLM outputs is critical
4. **Include discriminated unions** - handle success/clarification/error states
5. **Test with actual data** - mock data should be realistic
6. **Graceful degradation** - always have fallbacks for demos
7. **Keep examples concise** - demos are timed, don't over-engineer

## Learning Outcomes

By the end of the presentation, audience should understand:
- Schema-based LLM output validation (Zod + generateObject)
- Prompt engineering for safety and structure
- When to use simple vs orchestrated approaches
- Multimodal AI capabilities (vision + reasoning)
- LangChain for complex workflows
- RAG patterns for dynamic context
- Graceful degradation strategies
- End-to-end AI application architecture
