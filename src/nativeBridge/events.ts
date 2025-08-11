export const BusEvents = {
  ActivityStarted: 'activity:started' as const, // obs listens for these
  ActivityEnded: 'activity:ended' as const, // obs listens for these
  RecordingWritten: 'obs:recording:written' as const, // game modules listen for this
  RecordingStarted: 'obs:recording:on' as const, // for native side ui calls
  RecordingStopped: 'obs:recording:off' as const, //for native side ui calls
};

/** OBS module emits this when recording has started */
export type RecordingStartedEvent = {
  type: (typeof BusEvents)['RecordingStarted'];
  timestamp: Date;
};

/** OBS module emits this when the vod is done recording & written to disk */
export type RecordingStoppedEvent = {
  type: (typeof BusEvents)['RecordingStopped'];
  timestamp: Date;
  video: string;
  activityId: string | null;
};

/** OBS module emits this when it is done handling the vod entirely */
export type RecordingWrittenEvent = {
  type: (typeof BusEvents)['RecordingWritten'];
  timestamp: Date;
  activityId: string;
  metadata: Record<string, string>;
  filename: string;
};

// REQUIRED EVENTS FOR GAME MODULES:

/** Game modules must emit these */
export type ActivityStartedEvent = {
  type: (typeof BusEvents)['ActivityStarted'];
  timestamp: Date;
  game: string;
  activityId: string;
  metadata: Record<string, string>;
};

/** Game modules must emit these */
export type ActivityEndedEvent = {
  type: (typeof BusEvents)['ActivityEnded'];
  timestamp: Date;
  game: string;
  activityId: string;
  metadata: Record<string, string>;
};
