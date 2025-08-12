import type { ActivityRecord, FolderInfo } from '../../types';

export type MatchAssociation = {
  matchKey: string;
  summonerName?: string;
};

/**
 * Associates a VOD activity record with a League of Legends match
 * Uses riotGameId from metadata to find the exact match
 */
export const associateMatchWithVod = (
  record: ActivityRecord,
  localMatches?: FolderInfo[],
): MatchAssociation | undefined => {
  if (!localMatches || localMatches.length === 0) {
    return undefined;
  }

  // Extract riotGameId from metadata
  const riotGameId = record.end?.metadata?.riotGameId || record.recording?.metadata?.riotGameId;

  if (!riotGameId) {
    return undefined;
  }

  // Try to find matching game in localMatches by gameId
  const matchingGame = localMatches.find(
    (match) =>
      match.matchId === riotGameId ||
      match.matchId === `NA1_${riotGameId}` ||
      `${match.platformId}_${match.matchId}`.includes(riotGameId),
  );

  if (matchingGame && matchingGame.platformId && matchingGame.matchId) {
    return {
      matchKey: `${matchingGame.platformId}_${matchingGame.matchId}`,
      summonerName: matchingGame.summonerName,
    };
  }

  // Fall back to using the riotGameId directly with NA1 platform (most common)
  return {
    matchKey: `NA1_${riotGameId}`,
    summonerName: undefined,
  };
};
