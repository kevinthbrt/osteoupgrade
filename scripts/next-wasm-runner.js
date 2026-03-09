const path = require('path')
const { spawn } = require('child_process')

const hookPath = path.join(__dirname, 'next-wasm-hook.js')
const nextBinPath = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next')
const existingNodeOptions = process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : ''
const env = {
  ...process.env,
  NODE_OPTIONS: `${existingNodeOptions}--require=${hookPath}`,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
}

const child = spawn(process.execPath, [nextBinPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
