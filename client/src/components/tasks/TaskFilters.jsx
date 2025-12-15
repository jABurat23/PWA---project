import { Calendar, CalendarRange, CheckCircle, List } from 'lucide-react';

const TaskFilters = ({ activeFilter, onFilterChange, taskCounts }) => {
  const filters = [
    { id: 'all', label: 'All Tasks', icon: List, count: taskCounts.all },
    { id: 'today', label: 'Today', icon: Calendar, count: taskCounts.today },
    { id: 'week', label: 'This Week', icon: CalendarRange, count: taskCounts.week },
    { id: 'completed', label: 'Completed', icon: CheckCircle, count: taskCounts.completed }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
            transition-colors
            ${activeFilter === filter.id
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }
          `}
        >
          <filter.icon size={18} />
          <span>{filter.label}</span>
          <span className="px-2 py-0.5 rounded-full bg-black bg-opacity-20 text-xs">
            {filter.count}
          </span>
        </button>
      ))}
    </div>
  );
};

export default TaskFilters;