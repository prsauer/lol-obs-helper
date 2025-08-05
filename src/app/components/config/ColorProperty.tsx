import type { PropertyInputProps } from './types';

export const ColorProperty = ({ property, value, onChange }: PropertyInputProps) => {
  if (property.type !== 'color' && property.type !== 'color_alpha') return null;
  return (
    <div className="mb-4">
      <label className="block text-gray-100 mb-1">{property.description}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={String(value || '#ffffff')}
          onChange={(e) => onChange(property.name, e.target.value)}
          disabled={!property.enabled}
          className="w-12 h-8 rounded border border-gray-600"
        />
        <input
          type="text"
          value={String(value || '#ffffff')}
          onChange={(e) => onChange(property.name, e.target.value)}
          disabled={!property.enabled}
          className="bg-gray-800 text-gray-100 px-3 py-1 rounded border border-gray-600 focus:border-green-500"
          placeholder="#ffffff"
        />
      </div>
    </div>
  );
};
