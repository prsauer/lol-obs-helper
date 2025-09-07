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

export type TokenType = {
  accessToken: string;
  email: string;
  exp: number;
  expirestAt: number;
  refreshToken: string;
  refresh_token_expires_in: number;
  scope: string;
  idToken: string;
};
