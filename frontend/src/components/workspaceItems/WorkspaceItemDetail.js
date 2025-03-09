import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getWorkspaceItemById, deleteWorkspaceItem, updateWorkspaceItem } from '../../api/workspaceApi';
import { Document, Page, pdfjs } from 'react-pdf';
import PDFFallback from './PDFFallback';
import SimplePDFViewer from './SimplePDFViewer';

// Set up the worker for PDF.js - use local worker file instead of CDN
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf-worker/pdf.worker.min.js`;

const WorkspaceItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState(null);
  const [pdfViewerType, setPdfViewerType] = useState('react-pdf'); // 'react-pdf', 'simple', or 'fallback'

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const data = await getWorkspaceItemById(id);
        setItem(data);
        setLoading(false);
      } catch (err) {
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
      });
      setItem(updatedItem);
    } catch (err) {
      setError(err.message || 'Failed to update item');
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // PDF functions
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPdfError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
    // Try the simple viewer first
    setPdfViewerType('simple');
  };

  const goToPrevPage = () => {
    setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages || 1));
  };

  if (loading) return <div className="loading">Loading item details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!item) return <div className="not-found">Item not found</div>;

  return (
    <div className="workspace-item-detail">
      <div className="item-header">
        <div className="item-title-section">
          <div className="item-type">
            <i className={getItemIcon(item.type)}></i>
            <span>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
          </div>
          <h2>{item.title}</h2>
        </div>
        <div className="item-actions">
          <Link
            to={`/workspaces/items/edit/${item._id}`}
            className="btn btn-secondary"
          >
            Edit
          </Link>
          <button onClick={handleDelete} className="btn btn-danger">
            Delete
          </button>
        </div>
      </div>

      <div className="item-meta">
        <div className="meta-item">
          <strong>Workspace:</strong>{' '}
          <Link to={`/workspaces/${item.workspace._id}`}>{item.workspace.name}</Link>
        </div>
        <div className="meta-item">
          <strong>Course:</strong>{' '}
          <Link to={`/courses/${item.course._id}`}>{item.course.title}</Link>
        </div>
        {item.dueDate && (
          <div className="meta-item">
            <strong>Due Date:</strong> {formatDate(item.dueDate)}
          </div>
        )}
        {item.type === 'assignment' && (
          <>
            <div className="meta-item">
              <strong>Priority:</strong>{' '}
              <span className={`priority-badge ${item.priority}`}>
                {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
              </span>
            </div>
            <div className="meta-item">
              <strong>Status:</strong>{' '}
              <div className="completion-status">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={handleToggleComplete}
                  id="complete-checkbox"
                />
                <label htmlFor="complete-checkbox">
                  {item.completed ? 'Completed' : 'Not Completed'}
                </label>
              </div>
            </div>
          </>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="meta-item">
            <strong>Tags:</strong>{' '}
            <div className="tags-display">
              {item.tags.map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Display content based on item type */}
      {(item.type === 'note' || item.type === 'assignment' || item.type === 'reading') && item.content && (
        <div className="item-content">
          <h3>Content</h3>
          <div className="content-text">{item.content}</div>
        </div>
      )}

      {/* Display PDF viewer */}
      {item.type === 'pdf' && item.fileUrl && (
        <div className="item-pdf">
          <h3>PDF Document</h3>
          
          {pdfViewerType === 'react-pdf' && (
            <div className="pdf-container">
              <Document
                file={item.fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={<div className="pdf-loading">Loading PDF...</div>}
                options={{
                  cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                  cMapPacked: true,
                }}
              >
                {numPages > 0 && (
                  <Page 
                    pageNumber={pageNumber} 
                    width={Math.min(600, window.innerWidth - 40)}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    error={<div>Failed to load page</div>}
                  />
                )}
              </Document>
              {numPages > 0 && (
                <div className="pdf-navigation">
                  <button 
                    onClick={goToPrevPage} 
                    disabled={pageNumber <= 1}
                    className="btn btn-sm btn-secondary"
                  >
                    <i className="fas fa-chevron-left"></i> Previous
                  </button>
                  <span className="page-info">
                    Page {pageNumber} of {numPages}
                  </span>
                  <button 
                    onClick={goToNextPage} 
                    disabled={pageNumber >= numPages}
                    className="btn btn-sm btn-secondary"
                  >
                    Next <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>
          )}
          
          {pdfViewerType === 'simple' && (
            <SimplePDFViewer 
              fileUrl={item.fileUrl} 
              fileName={item.fileName}
              onError={() => setPdfViewerType('fallback')}
            />
          )}
          
          {pdfViewerType === 'fallback' && (
            <PDFFallback fileUrl={item.fileUrl} fileName={item.fileName} />
          )}
          
          {pdfViewerType !== 'fallback' && (
            <div className="pdf-download">
              <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" download={item.fileName || "document.pdf"}>
                <i className="fas fa-download"></i> Download PDF
              </a>
            </div>
          )}
          
          <div className="pdf-viewer-toggle">
            <p>Having trouble viewing the PDF?</p>
            <div className="pdf-viewer-options">
              <button 
                onClick={() => setPdfViewerType('react-pdf')} 
                className={`btn btn-sm ${pdfViewerType === 'react-pdf' ? 'btn-primary' : 'btn-secondary'}`}
                disabled={pdfViewerType === 'react-pdf'}
              >
                Advanced Viewer
              </button>
              <button 
                onClick={() => setPdfViewerType('simple')} 
                className={`btn btn-sm ${pdfViewerType === 'simple' ? 'btn-primary' : 'btn-secondary'}`}
                disabled={pdfViewerType === 'simple'}
              >
                Simple Viewer
              </button>
              <button 
                onClick={() => setPdfViewerType('fallback')} 
                className={`btn btn-sm ${pdfViewerType === 'fallback' ? 'btn-primary' : 'btn-secondary'}`}
                disabled={pdfViewerType === 'fallback'}
              >
                Download Only
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Display document link */}
      {item.type === 'document' && item.documentUrl && (
        <div className="item-document">
          <h3>Document Link</h3>
          <div className="document-link">
            <a href={item.documentUrl} target="_blank" rel="noopener noreferrer" className="document-link-button">
              <i className={getDocumentProviderIcon(item.documentProvider)}></i>
              Open Document
            </a>
            <p className="document-provider">
              {item.documentProvider ? `Provider: ${item.documentProvider.charAt(0).toUpperCase() + item.documentProvider.slice(1)}` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Display YouTube video */}
      {item.type === 'video' && item.embedUrl && (
        <div className="item-video">
          <h3>Video</h3>
          <div className="video-container">
            <iframe
              width="100%"
              height="450"
              src={item.embedUrl}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Embedded video"
            ></iframe>
          </div>
          {item.documentUrl && (
            <div className="video-link">
              <a href={item.documentUrl} target="_blank" rel="noopener noreferrer">
                <i className="fab fa-youtube"></i> Open in YouTube
              </a>
            </div>
          )}
        </div>
      )}

      {/* Display file link for other types */}
      {item.type === 'other' && item.fileUrl && (
        <div className="item-file">
          <h3>Attached File</h3>
          <a
            href={item.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="file-link"
          >
            <i className="fas fa-external-link-alt"></i> {item.fileName || 'View File'}
          </a>
        </div>
      )}

      <div className="back-link">
        <Link to={`/workspaces/${item.workspace._id}`}>
          <i className="fas fa-arrow-left"></i> Back to Workspace
        </Link>
      </div>
    </div>
  );
};

export default WorkspaceItemDetail; 