// Board-specific types
// For detailed board types, see types/board.ts

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
