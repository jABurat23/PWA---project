import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import TaskItem from '../components/tasks/TaskItem';
import TaskForm from '../components/tasks/TaskForm';
import TaskFilters from '../components/tasks/TaskFilters';
import Modal from '../components/common/Modal';

const Tasks = () => {
  const {
    tasks,
    allTasks,
    loading,
    filter,
    setFilter,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete
  } = useTasks();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const handleAddTask = async (taskData) => {
    try {
      await addTask(taskData);
      setIsModalOpen(false);
    } catch (error) {
      alert('Error creating task: ' + error.message);
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      await updateTask(editingTask.id, taskData);
      setEditingTask(null);
      setIsModalOpen(false);
    } catch (error) {
      alert('Error updating task: ' + error.message);
    }
  };

  const handleDeleteTask = async (id) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
      } catch (error) {
        alert('Error deleting task: ' + error.message);
      }
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const getTaskCounts = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    return {
      all: allTasks.length,
      today: allTasks.filter(t => {
        if (!t.deadline) return false;
        const deadline = new Date(t.deadline);
        return deadline.toDateString() === today.toDateString();
      }).length,
      week: allTasks.filter(t => {
        if (!t.deadline) return false;
        const deadline = new Date(t.deadline);
        return deadline >= today && deadline <= weekFromNow;
      }).length,
      completed: allTasks.filter(t => t.completed).length
    };
  };

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
          <h1 className="text-3xl font-bold mb-1">Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your tasks and to-dos
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>

      {/* Filters */}
      <TaskFilters
        activeFilter={filter}
        onFilterChange={setFilter}
        taskCounts={getTaskCounts()}
      />

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {filter === 'all' 
                ? 'No tasks yet. Create your first task!' 
                : `No ${filter} tasks found.`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
              >
                Create Task
              </button>
            )}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={toggleComplete}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTask ? 'Edit Task' : 'New Task'}
      >
        <TaskForm
          initialData={editingTask}
          onSubmit={editingTask ? handleUpdateTask : handleAddTask}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default Tasks;