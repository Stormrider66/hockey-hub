'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  useGetExercisesQuery,
  useCreateExerciseMutation,
  useUpdateExerciseMutation,
  useDeleteExerciseMutation,
} from '@/store/api/trainingApi';
import type { Exercise, ExerciseCategory } from '@/types/exercise';

// Security: Validate and sanitize URLs to prevent XSS
function sanitizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    // Only allow safe protocols
    if (['http:', 'https:'].includes(parsedUrl.protocol)) {
      return parsedUrl.toString();
    }
    return '';
  } catch {
    return '';
  }
}

export default function ExerciseLibraryPage() {
  const router = useRouter();
  const { data: exercises = [], isLoading, isError } = useGetExercisesQuery();
  const [createExercise] = useCreateExerciseMutation();
  const [updateExercise] = useUpdateExerciseMutation();
  const [deleteExercise] = useDeleteExerciseMutation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('warmup');
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  function openNew() {
    setEditing(null);
    setName('');
    setCategory('warmup');
    setVideoUrl('');
    setDescription('');
    setIsDialogOpen(true);
  }

  function openEdit(ex: Exercise) {
    setEditing(ex);
    setName(ex.name);
    setCategory(ex.category);
    setVideoUrl(ex.videoUrl || '');
    setDescription(ex.description || '');
    setIsDialogOpen(true);
  }

  async function handleSave() {
    // Security: Sanitize URL before saving
    const sanitizedVideoUrl = videoUrl ? sanitizeUrl(videoUrl) : '';
    const payload = { name, category, videoUrl: sanitizedVideoUrl, description };
    try {
      if (editing) {
        await updateExercise({ id: editing.id, exercise: payload }).unwrap();
      } else {
        await createExercise(payload).unwrap();
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save exercise');
    }
  }

  function handleDelete(id: string) {
    if (confirm('Delete this exercise?')) {
      deleteExercise(id);
    }
  }

  function handlePreview(url: string) {
    // Security: Sanitize URL before setting for preview
    const sanitizedUrl = sanitizeUrl(url);
    if (sanitizedUrl) {
      setPreviewUrl(sanitizedUrl);
      setIsPreviewOpen(true);
    } else {
      alert('Invalid video URL');
    }
  }

  return (
    <main className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.push('/fys-coach')}>Back to Dashboard</Button>
        <Button onClick={openNew}>New Exercise</Button>
      </div>

      {isLoading && <p>Loading exercises...</p>}
      {isError && <p>Error loading exercises</p>}

      {!isLoading && !isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Video</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exercises.map(ex => (
              <TableRow key={ex.id}>
                <TableCell>{ex.name}</TableCell>
                <TableCell>{ex.category}</TableCell>
                <TableCell>
                  {ex.videoUrl ? (
                    <a
                      href={sanitizeUrl(ex.videoUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 underline"
                    >
                      View
                    </a>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>{ex.description}</TableCell>
                <TableCell className="space-x-2">
                  {ex.videoUrl && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handlePreview(ex.videoUrl!)}
                    >
                      Preview
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openEdit(ex)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(ex.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Exercise' : 'New Exercise'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Modify exercise details'
                : 'Fill out details for new exercise'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="w-full p-2 border rounded"
                value={category}
                onChange={e => setCategory(e.target.value as ExerciseCategory)}
              >
                <option value="">Select category</option>
                {(['warmup','main','core','conditioning','wrestling'] as ExerciseCategory[])
                  .map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input
                id="videoUrl"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="videoFile">Video File</Label>
              <Input
                type="file"
                id="videoFile"
                accept="video/*"
                onChange={e => setVideoFile(e.target.files?.[0] || null)}
              />
              {videoFile && (
                <video
                  src={URL.createObjectURL(videoFile)}
                  controls
                  className="max-h-40 mt-2 w-full"
                />
              )}
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Video Preview</DialogTitle>
          </DialogHeader>
          {previewUrl ? (
            <video src={previewUrl} controls className="w-full h-auto" />
          ) : (
            <p>No video available.</p>
          )}
          <DialogFooter>
            <Button onClick={() => setIsPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
} 