import { BrowserWindow, ipcMain } from 'electron';
import { moduleEvent, moduleFunction, NativeBridgeModule, nativeBridgeModule } from '../module';
import https from 'https';
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

const LEAGUE_LIVE_CLIENT_API_ROOT = 'https://127.0.0.1:2999';

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

  private generateGameId(gameData: AllGameData): string {
    const gameMode = gameData.gameData?.gameMode || 'unknown';
    const mapNumber = gameData.gameData?.mapNumber || 0;

    const gameStartEvent = gameData.events?.Events?.[0];
    const gameStartTime = Math.floor(gameStartEvent.EventTime * 1000000);

    const gameId = `${gameMode}_${mapNumber}_${gameStartTime}`;

    return gameId;
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
      ipcMain.emit(Events.LeagueGameEnded, this.currentGameId);
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
      return (await response.json()) as T;
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

          if (!this.seenGameIds.has(gameId)) {
            this.addGameIdToHistory(gameId);
            this.onNewGameDetected(_mainWindow, gameData);
            ipcMain.emit(Events.LeagueGameDetected, gameData);
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
