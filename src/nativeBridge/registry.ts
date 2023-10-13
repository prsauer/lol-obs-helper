/* eslint-disable @typescript-eslint/ban-types */
import { BrowserWindow, ipcMain } from "electron";

import {
  getModuleFunctionKey,
  MODULE_METADATA,
  NativeBridgeModule,
} from "./module";
import { OBSWSModule } from "./modules/oBSWSModule";
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
    let apiString = `/* eslint-disable @typescript-eslint/no-explicit-any */\nimport { IpcRendererEvent, ipcRenderer } from "electron";\n\nexport const modulesApi = {`;
    this.modules.forEach((module) => {
      const ctor = Object.getPrototypeOf(module).constructor;
      const moduleMetadata = MODULE_METADATA.get(ctor);
      if (!moduleMetadata) {
        throw new Error("module metadata not found");
      }

      apiString += `${moduleMetadata.name}: {`;
      Object.values(moduleMetadata.functions).forEach((func) => {
        apiString += `${
          func.name
        }: (...args: any[]) => ipcRenderer.invoke("${getModuleFunctionKey(
          moduleMetadata.name,
          func.name
        )}", ...args),`;
      });

      Object.values(moduleMetadata.events).forEach((evt) => {
        if (evt.type === "on") {
          apiString += `${
            evt.name
          }: (callback: (event: IpcRendererEvent, ...args: any[]) => void) => ipcRenderer.on("${getModuleFunctionKey(
            moduleMetadata.name,
            evt.name
          )}", callback),`;
        } else {
          apiString += `${
            evt.name
          }: (callback: (event: IpcRendererEvent, ...args: any[]) => void) => ipcRenderer.once("${getModuleFunctionKey(
            moduleMetadata.name,
            evt.name
          )}", callback),`;
        }
        apiString += `removeAll_${
          evt.name
        }_listeners: () => ipcRenderer.removeAllListeners("${getModuleFunctionKey(
          moduleMetadata.name,
          evt.name
        )}"),`;
      });

      apiString += `},`;
    });
    apiString += "};";
    return apiString;
  }

  public generateAPIType(modulesPath: string) {
    let typeString = `/* eslint-disable @typescript-eslint/no-explicit-any */\n`;
    this.modules.forEach((module) => {
      const ctor = Object.getPrototypeOf(module).constructor;
      const moduleMetadata = MODULE_METADATA.get(ctor);
      if (!moduleMetadata) {
        throw new Error("module metadata not found");
      }
      const casedName =
        moduleMetadata.constructor.name[0].toLowerCase() +
        moduleMetadata.constructor.name.slice(
          1,
          moduleMetadata.constructor.name.length
        );

      typeString += `import { ${moduleMetadata.constructor.name} } from "${modulesPath}${casedName}";\n`;
    });

    typeString += `\ntype OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R ? (...args: P) => R : never;\n\n`;

    typeString += `type NativeApi = {`;
    this.modules.forEach((module) => {
      const ctor = Object.getPrototypeOf(module).constructor;
      const moduleMetadata = MODULE_METADATA.get(ctor);
      if (!moduleMetadata) {
        throw new Error("module metadata not found");
      }

      typeString += `${moduleMetadata.name}: {`;
      Object.values(moduleMetadata.functions).forEach((func) => {
        typeString += `${func.name}: OmitFirstArg<${moduleMetadata.constructor.name}["${func.name}"]>,`;
      });

      Object.values(moduleMetadata.events).forEach((evt) => {
        typeString += `${evt.name}: (callback: (evt: ElectronOpaqueEvent, a: Parameters<${moduleMetadata.constructor.name}["${evt.name}"]>) => void) => void,`;
        typeString += `removeAll_${evt.name}_listeners: () => void,`;
      });

      typeString += `},`;
    });
    typeString += "};\n\n";
    typeString += `declare global {
      interface Window {
        native: NativeApi;
      }
    }
    `;

    return typeString;
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
