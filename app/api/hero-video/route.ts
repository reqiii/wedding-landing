import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import path from 'path'
import { Readable } from 'stream'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const videoPath = path.join(process.cwd(), 'Samet.mp4')
  const isDev = process.env.NODE_ENV !== 'production'
  let fileStat

  try {
    fileStat = await stat(videoPath)
  } catch (error) {
    if (isDev) {
      console.error('Hero video not found:', error)
      return new Response(`Hero video not found at: ${videoPath}`, {
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
    console.info(`Hero video path: ${videoPath}`)
    console.info(`Hero video size: ${fileStat.size} bytes`)
  }

  const cacheControl = isDev ? 'no-store' : 'public, max-age=31536000, immutable'
  const range = request.headers.get('range')

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileStat.size - 1
    const chunkSize = end - start + 1
    const stream = createReadStream(videoPath, { start, end })

    return new Response(Readable.toWeb(stream) as ReadableStream, {
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
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      'Content-Length': String(fileStat.size),
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': cacheControl,
    },
  })
}
