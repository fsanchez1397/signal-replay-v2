import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Circle, 
  SkipForward,
  Download,
  Upload 
} from 'lucide-react';

interface RecordingState {
  isRecording: boolean;
  eventCount: number;
}

interface ReplayState {
  isReplaying: boolean;
  runId: string | null;
  currentStepIndex: number;
  isPaused: boolean;
  workflowSteps: any[];
}

const Popup: React.FC = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    eventCount: 0,
  });

  const [replayState, setReplayState] = useState<ReplayState>({
    isReplaying: false,
    runId: null,
    currentStepIndex: 0,
    isPaused: false,
    workflowSteps: [],
  });

  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    // Load state from storage
    chrome.storage.local.get(['supabaseUrl', 'accessToken'], (result) => {
      if (result.supabaseUrl) setSupabaseUrl(result.supabaseUrl);
      if (result.accessToken) setAccessToken(result.accessToken);
    });

    // Poll for state updates
    const interval = setInterval(() => {
      updateStates();
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const updateStates = async () => {
    // Get recording state
    chrome.runtime.sendMessage({ type: 'GET_RECORDING_STATE' }, (response) => {
      if (response) {
        setRecordingState(response);
      }
    });

    // Get replay state
    chrome.runtime.sendMessage({ type: 'GET_REPLAY_STATE' }, (response) => {
      if (response) {
        setReplayState(response);
      }
    });
  };

  const handleStartRecording = () => {
    chrome.runtime.sendMessage({ type: 'START_RECORDING' }, (response) => {
      if (response.success) {
        updateStates();
      }
    });
  };

  const handleStopRecording = async () => {
    chrome.runtime.sendMessage({ type: 'STOP_RECORDING' }, async (response) => {
      if (response.success && response.events.length > 0) {
        // Save to Supabase
        if (supabaseUrl && accessToken) {
          await saveEventsToSupabase(response.sessionId, response.events);
        }
        updateStates();
      }
    });
  };

  const saveEventsToSupabase = async (sessionId: string, events: any[]) => {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/save_recorded_events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': accessToken,
        },
        body: JSON.stringify({
          p_session_id: sessionId,
          p_events: events,
        }),
      });

      if (response.ok) {
        alert('Events saved successfully!');
      } else {
        console.error('Failed to save events:', await response.text());
      }
    } catch (error) {
      console.error('Error saving events:', error);
    }
  };

  const handleLoadWorkflow = async () => {
    if (!supabaseUrl || !accessToken) {
      alert('Please configure Supabase settings first');
      return;
    }

    // In a real implementation, this would show a workflow selector
    // For now, just demonstrate the flow
    const workflowId = prompt('Enter workflow ID:');
    if (!workflowId) return;

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/workflows?id=eq.${workflowId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': accessToken,
          },
        }
      );

      const workflows = await response.json();
      if (workflows.length > 0) {
        const workflow = workflows[0];
        
        // Start workflow run
        const runResponse = await fetch(
          `${supabaseUrl}/rest/v1/rpc/start_workflow_run`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'apikey': accessToken,
            },
            body: JSON.stringify({
              p_workflow_id: workflowId,
            }),
          }
        );

        const runId = await runResponse.json();

        // Start replay
        chrome.runtime.sendMessage({
          type: 'START_REPLAY',
          runId,
          workflowSteps: workflow.steps,
        }, (response) => {
          if (response.success) {
            updateStates();
          }
        });
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
      alert('Failed to load workflow');
    }
  };

  const handlePlayPause = () => {
    if (replayState.isPaused) {
      chrome.runtime.sendMessage({ type: 'RESUME_REPLAY' }, updateStates);
    } else {
      chrome.runtime.sendMessage({ type: 'PAUSE_REPLAY' }, updateStates);
    }
  };

  const handleNextStep = () => {
    chrome.runtime.sendMessage({ type: 'NEXT_STEP' }, updateStates);
  };

  const handleStopReplay = () => {
    chrome.runtime.sendMessage({ type: 'STOP_REPLAY' }, updateStates);
  };

  const handleSaveConfig = () => {
    chrome.storage.local.set({ supabaseUrl, accessToken }, () => {
      alert('Configuration saved!');
    });
  };

  return (
    <div className="w-[400px] p-4 bg-gray-50">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Signal Recorder</h1>
        <p className="text-sm text-gray-600">
          Record and replay browser workflows
        </p>
      </div>

      {/* Configuration */}
      <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
        <h2 className="text-sm font-semibold mb-2">Configuration</h2>
        <input
          type="text"
          placeholder="Supabase URL"
          value={supabaseUrl}
          onChange={(e) => setSupabaseUrl(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded mb-2"
        />
        <input
          type="password"
          placeholder="Access Token"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded mb-2"
        />
        <button
          onClick={handleSaveConfig}
          className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save Configuration
        </button>
      </div>

      {/* Recording Controls */}
      <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
        <h2 className="text-sm font-semibold mb-2">Recording</h2>
        <div className="flex gap-2">
          {!recordingState.isRecording ? (
            <button
              onClick={handleStartRecording}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              <Circle className="w-4 h-4" />
              <span className="text-sm">Start Recording</span>
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
            >
              <Square className="w-4 h-4" />
              <span className="text-sm">Stop Recording</span>
            </button>
          )}
        </div>
        {recordingState.isRecording && (
          <div className="mt-2 text-sm text-gray-600">
            Events recorded: {recordingState.eventCount}
          </div>
        )}
      </div>

      {/* Replay Controls */}
      <div className="p-3 bg-white rounded-lg border border-gray-200">
        <h2 className="text-sm font-semibold mb-2">Replay</h2>
        
        {!replayState.isReplaying ? (
          <button
            onClick={handleLoadWorkflow}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm">Load Workflow</span>
          </button>
        ) : (
          <>
            <div className="mb-2 text-sm text-gray-600">
              Step {replayState.currentStepIndex + 1} of {replayState.workflowSteps.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePlayPause}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                {replayState.isPaused ? (
                  <>
                    <Play className="w-4 h-4" />
                    <span className="text-sm">Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    <span className="text-sm">Pause</span>
                  </>
                )}
              </button>
              <button
                onClick={handleNextStep}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                onClick={handleStopReplay}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Popup;

