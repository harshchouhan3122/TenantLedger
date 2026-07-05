import { useState } from "react";
import apiClient from "../api/client";
import "./TenantDetailModal.css";

export default function TenantDetailModal({ tenant, onClose, onDocumentsUpdated }) {
  const [driveLink, setDriveLink] = useState(tenant?.documents?.driveFolderLink || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  if (!tenant) return null;

  async function handleSaveLink(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const trimmed = driveLink.trim();
      await apiClient.patch(`/tenants/${tenant._id}/documents`, {
        driveFolderLink: trimmed,
      });
      onDocumentsUpdated?.(tenant._id, trimmed);
      setSaved(true);
    } catch (err) {
      setError("Couldn't save the link. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{tenant.name}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <span
          className={
            tenant.active ? "badge badge-occupied" : "badge history-badge-past"
          }
        >
          {tenant.active ? "Current tenant" : "Moved out"}
        </span>

        <div className="modal-section">
          <div className="modal-row">
            <span className="modal-label">Phone</span>
            <span>{tenant.phone}</span>
          </div>
          <div className="modal-row">
            <span className="modal-label">Aadhar</span>
            <span>{tenant.aadharMasked}</span>
          </div>
          <div className="modal-row">
            <span className="modal-label">Move-in</span>
            <span>{tenant.moveInDate}</span>
          </div>
          <div className="modal-row">
            <span className="modal-label">Move-out</span>
            <span>{tenant.moveOutDate || "—"}</span>
          </div>
        </div>

        <div className="modal-section">
          <h3>Documents</h3>
          <form className="drive-link-form" onSubmit={handleSaveLink}>
            <input
              type="url"
              placeholder="Paste a Google Drive folder link"
              value={driveLink}
              onChange={(e) => {
                setDriveLink(e.target.value);
                setSaved(false);
              }}
            />
            <button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </form>

          {saved && <div className="save-confirm">Saved.</div>}
          {error && <div className="error-message">{error}</div>}

          {tenant.documents?.driveFolderLink && (
            <a
              className="drive-link-open"
              href={tenant.documents.driveFolderLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Drive folder ↗
            </a>
          )}
        </div>

        <div className="modal-section">
          <h3>Payment history</h3>
          <p className="modal-placeholder">
            Monthly rent, dues, payment status, and uploaded payment
            screenshots will appear here once the billing feature is added —
            that's the next thing we're building.
          </p>
        </div>
      </div>
    </div>
  );
}
