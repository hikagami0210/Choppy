export interface Timestamp {
  id: string;
  startTime: number; // 秒単位
  endTime: number; // 秒単位
  title: string;
  isStartOmitted?: boolean;
  isEndOmitted?: boolean;
}

export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  genre?: string[];
  picture?: Picture[];
  [key: string]: string | string[] | Picture[] | { no: number; of: number | null } | undefined;
}

export interface Picture {
  format: string;
  data: Uint8Array;
  description?: string;
  type?: string;
}

export interface AudioSegment {
  blob: Blob;
  filename: string;
  duration: number;
  metadata: AudioMetadata;
}

export interface AppState {
  file: File | null;
  originalMetadata: AudioMetadata | null;
  timestamps: Timestamp[];
  timestampText: string;
  segments: AudioSegment[];
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

export interface ValidationError {
  line: number;
  message: string;
  type: 'format' | 'overlap' | 'duration' | 'range';
}

export interface ProcessingProgress {
  current: number;
  total: number;
  stage: 'parsing' | 'loading' | 'splitting' | 'encoding' | 'zipping';
  message?: string;
}