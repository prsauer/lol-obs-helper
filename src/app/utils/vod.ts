type VodInfo = {
  name: string;
  ended: string;
};

function getTimeFromVideoName(info: VodInfo) {
  const [dateStr, tm] = info.name.slice(0, info.name.length - 4).split(" ");
  const [year, month, day] = dateStr.split("-");
  const [hr, mn, sc] = tm.split("-");

  return {
    info,
    date: new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hr),
      parseInt(mn),
      parseInt(sc)
    ),
  };
}

function videoListToTimes(vods: VodInfo[]) {
  return vods.map(getTimeFromVideoName);
}

const VOD_OFFSET_THRESHOLD = 20000; // 20s

export function maybeGetVod(vods: VodInfo[], gameCreationTime: number) {
  const times = videoListToTimes(vods);
  for (let i = 0; i < times.length; i++) {
    const time = times[i];
    if (
      Math.abs(time.date.getTime() - gameCreationTime) < VOD_OFFSET_THRESHOLD
    ) {
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
  return `${mins}:${secondsRemaining < 10 ? "0" : ""}${secondsRemaining.toFixed(
    0
  )}`;
};
