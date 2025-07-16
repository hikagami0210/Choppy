import type { ProcessingProgress } from '../types';

interface ProgressBarProps {
  progress: number;
  stage: ProcessingProgress['stage'];
  message?: string;
  isVisible: boolean;
}

export function ProgressBar({ progress, stage, message, isVisible }: ProgressBarProps) {
  if (!isVisible) return null;

  const getStageText = (stage: ProcessingProgress['stage']): string => {
    switch (stage) {
      case 'parsing':
        return 'タイムスタンプを解析中...';
      case 'loading':
        return 'オーディオファイルを読み込み中...';
      case 'splitting':
        return '音声を分割中...';
      case 'encoding':
        return '音声をエンコード中...';
      case 'zipping':
        return 'ZIPファイルを作成中...';
      default:
        return '処理中...';
    }
  };

  const getStageIcon = (stage: ProcessingProgress['stage']): string => {
    switch (stage) {
      case 'parsing':
        return '📝';
      case 'loading':
        return '📂';
      case 'splitting':
        return '✂️';
      case 'encoding':
        return '🔄';
      case 'zipping':
        return '📦';
      default:
        return '⚙️';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl">{getStageIcon(stage)}</div>
        <div>
          <div className="text-sm font-medium text-gray-900">
            {getStageText(stage)}
          </div>
          {message && (
            <div className="text-xs text-gray-600 mt-1">
              {message}
            </div>
          )}
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <div className="text-xs text-gray-500">
          {Math.round(progress)}% 完了
        </div>
        <div className="text-xs text-gray-500">
          {progress >= 100 ? '完了' : '処理中...'}
        </div>
      </div>
    </div>
  );
}