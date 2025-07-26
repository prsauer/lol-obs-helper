import { BrowserWindow, ipcMain } from 'electron';
import { moduleEvent, moduleFunction, nativeBridgeModule, NativeBridgeModule } from '../module';
import { FSWatcher, watch } from 'chokidar';
import OBSWebSocket, { EventSubscription } from 'obs-websocket-js';
import { R3DLogWatcher } from '../../nativeUtils/logWatcher';
import { Events } from '../ipcEvents';
import noobs from 'noobs';

noobs.ObsInit(
  'C:\\Program Files\\obs-studio\\plugins\\obs-ffmpeg',
  'C:\\Program Files\\obs-studio\\data\\obs-studio\\log',
  'C:\\Program Files\\obs-studio\\data\\obs-studio',
  'C:\\Program Files\\obs-studio\\data\\obs-studio\\recording',
  (signal) => console.log(signal),
);

const FOLDER_AGE_THRESHOLD = 10;

let obs: OBSWebSocket | null = null;
let folderWatcher: FSWatcher | null = null;
let r3dWatcher: R3DLogWatcher | null = null;

let isRecording = false;
const folderPathSeparator = process.platform === 'darwin' ? '/' : '\\';

function parseRiotFolderDate(path: string) {
  if (!path.includes('T')) return null;
  try {
    const folderParts = path.split(folderPathSeparator);
    const folderName = folderParts[folderParts.length - 1];
    // console.log({ folderParts, folderName });
    const [dateStr, timeStr] = folderName.split('T');
    const [year, month, day] = dateStr.split('-');
    const [hour, min, sec] = timeStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min), parseInt(sec));
  } catch (error) {
    console.log(`Failed to parse: ${path}`);
    console.log(error);
    return null;
  }
}

function diffDates(d1: Date, d2: Date) {
  return (d2.getTime() - d1.getTime()) / 1000;
}

function logLineExtractGameId(logLine: string): string | null {
  const pidRegex = /"-PlatformID=([a-zA-Z0-9]*)"/;
  const gidRegex = /"-GameID=([0-9]*)"/;
  const matchPID = pidRegex.exec(logLine);
  const matchGameID = gidRegex.exec(logLine);

  if (matchPID !== null && matchPID[1] && matchGameID && matchGameID[1]) {
    return `${matchPID[1]}_${matchGameID[1]}`;
  }
  return null;
}

function logLineHasExitMessage(logLine: string) {
  if (logLine.includes('"message_body":"Game exited"')) {
    return true;
  }
  return false;
}

@nativeBridgeModule('obs')
export class OBSWSModule extends NativeBridgeModule {
  public startLogWatching(folder: string) {
    console.log(`New directory found: ${folder}`);
    // this.startRecording();
    if (r3dWatcher) {
      r3dWatcher.close();
    }
    r3dWatcher = new R3DLogWatcher(folder);
    r3dWatcher.on('new_line', (newline) => {
      console.log(newline);
      const maybeGameId = logLineExtractGameId(newline);
      console.log('gameId?', maybeGameId);
      if (maybeGameId !== null) {
        this.setRecordingNamePrefix(maybeGameId);
        this.startRecording();
      }
      if (isRecording && logLineHasExitMessage(newline)) {
        this.stopRecording();
      }
    });
  }

  public startFolderWatching(folder: string) {
    console.log(`Starting log folder watching: ${folder}`);
    if (folderWatcher) {
      folderWatcher.close();
    }
    folderWatcher = watch(folder, {
      // cwd: folder,
      useFsEvents: false,
      awaitWriteFinish: true,
    });

    folderWatcher.on('addDir', (path) => {
      // console.log("addDir", path);
      const date = parseRiotFolderDate(path);
      if (!date) return;
      const startTime = new Date();
      const ageInSeconds = diffDates(date, startTime);
      // console.log("addDir", path, date, ageInSeconds);
      if (ageInSeconds < FOLDER_AGE_THRESHOLD) {
        this.startLogWatching(path);
      }
    });
  }

  private startRecording() {
    if (!obs) {
      return;
    }
    obs.call('StartRecord');
  }

  private stopRecording() {
    if (!obs) {
      return;
    }
    obs.call('StopRecord');
  }

  public async setRecordingNamePrefix(prefix: string) {
    if (!obs) {
      return;
    }
    obs.call('SetProfileParameter', {
      parameterCategory: 'Output',
      parameterName: 'FilenameFormatting',
      parameterValue: `${prefix} %CCYY-%MM-%DD %hh-%mm-%ss`,
    });
  }

  @moduleFunction()
  public async synchronize(_mainWindow: BrowserWindow) {
    if (!obs) {
      return;
    }
    const recStatus = await obs.call('GetRecordStatus');
    const recDir = await obs.call('GetRecordDirectory');
    this.onRecordingStateChange(_mainWindow, {
      outputActive: recStatus.outputActive,
      outputPath: recDir.recordDirectory,
      outputState: '',
    });
    isRecording = recStatus.outputActive;
  }

  @moduleFunction()
  public async startListening(_mainWindow: BrowserWindow, url: string, password: string, riotFolder: string) {
    this.startFolderWatching(riotFolder);

    if (obs != null) {
      console.log('Disconnecting');
      await obs.disconnect();
      obs.removeAllListeners();
    } else {
      console.log('Starting new socket');
      obs = new OBSWebSocket();
    }

    console.log('Connecting to', url, password);
    obs.connect(url, password, {
      eventSubscriptions: EventSubscription.All | EventSubscription.InputVolumeMeters,
    });

    obs.on('ConnectionOpened', async () => {
      console.log('ConnectionOpened');
      this.logMessage(_mainWindow, `Connection to OBS opened`);
      this.onConnectionStateChange(_mainWindow, { connected: true });
    });

    obs.on('ConnectionClosed', () => {
      console.log(`${new Date()}: ConnectionClosed`);
      this.onConnectionStateChange(_mainWindow, { connected: false });
    });

    obs.on('ConnectionError', (args) => {
      console.log('ConnectionError', args);
      this.logMessage(_mainWindow, `Connection error (${args.code}) ${args.name}: ${args.message}`);
      this.onConnectionStateChange(_mainWindow, { connected: false });
      this.onConnectionError(_mainWindow, args.name + ': ' + args.message);
    });

    obs.on('RecordStateChanged', (args) => {
      console.log('RecordStateChanged', args);
      isRecording = args.outputActive;
      this.logMessage(_mainWindow, `Recording state changed to ${args.outputState}`);
      if (isRecording) {
        ipcMain.emit(Events.RecordingStarted);
      } else {
        ipcMain.emit(Events.RecordingStopped);
      }
      this.onRecordingStateChange(_mainWindow, args);
    });
  }

  @moduleEvent('on')
  public logMessage(_mainWindow: BrowserWindow, _message: string) {
    return;
  }

  @moduleEvent('on')
  public onConnectionError(_mainWindow: BrowserWindow, _error: string) {
    return;
  }

  @moduleEvent('on')
  public onConnectionStateChange(_mainWindow: BrowserWindow, _state: { connected: boolean }) {
    return;
  }

  @moduleEvent('on')
  public onRecordingStateChange(
    _mainWindow: BrowserWindow,
    _state: { outputActive: boolean; outputState: string; outputPath: string },
  ) {
    return;
  }
}
