-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workflows table
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  steps JSONB NOT NULL DEFAULT '[]',
  variables JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{"supervisedMode": true, "pauseOnError": true, "maxRetries": 3, "screenshotOnError": true}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workflow runs table
CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  current_step_index INTEGER DEFAULT 0,
  variables JSONB DEFAULT '{}',
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Run logs table
CREATE TABLE run_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'success')),
  message TEXT NOT NULL,
  screenshot TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transcripts table (for meeting transcripts)
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_id TEXT,
  platform TEXT CHECK (platform IN ('zoom', 'google_meet', 'teams')),
  content TEXT NOT NULL,
  summary TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent goals table
CREATE TABLE agent_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  generated_workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent state table
CREATE TABLE agent_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES agent_goals(id) ON DELETE CASCADE,
  current_phase TEXT NOT NULL CHECK (current_phase IN ('planning', 'executing', 'evaluating', 'recovering', 'completed')),
  plan JSONB DEFAULT '[]',
  context JSONB DEFAULT '{}',
  memory JSONB DEFAULT '[]',
  tool_calls JSONB DEFAULT '[]',
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recorded events table (from extension)
CREATE TABLE recorded_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  target JSONB NOT NULL,
  data JSONB DEFAULT '{}',
  url TEXT NOT NULL,
  viewport JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
CREATE INDEX idx_workflow_runs_user_id ON workflow_runs(user_id);
CREATE INDEX idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX idx_run_logs_run_id ON run_logs(run_id);
CREATE INDEX idx_transcripts_user_id ON transcripts(user_id);
CREATE INDEX idx_agent_goals_user_id ON agent_goals(user_id);
CREATE INDEX idx_agent_states_goal_id ON agent_states(goal_id);
CREATE INDEX idx_recorded_events_session_id ON recorded_events(session_id);
CREATE INDEX idx_recorded_events_user_id ON recorded_events(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_runs_updated_at BEFORE UPDATE ON workflow_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_goals_updated_at BEFORE UPDATE ON agent_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_states_updated_at BEFORE UPDATE ON agent_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE recorded_events ENABLE ROW LEVEL SECURITY;

-- Policies for workflows
CREATE POLICY "Users can view their own workflows"
  ON workflows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workflows"
  ON workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows"
  ON workflows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows"
  ON workflows FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for workflow_runs
CREATE POLICY "Users can view their own workflow runs"
  ON workflow_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workflow runs"
  ON workflow_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflow runs"
  ON workflow_runs FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for run_logs
CREATE POLICY "Users can view logs for their own runs"
  ON run_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workflow_runs
    WHERE workflow_runs.id = run_logs.run_id
    AND workflow_runs.user_id = auth.uid()
  ));

CREATE POLICY "Users can create logs for their own runs"
  ON run_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM workflow_runs
    WHERE workflow_runs.id = run_logs.run_id
    AND workflow_runs.user_id = auth.uid()
  ));

-- Policies for transcripts
CREATE POLICY "Users can manage their own transcripts"
  ON transcripts FOR ALL
  USING (auth.uid() = user_id);

-- Policies for agent_goals
CREATE POLICY "Users can manage their own agent goals"
  ON agent_goals FOR ALL
  USING (auth.uid() = user_id);

-- Policies for agent_states
CREATE POLICY "Users can view agent states for their goals"
  ON agent_states FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM agent_goals
    WHERE agent_goals.id = agent_states.goal_id
    AND agent_goals.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage agent states for their goals"
  ON agent_states FOR ALL
  USING (EXISTS (
    SELECT 1 FROM agent_goals
    WHERE agent_goals.id = agent_states.goal_id
    AND agent_goals.user_id = auth.uid()
  ));

-- Policies for recorded_events
CREATE POLICY "Users can manage their own recorded events"
  ON recorded_events FOR ALL
  USING (auth.uid() = user_id);

