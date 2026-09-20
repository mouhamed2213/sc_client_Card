export type VideoSource = "youtube" | "instagram" | "facebook" | "tiktok" | "vimeo" | "direct";

export type ParsedVideoUrl = {
  source: VideoSource;
  url: string;
  embedUrl: string;
};

const DIRECT_VIDEO_EXTENSIONS = /\.(?:mp4|webm|ogg)(?:$|[?#])/i;

function hostMatches(hostname: string, domains: string[]) {
  const host = hostname.toLowerCase();
  return domains.some(domain => host === domain || host.endsWith("." + domain));
}

function youtubeId(url: URL) {
  if (hostMatches(url.hostname, ["youtu.be"])) return url.pathname.split("/").filter(Boolean)[0] ?? null;
  if (hostMatches(url.hostname, ["youtube.com", "youtube-nocookie.com"])) {
    if (url.pathname === "/watch") return url.searchParams.get("v");
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "shorts" || parts[0] === "embed") return parts[1] ?? null;
  }
  return null;
}

export function parseVideoUrl(value: string): ParsedVideoUrl | null {
  let url: URL;
  try { url = new URL(value.trim()); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;

  const id = youtubeId(url);
  if (id && /^[A-Za-z0-9_-]{6,128}$/.test(id)) {
    return {
      source: "youtube",
      url: url.toString(),
      embedUrl: "https://www.youtube-nocookie.com/embed/" + id,
    };
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (hostMatches(url.hostname, ["instagram.com"])) {
    const kind = parts[0];
    const shortcode = parts[1];
    if ((kind === "reel" || kind === "reels" || kind === "p") && shortcode) {
      return {
        source: "instagram",
        url: url.toString(),
        embedUrl: "https://www.instagram.com/" + kind + "/" + encodeURIComponent(shortcode) + "/embed/",
      };
    }
  }

  if (hostMatches(url.hostname, ["facebook.com", "fb.watch"])) {
    if (hostMatches(url.hostname, ["fb.watch"]) || parts.includes("videos") || parts[0] === "reel" || parts.includes("reel") || (url.pathname === "/watch" && url.searchParams.has("v"))) {
      return {
        source: "facebook",
        url: url.toString(),
        embedUrl: "https://www.facebook.com/plugins/video.php?href=" + encodeURIComponent(url.toString()) + "&show_text=false",
      };
    }
  }

  if (hostMatches(url.hostname, ["tiktok.com"])) {
    const videoIndex = parts.indexOf("video");
    const tiktokId = videoIndex >= 0 ? parts[videoIndex + 1] : null;
    if (tiktokId && /^\d{6,32}$/.test(tiktokId)) {
      return {
        source: "tiktok",
        url: url.toString(),
        embedUrl: "https://www.tiktok.com/player/v1/" + tiktokId,
      };
    }
  }

  if (hostMatches(url.hostname, ["vimeo.com"])) {
    const vimeoId = parts.find(part => /^\d{6,15}$/.test(part));
    if (vimeoId) {
      return {
        source: "vimeo",
        url: url.toString(),
        embedUrl: "https://player.vimeo.com/video/" + vimeoId,
      };
    }
  }

  if (DIRECT_VIDEO_EXTENSIONS.test(url.pathname + url.search)) {
    return { source: "direct", url: url.toString(), embedUrl: url.toString() };
  }

  return null;
}
