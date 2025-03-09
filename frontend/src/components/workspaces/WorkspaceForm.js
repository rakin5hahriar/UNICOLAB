import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getWorkspaceById, createWorkspace, updateWorkspace } from '../../api/workspaceApi';
import { createWorkspaceItem } from '../../api/workspaceApi';
import { getCourseById } from '../../api/courseApi';
import { uploadFile } from '../../api/fileApi';

// Available icons for workspaces
const ICONS = [
  'book', 'pencil-alt', 'file-alt', 'clipboard', 'tasks',
  'calculator', 'flask', 'microscope', 'atom', 'brain',
  'laptop-code', 'code', 'project-diagram', 'chart-line', 'chart-bar',
  'globe', 'language', 'music', 'palette', 'camera',
];

// Available colors for workspaces
const COLORS = [
  '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
  '#1abc9c', '#d35400', '#34495e', '#16a085', '#27ae60',
  '#2980b9', '#8e44ad', '#f1c40f', '#e67e22', '#c0392b',
];

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

const WorkspaceForm = () => {
  const { id, courseId } = useParams();
  const navigate = useNavigate();
  const isAddMode = !id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    course: courseId || '',
    color: '#3498db',
    icon: 'book',
  });
  
  const [initialItems, setInitialItems] = useState([
    { 
      title: '', 
      type: 'note', 
      content: '',
      fileUrl: '',
      fileName: '',
      fileType: '',
      documentUrl: '',
      documentProvider: '',
      dueDate: '',
      priority: 'medium',
      tags: []
    }
  ]);
  
  const [courseName, setCourseName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([null]);
  const [uploadProgress, setUploadProgress] = useState([0]);
  const [isUploading, setIsUploading] = useState([false]);
  const [uploadSuccess, setUploadSuccess] = useState([false]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (courseId) {
          // If we have a courseId, fetch the course name
          const course = await getCourseById(courseId);
          setCourseName(course.title);
          setFormData(prev => ({ ...prev, course: courseId }));
        }

        if (!isAddMode) {
          // If editing, fetch the workspace
          const workspace = await getWorkspaceById(id);
          setFormData({
            name: workspace.name,
            description: workspace.description || '',
            course: workspace.course._id,
            color: workspace.color,
            icon: workspace.icon,
          });

          // Also fetch the course name
          const course = await getCourseById(workspace.course._id);
          setCourseName(course.title);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, [id, courseId, isAddMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...initialItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [name]: value
    };
    setInitialItems(updatedItems);
  };
  
  const handleAddItem = () => {
    setInitialItems([
      ...initialItems,
      { 
        title: '', 
        type: 'note', 
        content: '',
        fileUrl: '',
        fileName: '',
        fileType: '',
        documentUrl: '',
        documentProvider: '',
        dueDate: '',
        priority: 'medium',
        tags: []
      }
    ]);
    setFiles([...files, null]);
    setUploadProgress([...uploadProgress, 0]);
    setIsUploading([...isUploading, false]);
    setUploadSuccess([...uploadSuccess, false]);
  };
  
  const handleRemoveItem = (index) => {
    const updatedItems = initialItems.filter((_, i) => i !== index);
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedProgress = uploadProgress.filter((_, i) => i !== index);
    const updatedIsUploading = isUploading.filter((_, i) => i !== index);
    const updatedUploadSuccess = uploadSuccess.filter((_, i) => i !== index);
    
    setInitialItems(updatedItems);
    setFiles(updatedFiles);
    setUploadProgress(updatedProgress);
    setIsUploading(updatedIsUploading);
    setUploadSuccess(updatedUploadSuccess);
  };
  
  // Validate file type
  const validateFileType = (file, type) => {
    if (!file) return false;
    
    // For PDF type, only allow PDF files
    if (type === 'pdf' && !ALLOWED_FILE_TYPES.pdf.includes(file.type)) {
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

  const handleFileChange = (index, e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        return;
      }
      
      // Validate file type
      if (!validateFileType(selectedFile, initialItems[index].type)) {
        return;
      }
      
      const updatedFiles = [...files];
      updatedFiles[index] = selectedFile;
      setFiles(updatedFiles);
      
      // Reset upload states
      const updatedProgress = [...uploadProgress];
      updatedProgress[index] = 0;
      setUploadProgress(updatedProgress);
      
      const updatedUploadSuccess = [...uploadSuccess];
      updatedUploadSuccess[index] = false;
      setUploadSuccess(updatedUploadSuccess);
      
      setError(null);
      
      // Update form data with file name
      const updatedItems = [...initialItems];
      updatedItems[index] = {
        ...updatedItems[index],
        fileName: selectedFile.name
      };
      setInitialItems(updatedItems);
    }
  };

  const handleFileUpload = async (index) => {
    if (!files[index]) return null;

    try {
      const updatedIsUploading = [...isUploading];
      updatedIsUploading[index] = true;
      setIsUploading(updatedIsUploading);
      
      const updatedProgress = [...uploadProgress];
      updatedProgress[index] = 0;
      setUploadProgress(updatedProgress);
      
      setError(null);
      
      // Create form data
      const formDataObj = new FormData();
      formDataObj.append('file', files[index]);
      
      // Upload file
      const uploadedFile = await uploadFile(formDataObj, (progress) => {
        const newProgress = [...uploadProgress];
        newProgress[index] = progress;
        setUploadProgress(newProgress);
      });
      
      updatedIsUploading[index] = false;
      setIsUploading(updatedIsUploading);
      
      const updatedUploadSuccess = [...uploadSuccess];
      updatedUploadSuccess[index] = true;
      setUploadSuccess(updatedUploadSuccess);
      
      // Update form data with file information
      const updatedItems = [...initialItems];
      updatedItems[index] = {
        ...updatedItems[index],
        fileUrl: uploadedFile.fileUrl,
        fileName: uploadedFile.fileName,
        fileType: uploadedFile.fileType,
      };
      setInitialItems(updatedItems);
      
      return uploadedFile;
    } catch (err) {
      const updatedIsUploading = [...isUploading];
      updatedIsUploading[index] = false;
      setIsUploading(updatedIsUploading);
      
      setError(err.message || 'Failed to upload file');
      return null;
    }
  };

  const handleUploadButtonClick = async (index, e) => {
    e.preventDefault();
    if (files[index]) {
      await handleFileUpload(index);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Upload any files that haven't been uploaded yet
      for (let i = 0; i < initialItems.length; i++) {
        if (files[i] && !uploadSuccess[i]) {
          const uploadedFile = await handleFileUpload(i);
          if (!uploadedFile) {
            setLoading(false);
            return; // Stop if file upload failed
          }
        }
      }
      
      let workspaceId;
      
      // Create or update the workspace
      if (isAddMode) {
        const workspace = await createWorkspace(formData);
        workspaceId = workspace._id;
      } else {
        const workspace = await updateWorkspace(id, formData);
        workspaceId = workspace._id;
      }
      
      // Create initial items if any
      const validItems = initialItems.filter(item => item.title.trim() !== '');
      
      for (const item of validItems) {
        await createWorkspaceItem(workspaceId, {
          ...item,
          workspace: workspaceId,
          course: formData.course
        });
      }
      
      setLoading(false);
      navigate(`/workspaces/${workspaceId}`);
    } catch (err) {
      setError(err.message || 'Failed to save workspace');
      setLoading(false);
    }
  };

  if (loading && !isAddMode) return <div className="loading">Loading workspace...</div>;

  return (
    <div className="workspace-form">
      <h2>{isAddMode ? 'Add New Workspace' : 'Edit Workspace'}</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Workspace Name*</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., Lecture Notes"
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            placeholder="Brief description of this workspace"
          />
        </div>
        <div className="form-group">
          <label>Course</label>
          <div className="course-display">{courseName}</div>
        </div>
        <div className="form-group">
          <label>Workspace Color</label>
          <div className="color-picker">
            {COLORS.map((color) => (
              <div
                key={color}
                className={`color-option ${formData.color === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setFormData({ ...formData, color })}
              ></div>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Workspace Icon</label>
          <div className="icon-picker">
            {ICONS.map((icon) => (
              <div
                key={icon}
                className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, icon })}
              >
                <i className={`fas fa-${icon}`}></i>
              </div>
            ))}
          </div>
        </div>
        
        {/* Initial Items Section */}
        <div className="initial-items-section">
          <h3>Initial Items</h3>
          <p className="form-text">Add items to your workspace right away (optional)</p>
          
          {initialItems.map((item, index) => (
            <div key={index} className="initial-item">
              <div className="initial-item-header">
                <h4>Item {index + 1}</h4>
                {index > 0 && (
                  <button 
                    type="button" 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleRemoveItem(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`item-title-${index}`}>Title</label>
                  <input
                    type="text"
                    id={`item-title-${index}`}
                    name="title"
                    value={item.title}
                    onChange={(e) => handleItemChange(index, e)}
                    placeholder="Item title"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={`item-type-${index}`}>Type</label>
                  <select
                    id={`item-type-${index}`}
                    name="type"
                    value={item.type}
                    onChange={(e) => handleItemChange(index, e)}
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
              {(item.type === 'note' || item.type === 'assignment' || item.type === 'reading') && (
                <div className="form-group">
                  <label htmlFor={`item-content-${index}`}>Content</label>
                  <textarea
                    id={`item-content-${index}`}
                    name="content"
                    value={item.content}
                    onChange={(e) => handleItemChange(index, e)}
                    rows="3"
                    placeholder="Enter content here..."
                  />
                </div>
              )}
              
              {/* File upload field for PDFs and other files */}
              {(item.type === 'pdf' || item.type === 'other') && (
                <div className="form-group">
                  <label htmlFor={`item-file-${index}`}>Upload File</label>
                  <div className="file-upload-container">
                    <input
                      type="file"
                      id={`item-file-${index}`}
                      onChange={(e) => handleFileChange(index, e)}
                      className="file-input"
                      accept={item.type === 'pdf' ? '.pdf' : '*'}
                    />
                    {files[index] && (
                      <div className="file-info">
                        <p>Selected file: {files[index].name}</p>
                        <p>Size: {(files[index].size / 1024 / 1024).toFixed(2)} MB</p>
                        {!uploadSuccess[index] && (
                          <button 
                            onClick={(e) => handleUploadButtonClick(index, e)}
                            className="btn btn-primary btn-sm"
                            disabled={isUploading[index]}
                          >
                            {isUploading[index] ? 'Uploading...' : 'Upload Now'}
                          </button>
                        )}
                        {uploadSuccess[index] && (
                          <div className="upload-success">
                            <i className="fas fa-check-circle"></i> File uploaded successfully
                          </div>
                        )}
                      </div>
                    )}
                    {isUploading[index] && (
                      <div className="upload-progress">
                        <div 
                          className="progress-bar" 
                          style={{ width: `${uploadProgress[index]}%` }}
                        ></div>
                        <span>{uploadProgress[index]}%</span>
                      </div>
                    )}
                  </div>
                  <div className="form-text">
                    {item.type === 'pdf' ? 'Upload a PDF file (max 10MB)' : 'Upload a file (max 10MB)'}
                  </div>
                  
                  <div className="form-divider">OR</div>
                  
                  <label htmlFor={`item-fileUrl-${index}`}>File URL</label>
                  <input
                    type="text"
                    id={`item-fileUrl-${index}`}
                    name="fileUrl"
                    value={item.fileUrl}
                    onChange={(e) => handleItemChange(index, e)}
                    placeholder="Enter URL to file"
                  />
                </div>
              )}
              
              {/* Document link fields */}
              {item.type === 'document' && (
                <>
                  <div className="form-group">
                    <label htmlFor={`item-documentUrl-${index}`}>Document URL</label>
                    <input
                      type="text"
                      id={`item-documentUrl-${index}`}
                      name="documentUrl"
                      value={item.documentUrl}
                      onChange={(e) => handleItemChange(index, e)}
                      placeholder="Enter URL to Google Doc, OneDrive, etc."
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`item-documentProvider-${index}`}>Document Provider</label>
                    <select
                      id={`item-documentProvider-${index}`}
                      name="documentProvider"
                      value={item.documentProvider}
                      onChange={(e) => handleItemChange(index, e)}
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
              {item.type === 'video' && (
                <div className="form-group">
                  <label htmlFor={`item-documentUrl-${index}`}>YouTube URL</label>
                  <input
                    type="text"
                    id={`item-documentUrl-${index}`}
                    name="documentUrl"
                    value={item.documentUrl}
                    onChange={(e) => handleItemChange(index, e)}
                    placeholder="Enter YouTube video URL"
                  />
                </div>
              )}
              
              {/* Assignment and reading specific fields */}
              {(item.type === 'assignment' || item.type === 'reading') && (
                <div className="form-row">
                  {item.type === 'assignment' && (
                    <div className="form-group">
                      <label htmlFor={`item-priority-${index}`}>Priority</label>
                      <select
                        id={`item-priority-${index}`}
                        name="priority"
                        value={item.priority}
                        onChange={(e) => handleItemChange(index, e)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <label htmlFor={`item-dueDate-${index}`}>Due Date</label>
                    <input
                      type="date"
                      id={`item-dueDate-${index}`}
                      name="dueDate"
                      value={item.dueDate}
                      onChange={(e) => handleItemChange(index, e)}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
          
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={handleAddItem}
          >
            Add Another Item
          </button>
        </div>
        
        <div className="form-buttons">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isAddMode ? 'Create Workspace' : 'Update Workspace'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/courses/${formData.course}`)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkspaceForm; 