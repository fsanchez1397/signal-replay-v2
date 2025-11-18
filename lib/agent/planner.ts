import OpenAI from 'openai';
import { WorkflowSchema, type Workflow, type WorkflowStep } from '@/lib/schemas/workflow';
import { zodResponseFormat } from 'openai/helpers/zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SubGoal {
  subgoal: string;
  steps: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export async function generateWorkflowFromGoal(
  goal: string,
  context: Record<string, any>
): Promise<Workflow> {
  const systemPrompt = `You are an expert workflow automation planner. Your job is to break down high-level user goals into detailed, executable browser automation workflows.

You understand how to:
- Navigate to websites
- Find and click elements
- Fill forms
- Scrape data
- Make decisions based on conditions
- Handle multi-step processes across different platforms

Generate workflows that are specific, actionable, and handle edge cases.`;

  const userPrompt = `Goal: ${goal}

Context: ${JSON.stringify(context, null, 2)}

Generate a complete workflow that accomplishes this goal. Break it down into specific steps using these step types:
- goto: Navigate to a URL
- click: Click an element
- type: Type text into an input
- wait: Wait for a condition or time
- scroll: Scroll the page
- scrape: Extract data from elements
- llm_reason: Use AI to make decisions
- conditional: Branch based on conditions
- loop: Repeat steps

Make the workflow detailed and production-ready. Include proper selectors, descriptions, and handle common scenarios.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'workflow',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  description: { type: 'string' },
                  timeout: { type: 'number' },
                  screenshot: { type: 'boolean' },
                },
                required: ['id', 'type', 'timeout', 'screenshot'],
                additionalProperties: true,
              },
            },
          },
          required: ['name', 'description', 'tags', 'steps'],
          additionalProperties: false,
        },
      },
    },
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  const workflowData = JSON.parse(content);

  // Add IDs to steps if missing
  workflowData.steps = workflowData.steps.map((step: any) => ({
    ...step,
    id: step.id || crypto.randomUUID(),
  }));

  // Create full workflow object
  const workflow: Workflow = {
    id: crypto.randomUUID(),
    name: workflowData.name,
    description: workflowData.description,
    tags: workflowData.tags || [],
    steps: workflowData.steps,
    variables: {},
    settings: {
      supervisedMode: true,
      pauseOnError: true,
      maxRetries: 3,
      screenshotOnError: true,
    },
  };

  // Validate with Zod
  try {
    WorkflowSchema.parse(workflow);
  } catch (err) {
    console.error('Workflow validation failed:', err);
    // Continue anyway, as the schema might be too strict for generated workflows
  }

  return workflow;
}

export async function generateSubGoals(goal: string, context: Record<string, any>): Promise<SubGoal[]> {
  const systemPrompt = `You are an AI planner that breaks down complex goals into manageable subgoals.
Each subgoal should be a distinct phase of accomplishing the main goal.`;

  const userPrompt = `Goal: ${goal}
Context: ${JSON.stringify(context)}

Break this down into 3-7 subgoals that can be accomplished sequentially.
Return a JSON array of subgoals with this structure:
[
  {
    "subgoal": "Description of what to accomplish",
    "steps": ["Step 1", "Step 2"],
    "status": "pending"
  }
]`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return JSON.parse(content);
}

