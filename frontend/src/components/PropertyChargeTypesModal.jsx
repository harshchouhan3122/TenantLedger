import { useState } from "react";
import apiClient from "../api/client";
import "./PropertyChargeTypesModal.css";

export default function PropertyChargeTypesModal({ property, onClose, onUpdated }) {
  const [chargeTypes, setChargeTypes] = useState(property.chargeTypes || []);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function applyUpdate(updated) {
    setChargeTypes(updated);
    onUpdated?.(property._id, updated);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newLabel.trim() || newAmount === "") return;

    setSaving(true);
    setError(null);
    try {
      const response = await apiClient.post(`/properties/${property._id}/charge-types`, {
        label: newLabel.trim(),
        defaultAmount: Number(newAmount),
      });
      applyUpdate([...chargeTypes, response.data]);
      setNewLabel("");
      setNewAmount("");
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't add charge type.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(charge) {
    setEditingId(charge.id);
    setEditLabel(charge.label);
    setEditAmount(String(charge.defaultAmount));
  }

  async function handleSaveEdit(chargeId) {
    if (!editLabel.trim() || editAmount === "") return;

    setSaving(true);
    setError(null);
    try {
      await apiClient.patch(`/properties/${property._id}/charge-types/${chargeId}`, {
        label: editLabel.trim(),
        defaultAmount: Number(editAmount),
      });
      applyUpdate(
        chargeTypes.map((c) =>
          c.id === chargeId
            ? { ...c, label: editLabel.trim(), defaultAmount: Number(editAmount) }
            : c
        )
      );
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't update charge type.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(chargeId) {
    const confirmed = window.confirm("Delete this charge type?");
    if (!confirmed) return;

    try {
      await apiClient.delete(`/properties/${property._id}/charge-types/${chargeId}`);
      applyUpdate(chargeTypes.filter((c) => c.id !== chargeId));
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't delete charge type.");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Charge types — {property.name}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <p className="modal-placeholder">
          These pre-fill each month's bill for tenants at this property. You
          can still adjust any amount when creating a specific month's bill.
        </p>

        {error && <div className="error-message">{error}</div>}

        <div className="charge-type-list">
          {chargeTypes.length === 0 && (
            <p className="modal-placeholder">No charge types yet — add one below.</p>
          )}

          {chargeTypes.map((charge) =>
            editingId === charge.id ? (
              <div className="charge-type-row" key={charge.id}>
                <input
                  className="charge-type-label-input"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                />
                <input
                  className="charge-type-amount-input"
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                />
                <button
                  type="button"
                  className="charge-type-save-btn"
                  onClick={() => handleSaveEdit(charge.id)}
                  disabled={saving}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="charge-type-cancel-btn"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="charge-type-row" key={charge.id}>
                <span className="charge-type-label">{charge.label}</span>
                <span className="charge-type-amount">₹{charge.defaultAmount}</span>
                <button
                  type="button"
                  className="charge-type-edit-btn"
                  onClick={() => startEdit(charge)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="charge-type-delete-btn"
                  onClick={() => handleDelete(charge.id)}
                >
                  Delete
                </button>
              </div>
            )
          )}
        </div>

        <form className="charge-type-add-form" onSubmit={handleAdd}>
          <input
            className="charge-type-label-input"
            placeholder="e.g. Rent"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <input
            className="charge-type-amount-input"
            type="number"
            placeholder="Amount"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
          />
          <button type="submit" disabled={saving}>
            + Add
          </button>
        </form>
      </div>
    </div>
  );
}
