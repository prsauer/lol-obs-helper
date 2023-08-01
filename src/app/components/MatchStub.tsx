import { useQuery } from "react-query";
import { getGameData, getSummonerByName } from "../proxy/riotApi";
import { maybeGetVod } from "../utils/vod";
import { ChampIcon } from "./ChampIcon";

export const MatchStub = ({
  matchId,
  videos,
  summonerName,
}: {
  matchId: string;
  summonerName?: string;
  videos?: {
    name: string;
    ended: string;
  }[];
}) => {
  const gamesQuery = useQuery(`game-${matchId}`, () =>
    getGameData(matchId || "no-id")
  );
  const summonerQuery = useQuery(
    `sum-${summonerName}`,
    () => getSummonerByName(summonerName || "no-name"),
    {
      enabled: Boolean(summonerName),
    }
  );

  const myPuuid = summonerQuery.data?.data?.puuid;

  const game = gamesQuery.data?.data;
  const myPart = game?.info.participants.find((e) => e.puuid === myPuuid);
  console.log({
    game: game?.info.participants,
    summonerQuery,
  });
  const winnerId = game?.info.teams.filter((e) => e.win)[0].teamId;
  const didWin = myPart?.teamId === winnerId;

  let vod = null;
  if (videos && game?.info?.gameCreation) {
    vod = maybeGetVod(videos, game?.info?.gameCreation);
  }

  return (
    <div className="flex flex-row gap-1 items-center">
      <div>
        <div className="flex flex-row">
          {game?.info.participants
            .filter((e) => e.teamId == 100)
            .map((e) => (
              <ChampIcon key={e.puuid} championId={e?.championId} size={32} />
            ))}
        </div>
        <div className="flex flex-row">
          {game?.info.participants
            .filter((e) => e.teamId == 200)
            .map((e) => (
              <ChampIcon key={e.puuid} championId={e?.championId} size={32} />
            ))}
        </div>
      </div>
      <ChampIcon championId={myPart?.championId} size={64} />
      <div className="flex flex-col items-center">
        <div className="flex flex-row items-center gap-2">
          <div className="text-lg text-orange-500">
            {myPart?.kills}/{myPart?.assists}/{myPart?.deaths}
          </div>
          <div className={didWin ? "text-green-400" : "text-purple-700"}>
            {didWin ? "WIN" : "LOSS"}
          </div>
        </div>
        <div>{summonerName}</div>
        <div className="text-gray-500">
          {new Date(game?.info.gameCreation || 0).toLocaleString()}
        </div>
      </div>
      {vod && <div className="text-[2em]">&#128249;</div>}
    </div>
  );
};
