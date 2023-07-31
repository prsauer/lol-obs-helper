import { useLoaderData, LoaderFunctionArgs } from "react-router-dom";
import { VodReview } from "../components/VodReview";
import { useQuery } from "react-query";
import { getGameData } from "../proxy/riotApi";
import { Button } from "../components/Button";
import { maybeGetVod } from "../utils/vod";

export function reviewLoader({ params }: LoaderFunctionArgs) {
  return { id: params.id };
}

export const ReviewPage = () => {
  const { id } = useLoaderData() as ReturnType<typeof reviewLoader>;
  const videos = useQuery(`vod-list`, () =>
    window.native.vods?.getVodsInfo("D:\\Video")
  );

  const gamesQuery = useQuery(`game-${id}`, () => getGameData(id || "no-id"));

  const gameInfo = gamesQuery?.data?.data || null;

  let vod = null;
  if (videos?.data && gameInfo?.info?.gameCreation) {
    vod = maybeGetVod(videos.data, gameInfo?.info?.gameCreation);
  }

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
      </div>
      <VodReview
        vod={vod?.info.name}
        created={vod?.date}
        matchId={id}
        ended={vod?.info.ended}
      />
    </>
  );
};
