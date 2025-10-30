# Live Coding Flow - Visual Guide

## 📁 File Structure for Live Coding

```
backend/src/chains/
├── index.ts                     ⚙️  CURRENT: Working version (WITH RAG)
├── index.COMPLETE.ts            💾  BACKUP: Complete reference
├── index.DEMO_START.ts          🎬  STARTING POINT: Demo version (NO RAG)
├── relevant-comments.chain.ts   📖  SHOW: RAG chain to add
├── analyze-activity.chain.ts    ✅  (unchanged)
├── determine-style.chain.ts     ✅  (unchanged)
└── generate-email.chain.ts      ✅  (unchanged)
```

## 🔄 Demo Workflow

```
┌─────────────────────────────────────────────────────────┐
│  BEFORE DEMO                                            │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ cp index.DEMO_START.ts│
            │    → index.ts         │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  npm run dev          │
            │  (restart server)     │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Test "before" email  │
            │  (no RAG context)     │
            └───────────┬───────────┘
                        │
┌───────────────────────┴──────────────────────────┐
│  DURING DEMO                                     │
└──────────────────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Show index.ts        │
            │  (without RAG)        │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Generate email       │
            │  (generic comments)   │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Show comments.json   │
            │  (the data)           │
            └───────────┬───────────┘
                        │
                        ▼
            ┌────────────────────────┐
            │  Show relevant-        │
            │  comments.chain.ts     │
            │  (explain RAG)         │
            └───────────┬────────────┘
                        │
                        ▼
            ┌────────────────────────┐
            │  LIVE CODE:            │
            │  Add 4 lines to        │
            │  index.ts              │
            │  1. import             │
            │  2. create             │
            │  3. pipe               │
            │  4. export             │
            └───────────┬────────────┘
                        │
                        ▼
            ┌────────────────────────┐
            │  Save file             │
            │  (tsx auto-reloads)    │
            └───────────┬────────────┘
                        │
                        ▼
            ┌────────────────────────┐
            │  Generate email        │
            │  (with RAG context!)   │
            └───────────┬────────────┘
                        │
┌───────────────────────┴──────────────────────────┐
│  AFTER DEMO                                      │
└──────────────────────────────────────────────────┘
                        │
                        ▼
            ┌────────────────────────┐
            │  cp index.COMPLETE.ts  │
            │  → index.ts            │
            │  (restore)             │
            └────────────────────────┘
```

## 🎯 The 4 Additions (What You Type)

```typescript
┌─────────────────────────────────────────────────────────┐
│  ADDITION 1: Import                                     │
│  Line ~3                                                │
└─────────────────────────────────────────────────────────┘
import { createRelevantCommentsChain } from './relevant-comments.chain.js';
                                        ↑
                                   Type this!

┌─────────────────────────────────────────────────────────┐
│  ADDITION 2: Create                                     │
│  Line ~52 (inside createFullEmailChain)                 │
└─────────────────────────────────────────────────────────┘
const relevantCommentsChain = createRelevantCommentsChain(vectorStore);
      ↑─────────────────────────────────────────────────────────────↑
                            Type this!

┌─────────────────────────────────────────────────────────┐
│  ADDITION 3: Pipe                                       │
│  Line ~59 (in the pipeline)                             │
└─────────────────────────────────────────────────────────┘
return (
  analyzeActivityChain
    .pipe(relevantCommentsChain)  // ← Type this line!
    .pipe(determineStyleChain)
    .pipe(generateEmailChain)
);

┌─────────────────────────────────────────────────────────┐
│  ADDITION 4: Export                                     │
│  Line ~68 (in exports)                                  │
└─────────────────────────────────────────────────────────┘
export {
  analyzeActivityChain,
  createRelevantCommentsChain,  // ← Type this line!
  determineStyleChain,
  generateEmailChain,
};
```

## 📊 Before vs After

### Before RAG
```
Pipeline: [Analyze] → [Style] → [Generate]
                                    ↓
Email: "You have comments on Task #123"
       ↑
   Generic mention, no details
```

