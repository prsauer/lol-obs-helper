export type FolderInfo = {
  matchId?: string;
  summonerName?: string;
  summonerPuuid?: string;
  platformId?: string;
  region?: string;
  logPath: string;
  createdTime: number;
};

export type ActivityRecord = {
  timestamp: number;
  start?: ActivityStartedEvent;
  end?: ActivityEndedEvent;
  recording: RecordingWrittenEvent;
};
