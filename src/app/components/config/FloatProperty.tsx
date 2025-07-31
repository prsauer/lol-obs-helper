import type { PropertyInputProps } from './types';

export const FloatProperty = ({ property, value, onChange }: PropertyInputProps) => {
  if (property.type !== 'float') return null;
  const floatProp = property;
  return (
    <div className="mb-4">
      <label className="block text-gray-100 mb-1">{property.description}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="any"
          value={Number(value) || floatProp.min || 0}
          min={floatProp.min}
          max={floatProp.max}
          onChange={(e) => onChange(property.name, parseFloat(e.target.value))}
          disabled={!property.enabled}
          className="bg-gray-800 text-gray-100 px-3 py-1 rounded border border-gray-600 focus:border-green-500"
        />
      </div>
    </div>
  );
};
