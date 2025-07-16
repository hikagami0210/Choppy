import { parseBuffer } from "music-metadata-browser";
import type { AudioMetadata, Picture } from "../types";

export async function extractMetadata(
  file: File
): Promise<AudioMetadata | null> {
  try {
    const buffer = await file.arrayBuffer();
    const metadata = await parseBuffer(new Uint8Array(buffer));

    return {
      title: metadata.common.title,
      artist: metadata.common.artist,
      album: metadata.common.album,
      year: metadata.common.year?.toString(),
      genre: metadata.common.genre,
      picture: metadata.common.picture?.map((pic) => ({
        format: pic.format,
        data: pic.data,
        description: pic.description,
        type: pic.type,
      })) as Picture[],
    };
  } catch (error) {
    console.error("メタデータの抽出に失敗しました:", error);
    return null;
  }
}

export function createSegmentMetadata(
  originalMetadata: AudioMetadata | null,
  segmentTitle: string,
  trackNumber?: number
): AudioMetadata {
  if (!originalMetadata) {
    return {
      title: segmentTitle,
    };
  }

  const segmentMetadata: AudioMetadata = {
    ...originalMetadata,
    title: segmentTitle,
  };

  if (trackNumber) {
    segmentMetadata.track = { no: trackNumber, of: null };
  }

  return segmentMetadata;
}

export function sanitizeFilename(filename: string): string {
  // ファイル名として使用できない文字を除去または置換
  return filename
    .replace(/[<>:"/\\|?*]/g, "") // 禁止文字を除去
    .replace(/\s+/g, " ") // 連続する空白を1つに
    .trim()
    .substring(0, 200); // 長さ制限
}
