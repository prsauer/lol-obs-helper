import { BrowserWindow, ipcMain } from 'electron';
import { moduleEvent, moduleFunction, nativeBridgeModule, NativeBridgeModule } from '../module';
import { FSWatcher, watch } from 'chokidar';
import { R3DLogWatcher } from '../../nativeUtils/logWatcher';
import type { Signal } from 'noobs';
import noobs from 'noobs';
import path from 'path';
import { Events } from '../ipcEvents';

const folderPathSeparator = process.platform === 'darwin' ? '/' : '\\';
const FOLDER_AGE_THRESHOLD = 10;

const obsModuleState = {
  libraryReady: false,
  recording: false,
  folderWatcher: null as FSWatcher | null,
  r3dWatcher: null as R3DLogWatcher | null,
  pluginPath: path.resolve(__dirname, 'dist', 'plugins'),
  dataPath: path.resolve(__dirname, 'dist', 'effects'),
  logPath: 'D:\\Video',
  recordingPath: 'D:\\Video',
  previewReady: false,
};

function parseRiotFolderDate(path: string) {
  if (!path.includes('T')) return null;
  try {
    const folderParts = path.split(folderPathSeparator);
    const folderName = folderParts[folderParts.length - 1];
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
export class ObsModule extends NativeBridgeModule {
  public startLogWatching(folder: string) {
    console.log(`New directory found: ${folder}`);

    if (obsModuleState.r3dWatcher) {
      obsModuleState.r3dWatcher.close();
    }
    obsModuleState.r3dWatcher = new R3DLogWatcher(folder);
    obsModuleState.r3dWatcher.on('new_line', (newline) => {
      console.log(newline);
      const maybeGameId = logLineExtractGameId(newline);
      console.log('gameId?', maybeGameId);
      if (maybeGameId !== null) {
        this.setRecordingNamePrefix(maybeGameId);
      }
      if (obsModuleState.recording && logLineHasExitMessage(newline)) {
        noobs.StopRecording();
        obsModuleState.recording = false;
      }
    });
  }

  public startFolderWatching(folder: string) {
    console.log(`Starting log folder watching: ${folder}`);
    if (obsModuleState.folderWatcher) {
      obsModuleState.folderWatcher.close();
    }
    obsModuleState.folderWatcher = watch(folder, {
      // cwd: folder,
      useFsEvents: false,
      awaitWriteFinish: true,
    });

    obsModuleState.folderWatcher.on('addDir', (path) => {
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

  @moduleFunction()
  public async configureSource(_mainWindow: BrowserWindow) {
    const sourceName = 'Default_Source';

    console.log('Creating source');
    noobs.CreateSource(sourceName, 'monitor_capture');

    console.log('Setting source settings');
    noobs.SetSourceSettings(sourceName, {});

    console.log('Getting source settings 1');
    const settings1 = noobs.GetSourceSettings(sourceName);
    console.log(settings1);
    noobs.SetSourceSettings(sourceName, { ...settings1, monitor: 1 });

    console.log('Getting source settings 2');
    const settings2 = noobs.GetSourceSettings(sourceName);
    console.log(settings2);

    console.log('Getting source properties');
    const properties = noobs.GetSourceProperties(sourceName);
    console.log('Source properties:', { properties });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.log('Source properties:', (properties[0] as unknown as any).items);

    console.log('Adding source to scene');
    noobs.AddSourceToScene(sourceName);
  }

  @moduleFunction()
  public resizeMovePreview(_mainWindow: BrowserWindow, x: number, y: number, width: number, height: number) {
    if (!obsModuleState.previewReady) {
      return;
    }
    noobs.ShowPreview(x, y, width, height);
  }

  @moduleFunction()
  public async startListening(mainWindow: BrowserWindow, riotFolder: string) {
    if (!obsModuleState.libraryReady) {
      console.log('OBS state at start of listening');
      console.log({ obsModuleState });
      console.log('ObsInit');

      const signalHandler = (sig: Signal) => {
        console.log('Signal received:', sig);
        switch (sig.id) {
          case 'starting':
            break;
          case 'start':
            obsModuleState.recording = true;
            ipcMain.emit(Events.RecordingStarted);
            // TODO: How to service args with noobs lib?
            // {
            //   outputActive: boolean;
            //   outputState: string;
            //   outputPath: string;
            // }
            this.onRecordingStateChange(mainWindow, {
              outputActive: true,
              outputState: 'recording',
              outputPath: '',
            });
            break;
          case 'stop':
            obsModuleState.recording = false;
            ipcMain.emit(Events.RecordingStopped);
            console.log({ lastRecording: noobs.GetLastRecording() });
            // TODO: How to service args with noobs lib?
            this.onRecordingStateChange(mainWindow, {
              outputActive: false,
              outputState: 'stopped',
              outputPath: '',
            });
            break;
          case 'stopping':
            break;
          case 'saved':
            break;
        }
      };
      console.log([
        obsModuleState.pluginPath,
        obsModuleState.dataPath,
        obsModuleState.logPath,
        obsModuleState.recordingPath,
        signalHandler,
      ]);
      // TODO: init with buffering disabled
      noobs.Init(
        obsModuleState.pluginPath,
        obsModuleState.logPath,
        obsModuleState.dataPath,
        obsModuleState.recordingPath,
        signalHandler,
      );
      this.configureSource(mainWindow);

      console.log('Getting native window handle');
      const hwnd = mainWindow.getNativeWindowHandle();
      console.log({ hwnd, mainWindow });
      console.log('Init preview');
      noobs.InitPreview(hwnd);
      noobs.ShowPreview(500, 400, 1920 / 4, 1080 / 4);
      obsModuleState.previewReady = true;
      obsModuleState.libraryReady = true; // TODO: move this into signal?
    }

    if (obsModuleState.folderWatcher === null) {
      this.startFolderWatching(riotFolder);
    }
  }

  @moduleFunction()
  public startRecording(_mainWindow: BrowserWindow) {
    if (!obsModuleState.libraryReady) {
      return;
    }
    obsModuleState.recording = true;

    console.log('Starting recording');
    noobs.StartRecording(0);
  }

  @moduleFunction()
  public stopRecording(_mainWindow: BrowserWindow) {
    if (!obsModuleState.libraryReady) {
      return;
    }
    obsModuleState.recording = false;
    noobs.StopRecording();
  }

  public async setRecordingNamePrefix(_prefix: string) {
    if (!obsModuleState.libraryReady) {
      return;
    }
  }

  @moduleEvent('on')
  public logMessage(_mainWindow: BrowserWindow, _message: string) {
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
