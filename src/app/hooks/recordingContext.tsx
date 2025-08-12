import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

type RecordingState = {
  recording: boolean;
};

interface RecordingContextData {
  recording: boolean;
}

const RecordingContext = createContext<RecordingContextData>({
  recording: false,
});

interface RecordingProviderProps {
  children: React.ReactNode;
}

export const RecordingProvider = ({ children }: RecordingProviderProps) => {
  const [recState, setRecState] = useState<RecordingState>({
    recording: false,
  });
  const recordingActiveRef = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    window.native.obs?.onObsModuleStateChange((_evt, state) => {
      console.log('onObsModuleStateChange', { state, recState });
      if (state.recording !== recordingActiveRef.current) {
        if (state.recording) {
          const startSound = new Audio('static://StartSound.wav');
          startSound.play();
        } else {
          const stopSound = new Audio('static://StopSound.wav');
          stopSound.play();
          setTimeout(() => queryClient.invalidateQueries({ queryKey: ['local-matches'] }), 5000);
        }
      }
      recordingActiveRef.current = state.recording;
      setRecState(state);
    });

    return () => {
      window.native.obs?.removeAll_onObsModuleStateChange_listeners();
    };
  }, []);

  return <RecordingContext.Provider value={{ recording: recState.recording }}>{children}</RecordingContext.Provider>;
};

export const useRecording = () => {
  return useContext(RecordingContext);
};
