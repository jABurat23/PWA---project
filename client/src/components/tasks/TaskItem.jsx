import { CheckCircle2, Circle, Trash2, Edit, Calendar, Flag } from 'lucide-react';
import { formatDate } from '../../utils/storage';

const TaskItem = ({ task, onToggle, onEdit, onDelete }) => {
  const priorityColors = {
    low: 'text-blue-500',
    medium: 'text-yellow-500',
    high: 'text-red-500'
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;

  return (
    <div className={`
      card p-4 flex items-start gap-3 hover:shadow-md transition-shadow
      ${task.completed ? 'opacity-60' : ''}
    `}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className="mt-1 flex-shrink-0"
      >
        {task.completed ? (
          <CheckCircle2 className="text-green-500" size={24} />
        ) : (
          <Circle className="text-gray-400 hover:text-gray-600" size={24} />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className={`
          font-medium text-lg mb-1
          ${task.completed ? 'line-through text-gray-500' : ''}
        `}>
          {task.title}
        </h3>

        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm">
          {/* Priority */}
          <div className="flex items-center gap-1">
            <Flag className={priorityColors[task.priority]} size={16} />
            <span className="capitalize">{task.priority}</span>
          </div>

          {/* Deadline */}
          {task.deadline && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
              <Calendar size={16} />
              <span>{formatDate(task.deadline)}</span>
              {isOverdue && <span className="font-semibold">(Overdue)</span>}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onEdit(task)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Edit task"
        >
          <Edit size={18} />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-500"
          title="Delete task"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default TaskItem;