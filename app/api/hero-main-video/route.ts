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
  const { searchParams } = request.nextUrl
  const asset = searchParams.get('asset') ?? 'hero'
  const version = searchParams.get('v') ?? '1080'
  const assetKey = `${asset}-${version}`
  const isLogo = asset === 'logo'

  const assetFiles: Record<string, string> = {
    'section1-1080': 'hero_scroll_1080p_iframe_1_section.mp4',
    'section1-720': 'hero_scroll_720p_iframe_1_section.mp4',
    'section2-1080': 'hero_scroll_1080p_iframe_2_section.mp4',
    'section2-720': 'hero_scroll_720p_iframe_2_section.mp4',
    'sun-1080': 'the_sun_1080p_iframe.mp4',
    'sun-720': 'the_sun_720p_iframe.mp4',
  }

  const resolvedAsset = assetFiles[assetKey]
  const fallbackAsset = assetFiles[`${asset}-1080`]
  const videoPath = resolvedAsset || fallbackAsset
    ? path.join(process.cwd(), 'app', 'api', 'hero-main-video', resolvedAsset ?? fallbackAsset)
    : path.join(process.cwd(), 'Samet.mp4')
  const logoPath = path.join(process.cwd(), 'app', 'api', 'hero-main-video', 'logo.png')
  const isDev = process.env.NODE_ENV !== 'production'
  let fileStat

  try {
    const assetPath = isLogo ? logoPath : videoPath
    if (!existsSync(assetPath)) {
      throw new Error(`Hero main asset missing: ${assetPath}`)
    }
    fileStat = await stat(assetPath)
  } catch (error) {
    if (isDev) {
      console.error('Hero main video not found:', error)
      return new Response(`Hero main asset not found at: ${isLogo ? logoPath : videoPath}`, {
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
    const stream = createReadStream(logoPath)
    const readable = createWebStream(stream, request.signal)
    return new Response(readable, {
      headers: {
        'Content-Length': String(fileStat.size),
        'Content-Type': 'image/png',
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
    const stream = createReadStream(videoPath, { start, end })
    const readable = createWebStream(stream, request.signal)

    return new Response(readable, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileStat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': 'video/mp4',
        'Cache-Control': cacheControl,
      },
    })
  }

  const stream = createReadStream(videoPath)
  const readable = createWebStream(stream, request.signal)
  return new Response(readable, {
    headers: {
      'Content-Length': String(fileStat.size),
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': cacheControl,
    },
  })
}
