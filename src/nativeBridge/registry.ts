/* eslint-disable @typescript-eslint/ban-types */
import { BrowserWindow, ipcMain } from "electron";

import {
  getModuleFunctionKey,
  MODULE_METADATA,
  NativeBridgeModule,
} from "./module";
import { OBSWSModule } from "./modules/obsWSModule";
import { TrayIconModule } from "./modules/trayIconModule";
import { VodFilesModule } from "./modules/vodFilesModule";
import { ExternalLinksModule } from "./modules/externalLinksModule";
import { LoginModule } from "./modules/loginModule";

export class NativeBridgeRegistry {
  private modules: NativeBridgeModule[] = [];

  public registerModule<T extends NativeBridgeModule>(
    moduleClass: new () => T
  ): void {
    const module = new moduleClass();
    this.modules.push(module);
  }

  public generateAPIObject() {
    console.log(`const genApi = {`);
    this.modules.forEach((module) => {
      const ctor = Object.getPrototypeOf(module).constructor;
      const moduleMetadata = MODULE_METADATA.get(ctor);
      if (!moduleMetadata) {
        throw new Error("module metadata not found");
      }

      console.log(`${moduleMetadata.name}: {`);
      Object.values(moduleMetadata.functions).forEach((func) => {
        console.log(
          `${
            func.name
          }: (...args: any[]) => ipcRenderer.invoke("${getModuleFunctionKey(
            moduleMetadata.name,
            func.name
          )}", ...args),`
        );
      });

      Object.values(moduleMetadata.events).forEach((evt) => {
        if (evt.type === "on") {
          console.log(
            `${
              evt.name
            }: (callback: (event: IpcRendererEvent, ...args: any[]) => void) => ipcRenderer.on("${getModuleFunctionKey(
              moduleMetadata.name,
              evt.name
            )}", callback),`
          );
        } else {
          console.log(
            `${
              evt.name
            }: (callback: (event: IpcRendererEvent, ...args: any[]) => void) => ipcRenderer.once("${getModuleFunctionKey(
              moduleMetadata.name,
              evt.name
            )}", callback),`
          );
        }
        console.log(
          `removeAll_${
            evt.name
          }_listeners: () => ipcRenderer.removeAllListeners("${getModuleFunctionKey(
            moduleMetadata.name,
            evt.name
          )}"),`
        );
      });

      console.log(`},`);
    });
    console.log("};");
  }

  public generateAPIType() {
    console.log("========================================");

    console.log(
      `type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R ? (...args: P) => R : never;`
    );

    console.log(`type NativeApi = {`);
    this.modules.forEach((module) => {
      const ctor = Object.getPrototypeOf(module).constructor;
      const moduleMetadata = MODULE_METADATA.get(ctor);
      if (!moduleMetadata) {
        throw new Error("module metadata not found");
      }

      console.log(`${moduleMetadata.name}: {`);
      Object.values(moduleMetadata.functions).forEach((func) => {
        console.log(
          `${func.name}: OmitFirstArg<${moduleMetadata.constructor.name}["${func.name}"]>,`
        );
      });

      Object.values(moduleMetadata.events).forEach((evt) => {
        console.log(
          `${evt.name}: (callback: (evt: ElectronOpaqueEvent, a: Parameters<${moduleMetadata.constructor.name}["${evt.name}"]>) => void) => void,`
        );
        console.log(`removeAll_${evt.name}_listeners: () => void,`);
      });

      console.log(`},`);
    });
    console.log("};");
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
nativeBridgeRegistry.registerModule(LoginModule);
