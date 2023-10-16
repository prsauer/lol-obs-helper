import { BrowserWindow } from 'electron';
import { moduleEvent, NativeBridgeModule, nativeBridgeModule } from '../module';

@nativeBridgeModule('login')
export class LoginModule extends NativeBridgeModule {
  @moduleEvent('on')
  public didLogin(_mainWindow: BrowserWindow, _token: string) {
    return;
  }
}
