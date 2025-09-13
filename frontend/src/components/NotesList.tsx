import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notesAPI, tenantsAPI } from '../services/api';
import NoteForm from './NoteForm';
import { Plus, Search, Edit3, Trash2, Crown, AlertTriangle } from 'lucide-react';

interface Note {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  createdBy: {
    _id: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface NotesResponse {
  notes: Note[];
  pagination: {
    current: number;
    total: number;
    count: number;
  };
  subscription: {
    plan: 'free' | 'pro';
    upgradeDate?: string;
  };
}

const NotesList: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ current: 1, total: 1, count: 0 });
  const [subscription, setSubscription] = useState<{ plan: 'free' | 'pro' }>({ plan: 'free' });
  const [upgrading, setUpgrading] = useState(false);

  const fetchNotes = async (search?: string) => {
    try {
      setLoading(true);
      setError('');
      const response = await notesAPI.getNotes({ search });
      const data: NotesResponse = response.data;
      setNotes(data.notes);
      setPagination(data.pagination);
      setSubscription(data.subscription);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    const debounced = setTimeout(() => {
      fetchNotes(searchQuery);
    }, 300);

    return () => clearTimeout(debounced);
  }, [searchQuery]);

  const handleCreateNote = () => {
    setEditingNote(null);
    setShowForm(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowForm(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await notesAPI.deleteNote(noteId);
      fetchNotes(searchQuery);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete note');
    }
  };

  const handleNoteSubmit = () => {
    setShowForm(false);
    setEditingNote(null);
    fetchNotes(searchQuery);
  };

  const handleUpgradeSubscription = async () => {
    if (!user) return;

    try {
      setUpgrading(true);
      await tenantsAPI.upgradeSubscription(user.tenant.slug);
      
      // Update user context
      const updatedUser = {
        ...user,
        tenant: {
          ...user.tenant,
          subscription: {
            plan: 'pro' as const,
            upgradeDate: new Date().toISOString()
          }
        }
      };
      updateUser(updatedUser);
      
      // Refresh notes to get updated subscription info
      fetchNotes(searchQuery);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upgrade subscription');
    } finally {
      setUpgrading(false);
    }
  };

  const canCreateNote = subscription.plan === 'pro' || notes.length < 3;
  const isAtLimit = subscription.plan === 'free' && notes.length >= 3;

  if (showForm) {
    return (
      <NoteForm
        note={editingNote}
        onSubmit={handleNoteSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingNote(null);
        }}
      />
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold leading-6 text-gray-900">Your Notes</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your notes for {user?.tenant.name}
            {subscription.plan === 'free' && (
              <span className="ml-2 text-orange-600">
                ({notes.length}/3 used)
              </span>
            )}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3 flex items-center">
          {user?.role === 'admin' && subscription.plan === 'free' && (
            <button
              onClick={handleUpgradeSubscription}
              disabled={upgrading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              <Crown className="h-4 w-4 mr-2" />
              {upgrading ? 'Upgrading...' : 'Upgrade to Pro'}
            </button>
          )}
          <button
            onClick={handleCreateNote}
            disabled={!canCreateNote}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </button>
        </div>
      </div>

      {isAtLimit && (
        <div className="mt-4 rounded-md bg-orange-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Note limit reached
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>
                  You've reached the 3-note limit for the Free plan. 
                  {user?.role === 'admin' ? (
                    <> Upgrade to Pro for unlimited notes.</>
                  ) : (
                    <> Ask your admin to upgrade to Pro for unlimited notes.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search notes..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {loading ? (
        <div className="mt-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : notes.length === 0 ? (
        <div className="mt-6 text-center">
          <div className="text-gray-500">
            {searchQuery ? 'No notes found matching your search.' : 'No notes yet. Create your first note!'}
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <div
              key={note._id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {note.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                      {note.content}
                    </p>
                    {note.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {note.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0 flex space-x-2">
                    <button
                      onClick={() => handleEditNote(note)}
                      className="text-gray-400 hover:text-primary-600"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note._id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Created by {note.createdBy.email} on{' '}
                  {new Date(note.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesList;