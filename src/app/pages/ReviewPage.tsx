import { useLoaderData, LoaderFunctionArgs } from 'react-router-dom';
import { VodReview } from '../components/VodReview';
import { useQuery } from 'react-query';
import { getGameData } from '../proxy/riotApi';
import { Button } from '../components/Button';
import { maybeGetVod } from '../utils/vod';
import { useState } from 'react';
import { useAppConfig } from '../hooks/AppConfigContext';

export function reviewLoader({ params }: LoaderFunctionArgs) {
  return { id: params.id, summonerName: params.summonerName };
}

export const ReviewPage = () => {
  const config = useAppConfig();

  const { id, summonerName } = useLoaderData() as ReturnType<typeof reviewLoader>;

  const [focusSummonerId, setFocusSummonerId] = useState<string | null>(null);
  const videos = useQuery(`vod-list`, () => window.native.vods?.getVodsInfo('D:\\Video'));

  const gamesQuery = useQuery(`game-${id}`, () => getGameData(id || 'no-id'));
  console.log({ videos, games: gamesQuery.data });
  const gameInfo = gamesQuery?.data?.data || null;

  const myPart = gameInfo?.info.participants.find((e) => `${e.riotIdGameName}#${e.riotIdTagline}` === summonerName);
  console.log({ myPart, summonerName, gameInfo });
  const myParticipantId = myPart?.participantId;

  const myTeamId = gameInfo?.info.participants[myParticipantId || 0].teamId;

  let vod: ReturnType<typeof maybeGetVod> | null = null;
  if (videos?.data && gameInfo?.info?.gameCreation) {
    vod = maybeGetVod(videos.data, gameInfo?.info?.gameId);
  }
  console.log({ vod });

  const noVodExists = Boolean(!vod && gameInfo?.info.gameCreation);

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="flex flex-row gap-2 mb-2 items-center ">
        <Button linkTo="/">BACK</Button>
        <div>{id}</div>
        {gameInfo && <div>created: {new Date(gameInfo?.info?.gameCreation).toLocaleString()}</div>}
        {/* //https://u.gg/lol/profile/na1/spraypraylove-na1/overview */}
        <Button
          onClick={() => {
            window.native.links.openExternalURL(
              `https://u.gg/lol/profile/na1/${myPart?.riotIdGameName}-${myPart?.riotIdTagline}/overview`,
            );
          }}
        >
          {summonerName} at u.gg
        </Button>
        <Button linkTo={`/inspect/${id}`}>Inspect</Button>
        {gameInfo?.info.participants.map((p) => (
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
            const title = `${gameInfo?.info.participants[(myParticipantId || 0) - 1].championName} ${
              didWin ? 'W' : 'L'
            } ${new Date(gameInfo?.info.gameCreation || '').toLocaleDateString()}`;

            if (config.appConfig.googleToken) {
              window.native.vods?.insertVod(
                config.appConfig.googleToken,
                config.appConfig.vodStoragePath + '\\' + vod?.info.name,
                title,
                'Test description',
              );
            } else {
              alert('Not logged in!');
            }
          }}
        >
          UPLOAD
        </Button>
      </div>
      {noVodExists && <div>No video recorded for this match :( </div>}
      {vod && (
        <VodReview
          vod={vod?.info.name}
          created={vod?.startDatetime}
          matchId={id}
          ended={vod?.info.ended}
          summonerPuuid={focusSummonerId || myPart?.puuid}
        />
      )}
    </div>
  );
};
