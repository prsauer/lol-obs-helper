import { useQuery } from "react-query";
import { getGameData } from "../proxy/riotApi";

export const MatchStub = ({ matchId }: { matchId: string }) => {
  const myId =
    "GIXYzTG-5rkDdXoHtOWsKxB7cPG79VSFlXmP03t75iHWAongY7t4HDfLyxsksjINazSUTrUK9sjxBQ";
  const gamesQuery = useQuery(`game-${matchId}`, () =>
    getGameData(matchId || "no-id")
  );
  const game = gamesQuery.data?.data;
  const myPart = game?.info.participants.find((e) => e.puuid === myId);
  console.log({ game, myPart });
  const winnerId = game?.info.teams.filter((e) => e.win)[0].teamId;
  const didWin = myPart?.teamId === winnerId;
  return (
    <div className="flex flex-row gap-1 items-center">
      <div>
        <div className="flex flex-row">
          {game?.info.participants
            .filter((e) => e.teamId == 100)
            .map((e) => (
              <img
                key={e.puuid}
                className="h-8 w-8"
                src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${e?.championId}.png`}
              />
            ))}
        </div>
        <div className="flex flex-row">
          {game?.info.participants
            .filter((e) => e.teamId == 200)
            .map((e) => (
              <img
                key={e.puuid}
                className="h-8 w-8"
                src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${e?.championId}.png`}
              />
            ))}
        </div>
      </div>
      <img
        className="h-10 w-10"
        src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${myPart?.championId}.png`}
      />
      <div className="flex flex-col items-center">
        <div className="flex flex-row items-center gap-2">
          <div className="text-lg text-orange-500">
            {myPart?.kills}/{myPart?.assists}/{myPart?.deaths}
          </div>
          <div className={didWin ? "text-green-400" : "text-purple-700"}>
            {didWin ? "WIN" : "LOSS"}
          </div>
        </div>
        <div className="text-gray-500">
          {new Date(game?.info.gameCreation || 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
};
