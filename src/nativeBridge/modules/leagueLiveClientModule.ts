import { BrowserWindow } from 'electron';
import { moduleEvent, moduleFunction, NativeBridgeModule, nativeBridgeModule } from '../module';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { ActivityEndedEvent, ActivityStartedEvent, BusEvents } from '../events';
import { bus } from '../bus';
import { AllGameData, Client404Response } from './leagueLiveClientTypes';
import { getAccountByRiotId, getActiveGamesForSummoner } from '../../app/proxy/riotApi';
import { logger } from '../logger';

const LEAGUE_LIVE_CLIENT_API_ROOT = 'https://127.0.0.1:2999';
const LEAGUE_LIVE_CLIENT_FILE_LOGGING = true;

/// Use the GameStart event's EventTime as the unique game identifier
// This is much more reliable than calculating from potentially corrupted player data
export function generateGameId(gameData: AllGameData): string | null {
  // concat riotGameIds
  const riotGameIds = gameData.allPlayers.map((p) => p.riotId).join(',');
  // convert every character in the string to a number, multiply them mod some large prime:
  const numbers = riotGameIds
    .split('')
    .map((char) => char.charCodeAt(0))
    .sort();
  const product = numbers.reduce((acc, num) => {
    return (acc * num) % 1000000007;
  }, 1);

  // Look for the GameStart event
  const gameStartEvent = gameData.events?.Events?.find((event) => event.EventName === 'GameStart');

  if (!gameStartEvent) {
    // No GameStart event found, skip processing this game data
    return null;
  }

  // multiply and mod the gameStartTime and player products
  const gameStartTime = parseInt(gameStartEvent.EventTime.toString().slice(2));
  const gameId = (product * gameStartTime) % 1000000007;

  return `${gameId}`;
}

@nativeBridgeModule('leagueLiveClient')
export class LeagueLiveClientModule extends NativeBridgeModule {
  private readonly httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  private gameListeningInterval: NodeJS.Timeout | null = null;
  private currentRequest: AbortController | null = null;
  private seenGameIds: Set<string> = new Set();
  private readonly maxGameIdHistory = 10;
  private gameRunning = false;
  private currentGameId: string | null = null;
  private riotGameId: number | null = null;
  private readonly logsDir = path.join(process.cwd(), 'logs', 'league-api');

  constructor() {
    super();
    if (LEAGUE_LIVE_CLIENT_FILE_LOGGING) {
      this.ensureLogsDirectory();
    }
  }

