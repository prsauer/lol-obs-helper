import { useQuery } from '@tanstack/react-query';
import { getGameData } from '../proxy/riotApi';
import { ChampIcon } from './ChampIcon';

export const MatchStub = ({ matchId, summonerName }: { matchId: string; summonerName?: string }) => {
  const gamesQuery = useQuery({ queryKey: ['game-data', { match: matchId }], queryFn: () => getGameData(matchId) });

  if (gamesQuery.isLoading) {
    return (
      <div className="flex flex-row gap-1 items-center animate-pulse">
        <div className="w-16 h-16 bg-gray-500/50"></div>
        <div>
          <div className="flex flex-row">
            <div className="w-8 h-8 bg-gray-500/50"></div>
            <div className="w-8 h-8 bg-gray-500/50"></div>
            <div className="w-8 h-8 bg-gray-500/50"></div>
            <div className="w-8 h-8 bg-gray-500/50"></div>
            <div className="w-8 h-8 bg-gray-500/50"></div>
          </div>
          <div className="flex flex-row">
            <div className="w-8 h-8 bg-gray-500/50"></div>
            <div className="w-8 h-8 bg-gray-500/50"></div>
            <div className="w-8 h-8 bg-gray-500/50"></div>
            <div className="w-8 h-8 bg-gray-500/50"></div>
            <div className="w-8 h-8 bg-gray-500/50"></div>
          </div>
        </div>
        <div className="flex flex-col items-start">
          <div className="flex flex-row items-center gap-2">
            <div className="text-lg bg-gray-500/50 text-transparent">0/0/0</div>
            <div className="bg-gray-500/50 text-transparent">WIN</div>
          </div>
          <div className="bg-gray-500/50 text-transparent">{summonerName || 'Summoner Name'}</div>
          <div className="bg-gray-500/50 text-transparent">1/1/2024, 12:00:00 PM</div>
        </div>
      </div>
    );
  }

  if (!gamesQuery.data?.data || 'httpStatus' in gamesQuery.data.data) {
    return (
      <div className="flex flex-row gap-1 items-center">
        <div className="flex flex-col items-start">
          <div className="text-lg text-gray-400">Match unavailable (404)</div>
          <div>{summonerName}</div>
          <div className="text-gray-500">Match ID: {matchId}</div>
        </div>
      </div>
    );
  }

  const game = gamesQuery.data.data;
  const myPart = game.info?.participants?.find((e) => `${e.riotIdGameName}#${e.riotIdTagline}` === summonerName);

  const participants = game.info?.participants || [];

  const winnerId = game.info ? game.info.teams.filter((e) => e.win)[0].teamId : null;
  const didWin = myPart?.teamId === winnerId;

  return (
    <div className="flex flex-row gap-1 items-center bg-red-50">
      <ChampIcon championId={myPart?.championId} size={64} />
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
