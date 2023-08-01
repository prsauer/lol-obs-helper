import { useCallback, useState, useEffect } from "react";
import { IAppConfig, useAppConfig } from "../hooks/AppConfigContext";
import { Button } from "../components/Button";

export const SetupPage = () => {
  const config = useAppConfig();
  const [appConfigState, setAppConfigState] = useState<IAppConfig>(
    config.appConfig
  );

  useEffect(() => {
    setAppConfigState(config.appConfig);
  }, [
    config.appConfig.obsWSPassword,
    config.appConfig.obsWSURL,
    config.appConfig.riotLogsPath,
    config.appConfig.vodStoragePath,
  ]);

  const writeState = useCallback(() => {
    config.updateAppConfig(() => appConfigState);
  }, [config, appConfigState]);

  const configHasEdits = Boolean(
    config.appConfig.obsWSPassword != appConfigState.obsWSPassword ||
      config.appConfig.obsWSURL != appConfigState.obsWSURL ||
      config.appConfig.riotLogsPath != appConfigState.riotLogsPath ||
      config.appConfig.vodStoragePath != appConfigState.vodStoragePath
  );

  return (
    <div className="m-3 text-gray-100 max-w-full">
      <Button linkTo="/">BACK</Button>
      <h2>Setup</h2>
      <div className="mt-2">
        OBS WebSocket Address
        <input
          className="bg-cyan-800 text-slate-100 border border-l-violet-200 w-full"
          type="text"
          defaultValue={appConfigState.obsWSURL}
          onChange={(e) =>
            setAppConfigState((s) => ({
              ...s,
              obsWSURL: e.target.value,
            }))
          }
        />
      </div>
      <div className="mt-2">
        OBS WebSocket Password
        <input
          className="bg-cyan-800 text-slate-100 border border-l-violet-200 w-full"
          type="text"
          defaultValue={appConfigState.obsWSPassword}
          onChange={(e) =>
            setAppConfigState((s) => ({
              ...s,
              obsWSPassword: e.target.value,
            }))
          }
        />
      </div>
      <div className="mt-2">
        Riot logs directory
        <input
          className="bg-cyan-800 text-slate-100 border border-l-violet-200 w-full"
          type="text"
          defaultValue={appConfigState.riotLogsPath}
          onChange={(e) =>
            setAppConfigState((s) => ({
              ...s,
              riotLogsPath: e.target.value,
            }))
          }
        />
      </div>
      <div className="mt-2">
        VODs directory
        <input
          className="bg-cyan-800 text-slate-100 border border-l-violet-200 w-full"
          type="text"
          defaultValue={appConfigState.vodStoragePath}
          onChange={(e) =>
            setAppConfigState((s) => ({
              ...s,
              vodStoragePath: e.target.value,
            }))
          }
        />
      </div>
      <Button className="mt-4" onClick={writeState}>
        SAVE
      </Button>
      {configHasEdits && (
        <div className="mt-2 bg-red-400 p-2 text-red-950 rounded-md font-bold">
          UNSAVED CHANGES
        </div>
      )}
    </div>
  );
};
