// Content script for recording and replaying browser interactions

interface RecordingState {
  isRecording: boolean;
  events: any[];
}

interface ReplayState {
  isReplaying: boolean;
}

let state: RecordingState & ReplayState = {
  isRecording: false,
  isReplaying: false,
  events: [],
};

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received:', message);

  switch (message.type) {
    case 'START_RECORDING':
      startRecording();
      sendResponse({ success: true });
      break;

    case 'STOP_RECORDING':
      stopRecording();
      sendResponse({ success: true });
      break;

    case 'EXECUTE_STEP':
      executeStep(message.step, message.stepIndex).then((result) => {
        sendResponse(result);
      });
      return true;

    case 'STOP_REPLAY':
      stopReplay();
      sendResponse({ success: true });
      break;
  }

  return false;
});

function startRecording() {
  if (state.isRecording) return;

  state.isRecording = true;
  state.events = [];

  // Add event listeners
  document.addEventListener('click', handleClick, true);
  document.addEventListener('input', handleInput, true);
  document.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('change', handleChange, true);
  document.addEventListener('submit', handleSubmit, true);
  window.addEventListener('scroll', handleScroll, true);

  console.log('Recording started');
}

function stopRecording() {
  if (!state.isRecording) return;

  state.isRecording = false;

  // Remove event listeners
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('input', handleInput, true);
  document.removeEventListener('keydown', handleKeyDown, true);
  document.removeEventListener('change', handleChange, true);
  document.removeEventListener('submit', handleSubmit, true);
  window.removeEventListener('scroll', handleScroll, true);

  console.log('Recording stopped');
}

function handleClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  
  recordEvent({
    type: 'click',
    timestamp: Date.now(),
    target: extractElementInfo(target),
    data: {
      clientX: event.clientX,
      clientY: event.clientY,
      button: event.button,
    },
    url: window.location.href,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  });
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  
  recordEvent({
    type: 'input',
    timestamp: Date.now(),
    target: extractElementInfo(target),
    data: {
      value: target.value,
    },
    url: window.location.href,
  });
}

function handleKeyDown(event: KeyboardEvent) {
  recordEvent({
    type: 'keypress',
    timestamp: Date.now(),
    target: extractElementInfo(event.target as HTMLElement),
    data: {
      key: event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
    },
    url: window.location.href,
  });
}

function handleChange(event: Event) {
  const target = event.target as HTMLElement;
  
  recordEvent({
    type: 'change',
    timestamp: Date.now(),
    target: extractElementInfo(target),
    data: {
      value: (target as any).value,
    },
    url: window.location.href,
  });
}

function handleSubmit(event: Event) {
  const target = event.target as HTMLFormElement;
  
  recordEvent({
    type: 'submit',
    timestamp: Date.now(),
    target: extractElementInfo(target),
    url: window.location.href,
  });
}

function handleScroll(event: Event) {
  recordEvent({
    type: 'scroll',
    timestamp: Date.now(),
    target: {
      selector: 'window',
      tagName: 'window',
    },
    data: {
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    },
    url: window.location.href,
  });
}

function extractElementInfo(element: HTMLElement) {
  const selector = generateSelector(element);
  const attributes: Record<string, string> = {};
  
  Array.from(element.attributes).forEach((attr) => {
    attributes[attr.name] = attr.value;
  });

  return {
    selector,
    tagName: element.tagName.toLowerCase(),
    textContent: element.textContent?.substring(0, 100) || '',
    value: (element as any).value || '',
    attributes,
  };
}

