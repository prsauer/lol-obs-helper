import { Event, MatchParticipant } from '../proxy/types';
import { MONSTER_NAMES } from '../utils/static';
import { secondsToMinutesString } from '../utils/vod';
import { ChampIcon } from '../league/ChampIcon';

export const EventStub = ({
  participants,
  event,
  myParticipantId,
  myTeamId,
  onClick,
  timeConverter,
}: {
  participants: MatchParticipant[];
  event: Event;
  myParticipantId: number | undefined;
  myTeamId: number | undefined;
  onClick: (ts: number) => void;
  timeConverter: (ts: number) => number;
}) => {
  const gameTime = secondsToMinutesString(event.timestamp / 1000);
  if (event.type === 'CHAMPION_KILL' && event.killerId === myParticipantId) {
    return (
      <div
        className="text-green-400 cursor-pointer flex flex-row gap-1"
        onClick={() => onClick(timeConverter(event.timestamp))}
      >
        Kill: {gameTime} <ChampIcon size={20} championId={participants[(event.victimId || 0) - 1].championId} />
      </div>
    );
  }
  if (event.type === 'CHAMPION_KILL' && event.victimId === myParticipantId) {
    return (
      <div className="text-purple-400 font-bold cursor-pointer" onClick={() => onClick(timeConverter(event.timestamp))}>
        Death: {gameTime}
      </div>
    );
  }
  if (event.type === 'CHAMPION_KILL' && myParticipantId && event.assistingParticipantIds?.includes(myParticipantId)) {
    return (
      <div
        className="text-green-400 cursor-pointer flex flex-row gap-1"
        onClick={() => onClick(timeConverter(event.timestamp))}
      >
        Assist: {gameTime} <ChampIcon size={20} championId={participants[(event.victimId || 0) - 1].championId} />
      </div>
    );
  }
  if (event.type === 'ELITE_MONSTER_KILL') {
    const myKill = event.killerTeamId === myTeamId;
    return (
      <div
        onClick={() => onClick(timeConverter(event.timestamp))}
        className={myKill ? 'text-green-400 cursor-pointer' : 'text-purple-400 cursor-pointer'}
      >
        {MONSTER_NAMES[event.monsterType || 'none']} {gameTime}
      </div>
    );
  }
  return <div>{event.type}</div>;
};
