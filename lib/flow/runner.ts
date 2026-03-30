import { v4 as uuid } from 'uuid'
import type { AgentConfig, RunRecord, WritebackSuggestion, LLMMessage } from '@/lib/types'
import { chat } from '@/lib/llm'
import { createRun, updateRun, addWritebackSuggestion } from '@/lib/runs'
import { getCoreModules, getModulesByProject } from '@/lib/brain'
import { addFlowMutation, addPendingWriteback } from '@/lib/flow'
import { contextLoader, memoryManager } from './meta-agents'

export interface TaskInput {
  task: string
  agent: AgentConfig
  project_id?: string
}

export async function executeTask(input: TaskInput): Promise<RunRecord> {
  const { task, agent, project_id } = input
  const provider = 'claude'
  const model = 'claude-sonnet-4-6'

  // 1. Create run record
  const run = await createRun({
    agent_id: agent.id,
    agent_name: agent.name,
    agent_mode: agent.mode,
    task,
    project_id,
    model,
    provider,
    linked_modules: agent.linked_brain_modules,
  })

  try {
    // 2. Update status to running
    await updateRun(run.id, { status: 'running' })

    // 3. Load context via context-loader meta-agent
    let contextContent = ''
    if (agent.mode === 'brain-bound') {
      const contextResult = await contextLoader.execute({
        context: {
          mode: agent.mode,
          project: project_id || agent.linked_projects[0],
        },
      })

      const modulePaths = contextResult.result.loaded_modules as string[]
      if (modulePaths.length > 0) {
        const coreModules = await getCoreModules()
        const moduleTexts = coreModules
          .filter(m => modulePaths.includes(m.path))
          .map(m => `## ${m.meta.title}\n${m.content}`)
          .join('\n\n')
        contextContent = `\n\n<brain-context>\n${moduleTexts}\n</brain-context>`
      }
    }

    // 4. Build messages
    const systemPrompt = [
      agent.system_prompt || `You are ${agent.name}. ${agent.description}`,
      contextContent,
      agent.mode === 'brain-bound'
        ? '\nYou are a brain-bound agent. You may suggest writebacks to brain modules by including a section titled "## Suggested Writebacks" at the end of your response, with each suggestion as a bullet point describing what to update and where.'
        : '',
    ].filter(Boolean).join('\n')

    const messages: LLMMessage[] = [
      { role: 'user', content: task },
    ]

    // 5. Call LLM
    const response = await chat({ messages, system: systemPrompt, model })

    // 6. Parse writeback suggestions from output
    const suggestions = parseWritebackSuggestions(response.content, run.id)

    // 7. Process suggestions through memory manager
    if (suggestions.length > 0) {
      const mmResult = await memoryManager.execute({
        context: {},
        suggestions,
      })

      const approved = mmResult.suggestions || []
      for (const suggestion of approved) {
        await addWritebackSuggestion(run.id, suggestion)
        await addPendingWriteback(suggestion)
      }
    }

    // 8. Log flow mutation
    await addFlowMutation({
      type: 'task-completed',
      description: `Agent "${agent.name}" completed task: ${task.slice(0, 80)}`,
      module: 'runs',
      agent: agent.slug,
    })

    // 9. Update run as completed
    const completed = await updateRun(run.id, {
      status: 'completed',
      output: response.content,
    })

    return completed!
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await updateRun(run.id, {
      status: 'failed',
      error: errorMessage,
    })

    await addFlowMutation({
      type: 'task-failed',
      description: `Agent "${agent.name}" failed: ${errorMessage.slice(0, 80)}`,
      module: 'runs',
      agent: agent.slug,
    })

    return (await updateRun(run.id, { status: 'failed', error: errorMessage }))!
  }
}

function parseWritebackSuggestions(output: string, runId: string): WritebackSuggestion[] {
  const suggestions: WritebackSuggestion[] = []
  const writebackSection = output.split('## Suggested Writebacks')[1]
  if (!writebackSection) return suggestions

  const lines = writebackSection.split('\n').filter(l => l.trim().startsWith('-'))
  for (const line of lines) {
    const text = line.replace(/^-\s*/, '').trim()
    if (!text) continue

    suggestions.push({
      id: uuid(),
      run_id: runId,
      type: 'memory',
      target_module: 'core/active-focus.md', // default — extension point for smarter routing
      description: text,
      content: text,
      status: 'pending',
    })
  }

  return suggestions
}
