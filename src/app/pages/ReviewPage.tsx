import { useLoaderData, LoaderFunctionArgs, useNavigate } from 'react-router-dom';
import { VodReview } from '../league/VodReview';
import { ChampIcon } from '../league/ChampIcon';
import { useQuery } from '@tanstack/react-query';
import { getGameData } from '../proxy/riotApi';
import { Button } from '../components/Button';
import { useState } from 'react';
import { useAppConfig } from '../hooks/AppConfigContext';
import { associateMatchWithVod } from '../utils/matchAssociation';

export function reviewLoader({ params }: LoaderFunctionArgs) {
  return { id: params.id, summonerName: params.summonerName, type: 'match' as const };
}

export function activityReviewLoader({ params }: LoaderFunctionArgs) {
  return { activityId: params.activityId, type: 'activity' as const };
}

export const ReviewPage = () => {
  const navigate = useNavigate();
  const config = useAppConfig();
  const loaderData = useLoaderData() as ReturnType<typeof reviewLoader> | ReturnType<typeof activityReviewLoader>;
  const [focusSummonerId, setFocusSummonerId] = useState<string | null>(null);

  // All queries at the top level
  const videos = useQuery({
    queryKey: ['vod-list'],
    queryFn: () => window.native.vods?.getVodsInfo(config.appConfig.vodStoragePath || ''),
    enabled: loaderData.type !== 'activity',
  });

  const activities = useQuery({
    queryKey: ['activities'],
    queryFn: () => window.native.vods?.getActivitiesData(config.appConfig.vodStoragePath || ''),
    enabled: Boolean(config.appConfig.vodStoragePath && loaderData.type === 'activity'),
  });

  const localMatches = useQuery({
    queryKey: ['local-matches'],
    queryFn: async () => window.native?.vods?.scanFolderForMatches(config.appConfig.riotLogsPath || ''),
    enabled: Boolean(config.appConfig.riotLogsPath && loaderData.type === 'activity'),
  });

  // Calculate data synchronously after all hooks
  let activityInfo: {
    start?: { timestamp: Date; game?: string };
    end?: { timestamp: Date; game?: string };
    recording?: { filename: string; metadata?: { game?: string } };
  } | null = null;
  let _activityVodPath: string | undefined;
  let resolvedMatch: { matchKey: string; summonerName?: string } | undefined;
  let vod: { name: string; ended: Date } | undefined;
  let activityVod: { path: string } | undefined;

  if (loaderData.type === 'activity' && activities.data) {
    const activity = activities.data.find((rec) => {
      const activityId =
        rec.recording?.activityId || rec.start?.activityId || rec.end?.activityId || `${rec.timestamp}`;
      return activityId === loaderData.activityId;
    });

    if (activity && activity.recording?.filename) {
      activityInfo = activity;
      _activityVodPath = activity.recording.filename;
      activityVod = { path: activity.recording.filename };

      // Use the utility function to associate match with VOD
      resolvedMatch = associateMatchWithVod(activity, localMatches.data);
    }
  }

  // Calculate final match data
  const matchId = loaderData.type === 'activity' ? resolvedMatch?.matchKey || null : loaderData.id;
  const summonerName = loaderData.type === 'activity' ? resolvedMatch?.summonerName || null : loaderData.summonerName;

  // Query based on calculated matchId - this hook is always called
  const gamesQuery = useQuery({
    queryKey: ['game', matchId],
    queryFn: () => getGameData(matchId || 'no-id'),
    enabled: Boolean(matchId),
  });
  const gameInfo = gamesQuery?.data?.data || null;

  // For match type, find corresponding vod from videos query
  if (loaderData.type !== 'activity' && videos.data && gameInfo && 'info' in gameInfo) {
    // Try to find a vod that matches this game's timeframe
    const gameCreation = new Date(gameInfo.info.gameCreation);
    const gameDuration = gameInfo.info.gameDuration * 1000; // Convert seconds to milliseconds
    const gameEnd = new Date(gameCreation.getTime() + gameDuration);

    vod = videos.data.find((v) => {
      const vodTime = new Date(v.ended);
      // Check if vod ended within a reasonable window after the game ended
      const timeDiff = Math.abs(vodTime.getTime() - gameEnd.getTime());
      return timeDiff < 30 * 60 * 1000; // Within 30 minutes
    });
  }

  if (!gameInfo || 'httpStatus' in gameInfo) {
    return (
      <div className="h-full min-h-0 flex flex-col">
        <div className="flex flex-row gap-2 mb-2 items-center">
          <Button onClick={() => navigate(-1)}>BACK</Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-300 text-lg">Match not found</div>
        </div>
      </div>
    );
  }

  const myPart = gameInfo.info.participants?.find((e) => `${e.riotIdGameName}#${e.riotIdTagline}` === summonerName);
  const myParticipantId = myPart?.participantId;
  const myTeamId = gameInfo.info.participants?.[myParticipantId || 0]?.teamId;

  const noVodExists = Boolean(
    (loaderData.type === 'activity' ? !activityVod : !vod) &&
      (loaderData.type === 'activity' ? activityInfo && activityInfo.recording?.filename : gameInfo.info.gameCreation),
  );

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="flex flex-row gap-2 mb-2 items-center ">
        <Button onClick={() => navigate(-1)}>BACK</Button>
        {gameInfo && <div>{new Date(gameInfo.info.gameCreation).toLocaleString()}</div>}
        {matchId && <Button linkTo={`/inspect/${matchId}`}>Inspect</Button>}
        {matchId && (
          <Button
            onClick={() => {
              const cleanMatchId = matchId.replace(/^[A-Z]{2,3}\d*_/, '');
              window.native.links.openExternalURL(`https://www.leagueofgraphs.com/match/na/${cleanMatchId}`);
            }}
          >
            LeagueOfGraphs
          </Button>
        )}
        <div className="flex flex-row gap-2">
          {gameInfo.info.participants?.map((p) => (
            <div
              key={p.puuid}
              className={
                'flex flex-col items-center cursor-pointer border ' +
                (focusSummonerId === p.puuid ? 'border-green-500' : 'border-transparent')
              }
              onClick={() => {
                setFocusSummonerId(p.puuid);
              }}
            >
              <ChampIcon size={24} championId={p.championId} />
              <div className={'text-xs ' + (p.teamId === 100 ? 'text-green-400' : 'text-red-400')}>
                {p.riotIdGameName}
              </div>
            </div>
          ))}
        </div>
        <Button
          onClick={async () => {
            const didWin = gameInfo.info.teams?.find((t) => t.teamId === myTeamId)?.win;
            const title = `${gameInfo.info.participants?.[(myParticipantId || 0) - 1]?.championName} ${
              didWin ? 'W' : 'L'
            } ${new Date(gameInfo.info.gameCreation || '').toLocaleDateString()}`;

            if (config.appConfig.googleToken) {
              const vodPath =
                loaderData.type === 'activity' ? activityVod?.path : config.appConfig.vodStoragePath + '\\' + vod?.name;
              window.native.vods?.insertVod(config.appConfig.googleToken, vodPath || '', title, 'Test description');
            } else {
              alert('Not logged in!');
            }
          }}
        >
          UPLOAD
        </Button>
      </div>
      {noVodExists && <div>No video recorded for this match :( </div>}
      {activityVod && (
        <VodReview
          vod={loaderData.type === 'activity' ? activityVod?.path?.split('\\').pop() : vod?.name}
          created={loaderData.type === 'activity' ? activityInfo?.start?.timestamp : vod?.ended}
          matchId={matchId || (loaderData.type === 'activity' ? loaderData.activityId : '')}
          ended={loaderData.type === 'activity' ? activityInfo?.end?.timestamp : vod?.ended}
          summonerPuuid={focusSummonerId || myPart?.puuid}
        />
      )}
    </div>
  );
};
