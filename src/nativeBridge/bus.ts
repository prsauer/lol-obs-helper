import { EventEmitter } from 'events';
import {
  ActivityEndedEvent,
  ActivityStartedEvent,
  RecordingStartedEvent,
  RecordingStoppedEvent,
  RecordingWrittenEvent,
} from './events';
import { logger } from './logger';

/**
 * Bus for communication between modules -- does not ipc to the render process
 */
class InternalEventBus extends EventEmitter {
  private loggedEmit(
    eventName: string,
    data:
      | ActivityStartedEvent
      | ActivityEndedEvent
      | RecordingStartedEvent
      | RecordingStoppedEvent
      | RecordingWrittenEvent,
  ) {
    if ('activityId' in data) {
      logger.info(`Emitting ${eventName} activity=${data.activityId}`);
    } else {
      logger.info(`Emitting ${eventName}`);
    }
    this.emit(eventName, data);
  }

  emitActivityStarted(data: ActivityStartedEvent) {
    this.loggedEmit('activity:started', data);
  }

  emitActivityEnded(data: ActivityEndedEvent) {
    this.loggedEmit('activity:ended', data);
  }

  emitRecordingStarted(data: RecordingStartedEvent) {
    this.loggedEmit('obs:recording:on', data);
  }

  emitRecordingStopped(data: RecordingStoppedEvent) {
    this.loggedEmit('obs:recording:off', data);
  }

  emitRecordingWritten(data: RecordingWrittenEvent) {
    this.loggedEmit('obs:recording:written', data);
  }

  onActivityStarted(listener: (data: ActivityStartedEvent) => void) {
    this.on('activity:started', listener);
  }

  onActivityEnded(listener: (data: ActivityEndedEvent) => void) {
    this.on('activity:ended', listener);
  }

  onRecordingStarted(listener: () => void) {
    this.on('obs:recording:on', listener);
  }

  onRecordingStopped(listener: (data: RecordingStoppedEvent) => void) {
    this.on('obs:recording:off', listener);
  }

  onRecordingWritten(listener: (data: RecordingWrittenEvent) => void) {
    this.on('obs:recording:written', listener);
  }
}

export const bus = new InternalEventBus();
