import "./PropertyHistoryModal.css";

export default function PropertyHistoryModal({
  propertyName,
  tenants,
  loading,
  error,
  onClose,
  onSelectTenant,
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Tenant history — {propertyName}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {loading && <p className="modal-placeholder">Loading history…</p>}
        {error && <div className="error-message">{error}</div>}

        {!loading && tenants && tenants.length === 0 && (
          <p className="modal-placeholder">No tenants have stayed here yet.</p>
        )}

        <div className="history-modal-list">
          {tenants?.map((tenant) => (
            <div
              className="history-entry history-entry-clickable"
              key={tenant._id}
              onClick={() => onSelectTenant(tenant)}
            >
              <div className="history-entry-top">
                <span className="history-tenant-name">{tenant.name}</span>
                <span
                  className={
                    tenant.active
                      ? "badge badge-occupied history-badge"
                      : "badge history-badge history-badge-past"
                  }
                >
                  {tenant.active ? "Current" : "Moved out"}
                </span>
              </div>
              <div className="history-entry-details">
                {tenant.moveInDate} → {tenant.moveOutDate || "present"}
              </div>
              <div className="history-entry-details">
                {tenant.phone} · Aadhar {tenant.aadharMasked}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
