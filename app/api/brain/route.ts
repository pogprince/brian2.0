import { NextResponse } from 'next/server'
import { listBrainModules } from '@/lib/brain'

export async function GET() {
  const modules = await listBrainModules()
  return NextResponse.json(modules)
}
