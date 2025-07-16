import { useState, useCallback, useMemo } from "react";
import { parseTimestampText } from "../utils/timestampParser";
import type { ValidationError } from "../types";

interface TimestampEditorProps {
  value: string;
  onChange: (value: string) => void;
  audioDuration?: number;
  disabled?: boolean;
}

export function TimestampEditor({
  value,
  onChange,
  audioDuration = 0,
  disabled = false,
}: TimestampEditorProps) {
  const [showExample, setShowExample] = useState(false);

  const { timestamps, errors } = useMemo(() => {
    if (!value.trim()) {
      return { timestamps: [], errors: [] };
    }
    return parseTimestampText(value);
  }, [value]);

  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const getErrorsByType = useCallback(
    (type: ValidationError["type"]) => {
      return errors.filter((error) => error.type === type);
    },
    [errors]
  );

  const formatErrors = useCallback((errors: ValidationError[]) => {
    return errors
      .map((error) => {
        const prefix = error.line > 0 ? `行${error.line}: ` : "";
        return `${prefix}${error.message}`;
      })
      .join("\n");
  }, []);

  const exampleText = `00:00 ~ 03:00 イントロ
~ 05:30 メインテーマ
08:00 ~ 12:00 ソロパート
~ 15:00 エンディング`;

  const hasErrors = errors.length > 0;
  const hasValidTimestamps = timestamps.length > 0 && !hasErrors;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          タイムスタンプ入力
        </h3>
        <button
          onClick={() => setShowExample(!showExample)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showExample ? "例を非表示" : "入力例を表示"}
        </button>
      </div>

      {showExample && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-800 mb-2">
            <strong>入力例:</strong>
          </div>
          <pre className="text-xs text-blue-700 font-mono whitespace-pre-wrap">
            {exampleText}
          </pre>
          <div className="text-xs text-blue-600 mt-2">
            • 開始時間を省略すると、前のセグメントの終了時間が使用されます
            <br />
            • 終了時間を省略すると、次のセグメントの開始時間が使用されます
            <br />• 時間形式: MM:SS または HH:MM:SS
          </div>
        </div>
      )}

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`
            w-full h-48 p-3 border rounded-lg font-mono text-sm
            ${hasErrors ? "border-red-300 bg-red-50" : "border-gray-300"}
            ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "focus:border-blue-500 focus:outline-none"
            }
            resize-none
          `}
          placeholder="タイムスタンプを入力してください...

例:
00:00 ~ 03:00 イントロ
~ 05:30 メインテーマ
08:00 ~ 12:00 ソロパート
~ 15:00 エンディング"
        />

        {audioDuration > 0 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            総時間: {formatDuration(audioDuration)}
          </div>
        )}
      </div>

      {/* バリデーション結果 */}
      {value.trim() && (
        <div className="space-y-2">
          {hasValidTimestamps && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-800">
                <strong>
                  ✓ {timestamps.length}個のセグメントが認識されました
                </strong>
              </div>
              <div className="text-xs text-green-600 mt-1">
                {timestamps.map((ts, index) => (
                  <div key={ts.id}>
                    {index + 1}. {ts.title} ({formatDuration(ts.startTime)} ~{" "}
                    {formatDuration(ts.endTime)})
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasErrors && (
            <div className="bg-red-50 border border-red-400 rounded-lg p-3">
              <div className="text-sm text-red-800 mb-2">
                <strong>エラーが見つかりました:</strong>
              </div>
              <div className="text-xs text-red-700 space-y-1">
                {getErrorsByType("format").map((error, index) => (
                  <div key={index}>• {formatErrors([error])}</div>
                ))}
                {getErrorsByType("overlap").map((error, index) => (
                  <div key={index}>• {formatErrors([error])}</div>
                ))}
                {getErrorsByType("range").map((error, index) => (
                  <div key={index}>• {formatErrors([error])}</div>
                ))}
                {getErrorsByType("duration").map((error, index) => (
                  <div key={index}>• {formatErrors([error])}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
