import { describe, it, expect } from "vitest";
import { parseTimestampLine } from "./timestampParser";

// Timestamp型の参考
// interface Timestamp {
//   id: string;
//   startTime: number;
//   endTime: number;
//   title: string;
//   isStartOmitted?: boolean;
//   isEndOmitted?: boolean;
// }

describe("parseTimestampLine", () => {
  it("正常系: 開始~終了 タイトル", () => {
    const result = parseTimestampLine("0:10 ~ 0:30 サンプルタイトル", 1);
    expect(result).toEqual({
      id: "timestamp-1",
      startTime: 10,
      endTime: 30,
      title: "サンプルタイトル",
      isStartOmitted: false,
      isEndOmitted: false,
    });
  });

  it("正常系: ~終了 タイトル", () => {
    const result = parseTimestampLine("~ 0:45 テスト", 2);
    expect(result).toEqual({
      id: "timestamp-2",
      startTime: 0,
      endTime: 45,
      title: "テスト",
      isStartOmitted: true,
      isEndOmitted: false,
    });
  });

  it("正常系: 開始-タイトル（終了省略）", () => {
    const result = parseTimestampLine("1:23 サンプル", 3);
    expect(result).toEqual({
      id: "timestamp-3",
      startTime: 83,
      endTime: 0,
      title: "サンプル",
      isStartOmitted: false,
      isEndOmitted: true,
    });
  });

  it("正常系: HH:MM:SS ~ HH:MM:SS", () => {
    const result = parseTimestampLine("1:02:03 ~ 1:03:04 長い時間", 4);
    expect(result).toEqual({
      id: "timestamp-4",
      startTime: 3723,
      endTime: 3784,
      title: "長い時間",
      isStartOmitted: false,
      isEndOmitted: false,
    });
  });

  it("異常系: フォーマット不正", () => {
    expect(() => parseTimestampLine("不正な行", 5)).toThrow(
      'タイムスタンプの形式が正しくありません。形式: "開始時間 ~ 終了時間 - タイトル" または "開始時間 - タイトル"'
    );
  });

  it("異常系: 時間形式不正", () => {
    expect(() => parseTimestampLine("1:2:3:4 ~ 1:03:04 タイトル", 6)).toThrow(
      "時間形式が正しくありません。MM:SS または HH:MM:SS 形式で入力してください"
    );
  });

  it("異常系: タイトルなし", () => {
    expect(() => parseTimestampLine("0:10 ~ 0:30 ", 7)).toThrow(
      "タイトルが指定されていません"
    );
  });
});
