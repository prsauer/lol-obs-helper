import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IAppConfig, useAppConfig } from '../hooks/AppConfigContext';
import { useRecording } from '../hooks/recordingContext';
import { Button } from '../components/Button';

export const SetupPage = () => {
  const navigate = useNavigate();
  const { recording } = useRecording();
  const config = useAppConfig();
  const [appConfigState, setAppConfigState] = useState<IAppConfig>(config.appConfig);

  useEffect(() => {
    setAppConfigState(config.appConfig);
  }, [config.appConfig.riotLogsPath, config.appConfig.vodStoragePath]);

  const writeState = useCallback(() => {
    config.updateAppConfig(() => appConfigState);
  }, [config, appConfigState]);

  const configHasEdits = Boolean(
    config.appConfig.riotLogsPath != appConfigState.riotLogsPath ||
      config.appConfig.vodStoragePath != appConfigState.vodStoragePath,
  );

  return (
    <div className="m-3 text-gray-100 max-w-full">
      <Button onClick={() => navigate(-1)}>BACK</Button>
      <h2>Setup</h2>
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
      {configHasEdits && <div className="mt-2 bg-red-400 p-2 text-red-950 rounded-md font-bold">UNSAVED CHANGES</div>}

      <div className="mt-8 border-t border-gray-600 pt-4">
        <h3 className="text-lg font-semibold mb-4">Manual Recording Controls</h3>
        <div className="flex gap-2">
          <Button onClick={() => window.native.obs.startRecording('123')}>Start Recording</Button>
          <Button onClick={() => window.native.obs.stopRecording()}>Stop Recording</Button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${recording ? 'bg-red-500' : 'bg-gray-500'}`}></div>
          <span className="text-sm">{recording ? 'Recording' : 'Not Recording'}</span>
        </div>
      </div>
    </div>
  );
};
