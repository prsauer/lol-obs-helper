import { KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { getGameData, getGameTimeline } from '../proxy/riotApi';
import { useQuery } from '@tanstack/react-query';
import { EventStub } from './EventStub';
import { ChampIcon } from '../league/ChampIcon';

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
  const [eventFilters, setEventFilters] = useState({
    kills: true,
    deaths: true,
    assists: true,
    objectives: true,
  });
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
      if (e.code === 'Digit1') {
        vidRef.current.playbackRate = 0.5;
      }
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
  const gameInfo = gamesQuery.data?.data && 'info' in gamesQuery.data.data ? gamesQuery.data.data.info : undefined;
  const vodStartTime = created;
  const vodEndTime = ended;
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
      return eventFilters.objectives;
    }
    if (evt.type === 'CHAMPION_KILL' && evt.killerId === myParticipantId) {
      return eventFilters.kills;
    }
    if (evt.type === 'CHAMPION_KILL' && evt.victimId === myParticipantId) {
      return eventFilters.deaths;
    }
    if (evt.type === 'CHAMPION_KILL' && myParticipantId && evt.assistingParticipantIds?.includes(myParticipantId)) {
      return eventFilters.assists;
    }
    return false;
  });

  // Calculate offset between video start and game start
  const firstEventTimestamp = allEvts?.[0]?.timestamp || 0;
  const firstEventRealTimestamp = allEvts?.[0]?.realTimestamp;

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

    // The automatic calculation using game vs video start times doesn't work reliably
    // Use a reasonable default offset instead
    if (firstEventRealTimestamp) {
      const realEventTime = new Date(firstEventRealTimestamp);

      // Calculate the actual offset using realTimestamp and observed data
      // realTimestamp tells us when the first event (game time 0) actually occurred
      // We can calculate when that appears in the video timeline

      const firstEventVideoTime = (realEventTime.getTime() - videoStartTime.getTime()) / 1000;
      const firstEventGameTime = firstEventTimestamp / 1000; // Should be 0

      // The offset is: where in video does game time 0 appear
      const calculatedOffset = firstEventVideoTime - firstEventGameTime;

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

  const focusedParticipant = gameInfo?.participants?.[(myParticipantId || 1) - 1];
  console.log({ gameInfo, focusedParticipant });

  return (
    <div className="flex-1 flex flex-row gap-2 overflow-auto" onKeyDown={setWhileHeld} onKeyUp={unsetHold}>
      <div id="focused-champ-info" className="flex flex-col gap-1 min-w-[255px] overflow-y-auto text-sm">
        <div className="flex flex-col gap-1 mb-2">
          {myParticipantId && gameInfo?.participants && (
            <>
              <div className="flex items-center gap-2">
                <ChampIcon size={24} championId={focusedParticipant?.championId} />
                <span className="font-semibold text-white">{focusedParticipant?.riotIdGameName || 'Unknown'}</span>
                <span className="text-gray-400 ml-auto">
                  {focusedParticipant?.kills || 0}/{focusedParticipant?.deaths || 0}/{focusedParticipant?.assists || 0}
                </span>
              </div>
              {focusedParticipant?.riotIdGameName && focusedParticipant?.riotIdTagline && (
                <div className="flex gap-2 ml-8">
                  <button
                    onClick={() => {
                      window.native.links.openExternalURL(
                        `https://u.gg/lol/profile/na1/${focusedParticipant.riotIdGameName}-${focusedParticipant.riotIdTagline}/overview`,
                      );
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    View on u.gg
                  </button>
                  <button
                    onClick={() => {
                      window.native.links.openExternalURL(
                        `https://xdx.gg/${focusedParticipant.riotIdGameName}-${focusedParticipant.riotIdTagline}`,
                      );
                    }}
                    className="text-xs text-green-400 hover:text-green-300 underline"
                  >
                    View on lolalytics
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        <div className="mb-2 p-2 bg-gray-800 rounded text-xs">
          <div className="font-semibold mb-1">Event Filters:</div>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={eventFilters.kills}
                onChange={(e) => setEventFilters((prev) => ({ ...prev, kills: e.target.checked }))}
                className="w-3 h-3"
              />
              <span className="text-green-400">Kills</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={eventFilters.deaths}
                onChange={(e) => setEventFilters((prev) => ({ ...prev, deaths: e.target.checked }))}
                className="w-3 h-3"
              />
              <span className="text-red-400">Deaths</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={eventFilters.assists}
                onChange={(e) => setEventFilters((prev) => ({ ...prev, assists: e.target.checked }))}
                className="w-3 h-3"
              />
              <span className="text-yellow-400">Assists</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={eventFilters.objectives}
                onChange={(e) => setEventFilters((prev) => ({ ...prev, objectives: e.target.checked }))}
                className="w-3 h-3"
              />
              <span className="text-purple-400">Objectives</span>
            </label>
          </div>
        </div>

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
        </figure>
      )}
    </div>
  );
};
