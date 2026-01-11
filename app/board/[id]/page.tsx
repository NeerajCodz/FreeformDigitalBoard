"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  AlignLeft,
  ArrowLeft,
  Camera,
  ChevronDown,
  Circle,
  CircleDot,
  Copy,
  Download,
  ExternalLink,
  FileText,
  History,
  Image as ImageIcon,
  Layers,
  Link as LinkIcon,
  Lock,
  Menu,
  MoreVertical,
  Paperclip,
  Redo2,
  Save,
  Search,
  Settings,
  Trash2,
  Undo2,
  Unlock,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Link from "next/link";
import NextImage from "next/image";
import Loader from "@/components/Loader";
import UserProfile from "@/components/UserProfile";
import BoardSettingsModal from "@/components/modals/BoardSettingsModal";
import LabelCreateModal from "@/components/modals/LabelCreateModal";
import GroupCreateModal from "@/components/modals/GroupCreateModal";
import { BoardPin, BoardState, PinKind } from "@/types/board";
import { emptyBoardState, sanitizeBoardState } from "@/lib/board-state";

type HistoryState = {
  past: BoardState[];
  present: BoardState;
  future: BoardState[];
};

type Interaction =
  | { mode: "idle" }
  | { mode: "pan"; start: { x: number; y: number }; origin: { x: number; y: number } }
  | { mode: "drag"; pinId: string; start: { x: number; y: number }; origin: { x: number; y: number } }
  | { mode: "multi-drag"; pinIds: string[]; start: { x: number; y: number }; origins: Map<string, { x: number; y: number }> }
  | {
      mode: "resize";
      pinId: string;
      start: { x: number; y: number };
      origin: { width: number; height: number };
    }
  | { mode: "wire"; fromPinId: string | null };

interface SnapshotSummary {
  id: string;
  name: string;
  note?: string | null;
  created_at: string;
}

const palette = ["#22c55e", "#38bdf8", "#eab308", "#f97316", "#a855f7", "#ec4899"];

const MAX_IMAGE_DIMENSION = 720;
const MAX_IMAGE_FILE_SIZE = 8 * 1024 * 1024; // 8MB safety cap
const MAX_ATTACHMENT_SIZE = 1 * 1024 * 1024; // 1MB for attachments
const WIRES_ENABLED = false;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const applyRecipe = (base: BoardState, recipe: (draft: BoardState) => BoardState) => {
  const draft = structuredClone(base);
  const result = recipe(draft);
  return result ?? draft;
};

const useBoardHistory = (initial: BoardState) => {
  const [history, setHistory] = useState<HistoryState>({ past: [], present: initial, future: [] });

  const mutate = useCallback((recipe: (draft: BoardState) => BoardState) => {
    setHistory((current) => ({ ...current, present: applyRecipe(current.present, recipe) }));
  }, [setHistory]);

  const commit = useCallback((recipe: (draft: BoardState) => BoardState) => {
    setHistory((current) => {
      const newState = applyRecipe(current.present, recipe);
      // Always append to past, trim to 50 if needed
      const newPast = [...current.past, structuredClone(current.present)].slice(-50);
      return {
        past: newPast,
        present: newState,
        future: [], // Clear future since we made a new change
      };
    });
  }, [setHistory]);

  const reset = useCallback((next: BoardState) => {
    setHistory({ past: [], present: next, future: [] });
  }, [setHistory]);

  const undo = useCallback(() => {
    setHistory((current) => {
      if (!current.past.length) return current;
      const previous = current.past[current.past.length - 1];
      const past = current.past.slice(0, -1);
      const future = [structuredClone(current.present), ...current.future].slice(0, 50);
      return { past, present: previous, future };
    });
  }, [setHistory]);

  const redo = useCallback(() => {
    setHistory((current) => {
      if (!current.future.length) return current;
      const next = current.future[0];
      const future = current.future.slice(1);
      const past = [...current.past.slice(-49), structuredClone(current.present)];
      return { past, present: next, future };
    });
  }, [setHistory]);

  return {
    state: history.present,
    past: history.past,
    future: history.future,
    mutate,
    commit,
    reset,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    setHistory, // Expose setHistory for manual history manipulation
  };
};

const randomColor = () => palette[Math.floor(Math.random() * palette.length)];

const defaultPin = (kind: PinKind, viewport: BoardState["viewport"]): BoardPin => {
  const randomOffset = Math.random() * 120;
  // Calculate center of viewport in canvas space
  const centerX = -viewport.x + 400;
  const centerY = -viewport.y + 300;
  return {
    id: crypto.randomUUID(),
    kind,
    title: kind === "image" ? "Image" : kind === "list" ? "List" : kind === "link" ? "Link" : kind === "attachment" ? "Attachment" : "Note",
    content: "",
    x: centerX + randomOffset,
    y: centerY + randomOffset,
    width: kind === "image" ? 280 : kind === "link" ? 320 : 240,
    height: kind === "image" ? 220 : kind === "link" ? 200 : 180,
    zIndex: Date.now(),
    color: randomColor(),
    labelIds: [],
    groupId: null,
    locked: false,
  };
};

const getChangeLabel = (prev: BoardState, current: BoardState): string | null => {
  // Detect pin additions
  if (current.pins.length > prev.pins.length) {
    const newPins = current.pins.filter(p => !prev.pins.find(pp => pp.id === p.id));
    if (newPins.length > 0) {
      const pin = newPins[0];
      return `Added: ${pin.title || pin.kind}`;
    }
  }
  
  // Detect pin deletions
  if (current.pins.length < prev.pins.length) {
    const deletedPins = prev.pins.filter(p => !current.pins.find(cp => cp.id === p.id));
    if (deletedPins.length > 0) {
      const pin = deletedPins[0];
      return `Deleted: ${pin.title || pin.kind}`;
    }
  }
  
  // Detect pin moves
  for (const pin of current.pins) {
    const prevPin = prev.pins.find(p => p.id === pin.id);
    if (prevPin && (prevPin.x !== pin.x || prevPin.y !== pin.y)) {
      return `Moved: ${pin.title || pin.kind}`;
    }
  }
  
  // Detect pin resizes
  for (const pin of current.pins) {
    const prevPin = prev.pins.find(p => p.id === pin.id);
    if (prevPin && (prevPin.width !== pin.width || prevPin.height !== pin.height)) {
      return `Resized: ${pin.title || pin.kind}`;
    }
  }
  
  // Detect content changes
  for (const pin of current.pins) {
    const prevPin = prev.pins.find(p => p.id === pin.id);
    if (prevPin && prevPin.content !== pin.content) {
      return `Edited: ${pin.title || pin.kind}`;
    }
  }
  
  // Detect title changes
  for (const pin of current.pins) {
    const prevPin = prev.pins.find(p => p.id === pin.id);
    if (prevPin && prevPin.title !== pin.title) {
      return `Renamed: ${pin.title || pin.kind}`;
    }
  }
  
  // Detect wire changes
  if ((current.wires?.length || 0) > (prev.wires?.length || 0)) {
    return "Connection added";
  }
  if ((current.wires?.length || 0) < (prev.wires?.length || 0)) {
    return "Connection removed";
  }
  
  // Return null for non-pin changes (will be filtered out)
  return null;
};

