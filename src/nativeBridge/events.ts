export const BusEvents = {
  ActivityStarted: 'activity:started' as const,
  ActivityEnded: 'activity:ended' as const,
  RecordingStarted: 'obs:recording:on' as const,
  RecordingStopped: 'obs:recording:off' as const,
  RecordingWritten: 'obs:recording:written' as const,
};

export type ActivityStartedEvent = {
  type: (typeof BusEvents)['ActivityStarted'];
  game: string;
  activityId: string;
  metadata: Record<string, string>;
  timestamp: Date;
};

export type ActivityEndedEvent = {
  type: (typeof BusEvents)['ActivityEnded'];
  game: string;
  activityId: string;
  metadata: Record<string, string>;
  timestamp: Date;
};

export type RecordingStoppedEvent = {
  type: (typeof BusEvents)['RecordingStopped'];
  video: string;
  activityId: string | null;
};

export type RecordingWrittenEvent = {
  type: (typeof BusEvents)['RecordingWritten'];
  activityId: string;
  metadata: Record<string, string>;
  filename: string;
  timestamp: Date;
};
