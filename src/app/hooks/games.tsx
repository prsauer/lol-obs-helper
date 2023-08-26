import { useQuery } from "react-query";
import { DataPacket, getGameData, getGameTimeline } from "../proxy/riotApi";
import gdata from "../../../mock/NA1_4733739660.game.json";
import tdata from "../../../mock/NA1_4733739660.timeline.json";
import { MatchDto, MatchTimelineDto } from "../proxy/types";

const MOCK_RETURN = false;

export const useGameTimelineQuery = (matchId: string) =>
  useQuery(`game-timeline-${matchId}`, () => {
    if (MOCK_RETURN) {
      return Promise.resolve({
        data: tdata,
        status: 200,
        err: null,
      }) as Promise<DataPacket<MatchTimelineDto>>;
    }
    return getGameTimeline(matchId);
  });

export const useGameQuery = (matchId: string) =>
  useQuery(`game-${matchId}`, () => {
    if (MOCK_RETURN) {
      return Promise.resolve({
        data: gdata,
        status: 200,
        err: null,
      }) as Promise<DataPacket<MatchDto>>;
    }
    return getGameData(matchId || "no-id");
  });
