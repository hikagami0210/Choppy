import type { Timestamp, ValidationError } from "../types";

export function validateFile(file: File): ValidationError[] {
  const errors: ValidationError[] = [];

  // ファイルサイズチェック (500MB制限)
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    errors.push({
      line: 0,
      message: "ファイルサイズが500MBを超えています",
      type: "format",
    });
  }

  // 対応形式チェック
  const supportedTypes = [
    "audio/mpeg",
    "audio/mp4",
    "audio/m4a",
    "audio/aac",
    "audio/ogg",
    "audio/wav",
  ];
  const supportedExtensions = [".mp3", ".m4a", ".aac", ".ogg", ".wav"];

  const isTypeSupported = supportedTypes.some((type) => file.type === type);
  const isExtensionSupported = supportedExtensions.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!isTypeSupported && !isExtensionSupported) {
    errors.push({
      line: 0,
      message:
        "サポートされていないファイル形式です。MP3、M4A、AAC、OGG、WAVファイルを選択してください",
      type: "format",
    });
  }

  return errors;
}

export function validateTimestampsAgainstDuration(
  timestamps: Timestamp[],
  duration: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const timestamp = timestamps[i];

    // 開始時間がファイル長を超えている
    if (timestamp.startTime > duration) {
      errors.push({
        line: i + 1,
        message: `開始時間がファイル長(${Math.floor(
          duration
        )}秒)を超えています`,
        type: "duration",
      });
    }

    // 終了時間がファイル長を超えている
    if (timestamp.endTime > duration) {
      errors.push({
        line: i + 1,
        message: `終了時間がファイル長(${Math.floor(
          duration
        )}秒)を超えています`,
        type: "duration",
      });
    }
  }

  return errors;
}

export function hasValidationErrors(errors: ValidationError[]): boolean {
  return errors.length > 0;
}

export function getErrorsByType(
  errors: ValidationError[],
  type: ValidationError["type"]
): ValidationError[] {
  return errors.filter((error) => error.type === type);
}

export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return "";

  return errors
    .map((error) => {
      const prefix = error.line > 0 ? `行${error.line}: ` : "";
      return `${prefix}${error.message}`;
    })
    .join("\n");
}
