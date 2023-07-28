import { R3DLogWatcher } from "./logWatcher";

const watcher = new R3DLogWatcher(
  "C:\\Riot Games\\League of Legends\\Logs\\GameLogs\\TEST\\"
);

watcher.on("new_line", (newline) => {
  console.log(newline);
});
