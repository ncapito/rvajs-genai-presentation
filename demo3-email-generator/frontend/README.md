# Demo 3: Email Generator - Frontend

Angular frontend for personalized email generation with side-by-side comparison.

## Features

- **User Persona Selector**: Choose from 4 different user types
- **Single Email Mode**: Generate and view email for one persona
- **Side-by-Side Comparison**: Generate all 4 emails simultaneously to see differences
- **Task Data Display**: Show the same data used for all users
- **Responsive Design**: Works on desktop and mobile

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm start
```

Frontend will be available at `http://localhost:4203`

## Usage

### View Single Email

1. Select a user persona from the grid
2. Click "Generate Email"
3. View the personalized email generated for that user

### Side-by-Side Comparison

1. Click "Side-by-Side Comparison" button
2. Click "Generate All Emails"
3. See all 4 personalized emails displayed together
4. Notice how the same data produces wildly different emails!

## User Personas

### 📊 Sarah Chen (Detail-Oriented)
- Wants comprehensive breakdowns
- Professional tone
- High detail level
- **Result**: Long email with stats, trends, and full context

### ⚡ Mike Rodriguez (Action-Focused)
- Just tell me what to do
- Direct tone
- Low detail level
- **Result**: Brief, bullet-pointed, action-oriented

### 💤 Alex Kumar (Inactive)
- Needs motivation to re-engage
- Encouraging tone
- Medium detail level
- **Result**: Motivational email emphasizing team needs

### 😎 Jamie Taylor (Meme-Loving)
- Appreciates humor and personality
- Casual tone
- Medium detail level
- **Result**: Funny email with meme references and internet culture

## Architecture

### Components

- **AppComponent**: Main component with user selection and email display
- **EmailService**: HTTP service for API communication

### Key Features

1. **Dynamic UI**: User cards with color-coded personas
2. **Real-time Generation**: Loading states and error handling
3. **Comparison View**: Grid layout for side-by-side viewing
4. **Task Data Display**: Collapsible section showing raw data

## API Integration

The frontend communicates with the backend API at `http://localhost:3003`:

- `GET /api/users` - Fetch all user personas
- `POST /api/generate-email` - Generate email for one user
- `POST /api/generate-email-batch` - Generate emails for all users
- `GET /api/task-data` - Fetch task activity data

## Build for Production

```bash
npm run build
```

Built files will be in `dist/demo3-email-generator/`

## Tech Stack

- **Framework**: Angular 19 (Standalone Components)
- **HTTP**: Angular HttpClient
- **Styling**: Custom CSS with responsive design
- **State Management**: Component-level state
