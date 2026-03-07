type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    callback: (now: number, metadata: VideoFrameCallbackMetadata) => void
  ) => number
  cancelVideoFrameCallback?: (handle: number) => void
}

export function observeVideoDecodeLag(
  video: HTMLVideoElement,
  onLagSample: (lagMs: number) => void
) {
  const monitoredVideo = video as VideoWithFrameCallback

  if (!monitoredVideo.requestVideoFrameCallback) {
    return () => undefined
  }

  let handle = 0
  let active = true

  const tick = (now: number, metadata: VideoFrameCallbackMetadata) => {
    if (!active) return

    const lagMs = Math.max(0, now - metadata.expectedDisplayTime)
    onLagSample(lagMs)
    handle = monitoredVideo.requestVideoFrameCallback!(tick)
  }

  handle = monitoredVideo.requestVideoFrameCallback(tick)

  return () => {
    active = false
    if (handle && monitoredVideo.cancelVideoFrameCallback) {
      monitoredVideo.cancelVideoFrameCallback(handle)
    }
  }
}
