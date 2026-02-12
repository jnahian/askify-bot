#!/usr/bin/env node

import { config } from 'dotenv'
import { resolve } from 'path'
import { spawn } from 'child_process'

// Load .env from parent directory
config({ path: resolve(process.cwd(), '../.env') })

const port = process.env.WEB_PORT || '3001'

// Run vite preview with the port
const vite = spawn('vite', ['preview', '--port', port], {
  stdio: 'inherit',
  shell: true,
})

vite.on('close', (code) => {
  process.exit(code || 0)
})
