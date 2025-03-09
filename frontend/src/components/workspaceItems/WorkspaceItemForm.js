import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getWorkspaceItemById,
  createWorkspaceItem,
  updateWorkspaceItem,
} from '../../api/workspaceApi';
import { uploadFile } from '../../api/fileApi';

// Allowed file types
const ALLOWED_FILE_TYPES = {
  pdf: ['application/pdf'],
  document: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text'
  ],
  spreadsheet: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.spreadsheet'
  ],
  presentation: [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.oasis.opendocument.presentation'
  ],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  text: ['text/plain']
};

const WorkspaceItemForm = ({ workspaceId, courseId, onItemAdded }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAddMode = !id;
  const isInline = !!workspaceId; // If workspaceId is provided, this is an inline form

  const [formData, setFormData] = useState({
    title: '',
    type: 'note',
    content: '',
    fileUrl: '',
    fileName: '',
    fileType: '',
    embedUrl: '',
    documentUrl: '',
    documentProvider: '',
    workspace: workspaceId || '',
    course: courseId || '',
    dueDate: '',
    priority: 'medium',
    tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (!isAddMode) {
      const fetchItem = async () => {
        try {
          setLoading(true);
          const item = await getWorkspaceItemById(id);
          setFormData({
            title: item.title,
            type: item.type,
            content: item.content || '',
            fileUrl: item.fileUrl || '',
            fileName: item.fileName || '',
            fileType: item.fileType || '',
            embedUrl: item.embedUrl || '',
            documentUrl: item.documentUrl || '',
            documentProvider: item.documentProvider || '',
            workspace: item.workspace._id || '',
            course: item.course._id || '',
            dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
            priority: item.priority || 'medium',
            tags: item.tags || [],
          });
          setLoading(false);
        } catch (err) {
          setError(err.message || 'Failed to fetch item');
          setLoading(false);
        }
      };

      fetchItem();
    }
  }, [id, isAddMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Validate file type
  const validateFileType = (file) => {
    if (!file) return false;
    
    // For PDF type, only allow PDF files
    if (formData.type === 'pdf' && !ALLOWED_FILE_TYPES.pdf.includes(file.type)) {
      setError('Please upload a valid PDF file.');
      return false;
    }
    
    // For other types, allow any of the supported file types
    const allAllowedTypes = [
      ...ALLOWED_FILE_TYPES.pdf,
      ...ALLOWED_FILE_TYPES.document,
      ...ALLOWED_FILE_TYPES.spreadsheet,
      ...ALLOWED_FILE_TYPES.presentation,
      ...ALLOWED_FILE_TYPES.image,
      ...ALLOWED_FILE_TYPES.text
    ];
    
    if (!allAllowedTypes.includes(file.type)) {
      setError('File type not supported. Please upload PDF, Word, Excel, PowerPoint, text, or image files.');
      return false;
    }
    
    return true;
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        return;
      }
      
      // Validate file type
      if (!validateFileType(selectedFile)) {
        return;
      }
      
      setFile(selectedFile);
      
      // Reset upload states
      setUploadProgress(0);
      setUploadSuccess(false);
      setError(null);
      
      // Update form data with file name
      setFormData({
        ...formData,
        fileName: selectedFile.name,
      });
    }
  };

  const handleFileUpload = async () => {
    if (!file) return null;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);
      
      // Create form data
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      
      // Upload file
      const uploadedFile = await uploadFile(formDataObj, (progress) => {
        setUploadProgress(progress);
      });
      
      setIsUploading(false);
      setUploadSuccess(true);
      
      // Update form data with file information
      setFormData({
        ...formData,
        fileUrl: uploadedFile.fileUrl,
        fileName: uploadedFile.fileName,
        fileType: uploadedFile.fileType,
      });
      
      return uploadedFile;
    } catch (err) {
      setIsUploading(false);
      setError(err.message || 'Failed to upload file');
      return null;
    }
  };

  const handleUploadButtonClick = async (e) => {
    e.preventDefault();
    if (file) {
      await handleFileUpload();
    }
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // If there's a file to upload and it hasn't been uploaded yet, upload it first
      if (file && !uploadSuccess) {
        const uploadedFile = await handleFileUpload();
        if (!uploadedFile) {
          setLoading(false);
          return; // Stop if file upload failed
        }
      }
      
      let result;
      
      if (isAddMode) {
        result = await createWorkspaceItem(formData.workspace, formData);
        if (onItemAdded) {
          onItemAdded(result);
        } else {
          navigate(`/workspaces/${formData.workspace}`);
        }
      } else {
        result = await updateWorkspaceItem(id, formData);
        navigate(`/workspaces/${formData.workspace}`);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to save item');
      setLoading(false);
    }
  };

  // Helper function to extract YouTube video ID
  const extractYoutubeId = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  // Handle YouTube URL input
  const handleYoutubeUrlChange = (e) => {
    const url = e.target.value;
    const videoId = extractYoutubeId(url);
    
    if (videoId) {
      setFormData({
        ...formData,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        documentUrl: url,
      });
    } else {
      setFormData({
        ...formData,
        documentUrl: url,
      });
    }
  };

  if (loading && !isAddMode) return <div className="loading">Loading item...</div>;

  return (
    <div className={`workspace-item-form ${isInline ? 'inline-form' : ''}`}>
      {!isInline && <h2>{isAddMode ? 'Add New Item' : 'Edit Item'}</h2>}
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title">Title*</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter a title"
            />
          </div>
          <div className="form-group">
            <label htmlFor="type">Type*</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="note">Note</option>
              <option value="assignment">Assignment</option>
              <option value="reading">Reading</option>
              <option value="pdf">PDF</option>
              <option value="document">Document</option>
              <option value="video">Video</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Content field for notes */}
        {(formData.type === 'note' || formData.type === 'assignment' || formData.type === 'reading') && (
          <div className="form-group">
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="5"
              placeholder="Enter content here..."
            />
          </div>
        )}

        {/* File upload field for PDFs and other files */}
        {(formData.type === 'pdf' || formData.type === 'other') && (
          <div className="form-group">
            <label htmlFor="file">Upload File</label>
            <div className="file-upload-container">
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                className="file-input"
                accept={formData.type === 'pdf' ? '.pdf' : '*'}
              />
              {file && (
                <div className="file-info">
                  <p>Selected file: {file.name}</p>
                  <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  {!uploadSuccess && (
                    <button 
                      onClick={handleUploadButtonClick}
                      className="btn btn-primary btn-sm"
                      disabled={isUploading}
                    >
                      {isUploading ? 'Uploading...' : 'Upload Now'}
                    </button>
                  )}
                  {uploadSuccess && (
                    <div className="upload-success">
                      <i className="fas fa-check-circle"></i> File uploaded successfully
                    </div>
                  )}
                </div>
              )}
              {isUploading && (
                <div className="upload-progress">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                  <span>{uploadProgress}%</span>
                </div>
              )}
            </div>
            <div className="form-text">
              {formData.type === 'pdf' ? 'Upload a PDF file (max 10MB)' : 'Upload a file (max 10MB)'}
            </div>
            
            <div className="form-divider">OR</div>
            
            <label htmlFor="fileUrl">File URL</label>
            <input
              type="text"
              id="fileUrl"
              name="fileUrl"
              value={formData.fileUrl}
              onChange={handleChange}
              placeholder="Enter URL to file"
            />
            {formData.fileUrl && formData.fileName && (
              <div className="file-link-preview">
                <i className="fas fa-file"></i>
                <span>{formData.fileName}</span>
              </div>
            )}
          </div>
        )}

        {/* Document link fields */}
        {formData.type === 'document' && (
          <>
            <div className="form-group">
              <label htmlFor="documentUrl">Document URL</label>
              <input
                type="text"
                id="documentUrl"
                name="documentUrl"
                value={formData.documentUrl}
                onChange={handleChange}
                placeholder="Enter URL to Google Doc, OneDrive, etc."
              />
            </div>
            <div className="form-group">
              <label htmlFor="documentProvider">Document Provider</label>
              <select
                id="documentProvider"
                name="documentProvider"
                value={formData.documentProvider}
                onChange={handleChange}
              >
                <option value="">Select Provider</option>
                <option value="google">Google Docs</option>
                <option value="microsoft">Microsoft Office</option>
                <option value="dropbox">Dropbox</option>
                <option value="other">Other</option>
              </select>
            </div>
          </>
        )}

        {/* YouTube video field */}
        {formData.type === 'video' && (
          <div className="form-group">
            <label htmlFor="documentUrl">YouTube URL</label>
            <input
              type="text"
              id="documentUrl"
              name="documentUrl"
              value={formData.documentUrl}
              onChange={handleYoutubeUrlChange}
              placeholder="Enter YouTube video URL"
            />
            {formData.embedUrl && (
              <div className="video-preview">
                <h4>Video Preview:</h4>
                <div className="embed-container">
                  <iframe
                    src={formData.embedUrl}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Embedded YouTube video"
                  ></iframe>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assignment and reading specific fields */}
        {(formData.type === 'assignment' || formData.type === 'reading') && (
          <div className="form-row">
            {formData.type === 'assignment' && (
              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            )}
            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        {/* Tags input */}
        <div className="form-group">
          <label htmlFor="tags">Tags</label>
          <div className="tags-input-container">
            <input
              type="text"
              id="tagInput"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tags and press Enter"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTagAdd();
                }
              }}
            />
            <button 
              type="button" 
              className="btn btn-sm btn-secondary"
              onClick={handleTagAdd}
            >
              Add
            </button>
          </div>
          <div className="tags-container">
            {formData.tags.map((tag, index) => (
              <div key={index} className="tag">
                {tag}
                <button 
                  type="button" 
                  className="tag-remove" 
                  onClick={() => handleTagRemove(tag)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn btn-primary" disabled={loading || isUploading}>
            {loading ? 'Saving...' : isAddMode ? 'Add Item' : 'Update Item'}
          </button>
          {!isInline && (
            <button
              type="button"
              onClick={() => navigate(`/workspaces/${formData.workspace}`)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default WorkspaceItemForm; 