### After RAG
```
Pipeline: [Analyze] → [RAG] → [Style] → [Generate]
                       ↑
               [Vector Store]
                       ↓
Email: "Sarah commented: 'Nick, need your input
       on the session handling approach'"
       ↑
   Actual comment content!
```

## ⏱️ Timing Breakdown

```
0:00 ├─ Show index.ts without RAG
     │
1:00 ├─ Generate "before" email
     │
2:00 ├─ Show comments.json data
     │
3:00 ├─ Show relevant-comments.chain.ts
     │
4:00 ├─ Explain semantic search
     │
5:00 ├─ Start typing
     │  ├─ Import (15 sec)
     │  ├─ Create (15 sec)
     │  ├─ Pipe (15 sec)
     │  └─ Export (15 sec)
     │
6:00 ├─ Save and watch reload
     │
7:00 ├─ Generate "after" email
     │
8:00 ├─ Point out RAG content
     │
9:00 └─ Wrap up and Q&A
```

## 🛡️ Emergency Paths

### If Typing Fails
```
┌─────────────────┐
│  Typing errors  │
└────────┬────────┘
         │
         ▼
┌────────────────────┐
│ Open CHEATSHEET.md │
│ Copy-paste snippet │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Continue demo      │
└────────────────────┘
```

### If Server Crashes
```
┌─────────────────┐
│  Server crash   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ cp index.COMPLETE.ts    │
│ → index.ts              │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ npm run dev             │
│ (restart)               │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Continue from working   │
│ version                 │
└─────────────────────────┘
```

### If Generation Fails
```
┌─────────────────┐
│  LLM timeout    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Show screenshot of      │
│ successful "after" email│
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ "Here's what it         │
│  generated earlier..."  │
└─────────────────────────┘
```

## 🎤 Narration Guide

```
OPENING
"Right now our emails mention comments but don't show WHAT was said.
Let's add RAG to fix that. This will take about 2 minutes."

SHOWING DATA
"Here are the comments in our system. Sarah said 'Need your input...'
These are embedded in our vector store at startup."

SHOWING RAG CHAIN
"This chain does semantic search - not just keyword matching.
It finds the 5 most relevant comments and adds them to context."

TYPING
"I'm importing the RAG chain... creating it with the vector store...
piping it into the pipeline... and exporting it."

AFTER RELOAD
"Watch the terminal - tsx is recompiling. Let's generate an email..."

SHOWING RESULT
"NOW look at this! It includes Sarah's actual comment about session
handling. That came from the vector store via semantic search.
That's RAG - retrieve, augment, generate."
```

## 📚 Files to Reference

| Moment | File to Show | Why |
|--------|--------------|-----|
| Before state | `index.ts` (DEMO_START) | Pipeline without RAG |
| Show data | `comments.json` | Source data for RAG |
| Explain RAG | `relevant-comments.chain.ts` | How RAG works |
| Live code | `index.ts` (typing) | Adding RAG |
| Reference | `index.COMPLETE.ts` | If you need to peek |
| Quick tips | `CHEATSHEET.md` | During demo |

## ✅ Success Checklist

Before you start:
- [ ] `index.DEMO_START.ts` copied to `index.ts`
- [ ] Server restarted and running
- [ ] "Before" email generated (no RAG)
- [ ] Files open in editor tabs
- [ ] Cheat sheet printed or on second monitor
- [ ] Screenshot of "after" email ready

During demo:
- [ ] Audience sees "before" email
- [ ] Audience sees comment data
- [ ] Audience understands RAG concept
- [ ] You type the 4 additions clearly
- [ ] Server auto-reloads visibly
- [ ] Audience sees "after" email with RAG content

After demo:
- [ ] Restored `index.COMPLETE.ts` to `index.ts`
- [ ] Server still running correctly

## 🎯 The Payoff

**Audience Takeaway:**
"Adding RAG is simple - just a few lines to integrate semantic search.
This pattern works for any data - docs, code, messages, whatever you
need to search and inject into prompts. This is how you build scalable
AI systems that don't hit context limits."

---

**You've got this! Follow the flow, stay calm, and enjoy the demo!** 🚀
