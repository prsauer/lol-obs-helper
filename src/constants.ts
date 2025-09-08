import { app } from 'electron';

export const BASE_REMOTE_URL = !app || app.isPackaged ? 'https://exdojo.com' : 'http://localhost:3005/desktop';
