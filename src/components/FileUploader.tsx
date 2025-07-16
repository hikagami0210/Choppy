import React, { useRef } from "react";
import { useFileHandler } from "../hooks/useFileHandler";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function FileUploader({
  onFileSelect,
  disabled = false,
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isDragOver,
    error,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    getFileInfo,
  } = useFileHandler();

  const handleFileSelection = React.useCallback(
    (selectedFile: File) => {
      onFileSelect(selectedFile);
    },
    [onFileSelect]
  );

  const modifiedHandleDrop = React.useCallback(
    (e: React.DragEvent) => {
      handleDrop(e);
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        handleFileSelection(droppedFiles[0]);
      }
    },
    [handleDrop, handleFileSelection]
  );

  const modifiedHandleFileInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileInputChange(e);
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        handleFileSelection(selectedFiles[0]);
      }
    },
    [handleFileInputChange, handleFileSelection]
  );

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const fileInfo = getFileInfo();

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"}
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:border-blue-400"
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={modifiedHandleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.m4a,.aac,.ogg,.wav,audio/*"
          onChange={modifiedHandleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {fileInfo ? (
          <div className="space-y-2">
            <div className="text-green-600 text-lg font-semibold">
              ✓ ファイルが選択されました
            </div>
            <div className="text-sm text-gray-600">
              <p>
                <strong>ファイル名:</strong> {fileInfo.name}
              </p>
              <p>
                <strong>サイズ:</strong> {formatFileSize(fileInfo.size)}
              </p>
              <p>
                <strong>タイプ:</strong> {fileInfo.type}
              </p>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              別のファイルを選択するにはクリックまたはドラッグ&ドロップしてください
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-4xl text-gray-400">📁</div>
            <div>
              <p className="text-lg font-semibold text-gray-700">
                音声ファイルをドラッグ&ドロップ
              </p>
              <p className="text-sm text-gray-500 mt-1">
                または、クリックしてファイルを選択
              </p>
            </div>
            <div className="text-xs text-gray-400">
              対応形式: MP3, M4A, AAC, OGG, WAV (最大 500MB)
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 p-3 bg-red-100 border border-red-400 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
