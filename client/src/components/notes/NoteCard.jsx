// client/src/components/notes/NoteCard.jsx
import { Pin, Edit, Trash2 } from 'lucide-react';
import { formatDateTime } from '../../utils/storage';

const NoteCard = ({ note, onClick, onPin, onDelete }) => {
  const handlePinClick = (e) => {
    e.stopPropagation();
    onPin(note.id);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  // Get preview text (first 150 characters)
  const getPreview = () => {
    const text = note.content.replace(/[#*`\n]/g, ' ').trim();
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  };

  return (
    <div
      onClick={onClick}
      className={`
        card p-4 cursor-pointer hover:shadow-lg transition-all
        ${note.pinned ? 'border-2 border-primary-500' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-lg flex-1 line-clamp-2">
          {note.title}
        </h3>
        <div className="flex gap-1 ml-2">
          <button
            onClick={handlePinClick}
            className={`
              p-1.5 rounded-lg transition-colors
              ${note.pinned 
                ? 'text-primary-500 bg-primary-100 dark:bg-primary-900' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
            title={note.pinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={16} />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-500"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Preview */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
        {getPreview()}
      </p>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {formatDateTime(note.updated_at)}
      </div>
    </div>
  );
};

export default NoteCard;