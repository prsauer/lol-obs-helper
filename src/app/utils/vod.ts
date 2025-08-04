import { MatchDto } from '../proxy/types';

type VodInfo = {
  name: string;
  ended: Date;
};

function getTimeFromVideoName(info: VodInfo) {
  // Regex to match YYYY-MM-DD HH-MM-SS pattern in filename
  const dateTimeRegex = /(\d{4})-(\d{2})-(\d{2}) (\d{2})-(\d{2})-(\d{2})/;
  const match = info.name.match(dateTimeRegex);

  if (!match) {
    throw new Error(`Could not parse date/time from filename: ${info.name}`);
  }

  const [, year, month, day, hr, mn, sc] = match;

  return {
    info,
    startDatetime: new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hr),
      parseInt(mn),
      parseInt(sc),
    ),
  };
}

function videoListToTimes(vods: VodInfo[]) {
  return vods.map(getTimeFromVideoName);
}

/// generate a list of strings: all champ names, all summoner names, all summoner spells, all runes:
// sort this list by alphabetical order
// concatenate it to a single string
// convert all chars in the string to numbers
// multiply all the numbers
// mod by some large prime number
// return the result as a string
function generateGameHash(game: MatchDto): string {
  if (!game.info.participants) {
    return '';
  }
  if (!game.info.participants.length) {
    return '';
  }
  const champNames = game.info.participants?.map((player) => player.championName);
  const summonerNames = game.info.participants?.map((player) => player.summonerName);
  const allStrings = [...champNames, ...summonerNames];
  const sortedStrings = allStrings.sort();
  const string = sortedStrings.join('');
  const numbers = string.split('').map((char) => char.charCodeAt(0));
  const product = numbers.reduce((acc, num) => acc * num, 1);
  const mod = product % 1000000007;
  return mod.toString();
}

export function maybeGetVod(vods: VodInfo[], game: MatchDto) {
  const gameHash = generateGameHash(game);
  console.log({ game, gameHash });
  if (!gameHash) return undefined;
  const times = videoListToTimes(vods);
  for (let i = 0; i < times.length; i++) {
    const time = times[i];
    if (time.info.name.includes(gameHash)) {
      return time;
    }
  }
}

export const secondsToMinutesString = (secs: number) => {
  if (secs <= 60) {
    return `${secs}s`;
  }
  const mins = Math.floor(secs / 60);
  const secondsRemaining = secs - mins * 60;
  return `${mins}:${secondsRemaining < 10 ? '0' : ''}${secondsRemaining.toFixed(0)}`;
};
