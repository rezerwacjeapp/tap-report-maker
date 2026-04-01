/**
 * Supabase Storage helpers for report images.
 *
 * Instead of storing base64 photos/signatures/logo inside the snapshot JSONB
 * (which eats ~600 KB per report in PostgreSQL), we upload them to Supabase
 * Storage bucket "report-images" and store only the path (~100 bytes).
 *
 * On re-download, we fetch the images back and reconstruct base64 for pdfmake.
 */

import { supabase } from "./supabase";
import type { ReportDraft, CompanyProfile } from "./storage";

const BUCKET = "report-images";

// ─── HELPERS ────────────────────────────────────────────────

/** Convert base64 data URL to Blob */
function base64ToBlob(base64: string): Blob {
  const [header, data] = base64.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/** Fetch file from Storage and return as base64 data URL */
async function downloadAsBase64(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw error || new Error("Download failed");

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(data);
  });
}

/** Upload a single base64 image, return storage path */
async function uploadBase64(path: string, base64: string): Promise<string> {
  const blob = base64ToBlob(base64);
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true,
    contentType: blob.type,
  });
  if (error) throw error;
  return path;
}

// ─── UPLOAD (save snapshot) ─────────────────────────────────

export interface LightSnapshot {
  draft: ReportDraft;
  profile: CompanyProfile;
  options: any;
  /** Marker so we know images are in Storage, not inline */
  _storageVersion: 2;
}

/**
 * Extract base64 images from draft & profile, upload to Storage,
 * return a lightweight snapshot with storage paths instead of base64.
 */
export async function uploadSnapshotImages(
  userId: string,
  reportId: string,
  draft: ReportDraft,
  profile: CompanyProfile,
  options: any,
): Promise<LightSnapshot> {
  const prefix = `${userId}/${reportId}`;
  const uploads: Promise<void>[] = [];

  // Clone draft & profile so we don't mutate originals
  const lightDraft: ReportDraft = JSON.parse(JSON.stringify(draft));
  const lightProfile: CompanyProfile = JSON.parse(JSON.stringify(profile));

  // 1. Photos (photosByField)
  if (lightDraft.photosByField) {
    for (const [fieldId, photos] of Object.entries(lightDraft.photosByField)) {
      if (!photos?.length) continue;
      const paths: string[] = [];
      photos.forEach((base64, idx) => {
        if (!base64 || !base64.startsWith("data:")) {
          paths.push(base64); // already a path
          return;
        }
        const path = `${prefix}/photos/${fieldId}_${idx}.jpg`;
        paths.push(`storage:${path}`);
        uploads.push(uploadBase64(path, base64).then(() => {}));
      });
      lightDraft.photosByField[fieldId] = paths;
    }
  }

  // Legacy flat photos array
  if (lightDraft.photos?.length) {
    const paths: string[] = [];
    lightDraft.photos.forEach((base64, idx) => {
      if (!base64 || !base64.startsWith("data:")) {
        paths.push(base64);
        return;
      }
      const path = `${prefix}/photos/legacy_${idx}.jpg`;
      paths.push(`storage:${path}`);
      uploads.push(uploadBase64(path, base64).then(() => {}));
    });
    lightDraft.photos = paths;
  }

  // 2. Signatures
  if (lightDraft.signatures) {
    for (const [sigId, base64] of Object.entries(lightDraft.signatures)) {
      if (!base64 || !base64.startsWith("data:")) continue;
      const path = `${prefix}/sigs/${sigId}.png`;
      lightDraft.signatures[sigId] = `storage:${path}`;
      uploads.push(uploadBase64(path, base64).then(() => {}));
    }
  }

  // 3. Company logo
  if (profile.logo && profile.logo.startsWith("data:")) {
    const path = `${prefix}/logo.png`;
    lightProfile.logo = `storage:${path}`;
    uploads.push(uploadBase64(path, profile.logo).then(() => {}));
  }

  // Wait for all uploads
  await Promise.all(uploads);

  return {
    draft: lightDraft,
    profile: lightProfile,
    options,
    _storageVersion: 2,
  };
}

