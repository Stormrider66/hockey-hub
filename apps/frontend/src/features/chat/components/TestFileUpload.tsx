import React from 'react';

export const TestFileUpload: React.FC = () => {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('TestFileUpload: File selected', {
      files: e.target.files,
      fileCount: e.target.files?.length
    });
    alert(`Test upload: ${e.target.files?.length} file(s) selected`);
  };

  return (
    <div style={{
      padding: '10px',
      background: '#fffbcc',
      border: '2px dashed #ffcc00',
      borderRadius: '4px',
      marginBottom: '10px'
    }}>
      <p style={{ margin: 0, fontSize: '12px', marginBottom: '5px' }}>
        Debug: Test File Upload (Click button below)
      </p>
      <button
        type="button"
        onClick={() => {
          console.log('Test button clicked');
          alert('Test button clicked - now triggering file input');
          const input = document.getElementById('test-file-input');
          if (input) {
            (input as HTMLInputElement).click();
          }
        }}
        style={{
          padding: '5px 10px',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Test File Upload
      </button>
      <input
        id="test-file-input"
        type="file"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        multiple
      />
    </div>
  );
};