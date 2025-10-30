# Sample Emails Guide

## Overview

The demo now supports **static sample emails** that you can show instantly without waiting for LLM generation. This is perfect for presentations where you want to show consistent results.

## How It Works

Each persona (Sarah, Mike, Alex, Jamie) has **two versions** of sample emails:
- **Text version** - Plain text email
- **HTML version** - Formatted HTML email (for live coding demo)

## UI Features

When you select a user, you'll see three options:

1. **🤖 Generate Email (Live)** - Calls the LLM to generate a new email (slow)
2. **📝 Text Version** - Shows pre-saved text sample (instant)
3. **📧 HTML Version** - Shows pre-saved HTML sample (instant)

The email display will show a badge:
- **📋 Sample Email (Static)** - When viewing a sample
- **🤖 Generated Email (Live)** - When generated fresh

## How to Update Sample Emails

### Step 1: Generate Real Emails

Start the backend server and use the Generate Email feature to create emails for each persona.

### Step 2: Update the Sample Data File

Open: `backend/src/data/sample-emails.ts`

### Step 3: Replace Placeholders

For each persona, replace the placeholder content:

```typescript
// Before (placeholder)
{
  userId: 'sarah',
  format: 'text',
  subject: '[PLACEHOLDER] Weekly Task Summary',
  body: `[PLACEHOLDER - TEXT VERSION FOR SARAH]...`
}

// After (with real content)
{
  userId: 'sarah',
  format: 'text',
  subject: 'Weekly Task Summary - Your Team is Crushing It 📊',
  body: `Hi Sarah,

Here's your detailed weekly breakdown:

Completed Tasks: 12
In Progress: 5
...`
}
```

### Step 4: Update HTML Versions

Do the same for the HTML versions with the generated HTML content.

### Step 5: Test

1. Restart the backend server (it reads the file on startup)
2. Click the "Text Version" or "HTML Version" buttons
3. Verify the content looks correct

## Presentation Strategy

### Before Live Coding (Show Text Versions)

1. Click each persona
2. Show **Text Version** samples
3. Explain: "Same data, different emails based on preferences"
4. Point out the differences (detail level, tone, length)

### During Live Coding (Add HTML + Memes)

1. Show the code that generates HTML
2. Show the meme generation feature
3. Switch to **HTML Version** samples to show the result
4. For Jamie, show the memes embedded

### After Live Coding (Generate Fresh)

1. Use **Generate Email (Live)** to prove it works in real-time
2. This adds credibility and shows the actual LLM in action

## Sample Email Files Location

- **Backend Data**: `/demo3-email-generator/backend/src/data/sample-emails.ts`
- **API Endpoints**:
  - `GET /api/sample-emails` - All samples
  - `GET /api/sample-emails/:userId` - Both versions for a user
  - `GET /api/sample-emails/:userId/:format` - Specific version

## Tips

1. **Keep text versions simple** - These represent the "before" state (pre-HTML/memes)
2. **Make HTML versions impressive** - Show what's possible with rich formatting
3. **Update before presentations** - Generate fresh samples with your latest prompts
4. **Test all personas** - Make sure each one loads correctly
5. **Check meme images** - For Jamie's HTML version, ensure meme URLs work

## Troubleshooting

**Problem**: Sample emails not updating
- **Solution**: Restart the backend server (it caches the file)

**Problem**: HTML not rendering correctly
- **Solution**: Check for proper escaping and valid HTML structure

**Problem**: "Failed to load sample email" error
- **Solution**: Verify the userId in the file matches the user profiles (sarah, mike, alex, jamie)
