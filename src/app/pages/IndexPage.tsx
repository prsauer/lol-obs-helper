import { useQuery, useQueryClient } from 'react-query';
import { Button } from '../components/Button';
import { MatchStub } from '../components/MatchStub';
import { useAppConfig } from '../hooks/AppConfigContext';
import { useEffect } from 'react';

export const IndexPage = () => {
  const config = useAppConfig();
  const queryClient = useQueryClient();

  const localMatches = useQuery(
    'local-matches',
    async () => {
      return window.native?.vods?.scanFolderForMatches(config.appConfig.riotLogsPath || '');
    },
    {
      enabled: Boolean(config.appConfig.riotLogsPath),
    },
  );

  const videos = useQuery(`vod-list`, () => window.native.vods?.getVodsInfo(config.appConfig.vodStoragePath || ''), {
    enabled: Boolean(config.appConfig.vodStoragePath),
  });

  useEffect(() => {
    window.native.login.didLogin((_evt, token) => {
      console.log(token);
      config.updateAppConfig(() => ({
        ...config.appConfig,
        googleToken: token,
      }));
    });
    return () => window.native.login.removeAll_didLogin_listeners();
  }, [config]);

  return (
    <div className="flex flex-col max-w-xl h-full">
      <div className="mb-2 flex flex-row gap-2 items-center">
        <Button linkTo="/setup">Setup</Button>
        <Button
          onClick={async () => {
            try {
              await window.native.links.openExternalURL('http://localhost:3001/greet');
            } catch (error) {
              console.log('login failed', error);
            }
          }}
        >
          Login Test
        </Button>
        <Button
          onClick={() => {
            localMatches.refetch();
            videos.refetch();
            queryClient.invalidateQueries({ queryKey: ['game-data'] });
          }}
        >
          Refresh
        </Button>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto pb-4">
        {localMatches.data &&
          localMatches.data.slice(0, 8).map((d, idx) => (
            <Button key={`${d.matchId}${idx}`} linkTo={`vod/${d.platformId + '_' + d.matchId}/${d.summonerName}`}>
              <MatchStub matchId={d.platformId + '_' + d.matchId} summonerName={d.summonerName} videos={videos.data} />
            </Button>
          ))}
      </div>
    </div>
  );
};
