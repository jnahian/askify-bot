import { readFile } from 'fs/promises'
import { join, normalize, relative } from 'path'
import { fileURLToPath } from 'url'
import server from '../dist/server/server.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const clientDir = join(__dirname, '..', 'dist', 'client')

// List of static file extensions to serve
const staticExtensions = [
  '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', 
  '.woff', '.woff2', '.ttf', '.eot', '.webp', '.xml', '.json', '.webmanifest'
]

// Regex to detect content-hashed files (e.g., main-Bugs4Q3d.js)
const contentHashedFileRegex = /-[a-f0-9]{8,}\.(js|css)$/i

export default async function handler(request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Check if this is a request for a static file
  const isStaticFile = staticExtensions.some(ext => pathname.endsWith(ext))
  
  if (isStaticFile) {
    try {
      // Serve static files from dist/client with path traversal protection
      const requestedPath = normalize(join(clientDir, pathname))
      
      // Security: Ensure the resolved path is within clientDir
      const relativePath = relative(clientDir, requestedPath)
      if (relativePath.startsWith('..') || requestedPath === clientDir) {
        // Path traversal attempt detected
        return new Response('Forbidden', { status: 403 })
      }
      
      const content = await readFile(requestedPath)
      
      // Determine content type
      const ext = pathname.substring(pathname.lastIndexOf('.'))
      const contentTypes = {
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.webp': 'image/webp',
        '.xml': 'application/xml',
        '.json': 'application/json',
        '.webmanifest': 'application/manifest+json'
      }
      
      // Use aggressive caching only for content-hashed files
      const isContentHashed = contentHashedFileRegex.test(pathname)
      const cacheControl = isContentHashed
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=3600'
      
      return new Response(content, {
        headers: {
          'Content-Type': contentTypes[ext] || 'application/octet-stream',
          'Cache-Control': cacheControl
        }
      })
    } catch (error) {
      // Log error for debugging but continue to SSR fallback
      console.error(`Error serving static file ${pathname}:`, error.message)
      // File not found or error reading, fall through to SSR
    }
  }

  // For all other requests (page routes), use the TanStack Start server
  const response = await server.fetch(request)
  return response
}

