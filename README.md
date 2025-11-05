# GenAI Application Development - Learning Repository

A hands-on learning resource demonstrating how to build production-ready GenAI applications through three progressive demos.

## 🎯 What You'll Learn

This repository teaches you how to:
- **Transform UIs** with natural language interfaces
- **Process documents** using multimodal AI (vision + text)
- **Personalize content** at scale with RAG and orchestration
- **Design production systems** with graceful degradation
- **Choose the right patterns** (simple vs orchestrated approaches)

## 📚 Demo Overview

### Demo 1: Natural Language Task Querying
**Concept**: Replace complex UI with natural language

**What You'll Build**:
- Natural language to structured query parser
- Zod schemas for type-safe validation
- Prompt engineering for safety and clarification
- Discriminated unions for response handling

**Key Pattern**: Single LLM call with structured output

**Time**: 2-3 hours | **Difficulty**: Beginner

[Start Learning →](./demo1-tasks/LEARN.md)

---

### Demo 2: Receipt Parsing with Vision
**Concept**: Process any document format with vision AI

**What You'll Build**:
- Claude Vision integration for image parsing
- Format-agnostic document extraction
- Partial success handling
- Simple vs orchestrated comparison

**Key Pattern**: Multimodal AI with graceful degradation

**Time**: 2-3 hours | **Difficulty**: Intermediate

[Start Learning →](./demo2-receipts/LEARN.md)

---

### Demo 3: Email Personalization with RAG
**Concept**: Generate hyper-personalized content using orchestration

**What You'll Build**:
- Multi-step LangChain workflow
- RAG (Retrieval-Augmented Generation)
- Persona-based content generation
- Optional feature handling (meme generation)

**Key Pattern**: Full orchestration pipeline

**Time**: 4-5 hours | **Difficulty**: Advanced

[Start Learning →](./demo3-email-generator/LEARN.md)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ installed
- **API Access** to either:
  - Azure AI Foundry (recommended - provides access to GPT-4, Claude, and more)
  - Direct APIs: OpenAI + Anthropic
  - See [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) for detailed setup guide
- **Basic knowledge** of:
  - TypeScript/JavaScript
  - Async/await patterns
  - REST APIs

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ncapito/rvajs-genai-presentation.git
   cd rvajs-genai-presentation
   ```

2. **Choose a demo** and follow its LEARN.md:
   - [Demo 1](./demo1-tasks/LEARN.md) - Start here if you're new to GenAI
   - [Demo 2](./demo2-receipts/LEARN.md) - Learn vision AI
   - [Demo 3](./demo3-email-generator/LEARN.md) - Master orchestration

3. **Set up cloud infrastructure** - See [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) for:
   - Azure AI Foundry setup (recommended)
   - Direct API alternatives (OpenAI + Anthropic)
   - Model deployment instructions
   - Cost estimates and free tier options

4. **Start building!** Each demo has step-by-step exercises

## 📖 Learning Path

### Recommended Order

**For Beginners**:
```
Demo 1 → Demo 2 → Demo 3
```

**For Experienced Developers**:
```
Read all LEARN.md files → Pick the demo matching your interests
```

### Concepts by Demo

| Demo | Core Concepts |
|------|---------------|
| **Demo 1** | Structured outputs, Zod schemas, Prompt engineering, Safety rules |
| **Demo 2** | Multimodal AI, Vision prompting, Partial results, Architecture decisions |
| **Demo 3** | LangChain orchestration, RAG patterns, Persona mapping, Production patterns |

## 🏗️ Architecture Patterns

### Pattern Progression

```
Demo 1: Single LLM Call
   User Input → LLM → Structured Output

Demo 2: Simple or Orchestrated
   Image → Vision AI → Structured Data
   OR
   Image → Analyze → Extract → Structure

Demo 3: Full Orchestration
   User → Analyze → RAG Retrieve → Style → Generate → Enhance
```

### When to Use What

| Pattern | Use When | Example |
|---------|----------|---------|
| **Single Call** | Task is straightforward, one-step | Demo 1 query parsing |
| **Simple Multi-Step** | Need clear stages, basic workflow | Demo 2 receipt validation |
| **Full Orchestration** | Complex logic, reusable components | Demo 3 personalization |

## 🎓 Key Technologies

- **[LangChain.js](https://js.langchain.com/)** - AI application framework
- **[Zod](https://zod.dev)** - Schema validation for type safety
- **[Azure AI Foundry](https://azure.microsoft.com/en-us/products/ai-services/openai-service)** - Access to GPT-4, Claude, FLUX-1.1-pro, and more
- **[Anthropic Claude](https://www.anthropic.com/)** - Vision AI capabilities (direct API)
- **Angular** - Frontend framework
- **Node.js + Express** - Backend API with SSE for real-time progress
- **TypeScript** - Type-safe development

## 📂 Repository Structure

```
rvajs-genai-presentation/
├── README.md                    # This file
├── INFRASTRUCTURE.md            # Cloud setup, API configuration
├── CONTRIBUTING.md              # Development setup guide
├── CLAUDE.md                    # AI assistant guidance
│
├── demo1-tasks/                 # Natural language querying
│   ├── LEARN.md                 # Learning guide with exercises
│   ├── backend/                 # Node.js API
│   │   └── .env.example         # Environment template
│   ├── frontend/                # Angular UI
│   └── docs/
│       ├── ARCHITECTURE.md      # Technical details
│       └── _archive/            # Presentation materials
│
├── demo2-receipts/              # Receipt parsing with vision
│   ├── LEARN.md                 # Learning guide
│   ├── backend/                 # Vision AI integration
│   │   └── .env.example         # Environment template
│   ├── frontend/                # Upload UI
│   └── docs/
│       ├── ARCHITECTURE-*.md    # Technical details
│       └── _archive/            # Presentation materials
│
└── demo3-email-generator/       # Email personalization
    ├── LEARN.md                 # Learning guide
    ├── backend/                 # LangChain orchestration
    │   └── .env.example         # Environment template
    ├── frontend/                # Email display
    └── docs/
        └── _archive/            # Presentation materials
