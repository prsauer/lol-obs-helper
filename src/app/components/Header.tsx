import { Button } from './Button';
import { useQueryClient } from '@tanstack/react-query';

type HeaderProps = {
  recording: boolean;
  configValid: boolean;
  onRefresh?: () => void;
};

export const Header = ({ recording, configValid, onRefresh }: HeaderProps) => {
  const queryClient = useQueryClient();

  return (
    <div className="flex flex-row gap-3 mb-2 items-center">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${recording ? 'bg-red-500' : 'bg-gray-500'}`}></div>
      </div>
      <div>Config OK: {configValid ? 'Yes' : 'No'} </div>
      <div className="flex flex-row gap-2 ml-4">
        <Button linkTo="/">Home</Button>
        <Button linkTo="/setup">Setup</Button>
        <Button linkTo="/source-config">Source Config</Button>
        <Button
          onClick={async () => {
            try {
              await window.native.links.openExternalURL('http://localhost:3001/greet');
            } catch (error) {
              console.error(error);
            }
          }}
        >
          Login Test
        </Button>
        <Button
          onClick={() => {
            onRefresh?.();
            queryClient.invalidateQueries({ queryKey: ['game-data'] });
          }}
        >
          Refresh
        </Button>
        <Button onClick={() => window.native.obs.startRecording('123')}>Start Recording</Button>
        <Button onClick={() => window.native.obs.stopRecording()}>Stop Recording</Button>
        <Button onClick={() => window.native.obs.discoverSourceProperties().then(console.log)}>
          Discover Source Properties
        </Button>
      </div>
    </div>
  );
};
