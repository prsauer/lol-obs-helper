import type { PropertyInputProps } from './types';

export const TextProperty = ({ property, value, onChange }: PropertyInputProps) => {
  if (property.type !== 'text') return null;
  const textProp = property;
  const isMultiline = textProp.text_type === 'multiline';
  const isPassword = textProp.text_type === 'password';
  const isInfo = textProp.text_type === 'info';

  if (isInfo) {
    return (
      <div className="mb-4">
        <div className="bg-gray-800 p-3 rounded border border-gray-600">
          <h4 className="text-gray-100 font-semibold">{property.description}</h4>
          {value && <p className="text-gray-300 mt-1">{String(value)}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-gray-100 mb-1">{property.description}</label>
      {isMultiline ? (
        <textarea
          value={String(value || '')}
          onChange={(e) => onChange(property.name, e.target.value)}
          disabled={!property.enabled}
          className="bg-gray-800 text-gray-100 px-3 py-2 rounded border border-gray-600 focus:border-green-500 w-full"
          rows={4}
        />
      ) : (
        <input
          type={isPassword ? 'password' : 'text'}
          value={String(value || '')}
          onChange={(e) => onChange(property.name, e.target.value)}
          disabled={!property.enabled}
          className="bg-gray-800 text-gray-100 px-3 py-1 rounded border border-gray-600 focus:border-green-500 w-full"
        />
      )}
    </div>
  );
};
