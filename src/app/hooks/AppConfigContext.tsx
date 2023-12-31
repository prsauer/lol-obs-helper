import React, { useContext, useEffect, useState } from 'react';

const APP_CONFIG_STORAGE_KEY = '@lolobshelper/appConfig';

export interface IAppConfig {
  vodStoragePath?: string;
  riotLogsPath?: string;
  obsWSURL?: string;
  obsWSPassword?: string;
  googleToken?: string;
}

interface IAppConfigContextData {
  isLoading: boolean;
  isValidConfig: boolean;
  appConfig: IAppConfig;
  updateAppConfig: (updater: (prevAppConfig: IAppConfig) => IAppConfig) => void;
}

const AppConfigContext = React.createContext<IAppConfigContextData>({
  isValidConfig: false,
  isLoading: true,
  appConfig: {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateAppConfig: () => {},
});

interface IProps {
  children: React.ReactNode | React.ReactNode[];
}

const defaultAppConfig = {
  obsWSURL: 'ws://localhost:4455',
};

export const AppConfigContextProvider = (props: IProps) => {
  const [appConfig, setAppConfig] = useState<IAppConfig>(defaultAppConfig);
  const [isLoading, setLoading] = useState(true);

  const updateAppConfig = (updater: (prevAppConfig: IAppConfig) => IAppConfig) => {
    setAppConfig((prev) => {
      const newConfig = updater(prev);
      localStorage.setItem(APP_CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
      return newConfig;
    });
  };

  useEffect(() => {
    const impl = async () => {
      const appConfigJson = localStorage.getItem(APP_CONFIG_STORAGE_KEY);
      if (appConfigJson) {
        const storedConfig = JSON.parse(appConfigJson) as IAppConfig;

        const newState: IAppConfig = {
          riotLogsPath: storedConfig.riotLogsPath,
          obsWSURL: storedConfig.obsWSURL,
          obsWSPassword: storedConfig.obsWSPassword,
          vodStoragePath: storedConfig.vodStoragePath,
          googleToken: storedConfig.googleToken,
        };
        setAppConfig(newState);
      }
      setLoading(false);
    };
    impl();
  }, []);

  const isValidConfig = Boolean(
    appConfig.obsWSPassword &&
      appConfig.obsWSURL &&
      appConfig.riotLogsPath &&
      appConfig.riotLogsPath.length > 8 &&
      appConfig.obsWSPassword?.length > 4 &&
      appConfig.obsWSURL?.length > 4,
  );

  return (
    <AppConfigContext.Provider
      value={{
        isValidConfig,
        isLoading,
        appConfig,
        updateAppConfig,
      }}
    >
      {props.children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => {
  return useContext(AppConfigContext);
};
