import { useState } from "react";
import "./App.css";
import { QueryClient, QueryClientProvider } from "react-query";
import { Root } from "./Root";
import { AppConfigContextProvider } from "./hooks/AppConfigContext";

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
    getVodsInfo: (
      vodPath: string
    ) => Promise<{ name: string; ended: string }[]>;
  };
};

declare global {
  interface Window {
    native: INativeBridge;
  }
}

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

  return (
    <QueryClientProvider client={queryClient}>
      <AppConfigContextProvider>
        <Root />
      </AppConfigContextProvider>
    </QueryClientProvider>
  );
};
