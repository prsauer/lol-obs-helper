import { useState } from 'react';
import type { PropertyInputProps } from './types';

export const EditableListProperty = ({ property, value, onChange }: PropertyInputProps) => {
  if (property.type !== 'editable_list') return null;
  const [inputValue, setInputValue] = useState('');
  const items = Array.isArray(value) ? value : [];

  const addItem = () => {
    if (inputValue.trim()) {
      onChange(property.name, [...items, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeItem = (index: number) => {
    onChange(
      property.name,
      items.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-100 mb-1">{property.description}</label>
      <div className="bg-gray-800 rounded border border-gray-600 p-3">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={!property.enabled}
            className="bg-gray-700 text-gray-100 px-3 py-1 rounded border border-gray-600 focus:border-green-500 flex-1"
            placeholder="Add new item..."
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
          />
          <button
            onClick={addItem}
            disabled={!property.enabled}
            className="bg-transparent hover:bg-green-500 text-green-700 font-semibold hover:text-white py-1 px-4 border border-green-500 hover:border-transparent rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
        <div className="space-y-1">
          {items.map((item: string, index: number) => (
            <div key={index} className="flex items-center justify-between bg-gray-700 px-3 py-1 rounded">
              <span className="text-gray-100">{item}</span>
              <button
                onClick={() => removeItem(index)}
                disabled={!property.enabled}
                className="text-red-400 hover:text-red-300 ml-2"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
