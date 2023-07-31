import { useQuery } from "react-query";
import { getGamesForSummoner } from "../proxy/riotApi";
import { Button } from "../components/Button";
import { MatchStub } from "../components/MatchStub";

export const IndexPage = () => {
  const gamesQuery = useQuery("games", () =>
    getGamesForSummoner(
      "GIXYzTG-5rkDdXoHtOWsKxB7cPG79VSFlXmP03t75iHWAongY7t4HDfLyxsksjINazSUTrUK9sjxBQ",
      0,
      5
    )
  );

  const games = gamesQuery?.data?.data;
  const err = gamesQuery?.data?.err;

  return (
    <div className="max-w-xl">
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

      <div className="flex flex-col gap-2">
        {gamesQuery.isLoading && <div>loading...</div>}
        {err && <pre>{err}</pre>}
        {games &&
          games.map((d) => (
            <Button key={d} linkTo={`vod/${d}`}>
              <MatchStub matchId={d} />
            </Button>
          ))}
      </div>
    </div>
  );
};
