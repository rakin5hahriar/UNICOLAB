import React from 'react';

const PDFFallback = ({ fileUrl, fileName }) => {
  return (
    <div className="pdf-fallback">
      <div className="pdf-fallback-message">
        <i className="fas fa-exclamation-triangle"></i>
        <h4>PDF Viewer Unavailable</h4>
        <p>
          We're having trouble displaying this PDF in the browser. This could be due to:
        </p>
        <ul>
          <li>Browser restrictions</li>
          <li>CORS policy issues</li>
          <li>Network connectivity problems</li>
        </ul>
        <p>You can still access the PDF using one of these options:</p>
      </div>
      <div className="pdf-fallback-actions">
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-primary"
          download={fileName || "document.pdf"}
        >
          <i className="fas fa-download"></i> Download PDF
        </a>
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-secondary"
        >
          <i className="fas fa-external-link-alt"></i> Open in New Tab
        </a>
      </div>
    </div>
  );
};

export default PDFFallback; 