import { BrowserWindow, ipcMain } from 'electron';
import { moduleEvent, moduleFunction, nativeBridgeModule, NativeBridgeModule } from '../module';
import type { Signal } from 'noobs';
import noobs from 'noobs';
import path from 'path';
import { Events } from '../ipcEvents';
import { nativeBridgeRegistry } from '../registry';
import { LeagueLiveClientModule } from './leagueLiveClientModule';

type ObsModuleState = {
  libraryReady: boolean;
  recording: boolean;
  listeningForGame: boolean;
  pluginPath: string;
  dataPath: string;
  logPath: string;
  recordingPath: string;
  previewReady: boolean;
};
type ObsModuleStateDTO = {
  libraryReady: boolean;
  previewReady: boolean;
  recording: boolean;
  pluginPath: string;
  listeningForGame: boolean;
  dataPath: string;
  recordingPath: string;
  logPath: string;
};

const obsModuleState: ObsModuleState = {
  libraryReady: false,
  recording: false,
  listeningForGame: false,
  pluginPath: path.resolve(__dirname, 'dist', 'plugins'),
  dataPath: path.resolve(__dirname, 'dist', 'effects'),
  logPath: 'D:\\Video',
  recordingPath: 'D:\\Video',
  previewReady: false,
};

@nativeBridgeModule('obs')
export class ObsModule extends NativeBridgeModule {
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
    noobs.SetSourceSettings(sourceName, { ...settings1, monitor: 0 });

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
  public async startListening(mainWindow: BrowserWindow) {
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
            this.emitStateChange(mainWindow);
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
            this.emitStateChange(mainWindow);
            break;
          case 'stopping':
            break;
          case 'saved':
            break;
        }
      };

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
      this.emitStateChange(mainWindow);
    }

    this.startListeningForGame(mainWindow);
  }

  private async startListeningForGame(mainWindow: BrowserWindow) {
    if (obsModuleState.listeningForGame) {
      return;
    }
    obsModuleState.listeningForGame = true;
    const leagueModule = nativeBridgeRegistry.getModule('LeagueLiveClientModule') as LeagueLiveClientModule;
    await leagueModule.startListeningForGame(mainWindow);
    ipcMain.addListener(Events.LeagueGameDetected, (gameData) => {
      console.log('League game detected', gameData);
      this.startRecording(mainWindow);
    });
    ipcMain.addListener(Events.LeagueGameEnded, (gameData) => {
      console.log('League game ended', gameData);
      this.stopRecording(mainWindow);
    });
  }

  @moduleFunction()
  public async startRecording(_mainWindow: BrowserWindow) {
    if (!obsModuleState.libraryReady) {
      return;
    }
    obsModuleState.recording = true;

    const leagueModule = nativeBridgeRegistry.getModule('LeagueLiveClientModule') as LeagueLiveClientModule;
    const activePlayerName = await leagueModule.getActivePlayerName(_mainWindow);
    console.log({ activePlayerName });

    console.log('Starting recording');
    noobs.StartRecording(0);
    this.emitStateChange(_mainWindow);
  }

  @moduleFunction()
  public stopRecording(_mainWindow: BrowserWindow) {
    if (!obsModuleState.libraryReady) {
      return;
    }
    obsModuleState.recording = false;
    noobs.StopRecording();
    this.emitStateChange(_mainWindow);
  }

  public async setRecordingNamePrefix(_prefix: string) {
    if (!obsModuleState.libraryReady) {
      return;
    }
  }

  @moduleFunction()
  public async readObsModuleState(_mainWindow: BrowserWindow): Promise<ObsModuleStateDTO> {
    return {
      libraryReady: obsModuleState.libraryReady,
      previewReady: obsModuleState.previewReady,
      recording: obsModuleState.recording,
      pluginPath: obsModuleState.pluginPath,
      listeningForGame: obsModuleState.listeningForGame,
      dataPath: obsModuleState.dataPath,
      recordingPath: obsModuleState.recordingPath,
      logPath: obsModuleState.logPath,
    };
  }

  @moduleEvent('on')
  public logMessage(_mainWindow: BrowserWindow, _message: string) {
    return;
  }

  private emitStateChange(mainWindow: BrowserWindow) {
    this.onObsModuleStateChange(mainWindow, {
      libraryReady: obsModuleState.libraryReady,
      previewReady: obsModuleState.previewReady,
      recording: obsModuleState.recording,
      pluginPath: obsModuleState.pluginPath,
      dataPath: obsModuleState.dataPath,
      listeningForGame: obsModuleState.listeningForGame,
      recordingPath: obsModuleState.recordingPath,
      logPath: obsModuleState.logPath,
    });
  }

  @moduleEvent('on')
  public onObsModuleStateChange(_mainWindow: BrowserWindow, _state: ObsModuleStateDTO) {
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
