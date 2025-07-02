import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  File,
  FileImage,
  Shield,
} from 'lucide-react';
import { useUploadFileMutation } from '@/store/api/fileApi';
import { useAttachDocumentMutation } from '@/store/api/paymentApi';
import { useSendMessageMutation } from '@/store/api/chatApi';

interface PaymentDocumentUploadProps {
  discussionId: string;
  conversationId: string;
  onUpload: () => void;
}

const documentTypes = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'statement', label: 'Bank Statement' },
  { value: 'agreement', label: 'Agreement' },
  { value: 'other', label: 'Other' },
];

const allowedFileTypes = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const maxFileSize = 10 * 1024 * 1024; // 10MB

export const PaymentDocumentUpload: React.FC<PaymentDocumentUploadProps> = ({
  discussionId,
  conversationId,
  onUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [uploadFile] = useUploadFileMutation();
  const [attachDocument] = useAttachDocumentMutation();
  const [sendMessage] = useSendMessageMutation();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!allowedFileTypes.includes(file.type)) {
      setError('Please upload a PDF, image (JPG/PNG), or Word document.');
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setError('File size must be less than 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      setError('Please select a file and document type.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Step 1: Upload file
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', 'payment_document');
      formData.append('encrypted', 'true'); // Request encryption for sensitive documents

      const uploadResult = await uploadFile({
        formData,
        onUploadProgress: (progress) => {
          setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
        },
      }).unwrap();

      // Step 2: Send message with file attachment
      const messageResult = await sendMessage({
        conversationId,
        content: `Uploaded ${documentType}: ${selectedFile.name}`,
        attachments: [{
          id: uploadResult.id,
          fileName: uploadResult.fileName,
          fileUrl: uploadResult.url,
          fileType: uploadResult.mimeType,
          fileSize: uploadResult.size,
        }],
      }).unwrap();

      // Step 3: Attach document to payment discussion
      await attachDocument({
        paymentDiscussionId: discussionId,
        messageId: messageResult.id,
        fileName: uploadResult.fileName,
        fileType: uploadResult.mimeType,
        fileSize: uploadResult.size,
        fileUrl: uploadResult.url,
        documentType,
        metadata: {
          originalFileName: selectedFile.name,
          uploadedAt: new Date().toISOString(),
          encrypted: true,
        },
      }).unwrap();

      // Success
      onUpload();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      setError(error.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <FileText className="w-8 h-8 text-gray-400" />;
    
    if (selectedFile.type.startsWith('image/')) {
      return <FileImage className="w-8 h-8 text-blue-500" />;
    }
    
    return <File className="w-8 h-8 text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your documents are encrypted and securely stored. Only authorized personnel can access them.
        </AlertDescription>
      </Alert>

      {/* File Selection */}
      <div>
        <Label htmlFor="file-upload">Select Document</Label>
        <div className="mt-2">
          {!selectedFile ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors"
            >
              <div className="flex flex-col items-center">
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, or Word (max 10MB)</p>
              </div>
            </button>
          ) : (
            <div className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getFileIcon()}
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  setError(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept={allowedFileTypes.join(',')}
            className="hidden"
            id="file-upload"
          />
        </div>
      </div>

      {/* Document Type */}
      <div>
        <Label htmlFor="document-type">Document Type</Label>
        <Select value={documentType} onValueChange={setDocumentType}>
          <SelectTrigger id="document-type" className="mt-2">
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            {documentTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setSelectedFile(null);
            setDocumentType('');
            setError(null);
          }}
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !documentType || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </div>
    </div>
  );
};