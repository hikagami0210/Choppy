import { useState, useCallback, useRef } from "react";
import type {
  AudioSegment,
  AudioMetadata,
  Timestamp,
  ProcessingProgress,
} from "../types";
import { AudioSplitter } from "../utils/audioSplitter";
import {
  generateZip,
  createDownloadFilename,
  downloadBlob,
} from "../utils/zipGenerator";
import { validateTimestampsAgainstDuration } from "../utils/validators";

export function useAudioProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStage, setProcessingStage] =
    useState<ProcessingProgress["stage"]>("parsing");
  const [segments, setSegments] = useState<AudioSegment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const splitterRef = useRef<AudioSplitter | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  const loadAudioFile = useCallback(async (file: File): Promise<boolean> => {
    try {
      setError(null);
      setProcessingStage("loading");
      setProgress(0);

      if (splitterRef.current) {
        splitterRef.current.destroy();
      }

      splitterRef.current = new AudioSplitter();
      audioBufferRef.current = await splitterRef.current.loadAudioFile(file);

      setProgress(100);
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "オーディオファイルの読み込みに失敗しました"
      );
      return false;
    }
  }, []);

  const processAudio = useCallback(
    async (
      timestamps: Timestamp[],
      originalMetadata: AudioMetadata | null
    ): Promise<void> => {
      if (!splitterRef.current || !audioBufferRef.current) {
        setError("オーディオファイルが読み込まれていません");
        return;
      }

      try {
        setIsProcessing(true);
        setError(null);
        setProgress(0);
        setSegments([]);

        // タイムスタンプの妥当性チェック
        const duration = audioBufferRef.current.duration;
        const validationErrors = validateTimestampsAgainstDuration(
          timestamps,
          duration
        );

        if (validationErrors.length > 0) {
          setError(validationErrors.map((e) => e.message).join("\n"));
          return;
        }

        // 音声分割
        setProcessingStage("splitting");
        const audioSegments = await splitterRef.current.splitAudio(
          timestamps,
          originalMetadata,
          (progress) => {
            setProgress(progress * 50); // 50%まで
          }
        );

        setSegments(audioSegments);
        setProcessingStage("zipping");

        // ZIP生成
        const zipBlob = await generateZip(audioSegments, (progress) => {
          setProgress(50 + progress * 50); // 50-100%
        });

        // ダウンロード
        const filename = createDownloadFilename();
        downloadBlob(zipBlob, filename);

        setProgress(100);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "音声処理中にエラーが発生しました"
        );
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const getDuration = useCallback((): number => {
    return audioBufferRef.current ? audioBufferRef.current.duration : 0;
  }, []);

  const cleanup = useCallback(() => {
    if (splitterRef.current) {
      splitterRef.current.destroy();
      splitterRef.current = null;
    }
    audioBufferRef.current = null;
    setSegments([]);
    setProgress(0);
    setError(null);
  }, []);

  return {
    isProcessing,
    progress,
    processingStage,
    segments,
    error,
    loadAudioFile,
    processAudio,
    getDuration,
    cleanup,
  };
}
