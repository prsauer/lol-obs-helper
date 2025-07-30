import { useQuery } from 'react-query';
import { useState } from 'react';
import { Button } from '../components/Button';
import type { ObsProperty, ObsListItem } from 'noobs';

type PropertyInputProps = {
  property: ObsProperty;
  value: string | number | boolean | string[] | null | undefined;
  onChange: (name: string, value: string | number | boolean | string[]) => void;
};

const BooleanProperty = ({ property, value, onChange }: PropertyInputProps) => (
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

const IntegerProperty = ({ property, value, onChange }: PropertyInputProps) => {
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

const FloatProperty = ({ property, value, onChange }: PropertyInputProps) => {
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

const IntSliderProperty = ({ property, value, onChange }: PropertyInputProps) => {
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

const FloatSliderProperty = ({ property, value, onChange }: PropertyInputProps) => {
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

const TextProperty = ({ property, value, onChange }: PropertyInputProps) => {
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

const PathProperty = ({ property, value, onChange }: PropertyInputProps) => {
  if (property.type !== 'path') return null;
  const pathProp = property;
  return (
    <div className="mb-4">
      <label className="block text-gray-100 mb-1">{property.description}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={String(value || pathProp.default_path || '')}
          onChange={(e) => onChange(property.name, e.target.value)}
          disabled={!property.enabled}
          className="bg-gray-800 text-gray-100 px-3 py-1 rounded border border-gray-600 focus:border-green-500 flex-1"
          placeholder={pathProp.path_type === 'directory' ? 'Select directory...' : 'Select file...'}
        />
        <Button
          onClick={() => {
            alert(`Browse ${pathProp.path_type === 'directory' ? 'directory' : 'file'}`);
          }}
          className="px-4"
        >
          Browse
        </Button>
      </div>
      {pathProp.filter && <p className="text-sm text-gray-400 mt-1">Filter: {pathProp.filter}</p>}
    </div>
  );
};

const ListProperty = ({ property, value, onChange }: PropertyInputProps) => {
  if (property.type !== 'list') return null;
  const listProp = property;
  return (
    <div className="mb-4">
      <label className="block text-gray-100 mb-1">{property.description}</label>
      <select
        value={String(value || '')}
        onChange={(e) => onChange(property.name, e.target.value)}
        disabled={!property.enabled}
        className="bg-gray-800 text-gray-100 px-3 py-1 rounded border border-gray-600 focus:border-green-500 w-full"
      >
        <option value="">Select an option...</option>
        {listProp.items?.map((item: ObsListItem, index: number) => (
          <option key={index} value={String(item.value)} disabled={item.disabled}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );
};

const ColorProperty = ({ property, value, onChange }: PropertyInputProps) => {
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

const ButtonProperty = ({ property }: { property: ObsProperty }) => {
  if (property.type !== 'button') return null;
  return (
    <div className="mb-4">
      <button
        onClick={() => {
          console.log(`Button ${property.name} clicked`);
          alert(`${property.description} button clicked!`);
        }}
        disabled={!property.enabled}
        className="bg-transparent hover:bg-green-500 text-green-700 font-semibold hover:text-white py-1 px-7 border border-green-500 hover:border-transparent rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {property.description}
      </button>
    </div>
  );
};

const FontProperty = ({ property, value, onChange }: PropertyInputProps) => {
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

const EditableListProperty = ({ property, value, onChange }: PropertyInputProps) => {
  if (property.type !== 'editable_list') return null;
  const [inputValue, setInputValue] = useState('');
  const items = Array.isArray(value) ? value : [];

  const addItem = () => {
    if (inputValue.trim()) {
      onChange(property.name, [...items, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeItem = (index: number) => {
    onChange(
      property.name,
      items.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-100 mb-1">{property.description}</label>
      <div className="bg-gray-800 rounded border border-gray-600 p-3">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={!property.enabled}
            className="bg-gray-700 text-gray-100 px-3 py-1 rounded border border-gray-600 focus:border-green-500 flex-1"
            placeholder="Add new item..."
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
          />
          <button
            onClick={addItem}
            disabled={!property.enabled}
            className="bg-transparent hover:bg-green-500 text-green-700 font-semibold hover:text-white py-1 px-4 border border-green-500 hover:border-transparent rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
        <div className="space-y-1">
          {items.map((item: string, index: number) => (
            <div key={index} className="flex items-center justify-between bg-gray-700 px-3 py-1 rounded">
              <span className="text-gray-100">{item}</span>
              <button
                onClick={() => removeItem(index)}
                disabled={!property.enabled}
                className="text-red-400 hover:text-red-300 ml-2"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FrameRateProperty = ({ property, value, onChange }: PropertyInputProps) => {
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

const PropertyRenderer = ({ property, value, onChange }: PropertyInputProps) => {
  if (!property.visible) return null;

  if (property.type === 'int' && property.number_type === 'slider') {
    return <IntSliderProperty property={property} value={value} onChange={onChange} />;
  }
  if (property.type === 'float' && property.number_type === 'slider') {
    return <FloatSliderProperty property={property} value={value} onChange={onChange} />;
  }

  switch (property.type) {
    case 'bool':
      return <BooleanProperty property={property} value={value} onChange={onChange} />;
    case 'int':
      return <IntegerProperty property={property} value={value} onChange={onChange} />;
    case 'float':
      return <FloatProperty property={property} value={value} onChange={onChange} />;
    case 'text':
      return <TextProperty property={property} value={value} onChange={onChange} />;
    case 'path':
      return <PathProperty property={property} value={value} onChange={onChange} />;
    case 'list':
      return <ListProperty property={property} value={value} onChange={onChange} />;
    case 'color':
    case 'color_alpha':
      return <ColorProperty property={property} value={value} onChange={onChange} />;
    case 'button':
      return <ButtonProperty property={property} />;
    case 'font':
      return <FontProperty property={property} value={value} onChange={onChange} />;
    case 'editable_list':
      return <EditableListProperty property={property} value={value} onChange={onChange} />;
    case 'frame_rate':
      return <FrameRateProperty property={property} value={value} onChange={onChange} />;
    default:
      return (
        <div className="mb-4 p-3 bg-yellow-900 border border-yellow-600 rounded">
          <p className="text-yellow-100">
            Unknown property type: <code>{property.type}</code>
          </p>
          <p className="text-sm text-yellow-200">{property.description}</p>
        </div>
      );
  }
};

export const SourceConfig = () => {
  const [propertyValues, setPropertyValues] = useState<Record<string, string | number | boolean | string[]>>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [activeScene, setActiveScene] = useState<string>('');

  const sourcePropertiesQuery = useQuery('source-properties', () => window.native.obs.discoverSourceProperties(), {
    refetchOnMount: true,
  });

  const handlePropertyChange = async (propertyName: string, value: string | number | boolean | string[]) => {
    // Parse the propertyName format: "sourceName.propertyName"
    const [sourceName, actualPropertyName] = propertyName.split('.');

    try {
      // Convert string[] to format that OBS expects
      let obsValue: string | number | boolean | null;
      if (Array.isArray(value)) {
        // For editable lists, OBS might expect a JSON string or specific format
        obsValue = JSON.stringify(value);
      } else {
        obsValue = value;
      }

      // Update OBS settings immediately
      await window.native.obs.setSourceProperty(sourceName, actualPropertyName, obsValue);

      // Update local state for UI
      setPropertyValues((prev) => ({
        ...prev,
        [propertyName]: value,
      }));

      console.log(`Updated ${actualPropertyName} to ${obsValue} for source ${sourceName}`);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error(`Failed to update property ${actualPropertyName} for source ${sourceName}:`, error);
      alert(`Failed to update property: ${error}`);
    }
  };

  const handleSceneChange = async (sceneName: string) => {
    try {
      await window.native.obs.setScene(sceneName);
      setActiveScene(sceneName);
      console.log(`Switched to scene: ${sceneName}`);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error(`Failed to switch to scene ${sceneName}:`, error);
      alert(`Failed to switch to scene: ${error}`);
    }
  };

  const handleRefreshAndReset = () => {
    // Reset local state and refresh properties
    setPropertyValues({});
    setLastUpdated(null);
    setActiveScene('');
    sourcePropertiesQuery.refetch();
    console.log('Properties refreshed and local state reset');
  };

  const handleRefresh = () => {
    sourcePropertiesQuery.refetch();
  };

  if (sourcePropertiesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-100">Loading source properties...</div>
      </div>
    );
  }

  if (sourcePropertiesQuery.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Error loading source properties: {String(sourcePropertiesQuery.error)}</div>
      </div>
    );
  }

  const sourceProperties = sourcePropertiesQuery.data || {};

  return (
    <div className="flex flex-col h-full w-full">
      <div className="mb-4 flex flex-row gap-2 items-center">
        <Button linkTo="/">← Back</Button>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-gray-100">OBS Source Configuration</h1>
          <p className="text-sm text-gray-400">Settings are applied to OBS immediately when changed</p>
        </div>
        {lastUpdated && <span className="text-sm text-green-400">Last updated: {lastUpdated}</span>}
        <Button onClick={handleRefresh}>Refresh Properties</Button>
        <Button onClick={handleRefreshAndReset} className="bg-blue-600 hover:bg-blue-700">
          Reset & Refresh
        </Button>
      </div>

      <div className="mb-6 bg-gray-800 rounded-lg p-6 border border-gray-600">
        <h2 className="text-lg font-semibold text-gray-100 mb-4 border-b border-gray-600 pb-2">Scene Selection</h2>
        <div className="space-y-3">
          {['MonCap', 'WinCap'].map((sceneName) => (
            <label key={sceneName} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={activeScene === sceneName}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleSceneChange(sceneName);
                  }
                }}
                className="rounded"
              />
              <span className="text-gray-100">
                {sceneName === 'MonCap' ? 'Monitor Capture' : 'Window Capture'} ({sceneName})
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {Object.keys(sourceProperties).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No sources found</p>
            <p className="text-gray-500 text-sm mt-2">Make sure OBS is running and sources are configured</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(sourceProperties).map(([sourceName, properties]) => (
              <div key={sourceName} className="bg-gray-800 rounded-lg p-6 border border-gray-600">
                <h2 className="text-lg font-semibold text-gray-100 mb-4 border-b border-gray-600 pb-2">{sourceName}</h2>
                {(properties as ObsProperty[]).length === 0 ? (
                  <p className="text-gray-400">No configurable properties for this source</p>
                ) : (
                  <div className="space-y-2">
                    {(properties as ObsProperty[]).map((property: ObsProperty, index: number) => (
                      <PropertyRenderer
                        key={`${sourceName}-${property.name}-${index}`}
                        property={property}
                        value={propertyValues[`${sourceName}.${property.name}`]}
                        onChange={(name, value) => handlePropertyChange(`${sourceName}.${name}`, value)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
