"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Grid,
  Plus,
  Search,
  Calendar,
  FolderOpen,
  Clock,
  Tag,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import BoardEditModal from "@/components/modals/BoardEditModal";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import CategoryModal from "@/components/modals/CategoryModal";
import SnapshotEditModal from "@/components/modals/SnapshotEditModal";
import UserProfile from "@/components/UserProfile";
import { DashboardContextMenu } from "@/components/context/DashboardContextMenu";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { BoardState } from "@/types/board";
import type { SnapshotSummary } from "@/types/database";
import Footer from "@/components/landing-page/footer";

interface Board {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  tag_ids?: string[];
  category_ids?: string[];
}

interface Category {
  id: string;
  name: string;
  color?: string | null;
  description?: string;
}

interface TagFilterOption {
  id: string;
  name: string;
  color?: string;
  description?: string;
}

type SnapshotCard = {
  boardId: string;
  boardTitle: string;
  snapshotId: string;
  snapshotName: string;
  createdAt: string;
  note?: string | null;
  state: BoardState | null;
};

const PREVIEW_WIDTH = 320;
const PREVIEW_HEIGHT = 192;
const PREVIEW_PADDING = 32;
const SNAPSHOT_CAROUSEL_LIMIT = 12;
const SNAPSHOTS_PER_BOARD = 2;
const BOARD_INITIAL_VISIBLE = 3;
const BOARD_BATCH_SIZE = 6;

