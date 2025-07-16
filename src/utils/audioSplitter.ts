import type { AudioSegment, AudioMetadata, Timestamp } from '../types';
import { createSegmentMetadata, sanitizeFilename } from './metadataHandler';

export class AudioSplitter {
  private audioContext: AudioContext;
  private audioBuffer: AudioBuffer | null = null;

  constructor() {
    this.audioContext = new AudioContext();
  }

  async loadAudioFile(file: File): Promise<AudioBuffer> {
    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    return this.audioBuffer;
  }

  async splitAudio(
    timestamps: Timestamp[],
    originalMetadata: AudioMetadata | null,
    onProgress?: (progress: number) => void
  ): Promise<AudioSegment[]> {
    if (!this.audioBuffer) {
      throw new Error('オーディオファイルが読み込まれていません');
    }

    const segments: AudioSegment[] = [];
    const totalSegments = timestamps.length;

    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const startSample = Math.floor(timestamp.startTime * this.audioBuffer.sampleRate);
      const endSample = Math.floor(timestamp.endTime * this.audioBuffer.sampleRate);
      const segmentLength = endSample - startSample;

      if (segmentLength <= 0) {
        throw new Error(`セグメント "${timestamp.title}" の長さが無効です`);
      }

      // 新しいオーディオバッファを作成
      const segmentBuffer = this.audioContext.createBuffer(
        this.audioBuffer.numberOfChannels,
        segmentLength,
        this.audioBuffer.sampleRate
      );

      // 各チャンネルのデータをコピー
      for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
        const sourceData = this.audioBuffer.getChannelData(channel);
        const segmentData = segmentBuffer.getChannelData(channel);
        
        for (let j = 0; j < segmentLength; j++) {
          const sourceIndex = startSample + j;
          if (sourceIndex < sourceData.length) {
            segmentData[j] = sourceData[sourceIndex];
          }
        }
      }

      // WAVファイルとして出力
      const wavBlob = await this.audioBufferToWav(segmentBuffer);
      const filename = sanitizeFilename(timestamp.title) + '.wav';
      const segmentMetadata = createSegmentMetadata(originalMetadata, timestamp.title, i + 1);

      segments.push({
        blob: wavBlob,
        filename,
        duration: timestamp.endTime - timestamp.startTime,
        metadata: segmentMetadata
      });

      if (onProgress) {
        onProgress((i + 1) / totalSegments);
      }
    }

    return segments;
  }

  private async audioBufferToWav(buffer: AudioBuffer): Promise<Blob> {
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

    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // オーディオデータを書き込み
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  getDuration(): number {
    return this.audioBuffer ? this.audioBuffer.duration : 0;
  }

  destroy() {
    this.audioContext.close();
  }
}