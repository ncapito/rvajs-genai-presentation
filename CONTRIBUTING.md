# Contributing to GenAI Learning Repository

Thank you for your interest in contributing! This document provides guidelines for setting up your development environment and contributing to the project.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Git** for version control
- **Code editor** (VS Code recommended)

### API Access Requirements

You'll need API keys for the AI services. See [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) for comprehensive setup instructions.

**Quick Links:**
- **Azure AI Foundry** (recommended): [Setup Guide](./INFRASTRUCTURE.md#-azure-ai-foundry-setup)
- **Direct APIs**: [Alternative Setup](./INFRASTRUCTURE.md#-direct-api-setup-without-azure)
- **Cost Estimates**: [Pricing Guide](./INFRASTRUCTURE.md#-cost-estimates)

#### Azure AI Foundry (Recommended for Demos 1 & 3)
- Provides access to GPT-4, embeddings, FLUX-1.1-pro, and more
- Single platform for multiple AI models
- [Complete setup guide](./INFRASTRUCTURE.md#-azure-ai-foundry-setup)

#### Anthropic Claude (Required for Demo 2)
- Direct API for Claude 3.5 Sonnet with vision
- [Get API key](https://console.anthropic.com/)

### Repository Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/genai_presentation.git
   cd genai_presentation
   ```

2. **Install dependencies** for the demo you want to work on:
   ```bash
   # Demo 1
   cd demo1-tasks/backend && npm install
   cd ../frontend && npm install

   # Demo 2
   cd demo2-receipts/backend && npm install
   cd ../frontend && npm install

   # Demo 3
   cd demo3-email-generator/backend && npm install
   cd ../frontend && npm install
   ```

## 🔑 API Key Configuration

> 💡 **For detailed infrastructure setup, model deployments, and alternatives, see [INFRASTRUCTURE.md](./INFRASTRUCTURE.md)**

### Demo 1: Natural Language Querying

1. Navigate to backend directory:
   ```bash
   cd demo1-tasks/backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your Azure OpenAI credentials:
   ```env
   AZURE_OPENAI_API_KEY=your_api_key_here
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
   AZURE_OPENAI_API_VERSION=2024-02-15-preview
   PORT=3000
   ```

### Demo 2: Receipt Parsing

1. Navigate to backend directory:
   ```bash
   cd demo2-receipts/backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your Anthropic API key:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_key_here
   PORT=3001
   ```

### Demo 3: Email Personalization

1. Navigate to backend directory:
   ```bash
   cd demo3-email-generator/backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your Azure OpenAI credentials:
   ```env
   AZURE_OPENAI_API_KEY=your_api_key_here
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
   AZURE_OPENAI_API_VERSION=2024-02-15-preview

   # Optional: For meme generation
   AZURE_OPENAI_DALLE_DEPLOYMENT_NAME=dall-e-3
   MEME_GENERATION_ENABLED=false

   PORT=3002
   ```

## 🏃 Running the Demos

### Demo 1: Tasks

**Backend** (Terminal 1):
```bash
cd demo1-tasks/backend
npm run dev
```

**Frontend** (Terminal 2):
```bash
cd demo1-tasks/frontend
npm start
```

Open http://localhost:4200

### Demo 2: Receipts

**Backend** (Terminal 1):
```bash
cd demo2-receipts/backend
npm run dev
```

**Frontend** (Terminal 2):
```bash
cd demo2-receipts/frontend
npm start
```

Open http://localhost:4201

### Demo 3: Email Generator

**Backend** (Terminal 1):
```bash
cd demo3-email-generator/backend
npm run dev
```

**Frontend** (Terminal 2):
```bash
cd demo3-email-generator/frontend
npm start
```

Open http://localhost:4202

### Quick Start Scripts

Each demo has a `start-servers.sh` script to launch both frontend and backend:

```bash
cd demo1-tasks
./start-servers.sh
```

## 🧪 Testing

### Testing API Endpoints

Each demo backend includes test scripts:

**Demo 1**:
```bash
cd demo1-tasks/backend
./test-api.sh
```

**Demo 2**:
```bash
# Test simple vision parsing
curl -X POST http://localhost:3001/api/receipts/parse-simple \
  -F "receipt=@sample-receipts/receipt.jpg"

# Test chain-based parsing
curl -X POST http://localhost:3001/api/receipts/parse-chain \
  -F "receipt=@sample-receipts/receipt.jpg"
```

**Demo 3**:
```bash
# Test email generation for different personas
curl -X POST http://localhost:3002/api/emails/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": "sarah"}'

curl -X POST http://localhost:3002/api/emails/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": "mike"}'
```

## 🎨 Code Style

### TypeScript/JavaScript

- Use **TypeScript** for all backend code
- Use **ES6+ features** (async/await, arrow functions)
- Follow **functional programming** patterns where appropriate
- Use **Zod schemas** for all LLM inputs/outputs

### Formatting

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Use them
- **Trailing commas**: Include them

### Example:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email()
});

export async function getUser(id: string) {
  const user = await fetchUser(id);
  return UserSchema.parse(user);
}
```

## 📝 Commit Guidelines

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **refactor**: Code refactoring
- **test**: Adding tests
- **chore**: Maintenance tasks

### Examples

```bash
feat(demo1): add clarification flow for ambiguous queries

Implements discriminated union handling for queries where
multiple users share the same first name.

Related to issue #123
```

```bash
fix(demo2): handle missing tax field in receipts

Gracefully degrades to partial result when tax field
is not present in the image.
```

```bash
docs(demo3): add RAG implementation guide

Provides step-by-step instructions for implementing
vector store retrieval.
```

## 🤝 Contributing Process

### 1. Find or Create an Issue

- Check existing issues for something you'd like to work on
- If adding a new feature, create an issue first to discuss it

### 2. Fork and Branch

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/your-username/genai_presentation.git
cd genai_presentation

# Create a feature branch
git checkout -b feature/your-feature-name
```

### 3. Make Changes

- Write code following the style guidelines
- Test your changes thoroughly
- Update documentation if needed
- Add comments for complex logic

### 4. Test Your Changes

```bash
# Run the demo
cd demo1-tasks/backend
npm run dev

# Test API endpoints
./test-api.sh

# Check for errors in browser console
```

### 5. Commit and Push

```bash
git add .
git commit -m "feat(demo1): add your feature"
git push origin feature/your-feature-name
```

### 6. Create Pull Request

- Go to GitHub and create a PR from your branch
- Fill out the PR template with:
  - What changed
  - Why it changed
  - How to test it
- Link related issues

### 7. Code Review

- Address review comments
- Update your PR as needed
- Once approved, it will be merged

## 🐛 Reporting Issues

### Bug Reports

Include:
- **Description**: What happened vs what you expected
- **Steps to reproduce**: Detailed steps
- **Environment**: OS, Node version, browser
- **Error messages**: Full error logs
- **Screenshots**: If applicable

Example:

```markdown
**Description**
Demo 1 returns empty results for valid queries

**Steps to Reproduce**
1. Start backend: `cd demo1-tasks/backend && npm run dev`
2. Open frontend at http://localhost:4200
3. Enter query: "show me tasks"
4. Click search
5. No results are returned

**Environment**
- OS: macOS 14.0
- Node: v20.10.0
- Browser: Chrome 120

**Error in Console**
```
TypeError: Cannot read property 'tasks' of undefined
at TaskService.search (task.service.ts:45)
```

**Additional Context**
Works fine with other queries like "overdue tasks"
```

### Feature Requests

Include:
- **Problem**: What problem does this solve?
- **Proposed solution**: How should it work?
- **Alternatives**: Other approaches considered
- **Demo**: Which demo(s) does this affect?

## 📚 Resources for Contributors

### Learning Resources

- [LangChain.js Documentation](https://js.langchain.com/docs)
- [Zod Schema Validation](https://zod.dev)
- [Azure OpenAI Best Practices](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/best-practices)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

### Architecture Documentation

Each demo has detailed architecture docs:
- `demo1-tasks/docs/ARCHITECTURE.md`
- `demo2-receipts/docs/ARCHITECTURE-SIMPLE.md`
- `demo2-receipts/docs/ARCHITECTURE-FULL.md`
- `demo3-email-generator/backend/docs/ARCHITECTURE.md`

### Reference Implementations

Complete working code is available in each demo:
- Review `backend/src/` for reference implementations
- Check `LEARN.md` files for step-by-step exercises

## 🔒 Security

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities.

Instead, email security concerns to: [your-email@example.com]

### API Key Safety

- ✅ **DO**: Use `.env` files (gitignored)
- ✅ **DO**: Use environment variables
- ✅ **DO**: Rotate keys regularly
- ❌ **DON'T**: Commit API keys to git
- ❌ **DON'T**: Share keys in issues/PRs
- ❌ **DON'T**: Hardcode credentials

## 💰 Cost Considerations

### API Usage Costs

Be mindful of API costs when developing:

**Azure OpenAI**:
- GPT-4: ~$0.03/1K tokens (input), ~$0.06/1K tokens (output)
- DALL-E 3: ~$0.04/image (1024x1024)

**Anthropic Claude**:
- Claude 3.5 Sonnet: ~$3/1M tokens (input), ~$15/1M tokens (output)

### Development Tips

1. **Use caching** for repeated queries during development
2. **Mock responses** in tests instead of real API calls
3. **Set budgets** in your cloud console
4. **Monitor usage** regularly

### Testing Without API Calls

Create mock services for local testing:

```typescript
// backend/src/services/llm.service.mock.ts
export const mockLLMService = {
  async parseQuery(query: string) {
    return {
      status: 'success',
      query: { assignee: 'sarah', status: 'todo' }
    };
  }
};
```

## 📞 Getting Help

Stuck? Here's where to get help:

1. **Check LEARN.md files** in each demo
2. **Review existing issues** on GitHub
3. **Read architecture docs** in `docs/` folders
4. **Ask in discussions** (GitHub Discussions)
5. **Join community** (Discord links in README)

## 🎓 Learning Path for Contributors

### Beginner Contributors

Start with:
1. Documentation improvements
2. Adding test cases
3. Fixing typos or formatting
4. Improving error messages

### Intermediate Contributors

Move to:
1. Adding prompt examples
2. Improving Zod schemas
3. Enhancing UI components
4. Adding new test queries

### Advanced Contributors

Tackle:
1. New demo features
2. Architecture improvements
3. Performance optimizations
4. New AI patterns/techniques

## ✅ Checklist Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Commit messages follow format
- [ ] No API keys in code
- [ ] PR description is complete
- [ ] Linked related issues
- [ ] Tested on local environment

## 🙏 Thank You!

Your contributions help make this learning resource better for everyone. Whether you're fixing typos, adding features, or improving documentation - every contribution matters!

---

**Questions?** Open an issue or start a discussion on GitHub.
