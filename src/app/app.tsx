import { useState } from 'react';
import './App.css';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Root } from './Root';
import { AppConfigContextProvider } from './hooks/AppConfigContext';

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

  return (
    <QueryClientProvider client={queryClient}>
      <AppConfigContextProvider>
        <Root />
      </AppConfigContextProvider>
    </QueryClientProvider>
  );
};
