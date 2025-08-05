import { app, BrowserWindow, Menu, Tray } from 'electron';
import { NativeBridgeModule, moduleFunction, nativeBridgeModule } from '../module';
import { bus } from '../bus';

@nativeBridgeModule('trayIcon')
export class TrayIconModule extends NativeBridgeModule {
  private trayIcon: Tray | null = null;

  @moduleFunction()
  public async hideToSystemTray(mainWindow: BrowserWindow): Promise<void> {
    mainWindow.hide();
  }

  public onRegistered(mainWindow: BrowserWindow): void {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path');
    try {
      this.trayIcon = new Tray(path.resolve('./.webpack/main/assets/icon.ico'));
      const trayMenu = Menu.buildFromTemplate([
        {
          label: 'Show',
          click: () => {
            mainWindow.show();
          },
        },
        {
          label: 'Quit',
          click: () => {
            app.quit();
          },
        },
      ]);
      this.trayIcon.setContextMenu(trayMenu);
      this.trayIcon.setToolTip('LoL OBS Helper');
      this.trayIcon.on('click', () => {
        mainWindow.show();
      });
    } catch (e) {
      console.error(e);
    }

    bus.onRecordingStarted(() => {
      this.trayIcon?.setImage(path.resolve('./.webpack/main/assets/icon_red.ico'));
    });
    bus.onRecordingStopped(() => {
      this.trayIcon?.setImage(path.resolve('./.webpack/main/assets/icon.ico'));
    });
  }
}
