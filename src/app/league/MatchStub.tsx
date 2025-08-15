import { useQuery } from '@tanstack/react-query';
import { getGameData } from '../proxy/riotApi';
import { ChampIcon } from './ChampIcon';
import { SummonerSpellIcon } from './SummonerSpellIcon';
import { RuneIcon } from './RuneIcon';

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
  const kda = ((myPart?.kills || 0) + (myPart?.assists || 0)) / Math.max(myPart?.deaths || 1, 1);

  return (
    <div className="flex flex-row gap-1">
      <div className="flex flex-col items-center justify-center text-sm px-2">
        <div className={(didWin ? 'text-win' : 'text-loss') + ' text-lg font-bold'}>{didWin ? 'WIN' : 'LOSS'}</div>
        <div className="text-gray-500 text-xs">{new Date(game?.info?.gameCreation || 0).toLocaleString()}</div>
        <div>
          {Math.floor((game.info?.gameDuration || 0) / 60)}:
          {String((game.info?.gameDuration || 0) % 60).padStart(2, '0')}
        </div>
      </div>
      <ChampIcon championId={myPart?.championId} size={96} />
      <div className="flex flex-col gap-1">
        {myPart && (
          <>
            <SummonerSpellIcon spellId={myPart.summoner1Id} size={20} />
            <SummonerSpellIcon spellId={myPart.summoner2Id} size={20} />
          </>
        )}
        {myPart?.perks?.styles?.[0]?.selections?.[0] && (
          <RuneIcon runeId={myPart.perks.styles[0].selections[0].perk} size={20} showTitle={true} />
        )}
        {myPart?.perks?.styles?.[1] && <RuneIcon runeId={myPart.perks.styles[1].style} size={20} showTitle={true} />}
      </div>
      <div>
        <div className="flex flex-row">
          {participants
            .filter((e) => e.teamId == 100)
            .map((e) => (
              <ChampIcon key={e.puuid} championId={e?.championId} size={48} />
            ))}
        </div>
        <div className="flex flex-row">
          {participants
            .filter((e) => e.teamId == 200)
            .map((e) => (
              <ChampIcon key={e.puuid} championId={e?.championId} size={48} />
            ))}
        </div>
      </div>
      <div className="flex flex-col" id="personal-stats">
        <div className="flex flex-row items-center gap-2">
          <div className="text-lg text-orange-500">
            {myPart?.kills}/{myPart?.deaths}/{myPart?.assists} <span className="text-gray-500">({kda.toFixed(1)})</span>
          </div>
        </div>
        {myPart && (
          <div className="flex flex-col text-sm text-gray-300 gap-1">
            <div>
              {(myPart.totalMinionsKilled || 0) + (myPart.neutralMinionsKilled || 0)} CS (
              {(
                ((myPart.totalMinionsKilled || 0) + (myPart.neutralMinionsKilled || 0)) /
                Math.max((game.info?.gameDuration || 1) / 60, 1)
              ).toFixed(1)}
              )
            </div>
            <div>{myPart.visionScore} vision</div>
          </div>
        )}
      </div>
    </div>
  );
};
