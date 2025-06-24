import React from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  UserPlusIcon,
  CheckIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import IconButton from './IconButton';

const ActionButtons = ({
  actions = {},
  size = 'md',
  className = ''
}) => {
  const {
    onEdit,
    onDelete,
    onView,
    onConvert,
    onSave,
    onCancel,
    showEdit = true,
    showDelete = true,
    showView = false,
    showConvert = false,
    showSave = false,
    showCancel = false,
    editTitle = "Edit",
    deleteTitle = "Delete",
    viewTitle = "View",
    convertTitle = "Convert to Customer",
    saveTitle = "Save Changes",
    cancelTitle = "Cancel"
  } = actions;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showView && onView && (
        <IconButton
          icon={EyeIcon}
          onClick={onView}
          variant="view"
          size={size}
          title={viewTitle}
        />
      )}
      
      {showEdit && onEdit && (
        <IconButton
          icon={PencilIcon}
          onClick={onEdit}
          variant="edit"
          size={size}
          title={editTitle}
        />
      )}
      
      {showConvert && onConvert && (
        <IconButton
          icon={UserPlusIcon}
          onClick={onConvert}
          variant="convert"
          size={size}
          title={convertTitle}
        />
      )}
      
      {showSave && onSave && (
        <IconButton
          icon={CheckIcon}
          onClick={onSave}
          variant="save"
          size={size}
          title={saveTitle}
        />
      )}
      
      {showCancel && onCancel && (
        <IconButton
          icon={XCircleIcon}
          onClick={onCancel}
          variant="cancel"
          size={size}
          title={cancelTitle}
        />
      )}
      
      {showDelete && onDelete && (
        <IconButton
          icon={TrashIcon}
          onClick={onDelete}
          variant="delete"
          size={size}
          title={deleteTitle}
        />
      )}
    </div>
  );
};

export default ActionButtons; 