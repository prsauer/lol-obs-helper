import { useEffect, useState } from 'react';
import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Root } from './Root';
import { AppConfigContextProvider } from './hooks/AppConfigContext';
import { RecordingProvider } from './hooks/recordingContext';
import { ClerkProvider } from '@clerk/clerk-react';

const CLERK_PKEY = 'pk_test_cmVuZXdlZC1tb2NjYXNpbi0zMy5jbGVyay5hY2NvdW50cy5kZXYk';

export const App = () => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 600,
            retry: (failureCount, error) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if ((error as Error)?.message === 'Fetch error 404') {
                return false;
              }
              if ((error as Error)?.message === 'Fetch error 403') {
                return false;
              }
              if ((error as Error)?.message === 'Could not find account data') {
                return false;
              }
              return true;
            },
          },
        },
      }),
  );

  useEffect(() => {
    window.native.login.didLogin((_evt, token) => {
      console.log('didLogin', token);
    });
    return () => {
      window.native.login.removeAll_didLogin_listeners();
    };
  }, []);

  return (
    <ClerkProvider publishableKey={CLERK_PKEY}>
      <QueryClientProvider client={queryClient}>
        <AppConfigContextProvider>
          <RecordingProvider>
            <Root />
          </RecordingProvider>
        </AppConfigContextProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
};
