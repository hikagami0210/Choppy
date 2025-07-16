import { useState, useCallback } from 'react';
import type { AudioMetadata } from '../types';
import { extractMetadata } from '../utils/metadataHandler';

export function useMetadata() {
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetadata = useCallback(async (file: File): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const extractedMetadata = await extractMetadata(file);
      setMetadata(extractedMetadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'メタデータの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMetadata = useCallback(() => {
    setMetadata(null);
    setError(null);
  }, []);

  return {
    metadata,
    isLoading,
    error,
    loadMetadata,
    clearMetadata
  };
}