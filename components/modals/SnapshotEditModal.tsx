"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";

interface SnapshotEditModalProps {
  isOpen: boolean;
  initialName: string;
  initialNote?: string | null;
  onClose: () => void;
  onSave: (name: string, note: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

const SnapshotEditModal = ({
  isOpen,
  initialName,
  initialNote = "",
  onClose,
  onSave,
  onDelete,
}: SnapshotEditModalProps) => {
  const [name, setName] = useState(initialName);
  const [note, setNote] = useState(initialNote ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setNote(initialNote ?? "");
    }
  }, [initialName, initialNote, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), note.trim());
      onClose();
    } catch (error) {
      console.error("SnapshotEditModal save error", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f1115] p-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/40">Snapshot</p>
              <h2 className="text-xl font-semibold text-white">Quick Edit</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-white/60 transition hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSave}>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Name</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                maxLength={80}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Description</label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={4}
                maxLength={500}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/20 px-4 py-2 text-white/80 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || saving}
                className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </motion.div>

        <ConfirmationModal
          isOpen={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await onDelete();
            setConfirmDelete(false);
            onClose();
          }}
          title="Delete snapshot"
          message="This snapshot will be removed permanently."
          confirmText="Delete"
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default SnapshotEditModal;
