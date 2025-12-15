// client/src/hooks/useNotes.js
import { useState, useEffect } from 'react';
import { noteDB } from '../utils/idb';
import { notesAPI } from '../utils/api';
import { generateId } from '../utils/storage';

export const useNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const allNotes = await noteDB.getAll();
      const activeNotes = allNotes.filter(n => !n.deleted);
      // Sort by pinned first, then by updated date
      activeNotes.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updated_at) - new Date(a.updated_at);
      });
      setNotes(activeNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (noteData) => {
    try {
      const newNote = {
        id: generateId(),
        ...noteData,
        tags: noteData.tags || [],
        pinned: false,
        deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await noteDB.add(newNote);
      
      try {
        if (navigator.onLine) {
          await notesAPI.create(newNote);
        }
      } catch (error) {
        console.log('Will sync later:', error);
      }

      await loadNotes();
      return newNote;
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  };

  const updateNote = async (id, updates) => {
    try {
      const existingNote = await noteDB.getById(id);
      const updatedNote = {
        ...existingNote,
        ...updates,
        updated_at: new Date().toISOString()
      };

      await noteDB.update(updatedNote);

      try {
        if (navigator.onLine) {
          await notesAPI.update(id, updatedNote);
        }
      } catch (error) {
        console.log('Will sync later:', error);
      }

      await loadNotes();
      return updatedNote;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  };

  const deleteNote = async (id) => {
    try {
      await updateNote(id, { deleted: true });
      
      try {
        if (navigator.onLine) {
          await notesAPI.delete(id);
        }
      } catch (error) {
        console.log('Will sync later:', error);
      }

      await loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  };

  const togglePin = async (id) => {
    try {
      const note = await noteDB.getById(id);
      await updateNote(id, { pinned: !note.pinned });
    } catch (error) {
      console.error('Error toggling pin:', error);
      throw error;
    }
  };

  const getAllTags = () => {
    const tagSet = new Set();
    notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  };

  const getFilteredNotes = () => {
    let filtered = notes;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        (note.tags && note.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // Filter by selected tag
    if (selectedTag) {
      filtered = filtered.filter(note =>
        note.tags && note.tags.includes(selectedTag)
      );
    }

    return filtered;
  };

  return {
    notes: getFilteredNotes(),
    allNotes: notes,
    loading,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    getAllTags,
    refresh: loadNotes
  };
};