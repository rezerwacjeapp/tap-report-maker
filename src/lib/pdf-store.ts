/**
 * IndexedDB storage for full report snapshots.
 * Stores everything needed to re-generate an identical PDF:
 * draft data (photos base64, signatures base64, fields),
 * template options, and profile at time of generation.
 */

import type { CompanyProfile, ReportDraft, CustomFieldDef, TileItem } from "./storage";

export interface ReportSnapshot {
  draft: ReportDraft;
  profile: CompanyProfile;
  options: {
    pdfTitle: string;
    templateName: string;
    fields: CustomFieldDef[];
    tiles: TileItem[];
    signatureFields: { id: string; label: string }[];
  };
}

const DB_NAME = "docswift_snapshots";
const DB_VERSION = 1;
const STORE_NAME = "report_snapshots";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSnapshot(reportId: string, snapshot: ReportSnapshot): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(snapshot, reportId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSnapshot(reportId: string): Promise<ReportSnapshot | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(reportId);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteSnapshot(reportId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(reportId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
