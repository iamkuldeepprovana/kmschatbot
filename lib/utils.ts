import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts Google Cloud Storage URLs (gs://) to public HTTPS URLs
 * Example: gs://mybucket/myfile.pdf -> https://storage.googleapis.com/mybucket/myfile.pdf
 */
export function convertGcsUrlToHttps(text: string): string {
  if (!text) return text;

  return text.replace(
    /gs:\/\/([^\/\s]+)\/([^\s]+)/g,
    (match, bucket, path) => {
      // Optionally, you can log here for debugging
      // console.log('Converting GCS URL to HTTPS:', match);
      return `https://storage.googleapis.com/${bucket}/${path}`;
    }
  );
}
