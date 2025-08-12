import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { useQuery } from '@tanstack/react-query';
import { useAppConfig } from '../hooks/AppConfigContext';
import { useEffect, useRef, useState } from 'react';

type RecordingState = {
  recording: boolean;
};

const startSound = new Audio('static://StartSound.wav');
const stopSound = new Audio('static://StopSound.wav');

export const Layout = () => {
  const config = useAppConfig();
  const [recState, setRecState] = useState<RecordingState>({
    recording: false,
  });
  const recordingActiveRef = useRef(false);

  const localMatches = useQuery({
    queryKey: ['local-matches'],
    queryFn: async () => window.native?.vods?.scanFolderForMatches(config.appConfig.riotLogsPath || ''),
    enabled: Boolean(config.appConfig.riotLogsPath),
  });

  const videos = useQuery({
    queryKey: ['vod-list'],
    queryFn: () => window.native.vods?.getVodsInfo(config.appConfig.vodStoragePath || ''),
    enabled: Boolean(config.appConfig.vodStoragePath),
  });

  const handleRefresh = () => {
    localMatches.refetch();
    videos.refetch();
  };

  useEffect(() => {
    window.native.obs?.logMessage((_evt, logline) => {
      console.log(`${new Date()} ${logline}`);
    });

    window.native.obs?.onObsModuleStateChange((_evt, state) => {
      console.log('onObsModuleStateChange', { state, recState });
      if (state.recording !== recordingActiveRef.current) {
        if (state.recording) {
          startSound.play();
        } else {
          stopSound.play();
          setTimeout(() => localMatches.refetch(), 5000);
        }
      }
      recordingActiveRef.current = state.recording;
      setRecState(state);
    });

    return () => {
      window.native.obs?.removeAll_logMessage_listeners();
    };
  }, []);

  useEffect(() => {
    const watchdogTimer = setInterval(() => {
      if (config.appConfig.riotLogsPath && config.isValidConfig) {
        window.native.obs?.startListening();
        window.native.leagueLiveClient.startListeningForGame();
      }
    }, 1000);
    return () => {
      clearInterval(watchdogTimer);
    };
  }, [config.isValidConfig, config.appConfig.riotLogsPath]);

  return (
    <div className="h-full flex flex-col">
      <Header recording={recState.recording} configValid={config.isValidConfig} onRefresh={handleRefresh} />
      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
    </div>
  );
};
