export type MediaKind = "profile" | "logo" | "gallery" | "video";

export const mediaRules = {
  profile: { maxBytes: 30 * 1024, maxWidth: 400, maxHeight: 400, square: true },
  logo: { maxBytes: 80 * 1024, maxWidth: 1200, maxHeight: 200, square: false },
  gallery: {
    maxBytes: 80 * 1024,
    maxWidth: 1200,
    maxHeight: 1200,
    square: false,
  },
  video: {
    maxInputBytes: 50 * 1024 * 1024,
    maxWidth: 1920,
    maxHeight: 1080,
    outputVideoBitrate: "4M",
    audioBitrate: "128k",
    maxFps: 30,
  },
} as const;

export function getOutputDimensions(
  kind: Exclude<MediaKind, "video">,
  width: number,
  height: number
) {
  const rule = mediaRules[kind];
  if (rule.square) return { width: rule.maxWidth, height: rule.maxHeight };
  const scale = Math.min(1, rule.maxWidth / width, rule.maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
