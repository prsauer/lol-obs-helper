import { RouterProvider, createHashRouter } from 'react-router-dom';
import { IndexPage } from './pages/IndexPage';
import { ReviewPage, reviewLoader } from './pages/ReviewPage';
import { useEffect, useRef, useState } from 'react';
import { useAppConfig } from './hooks/AppConfigContext';
import { SetupPage } from './pages/SetupPage';
import { MatchInspectPage, matchLoader } from './pages/MatchInspectPage';
import { SourceConfig } from './pages/SourceConfig';
import { useQuery } from 'react-query';

type RecordingState = {
  outputActive: boolean;
  outputState: string;
  outputPath: string;
};

const startSound = new Audio('static://StartSound.wav');
const stopSound = new Audio('static://StopSound.wav');

const router = createHashRouter([
  {
    path: '/',
    element: <IndexPage />,
  },
  {
    path: '/vod/:id/:summonerName',
    element: <ReviewPage />,
    loader: reviewLoader,
  },
  {
    path: '/setup',
    element: <SetupPage />,
  },
  {
    path: '/inspect/:matchId',
    element: <MatchInspectPage />,
    loader: matchLoader,
  },
  {
    path: '/source-config',
    element: <SourceConfig />,
  },
]);

export const Root = () => {
  const config = useAppConfig();

  const [recState, setRecState] = useState<RecordingState>({
    outputActive: false,
    outputPath: '',
    outputState: '',
  });
  const recordingActiveRef = useRef(false);

  const localMatches = useQuery(
    'local-matches',
    async () => {
      return window.native?.vods?.scanFolderForMatches(config.appConfig.riotLogsPath || '');
    },
    {
      enabled: Boolean(config.appConfig.riotLogsPath),
    },
  );

  useEffect(() => {
    window.native.obs?.logMessage((_evt, logline) => {
      console.log(`${new Date()} ${logline}`);
    });

    window.native.obs?.onRecordingStateChange((_evt, state) => {
      console.log('new rec state', { state, recState });
      if (state.outputActive !== recordingActiveRef.current) {
        if (state.outputActive) {
          startSound.play();
        } else {
          stopSound.play();
          setTimeout(() => localMatches.refetch(), 5000);
        }
      }
      recordingActiveRef.current = state.outputActive;
      setRecState(state);
    });

    return () => {
      window.native.obs?.removeAll_logMessage_listeners();
    };
  }, []);

  // Decide how to handle making sure we are listening
  useEffect(() => {
    const watchdogTimer = setInterval(() => {
      if (config.appConfig.riotLogsPath && config.isValidConfig) {
        window.native.obs?.startListening();
      }
    }, 1000);
    return () => {
      clearInterval(watchdogTimer);
    };
  }, [config.isValidConfig, config.appConfig.riotLogsPath]);

  useEffect(() => {
    if (config.appConfig.vodStoragePath) {
      window.native.vods?.configureVodsFolderProtocol(config.appConfig.vodStoragePath);
    }
  }, [config.appConfig.vodStoragePath]);

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 p-3 text-gray-100 overflow-hidden flex flex-col">
      <div className="flex flex-row gap-3 mb-2">
        <div>Recording: {recState.outputActive ? 'Yes' : 'No'}</div>
        <div>Config OK: {config.isValidConfig ? 'Yes' : 'No'} </div>
      </div>
      <div className="h-full min-h-0">
        <RouterProvider router={router} />
      </div>
    </div>
  );
};
