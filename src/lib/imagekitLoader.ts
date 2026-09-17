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

  const q = quality || 80;
  const separator = src.includes('?') ? '&' : '?';

  // 1. If it's an ImageKit URL, apply ImageKit transformation parameters
  if (src.includes('ik.imagekit.io')) {
    return `${src}${separator}tr=w-${width},q-${q},f-auto`;
  }

  // 2. If it's an Unsplash URL, apply auto format, crop, responsive width, and quality
  if (src.includes('images.unsplash.com')) {
    return `${src}${separator}auto=format&fit=crop&w=${width}&q=${q}`;
  }

  // 3. If it's a Supabase storage URL, apply width and quality parameters
  if (src.includes('supabase.co/storage/v1/')) {
    return `${src}${separator}width=${width}&quality=${q}`;
  }

  // Fallback for local assets or other external domains
  return src;
}