  private ensureLogsDirectory(): void {
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create logs directory:', error);
    }
  }

  private logApiResponse(
    endpoint: string,
    response: unknown,
    responseTime: number,
    status?: number,
    timeout?: boolean,
  ): void {
    if (!LEAGUE_LIVE_CLIENT_FILE_LOGGING) {
      return;
    }

    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        endpoint,
        response,
        responseTime,
        status,
        timeout,
      };

      const logFileName = `league-api-${new Date().toISOString().split('T')[0]}.log`;
      const logFilePath = path.join(this.logsDir, logFileName);

      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(logFilePath, logLine);
    } catch (error) {
      console.error('Failed to log API response:', error);
    }
  }

  private addGameIdToHistory(gameId: string): void {
    this.seenGameIds.add(gameId);

    if (this.seenGameIds.size > this.maxGameIdHistory) {
      const firstGameId = this.seenGameIds.values().next().value;
      if (firstGameId) {
        this.seenGameIds.delete(firstGameId);
      }
    }
  }

  private handleGameEnd(_mainWindow: BrowserWindow): void {
    if (this.gameRunning && this.currentGameId) {
      this.onGameEnded(_mainWindow, this.currentGameId);
      const activityEnded: ActivityEndedEvent = {
        type: BusEvents.ActivityEnded,
        game: 'league-of-legends',
        activityId: this.currentGameId,
        metadata: {
          riotGameId: this.riotGameId?.toString() || '',
        },
        timestamp: new Date(),
      };
      bus.emitActivityEnded(activityEnded);
      this.gameRunning = false;
      this.currentGameId = null;
    }
  }

  private async callClientApi<T>(
    endpoint: string,
    timeout = 5000,
  ): Promise<{
    responseTime: number;
    status?: number;
    timeout: boolean;
    data: T | Client404Response | null;
  } | null> {
    try {
      const fetch = (await import('node-fetch')).default;
      let didAbort = false;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        didAbort = true;
      }, timeout);

      const startTime = process.hrtime();
      const response = await fetch(`${LEAGUE_LIVE_CLIENT_API_ROOT}${endpoint}`, {
        agent: this.httpsAgent,
        signal: controller.signal,
      });

      const endTime = process.hrtime(startTime);
      const responseTime = endTime[0] * 1000 + endTime[1] / 1000000;
      clearTimeout(timeoutId);

      const result = (await response.json()) as T;

      // Check if this is an error response (League API returns JSON errors even for 404s)
      if (result && typeof result === 'object' && 'errorCode' in result) {
        // This is an error response, return null data
        return {
          responseTime,
          status: response.status,
          timeout: didAbort,
          data: null,
        };
      }

      if (!response.ok) {
        logger.error(`Error calling League Client API at ${endpoint}: ${response.statusText}`);
        return null;
      }
      if (result !== null) {
        this.logApiResponse(endpoint, result, responseTime, response.status, didAbort);
      }

      return {
        responseTime,
        status: response.status,
        timeout: didAbort,
        data: result,
      };
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        logger.info(`Request to ${endpoint} timed out or was cancelled`);
      }
      return null;
    }
  }

  @moduleFunction()
  public async startListeningForGame(_mainWindow: BrowserWindow): Promise<void> {
    if (this.gameListeningInterval) {
      return;
    }

    logger.info('Starting to listen for League game data...');

    const pollGameData = async () => {
      try {
        this.currentRequest = new AbortController();
        const result = await this.callClientApi<AllGameData>('/liveclientdata/allgamedata', 800);
        const gameData = result?.data;

        if (gameData) {
          if ('httpStatus' in gameData) {
            // 404 case means the local server is starting up but hasnt connected to the game data yet
            return;
          }
          const gameId = generateGameId(gameData);

          // Skip processing if no GameStart event found
          if (!gameId) {
            return;
          }

          const account = await getAccountByRiotId(
            gameData.activePlayer.riotIdGameName,
            gameData.activePlayer.riotIdTagLine,
          );
          if (account.data && this.riotGameId == null) {
            const activePlayerGame = await getActiveGamesForSummoner(account.data.puuid);
            this.riotGameId = activePlayerGame.data?.gameId || null;
            if (this.riotGameId) {
              logger.info('Active Game Id Found', { id: this.riotGameId });
            }
          }

          if (!this.seenGameIds.has(gameId)) {
            this.riotGameId = null;
            this.addGameIdToHistory(gameId);
            this.onNewGameDetected(_mainWindow, gameData);
            const activityStarted: ActivityStartedEvent = {
              type: BusEvents.ActivityStarted,
              game: 'league-of-legends',
              activityId: gameId,
              metadata: {},
              timestamp: new Date(),
            };
            bus.emitActivityStarted(activityStarted);
          }

          if (!this.gameRunning) {
            this.gameRunning = true;
            this.currentGameId = gameId;
            logger.info(`Game Started id=${gameId}`);
          }

          _mainWindow.webContents.send('league-game-data', gameData);
        } else if (this.gameRunning) {
          this.handleGameEnd(_mainWindow);
        }
      } catch (e) {
        // Silently handle errors during polling
      } finally {
        this.currentRequest = null;
      }
    };

    pollGameData();
    this.gameListeningInterval = setInterval(pollGameData, 1000);
  }

  @moduleFunction()
  public async stopListeningForGame(_mainWindow: BrowserWindow): Promise<void> {
    logger.info('Stopping League game data listening...');

    if (this.gameListeningInterval) {
      clearInterval(this.gameListeningInterval);
      this.gameListeningInterval = null;
    }

    if (this.currentRequest) {
      this.currentRequest.abort();
      this.currentRequest = null;
    }

    if (this.gameRunning) {
      this.handleGameEnd(_mainWindow);
    }
  }

  @moduleEvent('on')
  public onNewGameDetected(_mainWindow: BrowserWindow, _gameData: AllGameData): void {
    return;
  }

  @moduleEvent('on')
  public onGameEnded(_mainWindow: BrowserWindow, _gameId: string): void {
    return;
  }
}
