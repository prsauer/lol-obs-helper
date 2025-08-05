import { Button } from '../Button';
import type { PropertyInputProps } from './types';

export const PathProperty = ({ property, value, onChange }: PropertyInputProps) => {
  if (property.type !== 'path') return null;
  const pathProp = property;
  return (
    <div className="mb-4">
      <label className="block text-gray-100 mb-1">{property.description}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={String(value || pathProp.default_path || '')}
          onChange={(e) => onChange(property.name, e.target.value)}
          disabled={!property.enabled}
          className="bg-gray-800 text-gray-100 px-3 py-1 rounded border border-gray-600 focus:border-green-500 flex-1"
          placeholder={pathProp.path_type === 'directory' ? 'Select directory...' : 'Select file...'}
        />
        <Button
          onClick={() => {
            alert(`Browse ${pathProp.path_type === 'directory' ? 'directory' : 'file'}`);
          }}
          className="px-4"
        >
          Browse
        </Button>
      </div>
      {pathProp.filter && <p className="text-sm text-gray-400 mt-1">Filter: {pathProp.filter}</p>}
    </div>
  );
};
