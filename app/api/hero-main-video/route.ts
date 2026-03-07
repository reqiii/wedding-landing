import { createReadStream, existsSync } from 'fs'
import { stat } from 'fs/promises'
import type { NextRequest } from 'next/server'
import {
  resolveHeroMainAssetFile,
  type HeroMainVideoRouteAsset,
  type LandingVideoVariant,
} from '@/lib/server/landingAssetFiles'

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
  const { searchParams } = request.nextUrl
  const asset = (searchParams.get('asset') ?? 'hero') as HeroMainVideoRouteAsset
  const version = (searchParams.get('v') ?? '1080') as LandingVideoVariant
  const isLogo = asset === 'logo'
  const resolvedFile = resolveHeroMainAssetFile(
    asset,
    version === '720' ? '720' : '1080'
  )
  const isDev = process.env.NODE_ENV !== 'production'
  let fileStat

  try {
    const assetPath = resolvedFile.path
    if (!existsSync(assetPath)) {
      throw new Error(`Hero main asset missing: ${assetPath}`)
    }
    fileStat = await stat(assetPath)
  } catch (error) {
    if (isDev) {
      console.error('Hero main video not found:', error)
      return new Response(`Hero main asset not found at: ${resolvedFile.path}`, {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      })
    }

    return new Response('Not Found', { status: 404 })
  }

  const cacheControl = isDev ? 'no-store' : 'public, max-age=31536000, immutable'
  const range = request.headers.get('range')

  if (isLogo) {
    const stream = createReadStream(resolvedFile.path)
    const readable = createWebStream(stream, request.signal)
    return new Response(readable, {
      headers: {
        'Content-Length': String(fileStat.size),
        'Content-Type': resolvedFile.contentType,
        'Cache-Control': cacheControl,
      },
    })
  }

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileStat.size - 1
    if (Number.isNaN(start) || Number.isNaN(end) || start >= fileStat.size || end >= fileStat.size) {
      return new Response('Requested Range Not Satisfiable', {
        status: 416,
        headers: {
          'Content-Range': `bytes */${fileStat.size}`,
          'Cache-Control': cacheControl,
        },
      })
    }
    const chunkSize = end - start + 1
    const stream = createReadStream(resolvedFile.path, { start, end })
    const readable = createWebStream(stream, request.signal)

    return new Response(readable, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileStat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': resolvedFile.contentType,
        'Cache-Control': cacheControl,
      },
    })
  }

  const stream = createReadStream(resolvedFile.path)
  const readable = createWebStream(stream, request.signal)
  return new Response(readable, {
    headers: {
      'Content-Length': String(fileStat.size),
      'Content-Type': resolvedFile.contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': cacheControl,
    },
  })
}
