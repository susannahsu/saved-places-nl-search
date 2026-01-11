/**
 * Embedding Progress Component
 * Shows progress during embedding generation
 */

import type { BuildIndexProgress } from '../lib/embeddings/types';

interface EmbeddingProgressProps {
  progress: BuildIndexProgress;
  onCancel?: () => void;
}

export default function EmbeddingProgress({ progress, onCancel }: EmbeddingProgressProps) {
  const percentage = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  const getPhaseLabel = (phase: BuildIndexProgress['phase']) => {
    switch (phase) {
      case 'preparing':
        return 'Preparing';
      case 'embedding':
        return 'Generating Embeddings';
      case 'storing':
        return 'Storing';
      case 'complete':
        return 'Complete';
    }
  };

  const getPhaseIcon = (phase: BuildIndexProgress['phase']) => {
    switch (phase) {
      case 'preparing':
        return '📋';
      case 'embedding':
        return '🧠';
      case 'storing':
        return '💾';
      case 'complete':
        return '✅';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getPhaseIcon(progress.phase)}</span>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {getPhaseLabel(progress.phase)}
            </h3>
            <p className="text-xs text-gray-500">{progress.message}</p>
          </div>
        </div>
        
        {onCancel && progress.phase !== 'complete' && (
          <button
            onClick={onCancel}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>
            {progress.current} / {progress.total}
          </span>
          <span>{percentage}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              progress.phase === 'complete'
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      {progress.phase === 'complete' && (
        <div className="mt-3 text-xs text-green-700 bg-green-50 px-3 py-2 rounded">
          ✓ Semantic search is now enabled!
        </div>
      )}
    </div>
  );
}
