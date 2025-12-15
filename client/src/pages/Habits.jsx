// client/src/pages/Habits.jsx
import { useState } from 'react';
import { Plus, Filter } from 'lucide-react';
import { useHabits } from '../hooks/useHabits';
import HabitCard from '../components/habits/HabitsCard';
import HabitForm from '../components/habits/HabitForm';
import HabitStats from '../components/habits/HabitStats';
import Modal from '../components/common/Modal';

const Habits = () => {
  const {
    habits,
    loading,
    stats,
    addHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    resetStreak
  } = useHabits();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [filter, setFilter] = useState('all'); // all, daily, weekly

  const handleAddHabit = async (habitData) => {
    try {
      await addHabit(habitData);
      setIsModalOpen(false);
    } catch (error) {
      alert('Error creating habit: ' + error.message);
    }
  };

  const handleUpdateHabit = async (habitData) => {
    try {
      await updateHabit(editingHabit.id, habitData);
      setEditingHabit(null);
      setIsModalOpen(false);
    } catch (error) {
      alert('Error updating habit: ' + error.message);
    }
  };

  const handleDeleteHabit = async (id) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      try {
        await deleteHabit(id);
      } catch (error) {
        alert('Error deleting habit: ' + error.message);
      }
    }
  };

  const handleEditHabit = (habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHabit(null);
  };

  const getFilteredHabits = () => {
    if (filter === 'all') return habits;
    return habits.filter(h => h.frequency === filter);
  };

  const filteredHabits = getFilteredHabits();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Habits</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your daily and weekly habits
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">New Habit</span>
        </button>
      </div>

      {/* Stats */}
      {stats && <HabitStats stats={stats} />}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter size={20} className="text-gray-400" />
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${filter === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }
            `}
          >
            All ({habits.length})
          </button>
          <button
            onClick={() => setFilter('daily')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${filter === 'daily'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }
            `}
          >
            Daily ({habits.filter(h => h.frequency === 'daily').length})
          </button>
          <button
            onClick={() => setFilter('weekly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${filter === 'weekly'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }
            `}
          >
            Weekly ({habits.filter(h => h.frequency === 'weekly').length})
          </button>
        </div>
      </div>

      {/* Habits Grid */}
      {filteredHabits.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {filter === 'all'
              ? 'No habits yet. Create your first habit!'
              : `No ${filter} habits found.`}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
            >
              Create Habit
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onComplete={completeHabit}
              onEdit={handleEditHabit}
              onDelete={handleDeleteHabit}
              onReset={resetStreak}
            />
          ))}
        </div>
      )}

      {/* Info Card */}
      {habits.length > 0 && (
        <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 p-4">
          <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-200">
            💡 How Streaks Work
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• <strong>Daily habits:</strong> Complete every day to maintain your streak</li>
            <li>• <strong>Weekly habits:</strong> Complete at least once per week</li>
            <li>• Streaks increase when you complete habits consecutively</li>
            <li>• Missing a day/week will reset your streak to 1 when you resume</li>
          </ul>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingHabit ? 'Edit Habit' : 'New Habit'}
      >
        <HabitForm
          initialData={editingHabit}
          onSubmit={editingHabit ? handleUpdateHabit : handleAddHabit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default Habits;