function generateSelector(element: HTMLElement): string {
  // Generate a robust selector for the element
  if (element.id) {
    return `#${element.id}`;
  }

  if (element.className) {
    const classes = Array.from(element.classList).join('.');
    if (classes) {
      const selector = `${element.tagName.toLowerCase()}.${classes}`;
      if (document.querySelectorAll(selector).length === 1) {
        return selector;
      }
    }
  }

  // Use data attributes if available
  const dataAttrs = Array.from(element.attributes)
    .filter(attr => attr.name.startsWith('data-'))
    .map(attr => `[${attr.name}="${attr.value}"]`)
    .join('');
  
  if (dataAttrs) {
    const selector = `${element.tagName.toLowerCase()}${dataAttrs}`;
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
  }

  // Generate path-based selector
  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current.tagName !== 'HTML') {
    let selector = current.tagName.toLowerCase();
    
    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }

    const siblings = Array.from(current.parentElement?.children || []);
    const sameTagSiblings = siblings.filter(s => s.tagName === current!.tagName);
    
    if (sameTagSiblings.length > 1) {
      const index = sameTagSiblings.indexOf(current) + 1;
      selector += `:nth-of-type(${index})`;
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

function recordEvent(event: any) {
  state.events.push(event);
  
  // Send to background script
  chrome.runtime.sendMessage({
    type: 'RECORDED_EVENT',
    event,
  });
}

// Replay functionality
async function executeStep(step: any, stepIndex: number): Promise<any> {
  console.log('Executing step:', step);

  try {
    switch (step.type) {
      case 'goto':
        await executeGoto(step);
        break;

      case 'click':
        await executeClick(step);
        break;

      case 'type':
        await executeType(step);
        break;

      case 'wait':
        await executeWait(step);
        break;

      case 'scroll':
        await executeScroll(step);
        break;

      case 'scrape':
        await executeScrape(step);
        break;

      default:
        console.warn('Unknown step type:', step.type);
    }

    // Notify background script of completion
    chrome.runtime.sendMessage({
      type: 'STEP_COMPLETED',
      stepIndex,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Step execution failed:', error);

    // Notify background script of failure
    chrome.runtime.sendMessage({
      type: 'STEP_FAILED',
      stepIndex,
      error: error.message,
    });

    return { success: false, error: error.message };
  }
}

async function executeGoto(step: any) {
  window.location.href = step.url;
  
  // Wait for navigation
  return new Promise((resolve) => {
    window.addEventListener('load', resolve, { once: true });
  });
}

async function executeClick(step: any) {
  const element = await findElement(step.selector);
  
  if (!element) {
    throw new Error(`Element not found: ${JSON.stringify(step.selector)}`);
  }

  // Scroll element into view
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await sleep(300);

  // Highlight element (visual feedback)
  highlightElement(element);

  // Click
  element.click();

  await sleep(step.timeout || 500);
}

async function executeType(step: any) {
  const element = await findElement(step.selector) as HTMLInputElement;
  
  if (!element) {
    throw new Error(`Element not found: ${JSON.stringify(step.selector)}`);
  }

  // Scroll into view
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await sleep(300);

  // Highlight
  highlightElement(element);

  // Clear if needed
  if (step.clearFirst) {
    element.value = '';
  }

  // Type text
  element.focus();
  element.value = step.text;
  
  // Trigger input event
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));

  // Press enter if needed
  if (step.pressEnter) {
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  }

  await sleep(step.timeout || 500);
}

async function executeWait(step: any) {
  if (step.waitType === 'time') {
    await sleep(step.value || 1000);
  } else if (step.waitType === 'selector') {
    await waitForElement(step.value, step.timeout || 5000);
  }
}

async function executeScroll(step: any) {
  const amount = step.amount || 500;

  switch (step.direction) {
    case 'up':
      window.scrollBy(0, -amount);
      break;
    case 'down':
      window.scrollBy(0, amount);
      break;
    case 'top':
      window.scrollTo(0, 0);
      break;
    case 'bottom':
      window.scrollTo(0, document.body.scrollHeight);
      break;
  }

  await sleep(300);
}

async function executeScrape(step: any) {
  const elements = step.multiple 
    ? await findElements(step.selector)
    : [await findElement(step.selector)];

  const results = elements.map((el) => {
    if (!el) return null;
    
    if (step.attribute) {
      return el.getAttribute(step.attribute);
    }
    return el.textContent?.trim();
  }).filter(Boolean);

  // Store result (would send to backend in real implementation)
  console.log('Scraped data:', results);

  return results;
}

async function findElement(selector: any): Promise<HTMLElement | null> {
  if (selector.type === 'css') {
    return document.querySelector(selector.value);
  } else if (selector.type === 'xpath') {
    const result = document.evaluate(
      selector.value,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    return result.singleNodeValue as HTMLElement;
  } else if (selector.type === 'text') {
    const elements = Array.from(document.querySelectorAll('*'));
    return elements.find((el) => 
      el.textContent?.trim() === selector.value
    ) as HTMLElement || null;
  }

  return null;
}

async function findElements(selector: any): Promise<HTMLElement[]> {
  if (selector.type === 'css') {
    return Array.from(document.querySelectorAll(selector.value));
  }
  return [];
}

async function waitForElement(selector: any, timeout: number): Promise<HTMLElement> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = await findElement(selector);
    if (element) {
      return element;
    }
    await sleep(100);
  }

  throw new Error(`Timeout waiting for element: ${JSON.stringify(selector)}`);
}

function highlightElement(element: HTMLElement) {
  const originalBorder = element.style.border;
  const originalBackground = element.style.backgroundColor;

  element.style.border = '3px solid #0ea5e9';
  element.style.backgroundColor = 'rgba(14, 165, 233, 0.1)';

  setTimeout(() => {
    element.style.border = originalBorder;
    element.style.backgroundColor = originalBackground;
  }, 1000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stopReplay() {
  state.isReplaying = false;
}

console.log('Signal Recorder content script loaded');

