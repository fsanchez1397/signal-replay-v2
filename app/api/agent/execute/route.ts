import { NextRequest, NextResponse } from 'next/server';
import { AgentExecutor } from '@/lib/agent/executor';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { goalId, goal, context } = await request.json();

    if (!goalId || !goal) {
      return NextResponse.json(
        { error: 'Goal ID and goal are required' },
        { status: 400 }
      );
    }

    // Update goal status
    await supabase
      .from('agent_goals')
      .update({ status: 'processing' })
      .eq('id', goalId);

    // Execute agent
    const executor = new AgentExecutor(goalId, goal, context || {});
    
    // Run in background (in production, use a queue)
    executor.execute().then(async () => {
      await supabase
        .from('agent_goals')
        .update({ status: 'completed' })
        .eq('id', goalId);
    }).catch(async (error) => {
      await supabase
        .from('agent_goals')
        .update({ 
          status: 'failed',
          error: error.message 
        })
        .eq('id', goalId);
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Agent execution started' 
    });
  } catch (error: any) {
    console.error('Error executing agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute agent' },
      { status: 500 }
    );
  }
}

