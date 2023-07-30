import { BrowserWindow } from "electron";
import {
  nativeBridgeModule,
  NativeBridgeModule,
  moduleFunction,
} from "../module";
import { readdirSync, statSync } from "fs-extra";

@nativeBridgeModule("vods")
export class vodFilesModule extends NativeBridgeModule {
  @moduleFunction()
  public async getVodsInfo(_mainWindow: BrowserWindow) {
    const rootPath = "D:\\Video";
    const dir = readdirSync(rootPath);
    const res = dir.filter((fn) => fn.length === 23);
    const stats = res
      .map((fn) => ({ name: fn, stats: statSync(rootPath + "\\" + fn) }))
      .map((fd) => {
        return {
          name: fd.name,
          ended: fd.stats.mtime,
        };
      });
    return stats;
  }
}
