import type { PropertyInputProps } from './types';

export const FontProperty = ({ property, value, onChange }: PropertyInputProps) => {
  if (property.type !== 'font') return null;
  return (
    <div className="mb-4">
      <label className="block text-gray-100 mb-1">{property.description}</label>
      <select
        value={String(value || 'Arial')}
        onChange={(e) => onChange(property.name, e.target.value)}
        disabled={!property.enabled}
        className="bg-gray-800 text-gray-100 px-3 py-1 rounded border border-gray-600 focus:border-green-500 w-full"
      >
        <option value="Arial">Arial</option>
        <option value="Helvetica">Helvetica</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Courier New">Courier New</option>
        <option value="Verdana">Verdana</option>
      </select>
    </div>
  );
};
