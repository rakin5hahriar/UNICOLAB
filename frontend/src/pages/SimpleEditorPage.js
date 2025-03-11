import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UltraSimpleEditor from '../components/UltraSimpleEditor';

const SimpleEditorPage = () => {
  const [documents, setDocuments] = useState([]);
  
  // Load documents from localStorage
  useEffect(() => {
    const storedDocs = localStorage.getItem('userDocuments');
    if (storedDocs) {
      try {
        const docs = JSON.parse(storedDocs);
        setDocuments(docs);
      } catch (error) {
        console.error('Error loading documents:', error);
      }
    }
  }, []);
  
  // Create a new document
  const createNewDocument = () => {
    const newDoc = {
      id: Date.now().toString(),
      name: `New Document ${documents.length + 1}`,
      owner: 'user@example.com',
      content: '',
      shared: []
    };
    
    const updatedDocs = [...documents, newDoc];
    setDocuments(updatedDocs);
    localStorage.setItem('userDocuments', JSON.stringify(updatedDocs));
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Simple Document Editor</h1>
        <div>
          <button 
            onClick={createNewDocument}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              marginRight: '10px',
              cursor: 'pointer'
            }}
          >
            Create New Document
          </button>
          <Link 
            to="/collaboration"
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            View All Documents
          </Link>
        </div>
      </div>
      
      <UltraSimpleEditor />
      
      <div style={{ marginTop: '20px' }}>
        <h2>Your Documents</h2>
        {documents.length === 0 ? (
          <p>No documents found. Create a new document to get started.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {documents.map(doc => (
              <li 
                key={doc.id}
                style={{
                  padding: '10px',
                  marginBottom: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span>{doc.name}</span>
                <Link 
                  to={`/collaboration/${doc.id}`}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontSize: '14px'
                  }}
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SimpleEditorPage; 