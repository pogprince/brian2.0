import { NextRequest, NextResponse } from 'next/server'
import { getFlowState, resolvePendingWriteback } from '@/lib/flow'
import { updateBrainModule, getBrainModule } from '@/lib/brain'

export async function GET() {
  const state = await getFlowState()
  return NextResponse.json(state.pending_writebacks)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { id, action } = body // action: 'approve' | 'reject'

  const resolved = await resolvePendingWriteback(id, action === 'approve' ? 'approved' : 'rejected')
  if (!resolved) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // If approved, apply the writeback
  if (action === 'approve') {
    const module = await getBrainModule(resolved.target_module)
    if (module) {
      const updatedContent = module.content + '\n\n' + resolved.content
      await updateBrainModule(resolved.target_module, updatedContent)
    }
  }

  return NextResponse.json(resolved)
}
