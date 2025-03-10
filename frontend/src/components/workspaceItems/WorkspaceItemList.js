import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteWorkspaceItem, updateWorkspaceItem } from '../../api/workspaceApi';
import '../../pages/WorkspacePage.css';

const WorkspaceItemList = ({ items, onItemDeleted }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteWorkspaceItem(itemToDelete._id);
      onItemDeleted(itemToDelete._id);
      setIsDeleting(false);
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Failed to delete item:', err);
      setError('Failed to delete item. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleToggleComplete = async (item) => {
    try {
      await updateWorkspaceItem(item._id, {
        ...item,
        completed: !item.completed,
      });
      
      // Refresh the page to show the updated state
      window.location.reload();
    } catch (err) {
      console.error('Failed to update item:', err);
      alert('Failed to update item. Please try again.');
    }
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'note':
        return 'sticky-note';
      case 'assignment':
        return 'tasks';
      case 'reading':
        return 'book';
      case 'pdf':
        return 'file-pdf';
      case 'document':
        return 'file-word';
      case 'video':
        return 'video';
      default:
        return 'file';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getItemPreview = (item) => {
    switch (item.type) {
      case 'note':
      case 'assignment':
      case 'reading':
        return item.content && (
          <div className="item-content">
            <p>{item.content.length > 100 ? `${item.content.substring(0, 100)}...` : item.content}</p>
          </div>
        );
      case 'pdf':
        return (
          <div className="item-file-preview">
            <i className="fas fa-file-pdf"></i>
            <span>PDF Document</span>
          </div>
        );
      case 'document':
        return (
          <div className="item-document-preview">
            <i className={getDocumentProviderIcon(item.documentProvider)}></i>
            <span>Document Link</span>
          </div>
        );
      case 'video':
        return (
          <div className="item-video-preview">
            <i className="fab fa-youtube"></i>
            <span>Video</span>
          </div>
        );
      default:
        return item.fileUrl && (
          <div className="item-file-preview">
            <i className="fas fa-external-link-alt"></i>
            <span>External Link</span>
          </div>
        );
    }
  };

  const getDocumentProviderIcon = (provider) => {
    switch (provider) {
      case 'google':
        return 'fab fa-google-drive';
      case 'microsoft':
        return 'fab fa-microsoft';
      case 'dropbox':
        return 'fab fa-dropbox';
      default:
        return 'fas fa-external-link-alt';
    }
  };

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>No items found in this workspace.</p>
        <p>Click "Add Item" to create your first item.</p>
      </div>
    );
  }

  return (
    <>
      <div className="workspace-items-grid">
        {items.map(item => (
          <div key={item._id} className="workspace-card">
            <div className="workspace-card-header">
              <div className="workspace-icon">
                <i className={`fas fa-${getItemIcon(item.type)}`}></i>
              </div>
              <div className="workspace-info">
                <h3>{item.title}</h3>
                <div className="workspace-meta">
                  <span>
                    <i className="fas fa-tag"></i>
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </span>
                  {item.dueDate && (
                    <span>
                      <i className="fas fa-calendar"></i>
                      {new Date(item.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="workspace-content">
              <p className="workspace-description">
                {item.content || 'No description available'}
              </p>
              <div className="workspace-actions">
                <Link
                  to={`/workspace-items/${item._id}`}
                  className="workspace-btn view-workspace-btn"
                >
                  <i className="fas fa-eye"></i>
                  View
                </Link>
                <Link
                  to={`/workspace-items/edit/${item._id}`}
                  className="workspace-btn edit-workspace-btn"
                >
                  <i className="fas fa-edit"></i>
                  Edit
                </Link>
                <button
                  onClick={() => handleDeleteClick(item)}
                  className="workspace-btn delete-workspace-btn"
                  disabled={isDeleting}
                >
                  <i className="fas fa-trash-alt"></i>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Item</h3>
            <p>Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="workspace-btn edit-workspace-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="workspace-btn delete-workspace-btn"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="loading-spinner"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash-alt"></i>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkspaceItemList; 