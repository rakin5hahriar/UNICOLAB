import React from 'react';

const PDFFallback = ({ url }) => {
  return (
    <div className="pdf-fallback p-6 bg-gray-50 rounded border text-center">
      <div className="mb-4">
        <i className="fas fa-file-pdf text-red-500 text-4xl"></i>
      </div>
      <h3 className="text-lg font-semibold mb-2">PDF Viewer Unavailable</h3>
      <p className="text-gray-600 mb-4">
        We're unable to display the PDF in the browser. Please use one of the options below:
      </p>
      <div className="flex justify-center gap-4">
        <a
          href={url}
          download
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          <i className="fas fa-download mr-2"></i>
          Download PDF
        </a>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          <i className="fas fa-external-link-alt mr-2"></i>
          Open in New Tab
        </a>
      </div>
    </div>
  );
};

export default PDFFallback; 