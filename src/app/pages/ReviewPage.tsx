import { useLoaderData, LoaderFunctionArgs } from 'react-router-dom';
import { VodReview } from '../components/VodReview';
import { useQuery } from '@tanstack/react-query';
import { getGameData } from '../proxy/riotApi';
import { Button } from '../components/Button';
import { maybeGetVod } from '../utils/vod';
import { useState } from 'react';
import { useAppConfig } from '../hooks/AppConfigContext';

const toDate = (value: string | number | Date | undefined): Date | null => {
  if (value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  return new Date(value);
};

export function reviewLoader({ params }: LoaderFunctionArgs) {
  return { id: params.id, summonerName: params.summonerName, type: 'match' as const };
}

export function activityReviewLoader({ params }: LoaderFunctionArgs) {
  return { activityId: params.activityId, type: 'activity' as const };
}

export const ReviewPage = () => {
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
  let activityVodPath: string | undefined;
  let resolvedMatch: { matchKey: string; summonerName?: string } | undefined;

  if (loaderData.type === 'activity' && activities.data) {
    const activity = activities.data.find((rec) => {
      const activityId =
        rec.recording?.activityId || rec.start?.activityId || rec.end?.activityId || `${rec.timestamp}`;
      return activityId === loaderData.activityId;
    });

    if (activity && activity.recording?.filename) {
      activityInfo = activity;
      activityVodPath = activity.recording.filename;

      // Use riotGameId from metadata if available, otherwise fall back to time-based matching
      const riotGameId = activity.end?.metadata?.riotGameId || activity.recording?.metadata?.riotGameId;

      if (riotGameId) {
        console.log('Found riotGameId in activity metadata:', riotGameId);
        // Try to find matching game in localMatches by gameId
        const matchingGame = localMatches.data?.find(
          (match) =>
            match.matchId === riotGameId ||
            match.matchId === `NA1_${riotGameId}` ||
            `${match.platformId}_${match.matchId}`.includes(riotGameId),
        );

        if (matchingGame) {
          resolvedMatch = {
            matchKey: `${matchingGame.platformId}_${matchingGame.matchId}`,
            summonerName: matchingGame.summonerName,
          };
          console.log('Resolved match using riotGameId:', resolvedMatch);
        } else {
          // Use the riotGameId directly with NA1 platform (most common)
          resolvedMatch = {
            matchKey: `NA1_${riotGameId}`,
            summonerName: undefined,
          };
          console.log('Using riotGameId directly:', resolvedMatch);
        }
      } else {
        // Fall back to time-based matching logic
        const game = activity.start?.game || activity.end?.game || activity.recording?.metadata?.game || '';
        const isLeague = game === 'league-of-legends';

        if (isLeague && localMatches.data && localMatches.data.length > 0) {
          const startedAt = toDate(activity.start?.timestamp);
          const endedAt = toDate(activity.end?.timestamp);
          const startMs = startedAt?.getTime();
          const endMs = endedAt?.getTime();
          const anchor = (endMs ?? startMs ?? activity.timestamp) as number;

          const windowMin = (startMs ?? anchor) - 30 * 60 * 1000;
          const windowMax = (endMs ?? anchor) + 30 * 60 * 1000;

          const candidates = localMatches.data.filter((m) => m.createdTime >= windowMin && m.createdTime <= windowMax);
          const best = (candidates.length > 0 ? candidates : localMatches.data)
            .map((m) => ({ m, d: Math.abs(m.createdTime - anchor) }))
            .sort((a, b) => a.d - b.d)[0]?.m;

          if (best?.platformId && best?.matchId) {
            resolvedMatch = {
              matchKey: `${best.platformId}_${best.matchId}`,
              summonerName: best.summonerName,
            };
          }
        }
      }
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

  const myPart = gameInfo?.info.participants?.find((e) => `${e.riotIdGameName}#${e.riotIdTagline}` === summonerName);
  const myParticipantId = myPart?.participantId;
  const myTeamId = gameInfo?.info.participants?.[myParticipantId || 0].teamId;

  // Set the VOD based on the loading type
  let vod: ReturnType<typeof maybeGetVod> | null = null;
  let activityVod: { path: string } | null = null;

  if (loaderData.type === 'activity') {
    activityVod = activityVodPath ? { path: activityVodPath } : null;
  } else if (videos?.data && gameInfo) {
    vod = maybeGetVod(videos.data, gameInfo);
  }

  const noVodExists = Boolean(
    (loaderData.type === 'activity' ? !activityVod : !vod) &&
      (loaderData.type === 'activity' ? activityInfo && activityInfo.recording?.filename : gameInfo?.info.gameCreation),
  );

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="flex flex-row gap-2 mb-2 items-center ">
        <Button linkTo={loaderData.type === 'activity' ? '/activities' : '/'}>BACK</Button>
        <div>{loaderData.type === 'activity' ? `Activity: ${loaderData.activityId}` : matchId}</div>

        {loaderData.type === 'activity' && activityInfo && (
          <>
            {activityInfo.start?.timestamp && (
              <div>started: {new Date(activityInfo.start.timestamp).toLocaleString()}</div>
            )}
            {activityInfo.recording?.filename && <div>file: {activityInfo.recording.filename}</div>}
          </>
        )}

        {gameInfo && <div>created: {new Date(gameInfo?.info?.gameCreation).toLocaleString()}</div>}
        {myPart && (
          <Button
            onClick={() => {
              window.native.links.openExternalURL(
                `https://u.gg/lol/profile/na1/${myPart?.riotIdGameName}-${myPart?.riotIdTagline}/overview`,
              );
            }}
          >
            {summonerName} at u.gg
          </Button>
        )}
        {matchId && <Button linkTo={`/inspect/${matchId}`}>Inspect</Button>}
        {gameInfo?.info.participants?.map((p) => (
          <div
            key={p.puuid}
            onClick={() => {
              setFocusSummonerId(p.puuid);
            }}
          >
            {p.championName}
          </div>
        ))}
        <Button
          onClick={async () => {
            const didWin = gameInfo?.info.teams.find((t) => t.teamId === myTeamId)?.win;
            const title = `${gameInfo?.info.participants?.[(myParticipantId || 0) - 1].championName} ${
              didWin ? 'W' : 'L'
            } ${new Date(gameInfo?.info.gameCreation || '').toLocaleDateString()}`;

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
      {(vod || activityVod) && (
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
