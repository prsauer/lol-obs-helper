import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { useQuery } from '@tanstack/react-query';
import { useAppConfig } from '../hooks/AppConfigContext';
import { useRecording } from '../hooks/recordingContext';
import { useEffect } from 'react';

export const Layout = () => {
  const config = useAppConfig();
  const { recording } = useRecording();

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
      <Header recording={recording} configValid={config.isValidConfig} onRefresh={handleRefresh} />
      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
    </div>
  );
};
