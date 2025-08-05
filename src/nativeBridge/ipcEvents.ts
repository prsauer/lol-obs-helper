export const Events = {
  ActivityStarted: 'activity:started',
  ActivityEnded: 'activity:ended',
  RecordingStarted: 'obs:recording:on',
  RecordingStopped: 'obs:recording:off',
  RecordingWritten: 'obs:recording:written',
};

export type ActivityStartedEvent = {
  game: string;
  activityId: string;
  metadata: Record<string, string>;
  timestamp: Date;
};

export type ActivityEndedEvent = {
  game: string;
  activityId: string;
  metadata: Record<string, string>;
  timestamp: Date;
};

export type RecordingWrittenEvent = {
  activityId: string;
  metadata: Record<string, string>;
  filename: string;
  timestamp: Date;
};
