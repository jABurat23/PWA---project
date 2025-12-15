// client/src/components/habits/HabitCard.jsx
import { CheckCircle2, Edit, Trash2, RotateCcw, Flame } from 'lucide-react';
import { formatDateTime } from '../../utils/storage';

const HabitCard = ({ habit, onComplete, onEdit, onDelete, onReset }) => {
  const isCompletedToday = () => {
    if (!habit.last_completed) return false;
    const lastCompleted = new Date(habit.last_completed);
    const today = new Date();
    return lastCompleted.toDateString() === today.toDateString();
  };

  const isCompletedThisWeek = () => {
    if (!habit.last_completed) return false;
    const lastCompleted = new Date(habit.last_completed);
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    return lastCompleted >= weekStart;
  };

  const isCompleted = habit.frequency === 'daily' ? isCompletedToday() : isCompletedThisWeek();

  const handleComplete = async () => {
    try {
      await onComplete(habit.id);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className={`
      card p-6 transition-all
      ${isCompleted ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-1">{habit.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
            {habit.frequency}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(habit)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Edit"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => onDelete(habit.id)}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-500"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Streak Display */}
      <div className="flex items-center justify-center mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flame className="text-orange-500" size={32} />
            <span className="text-5xl font-bold">{habit.streak}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {habit.frequency === 'daily' ? 'Day Streak' : 'Week Streak'}
          </p>
        </div>
      </div>

      {/* Last Completed */}
      {habit.last_completed && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
          Last completed: {formatDateTime(habit.last_completed)}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleComplete}
          disabled={isCompleted}
          className={`
            flex-1 btn flex items-center justify-center gap-2
            ${isCompleted 
              ? 'bg-green-500 text-white cursor-not-allowed' 
              : 'btn-primary'
            }
          `}
        >
          <CheckCircle2 size={20} />
          {isCompleted 
            ? (habit.frequency === 'daily' ? 'Completed Today!' : 'Completed This Week!') 
            : 'Mark Complete'
          }
        </button>
        
        {habit.streak > 0 && (
          <button
            onClick={() => {
              if (confirm('Reset this habit\'s streak to 0?')) {
                onReset(habit.id);
              }
            }}
            className="btn btn-secondary flex items-center gap-2"
            title="Reset streak"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default HabitCard;