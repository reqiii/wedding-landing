import { existsSync } from 'fs'
import path from 'path'

export type HeroVideoRouteAsset = 'hero' | 'samet'
export type HeroMainVideoRouteAsset = 'hero' | 'section1' | 'section2' | 'sun' | 'logo'
export type LandingVideoVariant = '1080' | '720'

type FileDescriptor = {
  path: string
  contentType: string
}

const ROOT = process.cwd()

const HERO_VIDEO_FILES: Record<LandingVideoVariant, string> = {
  '1080': 'hero_scroll_1080p_iframe.mp4',
  '720': 'hero_scroll_720p_iframe.mp4',
}

const HERO_MAIN_VIDEO_FILES: Record<Exclude<HeroMainVideoRouteAsset, 'logo'>, Record<LandingVideoVariant, string>> = {
  hero: {
    '1080': 'hero_scroll_1080p_iframe.mp4',
    '720': 'hero_scroll_720p_iframe.mp4',
  },
  section1: {
    '1080': 'hero_scroll_1080p_iframe_1_section.mp4',
    '720': 'hero_scroll_720p_iframe_1_section.mp4',
  },
  section2: {
    '1080': 'hero_scroll_1080p_iframe_2_section.mp4',
    '720': 'hero_scroll_720p_iframe_2_section.mp4',
  },
  sun: {
    '1080': 'the_sun_1080p_iframe.mp4',
    '720': 'the_sun_720p_iframe.mp4',
  },
}

function resolveExistingPath(candidates: string[]) {
  const matched = candidates.find((candidate) => existsSync(candidate))
  return matched ?? candidates[candidates.length - 1]
}

export function resolveHeroVideoAssetFile(
  asset: HeroVideoRouteAsset,
  version: LandingVideoVariant
): FileDescriptor {
  if (asset === 'samet') {
    const filePath = resolveExistingPath([
      path.join(ROOT, 'Samet.mp4'),
      path.join(ROOT, 'app', 'api', 'hero-video', 'Samet.mp4'),
    ])
    return {
      path: filePath,
      contentType: 'video/mp4',
    }
  }

  const fileName = HERO_VIDEO_FILES[version]
  return {
    path: resolveExistingPath([
      path.join(ROOT, fileName),
      path.join(ROOT, 'app', 'api', 'hero-video', fileName),
    ]),
    contentType: 'video/mp4',
  }
}

export function resolveHeroVideoPosterFile(): FileDescriptor {
  const fileName = 'hero_poster.jpg'
  return {
    path: resolveExistingPath([
      path.join(ROOT, fileName),
      path.join(ROOT, 'app', 'api', 'hero-video', fileName),
    ]),
    contentType: 'image/jpeg',
  }
}

export function resolveHeroMainAssetFile(
  asset: HeroMainVideoRouteAsset,
  version: LandingVideoVariant
): FileDescriptor {
  if (asset === 'logo') {
    return {
      path: path.join(ROOT, 'app', 'api', 'hero-main-video', 'logo.svg'),
      contentType: 'image/svg+xml',
    }
  }

  const fileName = HERO_MAIN_VIDEO_FILES[asset][version]
  return {
    path: path.join(ROOT, 'app', 'api', 'hero-main-video', fileName),
    contentType: 'video/mp4',
  }
}
