import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Button } from './Button';
import { useQueryClient } from '@tanstack/react-query';
import { genUploader } from 'uploadthing/client';
export const { uploadFiles } = genUploader();

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
        <Button linkTo="/">Home</Button>{' '}
        <Button
          onClick={() => {
            onRefresh?.();
            queryClient.invalidateQueries();
          }}
        >
          Refresh
        </Button>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
        <Button
          onClick={async () => {
            window.native.upload.uploadFile(
              'D163078f58d18a3505dc2d670d96798ff',
              'D:\\Video\\2025-09-01 16-52-27 - 3v3_cd0137fc10099def2d793d54266c3674.mp4',
            );
          }}
        >
          upload
        </Button>
        <Button linkTo="/setup">Setup</Button>
        <Button linkTo="/source-config">Source Config</Button>
        <Button
          onClick={async () => {
            try {
              await window.native.links.openExternalURL('https://spires-lol.vercel.app/greet');
            } catch (error) {
              console.error(error);
            }
          }}
        >
          Login with Google
        </Button>
      </div>
    </div>
  );
};
