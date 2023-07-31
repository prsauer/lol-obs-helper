import React, { useContext, useEffect, useState } from "react";

const APP_CONFIG_STORAGE_KEY = "@lolobshelper/appConfig";

export interface IAppConfig {
  vodStoragePath?: string;
  riotLogsPath?: string;
  obsWSURL?: string;
  obsWSPassword?: string;
  summonerId?: string;
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

export const AppConfigContextProvider = (props: IProps) => {
  const [appConfig, setAppConfig] = useState<IAppConfig>({});
  const [isLoading, setLoading] = useState(true);

  const updateAppConfig = (
    updater: (prevAppConfig: IAppConfig) => IAppConfig
  ) => {
    setAppConfig((prev) => {
      const newConfig = updater(prev);
      // window.wowarenalogs.app?.setOpenAtLogin(
      //   newConfig.launchAtStartup ?? false
      // );
      localStorage.setItem(APP_CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
      return newConfig;
    });
  };

  // useEffect(() => {
  //   window.wowarenalogs.win?.onWindowMoved((_, x, y) => {
  //     updateAppConfig((prev) => {
  //       return {
  //         ...prev,
  //         lastWindowX: x,
  //         lastWindowY: y,
  //       };
  //     });
  //   });
  //   window.wowarenalogs.win?.onWindowResized((_, w, h) => {
  //     updateAppConfig((prev) => {
  //       return {
  //         ...prev,
  //         lastWindowWidth: w,
  //         lastWindowHeight: h,
  //       };
  //     });
  //   });
  // }, []);

  useEffect(() => {
    const impl = async () => {
      const appConfigJson = localStorage.getItem(APP_CONFIG_STORAGE_KEY);
      if (appConfigJson) {
        const storedConfig = JSON.parse(appConfigJson) as IAppConfig;

        // const [windowX, windowY] =
        //   (await window.wowarenalogs.win?.getWindowPosition()) ?? [];
        // const [windowWidth, windowHeight] =
        //   (await window.wowarenalogs.win?.getWindowSize()) ?? [];

        const newState: IAppConfig = {
          riotLogsPath: storedConfig.riotLogsPath,
          obsWSURL: storedConfig.obsWSURL,
          obsWSPassword: storedConfig.obsWSPassword,
          vodStoragePath: storedConfig.vodStoragePath,
          summonerId: storedConfig.summonerId,
          // lastWindowX:
          //   storedConfig.lastWindowX === undefined
          //     ? windowX
          //     : storedConfig.lastWindowX || 0,
          // lastWindowY:
          //   storedConfig.lastWindowY === undefined
          //     ? windowY
          //     : storedConfig.lastWindowY || 0,
          // lastWindowWidth:
          //   storedConfig.lastWindowWidth === undefined
          //     ? windowWidth
          //     : storedConfig.lastWindowWidth || 0,
          // lastWindowHeight:
          //   storedConfig.lastWindowHeight === undefined
          //     ? windowHeight
          //     : storedConfig.lastWindowHeight || 0,
          // launchAtStartup: storedConfig.launchAtStartup || false,
        };
        setAppConfig(newState);

        // if (
        //   storedConfig.lastWindowX !== undefined &&
        //   storedConfig.lastWindowY !== undefined
        // )
        //   window.wowarenalogs.win?.setWindowPosition(
        //     storedConfig.lastWindowX,
        //     storedConfig.lastWindowY
        //   );
        // if (
        //   storedConfig.lastWindowHeight !== undefined &&
        //   storedConfig.lastWindowWidth !== undefined
        // )
        //   window.wowarenalogs.win?.setWindowSize(
        //     storedConfig.lastWindowWidth,
        //     storedConfig.lastWindowHeight
        //   );
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
      appConfig.obsWSURL?.length > 4 &&
      appConfig.summonerId &&
      appConfig.summonerId.length > 5
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
