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

export function maybeGetVod(vods: VodInfo[], gameId: number) {
  const times = videoListToTimes(vods);
  for (let i = 0; i < times.length; i++) {
    const time = times[i];
    if (time.info.name.includes(gameId.toString())) {
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
