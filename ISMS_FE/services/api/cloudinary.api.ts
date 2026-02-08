import { apiClient } from '@/lib/api';
import type { ApiResponse } from '@/lib/types/api.types';

export interface CloudinaryUploadResponse {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  bytes: number;
}

export interface CloudinaryDeleteResponse {
  publicId: string;
  status: string;
}

/**
 * Upload file lên Cloudinary
 */
export async function uploadFile(
  file: File,
  folder?: string
): Promise<ApiResponse<CloudinaryUploadResponse>> {
  const formData = new FormData();
  formData.append('File', file);
  if (folder) {
    formData.append('Folder', folder);
  }

  const response = await apiClient.post<ApiResponse<CloudinaryUploadResponse>>(
    '/cloudinary/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}

/**
 * Xóa file khỏi Cloudinary
 */
export async function deleteFile(
  publicId: string
): Promise<ApiResponse<CloudinaryDeleteResponse>> {
  // Encode publicId để xử lý dấu /
  const encodedPublicId = encodeURIComponent(publicId);
  
  const response = await apiClient.delete<ApiResponse<CloudinaryDeleteResponse>>(
    `/cloudinary/delete/${encodedPublicId}`
  );

  return response.data;
}

/**
 * Extract publicId từ Cloudinary URL
 */
export function extractPublicIdFromUrl(url: string): string | null {
  if (!url) return null;
  
  // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{publicId}.{format}
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  return matches ? matches[1] : null;
}
