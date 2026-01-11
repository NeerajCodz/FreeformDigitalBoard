export type PinKind = "note" | "image" | "list" | "link" | "attachment";

export interface BoardViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface BoardGroup {
  id: string;
  name: string;
  color: string;
  pinIds: string[];
}

export interface BoardCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface BoardLabel {
  id: string;
  name: string;
  color: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface LinkMetadata {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
}

export interface BoardPin {
  id: string;
  kind: PinKind;
  title: string;
  content: string;
  imageUrl?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  color: string;
  groupId?: string | null;
  categoryIds?: string[];
  labelIds?: string[]; // Store label IDs from database
  locked?: boolean;
  naturalWidth?: number;
  naturalHeight?: number;
  attachments?: Attachment[];
  linkMetadata?: LinkMetadata;
}

export interface BoardWire {
  id: string;
  fromPinId: string;
  toPinId: string;
  color: string;
}

export interface BoardState {
  pins: BoardPin[];
  groups: BoardGroup[];
  wires?: BoardWire[];
  viewport: BoardViewport;
}
