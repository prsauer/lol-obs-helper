import { BrowserWindow } from "electron";

import {
  moduleFunction,
  NativeBridgeModule,
  nativeBridgeModule,
} from "../module";

@nativeBridgeModule("login")
export class LoginModule extends NativeBridgeModule {
  @moduleFunction()
  public login(
    mainWindow: Electron.BrowserWindow,
    absoluteAuthUrl: string,
    windowTitle: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const mainWindowPosition = mainWindow.getPosition();
      let resolved = false;

      const loginModalWindow = new BrowserWindow({
        backgroundColor: "#000000",
        title: windowTitle,
        x: mainWindowPosition ? mainWindowPosition[0] + 200 : 200,
        y: mainWindowPosition ? mainWindowPosition[1] + 100 : 200,
        width: 800,
        height: 800,
        maximizable: false,
        minimizable: false,
        parent: mainWindow,
        modal: true,
        webPreferences: {
          nodeIntegration: false,
          sandbox: true,
        },
      });
      loginModalWindow.setMenuBarVisibility(false);
      loginModalWindow.on("closed", () => {
        // if the window is closed before resolving, that means the user closed it.
        // In that case we reject the promise.
        if (!resolved) {
          reject();
        }
      });
      loginModalWindow.webContents.on("did-navigate", (_event, url) => {
        console.log("nav", url);
        if (url.includes("wave?")) {
          const b64Token = url.split("?")[1];
          resolved = true;
          resolve(atob(b64Token));
          loginModalWindow.close();
        }
      });
      loginModalWindow.loadURL(absoluteAuthUrl);
    });
  }
}
