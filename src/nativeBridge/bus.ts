import { EventEmitter } from 'events';
import {
  ActivityEndedEvent,
  ActivityStartedEvent,
  RecordingStartedEvent,
  RecordingStoppedEvent,
  RecordingWrittenEvent,
} from './events';

/**
 * Bus for communication between modules -- does not ipc to the render process
 */
class InternalEventBus extends EventEmitter {
  emitActivityStarted(data: ActivityStartedEvent) {
    this.emit('activity:started', data);
  }

  emitActivityEnded(data: ActivityEndedEvent) {
    this.emit('activity:ended', data);
  }

  emitRecordingStarted(data: RecordingStartedEvent) {
    this.emit('obs:recording:on', data);
  }

  emitRecordingStopped(data: RecordingStoppedEvent) {
    this.emit('obs:recording:off', data);
  }

  emitRecordingWritten(data: RecordingWrittenEvent) {
    this.emit('obs:recording:written', data);
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
