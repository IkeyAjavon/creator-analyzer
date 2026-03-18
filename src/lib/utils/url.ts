export type Platform = "tiktok" | "instagram" | "youtube";

export function detectPlatform(url: string): Platform | null {
  const lower = url.toLowerCase();
  if (lower.includes("tiktok.com") || lower.includes("tiktok")) return "tiktok";
  if (lower.includes("instagram.com") || lower.includes("instagr.am"))
    return "instagram";
  if (
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("youtube")
  )
    return "youtube";
  return null;
}

export function normalizeUrl(url: string): string {
  let normalized = url.trim();
  // Remove tracking params
  try {
    const parsed = new URL(normalized);
    // Keep only essential params
    const essentialParams = ["v"]; // YouTube video ID
    const newParams = new URLSearchParams();
    for (const key of essentialParams) {
      const val = parsed.searchParams.get(key);
      if (val) newParams.set(key, val);
    }
    parsed.search = newParams.toString();
    normalized = parsed.toString();
  } catch {
    // If URL parsing fails, return as-is
  }
  return normalized;
}

export function isValidVideoUrl(url: string): boolean {
  if (!url.trim()) return false;
  try {
    new URL(url);
    return detectPlatform(url) !== null;
  } catch {
    return false;
  }
}

export function getPlatformIcon(platform: Platform): string {
  switch (platform) {
    case "tiktok":
      return "TikTok";
    case "instagram":
      return "Instagram";
    case "youtube":
      return "YouTube";
  }
}

export function getPlatformColor(platform: Platform): string {
  switch (platform) {
    case "tiktok":
      return "#ff0050";
    case "instagram":
      return "#e1306c";
    case "youtube":
      return "#ff0000";
  }
}
