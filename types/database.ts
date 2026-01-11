import type { WithTimestamps } from './common';
import type { BoardState } from './board';

/**
 * Board-related types
 */

export interface Board extends WithTimestamps {
  id: string;
  title: string;
  description?: string;
  user_id: string;
  state: BoardState;
  tag_ids?: string[];
  category_ids?: string[];
}

export interface BoardMetadata {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  pinCount?: number;
  lastModified?: string;
}

export interface Snapshot extends WithTimestamps {
  id: string;
  board_id: string;
  name: string;
  note?: string | null;
  state: BoardState;
}

export interface SnapshotSummary {
  id: string;
  name: string;
  note?: string | null;
  created_at: string;
}
