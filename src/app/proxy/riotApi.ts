import { MatchDto, MatchTimelineDto, SummonerDto } from "./types";

const baseApiRoute = "https://spires-lol.vercel.app/api/lol";

export type DataPacket<T> = {
  data: T | null;
  err: string | null;
  status: number | null;
};

export const getSummonerByName = async (
  summonerName: string
): Promise<DataPacket<SummonerDto>> => {
  const result = await fetch(
    `${baseApiRoute}/lol/summoner/v4/summoners/by-name/${summonerName}`
  );
  if (result.status != 200) {
    return {
      data: null,
      err: await result.text(),
      status: result.status,
    };
  }
  const textRes = await result.text();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsonData: any = JSON.parse(textRes);
    if (jsonData["status"]) {
      return {
        data: null,
        err: textRes,
        status: jsonData["status"]["status_code"],
      };
    }
    return {
      data: JSON.parse(textRes) as SummonerDto,
      err: null,
      status: null,
    };
  } catch (error) {
    console.log("Error decoding");
    console.log(textRes);
    return { err: textRes, status: result.status, data: null };
  }
};

export const getGamesForSummoner = async (
  puuid: string,
  start = 0,
  count = 20
): Promise<DataPacket<string[]>> => {
  const result = await fetch(
    `${baseApiRoute}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`
  );
  if (result.status != 200) {
    return {
      data: null,
      err: await result.text(),
      status: result.status,
    };
  }
  const textRes = await result.text();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsonData: any = JSON.parse(textRes);
    if (jsonData["status"]) {
      return {
        data: null,
        err: textRes,
        status: jsonData["status"]["status_code"],
      };
    }
    return {
      data: JSON.parse(textRes) as string[],
      err: null,
      status: null,
    };
  } catch (error) {
    console.log("Error decoding");
    console.log(textRes);
    return { err: textRes, status: result.status, data: null };
  }
};

export const getGameData = async (
  matchId: string
): Promise<DataPacket<MatchDto>> => {
  const result = await fetch(`${baseApiRoute}/lol/match/v5/matches/${matchId}`);
  const textRes = await result.text();
  try {
    return {
      data: JSON.parse(textRes) as MatchDto,
      err: null,
      status: null,
    };
  } catch (error) {
    console.log("Error decoding");
    console.log(textRes);
    return { err: textRes, status: result.status, data: null };
  }
};

export const getGameTimeline = async (
  matchId: string
): Promise<DataPacket<MatchTimelineDto>> => {
  const result = await fetch(
    `${baseApiRoute}/lol/match/v5/matches/${matchId}/timeline`
  );
  const textRes = await result.text();
  try {
    return {
      data: JSON.parse(textRes) as MatchTimelineDto,
      err: null,
      status: null,
    };
  } catch (error) {
    console.log("Error decoding");
    console.log(textRes);
    return { err: textRes, status: result.status, data: null };
  }
};
