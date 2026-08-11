import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Typography } from '@/components/ui/Typography';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { getApiBaseUrl, getStoredAuthToken } from '@/services/api';

export interface ImageFieldProps {
  label: string;
  /** Stored URL (public CDN URL in Phase 2, local URI in Phase 1). */
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  error?: string;
}

/**
 * GENERATED DETERMINISTICALLY by generate-component-library.ts.
 *
 * Single writer for image / file fields. The pick-and-upload pipeline:
 *
 *   1. expo-image-picker → user picks an Image from their library.
 *      (lazy-required so Phase 1 / non-image-field apps don't need the
 *      native module installed.)
 *   2. The picked file URI is wrapped in a React-Native-compatible
 *      FormData part: { uri, name, type }. RN's FormData understands this
 *      shape and emits the right multipart wire format.
 *   3. POST to /api/upload — the canonical Phase-2 route force-emitted by
 *      apps/agent-server/.../canonical-templates-mobile-api.ts. That route
 *      uploads to Cloudinary via cloudinary.uploader.upload_stream and
 *      returns { success: true, data: { url, publicId } }.
 *   4. The CDN url from data.url is stored in the form field via onChange.
 *      The DB persists the public URL — NOT the local file:// URI (which
 *      stops resolving the moment the device reboots or the user switches
 *      devices).
 *
 * Phase 1 (design preview): no backend → fall back to storing asset.uri
 * locally so the preview at least renders an image. Mobile bundle never
 * imports cloudinary / aws-sdk / sharp / etc — the backend owns storage.
 */
export function ImageField(props: ImageFieldProps): JSX.Element {
  const { label, value, onChange, required, error } = props;
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const hasError = Boolean(error);

  const pickAndUpload = async () => {
    try {
      // Lazy-require expo-image-picker so tests / Phase 1 stubs don't
      // need the native module installed up-front. The Convergence batch
      // adds expo-image-picker to the contract-driven dep set when any
      // entity declares an image field.
      const picker = await import('expo-image-picker').catch(() => null);
      if (!picker) {
        // No native module — fall through to a manual URL paste (defensive).
        return;
      }
      const perm = await picker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const result = await picker.launchImageLibraryAsync({
        mediaTypes: picker.MediaTypeOptions ? picker.MediaTypeOptions.Images : undefined,
        quality: 0.85,
      });
      if (result.canceled) return;
      const asset = result.assets && result.assets[0];
      if (!asset || !asset.uri) return;

      // Phase 1 (design preview): no backend → keep the local URI so the
      // mock at least shows an image. Phase 2 always has the canonical
      // /api/upload route + Cloudinary creds baked in.
      const isDesignPreview = (globalThis as any).__IS_DESIGN_PREVIEW === true;
      if (isDesignPreview) {
        onChange(asset.uri);
        return;
      }

      setBusy(true);
      try {
        // Multipart wire format matching /api/upload's formData.get('file').
        // RN FormData accepts { uri, name, type } for the file part — fetch
        // sets the multipart Content-Type header (with boundary) for us; do
        // NOT set Content-Type manually or the boundary will be missing.
        const form = new FormData();
        const name = asset.fileName || asset.uri.split('/').pop() || 'upload.jpg';
        const type = asset.mimeType || 'image/jpeg';
        form.append('file', { uri: asset.uri, name, type } as any);

        const token = await getStoredAuthToken();
        const res = await fetch(`${getApiBaseUrl()}/api/upload`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });

        if (!res.ok) {
          // Backend rejected (missing Cloudinary creds, oversized file,
          // network failure). Soft fallback to the local URI so the form
          // is still submittable — the value won't survive a device switch
          // but the user can resubmit later.
          onChange(asset.uri);
          return;
        }

        const payload = (await res.json().catch(() => null)) as
          | { data?: { url?: string }; success?: boolean }
          | null;
        const url = payload?.data?.url;
        if (typeof url === 'string' && url.length > 0) {
          onChange(url);
        } else {
          onChange(asset.uri);
        }
      } finally {
        setBusy(false);
      }
    } catch {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Typography variant="caption" color={colors.textSecondary}>
          {label}{required ? ' *' : ''}
        </Typography>
      </View>
      <Pressable
        onPress={pickAndUpload}
        accessibilityRole="button"
        accessibilityLabel={`Pick ${label}`}
        style={[
          styles.field,
          { borderColor: hasError ? colors.error : colors.border, backgroundColor: colors.surface },
        ]}
      >
        {value ? (
          <Image source={{ uri: value }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name={busy ? 'cloud-upload-outline' : 'image-outline'} size={28} color={colors.textMuted} />
            <Typography variant="caption" color={colors.textMuted}>
              {busy ? 'Uploading…' : `Pick ${String(label ?? "option").toLowerCase()}`}
            </Typography>
          </View>
        )}
      </Pressable>
      {hasError ? (
        <Typography variant="caption" color={colors.error} style={styles.errorText}>{error}</Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  labelRow: { paddingHorizontal: Spacing.xs },
  field: {
    minHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
  },
  preview: { width: '100%', height: 160 },
  placeholder: { alignItems: 'center', gap: 8, padding: Spacing.lg },
  errorText: { paddingHorizontal: Spacing.xs },
});
