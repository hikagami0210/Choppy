import React, { useState, useRef, useEffect } from 'react';
import { formatTime } from '../utils/timestampParser';

interface AudioPlayerProps {
  file: File | null;
  disabled?: boolean;
}

export function AudioPlayer({ file, disabled = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setError(null);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    const objectURL = URL.createObjectURL(file);
    audio.src = objectURL;
    setIsLoading(true);
    setError(null);

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError('音声ファイルの読み込みに失敗しました');
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      URL.revokeObjectURL(objectURL);
    };
  }, [file]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || disabled) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || disabled || !progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = clickX / rect.width;
    const seekTime = progress * duration;
    
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audio.volume = newVolume;
  };

  if (!file) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-center text-gray-500">
          音声ファイルを選択してください
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-center text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">音声プレビュー</h3>
      
      <audio ref={audioRef} preload="metadata" />
      
      <div className="space-y-4">
        {/* 再生コントロール */}
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            disabled={disabled || isLoading}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center text-white text-xl
              ${disabled || isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
              }
            `}
          >
            {isLoading ? (
              <div className="animate-spin text-sm">⟳</div>
            ) : isPlaying ? (
              '⏸️'
            ) : (
              '▶️'
            )}
          </button>
          
          <div className="flex-1 text-sm text-gray-600">
            <div className="font-medium">{file.name}</div>
            <div className="text-xs text-gray-500">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>

        {/* プログレスバー */}
        <div
          ref={progressRef}
          className="w-full bg-gray-200 rounded-full h-2 cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-100"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        {/* 音量コントロール */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            disabled={disabled}
            className="w-20"
          />
          <span className="text-xs text-gray-500 w-10">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}