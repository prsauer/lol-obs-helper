import type { PropertyInputProps } from './types';

export const IntegerProperty = ({ property, value, onChange }: PropertyInputProps) => {
  if (property.type !== 'int') return null;
  const intProp = property;
  return (
    <div className="mb-4">
      <label className="block text-gray-100 mb-1">{property.description}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={Number(value) || intProp.min || 0}
          min={intProp.min}
          max={intProp.max}
          step={intProp.step || 1}
          onChange={(e) => onChange(property.name, parseInt(e.target.value))}
          disabled={!property.enabled}
          className="bg-gray-800 text-gray-100 px-3 py-1 rounded border border-gray-600 focus:border-green-500"
        />
      </div>
    </div>
  );
};
