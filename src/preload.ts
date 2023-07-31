// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge } from "electron";

import { nativeBridgeRegistry } from "./nativeBridge/registry";

contextBridge.exposeInMainWorld("native", {
  ...nativeBridgeRegistry.generateAPIObject(),
  platform: process.platform,
});
