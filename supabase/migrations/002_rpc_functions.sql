-- RPC function to save recorded events
CREATE OR REPLACE FUNCTION save_recorded_events(
  p_session_id UUID,
  p_events JSONB
)
RETURNS UUID AS $$
DECLARE
  v_event JSONB;
  v_count INT := 0;
BEGIN
  FOR v_event IN SELECT * FROM jsonb_array_elements(p_events)
  LOOP
    INSERT INTO recorded_events (
      user_id,
      session_id,
      event_type,
      timestamp,
      target,
      data,
      url,
      viewport
    ) VALUES (
      auth.uid(),
      p_session_id,
      v_event->>'type',
      (v_event->>'timestamp')::BIGINT,
      v_event->'target',
      COALESCE(v_event->'data', '{}'::JSONB),
      v_event->>'url',
      v_event->'viewport'
    );
    v_count := v_count + 1;
  END LOOP;
  
  RETURN p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to create a workflow from recorded events
CREATE OR REPLACE FUNCTION create_workflow_from_events(
  p_session_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
  v_steps JSONB;
BEGIN
  -- Convert recorded events to workflow steps (simplified)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', gen_random_uuid()::TEXT,
      'type', CASE
        WHEN event_type = 'navigation' THEN 'goto'
        WHEN event_type = 'click' THEN 'click'
        WHEN event_type = 'input' THEN 'type'
        ELSE 'wait'
      END,
      'selector', jsonb_build_object(
        'type', 'css',
        'value', target->>'selector'
      ),
      'url', url,
      'text', target->>'value',
      'timeout', 5000
    )
  ) INTO v_steps
  FROM recorded_events
  WHERE session_id = p_session_id
  ORDER BY timestamp;

  -- Create workflow
  INSERT INTO workflows (user_id, name, description, steps)
  VALUES (auth.uid(), p_name, p_description, COALESCE(v_steps, '[]'::JSONB))
  RETURNING id INTO v_workflow_id;

  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to start a workflow run
CREATE OR REPLACE FUNCTION start_workflow_run(
  p_workflow_id UUID,
  p_variables JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  v_run_id UUID;
BEGIN
  INSERT INTO workflow_runs (
    workflow_id,
    user_id,
    status,
    variables,
    started_at
  ) VALUES (
    p_workflow_id,
    auth.uid(),
    'running',
    p_variables,
    NOW()
  )
  RETURNING id INTO v_run_id;

  RETURN v_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to update run status
CREATE OR REPLACE FUNCTION update_run_status(
  p_run_id UUID,
  p_status TEXT,
  p_current_step_index INTEGER DEFAULT NULL,
  p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE workflow_runs
  SET 
    status = p_status,
    current_step_index = COALESCE(p_current_step_index, current_step_index),
    error = p_error,
    completed_at = CASE WHEN p_status IN ('completed', 'failed', 'cancelled') THEN NOW() ELSE completed_at END
  WHERE id = p_run_id
    AND user_id = auth.uid();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to add run log
CREATE OR REPLACE FUNCTION add_run_log(
  p_run_id UUID,
  p_step_id TEXT,
  p_level TEXT,
  p_message TEXT,
  p_screenshot TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO run_logs (
    run_id,
    step_id,
    level,
    message,
    screenshot,
    metadata
  ) VALUES (
    p_run_id,
    p_step_id,
    p_level,
    p_message,
    p_screenshot,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to pause a workflow run
CREATE OR REPLACE FUNCTION pause_workflow_run(p_run_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE workflow_runs
  SET status = 'paused'
  WHERE id = p_run_id
    AND user_id = auth.uid()
    AND status = 'running';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to resume a workflow run
CREATE OR REPLACE FUNCTION resume_workflow_run(p_run_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE workflow_runs
  SET status = 'running'
  WHERE id = p_run_id
    AND user_id = auth.uid()
    AND status = 'paused';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to get next step for execution
CREATE OR REPLACE FUNCTION get_next_step(p_run_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_workflow workflows%ROWTYPE;
  v_run workflow_runs%ROWTYPE;
  v_step JSONB;
BEGIN
  SELECT * INTO v_run FROM workflow_runs WHERE id = p_run_id;
  SELECT * INTO v_workflow FROM workflows WHERE id = v_run.workflow_id;

  IF v_run.current_step_index >= jsonb_array_length(v_workflow.steps) THEN
    RETURN NULL;
  END IF;

  SELECT v_workflow.steps->v_run.current_step_index INTO v_step;

  RETURN v_step;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to update workflow variables during run
CREATE OR REPLACE FUNCTION update_run_variables(
  p_run_id UUID,
  p_variables JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE workflow_runs
  SET variables = variables || p_variables
  WHERE id = p_run_id
    AND user_id = auth.uid();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

