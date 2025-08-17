import { useState } from 'react';
import type { ActivityRecord, FolderInfo } from '../../types';
import { LeagueActivityItem } from '../league/LeagueActivityItem';

type ActivityItemProps = {
  record: ActivityRecord;
  localMatches?: FolderInfo[];
};

export const ActivityItem = ({ record, localMatches }: ActivityItemProps) => {
  const game = record.start?.game || record.end?.game || record.recording?.metadata?.game || '';

  switch (game) {
    case 'league-of-legends':
      return <LeagueActivityItem record={record} localMatches={localMatches} />;
    default:
      return <GenericActivityItem record={record} />;
  }
};

const GenericActivityItem = ({ record }: { record: ActivityRecord }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await window.native.vods.deleteActivity(activityId);
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete activity:', error);
      alert('Failed to delete activity');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <div className="relative">
      <a
        href={`#/activities/${game}/${activityId}`}
        className="block hover:bg-gray-700 transition-colors bg-gray-900 border border-accent-200 rounded"
      >
        <div className="flex flex-row gap-4 items-center">
          {getGameIcon(game)}
          <div className="flex-1">
            <div className="text-gray-300">View Activity</div>
          </div>
          <button
            onClick={handleDeleteClick}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
            title="Delete activity"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </a>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-gray-600">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Delete Activity</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this activity? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
