/* eslint-disable @typescript-eslint/ban-types */
import {
  BrowserWindow,
  ipcMain,
  ipcRenderer,
  IpcRendererEvent,
} from "electron";

import {
  getModuleEventKey,
  getModuleFunctionKey,
  MODULE_METADATA,
  NativeBridgeModule,
} from "./module";
import { OBSWSModule } from "./modules/OBSWSModule";
import { TrayIconModule } from "./modules/TrayIconModule";
import { VodFilesModule } from "./modules/VodFilesModule";
import { ExternalLinksModule } from "./modules/ExternalLinksModule";

export class NativeBridgeRegistry {
  private modules: NativeBridgeModule[] = [];

  public registerModule<T extends NativeBridgeModule>(
    moduleClass: new () => T
  ): void {
    const module = new moduleClass();
    this.modules.push(module);
  }

  public generateAPIObject(): Object {
    return Object.assign(
      {},
      ...this.modules.map((module) => {
        const ctor = Object.getPrototypeOf(module).constructor;
        const moduleMetadata = MODULE_METADATA.get(ctor);
        if (!moduleMetadata) {
          throw new Error("module metadata not found");
        }

        const moduleApi: Record<string, Object> = {};

        Object.values(moduleMetadata.functions).forEach((func) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          moduleApi[func.name] = (...args: any[]) => {
            return ipcRenderer.invoke(
              getModuleFunctionKey(moduleMetadata.name, func.name),
              ...args
            );
          };
        });

        Object.values(moduleMetadata.events).forEach((evt) => {
          moduleApi[evt.name] = (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            callback: (event: IpcRendererEvent, ...args: any[]) => void
          ) =>
            evt.type === "on"
              ? ipcRenderer.on(
                  getModuleEventKey(moduleMetadata.name, evt.name),
                  callback
                )
              : ipcRenderer.once(
                  getModuleEventKey(moduleMetadata.name, evt.name),
                  callback
                );

          moduleApi[`removeAll_${evt.name}_listeners`] = () =>
            ipcRenderer.removeAllListeners(
              getModuleEventKey(moduleMetadata.name, evt.name)
            );
        });

        return {
          [moduleMetadata.name]: moduleApi,
        };
      })
    );
  }

  public startListeners(mainWindow: BrowserWindow): void {
    this.modules.forEach((module) => {
      const ctor = Object.getPrototypeOf(module).constructor;
      const moduleMetadata = MODULE_METADATA.get(ctor);
      if (!moduleMetadata) {
        throw new Error("module metadata not found");
      }

      Object.values(moduleMetadata.functions).forEach((func) => {
        ipcMain.handle(
          getModuleFunctionKey(moduleMetadata.name, func.name),
          async (_event, ...args) => {
            return func.value.bind(module)(mainWindow, ...args);
          }
        );
      });

      module.onRegistered(mainWindow);
    });
  }
}

export const nativeBridgeRegistry = new NativeBridgeRegistry();

nativeBridgeRegistry.registerModule(ExternalLinksModule);
nativeBridgeRegistry.registerModule(VodFilesModule);
nativeBridgeRegistry.registerModule(TrayIconModule);
nativeBridgeRegistry.registerModule(OBSWSModule);
