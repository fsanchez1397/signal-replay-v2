# Architecture Documentation

## System Overview

Signal Recorder v2 is a full-stack browser automation platform that enables users to record, replay, and create sophisticated browser workflows, enhanced with AI-driven goal transformation capabilities.

## Component Architecture

### 1. Chrome Extension Layer

**Purpose**: Capture and replay browser interactions

**Components**:

- **Background Service Worker** (`extension/src/background.ts`)
  - Manages extension lifecycle
  - Coordinates recording/replay state
  - Routes messages between popup and content scripts
  - Manages workflow execution orchestration

- **Content Script** (`extension/src/content.ts`)
  - Injected into all web pages
  - Captures DOM events (click, input, scroll, navigation)
  - Generates robust CSS selectors
  - Executes workflow steps
  - Provides visual feedback during replay

- **Popup UI** (`extension/src/popup/`)
  - React-based control interface
  - Recording controls (start/stop)
  - Replay controls (play/pause/next/stop)
  - Configuration management
  - Supabase integration

**Data Flow**:
```
User Action → Content Script → Background → Supabase
Workflow Step → Background → Content Script → Browser
```

### 2. Web Application Layer

**Purpose**: Workflow management, editing, and monitoring

**Architecture**: Next.js App Router with Server/Client Components

**Pages**:

- **Dashboard** (`app/dashboard/`)
  - List workflows
  - Quick actions (run, edit, delete)
  - Authentication state

- **Workflow Editor** (`app/workflows/[id]/edit/`)
  - Visual step editor
  - Drag-and-drop reordering
  - Live Zod validation
  - Settings configuration

- **Workflow Creator** (`app/workflows/new/`)
  - Manual workflow creation
  - Basic metadata input

- **AI Generator** (`app/workflows/generate/`)
  - Natural language goal input
  - Workflow preview
  - Iterative refinement

- **Live Replay Viewer** (`app/workflows/[id]/run/`)
  - Real-time execution monitoring
  - Step-by-step progress
  - Log streaming
  - Supervision controls

**State Management**: Redux Toolkit
- Workflow state
- Replay state
- Authentication state

### 3. Backend Layer

**Platform**: Supabase

**Database Schema**:

```sql
workflows (
  id, user_id, name, description, 
  tags[], steps JSONB, variables JSONB, 
  settings JSONB, created_at, updated_at
)

workflow_runs (
  id, workflow_id, user_id, status, 
  current_step_index, variables JSONB, 
  error, started_at, completed_at
)

run_logs (
  id, run_id, step_id, level, 
  message, screenshot, metadata JSONB
)

agent_goals (
  id, user_id, goal, context JSONB, 
  generated_workflow_id, status
)

agent_states (
  id, goal_id, current_phase, 
  plan JSONB, memory JSONB, 
  tool_calls JSONB, errors JSONB
)

transcripts (
  id, user_id, meeting_id, platform, 
  content, summary, metadata JSONB
)

recorded_events (
  id, user_id, session_id, event_type, 
  timestamp, target JSONB, data JSONB, url
)
```

**RPC Functions**:
- Workflow execution control
- Event batch processing
- State management

**Realtime**:
- Workflow run updates
- Log streaming
- Live execution monitoring

### 4. LLM Agent Layer

**Purpose**: Transform natural language goals into executable workflows

**Components**:

- **Planner** (`lib/agent/planner.ts`)
  - Goal → Workflow transformation
  - Subgoal decomposition
  - OpenAI GPT-4 integration
  - Structured output with JSON Schema

- **Tools** (`lib/agent/tools.ts`)
  - `browser_action`: DOM interactions
  - `search_candidates`: Multi-platform search
  - `evaluate_candidate`: AI-driven evaluation
  - `send_message`: Communication
  - `schedule_meeting`: Calendar integration
  - `ingest_transcript`: Meeting transcripts
  - `summarize`: Content summarization
  - `update_ats`: ATS integration
  - `error_recovery`: Intelligent error handling
  - `conditional_branch`: Decision making

- **Executor** (`lib/agent/executor.ts`)
  - Agent loop orchestration
  - Tool execution
  - State persistence
  - Error recovery

**Agent Loop**:
```
1. Load goal and context
2. Generate plan (subgoals)
3. For each subgoal:
   a. Determine next action (LLM)
   b. Execute tool call
   c. Update state
   d. Handle errors
4. Complete and save results
```

### 5. Workflow DSL

**Purpose**: Structured, type-safe workflow representation

**Step Types**:

