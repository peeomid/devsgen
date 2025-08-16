import React, { useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { 
  dataType, 
  hasData, 
  initializeLineFilterStore,
  lineFilterActions 
} from '../../stores/lineFilterStore';
import keyboardShortcuts from '../../utils/keyboardShortcuts';

// Import all components
import UnifiedDataInput from './UnifiedDataInput';
import FormatDetector from './FormatDetector';
import TextFilterInput from './TextFilterInput';
import CSVFilterInput from './CSVFilterInput';
import FilterList from './FilterList';
import TextResults from './TextResults';
import CSVResults from './CSVResults';
import ProgressBar from './ProgressBar';
import HelpModal from './HelpModal';

export interface LineFilterLayoutProps {
  className?: string;
}

export const LineFilterLayout: React.FC<LineFilterLayoutProps> = ({ className = '' }) => {
  const currentDataType = useStore(dataType);
  const currentHasData = useStore(hasData);
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);
  const [editingFilterId, setEditingFilterId] = React.useState<string | null>(null);

  // Define handleClearData with useCallback to prevent infinite re-renders
  const handleClearData = useCallback(async () => {
    try {
      await lineFilterActions.clearAllData();
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }, []);

  // Initialize the store when component mounts
  useEffect(() => {
    initializeLineFilterStore().catch(console.error);

    // Register keyboard shortcuts
    const shortcuts = [
      // Clear data shortcut
      keyboardShortcuts.register({
        key: 'Escape',
        description: 'Clear all data and filters',
        handler: (e) => {
          e.preventDefault();
          // Check current state at execution time, not capture time
          if (hasData.get()) {
            handleClearData();
          }
        }
      }),

      // Copy results shortcut
      keyboardShortcuts.register({
        key: 'c',
        metaKey: true,
        shiftKey: true,
        description: 'Copy filtered results to clipboard',
        handler: (e) => {
          e.preventDefault();
          // This would trigger copy functionality in results components
          const copyButton = document.querySelector('[data-copy-results]') as HTMLButtonElement;
          if (copyButton) {
            copyButton.click();
          }
        }
      }),

      // Apply all filters shortcut
      keyboardShortcuts.register({
        key: 'Enter',
        metaKey: true,
        shiftKey: true,
        description: 'Apply all active filters',
        handler: (e) => {
          e.preventDefault();
          // Check current state at execution time, not capture time
          if (hasData.get()) {
            lineFilterActions.applyAllActiveFilters().catch(console.error);
          }
        }
      })
    ];

    // Cleanup function to unregister shortcuts
    return () => {
      shortcuts.forEach(id => keyboardShortcuts.unregister(id));
    };
  }, []); // Empty dependency array - only run once on mount

  const handleFilterEdit = useCallback((filterId: string) => {
    setEditingFilterId(filterId);
  }, []);

  const handleFilterEditComplete = useCallback(() => {
    setEditingFilterId(null);
  }, []);

  return (
    <div className={`${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Line Filter Tool</h1>
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="
                p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded
              "
              title="Help"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600">
            Filter and search through large text files and CSV data efficiently
          </p>
        </div>

        {/* Progress Bar - Always visible when processing */}
        <div className="mb-6">
          <ProgressBar />
        </div>

        {!currentHasData ? (
          /* Initial State - Unified Input Interface */
          <UnifiedDataInput />
        ) : (
          /* Data Loaded State - Top-Bar Layout */
          <div className="space-y-4">
            {/* Top Toolbar - Filters + Format Badge + Clear Button */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  <h3 className="text-sm font-medium text-gray-900">Filters</h3>
                  <FormatDetector />
                </div>
                <button
                  type="button"
                  onClick={handleClearData}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex-shrink-0"
                >
                  Clear Data
                </button>
              </div>
              
              {/* Filter Input Row */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  {/* Filter Input - Full width available */}
                  <div className="flex-1 min-w-0">
                    {currentDataType === 'csv' ? (
                      <CSVFilterInput 
                        editingFilterId={editingFilterId}
                        onEditComplete={handleFilterEditComplete}
                      />
                    ) : (
                      <TextFilterInput 
                        editingFilterId={editingFilterId}
                        onEditComplete={handleFilterEditComplete}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Active Filters Row */}
              <div className="px-4 py-2">
                <FilterList onFilterEdit={handleFilterEdit} />
              </div>
            </div>

            {/* Main Data Results - Full Width */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-6">
                {currentDataType === 'csv' ? (
                  <CSVResults />
                ) : (
                  <TextResults />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            <p>
              Part of{' '}
              <a 
                href="/" 
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Devsgen
              </a>
              {' '}developer utilities
            </p>
          </div>
        </div>

        {/* Help Modal */}
        <HelpModal 
          isOpen={isHelpOpen} 
          onClose={() => setIsHelpOpen(false)} 
        />
      </div>
    </div>
  );
};

export default LineFilterLayout;