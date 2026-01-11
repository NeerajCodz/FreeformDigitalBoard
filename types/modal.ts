/**
 * Modal component prop types
 */

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ConfirmationModalProps extends BaseModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  variant?: 'danger' | 'warning' | 'info';
}

export interface RenameModalProps extends BaseModalProps {
  currentName: string;
  currentDescription?: string;
  itemType: 'board' | 'pin' | 'category' | 'tag' | 'label' | 'group';
  title?: string;
  onSave: (name: string, description?: string) => Promise<void>;
}

export interface CreateModalProps extends BaseModalProps {
  onCreate: (name: string, color?: string, description?: string) => Promise<void>;
  title?: string;
  defaultColor?: string;
}

export interface SettingsModalProps extends BaseModalProps {
  boardId: string;
  currentTitle: string;
  currentDescription: string;
  currentTags: string[];
  currentCategories: string[];
  onSave: (data: {
    title: string;
    description: string;
    tag_ids: string[];
    category_ids: string[];
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}
