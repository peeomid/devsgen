import React from 'react';
import { useStore } from '@nanostores/react';
import { displayJSON } from '../../stores/jsonViewerStore';

export const JSONRaw: React.FC = () => {
  const data = useStore(displayJSON);

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        No JSON data to display
      </div>
    );
  }

  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div className="relative">
      <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto max-h-96 text-sm font-mono whitespace-pre-wrap">
        <code className="text-gray-800">{jsonString}</code>
      </pre>
    </div>
  );
};

export default JSONRaw;