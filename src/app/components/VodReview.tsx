import { MouseEvent, useCallback, useEffect, useRef } from "react";
import { getGameData, getGameTimeline } from "../proxy/riotApi";
import { useQuery } from "react-query";
import { EventStub } from "./EventStub";
import { EventTimelineIcon } from "./EventTimelineIcon";

const KILL_UNDERCUT_TIME = 10;

export const VodReview = ({
  vod,
  matchId,
  created,
  ended,
  summonerPuuid,
}: {
  summonerPuuid: string | undefined;
  vod: string | undefined;
  matchId: string | undefined;
  created: Date | undefined;
  ended: string | undefined;
}) => {
  const vidRef = useRef<HTMLVideoElement>(null);
  const progressBar = useRef<HTMLProgressElement>(null);
  const gameTimelineQuery = useQuery(`game-timeline-${matchId}`, () =>
    getGameTimeline(matchId || "no-id")
  );
  const gamesQuery = useQuery(`game-${matchId}`, () =>
    getGameData(matchId || "no-id")
  );
  const myId = summonerPuuid; //summonerQuery.data?.data?.puuid;

  const myParticipantId = gameTimelineQuery.data?.data?.info.participants.find(
    (p) => p.puuid === myId
  )?.participantId;

  const gameInfo = gamesQuery.data?.data?.info;

  const vodStartTime = created;
  const vodEndTime = ended ? new Date(ended) : null;
  const vodDuration =
    vodStartTime && vodEndTime
      ? vodEndTime.getTime() - vodStartTime.getTime()
      : 1;

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
    if (
      evt.type === "CHAMPION_KILL" &&
      myParticipantId &&
      evt.assistingParticipantIds?.includes(myParticipantId)
    ) {
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
          timeCorrectionMs
      ).getTime() -
        vodStartTime.getTime()) /
      1000
    );
  };

  const progressBarClick = useCallback(
    (e: MouseEvent<HTMLProgressElement>) => {
      if (!vidRef.current) return;
      if (!progressBar.current) return;
      const pos =
        (e.pageX - progressBar.current.offsetLeft) /
        progressBar.current.offsetWidth;
      vidRef.current.currentTime = pos * vidRef.current.duration;
    },
    [progressBar.current, vidRef.current]
  );

  const progressBarDrag = useCallback(
    (e: MouseEvent<HTMLProgressElement>) => {
      if (!vidRef.current) return;
      if (!progressBar.current) return;
      if (!(e.buttons === 1)) return;
      const pos =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((e as unknown as any).pageX - progressBar.current.offsetLeft) /
        progressBar.current.offsetWidth;
      vidRef.current.currentTime = pos * vidRef.current.duration;
    },
    [progressBar.current, vidRef.current]
  );

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    if (vidRef.current && progressBar.current) {
      vidRef.current.addEventListener(
        "timeupdate",
        () => {
          if (!progressBar.current) return;
          if (!vidRef.current) return;
          // For mobile browsers, ensure that the progress element's max attribute is set
          if (!progressBar.current.getAttribute("max")) {
            progressBar.current.setAttribute(
              "max",
              vidRef.current.duration.toString()
            );
          }
          progressBar.current.value = vidRef.current.currentTime;
          // progressBar.current.style.width =
          //   Math.floor(
          //     (vidRef.current.currentTime / vidRef.current.duration) * 100
          //   ) + "%";
        },
        {
          signal,
        }
      );
    }

    return () => {
      controller.abort();
    };
  }, [vidRef.current, progressBar.current]);

  return (
    <div className="flex-1 flex flex-row gap-2 overflow-auto">
      <div className="flex flex-col gap-1 min-w-[125px] overflow-y-auto text-sm">
        {importantEvents?.map((evt) => {
          return (
            <EventStub
              key={evt.timestamp}
              participants={gameInfo.participants}
              event={evt}
              myParticipantId={myParticipantId}
              onClick={(ts) => {
                if (vidRef.current) {
                  vidRef.current.currentTime = ts - KILL_UNDERCUT_TIME;
                }
              }}
              timeConverter={timeConvert}
            />
          );
        })}
      </div>
      {vod && (
        <figure id="videoContainer" data-fullscreen="false" className="flex-1">
          <video
            controls
            id="video"
            ref={vidRef}
            src={`vod://${vod}`}
            style={{
              margin: "auto",
              height: "93%",
              flex: 1,
              objectFit: "contain",
              minWidth: 0,
            }}
          />
          <div
            id="video-controls"
            className="controls w-full "
            data-state="hidden"
          >
            <div className="progress w-full ">
              <progress
                ref={progressBar}
                onClick={progressBarClick}
                onMouseMove={progressBarDrag}
                className="w-full"
                id="progress"
                value="0"
              >
                <span id="progress-bar"></span>
              </progress>
              <div className="flex flex-row relative bg-black mr-1">
                {importantEvents?.map((e) => {
                  return (
                    <EventTimelineIcon
                      event={e}
                      participants={gameInfo.participants}
                      myParticipantId={myParticipantId}
                      key={e.timestamp}
                      left={`${
                        (100 * 1000 * timeConvert(e.timestamp)) / vodDuration
                      }%`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </figure>
      )}
    </div>
  );
};
