import { BrowserWindow } from 'electron';
import { moduleEvent, NativeBridgeModule, nativeBridgeModule } from '../module';
import type { TokenType } from '../../types';

@nativeBridgeModule('login')
export class LoginModule extends NativeBridgeModule {
  @moduleEvent('on')
  public didLogin(_mainWindow: BrowserWindow, _token: TokenType) {
    return;
  }
}
