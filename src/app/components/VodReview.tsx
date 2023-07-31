import React, { useRef } from "react";
import { getGameData, getGameTimeline } from "../proxy/riotApi";
import { useQuery } from "react-query";

const KILL_UNDERCUT_TIME = 8000;

const secondsToMinutesString = (secs: number) => {
  if (secs <= 60) {
    return `${secs}s`;
  }
  const mins = Math.floor(secs / 60);
  const secondsRemaining = secs - mins * 60;
  return `${mins}:${secondsRemaining < 10 ? "0" : ""}${secondsRemaining.toFixed(
    0
  )}`;
};

const MONSTER_NAMES: Record<string, string> = {
  none: "Unknown",
  DRAGON: "Drag",
  RIFTHERALD: "Rift",
  BARON_NASHOR: "Baron",
};

export const VodReview = ({
  vod,
  matchId,
  created,
  ended,
}: {
  vod: string | undefined;
  matchId: string | undefined;
  created: Date | undefined;
  ended: string | undefined;
}) => {
  const vidRef = useRef<HTMLVideoElement>(null);
  const gameTimelineQuery = useQuery(`game-timeline-${matchId}`, () =>
    getGameTimeline(matchId || "no-id")
  );
  const gamesQuery = useQuery(`game-${matchId}`, () =>
    getGameData(matchId || "no-id")
  );

  const myId =
    "GIXYzTG-5rkDdXoHtOWsKxB7cPG79VSFlXmP03t75iHWAongY7t4HDfLyxsksjINazSUTrUK9sjxBQ";
  const myParticipantId = gameTimelineQuery.data?.data?.info.participants.find(
    (p) => p.puuid === myId
  )?.participantId;

  const gameInfo = gamesQuery.data?.data?.info;

  const myPart = gameInfo?.participants.find((e) => e.puuid === myId);

  const vodStartTime = created;
  const vodEndTime = ended ? new Date(ended) : null;

  if (!gameInfo || !vodEndTime || !vodStartTime) {
    return <div>loading</div>;
  }

  const gameEndTime = new Date(gameInfo?.gameEndTimestamp);

  const gameStartConvert = new Date(
    gameEndTime.getTime() - gameInfo?.gameDuration * 1000
  );

  const timeCorrectionMs = gameEndTime.getTime() - vodEndTime.getTime();

  const vodStartOffset =
    gameStartConvert.getTime() - vodStartTime.getTime() - timeCorrectionMs;

  const allEvts = gameTimelineQuery.data?.data?.info.frames
    .map((e) => e.events)
    .flat();
  const killEvts = allEvts?.filter((e) => e.type === "CHAMPION_KILL");

  const eliteMobEvts = allEvts?.filter((e) => e.type === "ELITE_MONSTER_KILL");
  console.log({
    eliteMobEvts,
  });
  const myKills = killEvts?.filter((e) => e.killerId === myParticipantId);
  const myDeaths = killEvts?.filter((e) => e.victimId === myParticipantId);

  const timeConvert = (eventTimestamp: number) => {
    return (
      (new Date(
        eventTimestamp +
          gameInfo?.gameCreation +
          vodStartOffset -
          timeCorrectionMs -
          KILL_UNDERCUT_TIME
      ).getTime() -
        vodStartTime.getTime()) /
      1000
    );
  };

  const deathTimes = myDeaths?.map(
    (e) =>
      (new Date(
        e.timestamp +
          gameInfo?.gameCreation +
          vodStartOffset -
          timeCorrectionMs -
          KILL_UNDERCUT_TIME
      ).getTime() -
        vodStartTime.getTime()) /
      1000
  );

  const killTimes = myKills?.map(
    (e) =>
      (new Date(
        e.timestamp +
          gameInfo?.gameCreation +
          vodStartOffset -
          timeCorrectionMs -
          KILL_UNDERCUT_TIME
      ).getTime() -
        vodStartTime.getTime()) /
      1000
  );
  console.log({ gameInfo, myKills, myDeaths, killTimes });
  console.log({
    kills: killTimes?.map(secondsToMinutesString),
  });

  return (
    <div className="flex flex-row gap-2">
      <div>
        {killTimes &&
          killTimes.map((k) => (
            <div
              className="text-green-200"
              key={k}
              onClick={() => {
                console.log(`click ${vidRef.current}`);
                if (vidRef.current) {
                  vidRef.current.currentTime = k;
                  console.log(`set ${vidRef.current.currentTime} ${k}`);
                }
              }}
            >
              Kill: {secondsToMinutesString(k)}
            </div>
          ))}
        {deathTimes &&
          deathTimes.map((d) => (
            <div
              className="text-purple-400"
              key={d}
              onClick={() => {
                console.log(`click ${vidRef.current}`);
                if (vidRef.current) {
                  vidRef.current.currentTime = d;
                  console.log(`set ${vidRef.current.currentTime} ${d}`);
                }
              }}
            >
              Death: {secondsToMinutesString(d)}
            </div>
          ))}
        {eliteMobEvts?.map((evt) => {
          const myKill = evt.killerTeamId == myPart?.teamId;
          return (
            <div
              className={myKill ? "text-green-400" : "text-purple-400"}
              key={evt.timestamp}
              onClick={() => {
                if (vidRef.current) {
                  const timelineTime = timeConvert(evt.timestamp);

                  vidRef.current.currentTime = timelineTime;
                  console.log(
                    `set ${vidRef.current.currentTime} ${timelineTime}`
                  );
                }
              }}
            >
              {MONSTER_NAMES[evt.monsterType || "none"]}{" "}
              {secondsToMinutesString(timeConvert(evt.timestamp))}
            </div>
          );
        })}
      </div>
      {vod && (
        <video
          className="flex-1"
          ref={vidRef}
          src={`vod://${vod}`}
          controls
          style={{
            width: "100%",
            objectFit: "contain",
          }}
        />
      )}
    </div>
  );
};
