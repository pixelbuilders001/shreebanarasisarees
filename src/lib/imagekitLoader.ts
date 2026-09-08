/**
 * ImageKit Custom Loader for Next.js <Image />
 *
 * Offloads all image optimization, responsive resizing, WebP/AVIF format
 * conversion, and quality compression directly to ImageKit's global CDN.
 * This completely bypasses Vercel's Image Optimization server and consumes
 * ZERO Vercel optimization quota.
 */
export default function imageKitLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // If no source or data URI (e.g. placeholder SVGs), return untouched
  if (!src || src.startsWith('data:')) {
    return src;
  }

  // If it's an ImageKit URL, apply ImageKit transformation parameters
  if (src.includes('ik.imagekit.io')) {
    const q = quality || 80;
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}tr=w-${width},q-${q},f-auto`;
  }

  // External images (e.g. Unsplash stock) return untouched
  return src;
}