// ─── DOWNLOAD (restore snapshot) ────────────────────────────

/** Check if a string is a storage reference */
function isStorageRef(val: string | null | undefined): val is string {
  return typeof val === "string" && val.startsWith("storage:");
}

/** Extract path from storage reference */
function storagePath(ref: string): string {
  return ref.slice("storage:".length);
}

/**
 * Restore base64 images from Storage into a snapshot.
 * If snapshot is old format (inline base64), returns as-is.
 */
export async function downloadSnapshotImages(
  snapshot: any,
): Promise<{ draft: ReportDraft; profile: CompanyProfile; options: any }> {
  // Old format — base64 already inline, nothing to do
  if (!snapshot._storageVersion) {
    return snapshot;
  }

  const draft: ReportDraft = JSON.parse(JSON.stringify(snapshot.draft));
  const profile: CompanyProfile = JSON.parse(JSON.stringify(snapshot.profile));
  const downloads: Promise<void>[] = [];

  // 1. Photos (photosByField)
  if (draft.photosByField) {
    for (const [fieldId, photos] of Object.entries(draft.photosByField)) {
      if (!photos?.length) continue;
      photos.forEach((ref, idx) => {
        if (!isStorageRef(ref)) return;
        downloads.push(
          downloadAsBase64(storagePath(ref))
            .then((b64) => { draft.photosByField[fieldId][idx] = b64; })
            .catch(() => { draft.photosByField[fieldId][idx] = ""; }) // graceful fail
        );
      });
    }
  }

  // Legacy flat photos
  if (draft.photos?.length) {
    draft.photos.forEach((ref, idx) => {
      if (!isStorageRef(ref)) return;
      downloads.push(
        downloadAsBase64(storagePath(ref))
          .then((b64) => { draft.photos[idx] = b64; })
          .catch(() => { draft.photos[idx] = ""; })
      );
    });
  }

  // 2. Signatures
  if (draft.signatures) {
    for (const [sigId, ref] of Object.entries(draft.signatures)) {
      if (!isStorageRef(ref)) continue;
      downloads.push(
        downloadAsBase64(storagePath(ref!))
          .then((b64) => { draft.signatures[sigId] = b64; })
          .catch(() => { draft.signatures[sigId] = null; })
      );
    }
  }

  // 3. Logo
  if (isStorageRef(profile.logo)) {
    downloads.push(
      downloadAsBase64(storagePath(profile.logo))
        .then((b64) => { profile.logo = b64; })
        .catch(() => { profile.logo = null; })
    );
  }

  await Promise.all(downloads);

  return { draft, profile, options: snapshot.options };
}

// ─── CLEANUP ────────────────────────────────────────────────

/**
 * Delete all images for a report from Storage.
 * Called when user deletes a report from history.
 */
export async function deleteReportImages(userId: string, reportId: string): Promise<void> {
  const prefix = `${userId}/${reportId}`;

  // List all files under this report's prefix
  const { data: files } = await supabase.storage.from(BUCKET).list(prefix, { limit: 100 });
  if (!files?.length) return;

  // Also check subdirectories (photos/, sigs/)
  const allPaths: string[] = [];

  for (const item of files) {
    if (item.id === null) {
      // It's a folder — list its contents
      const { data: subFiles } = await supabase.storage.from(BUCKET).list(`${prefix}/${item.name}`, { limit: 100 });
      if (subFiles) {
        subFiles.forEach((f) => allPaths.push(`${prefix}/${item.name}/${f.name}`));
      }
    } else {
      allPaths.push(`${prefix}/${item.name}`);
    }
  }

  if (allPaths.length > 0) {
    await supabase.storage.from(BUCKET).remove(allPaths);
  }
}
