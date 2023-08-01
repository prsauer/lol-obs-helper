import { useLoaderData, LoaderFunctionArgs } from "react-router-dom";
import { VodReview } from "../components/VodReview";
import { useQuery } from "react-query";
import { getGameData, getSummonerByName } from "../proxy/riotApi";
import { Button } from "../components/Button";
import { maybeGetVod } from "../utils/vod";

export function reviewLoader({ params }: LoaderFunctionArgs) {
  return { id: params.id, summonerName: params.summonerName };
}

export const ReviewPage = () => {
  const { id, summonerName } = useLoaderData() as ReturnType<
    typeof reviewLoader
  >;
  const summonerQuery = useQuery(
    `sum-${summonerName}`,
    () => getSummonerByName(summonerName || "no-name"),
    {
      enabled: Boolean(summonerName),
    }
  );
  const videos = useQuery(`vod-list`, () =>
    window.native.vods?.getVodsInfo("D:\\Video")
  );

  const gamesQuery = useQuery(`game-${id}`, () => getGameData(id || "no-id"));

  const gameInfo = gamesQuery?.data?.data || null;

  let vod = null;
  if (videos?.data && gameInfo?.info?.gameCreation) {
    vod = maybeGetVod(videos.data, gameInfo?.info?.gameCreation);
  }

  const noVodExists = Boolean(!vod && gameInfo?.info.gameCreation);

  return (
    <>
      <div className="flex flex-row gap-2 mb-2 items-center">
        <Button linkTo="/">BACK</Button>
        <div>{id}</div>
        {gameInfo && (
          <div>
            created: {new Date(gameInfo?.info?.gameCreation).toLocaleString()}
          </div>
        )}
        <Button
          onClick={() => {
            window.native.links.openExternalURL(
              `https://u.gg/lol/profile/na1/${summonerQuery.data?.data?.name}/overview`
            );
          }}
        >
          {summonerQuery.data?.data?.name} at u.gg
        </Button>
      </div>
      {noVodExists && <div>No video recorded for this match :( </div>}
      {vod && (
        <VodReview
          vod={vod?.info.name}
          created={vod?.date}
          matchId={id}
          ended={vod?.info.ended}
          summonerPuuid={summonerQuery.data?.data?.puuid}
        />
      )}
    </>
  );
};
