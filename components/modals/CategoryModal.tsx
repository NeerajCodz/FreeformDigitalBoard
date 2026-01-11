"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, Palette, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string, description?: string) => Promise<void>;
  title?: string;
  confirmLabel?: string;
  initialValues?: {
    name?: string;
    color?: string;
    description?: string;
  };
  onRequestDelete?: (deleteBoardsAndSnapshots: boolean) => Promise<void>;
  startDeletePrompt?: boolean;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Deep Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title = 'Create Category',
  confirmLabel = 'Create Category',
  initialValues,
  onRequestDelete,
  startDeletePrompt = false,
}) => {
  const hasDeleteAction = Boolean(onRequestDelete);
  const [formData, setFormData] = useState({
    name: '',
    color: PRESET_COLORS[0],
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteCascade, setDeleteCascade] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      name: initialValues?.name ?? '',
      color: initialValues?.color ?? PRESET_COLORS[0],
      description: initialValues?.description ?? '',
    });
    setDeleteCascade(false);
    setShowDeleteConfirm(startDeletePrompt && hasDeleteAction);
  }, [initialValues, isOpen, startDeletePrompt, hasDeleteAction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    console.log('CategoryModal: Submitting form with data:', formData);
    setLoading(true);
    try {
      await onSave(formData.name, formData.color, formData.description);
      console.log('CategoryModal: onSave completed successfully');
      if (!hasDeleteAction) {
        setFormData({ name: '', color: PRESET_COLORS[0], description: '' });
      }
      // Don't close here - let parent handle it
    } catch (error) {
      console.error('CategoryModal: Error saving category:', error);
      toast.error('Failed to create category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: initialValues?.name ?? '',
      color: initialValues?.color ?? PRESET_COLORS[0],
      description: initialValues?.description ?? '',
    });
    setDeleteCascade(false);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!onRequestDelete) return;
    setDeleteLoading(true);
    try {
      await onRequestDelete(deleteCascade);
      setShowDeleteConfirm(false);
      setDeleteCascade(false);
      onClose();
    } catch (error) {
      console.error('CategoryModal: Error deleting category:', error);
      toast.error('Failed to delete category.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FolderPlus className="w-5 h-5" />
              {title}
            </h2>
            <div className="flex items-center gap-2">
              {onRequestDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter category name"
                required
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe this category"
                rows={2}
                maxLength={200}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/90 mb-3">
                <Palette className="w-4 h-4" />
                Color
              </label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-full aspect-square rounded-lg transition-all ${
                      formData.color === color
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a] scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.name.trim() || loading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-4 h-4" />
                    {confirmLabel}
                  </>
                )}
              </button>
            </div>
          </form>

          {onRequestDelete && (
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur"
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#14161b] p-6"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Delete Category</h3>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="rounded-lg p-2 text-white/60 transition hover:bg-white/10"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mb-4 text-sm text-white/80">
                      Are you sure you want to delete this category? This action cannot be undone.
                    </p>
                    <label className="mb-6 flex items-center gap-3 text-sm text-white/80">
                      <input
                        type="checkbox"
                        checked={deleteCascade}
                        onChange={(event) => setDeleteCascade(event.target.checked)}
                        className="h-4 w-4 rounded border-white/30 bg-transparent accent-red-500"
                      />
                      Also delete all boards and snapshots with it
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteCascade(false);
                          setShowDeleteConfirm(false);
                        }}
                        className="flex-1 rounded-lg border border-white/20 px-4 py-2 text-white/80 transition hover:bg-white/5"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleteLoading}
                        className="flex-1 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
                      >
                        {deleteLoading ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CategoryModal;
