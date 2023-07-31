import { useQuery } from "react-query";
import { getGamesForSummoner } from "../proxy/riotApi";
import { Button } from "../components/Button";
import { MatchStub } from "../components/MatchStub";
import { useAppConfig } from "../hooks/AppConfigContext";

export const IndexPage = () => {
  const videos = useQuery(`vod-list`, () =>
    window.native.vods?.getVodsInfo("D:\\Video")
  );
  const config = useAppConfig();
  const myId = config.appConfig.summonerId;
  const gamesQuery = useQuery(
    "games",
    () => getGamesForSummoner(myId || "no-id", 0, 10),
    {
      enabled: myId !== undefined,
    }
  );

  const games = gamesQuery?.data?.data;
  const err = gamesQuery?.data?.err;

  return (
    <div className="flex flex-col max-w-xl h-full">
      <div className="mb-2 flex flex-row gap-2 items-center">
        <Button linkTo="/setup">Setup</Button>
        <Button
          onClick={() => {
            gamesQuery.refetch();
          }}
        >
          Refresh
        </Button>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto pb-4">
        {gamesQuery.isLoading && <div>loading...</div>}
        {err && <pre>{err}</pre>}
        {games &&
          games.map((d) => (
            <Button key={d} linkTo={`vod/${d}`}>
              <MatchStub matchId={d} videos={videos.data} />
            </Button>
          ))}
      </div>
    </div>
  );
};
