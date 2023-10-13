/* eslint-disable @typescript-eslint/no-explicit-any */
// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge } from "electron";
import { modulesApi } from "./preloadApi";

contextBridge.exposeInMainWorld("native", {
  ...modulesApi,
  platform: process.platform,
});
