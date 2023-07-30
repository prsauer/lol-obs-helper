import { useLoaderData, LoaderFunctionArgs, Link } from "react-router-dom";
import { VodReview } from "../components/VodReview";
import { useQuery } from "react-query";
import { getGameData } from "../proxy/riotApi";

export function reviewLoader({ params }: LoaderFunctionArgs) {
  return { id: params.id };
}

type VodInfo = {
  name: string;
  ended: string;
};

function getTimeFromVideoName(info: VodInfo) {
  const [dateStr, tm] = info.name.slice(0, info.name.length - 4).split(" ");
  const [year, month, day] = dateStr.split("-");
  const [hr, mn, sc] = tm.split("-");

  return {
    info,
    date: new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hr),
      parseInt(mn),
      parseInt(sc)
    ),
  };
}

function videoListToTimes(vods: VodInfo[]) {
  return vods.map(getTimeFromVideoName);
}

const VOD_OFFSET_THRESHOLD = 20000; // 20s

function maybeGetVod(vods: VodInfo[], gameCreationTime: number) {
  const times = videoListToTimes(vods);
  for (let i = 0; i < times.length; i++) {
    const time = times[i];
    console.log(Math.abs(time.date.getTime() - gameCreationTime));
    if (
      Math.abs(time.date.getTime() - gameCreationTime) < VOD_OFFSET_THRESHOLD
    ) {
      console.log("res", time);
      return time;
    }
  }
}

export const ReviewPage = () => {
  const { id } = useLoaderData() as ReturnType<typeof reviewLoader>;
  const videos = useQuery(`vod-list`, () =>
    window.native.vods?.getVodsInfo("D:\\Video")
  );

  console.log({ videos });

  const gamesQuery = useQuery(`game-${id}`, () => getGameData(id || "no-id"));

  const gameInfo = gamesQuery?.data?.data || null;

  console.log(gameInfo);

  let vod = null;
  if (videos?.data && gameInfo?.info?.gameCreation) {
    vod = maybeGetVod(videos.data, gameInfo?.info?.gameCreation);
  }
  console.log({ vod });

  return (
    <div>
      <div className="flex flex-row gap-2">
        <Link to={"/"}>Go Back</Link>
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
    </div>
  );
};
