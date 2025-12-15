// client/src/components/notes/NoteViewer.jsx
import { Edit, Trash2, Pin, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { formatDateTime } from '../../utils/storage';

const NoteViewer = ({ note, onEdit, onDelete, onPin, onClose }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{note.title}</h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {formatDateTime(note.updated_at)}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onPin(note.id)}
            className={`
              p-2 rounded-lg transition-colors
              ${note.pinned 
                ? 'text-primary-500 bg-primary-100 dark:bg-primary-900' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
            title={note.pinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={20} />
          </button>
          <button
            onClick={() => onEdit(note)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Edit"
          >
            <Edit size={20} />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-500"
            title="Delete"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {note.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto prose dark:prose-invert max-w-none">
        <ReactMarkdown>{note.content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default NoteViewer;