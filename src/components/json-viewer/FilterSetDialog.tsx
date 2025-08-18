import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { isFilterDialogOpen, jsonViewerActions } from '../../stores/jsonViewerStore';

export const FilterSetDialog: React.FC = () => {
  const isOpen = useStore(isFilterDialogOpen);
  const [filterName, setFilterName] = useState('');
  const [filterType, setFilterType] = useState<'path' | 'value'>('path');
  const [filterValues, setFilterValues] = useState(['']);

  if (!isOpen) return null;

  const handleClose = () => {
    jsonViewerActions.closeFilterDialog();
    // Reset form
    setFilterName('');
    setFilterType('path');
    setFilterValues(['']);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const values = filterValues.filter(v => v.trim());
    if (!filterName.trim() || values.length === 0) return;

    await jsonViewerActions.addFilterSet({
      name: filterName.trim(),
      type: filterType,
      values,
      active: true
    });

    handleClose();
  };

  const addValue = () => {
    setFilterValues([...filterValues, '']);
  };

  const updateValue = (index: number, value: string) => {
    const newValues = [...filterValues];
    newValues[index] = value;
    setFilterValues(newValues);
  };

  const removeValue = (index: number) => {
    if (filterValues.length > 1) {
      const newValues = filterValues.filter((_, i) => i !== index);
      setFilterValues(newValues);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Create Filter</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Filter Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter Name
              </label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="e.g., User Names"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Filter Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFilterType('path')}
                  className={`p-3 text-left border rounded-md ${
                    filterType === 'path'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium">📍 JSON Path</div>
                  <div className="text-sm text-gray-600">Filter by object path</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('value')}
                  className={`p-3 text-left border rounded-md ${
                    filterType === 'value'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium">🔍 Value Search</div>
                  <div className="text-sm text-gray-600">Search for specific values</div>
                </button>
              </div>
            </div>

            {/* Filter Values */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {filterType === 'path' ? 'JSON Paths' : 'Search Values'}
              </label>
              {filterValues.map((value, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateValue(index, e.target.value)}
                    placeholder={
                      filterType === 'path' 
                        ? '$.users[*].name' 
                        : 'search text'
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {filterValues.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeValue(index)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addValue}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add another value
              </button>
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Create Filter
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FilterSetDialog;