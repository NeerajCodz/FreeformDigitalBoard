"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Edit3, FolderOpen, Tag as TagIcon, X } from "lucide-react";

interface OptionItem {
  id: string;
  name: string;
  color?: string | null;
  description?: string | null;
}

interface BoardEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: OptionItem[];
  tags: OptionItem[];
  initialValues: {
    name: string;
    description?: string;
    categoryIds: string[];
    tagIds: string[];
  };
  onSave: (values: {
    name: string;
    description?: string;
    categoryIds: string[];
    tagIds: string[];
  }) => Promise<void>;
}

const BoardEditModal = ({
  isOpen,
  onClose,
  categories,
  tags,
  initialValues,
  onSave,
}: BoardEditModalProps) => {
  const [name, setName] = useState(initialValues.name);
  const [description, setDescription] = useState(initialValues.description ?? "");
  const [categoryId, setCategoryId] = useState<string>(initialValues.categoryIds[0] ?? "");
  const [tagIds, setTagIds] = useState<string[]>(initialValues.tagIds);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setName(initialValues.name);
    setDescription(initialValues.description ?? "");
    setCategoryId(initialValues.categoryIds[0] ?? "");
    setTagIds(initialValues.tagIds);
    setError("");
  }, [
    isOpen,
    initialValues.name,
    initialValues.description,
    initialValues.categoryIds,
    initialValues.tagIds,
  ]);

  const toggleTag = (id: string) => {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSave({
        name: name.trim(),
        description: description.trim() ? description.trim() : undefined,
        categoryIds: categoryId ? [categoryId] : [],
        tagIds,
      });
      onClose();
    } catch (submitError) {
      console.error("Failed to update board", submitError);
      setError("Failed to update board. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="board-edit-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0f1115] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Edit3 className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-semibold">Edit Board</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Name *</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Board title"
                  maxLength={150}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="What makes this board unique?"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
                  <FolderOpen className="h-4 w-4 text-emerald-300" />
                  Category
                </div>
                <Select
                  value={categoryId || "none"}
                  onValueChange={(value) => setCategoryId(value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: category.color ?? "#94A3B8" }}
                          />
                          {category.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categories.length === 0 && (
                  <p className="mt-2 text-xs text-white/50">No categories yet. Create one from the dashboard.</p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
                  <TagIcon className="h-4 w-4 text-emerald-300" />
                  Tags
                </div>
                {tags.length === 0 ? (
                  <p className="text-sm text-white/50">No tags yet. Create one from the dashboard.</p>
                ) : (
                  <>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white transition hover:border-white/30"
                        >
                          <span className="truncate">
                            {tagIds.length
                              ? `${tagIds.length} tag${tagIds.length === 1 ? "" : "s"} selected`
                              : "Select tags"}
                          </span>
                          <ChevronsUpDown className="h-4 w-4 opacity-60" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search tags" />
                          <CommandList>
                            <CommandEmpty>No tags found.</CommandEmpty>
                            <CommandGroup>
                              {tags.map((tag) => {
                                const isSelected = tagIds.includes(tag.id);
                                return (
                                  <CommandItem
                                    key={tag.id}
                                    value={tag.name}
                                    onSelect={() => toggleTag(tag.id)}
                                  >
                                    <Check
                                      className={cn(
                                        "h-4 w-4",
                                        isSelected ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span className="flex items-center gap-2">
                                      <span
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: tag.color ?? "#f59e0b" }}
                                      />
                                      {tag.name}
                                    </span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {tagIds.length === 0 ? (
                      <p className="mt-2 text-xs text-white/50">No tags selected yet.</p>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tagIds.map((tagId) => {
                          const tag = tags.find((item) => item.id === tagId);
                          if (!tag) return null;
                          return (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="gap-1 bg-black/40 text-white"
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: tag.color ?? "#f59e0b" }}
                                />
                                {tag.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleTag(tag.id)}
                                className="ml-1 rounded p-0.5 text-white/70 transition hover:text-red-300"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-white/20 px-4 py-2 text-white transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BoardEditModal;
