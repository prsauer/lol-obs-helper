import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { PropertyRenderer } from '../components/config';
import { PreviewWindow } from '../components/PreviewWindow';
import type { ObsProperty } from 'noobs';

export const SourceConfig = () => {
  const [propertyValues, setPropertyValues] = useState<Record<string, string | number | boolean | string[]>>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [activeScene, setActiveScene] = useState<string>('');

  const sourcePropertiesQuery = useQuery({
    queryKey: ['source-properties'],
    queryFn: () => window.native.obs.discoverSourceProperties(),
    refetchOnMount: true,
  });

  const { propertiesBySource, settingsBySource } = sourcePropertiesQuery.data || {};

  useEffect(() => {
    if (settingsBySource && Object.keys(settingsBySource).length > 0) {
      const initialValues: Record<string, string | number | boolean | string[]> = {};

      Object.entries(settingsBySource).forEach(([sourceName, settings]) => {
        if (settings && typeof settings === 'object') {
          Object.entries(settings).forEach(([propertyName, value]) => {
            const key = `${sourceName}.${propertyName}`;
            if (value !== null && value !== undefined) {
              initialValues[key] = value as string | number | boolean | string[];
            }
          });
        }
      });

      setPropertyValues((prev) => ({
        ...initialValues,
        ...prev,
      }));
    }
  }, [settingsBySource]);

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

  return (
    <div className="flex flex-row h-full w-full">
      <div className="flex flex-col h-full w-full flex-1">
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
            {Object.keys(propertiesBySource || {}).map((sceneName) => (
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
                <span className="text-gray-100">{sceneName}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto minimal-scrollbar">
          {!propertiesBySource || Object.keys(propertiesBySource).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No sources found</p>
              <p className="text-gray-500 text-sm mt-2">Make sure OBS is running and sources are configured</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(propertiesBySource).map(([sourceName, properties]) => (
                <div key={sourceName} className="bg-gray-800 rounded-lg p-6 border border-gray-600">
                  <h2 className="text-lg font-semibold text-gray-100 mb-4 border-b border-gray-600 pb-2">
                    {sourceName}
                  </h2>
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
      <div className="flex flex-1">
        <PreviewWindow />
      </div>
    </div>
  );
};
