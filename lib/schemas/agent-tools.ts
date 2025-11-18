import { z } from 'zod';

// Tool definitions for LLM agent

export const BrowserActionToolSchema = z.object({
  name: z.literal('browser_action'),
  parameters: z.object({
    action: z.enum(['navigate', 'click', 'type', 'scrape', 'scroll', 'wait']),
    selector: z.string().optional(),
    value: z.string().optional(),
    url: z.string().url().optional(),
  }),
});

export const EvaluateCandidateToolSchema = z.object({
  name: z.literal('evaluate_candidate'),
  parameters: z.object({
    candidateName: z.string(),
    profile: z.record(z.any()),
    jobRequirements: z.record(z.any()),
  }),
});

export const SendMessageToolSchema = z.object({
  name: z.literal('send_message'),
  parameters: z.object({
    recipientName: z.string(),
    platform: z.enum(['linkedin', 'email', 'indeed']),
    template: z.string(),
    variables: z.record(z.string()),
  }),
});

export const ScheduleMeetingToolSchema = z.object({
  name: z.literal('schedule_meeting'),
  parameters: z.object({
    candidateName: z.string(),
    candidateEmail: z.string(),
    duration: z.number(), // minutes
    proposedTimes: z.array(z.string().datetime()),
  }),
});

export const IngestTranscriptToolSchema = z.object({
  name: z.literal('ingest_transcript'),
  parameters: z.object({
    meetingId: z.string(),
    platform: z.enum(['zoom', 'google_meet', 'teams']),
    transcriptUrl: z.string().url().optional(),
  }),
});

export const SummarizeToolSchema = z.object({
  name: z.literal('summarize'),
  parameters: z.object({
    content: z.string(),
    focusAreas: z.array(z.string()).optional(),
    maxLength: z.number().optional(),
  }),
});

export const UpdateATSToolSchema = z.object({
  name: z.literal('update_ats'),
  parameters: z.object({
    candidateId: z.string().optional(),
    candidateName: z.string(),
    data: z.record(z.any()),
    stage: z.enum(['sourced', 'contacted', 'interview_scheduled', 'interviewed', 'offer', 'rejected']),
  }),
});

export const SearchCandidatesToolSchema = z.object({
  name: z.literal('search_candidates'),
  parameters: z.object({
    platform: z.enum(['linkedin', 'indeed', 'glassdoor']),
    query: z.string(),
    filters: z.record(z.any()).optional(),
    maxResults: z.number().default(20),
  }),
});

export const ErrorRecoveryToolSchema = z.object({
  name: z.literal('error_recovery'),
  parameters: z.object({
    errorType: z.enum(['selector_not_found', 'timeout', 'navigation_failed', 'element_not_visible']),
    context: z.record(z.any()),
    attemptedAction: z.string(),
  }),
});

export const ConditionalBranchToolSchema = z.object({
  name: z.literal('conditional_branch'),
  parameters: z.object({
    condition: z.string(),
    checkType: z.enum(['element_exists', 'text_match', 'data_match']),
    thenAction: z.string(),
    elseAction: z.string().optional(),
  }),
});

// Union of all tool schemas
export const AgentToolCallSchema = z.discriminatedUnion('name', [
  BrowserActionToolSchema,
  EvaluateCandidateToolSchema,
  SendMessageToolSchema,
  ScheduleMeetingToolSchema,
  IngestTranscriptToolSchema,
  SummarizeToolSchema,
  UpdateATSToolSchema,
  SearchCandidatesToolSchema,
  ErrorRecoveryToolSchema,
  ConditionalBranchToolSchema,
]);

// Agent state schema
export const AgentStateSchema = z.object({
  id: z.string().uuid(),
  goalId: z.string().uuid(),
  currentPhase: z.enum(['planning', 'executing', 'evaluating', 'recovering', 'completed']),
  plan: z.array(z.object({
    subgoal: z.string(),
    steps: z.array(z.string()),
    status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
  })),
  context: z.record(z.any()),
  memory: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant', 'tool']),
    content: z.string(),
    timestamp: z.string().datetime(),
  })),
  toolCalls: z.array(AgentToolCallSchema),
  errors: z.array(z.object({
    step: z.string(),
    error: z.string(),
    recoveryAttempt: z.number(),
    resolved: z.boolean(),
  })),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type AgentToolCall = z.infer<typeof AgentToolCallSchema>;
export type AgentState = z.infer<typeof AgentStateSchema>;

