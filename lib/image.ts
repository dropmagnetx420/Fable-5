// Client-side image compression for uploads. Phone camera photos are often
// several MB; shrinking them before upload makes Supabase Storage uploads far
// more reliable on mobile (large raw uploads frequently drop with a network
// "Failed to fetch") and keeps history fast. Never throws — on any failure it
// returns the original file so a compression hiccup can't block an upload.

const MAX_EDGE = 1600;
const QUALITY = 0.82;

interface Decoded {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

export async function compressImage(file: File): Promise<File> {
  if (typeof document === "undefined" || !file.type.startsWith("image/")) return file;
  // GIFs would lose animation; SVGs don't rasterize meaningfully — leave both as-is.
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;

  let decoded: Decoded | null = null;
  try {
    decoded = await decode(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(decoded.width, decoded.height));
    const w = Math.max(1, Math.round(decoded.width * scale));
    const h = Math.max(1, Math.round(decoded.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(decoded.source, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", QUALITY)
    );
    // If compression didn't actually help (e.g. already-tiny image), keep original.
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    decoded?.cleanup();
  }
}

async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    // Prefer createImageBitmap; request EXIF orientation so phone photos aren't
    // rotated. Fall back if the option or the decode isn't supported.
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, width: bmp.width, height: bmp.height, cleanup: () => bmp.close() };
    } catch {
      try {
        const bmp = await createImageBitmap(file);
        return { source: bmp, width: bmp.width, height: bmp.height, cleanup: () => bmp.close() };
      } catch {
        // fall through to <img>
      }
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImg(url);
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      cleanup: () => URL.revokeObjectURL(url),
    };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
