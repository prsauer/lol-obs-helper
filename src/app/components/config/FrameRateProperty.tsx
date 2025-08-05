import type { PropertyInputProps } from './types';

export const FrameRateProperty = ({ property, value, onChange }: PropertyInputProps) => {
  if (property.type !== 'frame_rate') return null;
  return (
    <div className="mb-4">
      <label className="block text-gray-100 mb-1">{property.description}</label>
      <select
        value={String(value || '30')}
        onChange={(e) => onChange(property.name, e.target.value)}
        disabled={!property.enabled}
        className="bg-gray-800 text-gray-100 px-3 py-1 rounded border border-gray-600 focus:border-green-500 w-full"
      >
        <option value="24">24 FPS</option>
        <option value="30">30 FPS</option>
        <option value="60">60 FPS</option>
        <option value="120">120 FPS</option>
        <option value="variable">Variable</option>
      </select>
    </div>
  );
};
