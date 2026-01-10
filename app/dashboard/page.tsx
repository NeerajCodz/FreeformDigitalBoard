"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Grid,
  Plus,
  Search,
  Calendar,
  FolderOpen,
  Trash2,
  Edit3,
  Layers,
  Copy,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import RenameModal from "@/components/RenameModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import UserProfile from "@/components/UserProfile";

interface Board {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [boards, setBoards] = useState<Board[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [renameModal, setRenameModal] = useState<{
    id: string;
    title: string;
    description?: string;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    boardId: string;
    boardName: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true
    if (isLoaded && user) {
      loadData(isMounted);
    }
    return () => {
      isMounted = false
    }
  }, [isLoaded, user]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const loadData = async (isMounted = true) => {
    if (!isMounted) return
    setLoading(true);
    let retryCount = 0;
    const maxRetries = 3;

    const fetchWithRetry = async () => {
      try {
        const [boardsRes, categoriesRes] = await Promise.all([
          fetch("/api/boards"),
          fetch("/api/board-categories"),
        ]);

        if (!isMounted) return

        if (boardsRes.ok) {
          const boardsData = await boardsRes.json();
          setBoards(boardsData);
        } else if (boardsRes.status === 401) {
          console.warn("Unauthorized - user may need to sign in");
        } else {
          console.error("Failed to fetch boards:", boardsRes.status);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        } else if (categoriesRes.status === 401) {
          console.warn("Unauthorized - user may need to sign in");
        } else {
          console.error("Failed to fetch categories:", categoriesRes.status);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        
        // Retry logic for network errors
        if (retryCount < maxRetries && error instanceof TypeError && error.message === 'Failed to fetch') {
          retryCount++;
          console.log(`Retrying data load (${retryCount}/${maxRetries})...`);
          setTimeout(fetchWithRetry, 1000 * retryCount);
          return;
        }
        
        if (isMounted) {
          toast.error("Failed to load boards. Please refresh the page.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchWithRetry();
  };

  const createNewBoard = async () => {
    try {
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Board",
          description: "A fresh canvas for your ideas",
        }),
      });

      if (response.ok) {
        const newBoard = await response.json();
        toast.success("Board created successfully!");
        router.push(`/board/${newBoard.id}`);
      } else {
        toast.error("Failed to create board");
      }
    } catch (error) {
      console.error("Error creating board:", error);
      toast.error("Error creating board");
    }
  };

  const deleteBoard = async (boardId: string) => {
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setBoards((prev) => prev.filter((board) => board.id !== boardId));
        toast.success("Board deleted successfully");
      } else {
        toast.error("Failed to delete board");
      }
    } catch (error) {
      console.error("Error deleting board:", error);
      toast.error("Error deleting board");
    }
  };

