import type { AudioSegment, AudioMetadata, Timestamp } from "../types";
import { createSegmentMetadata, sanitizeFilename } from "./metadataHandler";
import * as lamejs from "@breezystack/lamejs";

function getFileExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext || "wav";
}

export async function loadAudioFile(file: File): Promise<AudioBuffer> {
  const audioContext = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  audioContext.close();
  return audioBuffer;
}

export async function splitAudio(
  audioBuffer: AudioBuffer,
  originalFile: File,
  timestamps: Timestamp[],
  originalMetadata: AudioMetadata | null,
  onProgress?: (progress: number) => void
): Promise<AudioSegment[]> {
  const audioContext = new AudioContext();
  const segments: AudioSegment[] = [];
  const totalSegments = timestamps.length;

  for (let i = 0; i < timestamps.length; i++) {
    const timestamp = timestamps[i];
    const startSample = Math.floor(
      timestamp.startTime * audioBuffer.sampleRate
    );
    const endSample = Math.floor(
      timestamp.endTime * audioBuffer.sampleRate
    );
    const segmentLength = endSample - startSample;

    if (segmentLength <= 0) {
      throw new Error(`セグメント "${timestamp.title}" の長さが無効です`);
    }

    // 新しいオーディオバッファを作成
    const segmentBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      segmentLength,
      audioBuffer.sampleRate
    );

    // 各チャンネルのデータをコピー
    for (
      let channel = 0;
      channel < audioBuffer.numberOfChannels;
      channel++
    ) {
      const sourceData = audioBuffer.getChannelData(channel);
      const segmentData = segmentBuffer.getChannelData(channel);

      for (let j = 0; j < segmentLength; j++) {
        const sourceIndex = startSample + j;
        if (sourceIndex < sourceData.length) {
          segmentData[j] = sourceData[sourceIndex];
        }
      }
    }

    // 元のファイル形式で出力
    const originalExtension = getFileExtension(originalFile.name);
    const filename =
      sanitizeFilename(timestamp.title) + "." + originalExtension;

    let blob: Blob;
    if (originalExtension === "mp3") {
      blob = await audioBufferToMp3(segmentBuffer);
    } else {
      blob = await audioBufferToWav(segmentBuffer);
    }

    const segmentMetadata = createSegmentMetadata(
      originalMetadata,
      timestamp.title,
      i + 1
    );

    segments.push({
      blob,
      filename,
      duration: timestamp.endTime - timestamp.startTime,
      metadata: segmentMetadata,
    });

    if (onProgress) {
      onProgress((i + 1) / totalSegments);
    }
  }

  audioContext.close();
  return segments;
}

async function audioBufferToWav(buffer: AudioBuffer): Promise<Blob> {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = numberOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // WAVヘッダーを書き込み
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, bufferSize - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // オーディオデータを書き込み
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(
        -1,
        Math.min(1, buffer.getChannelData(channel)[i])
      );
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

async function audioBufferToMp3(buffer: AudioBuffer): Promise<Blob> {
  const mp3encoder = new lamejs.Mp3Encoder(
    buffer.numberOfChannels,
    buffer.sampleRate,
    128
  );
  const mp3Data: number[] = [];

  const length = buffer.length;
  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;

  // Float32ArrayをInt16Arrayに変換
  const leftInt16 = new Int16Array(length);
  const rightInt16 = new Int16Array(length);

  for (let i = 0; i < length; i++) {
    leftInt16[i] = left[i] * 0x7fff;
    rightInt16[i] = right[i] * 0x7fff;
  }

  const sampleBlockSize = 1152; // MP3のフレームサイズ
  for (let i = 0; i < length; i += sampleBlockSize) {
    const leftSample = leftInt16.subarray(i, i + sampleBlockSize);
    const rightSample = rightInt16.subarray(i, i + sampleBlockSize);
    const mp3buf = mp3encoder.encodeBuffer(leftSample, rightSample);
    if (mp3buf.length > 0) {
      mp3Data.push(...mp3buf);
    }
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(...mp3buf);
  }

  return new Blob([new Uint8Array(mp3Data)], { type: "audio/mpeg" });
}

export function getDuration(audioBuffer: AudioBuffer): number {
  return audioBuffer.duration;
}