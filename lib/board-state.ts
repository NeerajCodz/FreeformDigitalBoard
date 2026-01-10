import { BoardState, BoardPin, BoardGroup } from "@/types/board";

export const emptyBoardState: BoardState = {
  pins: [],
  groups: [],
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

const MIN_PIN_SIZE = 120;
const MAX_PIN_SIZE = 900;

const sanitizePin = (candidate: any): BoardPin | null => {
  if (!candidate || typeof candidate !== "object") return null;

  const baseWidth = Number(candidate.width) || 220;
  const baseHeight = Number(candidate.height) || 160;
  const width = clamp(baseWidth, MIN_PIN_SIZE, MAX_PIN_SIZE);
  const height = clamp(baseHeight, MIN_PIN_SIZE, MAX_PIN_SIZE);

  return {
    id: typeof candidate.id === "string" ? candidate.id : "",
    kind: ["image", "list", "link", "attachment"].includes(candidate.kind) ? candidate.kind : "note",
    title: typeof candidate.title === "string" ? candidate.title : "",
    content: typeof candidate.content === "string" ? candidate.content : "",
    imageUrl: typeof candidate.imageUrl === "string" ? candidate.imageUrl : undefined,
    x: Number(candidate.x) || 0,
    y: Number(candidate.y) || 0,
    width,
    height,
    zIndex: Number(candidate.zIndex) || 1,
    color: typeof candidate.color === "string" ? candidate.color : "#0f172a",
    groupId: typeof candidate.groupId === "string" ? candidate.groupId : null,
    categoryIds: Array.isArray(candidate.categoryIds) ? candidate.categoryIds.filter((id: any) => typeof id === "string") : [],
    labelIds: Array.isArray(candidate.labelIds) ? candidate.labelIds.filter((id: any) => typeof id === "string") : [],
    locked: Boolean(candidate.locked),
    naturalWidth: candidate.naturalWidth ? Number(candidate.naturalWidth) : undefined,
    naturalHeight: candidate.naturalHeight ? Number(candidate.naturalHeight) : undefined,
    attachments: Array.isArray(candidate.attachments) ? candidate.attachments : undefined,
    linkMetadata: candidate.linkMetadata && typeof candidate.linkMetadata === "object" ? candidate.linkMetadata : undefined,
  };
};

const sanitizeGroup = (candidate: any): BoardGroup | null => {
  if (!candidate || typeof candidate !== "object") return null;
  if (typeof candidate.id !== "string" || typeof candidate.name !== "string") return null;

  return {
    id: candidate.id,
    name: candidate.name,
    color: typeof candidate.color === "string" ? candidate.color : "#a855f7",
    pinIds: Array.isArray(candidate.pinIds)
      ? candidate.pinIds.filter((id: any) => typeof id === "string")
      : [],
  };
};

export const sanitizeBoardState = (value: unknown): BoardState => {
  if (!value || typeof value !== "object") {
    return structuredClone(emptyBoardState);
  }

  const candidate = value as Record<string, unknown>;

  const viewportCandidate = candidate.viewport as Record<string, any> | undefined;
  const viewport = viewportCandidate
    ? {
        x: Number(viewportCandidate.x) || 0,
        y: Number(viewportCandidate.y) || 0,
        zoom: clamp(Number(viewportCandidate.zoom) || 1, 0.5, 2.6),
      }
    : structuredClone(emptyBoardState.viewport);

  const pins = Array.isArray((candidate as any).pins)
    ? ((candidate as any).pins as any[])
        .map(sanitizePin)
        .filter(Boolean) as BoardPin[]
    : [];

  const groups = Array.isArray((candidate as any).groups)
    ? ((candidate as any).groups as any[])
        .map(sanitizeGroup)
        .filter(Boolean) as BoardGroup[]
    : [];

  return {
    pins,
    groups,
    viewport,
  };
};
