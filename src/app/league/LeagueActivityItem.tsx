import { MatchStub } from './MatchStub';
import { associateMatchWithVod } from '../utils/matchAssociation';
import type { ActivityRecord, FolderInfo } from '../../types';

type LeagueActivityItemProps = {
  record: ActivityRecord;
  localMatches?: FolderInfo[];
};

export const LeagueActivityItem = ({ record: rec, localMatches }: LeagueActivityItemProps) => {
  const activityId = rec.recording?.activityId || rec.start?.activityId || rec.end?.activityId || `${rec.timestamp}`;

  const associated = associateMatchWithVod(rec, localMatches);

  return (
    <a
      href={`#/activities/league/${activityId}`}
      className="block hover:bg-gray-700 transition-colors bg-gray-900 border border-brands rounded"
    >
      <div className="flex flex-row gap-4 items-center">
        <div className="w-[96px] h-[96px] rounded flex items-center justify-center pl-4 pt-2 pb-2">
          <img src="static/LEAGUE-256x256x32.png" alt="League of Legends" />
        </div>
        <div className="flex-1">
          {activityId &&
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
