import { useEffect, useState } from "react";
import "./App.css";

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
};

declare global {
  interface Window {
    native: INativeBridge;
  }
}

export const App = () => {
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
    window.native.obs.logMessage((_evt, logline) => {
      console.log(`${new Date()} ${logline}`);
    });

    window.native.obs.onConnectionStateChange((_evt, state) => {
      setConnState(state);
    });

    window.native.obs.onRecordingStateChange((_evt, state) => {
      console.log("new rec state", state);
      setRecState(state);
    });

    return () => {
      console.log("closing listeners");
      window.native.obs.removeAll_logMessage_listeners();
    };
  }, []);

  useEffect(() => {
    console.log("starting watchdog");
    const watchdogTimer = setInterval(() => {
      if (!connState.connected) {
        window.native.obs.startListening(
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
    <div className="m-3">
      <div className="flex flex-col gap-3">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            window.native.obs.synchronize();
          }}
        >
          synchronize
        </button>
        <div>Connected: {connState.connected ? "Yes" : "No"}</div>
        <div>
          <div>Recording: {recState.outputActive ? "Yes" : "No"}</div>
        </div>
      </div>
    </div>
  );
};
