// client/src/components/pomodoro/PomodoroStats.jsx
import { Timer, TrendingUp, Target, Calendar } from 'lucide-react';

const PomodoroStats = ({ stats }) => {
  if (!stats) return null;

  const statCards = [
    {
      icon: Timer,
      label: 'Total Sessions',
      value: stats.totals.sessions,
      subtitle: `${stats.totals.hours} hours`,
      color: 'blue'
    },
    {
      icon: TrendingUp,
      label: 'Daily Average',
      value: stats.averages.sessionsPerDay.toFixed(1),
      subtitle: `${stats.averages.minutesPerDay} min/day`,
      color: 'green'
    },
    {
      icon: Target,
      label: 'Current Streak',
      value: `${stats.streak.current} ${stats.streak.unit}`,
      subtitle: 'Consecutive days',
      color: 'orange'
    },
    {
      icon: Calendar,
      label: 'Most Productive',
      value: stats.mostProductiveDay?.date || 'N/A',
      subtitle: stats.mostProductiveDay ? `${stats.mostProductiveDay.minutes} min` : '',
      color: 'purple'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <div key={index} className="card p-4">
          <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900 w-fit mb-3`}>
            <stat.icon className={`text-${stat.color}-600 dark:text-${stat.color}-400`} size={24} />
          </div>
          <p className="text-2xl font-bold mb-1">{stat.value}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
          {stat.subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{stat.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default PomodoroStats;