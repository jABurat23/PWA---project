// client/src/components/pomodoro/SessionHistory.jsx
import { Trash2, Clock } from 'lucide-react';
import { formatDateTime } from '../../utils/storage';

const SessionHistory = ({ sessions, onDelete }) => {
  if (sessions.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No sessions yet. Complete your first pomodoro!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <Clock className="text-primary-600 dark:text-primary-400" size={20} />
            </div>
            <div>
              <p className="font-medium">{session.minutes} minutes</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDateTime(session.completed_at)}
              </p>
            </div>
          </div>

          <button
            onClick={() => onDelete(session.id)}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-500"
            title="Delete session"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default SessionHistory;