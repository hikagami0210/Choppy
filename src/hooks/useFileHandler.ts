import { useState, useCallback } from "react";
import { validateFile } from "../utils/validators";

export function useFileHandler() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    const validationErrors = validateFile(selectedFile);

    if (validationErrors.length > 0) {
      setError(validationErrors.map((e) => e.message).join("\n"));
      return false;
    }

    setFile(selectedFile);
    setError(null);
    return true;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        handleFileSelect(droppedFiles[0]);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        handleFileSelect(selectedFiles[0]);
      }
    },
    [handleFileSelect]
  );

  const clearFile = useCallback(() => {
    setFile(null);
    setError(null);
  }, []);

  const getFileInfo = useCallback(() => {
    if (!file) return null;

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified),
    };
  }, [file]);

  return {
    file,
    isDragOver,
    error,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    clearFile,
    getFileInfo,
  };
}
