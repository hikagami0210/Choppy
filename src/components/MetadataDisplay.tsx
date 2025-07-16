import type { AudioMetadata } from "../types";

interface MetadataDisplayProps {
  metadata: AudioMetadata | null;
  isLoading: boolean;
  error: string | null;
}

export function MetadataDisplay({
  metadata,
  isLoading,
  error,
}: MetadataDisplayProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="text-sm text-gray-600">メタデータを読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="text-sm text-yellow-800">
          <strong>メタデータの読み込みに失敗しました:</strong> {error}
        </div>
      </div>
    );
  }

  if (!metadata) {
    return null;
  }

  const hasBasicInfo = metadata.title || metadata.artist || metadata.album;
  const picture = metadata.picture?.[0];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        メタデータ情報
      </h3>

      <div className="flex gap-4">
        {/* アルバムアート */}
        {picture && (
          <div className="flex-shrink-0">
            <img
              src={`data:${picture.format};base64,${btoa(
                String.fromCharCode(...picture.data)
              )}`}
              alt="アルバムアート"
              className="w-20 h-20 object-cover rounded border border-gray-300"
            />
          </div>
        )}

        {/* メタデータ詳細 */}
        <div className="flex-1 space-y-2">
          {hasBasicInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {metadata.title && (
                <div>
                  <span className="font-medium text-gray-600">タイトル:</span>{" "}
                  <span className="text-gray-800">{metadata.title}</span>
                </div>
              )}
              {metadata.artist && (
                <div>
                  <span className="font-medium text-gray-600">
                    アーティスト:
                  </span>{" "}
                  <span className="text-gray-800">{metadata.artist}</span>
                </div>
              )}
              {metadata.album && (
                <div>
                  <span className="font-medium text-gray-600">アルバム:</span>{" "}
                  <span className="text-gray-800">{metadata.album}</span>
                </div>
              )}
              {metadata.year && (
                <div>
                  <span className="font-medium text-gray-600">年:</span>{" "}
                  <span className="text-gray-800">{metadata.year}</span>
                </div>
              )}
              {metadata.genre && metadata.genre.length > 0 && (
                <div>
                  <span className="font-medium text-gray-600">ジャンル:</span>{" "}
                  <span className="text-gray-800">
                    {metadata.genre.join(", ")}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              基本的なメタデータが見つかりませんでした
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
