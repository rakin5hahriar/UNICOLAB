import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getWorkspaceItemById, deleteWorkspaceItem, updateWorkspaceItem } from '../../api/workspaceApi';
import PDFFallback from './PDFFallback';

const WorkspaceItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [pdfError, setPdfError] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const data = await getWorkspaceItemById(id);
        console.log('Workspace item data:', data); // Debug log
        
        // Handle PDF file URL
        if (data.type === 'pdf') {
          console.log('Original PDF file URL:', data.fileUrl);
          
          // Make sure fileUrl is absolute
          if (data.fileUrl && !data.fileUrl.startsWith('http')) {
            // If it's a relative URL, make it absolute
            const baseUrl = window.location.origin;
            data.fileUrl = `${baseUrl}${data.fileUrl}`;
            console.log('Updated PDF file URL:', data.fileUrl);
          }
          
          // Validate if the file URL is accessible
          try {
            const response = await fetch(data.fileUrl, { method: 'HEAD' });
            if (!response.ok) {
              console.error('PDF file not accessible:', response.status);
              setPdfError(`PDF file not accessible (${response.status})`);
            }
          } catch (err) {
            console.error('Error checking PDF file:', err);
            setPdfError('Error accessing PDF file');
          }
        }
        
        setItem(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching item:', err);
        setError(err.message || 'Failed to fetch item details');
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteWorkspaceItem(id);
        navigate(`/workspaces/${item.workspace._id}`);
      } catch (err) {
        setError(err.message || 'Failed to delete item');
      }
    }
  };

  const handleToggleComplete = async () => {
    try {
      const updatedItem = await updateWorkspaceItem(id, {
        ...item,
        completed: !item.completed,
        status: !item.completed ? 'completed' : 'in-progress'
      });
      setItem(updatedItem);
    } catch (err) {
      setError(err.message || 'Failed to update item');
    }
  };

  // Checklist functions
  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim()) return;
    
    try {
      const checklistItems = [...(item.checklistItems || []), { 
        text: newChecklistItem.trim(), 
        completed: false 
      }];
      
      const updatedItem = await updateWorkspaceItem(id, {
        ...item,
        checklistItems
      });
      
      setItem(updatedItem);
      setNewChecklistItem('');
    } catch (err) {
      setError(err.message || 'Failed to add checklist item');
    }
  };

  const handleToggleChecklistItem = async (index) => {
    try {
      const checklistItems = [...(item.checklistItems || [])];
      checklistItems[index] = {
        ...checklistItems[index],
        completed: !checklistItems[index].completed
      };
      
      const updatedItem = await updateWorkspaceItem(id, {
        ...item,
        checklistItems
      });
      
      setItem(updatedItem);
    } catch (err) {
      setError(err.message || 'Failed to update checklist item');
    }
  };

  const handleDeleteChecklistItem = async (index) => {
    try {
      const checklistItems = [...(item.checklistItems || [])];
      checklistItems.splice(index, 1);
      
      const updatedItem = await updateWorkspaceItem(id, {
        ...item,
        checklistItems
      });
      
      setItem(updatedItem);
    } catch (err) {
      setError(err.message || 'Failed to delete checklist item');
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

  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    let formattedDate = date.toLocaleDateString();
    
    if (timeString) {
      formattedDate += ` at ${timeString}`;
    }
    
    return formattedDate;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'in-progress':
        return 'status-in-progress';
      default:
        return 'status-not-started';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      default:
        return 'priority-low';
    }
  };

  // Handle PDF iframe error
  const handlePdfIframeError = (e) => {
    console.error("Failed to load PDF in iframe:", e);
    setPdfError("Failed to load PDF in iframe");
    // Hide the iframe
    if (e.target) {
      e.target.style.display = 'none';
    }
  };

  if (loading) return <div className="loading">Loading item details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!item) return <div className="error">Item not found</div>;

  return (
    <div className="workspace-item-detail p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto mt-8">
      <div className="item-header flex justify-between items-center mb-6 border-b pb-4">
        <div className="item-title flex items-center gap-3">
          <i className={`${getItemIcon(item.type)} text-2xl text-indigo-600`}></i>
          <h2 className="text-2xl font-bold text-gray-900">{item.title}</h2>
        </div>
        <div className="item-actions flex gap-3">
          <Link 
            to={`/workspace-items/edit/${item._id}`} 
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {error && <div className="error-message bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="item-details space-y-4">
        <div className="item-meta grid grid-cols-2 gap-4">
          <div className="meta-item">
            <h3 className="text-sm font-semibold text-gray-600">Status</h3>
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusClass(item.status)}`}>
              {item.status}
            </span>
          </div>
          <div className="meta-item">
            <h3 className="text-sm font-semibold text-gray-600">Priority</h3>
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${getPriorityClass(item.priority)}`}>
              {item.priority}
            </span>
          </div>
          {item.dueDate && (
            <div className="meta-item">
              <h3 className="text-sm font-semibold text-gray-600">Due Date</h3>
              <span className="text-gray-700">{formatDateTime(item.dueDate, item.dueTime)}</span>
            </div>
          )}
        </div>

        {item.description && (
          <div className="item-description mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>
          </div>
        )}

        {/* Video content */}
        {item.type === 'video' && (
          <div className="video-viewer mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Video</h3>
            {!item.embedUrl && !item.documentUrl ? (
              <div className="error-message bg-red-100 text-red-700 p-3 rounded mb-4">
                No video URL provided
              </div>
            ) : (
              <div className="video-container border rounded p-4">
                {item.embedUrl ? (
                  <div className="video-embed-container mb-4" style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%' }}>
                    <iframe
                      src={item.embedUrl}
                      title="Video"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="error-message bg-yellow-100 text-yellow-700 p-3 rounded mb-4">
                    Embed URL not available. Please use the link below to view the video.
                  </div>
                )}
                
                {item.documentUrl && (
                  <div className="video-link mt-4 flex justify-center">
                    <a
                      href={item.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-center"
                    >
                      <i className="fas fa-external-link-alt mr-2"></i>
                      Open Video in New Tab
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PDF content */}
        {item.type === 'pdf' && (
          <div className="pdf-viewer mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Document</h3>
            
            {pdfError && (
              <div className="error-message bg-red-100 text-red-700 p-3 rounded mb-4">
                {pdfError}
              </div>
            )}
            
            {!item.fileUrl ? (
              <div className="error-message bg-red-100 text-red-700 p-3 rounded mb-4">
                No PDF file available for this item
              </div>
            ) : (
              <div className="pdf-container border rounded p-4">
                <div className="pdf-iframe-container mb-4" style={{ height: '600px', width: '100%', overflow: 'hidden' }}>
                  <object
                    data={item.fileUrl}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    className="border-0"
                    onError={handlePdfIframeError}
                  >
                    <iframe
                      src={item.fileUrl}
                      title="PDF Document"
                      width="100%"
                      height="100%"
                      style={{ border: 'none' }}
                      onError={handlePdfIframeError}
                    >
                      <p>Your browser does not support PDFs. Please download the PDF to view it.</p>
                    </iframe>
                  </object>
                </div>
                
                <div className="pdf-actions flex flex-col sm:flex-row justify-center gap-4">
                  <a
                    href={item.fileUrl}
                    download
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-center"
                  >
                    <i className="fas fa-download mr-2"></i>
                    Download PDF
                  </a>
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-center"
                  >
                    <i className="fas fa-external-link-alt mr-2"></i>
                    Open in New Tab
                  </a>
                </div>
                
                <div className="mt-4 text-sm text-gray-500 text-center">
                  <p>If the PDF doesn't display above, please use one of the options to view it.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {item.checklistItems && item.checklistItems.length > 0 && (
          <div className="checklist mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Checklist</h3>
            <div className="space-y-2">
              {item.checklistItems.map((checkItem, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checkItem.completed}
                    onChange={() => handleToggleChecklistItem(index)}
                    className="h-5 w-5 text-indigo-600 rounded"
                  />
                  <span className={`flex-1 ${checkItem.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                    {checkItem.text}
                  </span>
                  <button
                    onClick={() => handleDeleteChecklistItem(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
            <div className="add-checklist-item mt-4 flex gap-2">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder="Add new checklist item"
                className="flex-1 px-3 py-2 border rounded"
                onKeyPress={(e) => e.key === 'Enter' && handleAddChecklistItem()}
              />
              <button
                onClick={handleAddChecklistItem}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceItemDetail; 