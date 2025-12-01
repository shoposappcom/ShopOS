import React from 'react';
import { Grid3x3, Grid2x2, List, LayoutGrid } from 'lucide-react';
import { ViewMode } from '../utils/viewMode';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  className?: string;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  viewMode,
  onViewChange,
  className = ''
}) => {
  const views: { mode: ViewMode; icon: React.ElementType; label: string; tooltip: string }[] = [
    { mode: 'small', icon: Grid3x3, label: 'Small Icons', tooltip: 'Compact view with small icons' },
    { mode: 'large', icon: Grid2x2, label: 'Large Icons', tooltip: 'Grid view with large icons' },
    { mode: 'list', icon: List, label: 'List View', tooltip: 'Horizontal list view' },
    { mode: 'details', icon: LayoutGrid, label: 'Details View', tooltip: 'Detailed expanded view' },
  ];

  return (
    <div className={`flex items-center gap-1 bg-gray-100 rounded-xl p-1 ${className}`}>
      {views.map(({ mode, icon: Icon, label, tooltip }) => {
        const isActive = viewMode === mode;
        return (
          <button
            key={mode}
            onClick={() => onViewChange(mode)}
            title={tooltip}
            aria-label={label}
            className={`
              p-2 rounded-lg transition-all duration-200
              ${isActive 
                ? 'bg-white text-green-600 shadow-md' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1
            `}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
};

