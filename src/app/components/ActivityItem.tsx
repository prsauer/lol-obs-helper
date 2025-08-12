import type { ActivityRecord, FolderInfo } from '../../types';
import { LeagueActivityItem } from '../league/LeagueActivityItem';

type ActivityItemProps = {
  record: ActivityRecord;
  localMatches?: FolderInfo[];
};

export const ActivityItem = ({ record, localMatches }: ActivityItemProps) => {
  const game = record.start?.game || record.end?.game || record.recording?.metadata?.game || '';

  // Route to appropriate activity item component based on game type
  switch (game) {
    case 'league-of-legends':
      return <LeagueActivityItem record={record} localMatches={localMatches} />;
    default:
      return <GenericActivityItem record={record} />;
  }
};

// Generic fallback for unknown activity types
const GenericActivityItem = ({ record }: { record: ActivityRecord }) => {
  const game = record.start?.game || record.end?.game || record.recording?.metadata?.game || '';
  const activityId =
    record.recording?.activityId || record.start?.activityId || record.end?.activityId || `${record.timestamp}`;

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
      href={`#/activities/${game}/${activityId}`}
      className="block hover:bg-gray-700 transition-colors bg-gray-900 border border-brands rounded"
    >
      <div className="flex flex-row gap-4 items-center">
        {getGameIcon(game)}
        <div className="flex-1">
          <div className="text-gray-300">View Activity</div>
        </div>
      </div>
    </a>
  );
};
