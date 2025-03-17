import React from 'react';
import { FaFileAlt } from 'react-icons/fa';
import DocumentList from '../components/documents/DocumentList';
import './DocumentsPage.css';

const DocumentsPage = () => {
  return (
    <div className="container">
      <div className="documents-page-header">
        <div className="documents-page-title">
          <FaFileAlt className="documents-icon" />
          <h1>My Documents</h1>
        </div>
      </div>
      
      <DocumentList />
    </div>
  );
};

export default DocumentsPage; 