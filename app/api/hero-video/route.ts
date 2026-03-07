import { createReadStream, existsSync } from 'fs'
import { stat } from 'fs/promises'
import type { NextRequest } from 'next/server'
import {
  resolveHeroVideoAssetFile,
  resolveHeroVideoPosterFile,
  type HeroVideoRouteAsset,
  type LandingVideoVariant,
} from '@/lib/server/landingAssetFiles'

export const runtime = 'nodejs'

const VIDEO_FILES = {
  '1080': 'hero_scroll_1080p_iframe.mp4',
  '720': 'hero_scroll_720p_iframe.mp4',
} as const

const SPECIAL_ASSETS = {
  samet: 'Samet.mp4',
} as const

const POSTER_FILE = 'hero_poster.jpg'

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
  const isDev = process.env.NODE_ENV !== 'production'
  const { searchParams } = request.nextUrl
  const version = (searchParams.get('v') ?? '1080') as LandingVideoVariant
  const asset = searchParams.get('asset')
  const isPoster = searchParams.get('poster') === '1' || searchParams.get('asset') === 'poster'
  const cacheControl = isDev ? 'no-store' : 'public, max-age=31536000, immutable'
  const resolvedFile = isPoster
    ? resolveHeroVideoPosterFile()
    : resolveHeroVideoAssetFile(
        asset === 'samet' ? ('samet' as HeroVideoRouteAsset) : ('hero' as HeroVideoRouteAsset),
        version === '720' ? '720' : '1080'
      )
  const assetPath = resolvedFile.path
  let fileStat

  try {
    fileStat = await stat(assetPath)
  } catch (error) {
    if (isDev) {
      console.error('Hero asset not found:', error)
      return new Response(`Hero asset not found at: ${assetPath}`, {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      })
    }

    return new Response('Not Found', { status: 404 })
  }

  if (isDev) {
    console.info(`Hero asset path: ${assetPath}`)
    console.info(`Hero asset size: ${fileStat.size} bytes`)
  }

  if (isPoster) {
    const stream = createReadStream(assetPath)
    const readable = createWebStream(stream, request.signal)
    return new Response(readable, {
      headers: {
        'Content-Length': String(fileStat.size),
        'Content-Type': resolvedFile.contentType,
        'Cache-Control': cacheControl,
      },
    })
  }

  const range = request.headers.get('range')
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
    const stream = createReadStream(assetPath, { start, end })
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

  const stream = createReadStream(assetPath)
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
