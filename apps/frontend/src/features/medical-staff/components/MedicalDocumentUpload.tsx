"use client";

import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Image,
  FileImage
} from "lucide-react";
import { useUploadDocumentMutation } from "../../../store/api/medicalApi";
import { useToast } from "@/hooks/use-toast";

interface MedicalDocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPlayerId?: string;
  preselectedInjuryId?: string;
}

interface FileWithPreview {
  file: File;
  preview?: string;
  id: string;
}

const DOCUMENT_TYPES = [
  { value: "MRI", label: "MRI Scan" },
  { value: "X_RAY", label: "X-Ray" },
  { value: "CT_SCAN", label: "CT Scan" },
  { value: "ULTRASOUND", label: "Ultrasound" },
  { value: "BLOOD_TEST", label: "Blood Test Results" },
  { value: "MEDICAL_REPORT", label: "Medical Report" },
  { value: "TREATMENT_NOTE", label: "Treatment Notes" },
  { value: "REHABILITATION_PLAN", label: "Rehabilitation Plan" },
  { value: "CLEARANCE_FORM", label: "Medical Clearance" },
  { value: "OTHER", label: "Other" }
];

const ACCEPTED_FILE_TYPES = {
  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt']
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function MedicalDocumentUpload({ 
  isOpen, 
  onClose, 
  preselectedPlayerId = "",
  preselectedInjuryId = ""
}: MedicalDocumentUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [formData, setFormData] = useState({
    playerId: preselectedPlayerId,
    injuryId: preselectedInjuryId,
    title: "",
    documentType: "",
    notes: ""
  });

  const [uploadDocument, { isLoading: isUploading }] = useUploadDocumentMutation();
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" is too large. Maximum size is 10MB.`;
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = Object.values(ACCEPTED_FILE_TYPES).some(extensions =>
      extensions.includes(fileExtension)
    );

    if (!isValidType) {
      return `File type "${fileExtension}" is not supported.`;
    }

    return null;
  };

  const handleFiles = useCallback((newFiles: FileList) => {
    const validFiles: FileWithPreview[] = [];
    const errors: string[] = [];

    Array.from(newFiles).forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
        return;
      }

      const fileWithPreview: FileWithPreview = {
        file,
        id: Math.random().toString(36).substr(2, 9)
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          fileWithPreview.preview = e.target?.result as string;
          setFiles(prev => prev.map(f => f.id === fileWithPreview.id ? fileWithPreview : f));
        };
        reader.readAsDataURL(file);
      }

      validFiles.push(fileWithPreview);
    });

    if (errors.length > 0) {
      toast({
        title: "File Upload Errors",
        description: errors.join('\n'),
        variant: "destructive"
      });
    }

    setFiles(prev => [...prev, ...validFiles]);
  }, [toast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [handleFiles]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one file to upload.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.playerId || !formData.documentType || !formData.title) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const uploadPromises = files.map(async ({ file }) => {
        return uploadDocument({
          file,
          playerId: formData.playerId,
          title: formData.title,
          documentType: formData.documentType,
          injuryId: formData.injuryId || undefined
        }).unwrap();
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Upload Successful",
        description: `${files.length} document(s) uploaded successfully.`,
      });

      // Reset form
      setFiles([]);
      setFormData({
        playerId: preselectedPlayerId,
        injuryId: preselectedInjuryId,
        title: "",
        documentType: "",
        notes: ""
      });
      
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your documents. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Medical Documents</DialogTitle>
          <DialogDescription>
            Upload medical documents for player records, including scans, reports, and treatment notes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300",
              "hover:border-gray-400"
            )}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
          >
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium">Drop files here or click to browse</p>
                <p className="text-sm text-muted-foreground">
                  Supports: Images, PDF, DOC, DOCX, TXT (Max 10MB each)
                </p>
              </div>
              <input
                type="file"
                multiple
                accept={Object.keys(ACCEPTED_FILE_TYPES).join(',')}
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button type="button" variant="outline" asChild>
                  <span>Select Files</span>
                </Button>
              </label>
            </div>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Selected Files ({files.length})</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {files.map(({ file, preview, id }) => (
                  <Card key={id} className="p-3">
                    <div className="flex items-center gap-3">
                      {preview ? (
                        <img src={preview} alt="" className="h-10 w-10 object-cover rounded" />
                      ) : (
                        getFileIcon(file)
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(id)}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="playerId">Player *</Label>
              <Select
                value={formData.playerId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, playerId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">Erik Andersson (#15)</SelectItem>
                  <SelectItem value="7">Marcus Lindberg (#7)</SelectItem>
                  <SelectItem value="23">Viktor Nilsson (#23)</SelectItem>
                  <SelectItem value="14">Johan Bergström (#14)</SelectItem>
                  <SelectItem value="12">Anders Johansson (#12)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type *</Label>
              <Select
                value={formData.documentType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Document Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., MRI Scan - Right Knee, Post-Surgery X-Ray"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="injuryId">Related Injury (Optional)</Label>
            <Select
              value={formData.injuryId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, injuryId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Link to specific injury" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific injury</SelectItem>
                <SelectItem value="1">Erik Andersson - ACL Tear</SelectItem>
                <SelectItem value="2">Marcus Lindberg - Hamstring Strain</SelectItem>
                <SelectItem value="3">Viktor Nilsson - Concussion</SelectItem>
                <SelectItem value="4">Johan Bergström - Ankle Sprain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || files.length === 0}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : 'Documents'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}