import React, { useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { 
  displayJSON, 
  expandedPaths, 
  selectedPath, 
  currentBreadcrumb,
  jsonViewerActions 
} from '../../stores/jsonViewerStore';

export const JSONTree: React.FC = () => {
  const data = useStore(displayJSON);
  const expanded = useStore(expandedPaths);
  const selected = useStore(selectedPath);
  const breadcrumb = useStore(currentBreadcrumb);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    path: string;
    value: any;
  } | null>(null);

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        No JSON data to display
      </div>
    );
  }

  const handleToggleExpansion = useCallback((path: string) => {
    jsonViewerActions.togglePath(path);
  }, []);

  const handlePropertyClick = useCallback((path: string, value: any) => {
    jsonViewerActions.selectPath(path);
    // Auto-fill search path when property is clicked
    jsonViewerActions.setSearchPath(path);
  }, []);

  const handleRightClick = useCallback((e: React.MouseEvent, path: string, value: any) => {
    e.preventDefault();
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 160; // minWidth from CSS
    const menuHeight = 120; // approximate height for 3 items
    
    // Calculate position, ensuring menu stays within viewport
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }
    
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10;
    }
    
    setContextMenu({
      x: Math.max(10, x), // Ensure minimum margin from left edge
      y: Math.max(10, y), // Ensure minimum margin from top edge
      path,
      value
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleContextMenuAction = useCallback((action: string) => {
    if (!contextMenu) return;
    
    switch (action) {
      case 'addFilter':
        jsonViewerActions.openFilterDialog();
        // Pre-fill with path - this will need store integration
        break;
      case 'copyPath':
        navigator.clipboard.writeText(contextMenu.path);
        break;
      case 'copyValue':
        navigator.clipboard.writeText(JSON.stringify(contextMenu.value));
        break;
    }
    
    closeContextMenu();
  }, [contextMenu]);

  // Close context menu on outside clicks
  React.useEffect(() => {
    const handleDocumentClick = () => closeContextMenu();
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [closeContextMenu]);

  const isExpanded = (path: string): boolean => {
    return expanded.has(path);
  };

  const isSelected = (path: string): boolean => {
    return selected === path;
  };

  const isInBreadcrumb = (path: string): boolean => {
    if (!selected || !path) return false;
    // Check if this path is part of the selected path's hierarchy
    return selected.startsWith(path) || path.startsWith(selected);
  };

  const renderValue = (value: any, path: string = '', level: number = 0, key?: string): React.ReactNode => {
    const indent = level * 16;
    const fullPath = key ? (path ? `${path}.${key}` : key) : path;
    const canExpand = typeof value === 'object' && value !== null;
    const expanded = isExpanded(fullPath);
    const selected = isSelected(fullPath);
    const inBreadcrumb = isInBreadcrumb(fullPath);

    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return (
          <div style={{ marginLeft: indent }}>
            <div className="flex items-center group">
              {/* Expand/collapse arrow */}
              <button
                onClick={() => handleToggleExpansion(fullPath)}
                className="mr-1 p-0.5 hover:bg-gray-100 rounded text-gray-600"
              >
                <svg 
                  className={`w-3 h-3 transform transition-transform ${expanded ? 'rotate-90' : ''}`}
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Property key (clickable) */}
              {key && (
                <button
                  onClick={() => handlePropertyClick(fullPath, value)}
                  onContextMenu={(e) => handleRightClick(e, fullPath, value)}
                  className={`text-purple-600 font-medium hover:bg-blue-50 px-1 rounded ${
                    selected ? 'bg-blue-100' : inBreadcrumb ? 'bg-blue-50' : ''
                  }`}
                >
                  "{key}"
                </button>
              )}

              {/* Array indicator */}
              <span className="text-blue-600 font-medium ml-1">
                Array[{value.length}]
              </span>
            </div>

            {/* Array items */}
            {expanded && (
              <div className="ml-4">
                {value.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-gray-500 mr-2">[{index}]:</span>
                    <div className="flex-1">
                      {renderValue(item, `${fullPath}[${index}]`, level + 1)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Collapsed preview */}
            {!expanded && value.length > 0 && (
              <div className="ml-5 text-gray-500 text-xs">
                {value.length} item{value.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        );
      } else {
        const keys = Object.keys(value);
        return (
          <div style={{ marginLeft: indent }}>
            <div className="flex items-center group">
              {/* Expand/collapse arrow */}
              <button
                onClick={() => handleToggleExpansion(fullPath)}
                className="mr-1 p-0.5 hover:bg-gray-100 rounded text-gray-600"
              >
                <svg 
                  className={`w-3 h-3 transform transition-transform ${expanded ? 'rotate-90' : ''}`}
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Property key (clickable) */}
              {key && (
                <button
                  onClick={() => handlePropertyClick(fullPath, value)}
                  onContextMenu={(e) => handleRightClick(e, fullPath, value)}
                  className={`text-purple-600 font-medium hover:bg-blue-50 px-1 rounded ${
                    selected ? 'bg-blue-100' : inBreadcrumb ? 'bg-blue-50' : ''
                  }`}
                >
                  "{key}"
                </button>
              )}

              {/* Object indicator */}
              <span className="text-green-600 font-medium ml-1">Object</span>
            </div>

            {/* Object properties */}
            {expanded && (
              <div className="ml-4">
                {keys.map(objKey => (
                  <div key={objKey} className="flex items-start">
                    <div className="flex-1">
                      {renderValue(value[objKey], fullPath, level + 1, objKey)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Collapsed preview */}
            {!expanded && keys.length > 0 && (
              <div className="ml-5 text-gray-500 text-xs">
                {keys.length} propert{keys.length !== 1 ? 'ies' : 'y'}
              </div>
            )}
          </div>
        );
      }
    }

    // Primitive values
    const primitiveElement = (() => {
      if (typeof value === 'string') {
        return <span className="text-orange-600">"{value}"</span>;
      } else if (typeof value === 'number') {
        return <span className="text-blue-500">{value}</span>;
      } else if (typeof value === 'boolean') {
        return <span className="text-red-500">{value ? 'true' : 'false'}</span>;
      } else if (value === null) {
        return <span className="text-gray-400">null</span>;
      }
      return <span>{String(value)}</span>;
    })();

    // For properties with primitive values
    if (key) {
      return (
        <div style={{ marginLeft: indent }} className="flex items-center">
          <button
            onClick={() => handlePropertyClick(fullPath, value)}
            onContextMenu={(e) => handleRightClick(e, fullPath)}
            className={`text-purple-600 font-medium hover:bg-blue-50 px-1 rounded mr-1 ${
              selected ? 'bg-blue-100' : inBreadcrumb ? 'bg-blue-50' : ''
            }`}
          >
            "{key}"
          </button>
          <span className="mr-1">:</span>
          {primitiveElement}
        </div>
      );
    }

    return primitiveElement;
  };

  return (
    <div className="font-mono text-sm p-4 max-h-96 overflow-auto">
      {renderValue(data)}
      
      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            minWidth: '160px'
          }}
        >
          <button
            onClick={() => handleContextMenuAction('addFilter')}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center"
          >
            <span className="mr-2">📍</span>
            Add filter for this path
          </button>
          <button
            onClick={() => handleContextMenuAction('copyPath')}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center"
          >
            <span className="mr-2">🔗</span>
            Copy path to clipboard
          </button>
          <button
            onClick={() => handleContextMenuAction('copyValue')}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center"
          >
            <span className="mr-2">📋</span>
            Copy value to clipboard
          </button>
        </div>
      )}
    </div>
  );
};

export default JSONTree;