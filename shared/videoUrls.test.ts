import { describe, expect, it } from "vitest";
import { parseVideoUrl } from "./videoUrls";

describe("parseVideoUrl", () => {
  it("supports YouTube watch, shorts and embed URLs", () => {
    expect(parseVideoUrl("https://www.youtube.com/watch?v=abcDEF_123")?.source).toBe("youtube");
    expect(parseVideoUrl("https://youtube.com/shorts/abcDEF_123")?.embedUrl).toContain("/embed/abcDEF_123");
    expect(parseVideoUrl("https://www.youtube.com/embed/abcDEF_123")?.source).toBe("youtube");
  });

  it("supports social and Vimeo URLs", () => {
    expect(parseVideoUrl("https://www.instagram.com/reel/ABC123/")?.source).toBe("instagram");
    expect(parseVideoUrl("https://www.facebook.com/reel/123456789/")?.source).toBe("facebook");
    expect(parseVideoUrl("https://www.tiktok.com/@user/video/1234567890123456789")?.source).toBe("tiktok");
    expect(parseVideoUrl("https://vimeo.com/123456789")?.source).toBe("vimeo");
  });

  it("supports direct HTTPS video files", () => {
    expect(parseVideoUrl("https://cdn.example.com/video.mp4")?.source).toBe("direct");
    expect(parseVideoUrl("https://cdn.example.com/video.webm?download=1")?.source).toBe("direct");
  });

  it("rejects unsupported or unsafe URLs", () => {
    expect(parseVideoUrl("http://cdn.example.com/video.mp4")).toBeNull();
    expect(parseVideoUrl("javascript:alert(1)")).toBeNull();
    expect(parseVideoUrl("https://example.com/page-with-a-video")).toBeNull();
    expect(parseVideoUrl("https://www.youtube.com/watch?v=bad")).toBeNull();
  });
});