```

## 🎯 Learning Objectives

By completing all three demos, you'll be able to:

### Technical Skills
- ✅ Implement structured LLM outputs with Zod
- ✅ Build safe prompts with validation and error handling
- ✅ Integrate vision AI for document processing
- ✅ Create multi-step LangChain workflows
- ✅ Implement RAG for dynamic context
- ✅ Design graceful degradation strategies

### Design Decisions
- ✅ Choose between simple vs orchestrated approaches
- ✅ Evaluate when to use RAG vs fine-tuning
- ✅ Balance cost, latency, and accuracy
- ✅ Handle partial successes gracefully
- ✅ Build production-ready error handling

### Real-World Applications
- ✅ Simplify complex UIs with natural language
- ✅ Process unstructured documents at scale
- ✅ Generate personalized content dynamically
- ✅ Build end-to-end GenAI applications
- ✅ Deploy with confidence using fallback strategies

## 💡 Philosophy

### Before & After Mindset

Each demo contrasts **traditional approaches** with **GenAI solutions**:

| Aspect | Traditional | GenAI |
|--------|------------|-------|
| **UI Complexity** | 100+ lines of filters | Single text input |
| **Document Parsing** | Brittle regex, text-only | Vision AI, any format |
| **Content Generation** | Static templates | Hyper-personalized |
| **Maintenance** | Manual updates for changes | Prompt adjustments |
| **User Experience** | Rigid, frustrating | Natural, intuitive |

### Core Principles

1. **Start Simple** - Single LLM call before orchestration
2. **Schema First** - Define structure, constrain outputs
3. **Safety Always** - Validate, sanitize, limit scope
4. **Degrade Gracefully** - Fallbacks for optional features
5. **User-Centric** - Natural interfaces over complex UIs

## 🚀 Going Further

### Next Steps After Completing Demos

1. **Combine Patterns** - Use multiple demos in one application
2. **Add Observability** - Integrate LangSmith tracing
3. **Optimize Costs** - Cache results, use cheaper models where appropriate
4. **Scale Up** - Add database, queueing, rate limiting
5. **Deploy** - Containerize and deploy to cloud

### Challenge Projects

- **Project 1**: Build a document Q&A system (Demo 2 + RAG)
- **Project 2**: Create a smart dashboard (Demo 1 + Demo 3)
- **Project 3**: Design a multi-agent workflow (All demos combined)

## 📚 Additional Resources

### Setup Guides
- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) - Cloud setup, API configuration, cost estimates
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development setup, contribution guidelines

### Official Documentation
- [LangChain.js Docs](https://js.langchain.com/docs)
- [Azure AI Foundry](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Zod Documentation](https://zod.dev)

### Learning Materials
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [RAG Best Practices](https://js.langchain.com/docs/use_cases/question_answering/)
- [Multimodal AI Guide](https://docs.anthropic.com/claude/docs/vision)
- [LangChain Expression Language](https://js.langchain.com/docs/expression_language/)

### Community
- [LangChain Discord](https://discord.gg/langchain)
- [OpenAI Community Forum](https://community.openai.com/)
- [Anthropic Developer Discord](https://discord.gg/anthropic)

## 🆘 Getting Help

1. **Check LEARN.md** - Each demo has troubleshooting sections
2. **Review Reference Code** - Complete implementations are provided
3. **Read Architecture Docs** - Deep dives in `docs/` folders
4. **Open an Issue** - Describe what you're stuck on

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- How to set up your development environment
- Code style guidelines
- How to submit improvements
- How to report issues

## 📝 License

This project is provided as-is for educational purposes.

## ⭐ Acknowledgments

Built to teach practical GenAI application development through hands-on examples.

**Key Technologies**:
- LangChain.js for orchestration
- Azure AI Foundry for GPT-4, embeddings, and image generation
- Anthropic Claude for vision AI
- Zod for type-safe schemas
- SSE for real-time progress updates

---

## 🎬 Ready to Start?

1. **Check Prerequisites** above
2. **Read** [CONTRIBUTING.md](./CONTRIBUTING.md) for setup
3. **Begin with** [Demo 1](./demo1-tasks/LEARN.md)
4. **Build something amazing!** 🚀

---

**Questions?** Open an issue or check the LEARN.md files in each demo folder.

**Want to contribute?** See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.
