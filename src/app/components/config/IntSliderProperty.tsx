import type { PropertyInputProps } from './types';

export const IntSliderProperty = ({ property, value, onChange }: PropertyInputProps) => {
  if (property.type !== 'int' || property.number_type !== 'slider') return null;
  const intProp = property;
  return (
    <div className="mb-4">
      <label className="block text-gray-100 mb-1">{property.description}</label>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">{intProp.min}</span>
        <input
          type="range"
          value={Number(value) || intProp.min || 0}
          min={intProp.min}
          max={intProp.max}
          step={intProp.step || 1}
          onChange={(e) => onChange(property.name, parseInt(e.target.value))}
          disabled={!property.enabled}
          className="flex-1"
        />
        <span className="text-sm text-gray-400">{intProp.max}</span>
        <span className="text-gray-100 min-w-12">{Number(value) || intProp.min || 0}</span>
      </div>
    </div>
  );
};
