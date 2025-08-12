import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/Button';
import { ActivityItem } from '../components/ActivityItem';
import { useAppConfig } from '../hooks/AppConfigContext';

export const ActivitiesPage = () => {
  const config = useAppConfig();

  const activities = useQuery({
    queryKey: ['activities'],
    queryFn: () => window.native.vods?.getActivitiesData(config.appConfig.vodStoragePath || ''),
    enabled: Boolean(config.appConfig.vodStoragePath),
  });

  const localMatches = useQuery({
    queryKey: ['local-matches'],
    queryFn: async () => window.native?.vods?.scanFolderForMatches(config.appConfig.riotLogsPath || ''),
    enabled: Boolean(config.appConfig.riotLogsPath),
  });

  const items = useMemo(() => {
    const data = activities.data || [];
    return [...data].sort((a, b) => b.timestamp - a.timestamp);
  }, [activities.data]);

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="mb-2 flex flex-row gap-2 items-center">
        <Button onClick={() => activities.refetch()}>Refresh</Button>
      </div>
      <div className="flex-1 overflow-y-auto minimal-scrollbar">
        {!config.appConfig.vodStoragePath && (
          <div className="text-gray-300">Set VODs directory in Setup to view activities</div>
        )}
        {config.appConfig.vodStoragePath && items.length === 0 && (
          <div className="text-gray-300">No activities found</div>
        )}
        <div className="flex flex-col gap-2">
          {items.map((rec) => (
            <ActivityItem
              key={`${rec.timestamp}-${
                rec.recording?.activityId || rec.start?.activityId || rec.end?.activityId || rec.timestamp
              }`}
              record={rec}
              localMatches={localMatches.data}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
