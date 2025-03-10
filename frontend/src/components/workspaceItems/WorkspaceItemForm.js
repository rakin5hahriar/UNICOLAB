import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getWorkspaceItemById,
  createWorkspaceItem,
  updateWorkspaceItem,
} from '../../api/workspaceApi';
import { uploadFile } from '../../api/fileApi';
import confetti from 'canvas-confetti';
import { toast } from 'react-toastify';
import { createNotification } from '../../api/notificationApi';

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
    checklistItems: [],
    reminderDate: '',
    reminderTime: '',
    reminderEnabled: false,
    status: 'not-started', // For assignments: not-started, in-progress, completed
    completionPercentage: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [checklistItemInput, setChecklistItemInput] = useState('');

  const priorityColors = {
    low: '#28a745',
    medium: '#ffc107',
    high: '#dc3545',
  };

  const getPriorityBadge = (priority) => {
    return (
      <span
        style={{
          backgroundColor: priorityColors[priority],
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          fontSize: '12px',
        }}
      >
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

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
            checklistItems: item.checklistItems || [],
            reminderDate: item.reminderDate ? new Date(item.reminderDate).toISOString().split('T')[0] : '',
            reminderTime: item.reminderTime || '',
            reminderEnabled: item.reminderEnabled || false,
            status: item.status || 'not-started',
            completionPercentage: item.completionPercentage || 0,
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

  // Handle checklist items
  const handleChecklistItemAdd = () => {
    if (checklistItemInput.trim()) {
      setFormData({
        ...formData,
        checklistItems: [
          ...formData.checklistItems,
          { text: checklistItemInput.trim(), completed: false }
        ],
      });
      setChecklistItemInput('');
    }
  };

  const handleChecklistItemRemove = (index) => {
    const updatedItems = [...formData.checklistItems];
    updatedItems.splice(index, 1);
    setFormData({
      ...formData,
      checklistItems: updatedItems,
    });
  };

  const handleChecklistItemToggle = (index) => {
    const updatedItems = [...formData.checklistItems];
    const wasCompleted = updatedItems[index].completed;
    updatedItems[index] = {
      ...updatedItems[index],
      completed: !wasCompleted
    };
    
    // Calculate completion percentage for assignments
    if (formData.type === 'assignment') {
      const completedCount = updatedItems.filter(item => item.completed).length;
      const totalCount = updatedItems.length;
      const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      
      // Trigger confetti when all items are completed
      if (percentage === 100 && !wasCompleted) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      
      setFormData({
        ...formData,
        checklistItems: updatedItems,
        completionPercentage: percentage,
        status: percentage === 100 ? 'completed' : percentage > 0 ? 'in-progress' : 'not-started'
      });
    } else {
      setFormData({
        ...formData,
        checklistItems: updatedItems,
      });
    }
    
    // Add completion animation class
    const checkbox = document.getElementById(`checklist-item-${index}`);
    checkbox.classList.add('checkbox-pop');
    setTimeout(() => checkbox.classList.remove('checkbox-pop'), 300);
  };

  const handleChecklistItemEdit = (index, newText) => {
    const updatedItems = [...formData.checklistItems];
    updatedItems[index] = {
      ...updatedItems[index],
      text: newText
    };
    setFormData({
      ...formData,
      checklistItems: updatedItems,
    });
  };

  const handleReminderToggle = () => {
    setFormData({
      ...formData,
      reminderEnabled: !formData.reminderEnabled
    });
    
    // Show toast when reminder is enabled
    if (!formData.reminderEnabled) {
      toast.info('Reminder will be set when you save the item');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    if (!formData.title) {
      setError('Title is required');
      setLoading(false);
      return;
    }

    if (!formData.workspace) {
      setError('Workspace ID is missing');
      setLoading(false);
      return;
    }

    try {
      let response;
      if (isAddMode) {
        // Create new item
        const itemData = {
          ...formData,
          workspace: formData.workspace, // Ensure workspace ID is included
          course: formData.course // Ensure course ID is included
        };
        
        response = await createWorkspaceItem(formData.workspace, itemData);
        
        // Create notification for new assignment with reminder
        if (formData.type === 'assignment' && formData.reminderEnabled) {
          await createNotification({
            title: 'New Assignment Created',
            message: `You've created "${formData.title}" with a reminder set for ${formData.reminderDate} at ${formData.reminderTime}`,
            type: 'info',
            relatedItem: response._id
          });
          
          toast.success('Assignment created with reminder!');
        } else {
          toast.success('Item created successfully!');
        }
        
        if (onItemAdded) {
          onItemAdded(response);
        } else {
          navigate(`/workspaces/${response.workspace}`);
        }
      } else {
        response = await updateWorkspaceItem(id, formData);
        
        // Create notification for updated assignment with reminder
        if (formData.type === 'assignment' && formData.reminderEnabled) {
          await createNotification({
            title: 'Assignment Updated',
            message: `You've updated "${formData.title}" with a reminder set for ${formData.reminderDate} at ${formData.reminderTime}`,
            type: 'info',
            relatedItem: response._id
          });
          
          toast.success('Assignment updated with reminder!');
        } else {
          toast.success('Item updated successfully!');
        }
        
        navigate(`/workspaces/${response.workspace}`);
      }
      
      // If it's a completed assignment, show confetti
      if (formData.type === 'assignment' && formData.status === 'completed') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Error saving workspace item:', err);
      setError(err.response?.data?.message || 'Failed to save workspace item');
      toast.error('Failed to save item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract YouTube video ID
  const extractYoutubeId = (url) => {
    if (!url) return '';
    
    // Handle various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|youtube.com\/shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      console.log('YouTube video ID extracted:', match[2]);
      return match[2];
    }
    
    return '';
  };

  // Handle YouTube URL input
  const handleYoutubeUrlChange = (e) => {
    const url = e.target.value;
    setFormData({
      ...formData,
      documentUrl: url,
    });
    
    const videoId = extractYoutubeId(url);
    
    if (videoId) {
      console.log('Setting embed URL for video ID:', videoId);
      setFormData({
        ...formData,
        documentUrl: url,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      });
    } else {
      // If not a valid YouTube URL, clear the embed URL
      setFormData({
        ...formData,
        documentUrl: url,
        embedUrl: '',
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

        {/* Checklist for notes and assignments */}
        {(formData.type === 'note' || formData.type === 'assignment') && (
          <div className="form-group">
            <label>
              {formData.type === 'note' ? 'Checklist' : 'Tasks'}
              <span className="form-text"> (Add items to create a checklist)</span>
            </label>
            <div className="checklist-input-container">
              <input
                type="text"
                value={checklistItemInput}
                onChange={(e) => setChecklistItemInput(e.target.value)}
                placeholder={formData.type === 'note' ? "Add checklist item and press Enter" : "Add task and press Enter"}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleChecklistItemAdd();
                  }
                }}
              />
              <button 
                type="button" 
                className="btn-primary btn-sm"
                onClick={handleChecklistItemAdd}
              >
                <i className="fas fa-plus"></i> Add
              </button>
            </div>
            
            {formData.checklistItems.length > 0 && (
              <div className="checklist-container">
                {formData.checklistItems.map((item, index) => (
                  <div key={index} className={`checklist-item ${item.completed ? 'completed' : ''}`}>
                    <div className="checklist-item-content">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleChecklistItemToggle(index)}
                        id={`checklist-item-${index}`}
                      />
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => handleChecklistItemEdit(index, e.target.value)}
                        className={item.completed ? 'completed-text' : ''}
                      />
                    </div>
                    <button 
                      type="button" 
                      className="checklist-item-remove" 
                      onClick={() => handleChecklistItemRemove(index)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {formData.type === 'assignment' && formData.checklistItems.length > 0 && (
              <div className="completion-progress">
                <div className="progress-label">
                  <span>Progress: {formData.completionPercentage}%</span>
                  <span className={`status-badge status-${formData.status}`}>
                    {formData.status === 'not-started' ? 'Not Started' : 
                     formData.status === 'in-progress' ? 'In Progress' : 'Completed'}
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${formData.completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}
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
                      className="btn-primary btn-sm"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Uploading...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-cloud-upload-alt"></i> Upload Now
                        </>
                      )}
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
              placeholder="Enter YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)"
            />
            {formData.embedUrl ? (
              <div className="video-preview">
                <h4>Video Preview:</h4>
                <div className="embed-container" style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%' }}>
                  <iframe
                    src={formData.embedUrl}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Embedded YouTube video"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  ></iframe>
                </div>
              </div>
            ) : formData.documentUrl && (
              <div className="error-message">
                <i className="fas fa-exclamation-triangle"></i> Not a valid YouTube URL. Please enter a valid YouTube URL.
              </div>
            )}
            <div className="form-text">
              Supported formats: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID
            </div>
          </div>
        )}

        {/* Assignment and reading specific fields */}
        {(formData.type === 'assignment' || formData.type === 'reading') && (
          <>
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
                  {getPriorityBadge(formData.priority)}
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
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            
            {/* Reminder settings */}
            <div className="form-group">
              <div className="reminder-header">
                <label className="reminder-label">
                  <input
                    type="checkbox"
                    checked={formData.reminderEnabled}
                    onChange={handleReminderToggle}
                  />
                  Set Reminder
                </label>
              </div>
              
              {formData.reminderEnabled && (
                <div className="reminder-settings">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="reminderDate">Reminder Date</label>
                      <input
                        type="date"
                        id="reminderDate"
                        name="reminderDate"
                        value={formData.reminderDate}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="reminderTime">Reminder Time</label>
                      <input
                        type="time"
                        id="reminderTime"
                        name="reminderTime"
                        value={formData.reminderTime}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="reminder-info">
                    <i className="fas fa-info-circle"></i>
                    You will receive a notification at the specified date and time.
                  </div>
                </div>
              )}
            </div>
          </>
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
              className="btn-secondary btn-sm"
              onClick={handleTagAdd}
            >
              <i className="fas fa-plus"></i> Add
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
          <button type="submit" className="btn-primary" disabled={loading || isUploading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Saving...
              </>
            ) : (
              <>
                <i className={`fas fa-${isAddMode ? 'plus' : 'save'}`}></i>
                {isAddMode ? 'Add Item' : 'Update Item'}
              </>
            )}
          </button>
          {!isInline && (
            <button
              type="button"
              onClick={() => navigate(`/workspaces/${formData.workspace}`)}
              className="btn-secondary"
            >
              <i className="fas fa-times"></i> Cancel
            </button>
          )}
        </div>
      </form>
      <style jsx>{`
        .checklist-item {
          transition: all 0.3s ease;
          transform-origin: left;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px;
          margin: 5px 0;
          border-radius: 5px;
          background-color: #f9f9f9;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .checklist-item.completed {
          background-color: #e0ffe0;
        }
        
        .checklist-item input[type="checkbox"] {
          transition: transform 0.2s ease;
          margin-right: 10px;
        }
        
        .checklist-item input[type="checkbox"].checkbox-pop {
          transform: scale(1.3);
        }
        
        .checklist-item-content input[type="text"] {
          transition: all 0.3s ease;
          flex-grow: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: 16px;
        }
        
        .checklist-item-content input[type="text"].completed-text {
          text-decoration: line-through;
          color: #999;
        }
        
        .checklist-item-remove {
          background: none;
          border: none;
          color: #ff5252;
          cursor: pointer;
          padding: 5px;
          transition: color 0.2s ease;
        }
        
        .checklist-item-remove:hover {
          color: #ff0000;
        }
        
        .progress-bar {
          transition: width 0.5s ease-in-out;
          background: linear-gradient(90deg, #4CAF50, #8BC34A);
          border-radius: 4px;
        }
        
        .tag {
          animation: tagPop 0.3s ease-out;
          display: inline-block;
          background-color: #e0e0e0;
          border-radius: 3px;
          padding: 5px 10px;
          margin: 5px;
          font-size: 14px;
        }
        
        @keyframes tagPop {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .upload-success {
          animation: successPop 0.5s ease-out;
          color: #4CAF50;
          font-weight: bold;
        }
        
        @keyframes successPop {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .btn-primary {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        
        .btn-primary:hover {
          background-color: #0056b3;
        }
        
        .btn-secondary {
          background-color: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        
        .btn-secondary:hover {
          background-color: #5a6268;
        }
      `}</style>
    </div>
  );
};

export default WorkspaceItemForm; 