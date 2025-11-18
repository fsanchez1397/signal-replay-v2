import { NextRequest, NextResponse } from 'next/server';
import { generateWorkflowFromGoal } from '@/lib/agent/planner';

export async function POST(request: NextRequest) {
  try {
    const { goal, context } = await request.json();

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal is required' },
        { status: 400 }
      );
    }

    const workflow = await generateWorkflowFromGoal(goal, context || {});

    return NextResponse.json({ workflow });
  } catch (error: any) {
    console.error('Error generating workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate workflow' },
      { status: 500 }
    );
  }
}