const SnapshotPreview = ({ state }: { state: BoardState | null }) => {
  if (!state || state.pins.length === 0) {
    return (
      <div
        className="flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 text-xs text-white/40"
        style={{ width: `${PREVIEW_WIDTH}px`, height: `${PREVIEW_HEIGHT}px` }}
      >
        Empty snapshot
      </div>
    );
  }

  const pins = state.pins;
  const minX = Math.min(...pins.map((pin) => pin.x));
  const minY = Math.min(...pins.map((pin) => pin.y));
  const maxX = Math.max(...pins.map((pin) => pin.x + pin.width));
  const maxY = Math.max(...pins.map((pin) => pin.y + pin.height));
  const contentWidth = Math.max(maxX - minX, 1);
  const contentHeight = Math.max(maxY - minY, 1);
  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING) / contentWidth,
    (PREVIEW_HEIGHT - PREVIEW_PADDING) / contentHeight,
    1
  );

  const offsetX = (PREVIEW_WIDTH - contentWidth * scale) / 2 - minX * scale;
  const offsetY = (PREVIEW_HEIGHT - contentHeight * scale) / 2 - minY * scale;

  return (
    <div
      className="relative rounded-xl border border-white/10 bg-slate-950/70 shadow-inner"
      style={{ width: `${PREVIEW_WIDTH}px`, height: `${PREVIEW_HEIGHT}px` }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative h-full w-full">
        {pins.map((pin) => {
          const left = pin.x * scale + offsetX;
          const top = pin.y * scale + offsetY;
          const pinWidth = Math.max(pin.width * scale, 12);
          const pinHeight = Math.max(pin.height * scale, 12);
          const isImage = pin.kind === "image" && pin.imageUrl;

          return (
            <div
              key={pin.id}
              className="absolute overflow-hidden rounded-lg border border-white/10 shadow-sm"
              style={{
                left,
                top,
                width: pinWidth,
                height: pinHeight,
                backgroundColor: isImage ? undefined : pin.color,
                backgroundImage: isImage ? `url(${pin.imageUrl})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [boards, setBoards] = useState<Board[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagFilterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [visibleBoardCount, setVisibleBoardCount] = useState(BOARD_INITIAL_VISIBLE);
  const [snapshotCards, setSnapshotCards] = useState<SnapshotCard[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(true);
  const [boardEditor, setBoardEditor] = useState<{
    id: string;
    title: string;
    description?: string;
    categoryIds: string[];
    tagIds: string[];
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [categoryEditor, setCategoryEditor] = useState<{
    category: Category;
    startDeletePrompt?: boolean;
  } | null>(null);
  const [snapshotModal, setSnapshotModal] = useState<SnapshotCard | null>(null);
  const [boardContextMenu, setBoardContextMenu] = useState<{
    x: number;
    y: number;
    boardId: string;
    boardName: string;
  } | null>(null);
  const [categoryContextMenu, setCategoryContextMenu] = useState<{
    x: number;
    y: number;
    categoryId: string;
  } | null>(null);

  const loadSnapshotsOverview = useCallback(
    async (boardList: Board[], isMounted: () => boolean) => {
      if (!isMounted()) {
        return;
      }

      if (!boardList.length) {
        if (isMounted()) {
          setSnapshotCards([]);
          setSnapshotsLoading(false);
        }
        return;
      }

      setSnapshotsLoading(true);

      try {
        const limitedBoards = boardList.slice(0, SNAPSHOT_CAROUSEL_LIMIT);
        const results = await Promise.all(
          limitedBoards.map(async (board) => {
            try {
              const response = await fetch(`/api/boards/${board.id}/snapshots`);
              if (!response.ok) {
                return [];
              }
              const summaries = (await response.json()) as SnapshotSummary[];
              const selected = summaries.slice(0, SNAPSHOTS_PER_BOARD);

              const detailed = await Promise.all(
                selected.map(async (snapshot) => {
                  try {
                    const detailRes = await fetch(
                      `/api/boards/${board.id}/snapshots/${snapshot.id}`
                    );
                    if (!detailRes.ok) {
                      return {
                        boardId: board.id,
                        boardTitle: board.title,
                        snapshotId: snapshot.id,
                        snapshotName: snapshot.name,
                        createdAt: snapshot.created_at,
                        note: snapshot.note,
                        state: null,
                      } satisfies SnapshotCard;
                    }
                    const detail = await detailRes.json();
                    return {
                      boardId: board.id,
                      boardTitle: board.title,
                      snapshotId: snapshot.id,
                      snapshotName: snapshot.name,
                      createdAt: snapshot.created_at,
                      note: snapshot.note,
                      state: (detail.state as BoardState) ?? null,
                    } satisfies SnapshotCard;
                  } catch (error) {
                    console.error(`Error loading snapshot ${snapshot.id}`, error);
                    return {
                      boardId: board.id,
                      boardTitle: board.title,
                      snapshotId: snapshot.id,
                      snapshotName: snapshot.name,
                      createdAt: snapshot.created_at,
                      note: snapshot.note,
                      state: null,
                    } satisfies SnapshotCard;
                  }
                })
              );

              return detailed;
            } catch (error) {
              console.error(`Error loading snapshots for board ${board.id}`, error);
              return [];
            }
          })
        );

        const flattened = results.flat().slice(0, SNAPSHOT_CAROUSEL_LIMIT);
        if (isMounted()) {
          setSnapshotCards(flattened);
        }
      } catch (error) {
        console.error("Error loading snapshot overview", error);
        if (isMounted()) {
          setSnapshotCards([]);
        }
      } finally {
        if (isMounted()) {
          setSnapshotsLoading(false);
        }
      }
    },
    []
  );

  const loadData = useCallback(
    async (isMounted: () => boolean) => {
      if (!isMounted()) {
        return;
      }

      setLoading(true);
      let retryCount = 0;
      const maxRetries = 3;

      const fetchWithRetry = async () => {
        try {
          const [boardsRes, categoriesRes, tagsRes] = await Promise.all([
            fetch("/api/boards"),
            fetch("/api/board-categories"),
            fetch("/api/tags"),
          ]);

          if (!isMounted()) {
            return;
          }

          if (boardsRes.ok) {
            const boardsData = await boardsRes.json();
            setBoards(boardsData);
            loadSnapshotsOverview(boardsData, isMounted);
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

          if (tagsRes.ok) {
            const tagsData = await tagsRes.json();
            setTags(tagsData);
          } else if (tagsRes.status === 401) {
            console.warn("Unauthorized - user may need to sign in");
          } else {
            console.error("Failed to fetch tags:", tagsRes.status);
          }
        } catch (error) {
          console.error("Error loading data:", error);

          if (
            retryCount < maxRetries &&
            error instanceof TypeError &&
            error.message === "Failed to fetch"
          ) {
            retryCount += 1;
            setTimeout(fetchWithRetry, 1000 * retryCount);
            return;
          }

          if (isMounted()) {
            toast.error("Failed to load boards. Please refresh the page.");
          }
        } finally {
          if (isMounted()) {
            setLoading(false);
          }
        }
      };

      fetchWithRetry();
    },
    [loadSnapshotsOverview]
  );

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    let isMounted = true;
    const checkMounted = () => isMounted;

    loadData(checkMounted);

    return () => {
      isMounted = false;
    };
  }, [isLoaded, user, loadData]);

  useEffect(() => {
    const handleClick = () => {
      setBoardContextMenu(null);
      setCategoryContextMenu(null);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

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
        setSnapshotCards((prev) => prev.filter((card) => card.boardId !== boardId));
        toast.success("Board deleted successfully");
      } else {
        toast.error("Failed to delete board");
      }
    } catch (error) {
      console.error("Error deleting board:", error);
      toast.error("Error deleting board");
    }
  };

  const updateBoardDetails = async (
    boardId: string,
    updates: {
      title: string;
      description?: string;
      categoryIds: string[];
      tagIds: string[];
    }
  ) => {
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updates.title,
          description: updates.description,
          category_ids: updates.categoryIds,
          tag_ids: updates.tagIds,
        }),
      });

      if (response.ok) {
        const updatedBoard = await response.json();
        const nextCategoryIds = updatedBoard.category_ids ?? updates.categoryIds;
        const nextTagIds = updatedBoard.tag_ids ?? updates.tagIds;

        setBoards((prev) =>
          prev.map((board) =>
            board.id === boardId
              ? {
                  ...board,
                  title: updatedBoard.title,
                  description: updatedBoard.description,
                  category_ids: nextCategoryIds,
                  tag_ids: nextTagIds,
                }
              : board
          )
        );

        setSnapshotCards((prev) =>
          prev.map((card) =>
            card.boardId === boardId
              ? { ...card, boardTitle: updatedBoard.title }
              : card
          )
        );

        toast.success("Board updated successfully");
      } else {
        toast.error("Failed to update board");
      }
    } catch (error) {
      console.error("Error updating board:", error);
      toast.error("Error updating board");
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
          tag_ids: board.tag_ids ?? [],
          category_ids: board.category_ids ?? [],
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

  const handleCategoryModalSave = async (
    name: string,
    color: string,
    description?: string
  ) => {
    if (!categoryEditor) return;
    const categoryId = categoryEditor.category.id;
    try {
      const response = await fetch(`/api/board-categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, description }),
      });

      if (!response.ok) {
        const message = "Failed to update category";
        toast.error(message);
        throw new Error(message);
      }

      const updatedCategory = await response.json();
      setCategories((prev) =>
        prev.map((category) => (category.id === updatedCategory.id ? updatedCategory : category))
      );
      setCategoryEditor(null);
      toast.success("Category updated");
    } catch (error) {
      console.error("Error updating category", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error updating category");
    }
  };

  const handleCategoryDelete = async (deleteBoardsAndSnapshots: boolean) => {
    if (!categoryEditor) return;
    const categoryId = categoryEditor.category.id;
    try {
      const response = await fetch(`/api/board-categories/${categoryId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteBoardsAndSnapshots }),
      });

      if (!response.ok) {
        const message = "Failed to delete category";
        toast.error(message);
        throw new Error(message);
      }

      if (deleteBoardsAndSnapshots) {
        const boardsToRemove = boards.filter((board) =>
          (board.category_ids ?? []).includes(categoryId)
        );
        const removedBoardIds = boardsToRemove.map((board) => board.id);
        if (removedBoardIds.length) {
          setBoards((prev) => prev.filter((board) => !removedBoardIds.includes(board.id)));
          setSnapshotCards((prev) =>
            prev.filter((card) => !removedBoardIds.includes(card.boardId))
          );
        }
      } else {
        setBoards((prev) =>
          prev.map((board) =>
            (board.category_ids ?? []).includes(categoryId)
              ? {
                  ...board,
                  category_ids: (board.category_ids ?? []).filter(
                    (id) => id !== categoryId
                  ),
                }
              : board
          )
        );
      }

      setCategories((prev) => prev.filter((category) => category.id !== categoryId));
      if (activeCategory === categoryId) {
        setActiveCategory("all");
      }
      toast.success("Category deleted");
    } catch (error) {
      console.error("Error deleting category", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error deleting category");
    }
  };

  const handleSnapshotUpdate = async (
    card: SnapshotCard,
    name: string,
    note: string
  ) => {
    try {
      const response = await fetch(
        `/api/boards/${card.boardId}/snapshots/${card.snapshotId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, note }),
        }
      );

      if (!response.ok) {
        const message = "Failed to update snapshot";
        toast.error(message);
        throw new Error(message);
      }

      setSnapshotCards((prev) =>
        prev.map((snapshot) =>
          snapshot.snapshotId === card.snapshotId
            ? { ...snapshot, snapshotName: name, note }
            : snapshot
        )
      );
      toast.success("Snapshot updated");
    } catch (error) {
      console.error("Error updating snapshot", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error updating snapshot");
    }
  };

  const handleSnapshotDelete = async (card: SnapshotCard) => {
    try {
      const response = await fetch(
        `/api/boards/${card.boardId}/snapshots/${card.snapshotId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const message = "Failed to delete snapshot";
        toast.error(message);
        throw new Error(message);
      }

      setSnapshotCards((prev) =>
        prev.filter((snapshot) => snapshot.snapshotId !== card.snapshotId)
      );
      toast.success("Snapshot deleted");
    } catch (error) {
      console.error("Error deleting snapshot", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error deleting snapshot");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const categoryMap = useMemo(() => {
    return categories.reduce<Record<string, Category>>((acc, category) => {
      acc[category.id] = category;
      return acc;
    }, {});
  }, [categories]);

  const tagMap = useMemo(() => {
    return tags.reduce<Record<string, TagFilterOption>>((acc, tag) => {
      acc[tag.id] = tag;
      return acc;
    }, {});
  }, [tags]);

  const categoryCounts = useMemo(() => {
    return boards.reduce<Record<string, number>>((acc, board) => {
      const ids = board.category_ids ?? [];
      if (!ids.length) {
        acc.uncategorized = (acc.uncategorized || 0) + 1;
        return acc;
      }
      ids.forEach((id) => {
        acc[id] = (acc[id] || 0) + 1;
      });
      return acc;
    }, {});
  }, [boards]);

  const updatedTodayCount = useMemo(
    () =>
      boards.filter((b) => {
        const today = new Date();
        const boardDate = new Date(b.updated_at);
        return boardDate.toDateString() === today.toDateString();
      }).length,
    [boards]
  );

  const selectedLabelColor = labelFilter ? tagMap[labelFilter]?.color : undefined;
  const uncategorizedCount = categoryCounts.uncategorized ?? 0;

  const folderItems = useMemo<
    Array<{ id: string; name: string; color?: string | null; count: number }>
  >(
    () => [
      { id: "all", name: "All Boards", color: "#10B981", count: boards.length },
      { id: "uncategorized", name: "Uncategorized", color: "#94A3B8", count: uncategorizedCount },
      ...categories.map((category) => ({
        id: category.id,
        name: category.name,
        color: category.color,
        count: categoryCounts[category.id] ?? 0,
      })),
    ],
    [boards.length, categories, categoryCounts, uncategorizedCount]
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filtersApplied = Boolean(normalizedSearch || labelFilter || activeCategory !== "all");

  const filteredBoards = boards.filter((board) => {
    const descriptionText = board.description?.toLowerCase() ?? "";
    const matchesSearch =
      !normalizedSearch ||
      board.title.toLowerCase().includes(normalizedSearch) ||
      descriptionText.includes(normalizedSearch);

    const matchesLabel = !labelFilter || (board.tag_ids ?? []).includes(labelFilter);

    let matchesCategory = true;
    if (activeCategory === "uncategorized") {
      matchesCategory = (board.category_ids?.length ?? 0) === 0;
    } else if (activeCategory !== "all") {
      matchesCategory = (board.category_ids ?? []).includes(activeCategory);
    }

    return matchesSearch && matchesLabel && matchesCategory;
  });

  const displayedBoards = filteredBoards.slice(0, visibleBoardCount);

  useEffect(() => {
    setVisibleBoardCount(BOARD_INITIAL_VISIBLE);
  }, [normalizedSearch, labelFilter, activeCategory]);

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
              <Link href="/" className="flex items-center gap-3 text-emerald-300 hover:text-emerald-200">
                <NextImage
                  src="/logo.svg"
                  alt="Digital Board"
                  width={150}
                  height={40}
                  className="h-9 w-auto"
                  priority
                />
                <span className="text-xl font-bold">Digital Board</span>
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
        {/* Category Folders */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-sm font-semibold text-white">Browse by category</p>
              <p className="text-xs text-white/60">
                {categories.length} {categories.length === 1 ? "category" : "categories"}
              </p>
            </div>
            {activeCategory !== "all" && (
              <button
                onClick={() => setActiveCategory("all")}
                className="text-xs uppercase tracking-wide text-emerald-300 border border-emerald-400/40 rounded-full px-3 py-1 hover:bg-emerald-500/10"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
            {folderItems.map((item) => {
              const isActive = activeCategory === item.id;
              const color = item.color || "#94A3B8";
              const isSystemFolder = item.id === "all" || item.id === "uncategorized";
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveCategory(item.id)}
                  onContextMenu={(event) => {
                    if (isSystemFolder) return;
                    event.preventDefault();
                    event.stopPropagation();
                    setBoardContextMenu(null);
                    setCategoryContextMenu({
                      x: event.clientX,
                      y: event.clientY,
                      categoryId: item.id,
                    });
                  }}
                  className={`flex min-w-[220px] snap-start items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-900/40"
                      : "border-white/10 bg-black/40 hover:border-white/30"
                  }`}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/30 border border-white/10">
                    <FolderOpen className="w-6 h-6" style={{ color }} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-white/60">
                      {item.count} {item.count === 1 ? "board" : "boards"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end mb-6">
          <div className="flex-1">
            {/*<label className="mb-2 block text-xs uppercase tracking-wide text-white/60">
              Name
            </label>*/}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-white/50" />
              <input
                type="text"
                placeholder={`Search across ${boards.length || 0} ${boards.length === 1 ? "board" : "boards"}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="md:w-64">
            {/*<label className="text-xs uppercase tracking-wide text-white/60">Filter by label</label>*/}
            <div className="relative mt-2">
              <Tag
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: selectedLabelColor || "#94A3B8" }}
              />
              <select
                value={labelFilter ?? ""}
                onChange={(event) =>
                  setLabelFilter(event.target.value ? event.target.value : null)
                }
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
              >
                <option value="">All labels</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
              {labelFilter && (
                <button
                  type="button"
                  onClick={() => setLabelFilter(null)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/70 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
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
              {filtersApplied ? "No boards match your filters" : "No boards yet"}
            </h3>
            <p className="text-white/50 mb-6">
              {filtersApplied
                ? "Try adjusting your search, folder, or label filters."
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
            {displayedBoards.map((board) => (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 border border-white/10 rounded-xl p-6 hover:bg-black/60 transition-colors group relative cursor-pointer"
                onClick={() => router.push(`/board/${board.id}`)}
                onContextMenu={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCategoryContextMenu(null);
                  setBoardContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    boardId: board.id,
                    boardName: board.title,
                  });
                }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <Grid className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold text-white truncate">
                    {board.title}
                  </h3>
                </div>

                {board.description && (
                  <p className="text-white/70 text-sm mb-4 line-clamp-2">
                    {board.description}
                  </p>
                )}

                {(board.category_ids?.length || board.tag_ids?.length) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(board.category_ids ?? []).map((categoryId) => {
                      const category = categoryMap[categoryId];
                      if (!category) return null;
                      return (
                        <span
                          key={`category-${categoryId}`}
                          className="rounded-full px-3 py-1 text-xs font-medium text-white/90"
                          style={{ backgroundColor: `${category.color ?? "#475569"}33`, border: `1px solid ${category.color ?? "#475569"}` }}
                        >
                          {category.name}
                        </span>
                      );
                    })}
                    {(board.tag_ids ?? []).map((tagId) => {
                      const tag = tagMap[tagId];
                      if (!tag) return null;
                      return (
                        <span
                          key={`tag-${tagId}`}
                          className="rounded-full px-3 py-1 text-xs font-medium text-white/90"
                          style={{ backgroundColor: `${tag.color ?? "#f59e0b"}33`, border: `1px solid ${tag.color ?? "#f59e0b"}` }}
                        >
                          {tag.name}
                        </span>
                      );
                    })}
                  </div>
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
        {filteredBoards.length > displayedBoards.length && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() =>
                setVisibleBoardCount((prev) =>
                  Math.min(prev + BOARD_BATCH_SIZE, filteredBoards.length)
                )
              }
              className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10"
            >
              <ChevronDown className="h-4 w-4" />
              Show {Math.min(BOARD_BATCH_SIZE, filteredBoards.length - displayedBoards.length)} more board
              {filteredBoards.length - displayedBoards.length > 1 ? "s" : ""}
            </button>
          </div>
        )}

        {/* Snapshots Carousel */}
        <section className="mt-12">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Snapshots</p>
              <p className="text-xs text-white/60">
                Preview saved states from {boards.length} {boards.length === 1 ? "board" : "boards"}
              </p>
            </div>
            <span className="text-xs uppercase tracking-wide text-white/50">
              {snapshotCards.length} snapshot{snapshotCards.length === 1 ? "" : "s"}
            </span>
          </div>

          {snapshotsLoading ? (
            <div className="flex gap-4">
              {Array.from({ length: Math.min(3, Math.max(1, boards.length || 1)) }).map((_, index) => (
                <div
                  key={`snapshot-skeleton-${index}`}
                  className="h-56 w-full rounded-2xl border border-white/10 bg-black/30 animate-pulse md:w-72"
                />
              ))}
            </div>
          ) : snapshotCards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-6 text-center">
              <p className="mb-2 text-sm font-semibold text-white">No snapshots yet</p>
              <p className="text-xs text-white/60">Save a snapshot from any board to see it here.</p>
            </div>
          ) : (
            <Carousel className="relative w-full" opts={{ align: "start", dragFree: true }}>
              <CarouselContent className="-ml-4">
                {snapshotCards.map((card) => (
                  <CarouselItem
                    key={card.snapshotId}
                    className="pl-4 basis-full md:basis-1/2 xl:basis-1/3"
                  >
                    <button
                      type="button"
                      onClick={() => router.push(`/board/${card.boardId}`)}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        setSnapshotModal(card);
                      }}
                      className="flex h-full w-full flex-col rounded-2xl border border-white/10 bg-black/40 p-4 text-left transition hover:border-emerald-400/60 hover:bg-black/60"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{card.snapshotName}</p>
                          <p className="truncate text-xs text-white/60">{card.boardTitle}</p>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide text-white/40">
                          {formatDate(card.createdAt)}
                        </span>
                      </div>
                      <div className="mb-3 flex justify-center">
                        <SnapshotPreview state={card.state} />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-white/60">
                        <p className="line-clamp-2 max-w-[70%] text-white/70">
                          {card.note || "No note"}
                        </p>
                        <span className="text-white/40">Open</span>
                      </div>
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-2" />
              <CarouselNext className="-right-2" />
            </Carousel>
          )}
        </section>
      </div>

      {/* Board Editor */}
      {boardEditor && (
        <BoardEditModal
          isOpen={true}
          onClose={() => setBoardEditor(null)}
          categories={categories}
          tags={tags}
          initialValues={{
            name: boardEditor.title,
            description: boardEditor.description ?? "",
            categoryIds: boardEditor.categoryIds,
            tagIds: boardEditor.tagIds,
          }}
          onSave={async ({ name, description, categoryIds, tagIds }) => {
            await updateBoardDetails(boardEditor.id, {
              title: name,
              description,
              categoryIds,
              tagIds,
            });
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

      {/* Category Editor */}
      {categoryEditor && (
        <CategoryModal
          isOpen={true}
          onClose={() => setCategoryEditor(null)}
          title="Edit Category"
          confirmLabel="Save Changes"
          initialValues={{
            name: categoryEditor.category.name,
            color: categoryEditor.category.color ?? "#3B82F6",
            description: categoryEditor.category.description ?? "",
          }}
          onSave={async (name, color, description) => {
            await handleCategoryModalSave(name, color, description);
          }}
          onRequestDelete={async (deleteBoardsAndSnapshots) => {
            await handleCategoryDelete(deleteBoardsAndSnapshots);
          }}
          startDeletePrompt={categoryEditor.startDeletePrompt}
        />
      )}

      {/* Snapshot Quick Edit */}
      {snapshotModal && (
        <SnapshotEditModal
          isOpen={true}
          initialName={snapshotModal.snapshotName}
          initialNote={snapshotModal.note}
          onClose={() => setSnapshotModal(null)}
          onSave={async (name, note) => {
            await handleSnapshotUpdate(snapshotModal, name, note);
          }}
          onDelete={async () => {
            await handleSnapshotDelete(snapshotModal);
          }}
        />
      )}

      {/* Context Menus */}
      {boardContextMenu && (
        <DashboardContextMenu
          x={boardContextMenu.x}
          y={boardContextMenu.y}
          itemName={boardContextMenu.boardName}
          itemType="board"
          onClose={() => setBoardContextMenu(null)}
          onRename={() => {
            const board = boards.find((b) => b.id === boardContextMenu.boardId);
            if (!board) return;
            setBoardEditor({
              id: board.id,
              title: board.title,
              description: board.description,
              categoryIds: board.category_ids ?? [],
              tagIds: board.tag_ids ?? [],
            });
          }}
          onDuplicate={() => duplicateBoard(boardContextMenu.boardId)}
          onDelete={() => setConfirmDelete(boardContextMenu.boardId)}
        />
      )}
      {categoryContextMenu && (
        <DashboardContextMenu
          x={categoryContextMenu.x}
          y={categoryContextMenu.y}
          itemName={
            categories.find((category) => category.id === categoryContextMenu.categoryId)?.name ||
            "Category"
          }
          itemType="category"
          onClose={() => setCategoryContextMenu(null)}
          onRename={() => {
            const category = categories.find((cat) => cat.id === categoryContextMenu.categoryId);
            if (!category) return;
            setCategoryEditor({ category });
            setCategoryContextMenu(null);
          }}
          onDelete={() => {
            const category = categories.find((cat) => cat.id === categoryContextMenu.categoryId);
            if (!category) return;
            setCategoryEditor({ category, startDeletePrompt: true });
            setCategoryContextMenu(null);
          }}
        />
      )}
      <Footer />
    </div>
  );
}

export default DashboardPage;
