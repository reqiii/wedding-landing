import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import path from 'path'
import { Readable } from 'stream'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const videoPath = path.join(process.cwd(), 'video_background.mov')
  const fileStat = await stat(videoPath)
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
        'Content-Type': 'video/quicktime',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }

  const stream = createReadStream(videoPath)
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      'Content-Length': String(fileStat.size),
      'Content-Type': 'video/quicktime',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
