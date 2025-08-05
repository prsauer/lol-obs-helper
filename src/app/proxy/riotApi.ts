import { ActiveGameInfo, AccountDto, MatchDto, MatchTimelineDto, SummonerDto } from './types';

const baseApiRoute = 'https://spires-lol.vercel.app/api/lol';

export type DataPacket<T> = {
  data: T | null;
  err: string | null;
  status: number | null;
};

export const getSummonerByPuuid = async (summonerPuuid: string): Promise<DataPacket<SummonerDto>> => {
  const result = await fetch(`${baseApiRoute}/lol/summoner/v4/summoners/by-puuid/${summonerPuuid}`);
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
    if (jsonData['status']) {
      return {
        data: null,
        err: textRes,
        status: jsonData['status']['status_code'],
      };
    }
    return {
      data: JSON.parse(textRes) as SummonerDto,
      err: null,
      status: null,
    };
  } catch (error) {
    console.log('Error decoding');
    console.log(textRes);
    return { err: textRes, status: result.status, data: null };
  }
};

export const mimikFetch = (input: string, init?: RequestInit) => {
  return fetch(mimik(input), init);
};

export const mimik = (inputUrl: string) => {
  return `https://mimikyu-git-main-spires.vercel.app/api?d=${btoa(inputUrl)}`;
};

export const getAccountByRiotId = async (gameName: string, tagLine: string): Promise<DataPacket<AccountDto>> => {
  const result = await mimikFetch(
    `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
    {
      headers: {
        'X-Actual': `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
        'X-Riot-Token': 'RGAPI-asclokmc389m10wcnjkasf9',
      },
    },
  );
  const textRes = await result.text();
  return {
    data: JSON.parse(textRes) as AccountDto,
    err: null,
    status: null,
  };
};

export const getActiveGamesForSummoner = async (puuid: string): Promise<DataPacket<ActiveGameInfo>> => {
  const result = await mimikFetch(`https://na1.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`, {
    headers: {
      'X-Actual': `https://na1.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`,
      'X-Riot-Token': 'RGAPI-asclokmc389m10wcnjkasf9',
    },
  });
  const textRes = await result.text();
  return {
    data: JSON.parse(textRes) as ActiveGameInfo,
    err: null,
    status: null,
  };
};

export const getGamesForSummoner = async (puuid: string, start = 0, count = 20): Promise<DataPacket<string[]>> => {
  const result = await mimikFetch(
    `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`,
    {
      headers: {
        'X-Actual': `https://na1.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`,
        'X-Riot-Token': 'RGAPI-asclokmc389m10wcnjkasf9',
      },
    },
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
    if (jsonData['status']) {
      return {
        data: null,
        err: textRes,
        status: jsonData['status']['status_code'],
      };
    }
    return {
      data: JSON.parse(textRes) as string[],
      err: null,
      status: null,
    };
  } catch (error) {
    console.log('Error decoding');
    console.log(textRes);
    return { err: textRes, status: result.status, data: null };
  }
};

export const getGameData = async (matchId: string): Promise<DataPacket<MatchDto>> => {
  const result = await mimikFetch(`https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`, {
    headers: {
      'X-Actual': `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`,
      'X-Riot-Token': 'RGAPI-asclokmc389m10wcnjkasf9',
    },
  });
  const textRes = await result.text();
  try {
    return {
      data: JSON.parse(textRes) as MatchDto,
      err: null,
      status: null,
    };
  } catch (error) {
    console.log('Error decoding');
    console.log(textRes);
    return { err: textRes, status: result.status, data: null };
  }
};

export const getGameTimeline = async (matchId: string): Promise<DataPacket<MatchTimelineDto>> => {
  const result = await mimikFetch(`https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`, {
    headers: {
      'X-Actual': `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`,
      'X-Riot-Token': 'RGAPI-asclokmc389m10wcnjkasf9',
    },
  });
  const textRes = await result.text();
  try {
    return {
      data: JSON.parse(textRes) as MatchTimelineDto,
      err: null,
      status: null,
    };
  } catch (error) {
    console.log('Error decoding');
    console.log(textRes);
    return { err: textRes, status: result.status, data: null };
  }
};
