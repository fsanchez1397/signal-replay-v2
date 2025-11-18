// Background service worker for Chrome extension

interface RecordingState {
  isRecording: boolean;
  sessionId: string | null;
  events: any[];
}

interface ReplayState {
  isReplaying: boolean;
  runId: string | null;
  currentStepIndex: number;
  isPaused: boolean;
  workflowSteps: any[];
}

let recordingState: RecordingState = {
  isRecording: false,
  sessionId: null,
  events: [],
};

let replayState: ReplayState = {
  isReplaying: false,
  runId: null,
  currentStepIndex: 0,
  isPaused: false,
  workflowSteps: [],
};

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  switch (message.type) {
    case 'START_RECORDING':
      handleStartRecording(message, sendResponse);
      return true;

    case 'STOP_RECORDING':
      handleStopRecording(sendResponse);
      return true;

    case 'GET_RECORDING_STATE':
      sendResponse({ 
        isRecording: recordingState.isRecording,
        eventCount: recordingState.events.length 
      });
      return true;

    case 'START_REPLAY':
      handleStartReplay(message, sendResponse);
      return true;

    case 'PAUSE_REPLAY':
      handlePauseReplay(sendResponse);
      return true;

    case 'RESUME_REPLAY':
      handleResumeReplay(sendResponse);
      return true;

    case 'NEXT_STEP':
      handleNextStep(sendResponse);
      return true;

    case 'STOP_REPLAY':
      handleStopReplay(sendResponse);
      return true;

    case 'GET_REPLAY_STATE':
      sendResponse(replayState);
      return true;

    case 'RECORDED_EVENT':
      handleRecordedEvent(message.event);
      sendResponse({ success: true });
      return true;

    case 'STEP_COMPLETED':
      handleStepCompleted(message, sendResponse);
      return true;

    case 'STEP_FAILED':
      handleStepFailed(message, sendResponse);
      return true;
  }

  return false;
});

async function handleStartRecording(message: any, sendResponse: (response: any) => void) {
  recordingState = {
    isRecording: true,
    sessionId: crypto.randomUUID(),
    events: [],
  };

  // Notify all tabs to start recording
  const tabs = await chrome.tabs.query({});
  tabs.forEach((tab) => {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'START_RECORDING' }).catch(() => {});
    }
  });

  sendResponse({ success: true, sessionId: recordingState.sessionId });
}

async function handleStopRecording(sendResponse: (response: any) => void) {
  if (!recordingState.isRecording) {
    sendResponse({ success: false, error: 'Not currently recording' });
    return;
  }

  // Notify all tabs to stop recording
  const tabs = await chrome.tabs.query({});
  tabs.forEach((tab) => {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'STOP_RECORDING' }).catch(() => {});
    }
  });

  const events = [...recordingState.events];
  const sessionId = recordingState.sessionId;

  recordingState = {
    isRecording: false,
    sessionId: null,
    events: [],
  };

  sendResponse({ 
    success: true, 
    sessionId,
    events,
    eventCount: events.length 
  });
}

function handleRecordedEvent(event: any) {
  if (recordingState.isRecording) {
    recordingState.events.push({
      ...event,
      sessionId: recordingState.sessionId,
    });
  }
}

async function handleStartReplay(message: any, sendResponse: (response: any) => void) {
  const { runId, workflowSteps } = message;

  replayState = {
    isReplaying: true,
    runId,
    currentStepIndex: 0,
    isPaused: false,
    workflowSteps,
  };

  // Execute first step
  await executeCurrentStep();

  sendResponse({ success: true });
}

async function handlePauseReplay(sendResponse: (response: any) => void) {
  replayState.isPaused = true;
  sendResponse({ success: true });
}

async function handleResumeReplay(sendResponse: (response: any) => void) {
  replayState.isPaused = false;
  
  // Continue execution if not already running
  await executeCurrentStep();

  sendResponse({ success: true });
}

async function handleNextStep(sendResponse: (response: any) => void) {
  if (!replayState.isReplaying) {
    sendResponse({ success: false, error: 'Not currently replaying' });
    return;
  }

  // Execute next step regardless of pause state
  const previousPauseState = replayState.isPaused;
  replayState.isPaused = false;
  
  await executeCurrentStep();
  
  // Restore pause state after this step
  replayState.isPaused = previousPauseState;

  sendResponse({ success: true });
}

async function handleStopReplay(sendResponse: (response: any) => void) {
  // Notify content script to stop
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]?.id) {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'STOP_REPLAY' }).catch(() => {});
  }

  replayState = {
    isReplaying: false,
    runId: null,
    currentStepIndex: 0,
    isPaused: false,
    workflowSteps: [],
  };

  sendResponse({ success: true });
}

async function executeCurrentStep() {
  if (!replayState.isReplaying || replayState.isPaused) {
    return;
  }

  if (replayState.currentStepIndex >= replayState.workflowSteps.length) {
    // Workflow completed
    await handleStopReplay(() => {});
    return;
  }

  const step = replayState.workflowSteps[replayState.currentStepIndex];

  // Get active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs[0]?.id) {
    console.error('No active tab found');
    return;
  }

  // Send step to content script
  try {
    await chrome.tabs.sendMessage(tabs[0].id, {
      type: 'EXECUTE_STEP',
      step,
      stepIndex: replayState.currentStepIndex,
    });
  } catch (error) {
    console.error('Failed to send step to content script:', error);
  }
}

async function handleStepCompleted(message: any, sendResponse: (response: any) => void) {
  const { stepIndex } = message;

  if (stepIndex === replayState.currentStepIndex) {
    replayState.currentStepIndex++;
    
    // Execute next step if not paused
    if (!replayState.isPaused) {
      await executeCurrentStep();
    }
  }

  sendResponse({ success: true });
}

async function handleStepFailed(message: any, sendResponse: (response: any) => void) {
  const { stepIndex, error } = message;

  console.error('Step failed:', stepIndex, error);

  // Pause execution on error
  replayState.isPaused = true;

  sendResponse({ success: true });
}

// Tab update listener for navigation during recording
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (recordingState.isRecording && changeInfo.status === 'complete' && tab.url) {
    handleRecordedEvent({
      type: 'navigation',
      timestamp: Date.now(),
      url: tab.url,
      target: {
        selector: '',
        tagName: 'document',
      },
    });
  }
});

