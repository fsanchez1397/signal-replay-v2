# Signal Recorder v2 - Browser Automation Platform

A full-stack browser automation platform combining Chrome extension recording/replay with a Next.js + Supabase web application for workflow creation, editing, supervised execution, and AI-driven goal transformation.

## 🎯 Features

### Chrome Extension (Manifest V3)
- **Recording Mode**: Capture user interactions across websites
  - Clicks, keystrokes, inputs, scrolls, navigation
  - Dynamic selector generation with fallbacks
  - Event normalization and structured storage

- **Replay Mode**: Execute workflows step-by-step
  - Play, pause, resume, next-step, stop controls
  - React-based popup UI
  - Supervised execution with explicit approval
  - Visual feedback and element highlighting

### Web Application (Next.js + Supabase)
- **Dashboard**: List and manage workflows
- **Workflow Editor**: Create and modify workflows with live Zod validation
- **Live Replay Viewer**: Real-time execution monitoring
  - Step-by-step progress tracking
  - Execution logs and screenshots
  - Supervision controls
- **AI Workflow Generator**: Natural language to workflow conversion

### Workflow DSL
Zod-validated JSON schema supporting:
- `goto`: Navigate to URLs
- `click`: Click elements
- `type`: Input text
- `wait`: Wait for conditions or time
- `scroll`: Scroll page
- `scrape`: Extract data
- `llm_reason`: AI-driven decisions
- `conditional`: Branching logic
- `loop`: Repeated actions
- `extract`: Advanced data extraction
- `agent_action`: LLM tool calls

### LLM Agent Layer
Structured tool calls for:
- Browser automation
- Candidate sourcing (LinkedIn, Indeed)
- Candidate evaluation
- Messaging and communication
- Meeting scheduling
- Transcript ingestion and summarization
- ATS integration
- Error recovery and selector correction
- Conditional branching

## 🏗️ Architecture

```
signal-recorder-v2/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   └── agent/           # Agent endpoints
│   ├── auth/                # Authentication pages
│   ├── dashboard/           # Main dashboard
│   └── workflows/           # Workflow management
│       ├── new/             # Create workflow
│       ├── generate/        # AI generation
│       ├── [id]/edit/       # Editor
│       └── [id]/run/        # Live viewer
├── components/              # React components
├── extension/               # Chrome extension
│   ├── src/
│   │   ├── background.ts    # Service worker
│   │   ├── content.ts       # Content script
│   │   └── popup/           # React popup UI
│   └── manifest.json
├── lib/
│   ├── agent/               # LLM agent system
│   │   ├── planner.ts       # Goal → Workflow
│   │   ├── tools.ts         # Tool definitions
│   │   └── executor.ts      # Agent execution
│   ├── realtime/            # Supabase realtime
│   ├── schemas/             # Zod schemas
│   ├── store/               # Redux Toolkit
│   ├── supabase/            # Supabase clients
│   └── utils/               # Utilities
└── supabase/
    └── migrations/          # Database schema
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- OpenAI API key

### Installation

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Run Supabase migrations**:
```bash
# Using Supabase CLI
supabase db push

# Or run the SQL files in your Supabase dashboard
```

4. **Build the extension**:
```bash
npm run build:extension
```

5. **Load the extension**:
- Open Chrome → `chrome://extensions`
- Enable "Developer mode"
- Click "Load unpacked"
- Select `extension/dist/` directory

6. **Start the development server**:
```bash
npm run dev
```

Visit `http://localhost:3000`

## 📖 Usage

### Recording a Workflow

1. Open the extension popup
2. Configure Supabase URL and access token
3. Click "Start Recording"
4. Perform actions on any website
5. Click "Stop Recording"
6. Events are automatically saved to Supabase

### Creating Workflows

**Manual Creation:**
1. Dashboard → "New Workflow"
2. Add steps using the visual editor
3. Configure selectors, timeouts, and options
4. Save

**AI Generation:**
1. Dashboard → "Generate with AI"
2. Describe your goal in natural language
3. Review generated workflow
4. Save and customize

### Running Workflows

1. Dashboard → Select workflow → Run
2. Click "Start Execution"
3. Open extension popup
4. Load workflow and begin replay

**Supervised Mode:**
- Each step waits for approval
- Click "Approve Next Step" to continue
- View logs and screenshots in real-time

### Example Goals for AI Generation

```
"Find candidates for Senior Software Engineer role on LinkedIn, 
evaluate their experience with Python and AWS, send a personalized 
message to qualified candidates, and schedule interviews."

"Search for products on Amazon matching specific criteria, 
extract pricing and reviews, compare across sellers, 
and notify me of the best deals."

"Monitor competitor websites daily, scrape pricing data, 
detect changes, and generate a summary report."
```

## 🗄️ Database Schema

### Tables
- `workflows`: Workflow definitions
- `workflow_runs`: Execution instances
- `run_logs`: Execution logs
- `transcripts`: Meeting transcripts
- `agent_goals`: AI goals
- `agent_states`: Agent execution state
- `recorded_events`: Recorded browser events

### RPC Functions
- `save_recorded_events`: Save events from extension
- `create_workflow_from_events`: Convert events to workflow
- `start_workflow_run`: Initialize execution
- `update_run_status`: Update run state
- `add_run_log`: Log execution events
- `pause_workflow_run`: Pause execution
- `resume_workflow_run`: Resume execution
- `get_next_step`: Fetch next step

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **State Management**: Redux Toolkit
- **Backend**: Supabase (PostgreSQL, Realtime, RPC)
- **Validation**: Zod
- **AI**: OpenAI GPT-4
- **Extension**: Chrome Manifest V3, React
- **Build Tools**: esbuild, TypeScript

## 🔒 Security

- Row Level Security (RLS) on all tables
- User-scoped data access
- Secure credential storage
- Service role key for server-side operations

## 🤝 Contributing

This is a demonstration project showcasing a complete architecture. For production use:

1. Add comprehensive error handling
2. Implement queue system for agent execution
3. Add rate limiting and throttling
4. Enhance security measures
5. Add comprehensive testing
6. Implement monitoring and observability

## 📝 License

MIT

## 🙏 Acknowledgments

Built with:
- Next.js
- Supabase
- OpenAI
- Chrome Extensions API
- Redux Toolkit
- Zod

