import { KeyboardEvent, useCallback, useEffect, useRef } from 'react';
import { getGameData, getGameTimeline } from '../proxy/riotApi';
import { useQuery } from '@tanstack/react-query';
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
  // All hooks at the top level
  const vidRef = useRef<HTMLVideoElement>(null);
  const progressBar = useRef<HTMLProgressElement>(null);
  const gameTimelineQuery = useQuery({
    queryKey: ['game-timeline', matchId],
    queryFn: () => getGameTimeline(matchId || 'no-id'),
  });
  const gamesQuery = useQuery({ queryKey: ['game', matchId], queryFn: () => getGameData(matchId || 'no-id') });

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

  // Data calculations after all hooks
  const myId = summonerPuuid; //summonerQuery.data?.data?.puuid;
  const myParticipantId = gameTimelineQuery.data?.data?.info?.participants?.find((p) => p.puuid === myId)
    ?.participantId;
  const gameInfo = gamesQuery.data?.data?.info;
  const vodStartTime = created;
  const vodEndTime = ended;

  // Handle case where we have video but no game data
  if (!vodEndTime || !vodStartTime) {
    return <div>Loading video data...</div>;
  }

  if (!gameInfo) {
    console.log('No game data available, showing video only', { matchId });
    return (
      <div className="flex-1 flex flex-row gap-2 overflow-auto">
        <div className="flex flex-col gap-1 min-w-[125px] overflow-y-auto text-sm">
          <div className="text-gray-400">No timeline events (no match data)</div>
        </div>
        {vod && (
          <figure id="videoContainer" data-fullscreen="false" className="flex flex-col flex-1">
            <video
              controls
              id="video"
              ref={vidRef}
              src={`vod://vods/${btoa('D:\\Video\\' + vod || '')}`}
              style={{
                margin: 'auto',
                flex: 1,
                objectFit: 'contain',
                minWidth: 0,
                minHeight: 0,
              }}
            />
          </figure>
        )}
      </div>
    );
  }

  const myTeamId = myParticipantId && gameInfo?.participants ? gameInfo.participants[myParticipantId]?.teamId : -1;

  const allEvts = gameTimelineQuery.data?.data?.info?.frames?.map((e) => e.events || []).flat();

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

  // Calculate offset between video start and game start
  const firstEventTimestamp = allEvts?.[0]?.timestamp || 0;
  const firstEventRealTimestamp = allEvts?.[0]?.realTimestamp;
  console.log('First few events:', allEvts?.slice(0, 3));
  const gameStartTime = gameInfo?.gameCreation ? new Date(gameInfo.gameCreation) : null;
  let videoStartTime: Date | null = null;
  if (vodStartTime) {
    if (vodStartTime instanceof Date) {
      videoStartTime = vodStartTime;
    } else {
      const parsed = new Date(vodStartTime);
      videoStartTime = isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  let timeOffsetSeconds = 0;
  if (gameStartTime && videoStartTime) {
    // Calculate difference between when video started recording vs when game actually started
    const gameStartMs = gameStartTime.getTime();
    const videoStartMs = videoStartTime.getTime();
    const offsetMs = videoStartMs - gameStartMs;
    const offsetMinutes = offsetMs / 1000 / 60;

    console.log('Timeline offset calculation (before adjustment):', {
      gameStartTime: gameStartTime.toISOString(),
      videoStartTime: videoStartTime.toISOString(),
      firstEventTimestamp,
      firstEventRealTimestamp,
      offsetMs,
      offsetMinutes: offsetMinutes.toFixed(2),
      'Seems too high?': Math.abs(offsetMinutes) > 5,
    });

    // Try alternative calculation using realTimestamp if available
    if (firstEventRealTimestamp && Math.abs(offsetMinutes) > 5) {
      const realEventTime = new Date(firstEventRealTimestamp);
      const realOffsetMs = videoStartTime.getTime() - realEventTime.getTime();
      const realOffsetSeconds = realOffsetMs / 1000;
      console.log('Alternative offset using realTimestamp:', {
        realEventTime: realEventTime.toISOString(),
        realOffsetMs,
        realOffsetSeconds,
      });
    }

    // The automatic calculation using game vs video start times doesn't work reliably
    // Use a reasonable default offset instead
    if (firstEventRealTimestamp) {
      console.log('Using realTimestamp for offset calculation');
      const realEventTime = new Date(firstEventRealTimestamp);

      // Calculate the actual offset using realTimestamp and observed data
      // realTimestamp tells us when the first event (game time 0) actually occurred
      // We can calculate when that appears in the video timeline

      const firstEventVideoTime = (realEventTime.getTime() - videoStartTime.getTime()) / 1000;
      const firstEventGameTime = firstEventTimestamp / 1000; // Should be 0

      // The offset is: where in video does game time 0 appear
      const calculatedOffset = firstEventVideoTime - firstEventGameTime;

      console.log('Calculated offset using realTimestamp:', {
        'First event occurred at': realEventTime.toISOString(),
        'Video started at': videoStartTime.toISOString(),
        'First event appears at video time': `${Math.floor(firstEventVideoTime / 60)}:${String(
          Math.floor(firstEventVideoTime % 60),
        ).padStart(2, '0')}`,
        'First event game time': firstEventGameTime,
        'Calculated offset': calculatedOffset,
        'This means': `game time X appears at video time X + ${calculatedOffset.toFixed(1)} seconds`,
      });

      timeOffsetSeconds = calculatedOffset;
    } else {
      console.log('No realTimestamp available, using calculated offset:', offsetMs / 1000);
      timeOffsetSeconds = offsetMs / 1000;
      timeOffsetSeconds += firstEventTimestamp / 1000;
    }

    console.log('Final timeOffsetSeconds:', timeOffsetSeconds);
  } else {
    console.log('Timeline offset: missing timestamps', {
      gameStartTime,
      videoStartTime: vodStartTime,
      videoStartTimeType: typeof vodStartTime,
      videoStartTimeIsDate: vodStartTime instanceof Date,
      firstEventTimestamp,
    });
  }

  const timeConvert = (eventTimestamp: number) => {
    const convertedTime = eventTimestamp / 1000 + timeOffsetSeconds;
    return convertedTime;
  };

  const vodReferenceUri = `vod://vods/${btoa('D:\\Video\\' + vod || '')}`;

  return (
    <div className="flex-1 flex flex-row gap-2 overflow-auto" onKeyDown={setWhileHeld} onKeyUp={unsetHold}>
      <div className="flex flex-col gap-1 min-w-[125px] overflow-y-auto text-sm">
        {importantEvents?.map((evt) => {
          return (
            <EventStub
              key={evt.timestamp}
              participants={gameInfo?.participants || []}
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
            src={vodReferenceUri}
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
                      participants={gameInfo?.participants || []}
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
