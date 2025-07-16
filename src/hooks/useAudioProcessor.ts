import { useState, useCallback, useRef } from "react";
import type {
  AudioSegment,
  AudioMetadata,
  Timestamp,
  ProcessingProgress,
} from "../types";
import { loadAudioFile, splitAudio, getDuration } from "../utils/audioSplitter";
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

  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const originalFileRef = useRef<File | null>(null);

  const loadAudioFileCallback = useCallback(async (file: File): Promise<boolean> => {
    try {
      setError(null);
      setProcessingStage("loading");
      setProgress(0);

      audioBufferRef.current = await loadAudioFile(file);
      originalFileRef.current = file;

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
      setIsProcessing(true);

      if (!audioBufferRef.current || !originalFileRef.current) {
        setError("オーディオファイルが読み込まれていません");
        return;
      }

      try {
        setError(null);
        setProgress(0);
        setSegments([]);
        setProcessingStage("parsing");

        await new Promise((resolve) => setTimeout(resolve, 100));

        // タイムスタンプの妥当性チェック
        setProgress(10);
        const duration = audioBufferRef.current.duration;
        const validationErrors = validateTimestampsAgainstDuration(
          timestamps,
          duration
        );

        if (validationErrors.length > 0) {
          setError(validationErrors.map((e) => e.message).join("\n"));
          return;
        }

        setProgress(20);
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 音声分割
        setProcessingStage("splitting");
        setProgress(30);
        const audioSegments = await splitAudio(
          audioBufferRef.current,
          originalFileRef.current,
          timestamps,
          originalMetadata,
          (progress) => {
            console.log("progress", progress);

            setProgress(30 + progress * 40); // 30-70%
          }
        );

        setSegments(audioSegments);
        setProgress(70);
        await new Promise((resolve) => setTimeout(resolve, 100));

        setProcessingStage("zipping");
        setProgress(75);

        // ZIP生成
        const zipBlob = await generateZip(audioSegments, (progress) => {
          setProgress(75 + progress * 20); // 75-95%
        });

        setProgress(95);
        await new Promise((resolve) => setTimeout(resolve, 100));

        // ダウンロード
        const filename = createDownloadFilename();
        downloadBlob(zipBlob, filename);

        setProgress(100);
        await new Promise((resolve) => setTimeout(resolve, 200));
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

  const getDurationCallback = useCallback((): number => {
    return audioBufferRef.current ? getDuration(audioBufferRef.current) : 0;
  }, []);

  const cleanup = useCallback(() => {
    audioBufferRef.current = null;
    originalFileRef.current = null;
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
    loadAudioFile: loadAudioFileCallback,
    processAudio,
    getDuration: getDurationCallback,
    cleanup,
  };
}
