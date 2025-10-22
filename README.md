# GenAI Presentation: Before & After

A comprehensive demonstration of how GenAI transforms application development and user experiences.

## 🎯 Presentation Theme
This presentation teaches developers how to leverage GenAI as a powerful new tool in their arsenal. Each demo contrasts **before and after** scenarios, highlighting:
- **User Experience**: How interactions become more natural and intuitive
- **Code Architecture**: Programmatic algorithms vs. LLM-powered solutions
- **Development Approach**: Traditional vs. AI-first thinking

## 📁 Demo Structure

### Demo 1: TODO/Task App - Natural Language Querying
**Duration**: 20 minutes | **Format**: Live demo + live coding

**The Problem**: Traditional query builders are complex, rigid, and frustrating
- Complex UI with dropdowns, date pickers, filters
- Users forced to click through multiple options
- 100+ lines of UI and logic code

**The Solution**: Natural language queries with LLM + Zod schemas
- "Show me overdue tasks assigned to Sarah" → structured query
- Single text input replaces entire query builder UI
- Prompt engineering for safety and schema enforcement

**Key Teaching Points**:
- Schema-based validation with Zod
- Structured outputs from LLMs
- Prompt engineering (safety rules, examples)
- Dramatic UI simplification (100+ lines → 10 lines)

**Live Coding**: Build the prompt iteratively, add safety rules

---

### Demo 2: Smart Receipt Parsing - Vision + Structured Output
**Duration**: 15-20 minutes | **Format**: Live demo + live coding

**The Problem**: Traditional parsing is brittle and text-only
- Regex/rules break on new formats
- Can't handle images at all
- No handwriting support
- High maintenance cost

**The Solution**: Claude Vision API + structured output
- Parse ANY format: grocery, restaurant, retail
- Handle printed AND handwritten receipts
- Extract structured data with Zod schema
- Format-agnostic approach

**Two Implementations**:
1. **Simple**: Single Claude Vision call (primary demo - safe, fast)
2. **Orchestrated**: LangChain multi-step chain (teaching moment)

**Key Teaching Points**:
- Multimodal AI (vision + reasoning)
- When to use simple vs orchestrated approaches
- LangChain value: modularity, observability
- Computed fields (tax percentage calculation)

**Live Coding**: Add tax percentage field to schema
**WOW Moment**: Handwritten receipt parsing

---

### Demo 3: Content Generation - Task App Email Personalization
**Duration**: 20 minutes | **Format**: Live demo + live coding

**The Problem**: Static email templates are boring and ignored
- Same tone/structure for everyone
- Generic, robotic content
- 12% open rate, 2% click rate

**The Solution**: Extreme personalization with LLM orchestration
- Same data → 4 completely different emails
- Personalized by user type, preferences, behavior
- RAG for collaboration context
- LangChain workflow for complex logic

**Four User Personas**:
1. **Detail-Oriented**: Comprehensive stats, breakdowns, trends
2. **Action-Focused**: Brief, direct, action items only
3. **Inactive/Re-engagement**: Motivational, team needs, help options
4. **Meme-Loving Developer**: Humorous, casual, meme references (+ optional image gen)

**Key Teaching Points**:
- Content personalization at scale
- LangChain orchestration (analyze → retrieve → style → generate)
- RAG for dynamic context (pull actual comment text)
- Graceful degradation (meme images with text fallback)
- End-to-end AI app architecture

**Live Coding**: Add RAG retrieval step to pull collaboration context
**WOW Moment**: Meme-loving developer email (text + optional image gen)
**Narrative Arc**: Connects back to Demo 1 task app

---

## 🚀 Getting Started

Each demo folder contains:
- `PLAN.md` - Comprehensive planning document with:
  - Problem statement and objectives
  - Before/After comparisons
  - Technical implementation details
  - Demo flow and timing
  - Live coding sections
  - Risk mitigation strategies
  - Pre-demo checklists

## 📋 Presentation Flow

**Total Time**: ~60 minutes

Demos are ordered by increasing complexity to build audience understanding progressively:

1. **Demo 1** (20 min): Natural language → structured queries
   - Core concept: LLMs + schemas for UI simplification
   - Pattern: Prompt engineering + Zod validation

2. **Demo 2** (15-20 min): Vision + structured output
   - Core concept: Multimodal AI, format agnostic
   - Pattern: Simple vs orchestrated approaches

3. **Demo 3** (20 min): Complex orchestration + personalization
   - Core concept: End-to-end AI application
   - Pattern: LangChain workflows + RAG

**Thematic Progression**:
- Demo 1: Single LLM call pattern
- Demo 2: When to add orchestration
- Demo 3: Full orchestration with RAG

**Narrative Arc**:
- Demo 1: Build task app with natural language querying
- Demo 3: Show email system FOR that same task app
- Full circle: cohesive story

## 🛠️ Tech Stack

**Consistent Across All Demos**:
- **Frontend**: Angular
- **Backend**: Node.js + Express
- **Schema Validation**: Zod
- **LLM Provider**: Azure OpenAI (via Foundry)
- **AI Framework**: LangChain.js v1
- **Database**: Mock JSON data (optional Cosmos DB)
- **Search**: AI Search (optional, if needed)

**Demo-Specific**:
- **Demo 1**: Query parsing with structured outputs
- **Demo 2**: Claude Vision API, optional DALL-E 3
- **Demo 3**: Vector store (in-memory), RAG, optional DALL-E 3

## 📝 Planning Status

✅ **PLANNING COMPLETE**

All three demos have comprehensive planning documents ready:
- ✅ Demo 1: TODO/Task App with NL querying
- ✅ Demo 2: Receipt Parsing with Vision
- ✅ Demo 3: Email Personalization with RAG

**Next Steps**:
1. Review plans and get feedback
2. Begin implementation (start with Demo 1)
3. Pre-test all demos before presentation
4. Prepare backup screenshots/outputs
5. Practice timing and transitions

## 🎓 Learning Outcomes

By the end, audience will understand:
- How LLMs simplify complex UIs
- Prompt engineering for safety and structure
- Schema-based validation with Zod
- When to use simple vs orchestrated approaches
- Multimodal AI capabilities (vision + reasoning)
- LangChain for complex workflows
- RAG for dynamic context retrieval
- Graceful degradation strategies
- End-to-end AI application architecture

## 💡 Key Messages

1. **GenAI is the new tool to learn** - Just like we learned frameworks, we now learn prompt engineering
2. **Before/After contrast is powerful** - Show the pain, then show the transformation
3. **Simplicity often wins** - Don't over-engineer (single call vs chain)
4. **Structure constrains LLMs safely** - Schemas are your friend
5. **Personalization matters** - Same data, different experiences
6. **Always have fallbacks** - Graceful degradation for production

## 🎯 Success Criteria

Audience should leave able to:
- ✅ Use LLMs with structured outputs (Zod + generateObject)
- ✅ Apply prompt engineering techniques
- ✅ Decide when to use simple vs orchestrated approaches
- ✅ Integrate multimodal AI (vision)
- ✅ Build LangChain workflows
- ✅ Implement RAG patterns
- ✅ Design AI-first applications

## 🔗 Quick Links

- [Demo 1 Plan](./demo1-tasks/PLAN.md) - TODO/Task App
- [Demo 2 Plan](./demo2-receipts/PLAN.md) - Receipt Parsing
- [Demo 3 Plan](./demo3-email-generator/PLAN.md) - Email Personalization

---

**Ready to start implementing? Begin with Demo 1!**
