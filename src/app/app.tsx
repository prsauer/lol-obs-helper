import { useEffect, useState } from "react";
import "./App.css";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { IndexPage } from "./pages";
import { ReviewPage, reviewLoader } from "./pages/review";
import { QueryClient, QueryClientProvider } from "react-query";

type ElectronOpaqueEvent = {
  senderId: number;
};

type RecordingState = {
  outputActive: boolean;
  outputState: string;
  outputPath: string;
};

type ConnectionState = {
  connected: boolean;
};

export type INativeBridge = {
  platform:
    | "aix"
    | "android"
    | "darwin"
    | "freebsd"
    | "haiku"
    | "linux"
    | "openbsd"
    | "sunos"
    | "win32"
    | "cygwin"
    | "netbsd";
  obs?: {
    synchronize: () => void;
    logMessage: (
      callback: (event: ElectronOpaqueEvent, logline: string) => void
    ) => void;
    startListening: (url: string, pw: string, riotFolder: string) => void;
    removeAll_logMessage_listeners: () => void;
    onConnectionStateChange: (
      callback: (event: ElectronOpaqueEvent, state: ConnectionState) => void
    ) => void;
    onRecordingStateChange: (
      callback: (event: ElectronOpaqueEvent, state: RecordingState) => void
    ) => void;
  };
  vods?: {
    getVodsInfo: () => Promise<{ name: string; ended: string }[]>;
  };
};

declare global {
  interface Window {
    native: INativeBridge;
  }
}

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
]);

export const App = () => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 600,
            retry: (failureCount, error) => {
              console.log("inner", { failureCount, error });
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if ((error as Error)?.message === "Fetch error 404") {
                console.log("Skipping, 404");
                return false;
              }
              if ((error as Error)?.message === "Fetch error 403") {
                console.log("Skipping, 403");
                return false;
              }
              if ((error as Error)?.message === "Could not find account data") {
                return false;
              }
              return true;
            },
          },
        },
      })
  );
  const [connState, setConnState] = useState<ConnectionState>({
    connected: false,
  });
  const [recState, setRecState] = useState<RecordingState>({
    outputActive: false,
    outputPath: "",
    outputState: "",
  });

  useEffect(() => {
    console.log("starting listeners");
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
      console.log("closing listeners");
      window.native.obs?.removeAll_logMessage_listeners();
    };
  }, []);

  useEffect(() => {
    console.log("starting watchdog");
    const watchdogTimer = setInterval(() => {
      if (!connState.connected) {
        window.native.obs?.startListening(
          "ws://192.168.1.203:4455",
          "KbJ1AWlo7yEAVBNn",
          "C:\\Riot Games\\League of Legends\\Logs\\GameLogs"
        );
      }
    }, 1000);
    return () => {
      console.log("clearing watchdog");
      clearInterval(watchdogTimer);
    };
  }, [connState]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="m-3 text-gray-100">
        <div className="flex flex-row gap-3">
          <div>OBS Connected: {connState.connected ? "Yes" : "No"}</div>
          <div>
            <div>Recording: {recState.outputActive ? "Yes" : "No"}</div>
          </div>
        </div>
        <RouterProvider router={router} />
      </div>
    </QueryClientProvider>
  );
};
