import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const nginx = read('nginx.conf')
const compose = read('docker-compose.yml')
const askRoute = read('app/api/ask/route.ts')
const packageJson = JSON.parse(read('package.json'))

assert(
  /location\s+\/api\/\s*\{[\s\S]*?proxy_pass\s+http:\/\/nextjs;/m.test(nginx),
  'nginx must route public /api/* requests to Next.js route handlers',
)
assert(
  !/location\s+\/api\/\s*\{[\s\S]*?proxy_pass\s+http:\/\/fastapi;/m.test(nginx),
  'nginx must not send public /api/* requests directly to FastAPI',
)
assert(
  !nginx.includes('rewrite ^/api/(.*) /$1 break;'),
  'nginx must not strip /api before Next.js can handle route handlers',
)
assert(
  /proxy_buffer_size\s+32k;/.test(nginx),
  'nginx must allow large upstream response headers for Supabase auth cookies',
)
assert(
  /proxy_buffers\s+8\s+32k;/.test(nginx),
  'nginx must configure enough proxy buffers for Supabase auth cookie chunks',
)
assert(
  /proxy_busy_buffers_size\s+64k;/.test(nginx),
  'nginx must configure busy proxy buffers for large auth responses',
)
assert(
  askRoute.includes('BACKEND_API_URL'),
  'app/api/ask must use BACKEND_API_URL for the internal FastAPI service',
)
assert(
  compose.includes('BACKEND_API_URL=http://api:8000'),
  'docker-compose web service must point BACKEND_API_URL at the api service',
)
assert(
  packageJson.scripts?.['verify:deploy-routing'] === 'node scripts/verify-deploy-routing.mjs',
  'package.json must expose verify:deploy-routing',
)

console.log('Deploy routing verification passed')
