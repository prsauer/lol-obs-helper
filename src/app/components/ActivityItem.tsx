import { MatchStub } from './MatchStub';

type ActivityStartedEvent = {
  type: string;
  timestamp: Date;
  game: string;
  activityId: string;
  metadata: Record<string, string>;
};

type ActivityEndedEvent = {
  type: string;
  timestamp: Date;
  game: string;
  activityId: string;
  metadata: Record<string, string>;
};

type RecordingWrittenEvent = {
  type: string;
  timestamp: Date;
  activityId: string;
  metadata: Record<string, string>;
  filename: string;
};

type ActivityRecord = {
  timestamp: number;
  start?: ActivityStartedEvent;
  end?: ActivityEndedEvent;
  recording: RecordingWrittenEvent;
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

type ActivityItemProps = {
  record: ActivityRecord;
  localMatches?: FolderInfo[];
};

export const ActivityItem = ({ record: rec, localMatches }: ActivityItemProps) => {
  const startedAt = rec.start?.timestamp;
  const endedAt = rec.end?.timestamp;

  const activityId = rec.recording?.activityId || rec.start?.activityId || rec.end?.activityId || `${rec.timestamp}`;
  const game = rec.start?.game || rec.end?.game || rec.recording?.metadata?.game || '';
  const isLeague = game === 'league-of-legends';

  let associated:
    | undefined
    | {
        matchKey: string;
        summonerName?: string;
      };

  if (isLeague && localMatches && localMatches.length > 0) {
    // Use riotGameId from metadata if available, otherwise fall back to time-based matching
    const riotGameId = rec.end?.metadata?.riotGameId || rec.recording?.metadata?.riotGameId;

    if (riotGameId) {
      // Try to find matching game in localMatches by gameId
      const matchingGame = localMatches.find(
        (match) =>
          match.matchId === riotGameId ||
          match.matchId === `NA1_${riotGameId}` ||
          `${match.platformId}_${match.matchId}`.includes(riotGameId),
      );

      if (matchingGame && matchingGame.platformId && matchingGame.matchId) {
        associated = {
          matchKey: `${matchingGame.platformId}_${matchingGame.matchId}`,
          summonerName: matchingGame.summonerName,
        };
      } else {
        // Use the riotGameId directly with NA1 platform (most common)
        associated = {
          matchKey: `NA1_${riotGameId}`,
          summonerName: undefined,
        };
      }
    } else {
      // Fall back to time-based matching logic
      const startMs = startedAt && startedAt instanceof Date ? startedAt.getTime() : undefined;
      const endMs = endedAt && endedAt instanceof Date ? endedAt.getTime() : undefined;
      const anchor = (endMs ?? startMs ?? rec.timestamp) as number;

      const windowMin = (startMs ?? anchor) - 30 * 60 * 1000;
      const windowMax = (endMs ?? anchor) + 30 * 60 * 1000;

      const candidates = localMatches.filter((m) => m.createdTime >= windowMin && m.createdTime <= windowMax);
      const best = (candidates.length > 0 ? candidates : localMatches)
        .map((m) => ({ m, d: Math.abs(m.createdTime - anchor) }))
        .sort((a, b) => a.d - b.d)[0]?.m;

      if (best?.platformId && best?.matchId) {
        associated = {
          matchKey: `${best.platformId}_${best.matchId}`,
          summonerName: best.summonerName,
        };
      }
    }
  }

  const getGameIcon = (gameName: string) => {
    switch (gameName) {
      case 'league-of-legends':
        return (
          <div className="w-12 h-12 rounded flex items-center justify-center">
            <img src="static/LEAGUE-256x256x32.png" alt="League of Legends" className="w-12 h-12 rounded" />
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 bg-gray-600 rounded flex items-center justify-center">
            <span className="text-white text-xl font-bold">?</span>
          </div>
        );
    }
  };

  return (
    <a
      href={`#/activities/league/${activityId}`}
      className="block hover:bg-gray-700 transition-colors bg-gray-900 border border-brands p-2 rounded"
    >
      <div className="flex flex-row gap-4 items-center">
        {getGameIcon(game)}
        <div className="flex-1">
          {isLeague &&
            activityId &&
            (associated ? (
              <MatchStub matchId={associated.matchKey} summonerName={associated.summonerName} />
            ) : (
              <div className="text-gray-300">View Activity</div>
            ))}
        </div>
      </div>
    </a>
  );
};
