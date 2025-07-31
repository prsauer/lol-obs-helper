import type { PropertyInputProps } from './types';

export const BooleanProperty = ({ property, value, onChange }: PropertyInputProps) => (
  <div className="mb-4">
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(property.name, e.target.checked)}
        disabled={!property.enabled}
        className="rounded"
      />
      <span className="text-gray-100">{property.description}</span>
    </label>
  </div>
);
