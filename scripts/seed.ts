import fs from 'fs/promises'
import path from 'path'

const ROOT = process.cwd()

const dirs = [
  'data/agents',
  'data/runs',
  'data/projects',
  'data/flow',
  'brain/core',
  'brain/projects/brain-mvp',
  'brain/archive',
  'brain/generated',
]

async function seed() {
  console.log('Ensuring directory structure...')
  for (const dir of dirs) {
    await fs.mkdir(path.join(ROOT, dir), { recursive: true })
  }
  console.log('Directory structure ready.')
  console.log('')
  console.log('Seed data should already exist in the repository.')
  console.log('If files are missing, check the data/ and brain/ directories.')
  console.log('')
  console.log('Setup complete! Run `npm run dev` to start the app.')
}

seed().catch(console.error)