export default function BoardEditor() {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;

  const [boardTitle, setBoardTitle] = useState("My Board");
  const [boardDescription, setBoardDescription] = useState("A free-form pin board");
  const [boardTags, setBoardTags] = useState<string[]>([]);
  const [boardCategories, setBoardCategories] = useState<string[]>([]);
  const [showBoardSettings, setShowBoardSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [selectedPinIds, setSelectedPinIds] = useState<string[]>([]);
  const [interaction, setInteraction] = useState<Interaction>({ mode: "idle" });
  const [snapshotName, setSnapshotName] = useState("Latest snapshot");
  const [snapshotNote, setSnapshotNote] = useState("");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showToolMenu, setShowToolMenu] = useState(false);
  const [showSnapshotMenu, setShowSnapshotMenu] = useState(false);
  const [externalCategories, setExternalCategories] = useState<Array<{ id: string; name: string; color: string; description?: string }>>([]);
  const [labels, setLabels] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [groups, setGroups] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{ x: number; y: number } | null>(null);
  const [clipboard, setClipboard] = useState<BoardPin[] | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pinId: string } | null>(null);
  const [ctrlPressed, setCtrlPressed] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; name: string; type: string } | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [filterLabel, setFilterLabel] = useState<string | null>(null);
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<Array<{ id: string; name: string }>>([]);
  const [allCategories, setAllCategories] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [userCategories, setUserCategories] = useState<Array<{ id: string; name: string; color: string; description?: string }>>([]);
  const [userTags, setUserTags] = useState<Array<{ id: string; name: string; color: string; description?: string }>>([]);

  const history = useBoardHistory(emptyBoardState);
  const resetHistory = history.reset;
  const historyCommit = history.commit;
  const stateRef = useRef(history.state);
  const interactionRef = useRef(interaction);
  const hasHydratedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const selectedPin = useMemo(() => history.state.pins.find((pin) => pin.id === selectedPinId) ?? null, [history.state.pins, selectedPinId]);
  const focusPin = useCallback((pinId: string) => {
    setSelectedPinId(pinId);
    setSelectedPinIds([]);
  }, []);

  const deletePin = useCallback(
    (pinId: string) => {
      historyCommit((draft) => {
        draft.pins = draft.pins.filter((p) => p.id !== pinId);
        draft.groups = draft.groups.map((group) => ({
          ...group,
          pinIds: group.pinIds.filter((id) => id !== pinId),
        }));
        if (draft.wires) {
          draft.wires = draft.wires.filter((w) => w.fromPinId !== pinId && w.toPinId !== pinId);
        }
        return draft;
      });
      if (selectedPinId === pinId) {
        setSelectedPinId(null);
      }
    },
    [historyCommit, selectedPinId]
  );

  // Keyboard shortcuts for copy/paste/delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Track Ctrl key for marquee selection cursor
      if (e.ctrlKey || e.metaKey) {
        setCtrlPressed(true);
      }
      const target = e.target as HTMLElement | null;
      const isEditableTarget = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && !isEditableTarget) {
        if (e.key === 'c') {
          e.preventDefault();
          if (selectedPin) {
            setClipboard([selectedPin]);
            toast.success('Copied');
          }
        } else if (e.key === 'v') {
          e.preventDefault();
          if (clipboard) {
            clipboard.forEach(pin => {
              const newPin = structuredClone(pin);
              newPin.id = crypto.randomUUID();
              newPin.x += 30;
              newPin.y += 30;
              history.commit((draft) => {
                draft.pins.push(newPin);
                return draft;
              });
            });
            toast.success('Pasted');
          }
        }
      } else if (!isEditableTarget && (e.key === 'Delete' || e.key === 'Backspace')) {
        // Delete selected pin
        if (selectedPin) {
          e.preventDefault();
          deletePin(selectedPin.id);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        setCtrlPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedPin, clipboard, history, deletePin]);

  useEffect(() => {
    stateRef.current = history.state;
  }, [history.state]);

  useEffect(() => {
    interactionRef.current = interaction;
  }, [interaction]);

  const loadSnapshots = useCallback(async (id: string) => {
    const res = await fetch(`/api/boards/${id}/snapshots`);
    if (!res.ok) return;
    const data = await res.json();
    setSnapshots(data as SnapshotSummary[]);
  }, [setSnapshots]);

  useEffect(() => {
    if (!isLoaded || !user || !boardId) return;

    const load = async () => {
      setLoading(true);
      try {
        const [boardRes, labelsRes, groupsRes, categoriesRes, tagsRes] = await Promise.all([
          fetch(`/api/boards/${boardId}`, { credentials: 'include' }),
          fetch(`/api/boards/${boardId}/labels`, { credentials: 'include' }),
          fetch(`/api/boards/${boardId}/groups`, { credentials: 'include' }),
          fetch(`/api/categories`, { credentials: 'include' }),
          fetch(`/api/tags`, { credentials: 'include' }),
        ]);
        
        if (!boardRes.ok) {
          throw new Error("Failed to load board");
        }
        
        const data = await boardRes.json();
        const normalized = sanitizeBoardState(data.state ?? emptyBoardState);
        setBoardTitle(data.title ?? "My Board");
        setBoardDescription(data.description ?? "A free-form pin board");
        setBoardTags(data.tag_ids ?? []);
        setBoardCategories(data.category_ids ?? []);
        resetHistory(normalized);
        hasHydratedRef.current = true;
        await loadSnapshots(boardId);

        if (labelsRes.ok) {
          const lbls = await labelsRes.json();
          setLabels(lbls);
        }

        if (groupsRes.ok) {
          const grps = await groupsRes.json();
          setGroups(grps);
        }

        if (categoriesRes.ok) {
          const cats = await categoriesRes.json();
          setUserCategories(cats);
        }

        if (tagsRes.ok) {
          const tags = await tagsRes.json();
          setUserTags(tags);
        }
      } catch (error) {
        console.error(error);
        toast.error("Could not load your board");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [boardId, isLoaded, loadSnapshots, resetHistory, router, user]);

  const persistBoard = useCallback(async (nextState: BoardState) => {
    if (!boardId) return;
    setSaving(true);
    try {
      const payload = {
        title: boardTitle,
        description: boardDescription,
        tag_ids: boardTags,
        category_ids: boardCategories,
        state: nextState,
      };
      
      console.log('Saving board with payload:', {
        boardId,
        title: boardTitle,
        tags: boardTags.length,
        categories: boardCategories.length,
        pins: nextState.pins.length,
        groups: nextState.groups.length,
      });

      const res = await fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || `Failed to save board (${res.status})`;
        console.error('Board save failed:', errorMessage, errorData);
        throw new Error(errorMessage);
      }
      
      console.log('Board saved successfully');
    } catch (error) {
      console.error('Error saving board:', error);
      toast.error(error instanceof Error ? error.message : "Could not save board");
    } finally {
      setSaving(false);
    }
  }, [boardId, boardTitle, boardDescription, boardTags, boardCategories]);

  useEffect(() => {
    if (!boardId || !hasHydratedRef.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persistBoard(stateRef.current);
    }, 650);
  }, [boardId, history.state, persistBoard]);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const current = interactionRef.current;
      
      // Handle marquee selection tracking
      if (marqueeStart) {
        setMarqueeEnd({ x: event.clientX, y: event.clientY });
        return;
      }
      
      if (current.mode === "idle") return;

      const zoom = stateRef.current.viewport.zoom;

      if (current.mode === "pan") {
        const dx = (event.clientX - current.start.x);
        const dy = (event.clientY - current.start.y);
        history.mutate((draft) => {
          draft.viewport.x = current.origin.x + dx;
          draft.viewport.y = current.origin.y + dy;
          return draft;
        });
      }

      if (current.mode === "drag") {
        const dx = (event.clientX - current.start.x) / zoom;
        const dy = (event.clientY - current.start.y) / zoom;
        history.mutate((draft) => {
          const pin = draft.pins.find((p) => p.id === current.pinId);
          if (!pin || pin.locked) return draft;
          pin.x = current.origin.x + dx;
          pin.y = current.origin.y + dy;
          return draft;
        });
      }

      if (current.mode === "multi-drag") {
        const dx = (event.clientX - current.start.x) / zoom;
        const dy = (event.clientY - current.start.y) / zoom;
        history.mutate((draft) => {
          current.pinIds.forEach(pinId => {
            const pin = draft.pins.find((p) => p.id === pinId);
            const origin = current.origins.get(pinId);
            if (!pin || pin.locked || !origin) return;
            pin.x = origin.x + dx;
            pin.y = origin.y + dy;
          });
          return draft;
        });
      }

      if (current.mode === "resize") {
        const dx = (event.clientX - current.start.x) / zoom;
        const dy = (event.clientY - current.start.y) / zoom;
        history.mutate((draft) => {
          const pin = draft.pins.find((p) => p.id === current.pinId);
          if (!pin || pin.locked) return draft;
          const minW = pin.naturalWidth ?? 160;
          const minH = pin.naturalHeight ?? 140;
          pin.width = Math.max(minW, current.origin.width + dx);
          pin.height = Math.max(minH, current.origin.height + dy);
          return draft;
        });
      }
    };

    const handleUp = () => {
      // Handle marquee selection end
      if (marqueeStart && marqueeEnd) {
        // Calculate marquee bounds in screen space
        const left = Math.min(marqueeStart.x, marqueeEnd.x);
        const right = Math.max(marqueeStart.x, marqueeEnd.x);
        const top = Math.min(marqueeStart.y, marqueeEnd.y);
        const bottom = Math.max(marqueeStart.y, marqueeEnd.y);
        
        // Find pins within marquee
        const selectedPins = history.state.pins.filter(pin => {
          const canvas = canvasRef.current;
          if (!canvas) return false;
          
          const rect = canvas.getBoundingClientRect();
          const viewport = history.state.viewport;
          
          // Transform pin position to screen space
          const screenX = pin.x * viewport.zoom + viewport.x + rect.left;
          const screenY = pin.y * viewport.zoom + viewport.y + rect.top;
          
          return screenX >= left && screenX <= right &&
                 screenY >= top && screenY <= bottom;
        });
        
        if (selectedPins.length > 0) {
          setSelectedPinIds(selectedPins.map(p => p.id));
          setSelectedPinId(selectedPins[0].id);
          toast.success(`Selected ${selectedPins.length} pin(s)`);
        }
        
        setMarqueeStart(null);
        setMarqueeEnd(null);
        return;
      }
      
      const mode = interactionRef.current.mode;
      // Only commit if we were actually doing something with pins
      if (mode === "drag" || mode === "multi-drag" || mode === "resize") {
        history.commit((draft) => draft);
      }
      setInteraction({ mode: "idle" });
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [history, marqueeStart, marqueeEnd]);

  const zoomBy = (direction: "in" | "out") => {
    history.mutate((draft) => {
      const delta = direction === "in" ? 0.15 : -0.15;
      draft.viewport.zoom = clamp(draft.viewport.zoom + delta, 0.5, 2.6);
      return draft;
    });
  };

  const handleWheel = (event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      event.stopPropagation();
      const delta = event.deltaY > 0 ? -0.15 : 0.15;
      history.mutate((draft) => {
        draft.viewport.zoom = clamp(draft.viewport.zoom + delta, 0.5, 2.6);
        return draft;
      });
    }
  };

  const handleCanvasPointerDown = (event: React.PointerEvent) => {
    if (event.ctrlKey && event.button === 0) {
      // Start marquee selection
      event.preventDefault();
      setMarqueeStart({ x: event.clientX, y: event.clientY });
      setMarqueeEnd({ x: event.clientX, y: event.clientY });
    } else if (event.button === 0 || event.button === 1 || event.shiftKey) {
      handlePanStart(event);
    } else if (interaction.mode === "idle" && event.button === 0 && event.detail >= 2) {
      // Double-click to create note
      setSelectedPinId(null);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (event.clientX - rect.left) / stateRef.current.viewport.zoom - stateRef.current.viewport.x;
      const y = (event.clientY - rect.top) / stateRef.current.viewport.zoom - stateRef.current.viewport.y;
      history.commit((draft) => {
        const newPin = defaultPin("note", draft.viewport);
        newPin.x = x;
        newPin.y = y;
        draft.pins.push(newPin);
        return draft;
      });
    }
  };

  const handlePinRightClick = (event: React.MouseEvent, pinId: string) => {
    event.preventDefault();
    event.stopPropagation();
    focusPin(pinId);
    setContextMenu({ x: event.clientX, y: event.clientY, pinId });
  };

  const handlePinPointerDown = (pin: BoardPin, event: React.PointerEvent) => {
    event.stopPropagation();
    
    // Handle wire tool mode
    if (WIRES_ENABLED && interaction.mode === "wire") {
      if (!interaction.fromPinId) {
        // First pin selected
        setInteraction({ mode: "wire", fromPinId: pin.id });
        focusPin(pin.id);
        toast.success(`First pin selected. Click another pin to connect.`);
      } else {
        // Second pin selected - create connection
        const fromPinId = interaction.fromPinId;
        if (fromPinId === pin.id) {
          toast.error("Cannot connect a pin to itself");
          return;
        }
        
        history.commit((draft) => {
          if (!draft.wires) draft.wires = [];
          // Check if connection already exists
          const exists = draft.wires.some(
            w => (w.fromPinId === fromPinId && w.toPinId === pin.id) ||
                 (w.fromPinId === pin.id && w.toPinId === fromPinId)
          );
          
          if (!exists) {
            draft.wires.push({
              id: crypto.randomUUID(),
              fromPinId,
              toPinId: pin.id,
              color: "#38bdf8",
            });
          }
          return draft;
        });
        
        toast.success("Pins connected!");
        setInteraction({ mode: "wire", fromPinId: null });
        setSelectedPinId(null);
      }
      return;
    }
    
    // If multiple pins are selected and this pin is one of them, drag all
    if (selectedPinIds.length > 1 && selectedPinIds.includes(pin.id)) {
      const origins = new Map<string, { x: number; y: number }>();
      selectedPinIds.forEach(id => {
        const p = history.state.pins.find(pin => pin.id === id);
        if (p) origins.set(id, { x: p.x, y: p.y });
      });
      setInteraction({ 
        mode: "multi-drag", 
        pinIds: selectedPinIds, 
        start: { x: event.clientX, y: event.clientY }, 
        origins 
      });
    } else {
      focusPin(pin.id);
      setInteraction({ mode: "drag", pinId: pin.id, start: { x: event.clientX, y: event.clientY }, origin: { x: pin.x, y: pin.y } });
    }
  };

  const handlePanStart = (event: React.PointerEvent) => {
    // Allow pan with: left button on background, middle button, or shift+left
    if (event.button === 1 || event.shiftKey || event.button === 0) {
      event.preventDefault();
      event.stopPropagation();
      setInteraction({ mode: "pan", start: { x: event.clientX, y: event.clientY }, origin: { x: stateRef.current.viewport.x, y: stateRef.current.viewport.y } });
    }
  };

  const handleResizeStart = (pin: BoardPin, event: React.PointerEvent) => {
    event.stopPropagation();
    focusPin(pin.id);
    setInteraction({
      mode: "resize",
      pinId: pin.id,
      start: { x: event.clientX, y: event.clientY },
      origin: { width: pin.width, height: pin.height },
    });
  };

  const addPin = (kind: PinKind) => {
    history.commit((draft) => {
      const newPin = defaultPin(kind, draft.viewport);
      // Auto-start lists with a bullet
      if (kind === "list") {
        newPin.content = "• ";
      }
      draft.pins.push(newPin);
      return draft;
    });
    setShowToolMenu(false);
  };

  const updatePin = (pinId: string, changes: Partial<BoardPin>) => {
    history.commit((draft) => {
      const pin = draft.pins.find((p) => p.id === pinId);
      if (!pin) return draft;
      Object.assign(pin, changes);
      return draft;
    });
  };

  const deleteWire = (wireId: string) => {
    history.commit((draft) => {
      if (draft.wires) {
        draft.wires = draft.wires.filter((w) => w.id !== wireId);
      }
      return draft;
    });
    toast.success("Connection removed");
  };

  const duplicatePin = (pinId: string) => {
    const source = history.state.pins.find((p) => p.id === pinId);
    if (!source) return;
    history.commit((draft) => {
      draft.pins.push({
        ...structuredClone(source),
        id: crypto.randomUUID(),
        x: source.x + 32,
        y: source.y + 32,
        zIndex: Date.now(),
      });
      return draft;
    });
  };

  const createLabel = async (name: string, color?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    // Check if label already exists
    const existing = labels.find((label) => label.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;
    
    try {
      const res = await fetch(`/api/boards/${boardId}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: trimmed, color: color || randomColor() }),
      });
      if (res.ok) {
        const newLabel = await res.json();
        setLabels((prev) => [...prev, newLabel]);
        toast.success("Label created");
        return newLabel.id;
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create label");
    }
    return null;
  };

  const toggleLabelOnPin = (pinId: string, labelId: string) => {
    history.commit((draft) => {
      const pin = draft.pins.find((p) => p.id === pinId);
      if (!pin) return draft;
      if (!pin.labelIds) pin.labelIds = [];
      if (pin.labelIds.includes(labelId)) {
        pin.labelIds = pin.labelIds.filter((id) => id !== labelId);
      } else {
        pin.labelIds.push(labelId);
      }
      return draft;
    });
  };

  const createGroup = async (name: string, color?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    // Check if group already exists
    const existing = groups.find((group) => group.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;
    
    try {
      const res = await fetch(`/api/boards/${boardId}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: trimmed, color: color || randomColor() }),
      });
      if (res.ok) {
        const newGroup = await res.json();
        setGroups((prev) => [...prev, newGroup]);
        toast.success("Group created");
        return newGroup.id;
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create group");
    }
    return null;
  };

  const createCategory = async (name: string, color?: string, description?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    try {
      const res = await fetch("/api/board-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, color: color || randomColor(), description }),
      });
      if (res.ok) {
        const newCat = await res.json();
        setExternalCategories((prev) => [...prev, newCat]);
        toast.success("Category created");
        return newCat.id;
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create category");
    }
    return null;
  };

  const toggleCategoryOnPin = (pinId: string, categoryId: string) => {
    history.commit((draft) => {
      const pin = draft.pins.find((p) => p.id === pinId);
      if (!pin) return draft;
      if (!pin.categoryIds) pin.categoryIds = [];
      if (pin.categoryIds.includes(categoryId)) {
        pin.categoryIds = pin.categoryIds.filter((id) => id !== categoryId);
      } else {
        pin.categoryIds.push(categoryId);
      }
      return draft;
    });
  };

  const assignGroup = (pinId: string, groupId: string | null) => {
    history.commit((draft) => {
      const pin = draft.pins.find((p) => p.id === pinId);
      if (!pin) return draft;
      draft.groups = draft.groups.map((group) => ({
        ...group,
        pinIds: group.pinIds.filter((id) => id !== pinId),
      }));
      if (groupId) {
        const group = draft.groups.find((g) => g.id === groupId);
        if (group && !group.pinIds.includes(pinId)) {
          group.pinIds.push(pinId);
        }
      }
      pin.groupId = groupId;
      return draft;
    });
  };

  const handleImageFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    setShowToolMenu(false);
    const file = files[0];
    const resetPicker = () => {
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    };

    if (!file.type.startsWith("image/")) {
      toast.error("Please pick an image file");
      resetPicker();
      return;
    }

    if (file.size > MAX_IMAGE_FILE_SIZE) {
      toast.error("Image must be smaller than 8MB");
      resetPicker();
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      toast.error("Could not read that image");
      resetPicker();
    };
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const largestSide = Math.max(img.width, img.height);
        const scale = largestSide > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / largestSide : 1;
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        history.commit((draft) => {
          draft.pins.push({
            ...defaultPin("image", draft.viewport),
            imageUrl: src,
            width,
            height,
            naturalWidth: img.width,
            naturalHeight: img.height,
          });
          return draft;
        });
        resetPicker();
      };
      img.onerror = () => {
        toast.error("Unable to load that image");
        resetPicker();
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleAttachmentFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const file = files[0];
    const resetPicker = () => {
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }
    };

    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error("File must be smaller than 1MB");
      resetPicker();
      return;
    }

    let targetPinId = selectedPinId;
    if (!targetPinId) {
      let createdPinId: string | null = null;
      history.commit((draft) => {
        const newPin = defaultPin("note", draft.viewport);
        newPin.title = file.name.replace(/\.[^/.]+$/, "") || "Attachment";
        draft.pins.push(newPin);
        createdPinId = newPin.id;
        return draft;
      });
      if (!createdPinId) {
        toast.error("Could not prepare space for that attachment");
        resetPicker();
        return;
      }
      targetPinId = createdPinId;
      focusPin(createdPinId);
    } else {
      focusPin(targetPinId);
    }

    const pinId = targetPinId;

    const reader = new FileReader();
    reader.onerror = () => {
      toast.error("Could not read that file");
      resetPicker();
    };
    reader.onload = () => {
      const fileData = reader.result as string;
      const attachment = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        url: fileData,
        uploadedAt: new Date().toISOString(),
      };

      history.commit((draft) => {
        const pin = draft.pins.find((p) => p.id === pinId);
        if (!pin) return draft;
        if (!pin.attachments) pin.attachments = [];
        pin.attachments.push(attachment);
        return draft;
      });
      toast.success("Attachment added");
      resetPicker();
    };
    reader.readAsDataURL(file);
  };

  const addLinkPin = async () => {
    if (!linkUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    try {
      // Simple metadata extraction (you could enhance this with an API)
      const url = linkUrl.trim();
      const linkMetadata = {
        url,
        title: new URL(url).hostname,
        description: "Link preview",
      };

      history.commit((draft) => {
        const newPin = defaultPin("link", draft.viewport);
        newPin.linkMetadata = linkMetadata;
        newPin.title = linkMetadata.title || "Link";
        draft.pins.push(newPin);
        return draft;
      });

      setShowLinkModal(false);
      setLinkUrl("");
      toast.success("Link added");
    } catch (error) {
      toast.error("Invalid URL");
    }
  };

  const togglePinLock = (pinId: string) => {
    history.commit((draft) => {
      const pin = draft.pins.find((p) => p.id === pinId);
      if (!pin) return draft;
      pin.locked = !pin.locked;
      return draft;
    });
    toast.success(history.state.pins.find((p) => p.id === pinId)?.locked ? "Pin locked" : "Pin unlocked");
  };

  const saveSnapshot = async () => {
    if (!boardId) return;
    try {
      const res = await fetch(`/api/boards/${boardId}/snapshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: snapshotName || "Snapshot", note: snapshotNote, state: history.state }),
      });
      if (!res.ok) throw new Error("Failed snapshot");
      toast.success("Snapshot saved");
      await loadSnapshots(boardId);
      setShowSnapshotMenu(false);
    } catch (error) {
      console.error(error);
      toast.error("Could not save snapshot");
    }
  };

  const restoreSnapshot = async (snapshotId: string) => {
    if (!boardId) return;
    try {
      const res = await fetch(`/api/boards/${boardId}/snapshots/${snapshotId}/restore`, { method: "POST" });
      if (!res.ok) throw new Error("Restore failed");
      const data = await res.json();
      const normalized = sanitizeBoardState(data.state);
      history.reset(normalized);
      toast.success("Snapshot restored");
    } catch (error) {
      console.error(error);
      toast.error("Could not restore snapshot");
    }
  };

  const deleteSnapshot = async (snapshotId: string) => {
    if (!boardId) return;
    const res = await fetch(`/api/boards/${boardId}/snapshots/${snapshotId}`, { method: "DELETE" });
    if (res.ok) {
      setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));
      toast.success("Snapshot deleted");
    }
  };

  const filteredPins = useMemo(() => {
    let pins = history.state.pins;
    
    // Apply search filter
    if (search.trim()) {
      const term = search.toLowerCase();
      pins = pins.filter((pin) =>
        pin.title.toLowerCase().includes(term) || pin.content.toLowerCase().includes(term)
      );
    }
    
    // Apply label filter
    if (filterLabel) {
      pins = pins.filter((pin) => pin.labelIds?.includes(filterLabel));
    }
    
    // Apply group filter
    if (filterGroup) {
      pins = pins.filter((pin) => pin.groupId === filterGroup);
    }
    
    return pins;
  }, [history.state.pins, search, filterLabel, filterGroup]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        Sign in to access the board.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Improved Header */}
      <header className="border-b border-white/10 bg-slate-900/70 backdrop-blur-md z-30 sticky top-0">
        <div className="px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: Navigation & Board Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-white/5 rounded-md transition-colors flex-shrink-0"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <NextImage
                src="/logo.svg"
                alt="Digital Board"
                width={140}
                height={40}
                className="h-8 w-auto flex-shrink-0"
                priority
              />
              <div
                className="min-w-0 flex-1 cursor-pointer hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors"
                onClick={() => setShowBoardSettings(true)}
                title="Click to edit board settings"
              >
                <div className="text-lg font-semibold truncate flex items-center gap-2">
                  <span>{boardTitle}</span>
                  {/* Category Badge (Solid) */}
                  {boardCategories.length > 0 && boardCategories[0] && (() => {
                    const category = userCategories.find(c => c.id === boardCategories[0]);
                    if (!category) return null;
                    return (
                      <span
                        className="px-2 py-0.5 rounded-md text-xs font-medium text-white"
                        style={{ backgroundColor: category.color }}
                        title={category.description || category.name}
                      >
                        {category.name}
                      </span>
                    );
                  })()}
                </div>
                <div className="text-xs text-slate-400 truncate flex items-center gap-2 flex-wrap">
                  <span>{boardDescription || "Click to add description"}</span>
                  {/* Tag Badges (Outline) */}
                  {boardTags.length > 0 && (
                    <>
                      <span className="text-slate-500">•</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {boardTags.map(tagId => {
                          const tag = userTags.find(t => t.id === tagId);
                          if (!tag) return null;
                          return (
                            <span
                              key={tag.id}
                              className="px-2 py-0.5 rounded-md text-xs font-medium border"
                              style={{ 
                                borderColor: tag.color,
                                color: tag.color
                              }}
                              title={tag.description || tag.name}
                            >
                              {tag.name}
                            </span>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Center: Tools */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1 border border-white/10">
              <button onClick={() => zoomBy("out")} className="p-1.5 hover:bg-white/10 rounded-md" aria-label="Zoom out">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm px-2 min-w-[3.5rem] text-center">{Math.round(history.state.viewport.zoom * 100)}%</span>
              <button onClick={() => zoomBy("in")} className="p-1.5 hover:bg-white/10 rounded-md" aria-label="Zoom in">
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Undo/Redo */}
            <button
              onClick={history.undo}
              disabled={!history.canUndo}
              className="p-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={history.redo}
              disabled={!history.canRedo}
              className="p-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            {/* History Button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10"
              aria-label="History"
              title="View history"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Snapshot Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSnapshotMenu(!showSnapshotMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/30"
              >
                <Save className="w-4 h-4" />
                Snapshot
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showSnapshotMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-white/10 rounded-lg shadow-xl py-2 z-50">
                  <div className="px-3 py-2 border-b border-white/10">
                    <input
                      value={snapshotName}
                      onChange={(e) => setSnapshotName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm mb-2"
                      placeholder="Snapshot name"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <input
                      value={snapshotNote}
                      onChange={(e) => setSnapshotNote(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm mb-2"
                      placeholder="Short note (optional)"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={saveSnapshot}
                      className="w-full px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-md hover:bg-emerald-500/30 text-sm"
                    >
                      Save Snapshot
                    </button>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    {snapshots.length === 0 ? (
                      <p className="text-xs text-slate-500 px-3 py-2">No snapshots yet</p>
                    ) : (
                      snapshots.map((snap) => (
                        <div key={snap.id} className="flex items-center justify-between px-3 py-2 hover:bg-white/5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{snap.name}</p>
                            <p className="text-xs text-slate-400">{new Date(snap.created_at).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => restoreSnapshot(snap.id)}
                              className="p-1 hover:bg-white/10 rounded-md"
                              aria-label="Restore"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteSnapshot(snap.id)}
                              className="p-1 hover:bg-red-500/10 rounded-md text-red-300"
                              aria-label="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Status */}
          <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
            <span className={`h-2 w-2 rounded-full ${saving ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
            <span className="text-xs text-slate-300">{saving ? "Saving..." : "Synced"}</span>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-md transition-colors"
              aria-label="Toggle sidebar"
              title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>
            <UserProfile />
          </div>
        </div>
      </header>

      {/* History Panel - Floating below header */}
      {showHistory && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute left-1/2 transform -translate-x-1/2 top-20 z-40 w-96 max-h-[500px] bg-slate-900/95 backdrop-blur border border-white/10 rounded-lg shadow-2xl overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div 
            className="overflow-y-auto max-h-[440px] p-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 hover:scrollbar-thumb-slate-600"
            ref={(el) => {
              if (el && showHistory) {
                el.scrollTop = el.scrollHeight;
              }
            }}
          >
            {history.past.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8">No history yet</p>
            ) : (
              <div className="space-y-1">
                {/* History states in order (oldest to newest) */}
                {history.past.slice(-50).map((state, idx) => {
                  const actualIdx = idx;
                  const prevState = actualIdx > 0 ? history.past[actualIdx - 1] : emptyBoardState;
                  const label = getChangeLabel(prevState, state);
                  
                  // Skip entries with no meaningful changes
                  if (!label) return null;
                  
                  const isLatest = idx === history.past.length - 1;
                  const isCurrent = JSON.stringify(state) === JSON.stringify(history.state);
                  
                  return (
                    <button
                      key={actualIdx}
                      onClick={() => {
                        // Just navigate to this state without changing history structure
                        history.setHistory({
                          past: history.past,
                          present: structuredClone(state),
                          future: history.future
                        });
                        
                        toast.success('Viewing history state');
                      }}
                      className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors group relative"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-300 flex-1">{label}</span>
                        <div className="flex items-center gap-1">
                          {isCurrent && (
                            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">Current</span>
                          )}
                          {isLatest && (
                            <span className="text-xs font-semibold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full">Latest</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}

      <main className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar Toggle Button (when closed) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-4 top-4 h-12 w-12 flex items-center justify-center
                      bg-slate-900/80 border border-white/10 rounded-full
                      hover:bg-slate-800 shadow-lg z-20 backdrop-blur"
            aria-label="Open tools panel"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Left Sidebar - Tools & Create */}
        <motion.aside
          initial={false}
          animate={{
            width: sidebarOpen ? 288 : 0,
            opacity: sidebarOpen ? 1 : 0,
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="border-r border-white/10 bg-slate-900/40 backdrop-blur overflow-hidden flex-shrink-0"
        >
          <div className="w-72 px-4 py-6 space-y-6 overflow-y-auto h-full">
            {/* Toolbar Header with Close Button */}
            <div className="flex items-center justify-between mb-2 pb-3 border-b border-white/10">
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg transition-colors"
                aria-label="Close panel"
              >
                <Menu className="w-4 h-4" />
                <span className="text-sm font-semibold text-slate-200">Tool Bar</span>
              </button>
            </div>

            {/* Create Tools Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-300">Create</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => addPin("note")} className="flex flex-col items-center gap-2 px-3 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <AlignLeft className="w-5 h-5" />
                  <span className="text-xs">Note</span>
                </button>
                <button onClick={() => addPin("list")} className="flex flex-col items-center gap-2 px-3 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <Layers className="w-5 h-5" />
                  <span className="text-xs">List</span>
                </button>
                <button onClick={() => setShowLinkModal(true)} className="flex flex-col items-center gap-2 px-3 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <LinkIcon className="w-5 h-5" />
                  <span className="text-xs">Link</span>
                </button>
                {WIRES_ENABLED ? (
                  <button 
                    onClick={() => {
                      setInteraction({ mode: "wire", fromPinId: null });
                      toast.success("Wire tool enabled. Click two pins to connect them.");
                    }} 
                    className="flex flex-col items-center gap-2 px-3 py-3 rounded-lg border bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3 L21 21 M3 21 C 8 16, 16 8, 21 3" />
                    </svg>
                    <span className="text-xs">Wire</span>
                  </button>
                ) : (null /* 
                  <div className="flex flex-col items-center gap-2 px-3 py-3 rounded-lg border border-dashed border-white/15 bg-white/5 text-slate-500">
                    <svg className="w-5 h-5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3 L21 21 M3 21 C 8 16, 16 8, 21 3" />
                    </svg>
                    <span className="text-xs text-center leading-tight">Wires disabled</span>
                  </div>*/
                )}
                <button 
                  onClick={() => {
                    attachmentInputRef.current?.click();
                  }} 
                  className="flex flex-col items-center gap-2 px-3 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <Paperclip className="w-5 h-5" />
                  <span className="text-xs">Attach</span>
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageFiles(e.target.files)}
                />
                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept="*/*"
                  className="hidden"
                  onChange={(e) => handleAttachmentFiles(e.target.files)}
                />
              </div>
            </div>

            {/* Labels & Groups Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Pin Metadata</h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setShowLabelModal(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/40 hover:bg-emerald-500/20 transition-colors text-sm text-emerald-200"
                >
                  <CircleDot className="w-4 h-4" />
                  Create New Label
                </button>
                <button
                  onClick={() => setShowGroupModal(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-blue-500/10 border border-blue-500/40 hover:bg-blue-500/20 transition-colors text-sm text-blue-200"
                >
                  <Layers className="w-4 h-4" />
                  Create New Group
                </button>
              </div>
            </div>

          </div>
        </motion.aside>

        {/* Canvas */}
        <section className="flex-1 relative">
          {/* Search Bar - Floating */}
          <div className={`absolute top-4 z-20 flex items-center gap-3 transition-all ${
            sidebarOpen ? 'left-6' : 'left-20'
          }`}>
            {!searchExpanded ? (
              /* Collapsed Search Icon */
              <button
                onClick={() => setSearchExpanded(true)}
                className="p-3 bg-slate-900/80 backdrop-blur border border-white/10 rounded-lg hover:bg-slate-800/80 transition-all shadow-lg"
                aria-label="Open search"
              >
                <Search className="w-5 h-5 text-slate-400" />
              </button>
            ) : (
              /* Expanded Search Bar */
              <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-white/10 rounded-lg px-3 py-2 shadow-lg animate-in slide-in-from-left duration-200" style={{ width: '600px' }}>
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent flex-1 outline-none text-sm"
                  placeholder="Search pins..."
                  autoFocus
                />
                
                {/* Label Filter */}
                <select
                  value={filterLabel || ""}
                  onChange={(e) => setFilterLabel(e.target.value || null)}
                  className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-emerald-500/40 flex-shrink-0"
                >
                  <option value="">All Labels</option>
                  {labels.map((label) => (
                    <option key={label.id} value={label.id}>
                      {label.name}
                    </option>
                  ))}
                </select>
                
                {/* Group Filter */}
                <select
                  value={filterGroup || ""}
                  onChange={(e) => setFilterGroup(e.target.value || null)}
                  className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-emerald-500/40 flex-shrink-0"
                >
                  <option value="">All Groups</option>
                  {history.state.groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                
                {/* Clear/Close Button */}
                <button
                  onClick={() => {
                    if (search || filterLabel || filterGroup) {
                      setSearch("");
                      setFilterLabel(null);
                      setFilterGroup(null);
                    } else {
                      setSearchExpanded(false);
                    }
                  }}
                  className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                  title={search || filterLabel || filterGroup ? "Clear filters" : "Close search"}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div
            className="absolute inset-0"
            ref={canvasRef}
            data-canvas
            onPointerDown={handleCanvasPointerDown}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Fixed Grid Background */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                backgroundSize: `${64 * history.state.viewport.zoom}px ${64 * history.state.viewport.zoom}px`,
                backgroundPosition: `${history.state.viewport.x * history.state.viewport.zoom}px ${history.state.viewport.y * history.state.viewport.zoom}px`,
              }}
            />

            <div
              className="relative w-full h-full"
              onPointerDown={handleCanvasPointerDown}
              style={{ 
                cursor: ctrlPressed && interaction.mode === "idle" 
                  ? "crosshair" 
                  : interaction.mode === "pan" 
                    ? "grabbing"
                    : (WIRES_ENABLED && interaction.mode === "wire")
                      ? "crosshair"
                      : "grab" 
              }}
            >
              {/* Wires - SVG Layer */}
              {WIRES_ENABLED && (
                <svg
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    transform: `translate(${history.state.viewport.x}px, ${history.state.viewport.y}px) scale(${history.state.viewport.zoom})`,
                    transformOrigin: "top left",
                    width: "20000px",
                    height: "20000px",
                    overflow: "visible",
                  }}
                >
                  {history.state.wires?.map((wire) => {
                    const fromPin = history.state.pins.find(p => p.id === wire.fromPinId);
                    const toPin = history.state.pins.find(p => p.id === wire.toPinId);
                    
                    if (!fromPin || !toPin) return null;
                    
                    // Calculate center points of pins
                    const x1 = fromPin.x + fromPin.width / 2;
                    const y1 = fromPin.y + fromPin.height / 2;
                    const x2 = toPin.x + toPin.width / 2;
                    const y2 = toPin.y + toPin.height / 2;
                    
                    // Calculate control points for curved bezier path
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const curveFactor = Math.min(distance * 0.4, 150);
                    
                    // Create smooth curve
                    const cx1 = x1 + curveFactor;
                    const cy1 = y1;
                    const cx2 = x2 - curveFactor;
                    const cy2 = y2;
                    
                    return (
                      <g key={wire.id}>
                        {/* Wire shadow */}
                        <path
                          d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
                          stroke="rgba(0,0,0,0.3)"
                          strokeWidth="4"
                          fill="none"
                          strokeLinecap="round"
                        />
                        {/* Main wire */}
                        <path
                          d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
                          stroke={wire.color}
                          strokeWidth="2.5"
                          fill="none"
                          strokeLinecap="round"
                          opacity="0.8"
                        />
                        {/* Connection dots */}
                        <circle cx={x1} cy={y1} r="4" fill={wire.color} />
                        <circle cx={x2} cy={y2} r="4" fill={wire.color} />
                      </g>
                    );
                  })}
                  
                  {/* Preview wire when first pin selected */}
                  {interaction.mode === "wire" && interaction.fromPinId && selectedPinId && (
                    (() => {
                      const fromPin = history.state.pins.find(p => p.id === interaction.fromPinId);
                      if (!fromPin) return null;
                      
                      const x1 = fromPin.x + fromPin.width / 2;
                      const y1 = fromPin.y + fromPin.height / 2;
                      
                      return (
                        <circle 
                          cx={x1} 
                          cy={y1} 
                          r="6" 
                          fill="#22c55e" 
                          opacity="0.6"
                          className="animate-pulse"
                        />
                      );
                    })()
                  )}
                </svg>
              )}
              
              {/* Pins */}
              <div
                className="absolute"
                style={{
                  transform: `translate(${history.state.viewport.x}px, ${history.state.viewport.y}px) scale(${history.state.viewport.zoom})`,
                  transformOrigin: "top left",
                  width: "20000px",
                  height: "20000px",
                }}
              >
                {filteredPins.map((pin) => {
                  const isSelected = pin.id === selectedPinId;
                  const groupColor = pin.groupId
                    ? history.state.groups.find((g) => g.id === pin.groupId)?.color
                    : undefined;

                  return (
                    <motion.div
                      key={pin.id}
                      className={`absolute rounded-xl border shadow-xl backdrop-blur ${isSelected ? "border-emerald-400/70 ring-2 ring-emerald-400/20" : "border-white/10"}`}
                      style={{
                        width: pin.width,
                        height: pin.height,
                        transform: `translate(${pin.x}px, ${pin.y}px)`,
                        background: `${pin.color}0f`,
                        zIndex: pin.zIndex,
                      }}
                      onContextMenu={(e) => handlePinRightClick(e, pin.id)}
                    >
                      {/* Pin Header */}
                      <div 
                        className="flex items-center justify-between px-3 py-2 border-b border-white/10 cursor-move"
                        onPointerDown={(e) => handlePinPointerDown(pin, e)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {groupColor && <CircleDot className="w-3 h-3 flex-shrink-0" style={{ color: groupColor }} />}
                          {pin.locked && <Lock className="w-3 h-3 flex-shrink-0 text-amber-400" />}
                          <input
                            value={pin.title}
                            onChange={(e) => updatePin(pin.id, { title: e.target.value })}
                            className="bg-transparent outline-none text-sm flex-1"
                            onPointerDown={(e) => e.stopPropagation()}
                            onFocus={() => focusPin(pin.id)}
                            disabled={pin.locked}
                          />
                        </div>
                      </div>

                      {/* Pin Content */}
                      <div className="px-3 pb-3 h-[calc(100%-3rem)] overflow-hidden cursor-auto">
                        {pin.kind === "image" && pin.imageUrl ? (
                          <div className="relative h-full w-full">
                            <NextImage
                              src={pin.imageUrl}
                              alt={pin.title || "Board pin image"}
                              fill
                              sizes="100%"
                              className="rounded-lg object-contain"
                              draggable={false}
                              unoptimized
                              onPointerDown={(e) => e.stopPropagation()}
                            />
                          </div>
                        ) : pin.kind === "link" && pin.linkMetadata ? (
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <a 
                              href={pin.linkMetadata.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-4 h-4" />
                              {pin.linkMetadata.title || pin.linkMetadata.url}
                            </a>
                            {pin.linkMetadata.description && (
                              <p className="text-xs text-slate-400 mb-2">{pin.linkMetadata.description}</p>
                            )}
                            <textarea
                              value={pin.content}
                              onChange={(e) => updatePin(pin.id, { content: e.target.value })}
                              className="w-full bg-transparent text-sm text-slate-100 resize-none outline-none mt-2 border-t border-white/10 pt-2"
                              placeholder="Add notes..."
                              onPointerDown={(e) => e.stopPropagation()}
                              onFocus={() => focusPin(pin.id)}
                              disabled={pin.locked}
                              rows={3}
                            />
                          </div>
                        ) : pin.kind === "list" ? (
                          <textarea
                            value={pin.content}
                            onChange={(e) => updatePin(pin.id, { content: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && pin.kind === "list") {
                                const textarea = e.currentTarget;
                                const start = textarea.selectionStart;
                                const value = textarea.value;
                                
                                // Check if current line starts with bullet
                                const lineStart = value.lastIndexOf("\n", start - 1) + 1;
                                const lineContent = value.substring(lineStart, start).trimStart();
                                
                                if (lineContent.startsWith("• ")) {
                                  e.preventDefault();
                                  const newValue = value.substring(0, start) + "\n• " + value.substring(start);
                                  updatePin(pin.id, { content: newValue });
                                  // Set cursor after bullet
                                  setTimeout(() => {
                                    textarea.selectionStart = textarea.selectionEnd = start + 3;
                                  }, 0);
                                } else if (lineContent.trim() === "" && start > lineStart) {
                                  // Remove bullet on empty line
                                  e.preventDefault();
                                  const beforeBullet = value.substring(0, lineStart);
                                  const afterCursor = value.substring(start);
                                  updatePin(pin.id, { content: beforeBullet + afterCursor });
                                  setTimeout(() => {
                                    textarea.selectionStart = textarea.selectionEnd = lineStart;
                                  }, 0);
                                }
                              }
                            }}
                            className="w-full h-full bg-transparent text-sm text-slate-100 resize-none outline-none"
                            placeholder="Start with • for bullets (press Enter for new bullet)"
                            onPointerDown={(e) => e.stopPropagation()}
                            onFocus={() => focusPin(pin.id)}
                            disabled={pin.locked}
                          />
                        ) : (
                          <div>
                            <textarea
                              value={pin.content}
                              onChange={(e) => updatePin(pin.id, { content: e.target.value })}
                              className="w-full bg-transparent text-sm text-slate-100 resize-none outline-none mb-2"
                              placeholder="Write something..."
                              onPointerDown={(e) => e.stopPropagation()}
                              onFocus={() => focusPin(pin.id)}
                              disabled={pin.locked}
                              style={{ height: pin.attachments && pin.attachments.length > 0 ? 'calc(100% - 80px)' : '100%' }}
                            />
                            {/* Attachments */}
                            {pin.attachments && pin.attachments.length > 0 && (
                              <div className="space-y-1 mt-auto">
                                {pin.attachments.map((att) => (
                                  <button
                                    key={att.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewAttachment({ url: att.url, name: att.name, type: att.type });
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors text-left"
                                  >
                                    <Paperclip className="w-3 h-3 flex-shrink-0" />
                                    <span className="text-xs truncate flex-1">{att.name}</span>
                                    <span className="text-[10px] text-slate-400">{(att.size / 1024).toFixed(1)}KB</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Labels */}
                      {(pin.labelIds && pin.labelIds.length > 0) && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-2 text-[11px] text-slate-200">
                          {pin.labelIds.map((labelId) => {
                            const label = labels.find((l) => l.id === labelId);
                            if (!label) return null;
                            return (
                              <span key={label.id} className="px-2 py-0.5 rounded-full" style={{ background: `${label.color}33` }}>
                                {label.name}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Resize Handle */}
                      <div
                        className="absolute bottom-1 right-1 w-5 h-5 rounded-sm bg-white/20 hover:bg-emerald-400/50 cursor-nwse-resize transition-all border border-white/30 hover:border-emerald-400"
                        onPointerDown={(e) => handleResizeStart(pin, e)}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Board Preview Overlay - Bottom Right */}
        <div className="fixed bottom-4 right-4 w-80 h-56 bg-slate-900/60 border border-white/20 rounded-lg p-2 z-30 backdrop-blur shadow-xl">
          <div className="text-xs text-slate-400 mb-1">Board Preview</div>
          <svg
            viewBox="0 0 300 200"
            className="w-full h-full bg-slate-950 rounded"
            preserveAspectRatio="xMidYMid meet"
          >
            {(() => {
              const pins = history.state.pins;
              if (pins.length === 0) {
                return <text x="150" y="100" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="12">Empty board</text>;
              }

              const minX = Math.min(...pins.map(p => p.x));
              const maxX = Math.max(...pins.map(p => p.x + p.width));
              const minY = Math.min(...pins.map(p => p.y));
              const maxY = Math.max(...pins.map(p => p.y + p.height));
              
              const padding = 20;
              const boardWidth = maxX - minX + padding * 2;
              const boardHeight = maxY - minY + padding * 2;
              const scale = Math.min(300 / boardWidth, 200 / boardHeight);
              
              return (
                <>
                  <rect width="300" height="200" fill="rgba(0,0,0,0.5)" />
                  <rect
                    x={20}
                    y={10}
                    width={260}
                    height={180}
                    fill="none"
                    stroke="rgba(100,200,255,0.2)"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                  {pins.map(pin => (
                    <g key={pin.id}>
                      <rect
                        x={((pin.x - minX + padding) * scale)}
                        y={((pin.y - minY + padding) * scale)}
                        width={Math.max(pin.width * scale, 2)}
                        height={Math.max(pin.height * scale, 2)}
                        fill={pin.id === selectedPin?.id ? "#10b981" : pin.color}
                        opacity={pin.id === selectedPin?.id ? 0.8 : 0.5}
                        stroke={pin.id === selectedPin?.id ? "#10b981" : "white"}
                        strokeWidth="0.5"
                      />
                    </g>
                  ))}
                </>
              );
            })()}
          </svg>
        </div>

        {/* Marquee Selection Visual */}
        {marqueeStart && marqueeEnd && (
          <div
            className="fixed border-2 border-blue-400 bg-blue-400/10 pointer-events-none z-20"
            style={{
              left: Math.min(marqueeStart.x, marqueeEnd.x) + 'px',
              top: Math.min(marqueeStart.y, marqueeEnd.y) + 'px',
              width: Math.abs(marqueeEnd.x - marqueeStart.x) + 'px',
              height: Math.abs(marqueeEnd.y - marqueeStart.y) + 'px',
            }}
          />
        )}

        {/* Right-Click Context Menu */}
        {contextMenu && selectedPin && (
          <div
            className="fixed bg-slate-900/95 border border-white/20 rounded-lg shadow-xl backdrop-blur z-40 p-3 space-y-3 w-64"
            style={{
              left: contextMenu.x + 'px',
              top: contextMenu.y + 'px',
            }}
            onMouseLeave={() => setContextMenu(null)}
          >
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-white/10">
              <button
                onClick={() => {
                  togglePinLock(selectedPin.id);
                  setContextMenu(null);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm"
              >
                {selectedPin.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {selectedPin.locked ? "Unlock" : "Lock"}
              </button>
              <button
                onClick={() => {
                  setClipboard([selectedPin]);
                  setContextMenu(null);
                  toast.success("Copied");
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={() => {
                  duplicatePin(selectedPin.id);
                  setContextMenu(null);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm"
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
              <button
                onClick={() => {
                  deletePin(selectedPin.id);
                  setContextMenu(null);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/40 hover:bg-red-500/20 transition-colors text-sm text-red-300"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>

            {/* Labels Section */}
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Labels</p>
              <div className="flex flex-wrap gap-1.5">
                {labels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => {
                      toggleLabelOnPin(selectedPin.id, label.id);
                      setContextMenu(null);
                    }}
                    className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${(selectedPin.labelIds ?? []).includes(label.id) ? "border-emerald-400 text-emerald-200 bg-emerald-500/20" : "border-white/20 text-slate-300 hover:border-white/40"}`}
                  >
                    {label.name}
                  </button>
                ))}
                <button
                  className="px-2 py-0.5 text-xs text-emerald-300 border border-emerald-500/40 rounded-full hover:bg-emerald-500/10"
                  onClick={() => {
                    setShowLabelModal(true);
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Groups Section */}
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Group</p>
              <select
                value={selectedPin.groupId ?? ""}
                onChange={(e) => {
                  assignGroup(selectedPin.id, e.target.value || null);
                  setContextMenu(null);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <option value="">None</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Connected Wires Section */}
            {(() => {
              const connectedWires = history.state.wires?.filter(
                (w) => w.fromPinId === selectedPin.id || w.toPinId === selectedPin.id
              ) || [];
              
              if (connectedWires.length === 0) return null;
              
              return (
                <div>
                  <p className="text-xs text-slate-400 mb-1.5">Connections ({connectedWires.length})</p>
                  <div className="space-y-1">
                    {connectedWires.map((wire) => {
                      const otherPinId = wire.fromPinId === selectedPin.id ? wire.toPinId : wire.fromPinId;
                      const otherPin = history.state.pins.find((p) => p.id === otherPinId);
                      
                      return (
                        <div key={wire.id} className="flex items-center justify-between px-2 py-1 bg-white/5 rounded text-xs">
                          <span className="truncate">{otherPin?.title || "Unknown"}</span>
                          <button
                            onClick={() => {
                              deleteWire(wire.id);
                              setContextMenu(null);
                            }}
                            className="p-1 hover:bg-red-500/20 rounded transition-colors"
                            title="Remove connection"
                          >
                            <X className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          </div>
        )}

        {/* Link Modal */}
        {showLinkModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowLinkModal(false)}>
            <div className="bg-slate-900 border border-white/20 rounded-lg p-6 w-96 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Add Link
                </h3>
                <button onClick={() => setShowLinkModal(false)} className="p-1 hover:bg-white/10 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-emerald-500/40"
                placeholder="https://example.com"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") addLinkPin();
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addLinkPin}
                  className="flex-1 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-md hover:bg-emerald-500/30 transition-colors"
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Attachment Preview Modal */}
        {previewAttachment && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewAttachment(null)}>
            <div className="bg-slate-900 border border-white/20 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {previewAttachment.name}
                </h3>
                <button onClick={() => setPreviewAttachment(null)} className="p-1 hover:bg-white/10 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {previewAttachment.type.startsWith("image/") ? (
                <div className="relative mx-auto h-[70vh] w-full max-w-3xl">
                  <NextImage
                    src={previewAttachment.url}
                    alt={previewAttachment.name}
                    fill
                    sizes="100%"
                    className="rounded-lg object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                  <p className="text-sm text-slate-300 mb-2">{previewAttachment.name}</p>
                  <p className="text-xs text-slate-500 mb-4">Type: {previewAttachment.type}</p>
                  <a
                    href={previewAttachment.url}
                    download={previewAttachment.name}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-md hover:bg-emerald-500/30 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Board Settings Modal */}
      <BoardSettingsModal
        isOpen={showBoardSettings}
        onClose={() => setShowBoardSettings(false)}
        boardId={boardId}
        currentTitle={boardTitle}
        currentDescription={boardDescription}
        currentTags={boardTags}
        currentCategories={boardCategories}
        onSave={async (data) => {
          setBoardTitle(data.title);
          setBoardDescription(data.description);
          setBoardTags(data.tag_ids);
          setBoardCategories(data.category_ids);
          
          const res = await fetch(`/api/boards/${boardId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
          });

          if (!res.ok) {
            throw new Error("Failed to update board");
          }
        }}
        onDelete={async () => {
          try {
            const res = await fetch(`/api/boards/${boardId}`, {
              method: "DELETE",
              credentials: "include",
            });
            if (res.ok) {
              toast.success("Board moved to trash");
              router.push("/dashboard");
            } else {
              throw new Error("Failed to delete board");
            }
          } catch (error) {
            console.error(error);
            toast.error("Could not delete board");
          }
        }}
      />
      
      {/* Label Create Modal */}
      <LabelCreateModal
        isOpen={showLabelModal}
        onClose={() => setShowLabelModal(false)}
        onCreate={async (name, color, description) => {
          await createLabel(name, color);
          setShowLabelModal(false);
        }}
      />
      
      {/* Group Create Modal */}
      <GroupCreateModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onCreate={async (name, color, description) => {
          await createGroup(name, color);
          setShowGroupModal(false);
        }}
      />
    </div>
  );
}
