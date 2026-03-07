import { createReadStream, existsSync } from 'fs'
import { stat } from 'fs/promises'
import path from 'path'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

const createWebStream = (stream: ReturnType<typeof createReadStream>, signal: AbortSignal) =>
  new ReadableStream({
    start(controller) {
      const onData = (chunk: string | Buffer) => {
        try {
          const payload = typeof chunk === 'string' ? Buffer.from(chunk) : chunk
          controller.enqueue(payload)
        } catch {
          stream.destroy()
        }
      }
      const onEnd = () => controller.close()
      const onError = (error: unknown) => controller.error(error)
      const onAbort = () => stream.destroy()

      stream.on('data', onData)
      stream.on('end', onEnd)
      stream.on('error', onError)
      signal.addEventListener('abort', onAbort, { once: true })
      stream.on('close', () => signal.removeEventListener('abort', onAbort))
    },
    cancel() {
      stream.destroy()
    },
  })

export async function GET(request: NextRequest) {
  const asset = request.nextUrl.searchParams.get('asset') ?? 'logo'

  if (asset !== 'logo') {
    return new Response('Not Found', { status: 404 })
  }

  const assetPath = path.join(process.cwd(), 'app', 'api', 'preloader', 'logo.svg')
  const isDev = process.env.NODE_ENV !== 'production'

  try {
    if (!existsSync(assetPath)) {
      throw new Error(`Preloader asset missing: ${assetPath}`)
    }

    const fileStat = await stat(assetPath)
    const stream = createReadStream(assetPath)
    const readable = createWebStream(stream, request.signal)

    return new Response(readable, {
      headers: {
        'Content-Length': String(fileStat.size),
        'Content-Type': 'image/svg+xml',
        'Cache-Control': isDev ? 'no-store' : 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    if (isDev) {
      console.error('Preloader asset not found:', error)
      return new Response(`Preloader asset not found at: ${assetPath}`, {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      })
    }

    return new Response('Not Found', { status: 404 })
  }
}
