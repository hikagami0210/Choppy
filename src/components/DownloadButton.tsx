import type { Timestamp, AudioMetadata } from "../types";

interface DownloadButtonProps {
  timestamps: Timestamp[];
  metadata: AudioMetadata | null;
  onDownload: (timestamps: Timestamp[], metadata: AudioMetadata | null) => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

export function DownloadButton({
  timestamps,
  metadata,
  onDownload,
  disabled = false,
  isProcessing = false,
}: DownloadButtonProps) {
  const handleClick = () => {
    if (!disabled && !isProcessing) {
      onDownload(timestamps, metadata);
    }
  };

  const hasValidTimestamps = timestamps.length > 0;
  const isDisabled = disabled || isProcessing || !hasValidTimestamps;

  return (
    <div className="space-y-4">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`
          w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all
          ${
            isDisabled
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
          }
        `}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin">⟳</div>
            処理中...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span>📦</span>
            分割してダウンロード
            {hasValidTimestamps && (
              <span className="text-sm opacity-80">
                ({timestamps.length}個のセグメント)
              </span>
            )}
          </div>
        )}
      </button>

      {/* 状態表示 */}
      {!hasValidTimestamps && !isProcessing && (
        <div className="text-sm text-gray-500 text-center">
          タイムスタンプを入力してください
        </div>
      )}

      {hasValidTimestamps && !isProcessing && (
        <div className="text-sm text-green-600 text-center">
          {timestamps.length}個のセグメントが準備完了
        </div>
      )}

      {/* セグメント一覧 */}
      {hasValidTimestamps && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-2">
            分割予定のセグメント:
          </h4>
          <div className="space-y-1 text-xs text-gray-600">
            {timestamps.map((timestamp, index) => (
              <div key={timestamp.id} className="flex justify-between">
                <span>
                  {index + 1}. {timestamp.title}
                </span>
                <span>
                  {Math.floor(timestamp.startTime / 60)}:
                  {(timestamp.startTime % 60).toString().padStart(2, "0")}
                  {" ~ "}
                  {Math.floor(timestamp.endTime / 60)}:
                  {Math.floor(timestamp.endTime % 60)
                    .toString()
                    .padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