  const renameBoard = async (boardId: string, newTitle: string, newDescription?: string) => {
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, description: newDescription }),
      });

      if (response.ok) {
        const updatedBoard = await response.json();
        setBoards((prev) =>
          prev.map((b) => (b.id === boardId ? updatedBoard : b))
        );
        toast.success("Board renamed successfully!");
      } else {
        toast.error("Failed to rename board");
      }
    } catch (error) {
      console.error("Error renaming board:", error);
      toast.error("Error renaming board");
      throw error;
    }
  };

  const duplicateBoard = async (boardId: string) => {
    try {
      const board = boards.find((b) => b.id === boardId);
      if (!board) return;

      // First, get the full board data including state
      const boardRes = await fetch(`/api/boards/${boardId}`);
      if (!boardRes.ok) {
        toast.error("Failed to load board data");
        return;
      }
      const fullBoard = await boardRes.json();

      const response = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${board.title} (Copy)`,
          description: board.description,
          state: fullBoard.state,
        }),
      });

      if (response.ok) {
        const newBoard = await response.json();
        setBoards((prev) => [newBoard, ...prev]);
        toast.success("Board duplicated successfully!");
      } else {
        toast.error("Failed to duplicate board");
      }
    } catch (error) {
      console.error("Error duplicating board:", error);
      toast.error("Error duplicating board");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredBoards = boards.filter((board) => {
    const matchesSearch =
      board.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      board.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Please sign in to access your dashboard
          </h1>
          <Link href="/" className="text-emerald-400 hover:text-emerald-300">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-900/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300">
                <Grid className="w-6 h-6" />
                <span className="text-xl font-bold">Freeform Board</span>
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <h1 className="text-xl font-semibold text-white">Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={createNewBoard}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-300 hover:bg-emerald-500/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Board
              </button>
              <UserProfile />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-black/40 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <Grid className="w-8 h-8 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-white">{boards.length}</p>
                <p className="text-white/70 text-sm">Total Boards</p>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <Layers className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {boards.reduce((acc, board) => acc, 0)}
                </p>
                <p className="text-white/70 text-sm">Active Pins</p>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">{categories.length}</p>
                <p className="text-white/70 text-sm">Categories</p>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {
                    boards.filter((b) => {
                      const today = new Date();
                      const boardDate = new Date(b.updated_at);
                      return boardDate.toDateString() === today.toDateString();
                    }).length
                  }
                </p>
                <p className="text-white/70 text-sm">Updated Today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder="Search boards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Boards Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader />
          </div>
        ) : filteredBoards.length === 0 ? (
          <div className="text-center py-12">
            <Grid className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white/70 mb-2">
              No boards found
            </h3>
            <p className="text-white/50 mb-6">
              {searchTerm
                ? "Try adjusting your search"
                : "Create your first board to get started"}
            </p>
            <button
              onClick={createNewBoard}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBoards.map((board) => (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 border border-white/10 rounded-xl p-6 hover:bg-black/60 transition-colors group relative cursor-pointer"
                onClick={() => router.push(`/board/${board.id}`)}
                onContextMenu={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    boardId: board.id,
                    boardName: board.title,
                  });
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Grid className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-semibold text-white truncate">
                      {board.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameModal({
                          id: board.id,
                          title: board.title,
                          description: board.description,
                        });
                      }}
                      className="p-1.5 hover:bg-white/10 rounded-md"
                      aria-label="Rename board"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateBoard(board.id);
                      }}
                      className="p-1.5 hover:bg-white/10 rounded-md"
                      aria-label="Duplicate board"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(board.id);
                      }}
                      className="p-1.5 hover:bg-red-500/10 rounded-md text-red-300"
                      aria-label="Delete board"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {board.description && (
                  <p className="text-white/70 text-sm mb-4 line-clamp-2">
                    {board.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-white/50">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(board.updated_at)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(board.updated_at).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {renameModal && (
        <RenameModal
          isOpen={true}
          onClose={() => setRenameModal(null)}
          currentName={renameModal.title}
          currentDescription={renameModal.description}
          itemType="board"
          title="Rename Board"
          onSave={async (newTitle, newDescription) => {
            await renameBoard(renameModal.id, newTitle, newDescription);
            setRenameModal(null);
          }}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteBoard(confirmDelete);
            setConfirmDelete(null);
          }
        }}
        title="Delete Board"
        message="Are you sure you want to delete this board? This action cannot be undone and all pins, snapshots, and content will be permanently lost."
      />

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-slate-900 border border-white/10 rounded-lg shadow-xl py-1 z-50 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            onClick={() => {
              const board = boards.find((b) => b.id === contextMenu.boardId);
              if (board) {
                setRenameModal({
                  id: board.id,
                  title: board.title,
                  description: board.description,
                });
              }
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Rename
          </button>
          <button
            onClick={() => {
              duplicateBoard(contextMenu.boardId);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
          <div className="h-px bg-white/10 my-1" />
          <button
            onClick={() => {
              setConfirmDelete(contextMenu.boardId);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-300 hover:bg-red-500/10 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
