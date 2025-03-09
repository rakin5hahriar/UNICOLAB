import React from 'react';
import { Link } from 'react-router-dom';
import { deleteWorkspaceItem, updateWorkspaceItem } from '../../api/workspaceApi';

const WorkspaceItemList = ({ items, onItemDeleted }) => {
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteWorkspaceItem(id);
        if (onItemDeleted) {
          onItemDeleted(id);
        }
      } catch (err) {
        console.error('Failed to delete item:', err);
        alert('Failed to delete item. Please try again.');
      }
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
        return 'fas fa-sticky-note';
      case 'assignment':
        return 'fas fa-tasks';
      case 'reading':
        return 'fas fa-book';
      case 'pdf':
        return 'fas fa-file-pdf';
      case 'document':
        return 'fas fa-file-word';
      case 'video':
        return 'fas fa-video';
      default:
        return 'fas fa-file';
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
    <div className="workspace-item-list">
      {items.map((item) => (
        <div
          key={item._id}
          className={`workspace-item-card ${item.completed ? 'completed' : ''}`}
        >
          <div className="item-header">
            <div className="item-type">
              <i className={getItemIcon(item.type)}></i>
              <span>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
            </div>
            <div className="item-actions">
              <Link
                to={`/workspaces/items/${item._id}`}
                className="btn btn-sm btn-info"
              >
                <i className="fas fa-eye"></i>
              </Link>
              <Link
                to={`/workspaces/items/edit/${item._id}`}
                className="btn btn-sm btn-secondary"
              >
                <i className="fas fa-edit"></i>
              </Link>
              <button
                onClick={() => handleDelete(item._id)}
                className="btn btn-sm btn-danger"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <div className="item-title">
            {item.type === 'assignment' && (
              <div className="completion-checkbox">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => handleToggleComplete(item)}
                  id={`complete-${item._id}`}
                />
                <label htmlFor={`complete-${item._id}`}></label>
              </div>
            )}
            <h3>{item.title}</h3>
          </div>
          
          {getItemPreview(item)}
          
          <div className="item-footer">
            {item.dueDate && (
              <div className="item-due-date">
                <i className="fas fa-calendar"></i>
                <span>Due: {formatDate(item.dueDate)}</span>
              </div>
            )}
            {item.priority && item.type === 'assignment' && (
              <div className={`item-priority ${item.priority}`}>
                <span>{item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}</span>
              </div>
            )}
            {item.tags && item.tags.length > 0 && (
              <div className="item-tags">
                {item.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="tag-pill">{tag}</span>
                ))}
                {item.tags.length > 3 && <span className="tag-more">+{item.tags.length - 3}</span>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkspaceItemList; 