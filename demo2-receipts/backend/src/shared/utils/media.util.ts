/**
 * Media type utilities for file handling
 */

export type MediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf';

/**
 * Determine media type from file extension
 */
export function getMediaType(filepath: string): MediaType {
  const ext = filepath.toLowerCase().split('.').pop();
  const mediaTypes: Record<string, MediaType> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'pdf': 'application/pdf'
  };
  return mediaTypes[ext || 'jpeg'] || 'image/jpeg';
}
