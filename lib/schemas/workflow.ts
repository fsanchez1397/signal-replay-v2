import { z } from 'zod';

// Selector strategies for element targeting
export const SelectorSchema = z.object({
  type: z.enum(['css', 'xpath', 'text', 'ai']),
  value: z.string(),
  fallbacks: z.array(z.string()).optional(),
});

// Base step schema
const BaseStepSchema = z.object({
  id: z.string(),
  description: z.string().optional(),
  timeout: z.number().default(5000),
  screenshot: z.boolean().default(false),
});

// Navigation step
export const GotoStepSchema = BaseStepSchema.extend({
  type: z.literal('goto'),
  url: z.string().url(),
  waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle']).default('load'),
});

// Click step
export const ClickStepSchema = BaseStepSchema.extend({
  type: z.literal('click'),
  selector: SelectorSchema,
  waitForNavigation: z.boolean().default(false),
  clickCount: z.number().default(1),
});

// Type/input step
export const TypeStepSchema = BaseStepSchema.extend({
  type: z.literal('type'),
  selector: SelectorSchema,
  text: z.string(),
  clearFirst: z.boolean().default(true),
  pressEnter: z.boolean().default(false),
});

// Wait step
export const WaitStepSchema = BaseStepSchema.extend({
  type: z.literal('wait'),
  waitType: z.enum(['time', 'selector', 'navigation']),
  value: z.union([z.number(), SelectorSchema]).optional(),
});

// Scrape step
export const ScrapeStepSchema = BaseStepSchema.extend({
  type: z.literal('scrape'),
  selector: SelectorSchema,
  attribute: z.string().optional(),
  multiple: z.boolean().default(false),
  storeAs: z.string(),
});

// Scroll step
export const ScrollStepSchema = BaseStepSchema.extend({
  type: z.literal('scroll'),
  direction: z.enum(['up', 'down', 'top', 'bottom']),
  amount: z.number().optional(),
});

// LLM reasoning step
export const LLMReasonStepSchema = BaseStepSchema.extend({
  type: z.literal('llm_reason'),
  prompt: z.string(),
  context: z.record(z.any()).optional(),
  storeAs: z.string(),
  model: z.string().default('gpt-4-turbo-preview'),
});

// Conditional step
export const ConditionalStepSchema = BaseStepSchema.extend({
  type: z.literal('conditional'),
  condition: z.object({
    type: z.enum(['element_exists', 'text_contains', 'variable_equals']),
    value: z.any(),
  }),
  thenSteps: z.array(z.string()), // Step IDs
  elseSteps: z.array(z.string()).optional(),
});

// Loop step
export const LoopStepSchema = BaseStepSchema.extend({
  type: z.literal('loop'),
  iterations: z.number().optional(),
  selector: SelectorSchema.optional(), // Loop over elements
  steps: z.array(z.string()), // Step IDs
});

// Extract step (advanced scraping)
export const ExtractStepSchema = BaseStepSchema.extend({
  type: z.literal('extract'),
  schema: z.record(z.any()), // JSON schema for extraction
  storeAs: z.string(),
});

// Agent action step (for LLM-driven actions)
export const AgentActionStepSchema = BaseStepSchema.extend({
  type: z.literal('agent_action'),
  action: z.string(),
  parameters: z.record(z.any()),
  toolName: z.string(),
});

// Union of all step types
export const WorkflowStepSchema = z.discriminatedUnion('type', [
  GotoStepSchema,
  ClickStepSchema,
  TypeStepSchema,
  WaitStepSchema,
  ScrapeStepSchema,
  ScrollStepSchema,
  LLMReasonStepSchema,
  ConditionalStepSchema,
  LoopStepSchema,
  ExtractStepSchema,
  AgentActionStepSchema,
]);

// Complete workflow schema
export const WorkflowSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  steps: z.array(WorkflowStepSchema),
  variables: z.record(z.any()).default({}),
  settings: z.object({
    supervisedMode: z.boolean().default(true),
    pauseOnError: z.boolean().default(true),
    maxRetries: z.number().default(3),
    screenshotOnError: z.boolean().default(true),
  }).default({}),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  createdBy: z.string().uuid().optional(),
});

// Workflow run schema
export const WorkflowRunSchema = z.object({
  id: z.string().uuid(),
  workflowId: z.string().uuid(),
  status: z.enum(['pending', 'running', 'paused', 'completed', 'failed', 'cancelled']),
  currentStepIndex: z.number().default(0),
  variables: z.record(z.any()).default({}),
  logs: z.array(z.object({
    stepId: z.string(),
    timestamp: z.string().datetime(),
    level: z.enum(['info', 'warning', 'error', 'success']),
    message: z.string(),
    screenshot: z.string().optional(),
  })).default([]),
  error: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

// Recorded event schema (from extension)
export const RecordedEventSchema = z.object({
  type: z.enum(['click', 'input', 'keypress', 'scroll', 'navigation', 'change', 'submit']),
  timestamp: z.number(),
  target: z.object({
    selector: z.string(),
    tagName: z.string(),
    textContent: z.string().optional(),
    value: z.string().optional(),
    attributes: z.record(z.string()).optional(),
  }),
  data: z.record(z.any()).optional(),
  url: z.string().url(),
  viewport: z.object({
    width: z.number(),
    height: z.number(),
  }).optional(),
});

// Agent goal schema
export const AgentGoalSchema = z.object({
  id: z.string().uuid(),
  goal: z.string(),
  context: z.record(z.any()).optional(),
  generatedWorkflowId: z.string().uuid().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  createdAt: z.string().datetime(),
});

// Export types
export type Workflow = z.infer<typeof WorkflowSchema>;
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type WorkflowRun = z.infer<typeof WorkflowRunSchema>;
export type RecordedEvent = z.infer<typeof RecordedEventSchema>;
export type AgentGoal = z.infer<typeof AgentGoalSchema>;
export type Selector = z.infer<typeof SelectorSchema>;

