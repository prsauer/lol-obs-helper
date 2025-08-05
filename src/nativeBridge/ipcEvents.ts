export const Events = {
  ActivityStarted: 'activity:started' as const,
  ActivityEnded: 'activity:ended' as const,
  RecordingStarted: 'obs:recording:on' as const,
  RecordingStopped: 'obs:recording:off' as const,
  RecordingWritten: 'obs:recording:written' as const,
};

export type ActivityStartedEvent = {
  type: (typeof Events)['ActivityStarted'];
  game: string;
  activityId: string;
  metadata: Record<string, string>;
  timestamp: Date;
};

export type ActivityEndedEvent = {
  type: (typeof Events)['ActivityEnded'];
  game: string;
  activityId: string;
  metadata: Record<string, string>;
  timestamp: Date;
};

export type RecordingWrittenEvent = {
  type: (typeof Events)['RecordingWritten'];
  activityId: string;
  metadata: Record<string, string>;
  filename: string;
  timestamp: Date;
};
