// client/src/pages/Notes.jsx
import { useState } from 'react';
import { Plus, Search, Tag } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import NoteCard from '../components/notes/NoteCard';
import NoteEditor from '../components/notes/NoteEditor';
import NoteViewer from '../components/notes/NoteViewer';

const Notes = () => {
  const {
    notes,
    loading,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    getAllTags
  } = useNotes();

  const [view, setView] = useState('grid'); // grid, editor, viewer
  const [currentNote, setCurrentNote] = useState(null);

  const handleCreateNote = () => {
    setCurrentNote(null);
    setView('editor');
  };

  const handleEditNote = (note) => {
    setCurrentNote(note);
    setView('editor');
  };

  const handleViewNote = (note) => {
    setCurrentNote(note);
    setView('viewer');
  };

  const handleSaveNote = async (noteData) => {
    try {
      if (currentNote) {
        await updateNote(currentNote.id, noteData);
      } else {
        await addNote(noteData);
      }
      setView('grid');
      setCurrentNote(null);
    } catch (error) {
      alert('Error saving note: ' + error.message);
    }
  };

  const handleDeleteNote = async (id) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(id);
        if (view !== 'grid') {
          setView('grid');
          setCurrentNote(null);
        }
      } catch (error) {
        alert('Error deleting note: ' + error.message);
      }
    }
  };

  const handleCancel = () => {
    setView('grid');
    setCurrentNote(null);
  };

  const allTags = getAllTags();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  // Editor View
  if (view === 'editor') {
    return (
      <div className="h-[calc(100vh-8rem)]">
        <NoteEditor
          initialData={currentNote}
          onSave={handleSaveNote}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  // Viewer View
  if (view === 'viewer' && currentNote) {
    return (
      <div className="h-[calc(100vh-8rem)]">
        <NoteViewer
          note={currentNote}
          onEdit={handleEditNote}
          onDelete={handleDeleteNote}
          onPin={togglePin}
          onClose={handleCancel}
        />
      </div>
    );
  }

  // Grid View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Notes</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </p>
        </div>
        <button
          onClick={handleCreateNote}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          New Note
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            className="input pl-10 w-full"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <select
            className="input sm:w-48"
            value={selectedTag || ''}
            onChange={(e) => setSelectedTag(e.target.value || null)}
          >
            <option value="">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tags Display */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Tag size={16} className="text-gray-400 mt-1" />
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`
                px-3 py-1 text-sm rounded-full transition-colors
                ${selectedTag === tag
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800'
                }
              `}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery || selectedTag
              ? 'No notes match your filters.'
              : 'No notes yet. Create your first note!'}
          </p>
          {!searchQuery && !selectedTag && (
            <button
              onClick={handleCreateNote}
              className="btn btn-primary"
            >
              Create Note
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => handleViewNote(note)}
              onPin={togglePin}
              onDelete={handleDeleteNote}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Notes;