import React, { useRef } from 'react';
import { Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimpleFileButtonProps {
  onFileSelect: (files: File[]) => void;
  disabled?: boolean;
}

export const SimpleFileButton: React.FC<SimpleFileButtonProps> = ({ onFileSelect, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('SimpleFileButton clicked', {
      button: e.button,
      bubbles: e.bubbles,
      currentTarget: e.currentTarget,
      target: e.target,
      fileInputRef: fileInputRef.current
    });
    e.preventDefault();
    e.stopPropagation();
    
    if (fileInputRef.current) {
      console.log('Triggering file input click');
      fileInputRef.current.click();
    } else {
      console.error('File input ref is null');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed:', {
      files: e.target.files,
      fileCount: e.target.files?.length,
      value: e.target.value
    });
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      console.log('Calling onFileSelect with files:', files);
      onFileSelect(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add a direct click handler on the input as a debugging measure
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    console.log('Input clicked directly', e);
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={handleClick}
        disabled={disabled}
        className="h-8 w-8 p-0 shrink-0"
        title="Attach file"
        aria-label="Attach file"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileChange}
        onClick={handleInputClick}
        aria-label="File input"
        data-testid="file-input"
        style={{ 
          display: 'none',
          position: 'absolute',
          zIndex: -1
        }}
      />
    </>
  );
};