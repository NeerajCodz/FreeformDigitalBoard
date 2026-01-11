/**
 * Central export file for all types
 */

// Board types
export * from './board';

// Common types
export * from './common';

// Database types
export * from './database';

// Modal types
export * from './modal';

// Re-export commonly used types for convenience
export type {
  Category,
  Tag,
  Label,
  Group,
  WithTimestamps,
} from './common';

export type {
  PinKind,
  BoardPin,
  BoardState,
  BoardViewport,
  BoardWire,
  BoardGroup,
  BoardLabel,
  BoardCategory,
  Attachment,
  LinkMetadata,
} from './board';

export type {
  Board,
  BoardMetadata,
  Snapshot,
  SnapshotSummary,
} from './database';

export type {
  BaseModalProps,
  ConfirmationModalProps,
  RenameModalProps,
  CreateModalProps,
  SettingsModalProps,
} from './modal';
