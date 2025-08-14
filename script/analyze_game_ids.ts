import * as fs from 'fs';
import { generateGameId } from '../src/nativeBridge/modules/leagueLiveClientModule';
import { AllGameData } from '../src/nativeBridge/modules/leagueLiveClientTypes';

interface LogEntry {
  timestamp: string;
  endpoint: string;
  response: AllGameData;
  responseTime: number;
  status: number;
  timeout: boolean;
}

function processLogFile(): void {
  const logFile = 'logs/league-api/league-api-2025-08-14.log';
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n').filter((line) => line.trim());

  // Target timestamps from your console log
  const targetLogLines: number[] = [25, 27, 260, 845];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Parse the entire line as JSON
    const logEntry: LogEntry = JSON.parse(line);

    // Check if this is a game data response
    if (logEntry.endpoint === '/liveclientdata/allgamedata' && logEntry.response && logEntry.response.allPlayers) {
      const gameData = logEntry.response;
      const gameId = generateGameId(gameData);

      const eventCount = gameData.events?.Events?.length || 0;
      let gst: number | undefined;
      if (eventCount > 0) {
        gst = gameData.events?.Events?.find((e) => e.EventName === 'GameStart')?.EventTime;
      }
      // champ names
      const names = gameData.allPlayers.map((p) => p.rawSkinName).join(', ');
      console.log(`${i}, gameId=${gameId}, eventCount=${eventCount}, gst=${gst}, names=${names}`);
    }
  }

  for (const lineNumber of targetLogLines) {
    const writeEntry = lines[lineNumber - 1];
    const logEntry: LogEntry = JSON.parse(writeEntry);
    // write json dump to line-file:
    const lineFile = `logs/line-${lineNumber}.json`;
    fs.writeFileSync(lineFile, JSON.stringify(logEntry, null, 2));
  }
}

if (require.main === module) {
  processLogFile();
}

export { processLogFile };
