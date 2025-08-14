import { BrowserWindow } from 'electron';
import { nativeBridgeModule, NativeBridgeModule, moduleFunction } from '../module';
import { openSync, readdirSync, statSync, readFileSync, createReadStream, ReadStream, writeFileSync } from 'fs-extra';
import path from 'path';
import { google } from 'googleapis';
import { ActivityEndedEvent, ActivityStartedEvent, RecordingWrittenEvent, BusEvents } from '../events';
import { bus } from '../bus';
import type { FolderInfo, ActivityRecord } from '../../types';

async function insert(token: string, body: ReadStream, title: string, description: string) {
  const service = google.youtube('v3');
  const res = await service.videos.insert({
    access_token: token,
    part: ['snippet'],
    requestBody: {
      snippet: {
        title,
        description,
      },
    },
    media: {
      mimeType: 'video/x-matroska',
      body,
    },
  });
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
    if (line.includes('**LOCAL**') && line.includes('ROST')) {
      const puuidSearch = puuidRegex.exec(line);
      summonerPuuid = puuidSearch?.[1];

      const summonerNameSearch = summonerNameRegex.exec(line);
      summonerName = summonerNameSearch?.[1];
    }
    if (line.includes('Command Line')) {
      const gameIdSearch = gameIdRegex.exec(line);
      matchId = gameIdSearch?.[1];

      const platformIdSearch = platformIdRegex.exec(line);
      platformId = platformIdSearch?.[1];

      const regionSearch = regionRegex.exec(line);
      region = regionSearch?.[1];
    }

    if (line.includes('TeamChaos')) {
      hasTeamChaos = true;
    }
  });

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

const folderNamesCached: Record<string, boolean> = {};
const folderInfoCache: FolderInfo[] = [];

const fnSeparator = process.platform === 'darwin' ? '/' : '\\';

@nativeBridgeModule('vods')
export class VodFilesModule extends NativeBridgeModule {
  private activityEvents: (ActivityStartedEvent | ActivityEndedEvent)[] = [];
  private vodsDir = 'D:\\Video\\';

  constructor() {
    super();
    this.activityEvents = [];

    bus.onActivityStarted((data) => {
      this.activityEvents.push(data);
    });

    bus.onActivityEnded((data) => {
      this.activityEvents.push(data);
    });

    bus.onRecordingWritten((data) => {
      this.writeActivityData(data);
    });
  }

  private writeActivityData(data: RecordingWrittenEvent) {
    const activityStarted = this.activityEvents.find(
      (event): event is ActivityStartedEvent =>
        event.type === BusEvents.ActivityStarted && event.activityId === data.activityId,
    );
    const activityEnded = this.activityEvents.find(
      (event): event is ActivityEndedEvent =>
        event.type === BusEvents.ActivityEnded && event.activityId === data.activityId,
    );

    const activityData: ActivityRecord = {
      timestamp: data.timestamp.getTime(),
      start: activityStarted,
      end: activityEnded,
      recording: data,
    };

    const filename = `activity-${data.activityId}.json`;
    const filepath = path.join(this.vodsDir, filename);

    writeFileSync(filepath, JSON.stringify(activityData, null, 2));
  }

  @moduleFunction()
  public async scanFolderForMatches(_mainWindow: BrowserWindow, riotLogsFolder: string) {
    const dirListing = readdirSync(riotLogsFolder);
    for (let i = 0; i < dirListing.length; i++) {
      if (dirListing[i] in folderNamesCached) continue;
      const potentialLogFile =
        riotLogsFolder + fnSeparator + dirListing[i] + fnSeparator + dirListing[i] + '_r3dlog.txt';
      const fd = openSync(potentialLogFile, 'r');
      const stats = statSync(potentialLogFile);
      const data = readFileSync(fd);
      const lines = data.toString().split('\n');
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
  public async insertVod(
    _mainWindow: BrowserWindow,
    token: string,
    vodPath: string,
    title: string,
    description: string,
  ) {
    const res = createReadStream(vodPath);
    await insert(token, res, title, description);
  }

  @moduleFunction()
  public async getActivitiesData(_mainWindow: BrowserWindow, vodPath: string): Promise<ActivityRecord[]> {
    // look for activity-*.json in the vodPath
    const dir = readdirSync(vodPath);
    const activityFiles = dir.filter((fn) => fn.startsWith('activity-') && fn.endsWith('.json'));
    const activityData = activityFiles.map((fn) => {
      const data = readFileSync(path.join(vodPath, fn));
      return JSON.parse(data.toString()) as ActivityRecord;
    });
    return activityData.sort((a, b) => a.timestamp - b.timestamp);
  }

  @moduleFunction()
  public async getVodsInfo(_mainWindow: BrowserWindow, vodPath: string) {
    const rootPath = vodPath;
    const dir = readdirSync(rootPath);

    // Common video file extensions
    const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];

    const res = dir.filter((fn) => {
      const fullPath = rootPath + '/' + fn;
      const stats = statSync(fullPath);

      // Only include files (not directories)
      if (!stats.isFile()) {
        return false;
      }

      // Check if file has a video extension
      const hasVideoExtension = videoExtensions.some((ext) => fn.toLowerCase().endsWith(ext.toLowerCase()));

      return hasVideoExtension;
    });

    const stats = res
      .map((fn) => ({ name: fn, stats: statSync(rootPath + '/' + fn) }))
      .map((fd) => {
        return {
          name: fd.name,
          ended: fd.stats.mtime,
        };
      });
    return stats;
  }
}
