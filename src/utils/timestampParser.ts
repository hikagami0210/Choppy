import type { Timestamp, ValidationError } from "../types";

export function parseTimestampText(text: string): {
  timestamps: Timestamp[];
  errors: ValidationError[];
} {
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  const timestamps: Timestamp[] = [];
  const errors: ValidationError[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const timestamp = parseTimestampLine(line, i + 1);
      timestamps.push(timestamp);
    } catch (error) {
      errors.push({
        line: i + 1,
        message:
          error instanceof Error
            ? error.message
            : "パース中にエラーが発生しました",
        type: "format",
      });
    }
  }

  // タイムスタンプを補完
  const completedTimestamps = completeTimestamps(timestamps);

  // バリデーション
  const validationErrors = validateTimestamps(completedTimestamps);
  errors.push(...validationErrors);

  return { timestamps: completedTimestamps, errors };
}

function parseTimestampLine(line: string, lineNumber: number): Timestamp {
  // 基本的なフォーマット: "開始時間 ~ 終了時間 - タイトル" または "~ 終了時間 - タイトル"
  const match = line.match(
    /^(?:(\d{1,2}:\d{2}(?::\d{2})?)\s+)?~\s*(?:(\d{1,2}:\d{2}(?::\d{2})?)\s+)?-?\s*(.+)$/
  );

  if (!match) {
    throw new Error(
      'タイムスタンプの形式が正しくありません。形式: "開始時間 ~ 終了時間 - タイトル"'
    );
  }

  const [, startTimeStr, endTimeStr, title] = match;

  const startTime = startTimeStr ? parseTimeString(startTimeStr) : null;
  const endTime = endTimeStr ? parseTimeString(endTimeStr) : null;

  if (!title.trim()) {
    throw new Error("タイトルが指定されていません");
  }

  return {
    id: `timestamp-${lineNumber}`,
    startTime: startTime || 0,
    endTime: endTime || 0,
    title: title.trim(),
    isStartOmitted: !startTimeStr,
    isEndOmitted: !endTimeStr,
  };
}

function parseTimeString(timeStr: string): number {
  const parts = timeStr.split(":").map(Number);

  if (parts.length === 2) {
    // MM:SS
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    // HH:MM:SS
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  throw new Error(
    "時間形式が正しくありません。MM:SS または HH:MM:SS 形式で入力してください"
  );
}

function completeTimestamps(timestamps: Timestamp[]): Timestamp[] {
  const completed = [...timestamps];

  for (let i = 0; i < completed.length; i++) {
    const current = completed[i];

    // 開始時間が省略されている場合
    if (current.isStartOmitted && i > 0) {
      current.startTime = completed[i - 1].endTime;
    }

    // 終了時間が省略されている場合
    if (current.isEndOmitted && i < completed.length - 1) {
      current.endTime = completed[i + 1].startTime;
    }
  }

  return completed;
}

function validateTimestamps(timestamps: Timestamp[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const current = timestamps[i];

    // 開始時間が終了時間より大きい
    if (current.startTime >= current.endTime) {
      errors.push({
        line: i + 1,
        message: "開始時間が終了時間以降になっています",
        type: "range",
      });
    }

    // 前のタイムスタンプとの重複チェック
    if (i > 0) {
      const previous = timestamps[i - 1];
      if (current.startTime < previous.endTime) {
        errors.push({
          line: i + 1,
          message: "前のセグメントと時間が重複しています",
          type: "overlap",
        });
      }
    }
  }

  return errors;
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }
}
