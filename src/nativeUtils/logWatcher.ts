import EventEmitter from "eventemitter3";
import { FSWatcher, watch } from "chokidar";
import { openSync, readSync, closeSync, Stats, statSync } from "fs-extra";

export class R3DLogWatcher extends EventEmitter {
  private watcher: FSWatcher;
  private lastKnownState: {
    lastFileCreationTime: number;
    lastFileSize: number;
  };

  private partialReadBuffer: string;

  constructor(directory: string) {
    super();
    this.partialReadBuffer = "";
    this.lastKnownState = {
      lastFileCreationTime: 0,
      lastFileSize: 0,
    };

    this.watcher = watch(directory);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const base = this;
    console.log("R3D watching " + directory);
    this.watcher.on("add", function (path) {
      console.log("add", path);
      if (path.includes("r3dlog")) {
        base.inspectR3DLog(path);
      }
    });
    this.watcher.on("change", function (path) {
      console.log("change", path);
      if (path.includes("r3dlog")) {
        base.inspectR3DLog(path);
      }
    });
  }

  inspectR3DLog(filePath: string) {
    const stats = statSync(filePath);

    const fileSizeDelta = (stats?.size || 0) - this.lastKnownState.lastFileSize;

    this.parseLogFileChunk(
      filePath,
      this.lastKnownState.lastFileSize,
      fileSizeDelta
    );

    this.updateLastKnownStats(stats);
  }

  parseLogFileChunk(path: string, start: number, size: number) {
    console.log("parseChunk", path, start, size);
    if (size <= 0) return true;

    const fd = openSync(path, "r");
    const buffer = Buffer.alloc(size);
    readSync(fd, buffer, 0, size, start);
    closeSync(fd);
    let bufferString = buffer.toString("utf-8");

    // Was there a partial line left over from a previous call?
    if (this.partialReadBuffer) {
      bufferString = this.partialReadBuffer + bufferString;
    }
    const lines = bufferString.split("\n");
    lines.forEach((line, idx) => {
      if (idx === lines.length - 1) {
        if (line.length > 0) {
          this.partialReadBuffer = line;
        }
      } else {
        this.emitLine(line);
      }
    });
  }

  emitLine(line: string) {
    this.emit("new_line", line);
  }

  updateLastKnownStats(stats: Stats | undefined) {
    this.lastKnownState = {
      lastFileCreationTime: stats?.birthtimeMs || 0,
      lastFileSize: stats?.size || 0,
    };
  }

  close(): void {
    this.watcher.close();
  }
}
