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
    startDatetime: new Date(
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

const VOD_OFFSET_THRESHOLD = 22000; // milliseconds

export function maybeGetVod(
  vods: VodInfo[],
  gameCreationTime: number,
  gameEndTime: number
) {
  const times = videoListToTimes(vods);
  for (let i = 0; i < times.length; i++) {
    const time = times[i];
    const vodEndedTime = new Date(time.info.ended).getTime();
    const endDelta = Math.abs(vodEndedTime - gameEndTime);
    const startDelta = Math.abs(
      time.startDatetime.getTime() - gameCreationTime
    );

    if (endDelta < VOD_OFFSET_THRESHOLD) {
      return time;
    }

    if (startDelta < VOD_OFFSET_THRESHOLD) {
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