```typescript
goto       // Navigate to URL
click      // Click element
type       // Type text
wait       // Wait for condition/time
scroll     // Scroll page
scrape     // Extract data
llm_reason // AI decision
conditional // Branch execution
loop       // Repeat steps
extract    // Advanced scraping
agent_action // Tool call
```

**Validation**: Zod schemas for all types
**Storage**: JSONB in PostgreSQL
**Execution**: Interpreted by extension content script

## Data Flow Diagrams

### Recording Flow
```
User Action
  ↓
Content Script (capture)
  ↓
Background Script (aggregate)
  ↓
Supabase RPC (save_recorded_events)
  ↓
recorded_events table
```

### Replay Flow (Supervised)
```
User clicks "Start"
  ↓
Web App (start_workflow_run)
  ↓
workflow_runs table (status: running)
  ↓
Extension polls for next step
  ↓
Backend (get_next_step)
  ↓
Extension executes step
  ↓
Wait for user approval
  ↓
User clicks "Approve"
  ↓
Backend (resume_workflow_run)
  ↓
Next step executes
```

### AI Workflow Generation Flow
```
User enters goal
  ↓
POST /api/agent/generate-workflow
  ↓
Planner (generateWorkflowFromGoal)
  ↓
OpenAI GPT-4 (structured output)
  ↓
Validate with Zod
  ↓
Return workflow JSON
  ↓
User reviews and saves
  ↓
workflows table
```

## Security Architecture

### Authentication
- Supabase Auth
- JWT tokens
- Row Level Security (RLS)

### Authorization
- User-scoped queries
- RLS policies on all tables
- Service role for server operations

### Extension Security
- Message passing validation
- Origin checking
- Secure storage API

## Scalability Considerations

### Current Architecture
- Synchronous execution
- Direct LLM calls
- Client-side state

### Production Recommendations
1. **Queue System**: BullMQ/Celery for agent execution
2. **Caching**: Redis for hot workflows
3. **CDN**: Static asset delivery
4. **Database**: Read replicas for queries
5. **Rate Limiting**: API route protection
6. **Monitoring**: Sentry, DataDog
7. **Background Jobs**: Vercel Cron / Supabase Edge Functions

## Extension Points

### Adding New Step Types
1. Define Zod schema in `lib/schemas/workflow.ts`
2. Add execution logic in `extension/src/content.ts`
3. Update editor UI in `components/StepEditor.tsx`

### Adding New Agent Tools
1. Define tool schema in `lib/schemas/agent-tools.ts`
2. Add tool definition in `lib/agent/tools.ts`
3. Implement execution logic
4. Register with OpenAI tools array

### Custom Integrations
- Add new platform selectors
- Implement platform-specific scrapers
- Add authentication handlers
- Create custom tool implementations

## Testing Strategy

### Unit Tests
- Zod schema validation
- Selector generation
- Tool execution logic

### Integration Tests
- API endpoints
- Database operations
- Realtime subscriptions

### E2E Tests
- Extension recording/replay
- Workflow creation and execution
- AI generation flow

### Manual Testing
- Cross-browser compatibility
- Platform-specific workflows
- Edge cases and error scenarios

## Deployment

### Web Application
```bash
# Build
npm run build

# Deploy to Vercel
vercel deploy
```

### Extension
```bash
# Build
npm run build:extension

# Package
cd extension/dist && zip -r ../extension.zip .

# Submit to Chrome Web Store
```

### Database
```bash
# Apply migrations
supabase db push

# Create service role key
# Set environment variables
```

## Performance Optimization

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Bundle analysis

### Backend
- Query optimization
- Index tuning
- Connection pooling
- Prepared statements

### Extension
- Debounced event capture
- Efficient selector caching
- Lazy script injection
- Memory management

## Monitoring and Observability

### Metrics
- Workflow success rate
- Step execution time
- Agent completion rate
- Error frequency

### Logging
- Structured logs
- Error tracking
- Performance monitoring
- User analytics

### Alerts
- High error rates
- Slow queries
- Failed executions
- System health

## Future Enhancements

1. **Multi-tab workflows**: Coordinate actions across browser tabs
2. **Parallel execution**: Run multiple workflows concurrently
3. **Visual workflow builder**: Drag-and-drop interface
4. **Template marketplace**: Share and discover workflows
5. **Advanced selectors**: Computer vision for element detection
6. **Mobile support**: React Native app for monitoring
7. **Collaboration**: Team workflows and sharing
8. **Version control**: Workflow history and rollback
9. **A/B testing**: Compare workflow variations
10. **Analytics dashboard**: Insights and optimization recommendations

