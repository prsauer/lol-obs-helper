import { useQuery } from '@tanstack/react-query';
import { getGameData } from '../proxy/riotApi';
import { ChampIcon } from './ChampIcon';

export const MatchStub = ({ matchId, summonerName }: { matchId: string; summonerName?: string }) => {
  const gamesQuery = useQuery({ queryKey: ['game-data', { match: matchId }], queryFn: () => getGameData(matchId) });
  const myPart = gamesQuery.data?.data?.info?.participants?.find(
    (e) => `${e.riotIdGameName}#${e.riotIdTagline}` === summonerName,
  );

  const game = gamesQuery.data?.data;
  const participants = game?.info?.participants || [];

  const winnerId = game?.info ? game?.info.teams.filter((e) => e.win)[0].teamId : null;
  const didWin = myPart?.teamId === winnerId;

  return (
    <div className="flex flex-row gap-1 items-center">
      <div>
        <div className="flex flex-row">
          {participants
            .filter((e) => e.teamId == 100)
            .map((e) => (
              <ChampIcon key={e.puuid} championId={e?.championId} size={32} />
            ))}
        </div>
        <div className="flex flex-row">
          {participants
            .filter((e) => e.teamId == 200)
            .map((e) => (
              <ChampIcon key={e.puuid} championId={e?.championId} size={32} />
            ))}
        </div>
      </div>
      <ChampIcon championId={myPart?.championId} size={64} />
      <div className="flex flex-col items-start">
        <div className="flex flex-row items-center gap-2">
          <div className="text-lg text-orange-500">
            {myPart?.kills}/{myPart?.deaths}/{myPart?.assists}
          </div>
          <div className={didWin ? 'text-green-400' : 'text-purple-700'}>{didWin ? 'WIN' : 'LOSS'}</div>
        </div>
        <div>{summonerName}</div>
        <div className="text-gray-500">{new Date(game?.info?.gameCreation || 0).toLocaleString()}</div>
      </div>
    </div>
  );
};
