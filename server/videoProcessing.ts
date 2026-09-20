import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { mediaRules } from "@shared/mediaRules";

const execFileAsync = promisify(execFile);
const inputMimeTypes = new Set(["video/mp4", "video/webm", "video/quicktime", "video/ogg"]);

function getFfmpegPath() { return process.env.FFMPEG_PATH || "ffmpeg"; }

export async function optimizeGalleryVideo(input: { bytes: Buffer; filename: string; mimeType: string }) {
  if (!inputMimeTypes.has(input.mimeType)) throw new Error("FORMAT_VIDEO_NON_SUPPORTÉ");
  if (input.bytes.byteLength > mediaRules.video.maxInputBytes) throw new Error("VIDEO_TROP_LOURDE");

  const dir = await mkdtemp(`${tmpdir()}/sc-video-`);
  const safeBase = input.filename.replace(/[^a-z0-9._-]/gi, "-").replace(/\.[^.]+$/, "") || "video";
  const sourcePath = `${dir}/${safeBase}.source`;
  const outputPath = `${dir}/${safeBase}.mp4`;
  const posterPath = `${dir}/${safeBase}.jpg`;

  try {
    await writeFile(sourcePath, input.bytes);
    const ffmpeg = getFfmpegPath();
    try {
      await execFileAsync(ffmpeg, [
        "-hide_banner", "-loglevel", "error", "-y", "-i", sourcePath,
        "-map", "0:v:0", "-map", "0:a:0?", "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease",
        "-r", String(mediaRules.video.maxFps), "-c:v", "libx264", "-preset", "veryfast",
        "-crf", "28", "-maxrate", mediaRules.video.outputVideoBitrate, "-bufsize", "8M",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", mediaRules.video.audioBitrate,
        "-movflags", "+faststart", "-map_metadata", "-1", outputPath,
      ], { maxBuffer: 1024 * 1024 * 4 });
      await execFileAsync(ffmpeg, [
        "-hide_banner", "-loglevel", "error", "-y", "-ss", "0.5", "-i", outputPath,
        "-frames:v", "1", "-vf", "scale=1280:720:force_original_aspect_ratio=decrease",
        "-q:v", "4", posterPath,
      ], { maxBuffer: 1024 * 1024 });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message.includes("ENOENT")
        ? "Le service de traitement vidéo n’est pas disponible. Configurez FFMPEG_PATH."
        : "La vidéo n’a pas pu être optimisée. Vérifiez son format et son contenu.");
    }
    const [video, poster] = await Promise.all([readFile(outputPath), readFile(posterPath)]);
    return { video, poster, filename: safeBase, mimeType: "video/mp4" as const, posterMimeType: "image/jpeg" as const };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
