import { X } from 'lucide-react';

type ExpandedMode = 'vote' | 'ability' | 'memo' | null;

interface ExpandedHeaderProps {
  expandedMode: ExpandedMode;
  onClose: () => void;
}

export function ExpandedHeader({ expandedMode, onClose }: ExpandedHeaderProps) {
  const getTitle = () => {
    switch (expandedMode) {
      case 'vote':
        return '투표할 플레이어 선택';
      case 'ability':
        return '능력 사용 대상 선택';
      case 'memo':
        return '플레이어 메모';
      default:
        return '';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border-b border-border/30">
      <h3 className="text-base font-semibold">{getTitle()}</h3>
      <button
        onClick={onClose}
        className="p-1.5 hover:bg-muted/50 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
