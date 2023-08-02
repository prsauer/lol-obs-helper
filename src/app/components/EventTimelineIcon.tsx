import { Event, MatchParticipant } from "../proxy/types";
import { ChampIcon } from "./ChampIcon";

const ICON_SIZE = 24;

export const EventTimelineIcon = ({
  participants,
  event,
  myParticipantId,
  left,
}: {
  participants: MatchParticipant[];
  event: Event;
  myParticipantId: number | undefined;
  left: string;
}) => {
  if (event.type === "CHAMPION_KILL" && event.killerId === myParticipantId) {
    return (
      <div
        style={{
          position: "absolute",
          left,
          top: 5,
          marginLeft: -ICON_SIZE / 2,
        }}
        className={"cursor-pointer border-green-400 border"}
      >
        <ChampIcon
          size={ICON_SIZE}
          championId={participants[(event.victimId || 0) - 1].championId}
        />
      </div>
    );
  }
  if (event.type === "CHAMPION_KILL" && event.victimId === myParticipantId) {
    return (
      <div
        className="text-purple-400 font-bold cursor-pointer border-red-600 border bg-black"
        style={{
          position: "absolute",
          left,
          marginLeft: -8,
        }}
      >
        D
      </div>
    );
  }
  if (
    event.type === "CHAMPION_KILL" &&
    myParticipantId &&
    event.assistingParticipantIds?.includes(myParticipantId)
  ) {
    return (
      <div
        className={"cursor-pointer border-yellow-600 border"}
        style={{
          position: "absolute",
          left,
          top: 7,
          marginLeft: -ICON_SIZE / 2,
        }}
      >
        <ChampIcon
          size={ICON_SIZE}
          championId={participants[(event.victimId || 0) - 1].championId}
        />
      </div>
    );
  }
  if (event.type === "ELITE_MONSTER_KILL") {
    const myKill = event.killerId === myParticipantId;
    if (event.monsterType === "BARON_NASHOR") {
      return (
        <div
          className={
            myKill
              ? "text-green-400 cursor-pointer border-green-400 border"
              : "text-purple-400 cursor-pointer border-purple-400 border"
          }
          style={{
            position: "absolute",
            left,
            top: 14,
            marginLeft: -ICON_SIZE / 2,
          }}
        >
          <img
            src={
              "https://raw.communitydragon.org/latest/game/assets/characters/sru_baron/hud/baron_square.png"
            }
            height={ICON_SIZE}
            width={ICON_SIZE}
          />
        </div>
      );
    } else {
      return (
        <div
          className={
            myKill
              ? "text-green-400 cursor-pointer border-green-400 border"
              : "text-purple-400 cursor-pointer border-purple-400 border"
          }
          style={{
            position: "absolute",
            left,
            top: 14,
            marginLeft: -ICON_SIZE / 2,
          }}
        >
          <img
            src={
              "https://raw.communitydragon.org/latest/game/assets/characters/sru_dragon/hud/dragon_square.png"
            }
            height={ICON_SIZE}
            width={ICON_SIZE}
          />
        </div>
      );
    }
  }
  return <div>{event.type}</div>;
};
