// client/src/components/notes/NoteEditor.jsx
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Eye, EyeOff, Save, X } from 'lucide-react';

const NoteEditor = ({ initialData = null, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    tags: initialData?.tags || []
  });
  const [tagInput, setTagInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSave(formData);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Title */}
      <input
        type="text"
        className="text-2xl font-bold border-none focus:outline-none bg-transparent mb-4"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Note title..."
        required
        autoFocus
      />

      {/* Tags */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full flex items-center gap-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-red-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="input text-sm"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Add tag (press Enter)"
          />
          <button
            type="button"
            onClick={addTag}
            className="btn btn-secondary text-sm"
          >
            Add Tag
          </button>
        </div>
      </div>

      {/* Preview Toggle */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {showPreview ? 'Preview Mode' : 'Edit Mode'}
        </span>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="btn btn-secondary text-sm flex items-center gap-2"
        >
          {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        {showPreview ? (
          <div className="p-4 prose dark:prose-invert max-w-none overflow-y-auto h-full">
            <ReactMarkdown>{formData.content || '*Nothing to preview*'}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            className="w-full h-full p-4 border-none focus:outline-none resize-none bg-transparent font-mono text-sm"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Write your note here... (Markdown supported)"
          />
        )}
      </div>

      {/* Markdown Help */}
      {!showPreview && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <strong>Markdown tips:</strong> # Heading, **bold**, *italic*, `code`, [link](url), - list
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary flex items-center gap-2"
        >
          <X size={18} />
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary flex items-center gap-2"
        >
          <Save size={18} />
          {initialData ? 'Update Note' : 'Save Note'}
        </button>
      </div>
    </form>
  );
};

export default NoteEditor;