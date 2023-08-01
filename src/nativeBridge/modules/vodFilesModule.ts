import { BrowserWindow } from "electron";
import {
  nativeBridgeModule,
  NativeBridgeModule,
  moduleFunction,
} from "../module";
import { openSync, readdirSync, statSync, readFileSync } from "fs-extra";

const gameIdRegex = /GameID=([0-9]*)"/;
const platformIdRegex = /PlatformID=([0-9a-zA-Z]*)"/;
const regionRegex = /Region=([0-9a-zA-Z]*)"/;

const puuidRegex = /PUUID\(([a-z0-9-]*)\)/;
const summonerNameRegex = /'(.*)'/;

const scanLogFileForInfo = (lines: string[]) => {
  let matchId: string | undefined;
  let summonerName: string | undefined;
  let summonerPuuid: string | undefined;
  let platformId: string | undefined;
  let region: string | undefined;

  lines.forEach((line) => {
    if (line.includes("**LOCAL**") && line.includes("ROST")) {
      const puuidSearch = puuidRegex.exec(line);
      summonerPuuid = puuidSearch?.[1];

      const summonerNameSearch = summonerNameRegex.exec(line);
      summonerName = summonerNameSearch?.[1];
    }
    if (line.includes("Command Line")) {
      const gameIdSearch = gameIdRegex.exec(line);
      matchId = gameIdSearch?.[1];

      const platformIdSearch = platformIdRegex.exec(line);
      platformId = platformIdSearch?.[1];

      const regionSearch = regionRegex.exec(line);
      region = regionSearch?.[1];
    }
  });

  if (summonerPuuid && matchId) {
    return {
      matchId,
      summonerName,
      summonerPuuid,
      platformId,
      region,
    };
  }
  return null;
};

type FolderInfo = {
  matchId?: string;
  summonerName?: string;
  summonerPuuid?: string;
  platformId?: string;
  region?: string;
  logPath: string;
  createdTime: number;
};

const folderNamesCached: Record<string, boolean> = {};
const folderInfoCache: FolderInfo[] = [];

@nativeBridgeModule("vods")
export class vodFilesModule extends NativeBridgeModule {
  @moduleFunction()
  public async scanFolderForMatches(
    _mainWindow: BrowserWindow,
    riotLogsFolder: string
  ) {
    const dirListing = readdirSync(riotLogsFolder);
    for (let i = 0; i < dirListing.length; i++) {
      if (dirListing[i] in folderNamesCached) continue;
      const potentialLogFile =
        riotLogsFolder +
        "\\" +
        dirListing[i] +
        "\\" +
        dirListing[i] +
        "_r3dlog.txt";
      const fd = openSync(potentialLogFile, "r");
      const stats = statSync(potentialLogFile);
      const data = readFileSync(fd);
      const lines = data.toString().split("\n");
      const info = scanLogFileForInfo(lines);
      if (info === null) continue;
      console.log({
        info,
        logPath: dirListing[i],
      });

      folderNamesCached[dirListing[i]] = true;
      folderInfoCache.push({
        ...info,
        createdTime: stats.birthtimeMs,
        logPath: dirListing[i],
      });
    }
    folderInfoCache.sort((a, b) => b.createdTime - a.createdTime);

    return folderInfoCache;
  }

  @moduleFunction()
  public async getVodsInfo(_mainWindow: BrowserWindow, vodPath: string) {
    const rootPath = vodPath;
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
