import { NextRequest, NextResponse } from 'next/server'
import { getFlowState, updateFlowState } from '@/lib/flow'

export async function GET() {
  const state = await getFlowState()
  return NextResponse.json(state)
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const state = await updateFlowState(body)
  return NextResponse.json(state)
}
