import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface FileUploadResponse {
  success: boolean;
  file: {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    category: string;
    status: string;
    url: string;
    thumbnailUrl?: string;
    createdAt: string;
  };
}

export interface FileSearchParams {
  userId?: string;
  organizationId?: string;
  teamId?: string;
  category?: string;
  mimeType?: string;
  tags?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  minSize?: number;
  maxSize?: number;
  status?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'size' | 'name' | 'accessCount';
  sortOrder?: 'ASC' | 'DESC';
}

export interface FileListResponse {
  files: Array<{
    id: string;
    name: string;
    size: number;
    mimeType: string;
    category: string;
    status: string;
    description?: string;
    url: string;
    thumbnailUrl?: string;
    createdAt: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}

export interface FileShareRequest {
  sharedWithId?: string;
  shareType: 'user' | 'team' | 'organization' | 'public_link';
  permissions?: Array<'view' | 'download' | 'edit' | 'delete'>;
  expiresAt?: string;
  maxAccessCount?: number;
  password?: string;
  notes?: string;
}

export interface SignedUrlResponse {
  url: string;
  expiresIn: number;
  action: 'upload' | 'download';
}

export const fileApi = createApi({
  reducerPath: 'fileApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/files',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['File', 'FileList'],
  endpoints: (builder) => ({
    uploadFile: builder.mutation<FileUploadResponse, FormData>({
      query: (formData) => ({
        url: '/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['FileList'],
    }),

    uploadMultipleFiles: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/upload/multiple',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['FileList'],
    }),

    getFile: builder.query<any, string>({
      query: (fileId) => `/${fileId}`,
      providesTags: (_result, _error, fileId) => [{ type: 'File', id: fileId }],
    }),

    searchFiles: builder.query<FileListResponse, FileSearchParams>({
      query: (params) => ({
        url: '/',
        params,
      }),
      providesTags: ['FileList'],
    }),

    deleteFile: builder.mutation<void, string>({
      query: (fileId) => ({
        url: `/${fileId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, fileId) => [
        { type: 'File', id: fileId },
        'FileList',
      ],
    }),

    shareFile: builder.mutation<any, { fileId: string; shareData: FileShareRequest }>({
      query: ({ fileId, shareData }) => ({
        url: `/${fileId}/share`,
        method: 'POST',
        body: shareData,
      }),
      invalidatesTags: (_result, _error, { fileId }) => [{ type: 'File', id: fileId }],
    }),

    getSignedUrl: builder.mutation<SignedUrlResponse, { fileId: string; action?: 'upload' | 'download'; expiresIn?: number }>({
      query: ({ fileId, action = 'download', expiresIn = 3600 }) => ({
        url: `/${fileId}/signed-url`,
        method: 'POST',
        body: { action, expiresIn },
      }),
    }),

    addTags: builder.mutation<void, { fileId: string; tags: string[] }>({
      query: ({ fileId, tags }) => ({
        url: `/${fileId}/tags`,
        method: 'POST',
        body: { tags },
      }),
      invalidatesTags: (_result, _error, { fileId }) => [{ type: 'File', id: fileId }],
    }),

    // Image processing endpoints
    processImage: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/images/process',
        method: 'POST',
        body: formData,
      }),
    }),

    cropImage: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/images/crop',
        method: 'POST',
        body: formData,
      }),
    }),

    resizeImage: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/images/resize',
        method: 'POST',
        body: formData,
      }),
    }),

    rotateImage: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/images/rotate',
        method: 'POST',
        body: formData,
      }),
    }),

    convertImage: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/images/convert',
        method: 'POST',
        body: formData,
      }),
    }),

    generateThumbnail: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/images/thumbnail',
        method: 'POST',
        body: formData,
      }),
    }),

    getImageMetadata: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/images/metadata',
        method: 'POST',
        body: formData,
      }),
    }),
  }),
});

export const {
  useUploadFileMutation,
  useUploadMultipleFilesMutation,
  useGetFileQuery,
  useSearchFilesQuery,
  useDeleteFileMutation,
  useShareFileMutation,
  useGetSignedUrlMutation,
  useAddTagsMutation,
  useProcessImageMutation,
  useCropImageMutation,
  useResizeImageMutation,
  useRotateImageMutation,
  useConvertImageMutation,
  useGenerateThumbnailMutation,
  useGetImageMetadataMutation,
} = fileApi;