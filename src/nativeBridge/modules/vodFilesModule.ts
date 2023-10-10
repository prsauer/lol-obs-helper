import { BrowserWindow, net, protocol } from "electron";
import {
  nativeBridgeModule,
  NativeBridgeModule,
  moduleFunction,
} from "../module";
import {
  openSync,
  readdirSync,
  statSync,
  readFileSync,
  readSync,
  closeSync,
  createReadStream,
  ReadStream,
} from "fs-extra";
import { google } from "googleapis";

async function insert(body: ReadStream, title: string, description: string) {
  const service = google.youtube("v3");
  const res = await service.videos.insert({
    access_token: "redacted",
    part: ["snippet"],
    requestBody: {
      snippet: {
        title,
        description,
      },
    },
    media: {
      mimeType: "video/x-matroska",
      body,
    },
  });
  console.log({ res });
  return res;
}

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

  /** Bot games only have TeamOrder, no TeamChaos members */
  /** we would like to exclude them */
  let hasTeamChaos = false;

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

    if (line.includes("TeamChaos")) {
      hasTeamChaos = true;
    }
  });

  console.log({ summonerPuuid, matchId, hasTeamChaos });
  if (summonerPuuid && matchId && hasTeamChaos) {
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

const fnSeparator = process.platform === "darwin" ? "/" : "\\";

@nativeBridgeModule("vods")
export class VodFilesModule extends NativeBridgeModule {
  @moduleFunction()
  public async scanFolderForMatches(
    _mainWindow: BrowserWindow,
    riotLogsFolder: string
  ) {
    // console.log(`Scanning ${riotLogsFolder} for matches`);
    const dirListing = readdirSync(riotLogsFolder);
    for (let i = 0; i < dirListing.length; i++) {
      if (dirListing[i] in folderNamesCached) continue;
      const potentialLogFile =
        riotLogsFolder +
        fnSeparator +
        dirListing[i] +
        fnSeparator +
        dirListing[i] +
        "_r3dlog.txt";
      // console.log("reading", potentialLogFile);
      const fd = openSync(potentialLogFile, "r");
      const stats = statSync(potentialLogFile);
      const data = readFileSync(fd);
      const lines = data.toString().split("\n");
      const info = scanLogFileForInfo(lines);
      if (info === null) continue;

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
  public async configureVodsFolderProtocol(
    _mainWindow: BrowserWindow,
    vodsFolder: string
  ) {
    if (protocol.isProtocolHandled("vod")) {
      protocol.unhandle("vod");
    }
    protocol.handle("vod", async (request) => {
      const filename = decodeURI(request.url).slice(
        "vod://".length,
        request.url.length - 3
      );

      const localFilePath = `${vodsFolder}${fnSeparator}${filename}`;

      const rangeReq = request.headers.get("Range") || "bytes=0-";
      const parts = rangeReq.split("=");
      const numbers = parts[1].split("-").map((p) => parseInt(p));

      const fp = openSync(localFilePath, "r");
      const size = 2500000; // ~2.5mb chunks
      const start = numbers[0] || 0;
      const buffer = Buffer.alloc(size);
      readSync(fp, buffer, 0, size, start);

      const stats = statSync(localFilePath);
      const totalSize = stats.size;
      closeSync(fp);

      return new Response(buffer, {
        status: 206,
        statusText: "Partial Content",
        headers: {
          "Content-Length": `${totalSize}`,
          "Accept-Ranges": "bytes",
          "Content-Range": `bytes ${start}-${totalSize}`,
        },
      });
    });
  }

  @moduleFunction()
  public async insertVod(
    _mainWindow: BrowserWindow,
    vodPath: string,
    title: string,
    description: string
  ) {
    console.log("reading", vodPath);
    const res = createReadStream(vodPath);
    await insert(res, title, description);
  }

  @moduleFunction()
  public async getVodsInfo(_mainWindow: BrowserWindow, vodPath: string) {
    const rootPath = vodPath;
    const dir = readdirSync(rootPath);
    const res = dir.filter((fn) => fn.length >= 23);
    const stats = res
      .map((fn) => ({ name: fn, stats: statSync(rootPath + "/" + fn) }))
      .map((fd) => {
        return {
          name: fd.name,
          ended: fd.stats.mtime,
        };
      });
    return stats;
  }
}
