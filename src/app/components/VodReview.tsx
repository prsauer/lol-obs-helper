import React, { useRef } from "react";
import { getGameData, getGameTimeline } from "../proxy/riotApi";
import { useQuery } from "react-query";
import { Event, MatchParticipant } from "../proxy/types";
import { ChampIcon } from "./ChampIcon";

const KILL_UNDERCUT_TIME = 10000;

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

const EventStub = ({
  participants,
  event,
  myParticipantId,
  onClick,
  timeConverter,
}: {
  participants: MatchParticipant[];
  event: Event;
  myParticipantId: number | undefined;
  onClick: (ts: number) => void;
  timeConverter: (ts: number) => number;
}) => {
  if (event.type === "CHAMPION_KILL" && event.killerId === myParticipantId) {
    console.log({ event, participants });
    return (
      <div
        className="text-green-400 cursor-pointer flex flex-row gap-1"
        onClick={() => onClick(timeConverter(event.timestamp))}
      >
        Kill: {secondsToMinutesString(timeConverter(event.timestamp))}{" "}
        <ChampIcon
          size={20}
          championId={participants[(event.victimId || 0) - 1].championId}
        />
      </div>
    );
  }
  if (event.type === "CHAMPION_KILL" && event.victimId === myParticipantId) {
    return (
      <div
        className="text-purple-400 font-bold cursor-pointer"
        onClick={() => onClick(timeConverter(event.timestamp))}
      >
        Death: {secondsToMinutesString(timeConverter(event.timestamp))}
      </div>
    );
  }
  if (event.type === "ELITE_MONSTER_KILL") {
    const myKill = event.killerId === myParticipantId;
    return (
      <div
        onClick={() => onClick(timeConverter(event.timestamp))}
        className={
          myKill
            ? "text-green-400 cursor-pointer"
            : "text-purple-400 cursor-pointer"
        }
      >
        {MONSTER_NAMES[event.monsterType || "none"]}{" "}
        {secondsToMinutesString(timeConverter(event.timestamp))}
      </div>
    );
  }
  return <div>{event.type}</div>;
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

  const eliteMobEvts = allEvts?.filter((e) => e.type === "ELITE_MONSTER_KILL");
  console.log({
    eliteMobEvts,
  });

  const importantEvents = allEvts?.filter((evt) => {
    if (evt.type === "ELITE_MONSTER_KILL") {
      return true;
    }
    if (evt.type === "CHAMPION_KILL" && evt.killerId === myParticipantId) {
      return true;
    }
    if (evt.type === "CHAMPION_KILL" && evt.victimId === myParticipantId) {
      return true;
    }
    return false;
  });

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

  return (
    <div className="flex flex-row gap-2">
      <div className="flex flex-col gap-1">
        {importantEvents?.map((evt) => {
          return (
            <EventStub
              key={evt.timestamp}
              participants={gameInfo.participants}
              event={evt}
              myParticipantId={myParticipantId}
              onClick={(ts) => {
                console.log(`click ${vidRef.current}`);
                if (vidRef.current) {
                  vidRef.current.currentTime = ts;
                }
              }}
              timeConverter={timeConvert}
            />
          );
        })}
      </div>
      {vod && (
        <video
          ref={vidRef}
          src={`vod://${vod}`}
          controls
          style={{
            width: "85%",
            objectFit: "contain",
          }}
        />
      )}
    </div>
  );
};
