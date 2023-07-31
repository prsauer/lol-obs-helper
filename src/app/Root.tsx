import { RouterProvider, createHashRouter } from "react-router-dom";
import { IndexPage } from "./pages/IndexPage";
import { ReviewPage, reviewLoader } from "./pages/ReviewPage";
import { useEffect, useState } from "react";
import { useAppConfig } from "./hooks/AppConfigContext";
import { SetupPage } from "./pages/SetupPage";

type RecordingState = {
  outputActive: boolean;
  outputState: string;
  outputPath: string;
};

type ConnectionState = {
  connected: boolean;
};

const router = createHashRouter([
  {
    path: "/",
    element: <IndexPage />,
  },
  {
    path: "/vod/:id",
    element: <ReviewPage />,
    loader: reviewLoader,
  },
  {
    path: "/setup",
    element: <SetupPage />,
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

  useEffect(() => {
    window.native.obs?.logMessage((_evt, logline) => {
      console.log(`${new Date()} ${logline}`);
    });

    window.native.obs?.onConnectionStateChange((_evt, state) => {
      setConnState(state);
    });

    window.native.obs?.onRecordingStateChange((_evt, state) => {
      console.log("new rec state", state);
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

  return (
    <div className="p-3 text-gray-100 h-screen overflow-hidden">
      <div className="flex flex-row gap-3 mb-2">
        <div>OBS Connected: {connState.connected ? "Yes" : "No"}</div>
        <div>Recording: {recState.outputActive ? "Yes" : "No"}</div>
        <div>Config OK: {config.isValidConfig ? "Yes" : "No"} </div>
      </div>
      <RouterProvider router={router} />
    </div>
  );
};
