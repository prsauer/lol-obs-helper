import type { ObsListItem } from 'noobs';
import type { PropertyInputProps } from './types';

export const ListProperty = ({ property, value, onChange }: PropertyInputProps) => {
  if (property.type !== 'list') {
    console.error('ListProperty: property is not a list', { property });
    return null;
  }
  if (typeof value !== 'number' && typeof value !== 'string' && value !== undefined) {
    console.error('ListProperty: value is not a number or string or undefined', { property, value });
    return null;
  }
  const listProp = property;
  console.log({ property, value });
  return (
    <div className="mb-4">
      <label className="block text-gray-100 mb-1">{property.description}</label>
      <select
        value={value || '-1'}
        onChange={(e) => onChange(property.name, e.target.value)}
        disabled={!property.enabled}
        className="bg-gray-800 text-gray-100 px-3 py-1 rounded border border-gray-600 focus:border-green-500 w-full"
      >
        <option value={-1}>Select an option...</option>
        {listProp.items?.map((item: ObsListItem, index: number) => (
          <option key={index} value={item.value} disabled={item.disabled}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );
};
