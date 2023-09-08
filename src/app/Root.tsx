import { RouterProvider, createHashRouter } from "react-router-dom";
import { IndexPage } from "./pages/IndexPage";
import { ReviewPage, reviewLoader } from "./pages/ReviewPage";
import { useEffect, useRef, useState } from "react";
import { useAppConfig } from "./hooks/AppConfigContext";
import { SetupPage } from "./pages/SetupPage";
import { MatchInspectPage, matchLoader } from "./pages/MatchInspectPage";
import { useQuery } from "react-query";

type RecordingState = {
  outputActive: boolean;
  outputState: string;
  outputPath: string;
};

type ConnectionState = {
  connected: boolean;
};

const startSound = new Audio("static://StartSound.wav");
const stopSound = new Audio("static://StopSound.wav");

const router = createHashRouter([
  {
    path: "/",
    element: <IndexPage />,
  },
  {
    path: "/vod/:id/:summonerName",
    element: <ReviewPage />,
    loader: reviewLoader,
  },
  {
    path: "/setup",
    element: <SetupPage />,
  },
  {
    path: "/inspect/:matchId",
    element: <MatchInspectPage />,
    loader: matchLoader,
  },
]);

export const Root = () => {
  const config = useAppConfig();

  const [connState, setConnState] = useState<ConnectionState>({
    connected: false,
  });
  const [recState, setRecState] = useState<RecordingState>({
    outputActive: false,
    outputPath: "",
    outputState: "",
  });
  const recordingActiveRef = useRef(false);

  const localMatches = useQuery(
    "local-matches",
    async () => {
      return window.native?.vods?.scanFolderForMatches(
        config.appConfig.riotLogsPath || ""
      );
    },
    {
      enabled: Boolean(config.appConfig.riotLogsPath),
    }
  );

  useEffect(() => {
    window.native.obs?.logMessage((_evt, logline) => {
      console.log(`${new Date()} ${logline}`);
    });

    window.native.obs?.onConnectionStateChange((_evt, state) => {
      setConnState(state);
    });

    window.native.obs?.onRecordingStateChange((_evt, state) => {
      console.log("new rec state", { state, recState });
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

  useEffect(() => {
    const watchdogTimer = setInterval(() => {
      if (
        !connState.connected &&
        config.appConfig.obsWSURL &&
        config.appConfig.obsWSPassword &&
        config.appConfig.riotLogsPath &&
        config.isValidConfig
      ) {
        window.native.obs?.startListening(
          config.appConfig.obsWSURL,
          config.appConfig.obsWSPassword,
          config.appConfig.riotLogsPath
        );
      }
    }, 1000);
    return () => {
      clearInterval(watchdogTimer);
    };
  }, [
    connState,
    config.appConfig.obsWSURL,
    config.appConfig.obsWSPassword,
    config.isValidConfig,
    config.appConfig.riotLogsPath,
  ]);

  useEffect(() => {
    if (config.appConfig.vodStoragePath) {
      window.native.vods?.configureVodsFolderProtocol(
        config.appConfig.vodStoragePath
      );
    }
  }, [config.appConfig.vodStoragePath]);

  return (
    <div className="p-3 text-gray-100 h-screen overflow-hidden flex flex-col">
      <div className="flex flex-row gap-3 mb-2">
        <div>
          OBS Connected:{" "}
          {connState.connected ? (
            "Yes"
          ) : (
            <span className="bg-red-800 pl-8 pr-8 pt-1 pb-1 border">NO</span>
          )}
        </div>
        <div>Recording: {recState.outputActive ? "Yes" : "No"}</div>
        <div>Config OK: {config.isValidConfig ? "Yes" : "No"} </div>
      </div>
      <RouterProvider router={router} />
    </div>
  );
};
