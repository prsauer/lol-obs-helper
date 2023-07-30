import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { getGamesForSummoner } from "../proxy/riotApi";

export const IndexPage = () => {
  const gamesQuery = useQuery("games", () =>
    getGamesForSummoner(
      "GIXYzTG-5rkDdXoHtOWsKxB7cPG79VSFlXmP03t75iHWAongY7t4HDfLyxsksjINazSUTrUK9sjxBQ",
      0,
      3
    )
  );

  const games = gamesQuery?.data?.data;
  const err = gamesQuery?.data?.err;

  return (
    <div>
      <div>
        {gamesQuery.isLoading && <div>loading...</div>}
        {err && <pre>{err}</pre>}
        {games &&
          games.map((d) => (
            <div key={d}>
              <Link to={`vod/${d}`}>Match {d}</Link>
            </div>
          ))}
      </div>
    </div>
  );
};
