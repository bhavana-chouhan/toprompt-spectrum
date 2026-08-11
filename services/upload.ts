import * as ImagePicker from 'expo-image-picker';

import { apiRequest } from '@/services/api';
import { showToast } from '@/components/ui/Toast';

export type UploadedAsset = { url: string; publicId: string };

export type PickedImage = {
  uri: string;
  mimeType: string;
  fileName: string;
};

/**
 * Pick an image from the user's media library. Handles iOS/Android permission
 * flow and graceful denial. Returns null if the user cancels or denies
 * permission — callers should treat null as a no-op (do NOT show an error).
 *
 * The Toast surface handles the permission-denied case so screens don't
 * have to render their own error UI.
 */
export async function pickImage(): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    showToast({
      type: 'error',
      title: 'Permission required',
      message: 'Photo library access is needed to upload an image.',
    });
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
    base64: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType || 'image/jpeg',
    fileName: asset.fileName || `upload_${Date.now()}.jpg`,
  };
}

/**
 * Upload a picked image to /api/upload via multipart FormData. Returns
 * { url, publicId } from Cloudinary. Throws ApiError on failure (caught by
 * services/api.ts which renders the Toast).
 *
 * CRITICAL: do NOT pass headers — React Native sets the multipart boundary
 * Content-Type automatically when the body is FormData. Setting it manually
 * breaks the boundary and the server's multipart parser will reject it.
 */
export async function uploadImage(picked: PickedImage): Promise<UploadedAsset> {
  const formData = new FormData();
  formData.append('file', {
    uri: picked.uri,
    name: picked.fileName,
    type: picked.mimeType,
  } as any);
  return apiRequest<UploadedAsset>(
    '/api/upload',
    {
      method: 'POST',
      body: formData as any,
      // Intentionally pass undefined headers — RN auto-sets multipart boundary.
      headers: undefined,
    },
    { unwrapData: true },
  );
}

/**
 * Convenience: pick + upload in one call. Returns null if the user cancels
 * the picker or denies permission. Throws ApiError on upload failure.
 */
export async function pickAndUploadImage(): Promise<UploadedAsset | null> {
  const picked = await pickImage();
  if (!picked) return null;
  return uploadImage(picked);
}
