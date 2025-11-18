import OpenAI from 'openai';
import { agentTools, executeToolCall } from './tools';
import type { AgentState } from '@/lib/schemas/agent-tools';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class AgentExecutor {
  private state: AgentState;
  private maxIterations: number = 50;

  constructor(goalId: string, goal: string, context: Record<string, any>) {
    this.state = {
      id: crypto.randomUUID(),
      goalId,
      currentPhase: 'planning',
      plan: [],
      context,
      memory: [
        {
          role: 'system',
          content: `You are an intelligent automation agent. Your job is to accomplish user goals by breaking them down into actionable steps and executing them using available tools.

Available tools:
- browser_action: Navigate, click, type, scrape, scroll, wait
- search_candidates: Search for candidates on job platforms
- evaluate_candidate: Evaluate if a candidate fits requirements
- send_message: Send messages to candidates
- schedule_meeting: Schedule meetings
- ingest_transcript: Get meeting transcripts
- summarize: Summarize content
- update_ats: Update ATS systems
- error_recovery: Recover from errors
- conditional_branch: Make decisions

You should:
1. Plan the steps needed to accomplish the goal
2. Execute each step using the appropriate tools
3. Handle errors and adapt as needed
4. Provide clear explanations of what you're doing`,
          timestamp: new Date().toISOString(),
        },
        {
          role: 'user',
          content: `Goal: ${goal}\n\nContext: ${JSON.stringify(context)}`,
          timestamp: new Date().toISOString(),
        },
      ],
      toolCalls: [],
      errors: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async execute(): Promise<void> {
    // Save initial state
    await this.saveState();

    let iteration = 0;

    while (iteration < this.maxIterations && this.state.currentPhase !== 'completed') {
      iteration++;

      try {
        await this.executeIteration();
        await this.saveState();
      } catch (error: any) {
        console.error('Error in agent iteration:', error);
        this.state.errors.push({
          step: `iteration-${iteration}`,
          error: error.message,
          recoveryAttempt: 0,
          resolved: false,
        });

        // Try to recover
        if (this.state.currentPhase !== 'recovering') {
          this.state.currentPhase = 'recovering';
        } else {
          // Failed to recover
          break;
        }
      }

      // Small delay between iterations
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.state.currentPhase = 'completed';
    await this.saveState();
  }

  private async executeIteration(): Promise<void> {
    // Get next action from LLM
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: this.state.memory as any,
      tools: agentTools,
      tool_choice: 'auto',
    });

    const message = completion.choices[0].message;

    // Add assistant message to memory
    this.state.memory.push({
      role: 'assistant',
      content: message.content || '',
      timestamp: new Date().toISOString(),
    });

    // Check if agent wants to use tools
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name;
        const toolParameters = JSON.parse(toolCall.function.arguments);

        console.log(`Executing tool: ${toolName}`, toolParameters);

        // Execute the tool
        const result = await executeToolCall({
          name: toolName as any,
          parameters: toolParameters,
        });

        // Record tool call
        this.state.toolCalls.push({
          name: toolName as any,
          parameters: toolParameters,
        });

        // Add tool result to memory
        this.state.memory.push({
          role: 'tool',
          content: JSON.stringify(result),
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      // Agent provided a text response, check if it indicates completion
      if (
        message.content?.toLowerCase().includes('completed') ||
        message.content?.toLowerCase().includes('finished')
      ) {
        this.state.currentPhase = 'completed';
      }
    }

    this.state.updatedAt = new Date().toISOString();
  }

  private async saveState(): Promise<void> {
    const { error } = await supabase
      .from('agent_states')
      .upsert({
        id: this.state.id,
        goal_id: this.state.goalId,
        current_phase: this.state.currentPhase,
        plan: this.state.plan,
        context: this.state.context,
        memory: this.state.memory,
        tool_calls: this.state.toolCalls,
        errors: this.state.errors,
        updated_at: this.state.updatedAt,
      });

    if (error) {
      console.error('Error saving agent state:', error);
    }
  }

  getState(): AgentState {
    return this.state;
  }
}

