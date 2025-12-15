// client/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckSquare, StickyNote, Target, Timer, ArrowRight, 
  TrendingUp, Calendar, Flame, Clock, Plus
} from 'lucide-react';
import { taskDB, noteDB, habitDB, pomodorooDB } from '../utils/idb';
import { formatDateTime, isToday } from '../utils/storage';

const Dashboard = () => {
  const [stats, setStats] = useState({
    tasks: { total: 0, completed: 0, today: 0 },
    notes: { total: 0, pinned: 0, recent: [] },
    habits: { total: 0, active: 0, todayCompleted: 0 },
    pomodoro: { today: 0, totalMinutes: 0, thisWeek: 0 }
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);

  useEffect(() => {
    loadStats();
    loadRecentActivity();
    loadUpcomingTasks();
  }, []);

  const loadStats = async () => {
    try {
      // Tasks stats
      const tasks = await taskDB.getAll();
      const activeTasks = tasks.filter(t => !t.deleted);
      const completedTasks = activeTasks.filter(t => t.completed).length;
      const todayTasks = activeTasks.filter(t => {
        if (!t.deadline) return false;
        return isToday(t.deadline);
      }).length;

      // Notes stats
      const notes = await noteDB.getAll();
      const activeNotes = notes.filter(n => !n.deleted);
      const pinnedNotes = activeNotes.filter(n => n.pinned).length;
      const recentNotes = activeNotes
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 3);

      // Habits stats
      const habits = await habitDB.getAll();
      const activeHabits = habits.filter(h => !h.deleted);
      const activeStreaks = activeHabits.filter(h => h.streak > 0).length;
      const todayCompleted = activeHabits.filter(h => {
        if (!h.last_completed) return false;
        return isToday(h.last_completed);
      }).length;

      // Pomodoro stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const allSessions = await pomodorooDB.getAll();
      const todaySessions = allSessions.filter(s => {
        const sessionDate = new Date(s.completed_at);
        return sessionDate >= today;
      });
      const weekSessions = allSessions.filter(s => {
        const sessionDate = new Date(s.completed_at);
        return sessionDate >= weekAgo;
      });
      const totalMinutes = todaySessions.reduce((sum, s) => sum + s.minutes, 0);

      setStats({
        tasks: { 
          total: activeTasks.length, 
          completed: completedTasks,
          today: todayTasks
        },
        notes: { 
          total: activeNotes.length, 
          pinned: pinnedNotes,
          recent: recentNotes
        },
        habits: { 
          total: activeHabits.length, 
          active: activeStreaks,
          todayCompleted
        },
        pomodoro: { 
          today: todaySessions.length, 
          totalMinutes,
          thisWeek: weekSessions.length
        }
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const activities = [];

      // Recent completed tasks
      const tasks = await taskDB.getAll();
      tasks.filter(t => t.completed && !t.deleted)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 3)
        .forEach(t => {
          activities.push({
            type: 'task',
            icon: CheckSquare,
            text: `Completed task: ${t.title}`,
            time: t.updated_at,
            color: 'blue'
          });
        });

      // Recent notes
      const notes = await noteDB.getAll();
      notes.filter(n => !n.deleted)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 2)
        .forEach(n => {
          activities.push({
            type: 'note',
            icon: StickyNote,
            text: `Updated note: ${n.title}`,
            time: n.updated_at,
            color: 'yellow'
          });
        });

      // Recent pomodoro
      const sessions = await pomodorooDB.getAll();
      sessions.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
        .slice(0, 2)
        .forEach(s => {
          activities.push({
            type: 'pomodoro',
            icon: Timer,
            text: `Completed ${s.minutes} min session`,
            time: s.completed_at,
            color: 'red'
          });
        });

      // Sort by time and take top 5
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const loadUpcomingTasks = async () => {
    try {
      const tasks = await taskDB.getAll();
      const upcoming = tasks
        .filter(t => !t.deleted && !t.completed && t.deadline)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5);
      
      setUpcomingTasks(upcoming);
    } catch (error) {
      console.error('Error loading upcoming tasks:', error);
    }
  };

  const cards = [
    {
      title: 'Tasks',
      icon: CheckSquare,
      color: 'blue',
      stats: `${stats.tasks.completed} / ${stats.tasks.total} completed`,
      link: '/tasks',
      trend: stats.tasks.today > 0 ? `${stats.tasks.today} due today` : null
    },
    {
      title: 'Notes',
      icon: StickyNote,
      color: 'yellow',
      stats: `${stats.notes.total} notes, ${stats.notes.pinned} pinned`,
      link: '/notes',
      trend: stats.notes.total > 0 ? 'Recently updated' : null
    },
    {
      title: 'Habits',
      icon: Target,
      color: 'green',
      stats: `${stats.habits.active} active streaks`,
      link: '/habits',
      trend: `${stats.habits.todayCompleted} completed today`
    },
    {
      title: 'Pomodoro',
      icon: Timer,
      color: 'red',
      stats: `${stats.pomodoro.today} sessions today`,
      link: '/pomodoro',
      trend: `${stats.pomodoro.totalMinutes} minutes focused`
    }
  ];

  const getColorClasses = (color) => ({
    bg: `bg-${color}-100 dark:bg-${color}-900`,
    text: `text-${color}-600 dark:text-${color}-400`,
    border: `border-${color}-200 dark:border-${color}-800`
  });

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome Back! 👋</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const colors = getColorClasses(card.color);
          return (
            <Link
              key={card.title}
              to={card.link}
              className="card hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-lg ${colors.bg}`}>
                  <card.icon className={colors.text} size={24} />
                </div>
                <ArrowRight className="text-gray-400" size={20} />
              </div>
              
              <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {card.stats}
              </p>
              {card.trend && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <TrendingUp size={12} />
                  {card.trend}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/tasks" className="btn btn-primary flex items-center justify-center gap-2">
            <Plus size={18} />
            New Task
          </Link>
          <Link to="/notes" className="btn btn-primary flex items-center justify-center gap-2">
            <Plus size={18} />
            New Note
          </Link>
          <Link to="/habits" className="btn btn-primary flex items-center justify-center gap-2">
            <Plus size={18} />
            New Habit
          </Link>
          <Link to="/pomodoro" className="btn btn-primary flex items-center justify-center gap-2">
            <Timer size={18} />
            Start Timer
          </Link>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar size={20} />
              Upcoming Tasks
            </h2>
            <Link to="/tasks" className="text-sm text-primary-500 hover:underline">
              View all
            </Link>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Calendar size={48} className="mx-auto mb-2 opacity-50" />
              <p>No upcoming tasks</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map((task) => {
                const isOverdue = new Date(task.deadline) < new Date();
                const dueToday = isToday(task.deadline);
                
                return (
                  <Link
                    key={task.id}
                    to="/tasks"
                    className="block p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium line-clamp-1">{task.title}</p>
                        <p className={`text-sm mt-1 ${
                          isOverdue 
                            ? 'text-red-500' 
                            : dueToday 
                            ? 'text-orange-500' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {isOverdue ? '⚠️ Overdue' : dueToday ? '🔔 Due today' : formatDateTime(task.deadline)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.priority === 'high' 
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          : task.priority === 'medium'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock size={20} />
              Recent Activity
            </h2>
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Clock size={48} className="mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => {
                const colors = getColorClasses(activity.color);
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colors.bg} flex-shrink-0`}>
                      <activity.icon className={colors.text} size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {activity.text}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateTime(activity.time)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Notes Preview */}
      {stats.notes.recent.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Notes</h2>
            <Link to="/notes" className="text-sm text-primary-500 hover:underline">
              View all
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {stats.notes.recent.map((note) => (
              <Link
                key={note.id}
                to="/notes"
                className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium mb-2 line-clamp-1">{note.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {note.content.replace(/[#*`\n]/g, ' ').trim() || 'Empty note'}
                </p>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {note.tags.slice(0, 2).map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Summary */}
      <div className="card bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <h2 className="text-xl font-semibold mb-4">📊 This Week's Summary</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tasks Completed</p>
            <p className="text-3xl font-bold">{stats.tasks.completed}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Habits</p>
            <p className="text-3xl font-bold flex items-center gap-2">
              {stats.habits.active}
              <Flame className="text-orange-500" size={24} />
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pomodoro Sessions</p>
            <p className="text-3xl font-bold">{stats.pomodoro.thisWeek}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Notes</p>
            <p className="text-3xl font-bold">{stats.notes.total}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;