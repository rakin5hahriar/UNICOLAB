import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getWorkspaceById, deleteWorkspace, getWorkspaceItems } from '../../api/workspaceApi';
import WorkspaceItemList from '../workspaceItems/WorkspaceItemList';
import WorkspaceItemForm from '../workspaceItems/WorkspaceItemForm';

const WorkspaceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchWorkspaceAndItems = async () => {
      try {
        setLoading(true);
        const workspaceData = await getWorkspaceById(id);
        setWorkspace(workspaceData);

        const itemsData = await getWorkspaceItems(id);
        setItems(itemsData);

        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch workspace details');
        setLoading(false);
      }
    };

    fetchWorkspaceAndItems();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this workspace? This will also delete all items in this workspace.')) {
      try {
        await deleteWorkspace(id);
        navigate(`/courses/${workspace.course._id}`);
      } catch (err) {
        setError(err.message || 'Failed to delete workspace');
      }
    }
  };

  const handleItemAdded = (newItem) => {
    setItems([newItem, ...items]);
    setShowAddItemForm(false);
  };

  const handleItemDeleted = (itemId) => {
    setItems(items.filter(item => item._id !== itemId));
  };

  const filteredItems = activeTab === 'all' 
    ? items 
    : items.filter(item => item.type === activeTab);

  // Count items by type
  const itemCounts = items.reduce((counts, item) => {
    counts[item.type] = (counts[item.type] || 0) + 1;
    return counts;
  }, {});

  if (loading) return <div className="loading">Loading workspace...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!workspace) return <div className="not-found">Workspace not found</div>;

  return (
    <div className="workspace-detail">
      <div 
        className="workspace-header" 
        style={{ backgroundColor: workspace.color }}
      >
        <div className="workspace-title">
          <div className="workspace-icon">
            <i className={`fas fa-${workspace.icon}`}></i>
          </div>
          <h2>{workspace.name}</h2>
        </div>
        <div className="workspace-actions">
          <Link to={`/workspaces/edit/${workspace._id}`} className="btn btn-light">
            Edit Workspace
          </Link>
          <button onClick={handleDelete} className="btn btn-danger">
            Delete Workspace
          </button>
        </div>
      </div>

      {workspace.description && (
        <div className="workspace-description">
          <p>{workspace.description}</p>
        </div>
      )}

      <div className="workspace-course">
        <Link to={`/courses/${workspace.course._id}`}>
          <i className="fas fa-arrow-left"></i> Back to {workspace.course.title}
        </Link>
      </div>

      <div className="workspace-content">
        <div className="workspace-content-header">
          <div className="content-tabs">
            <button 
              className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Items <span className="count">{items.length}</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'note' ? 'active' : ''}`}
              onClick={() => setActiveTab('note')}
            >
              Notes <span className="count">{itemCounts.note || 0}</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'assignment' ? 'active' : ''}`}
              onClick={() => setActiveTab('assignment')}
            >
              Assignments <span className="count">{itemCounts.assignment || 0}</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'reading' ? 'active' : ''}`}
              onClick={() => setActiveTab('reading')}
            >
              Readings <span className="count">{itemCounts.reading || 0}</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'pdf' ? 'active' : ''}`}
              onClick={() => setActiveTab('pdf')}
            >
              PDFs <span className="count">{itemCounts.pdf || 0}</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'document' ? 'active' : ''}`}
              onClick={() => setActiveTab('document')}
            >
              Documents <span className="count">{itemCounts.document || 0}</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'video' ? 'active' : ''}`}
              onClick={() => setActiveTab('video')}
            >
              Videos <span className="count">{itemCounts.video || 0}</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'other' ? 'active' : ''}`}
              onClick={() => setActiveTab('other')}
            >
              Other <span className="count">{itemCounts.other || 0}</span>
            </button>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddItemForm(!showAddItemForm)}
          >
            {showAddItemForm ? 'Cancel' : 'Add Item'}
          </button>
        </div>

        {showAddItemForm && (
          <WorkspaceItemForm 
            workspaceId={workspace._id} 
            courseId={workspace.course._id}
            onItemAdded={handleItemAdded}
          />
        )}

        <WorkspaceItemList 
          items={filteredItems} 
          onItemDeleted={handleItemDeleted}
        />
      </div>
    </div>
  );
};

export default WorkspaceDetail; 