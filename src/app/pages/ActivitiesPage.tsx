import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/Button';
import { useAppConfig } from '../hooks/AppConfigContext';

const toDate = (value: string | number | Date | undefined): Date | null => {
  if (value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  return new Date(value);
};

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}`;
};

export const ActivitiesPage = () => {
  const config = useAppConfig();

  const activities = useQuery({
    queryKey: ['activities'],
    queryFn: () => window.native.vods?.getActivitiesData(config.appConfig.vodStoragePath || ''),
    enabled: Boolean(config.appConfig.vodStoragePath),
  });

  const items = useMemo(() => {
    const data = activities.data || [];
    return [...data].sort((a, b) => b.timestamp - a.timestamp);
  }, [activities.data]);

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="mb-2 flex flex-row gap-2 items-center">
        <Button linkTo="/">Back</Button>
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
          {items.map((rec) => {
            const startedAt = toDate(rec.start?.timestamp);
            const endedAt = toDate(rec.end?.timestamp);
            const recordedAt = toDate(rec.recording?.timestamp);
            const duration = startedAt && endedAt ? endedAt.getTime() - startedAt.getTime() : 0;
            const activityId = rec.start?.activityId || rec.end?.activityId || rec.recording?.activityId;
            const game = rec.start?.game || rec.end?.game || rec.recording?.metadata?.game || '';
            const filename = rec.recording?.filename || '';
            const createdAt = new Date(rec.timestamp).toLocaleString();
            return (
              <div key={`${rec.timestamp}-${activityId}`} className="border border-gray-600 rounded p-3 bg-gray-800">
                <div className="flex flex-row gap-4 items-center justify-between">
                  <div className="flex flex-col">
                    <div className="text-gray-100 font-semibold">{game || 'activity'}</div>
                    <div className="text-gray-400 text-sm">{createdAt}</div>
                  </div>
                  <div className="flex flex-row gap-6 text-sm text-gray-200">
                    <div>id: {activityId}</div>
                    <div>duration: {formatDuration(duration)}</div>
                  </div>
                </div>
                <div className="mt-2 text-gray-200 break-all">{filename}</div>
                {recordedAt && (
                  <div className="mt-1 text-gray-400 text-sm">recorded: {recordedAt.toLocaleString()}</div>
                )}
                {rec.start?.metadata && Object.keys(rec.start.metadata).length > 0 && (
                  <div className="mt-2">
                    <div className="text-gray-400 text-xs">metadata</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                      {Object.entries(rec.start.metadata).map(([k, v]) => (
                        <div key={`${activityId}-${k}`} className="text-gray-300 text-xs">
                          <span className="text-gray-400">{k}:</span> {String(v)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
