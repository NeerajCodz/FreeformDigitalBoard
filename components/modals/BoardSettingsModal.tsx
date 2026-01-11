"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit, Tag, FolderPlus, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import CategoryModal from './CategoryModal';
import TagModal from './TagModal';

interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string | null;
}

interface Category {
  id: string;
  name: string;
  color: string;
  description?: string | null;
}

interface BoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  currentTitle: string;
  currentDescription: string;
  currentTags: string[];
  currentCategories: string[];
  onSave: (data: {
    title: string;
    description: string;
    tag_ids: string[];
    category_ids: string[];
  }) => Promise<void>;
  onDelete: () => void;
}

const BoardSettingsModal: React.FC<BoardSettingsModalProps> = ({
  isOpen,
  onClose,
  boardId,
  currentTitle,
  currentDescription,
  currentTags,
  currentCategories,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState({
    title: currentTitle,
    description: currentDescription,
  });
  const [selectedTags, setSelectedTags] = useState<string[]>(currentTags);
  const [selectedCategory, setSelectedCategory] = useState<string>(currentCategories[0] || '');
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ title: currentTitle, description: currentDescription });
      setSelectedTags(currentTags);
      setSelectedCategory(currentCategories[0] || '');
      loadTags();
      loadCategories();
    }
  }, [isOpen, currentTitle, currentDescription, currentTags, currentCategories]);

  const loadTags = async () => {
    try {
      const response = await fetch('/api/tags', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAllTags(data);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAllCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      await onSave({
        title: formData.title,
        description: formData.description,
        tag_ids: selectedTags,
        category_ids: selectedCategory ? [selectedCategory] : [],
      });
      toast.success('Board updated successfully');
      onClose();
    } catch (error) {
      console.error('Error saving board settings:', error);
      toast.error('Failed to update board');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleDeleteBoard = () => {
    setShowDeleteConfirm(false);
    onDelete();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="board-settings-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Board Settings
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                title="Move to Trash"
              >
                <Trash2 className="w-5 h-5 text-red-400 group-hover:text-red-300" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Board Name *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter board name"
                required
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe this board"
                rows={3}
                maxLength={500}
              />
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm font-medium text-white/90">
                  <Tag className="w-4 h-4" />
                  Tags
                </label>
                <button
                  type="button"
                  onClick={() => setShowTagModal(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  New Tag
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.length === 0 ? (
                  <p className="text-sm text-white/50">No tags available. Create one!</p>
                ) : (
                  allTags
                    .filter(tag => tag && tag.id)
                    .map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          selectedTags.includes(tag.id)
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a] scale-105'
                            : 'hover:scale-105 opacity-60 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: tag.color }}
                        title={tag.description || tag.name}
                      >
                        {tag.name}
                      </button>
                    ))
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm font-medium text-white/90">
                  <FolderPlus className="w-4 h-4" />
                  Category (Single)
                </label>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  New Category
                </button>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">No Category</option>
                {allCategories
                  .filter(category => category && category.id)
                  .map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.title.trim() || loading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
              <div className="bg-[#1a1a1a] border border-red-500/50 rounded-xl p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-white mb-2">Delete Board?</h3>
                <p className="text-white/70 mb-4">This action cannot be undone. All pins and snapshots will be permanently deleted.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteBoard}
                    className="flex-1 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
      )}

      {/* Nested Modals */}
      {showTagModal && (
        <TagModal
          key="tag-modal"
          isOpen={showTagModal}
          onClose={() => setShowTagModal(false)}
          onSave={async (name: string, color: string, description?: string) => {
            const response = await fetch('/api/tags', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ name, color, description }),
            });
            if (response.ok) {
              await loadTags();
              toast.success('Tag created');
              setShowTagModal(false);
            } else {
              throw new Error('Failed to create tag');
            }
          }}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          key="category-modal"
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          onSave={async (name: string, color: string, description?: string) => {
            const response = await fetch('/api/categories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ name, color, description }),
            });
            if (response.ok) {
              await loadCategories();
              toast.success('Category created');
              setShowCategoryModal(false);
            } else {
              throw new Error('Failed to create category');
            }
          }}
        />
      )}
    </AnimatePresence>
  );
};

export default BoardSettingsModal;
