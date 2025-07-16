import JSZip from 'jszip';
import type { AudioSegment } from '../types';

export async function generateZip(
  segments: AudioSegment[],
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const total = segments.length;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    zip.file(segment.filename, segment.blob);
    
    if (onProgress) {
      onProgress((i + 1) / total);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

export function createDownloadFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  
  return `分割音声_${year}${month}${day}_${hours}${minutes}${seconds}.zip`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}