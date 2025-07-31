import { KeyboardEvent, useCallback, useEffect, useRef } from 'react';
import { getGameData, getGameTimeline } from '../proxy/riotApi';
import { useQuery } from 'react-query';
import { EventStub } from './EventStub';

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
  ended: Date | undefined;
}) => {
  const vidRef = useRef<HTMLVideoElement>(null);
  const progressBar = useRef<HTMLProgressElement>(null);
  const gameTimelineQuery = useQuery(`game-timeline-${matchId}`, () => getGameTimeline(matchId || 'no-id'));
  const gamesQuery = useQuery(`game-${matchId}`, () => getGameData(matchId || 'no-id'));
  const myId = summonerPuuid; //summonerQuery.data?.data?.puuid;

  const myParticipantId = gameTimelineQuery.data?.data?.info.participants.find((p) => p.puuid === myId)?.participantId;

  const gameInfo = gamesQuery.data?.data?.info;

  const vodStartTime = created;
  console.log({ created, ended });
  const vodEndTime = ended;

  if (!gameInfo || !vodEndTime || !vodStartTime) {
    return <div>loading</div>;
  }

  const myTeamId = myParticipantId ? gameInfo.participants?.[myParticipantId]?.teamId : -1;

  const allEvts = gameTimelineQuery.data?.data?.info.frames.map((e) => e.events).flat();

  const importantEvents = allEvts?.filter((evt) => {
    if (evt.type === 'ELITE_MONSTER_KILL') {
      return true;
    }
    if (evt.type === 'CHAMPION_KILL' && evt.killerId === myParticipantId) {
      return true;
    }
    if (evt.type === 'CHAMPION_KILL' && evt.victimId === myParticipantId) {
      return true;
    }
    if (evt.type === 'CHAMPION_KILL' && myParticipantId && evt.assistingParticipantIds?.includes(myParticipantId)) {
      return true;
    }
    return false;
  });

  console.log({ importantEvents });
  const timeConvert = (eventTimestamp: number) => {
    return eventTimestamp / 1000;
  };

  const setWhileHeld = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (!vidRef.current) return;
      if (e.code === 'Digit2') {
        vidRef.current.playbackRate = 2;
      }
      if (e.code === 'Digit3') {
        vidRef.current.playbackRate = 3;
      }
      if (e.code === 'Digit4') {
        vidRef.current.playbackRate = 4;
      }
      if (e.code === 'Digit5') {
        vidRef.current.playbackRate = 5;
      }
    },
    [progressBar.current, vidRef.current],
  );

  const unsetHold = useCallback(
    (_e: KeyboardEvent<HTMLDivElement>) => {
      if (!vidRef.current) return;
      vidRef.current.playbackRate = 1;
    },
    [progressBar.current, vidRef.current],
  );

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    if (vidRef.current && progressBar.current) {
      vidRef.current.addEventListener(
        'timeupdate',
        () => {
          if (!progressBar.current) return;
          if (!vidRef.current) return;
          // For mobile browsers, ensure that the progress element's max attribute is set
          if (!progressBar.current.getAttribute('max')) {
            progressBar.current.setAttribute('max', vidRef.current.duration.toString());
          }
          progressBar.current.value = vidRef.current.currentTime;
          // progressBar.current.style.width =
          //   Math.floor(
          //     (vidRef.current.currentTime / vidRef.current.duration) * 100
          //   ) + "%";
        },
        {
          signal,
        },
      );
    }

    return () => {
      controller.abort();
    };
  }, [vidRef.current, progressBar.current]);

  return (
    <div className="flex-1 flex flex-row gap-2 overflow-auto" onKeyDown={setWhileHeld} onKeyUp={unsetHold}>
      <div className="flex flex-col gap-1 min-w-[125px] overflow-y-auto text-sm">
        {importantEvents?.map((evt) => {
          return (
            <EventStub
              key={evt.timestamp}
              participants={gameInfo.participants || []}
              event={evt}
              myTeamId={myTeamId}
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
        <figure id="videoContainer" data-fullscreen="false" className="flex flex-col flex-1">
          <video
            controls
            id="video"
            ref={vidRef}
            src={`vod://${vod}`}
            style={{
              margin: 'auto',
              flex: 1,
              objectFit: 'contain',
              minWidth: 0,
              minHeight: 0,
            }}
          />
          {/* <div id="video-controls" className="controls w-full" data-state="hidden">
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
              <div className="flex flex-row relative mr-1 h-[41px]">
                {importantEvents?.map((e) => {
                  return (
                    <EventTimelineIcon
                      event={e}
                      participants={gameInfo.participants}
                      myParticipantId={myParticipantId}
                      key={e.timestamp}
                      left={`${(100 * 1000 * timeConvert(e.timestamp)) / vodDuration}%`}
                    />
                  );
                })}
              </div>
            </div>
          </div> */}
        </figure>
      )}
    </div>
  );
};
