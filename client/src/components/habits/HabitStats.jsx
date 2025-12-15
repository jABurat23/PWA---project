// client/src/components/habits/HabitStats.jsx
import { Target, Flame, TrendingUp, Calendar } from 'lucide-react';

const HabitStats = ({ stats }) => {
  if (!stats) return null;

  const statCards = [
    {
      icon: Target,
      label: 'Total Habits',
      value: stats.totalHabits,
      color: 'blue'
    },
    {
      icon: Flame,
      label: 'Active Streaks',
      value: stats.activeStreaks,
      color: 'orange'
    },
    {
      icon: TrendingUp,
      label: 'Longest Streak',
      value: stats.longestStreak,
      color: 'green'
    },
    {
      icon: Calendar,
      label: 'Completed Today',
      value: stats.completedToday,
      color: 'purple'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <div key={index} className="card p-4">
          <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900 w-fit mb-3`}>
            <stat.icon className={`text-${stat.color}-600 dark:text-${stat.color}-400`} size={24} />
          </div>
          <p className="text-2xl font-bold mb-1">{stat.value}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

export default HabitStats;