interface DebugPanelProps {
  totalPlaces: number;
  totalEmbeddings: number;
}

export default function DebugPanel({ totalPlaces, totalEmbeddings }: DebugPanelProps) {
  const embeddingProgress = totalPlaces > 0 
    ? Math.round((totalEmbeddings / totalPlaces) * 100) 
    : 0;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Debug Info</h2>
      </div>
      
      <div className="flex-1 p-4 space-y-4 overflow-auto">
        {/* Stats */}
        <div className="space-y-3">
          <StatItem
            label="Places Imported"
            value={totalPlaces}
            icon="📍"
          />
          
          <StatItem
            label="Embeddings Built"
            value={totalEmbeddings}
            icon="🧠"
            subtext={totalPlaces > 0 ? `${embeddingProgress}% complete` : undefined}
          />
        </div>

        {/* Status */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Status</h3>
          <div className="space-y-2">
            <StatusItem
              label="Database"
              status={totalPlaces > 0 ? 'ready' : 'empty'}
            />
            <StatusItem
              label="Search"
              status={totalPlaces > 0 ? 'enabled' : 'disabled'}
            />
            <StatusItem
              label="ML Model"
              status="not loaded"
              warning
            />
          </div>
        </div>

        {/* Info */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Info</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>Version: 0.1.0</p>
            <p>Storage: IndexedDB</p>
            <p>Search: Keyword (temp)</p>
          </div>
        </div>

        {/* Note */}
        {totalPlaces > 0 && totalEmbeddings === 0 && (
          <div className="pt-4 border-t border-gray-200">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <p className="font-semibold mb-1">⚠️ ML Not Implemented</p>
              <p>Embeddings will be generated once Transformers.js is integrated. Currently using keyword search.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: number;
  icon: string;
  subtext?: string;
}

function StatItem({ label, value, icon, subtext }: StatItemProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        {subtext && <p className="text-xs text-gray-500 mt-0.5">{subtext}</p>}
      </div>
      <span className="text-2xl">{icon}</span>
    </div>
  );
}

interface StatusItemProps {
  label: string;
  status: string;
  warning?: boolean;
}

function StatusItem({ label, status, warning }: StatusItemProps) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-600">{label}</span>
      <span className={`
        px-2 py-0.5 rounded font-medium
        ${warning 
          ? 'bg-yellow-100 text-yellow-800' 
          : status === 'ready' || status === 'enabled'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-600'
        }
      `}>
        {status}
      </span>
    </div>
  );
}
