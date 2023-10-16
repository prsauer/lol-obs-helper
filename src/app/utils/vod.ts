type VodInfo = {
  name: string;
  ended: Date;
};

function getTimeFromVideoName(info: VodInfo) {
  const hasGameID = info.name.includes('NA1');
  const baseIndex = hasGameID ? 1 : 0;

  const majorParts = info.name.slice(0, info.name.length - 4).split(' ');
  console.log(majorParts);
  const [dateStr, tm] = [majorParts[baseIndex], majorParts[baseIndex + 1]];

  const [year, month, day] = dateStr.split('-');
  const [hr, mn, sc] = tm.split('-');

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

export function maybeGetVod(vods: VodInfo[], gameId: number) {
  const times = videoListToTimes(vods);
  for (let i = 0; i < times.length; i++) {
    const time = times[i];
    if (time.info.name.includes(gameId.toString())) {
      console.log('match', { time, gameId });
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
