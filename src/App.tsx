import { useState, useEffect } from "react";
import { FileUploader } from "./components/FileUploader";
import { MetadataDisplay } from "./components/MetadataDisplay";
import { TimestampEditor } from "./components/TimestampEditor";
import { AudioPlayer } from "./components/AudioPlayer";
import { ProgressBar } from "./components/ProgressBar";
import { DownloadButton } from "./components/DownloadButton";
import { useAudioProcessor } from "./hooks/useAudioProcessor";
import { useMetadata } from "./hooks/useMetadata";
import { parseTimestampText } from "./utils/timestampParser";
import type { Timestamp, AudioMetadata } from "./types";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [timestampText, setTimestampText] = useState("");
  const [timestamps, setTimestamps] = useState<Timestamp[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const {
    metadata,
    isLoading: isMetadataLoading,
    error: metadataError,
    loadMetadata,
    clearMetadata,
  } = useMetadata();

  const {
    isProcessing,
    progress,
    processingStage,
    error: processingError,
    loadAudioFile,
    processAudio,
    getDuration,
    cleanup,
  } = useAudioProcessor();
  const audioDuration = getDuration();

  // ファイル選択時の処理
  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    clearMetadata();

    // メタデータの読み込み
    await loadMetadata(selectedFile);

    // オーディオファイルの読み込み
    await loadAudioFile(selectedFile);
  };

  // タイムスタンプテキストの変更処理
  useEffect(() => {
    if (!timestampText.trim()) {
      setTimestamps([]);
      setValidationErrors([]);
      return;
    }

    const { timestamps: parsedTimestamps, errors } = parseTimestampText(
      timestampText,
      audioDuration
    );
    setTimestamps(parsedTimestamps);
    setValidationErrors(errors.map((e) => e.message));
  }, [timestampText, audioDuration]);

  // ダウンロードボタンクリック時の処理
  const handleDownload = async (
    timestamps: Timestamp[],
    metadata: AudioMetadata | null
  ) => {
    if (timestamps.length === 0) return;
    await processAudio(timestamps, metadata);
  };

  // ファイルクリア時の処理
  const handleClearFile = () => {
    setFile(null);
    setTimestampText("");
    setTimestamps([]);
    setValidationErrors([]);
    clearMetadata();
    cleanup();
  };

  const hasValidTimestamps =
    timestamps.length > 0 && validationErrors.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <img
              src="/image.png"
              alt="Choppy"
              style={{ width: "64px", height: "64px" }}
            />
            Choppy
          </h1>
          <p className="text-gray-600">
            音声ファイルをタイムスタンプで分割してダウンロード
          </p>
        </div>

        <div className="space-y-6">
          {/* ファイルアップロード */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              1. 音声ファイルを選択
            </h2>
            <FileUploader
              onFileSelect={handleFileSelect}
              disabled={isProcessing}
            />
            {file && (
              <button
                onClick={handleClearFile}
                className="mt-3 text-sm text-red-600 hover:text-red-800"
              >
                ファイルをクリア
              </button>
            )}
          </div>

          {/* メタデータ表示 */}
          {file && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                2. ファイル情報
              </h2>
              <MetadataDisplay
                metadata={metadata}
                isLoading={isMetadataLoading}
                error={metadataError}
              />
            </div>
          )}

          {/* 音声プレビュー */}
          {file && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                3. 音声プレビュー
              </h2>
              <AudioPlayer file={file} disabled={isProcessing} />
            </div>
          )}

          {/* タイムスタンプ入力 */}
          {file && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                4. タイムスタンプ入力
              </h2>
              <TimestampEditor
                value={timestampText}
                onChange={setTimestampText}
                audioDuration={audioDuration}
                disabled={isProcessing}
              />
            </div>
          )}

          {/* 処理進捗 */}
          {isProcessing && (
            <ProgressBar
              progress={progress}
              stage={processingStage}
              isVisible={isProcessing}
            />
          )}

          {/* エラー表示 */}
          {processingError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-800">
                <strong>エラー:</strong> {processingError}
              </div>
            </div>
          )}

          {/* ダウンロードボタン */}
          {file && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                5. ダウンロード
              </h2>
              <DownloadButton
                timestamps={timestamps}
                metadata={metadata}
                onDownload={handleDownload}
                disabled={!hasValidTimestamps}
                isProcessing={isProcessing}
              />
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="text-center mt-12 py-6 text-sm text-gray-500">
          <p>Choppy - 音声ファイル分割ツール</p>
          <p className="mt-1">
            ブラウザで処理を行います。サーバーにファイルは送信されません。
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
