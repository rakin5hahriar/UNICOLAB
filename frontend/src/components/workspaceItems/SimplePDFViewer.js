import React, { useState } from 'react';

const SimplePDFViewer = ({ fileUrl, fileName, onError }) => {
  const [iframeError, setIframeError] = useState(false);

  const handleIframeError = () => {
    setIframeError(true);
    if (onError) {
      onError();
    }
  };

  if (iframeError) {
    return (
      <div className="simple-pdf-error">
        <p>Unable to display PDF in this browser. Please download the file to view it.</p>
        <a 
          href={fileUrl} 
          download={fileName || "document.pdf"}
          className="btn btn-primary"
        >
          <i className="fas fa-download"></i> Download PDF
        </a>
      </div>
    );
  }

  return (
    <div className="simple-pdf-viewer">
      <iframe
        src={fileUrl}
        title="PDF Document"
        width="100%"
        height="600"
        onError={handleIframeError}
      >
        This browser does not support PDFs. Please download the PDF to view it.
      </iframe>
    </div>
  );
};

export default SimplePDFViewer; 