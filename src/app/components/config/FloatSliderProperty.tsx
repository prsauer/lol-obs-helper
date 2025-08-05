import type { PropertyInputProps } from './types';

export const FloatSliderProperty = ({ property, value, onChange }: PropertyInputProps) => {
  if (property.type !== 'float' || property.number_type !== 'slider') return null;
  const floatProp = property;
  return (
    <div className="mb-4">
      <label className="block text-gray-100 mb-1">{property.description}</label>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">{floatProp.min}</span>
        <input
          type="range"
          step="any"
          value={Number(value) || floatProp.min || 0}
          min={floatProp.min}
          max={floatProp.max}
          onChange={(e) => onChange(property.name, parseFloat(e.target.value))}
          disabled={!property.enabled}
          className="flex-1"
        />
        <span className="text-sm text-gray-400">{floatProp.max}</span>
        <span className="text-gray-100 min-w-16">{(Number(value) || floatProp.min || 0).toFixed(2)}</span>
      </div>
    </div>
  );
};
