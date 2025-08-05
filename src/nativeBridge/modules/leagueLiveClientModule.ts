import { BrowserWindow, ipcMain } from 'electron';
import { moduleEvent, moduleFunction, NativeBridgeModule, nativeBridgeModule } from '../module';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { Events } from '../ipcEvents';
import {
  AllGameData,
  ActivePlayer,
  ActivePlayerAbilities,
  ActivePlayerRunes,
  PlayerItems,
  PlayerList,
  PlayerMainRunes,
  PlayerScores,
  PlayerSummonerSpells,
  EventData,
  GameStats,
  TeamID,
} from './leagueLiveClientTypes';
import { getAccountByRiotId, getActiveGamesForSummoner } from '../../app/proxy/riotApi';

const LEAGUE_LIVE_CLIENT_API_ROOT = 'https://127.0.0.1:2999';
const LEAGUE_LIVE_CLIENT_FILE_LOGGING = true;

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

  private logApiResponse(endpoint: string, response: unknown): void {
    if (!LEAGUE_LIVE_CLIENT_FILE_LOGGING) {
      return;
    }

    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        endpoint,
        response,
      };

      const logFileName = `league-api-${new Date().toISOString().split('T')[0]}.log`;
      const logFilePath = path.join(this.logsDir, logFileName);

      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(logFilePath, logLine);
    } catch (error) {
      console.error('Failed to log API response:', error);
    }
  }

  /// generate a list of strings: all champ names, all summoner names, all summoner spells, all runes:
  // sort this list by alphabetical order
  // concatenate it to a single string
  // convert all chars in the string to numbers
  // multiply all the numbers
  // mod by some large prime number
  // return the result as a string
  private generateGameId(gameData: AllGameData): string {
    const champNames = gameData.allPlayers.map((player) => player.championName);
    const summonerNames = gameData.allPlayers.map((player) => player.summonerName);
    const allStrings = [...champNames, ...summonerNames];
    const sortedStrings = allStrings.sort();
    const string = sortedStrings.join('');
    const numbers = string.split('').map((char) => char.charCodeAt(0));
    const product = numbers.reduce((acc, num) => acc * num, 1);
    const mod = product % 1000000007;
    return mod.toString();
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
      console.log(`League game ended: ${this.currentGameId}`);
      this.onGameEnded(_mainWindow, this.currentGameId);
      ipcMain.emit(Events.ActivityEnded, {
        game: 'league-of-legends',
        activityId: this.currentGameId,
        metadata: {
          riotGameId: this.riotGameId?.toString() || '',
        },
      });
      this.gameRunning = false;
      this.currentGameId = null;
    }
  }

  private async callClientApi<T>(endpoint: string, timeout = 5000): Promise<T | null> {
    try {
      const fetch = (await import('node-fetch')).default;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${LEAGUE_LIVE_CLIENT_API_ROOT}${endpoint}`, {
        agent: this.httpsAgent,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Error calling League Client API at ${endpoint}: ${response.statusText}`);
        return null;
      }

      const result = (await response.json()) as T;
      if (result !== null) {
        this.logApiResponse(endpoint, result);
      }

      return result;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        console.log(`Request to ${endpoint} timed out or was cancelled`);
      }
      return null;
    }
  }

  @moduleFunction()
  public async startListeningForGame(_mainWindow: BrowserWindow): Promise<void> {
    if (this.gameListeningInterval) {
      console.log('Already listening for game data');
      return;
    }

    console.log('Starting to listen for League game data...');

    const pollGameData = async () => {
      try {
        this.currentRequest = new AbortController();
        const gameData = await this.callClientApi<AllGameData>('/liveclientdata/allgamedata', 100);

        if (gameData) {
          const gameId = this.generateGameId(gameData);

          const account = await getAccountByRiotId(
            gameData.activePlayer.riotIdGameName,
            gameData.activePlayer.riotIdTagLine,
          );
          if (account.data) {
            const activePlayerGame = await getActiveGamesForSummoner(account.data.puuid);
            console.log('Active Game Id', { id: activePlayerGame.data?.gameId });
            this.riotGameId = activePlayerGame.data?.gameId || null;
          }

          if (!this.seenGameIds.has(gameId)) {
            this.riotGameId = null;
            this.addGameIdToHistory(gameId);
            this.onNewGameDetected(_mainWindow, gameData);
            ipcMain.emit(Events.ActivityStarted, {
              game: 'league-of-legends',
              activityId: gameId,
            });
          }

          if (!this.gameRunning) {
            this.gameRunning = true;
            this.currentGameId = gameId;
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
    console.log('Stopping League game data listening...');

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

  @moduleFunction()
  public async getAllGameData(_mainWindow: BrowserWindow, eventID?: number): Promise<AllGameData | null> {
    const endpoint = eventID ? `/liveclientdata/allgamedata?eventID=${eventID}` : '/liveclientdata/allgamedata';
    return this.callClientApi<AllGameData>(endpoint);
  }

  @moduleFunction()
  public async getActivePlayer(_mainWindow: BrowserWindow): Promise<ActivePlayer | null> {
    return this.callClientApi<ActivePlayer>('/liveclientdata/activeplayer');
  }

  @moduleFunction()
  public async getActivePlayerName(_mainWindow: BrowserWindow): Promise<string | null> {
    return this.callClientApi<string>('/liveclientdata/activeplayername');
  }

  @moduleFunction()
  public async getActivePlayerAbilities(_mainWindow: BrowserWindow): Promise<ActivePlayerAbilities | null> {
    return this.callClientApi<ActivePlayerAbilities>('/liveclientdata/activeplayerabilities');
  }

  @moduleFunction()
  public async getActivePlayerRunes(_mainWindow: BrowserWindow): Promise<ActivePlayerRunes | null> {
    return this.callClientApi<ActivePlayerRunes>('/liveclientdata/activeplayerrunes');
  }

  @moduleFunction()
  public async getPlayerList(_mainWindow: BrowserWindow, teamID?: TeamID): Promise<PlayerList | null> {
    const endpoint = teamID ? `/liveclientdata/playerlist?teamID=${teamID}` : '/liveclientdata/playerlist';
    return this.callClientApi<PlayerList>(endpoint);
  }

  @moduleFunction()
  public async getPlayerItems(_mainWindow: BrowserWindow, riotId: string): Promise<PlayerItems | null> {
    return this.callClientApi<PlayerItems>(`/liveclientdata/playeritems?riotId=${encodeURIComponent(riotId)}`);
  }

  @moduleFunction()
  public async getPlayerMainRunes(_mainWindow: BrowserWindow, riotId: string): Promise<PlayerMainRunes | null> {
    return this.callClientApi<PlayerMainRunes>(`/liveclientdata/playermainrunes?riotId=${encodeURIComponent(riotId)}`);
  }

  @moduleFunction()
  public async getPlayerScores(_mainWindow: BrowserWindow, riotId: string): Promise<PlayerScores | null> {
    return this.callClientApi<PlayerScores>(`/liveclientdata/playerscores?riotId=${encodeURIComponent(riotId)}`);
  }

  @moduleFunction()
  public async getPlayerSummonerSpells(
    _mainWindow: BrowserWindow,
    riotId: string,
  ): Promise<PlayerSummonerSpells | null> {
    return this.callClientApi<PlayerSummonerSpells>(
      `/liveclientdata/playersummonerspells?riotId=${encodeURIComponent(riotId)}`,
    );
  }

  @moduleFunction()
  public async getEventData(_mainWindow: BrowserWindow, eventID?: number): Promise<EventData | null> {
    const endpoint = eventID ? `/liveclientdata/eventdata?eventID=${eventID}` : '/liveclientdata/eventdata';
    return this.callClientApi<EventData>(endpoint);
  }

  @moduleFunction()
  public async getGameStats(_mainWindow: BrowserWindow): Promise<GameStats | null> {
    return this.callClientApi<GameStats>('/liveclientdata/gamestats');
  }

  @moduleFunction()
  public async isGameActive(_mainWindow: BrowserWindow): Promise<boolean> {
    try {
      const gameStats = await this.getGameStats(_mainWindow);
      return gameStats !== null;
    } catch {
      return false;
    }
  }
}
