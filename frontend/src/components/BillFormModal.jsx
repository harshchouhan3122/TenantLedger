import { useState } from "react";
import apiClient from "../api/client";
import "./BillFormModal.css";

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function BillFormModal({ tenant, property, existingPayment, onClose, onSaved }) {
  const isEdit = !!existingPayment;

  const [month, setMonth] = useState(existingPayment?.month || currentMonthValue());

  // New bills pre-fill from the property's charge type template; editing an
  // existing bill starts from whatever was actually saved for that month.
  // Each row gets a stable `key` for React — separate from the label, since
  // the label itself is editable.
  const [charges, setCharges] = useState(
    existingPayment
      ? existingPayment.charges.map((c, i) => ({ ...c, key: `existing-${i}` }))
      : (property.chargeTypes || []).map((ct, i) => ({
          label: ct.label,
          amount: ct.defaultAmount,
          key: `template-${i}`,
        }))
  );

  const [dueAmount, setDueAmount] = useState(existingPayment?.due?.amount ?? 0);
  const [dueReason, setDueReason] = useState(existingPayment?.due?.reason || "");
  const [dueDate, setDueDate] = useState(existingPayment?.dueDate || "");
  const [remark, setRemark] = useState(existingPayment?.remark || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const total = charges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  function updateCharge(key, field, value) {
    setCharges((prev) => prev.map((c) => (c.key === key ? { ...c, [field]: value } : c)));
  }

  function removeCharge(key) {
    setCharges((prev) => prev.filter((c) => c.key !== key));
  }

  function addCharge() {
    setCharges((prev) => [...prev, { label: "", amount: 0, key: `new-${Date.now()}` }]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const cleanCharges = charges
      .filter((c) => c.label.trim())
      .map((c) => ({ label: c.label.trim(), amount: Number(c.amount) || 0 }));

    if (cleanCharges.length === 0) {
      setError("Add at least one charge.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        charges: cleanCharges,
        dueAmount: Number(dueAmount) || 0,
        dueReason: dueReason.trim(),
        dueDate,
        remark: remark.trim(),
      };

      let response;
      if (isEdit) {
        response = await apiClient.patch(`/payments/${existingPayment._id}`, payload);
      } else {
        response = await apiClient.post("/payments", {
          tenantId: tenant._id,
          month,
          ...payload,
        });
      }
      onSaved(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't save the bill. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? `Edit bill — ${existingPayment.month}` : "Add this month's bill"}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bill-form">
          {!isEdit && (
            <>
              <label htmlFor="billMonth">Month</label>
              <input
                id="billMonth"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
              />
            </>
          )}

          <label>Charges</label>
          <div className="charges-editor">
            {charges.map((c) => (
              <div className="charge-row" key={c.key}>
                <input
                  className="charge-label-input"
                  placeholder="Label"
                  value={c.label}
                  onChange={(e) => updateCharge(c.key, "label", e.target.value)}
                />
                <input
                  className="charge-amount-input"
                  type="number"
                  placeholder="Amount"
                  value={c.amount}
                  onChange={(e) => updateCharge(c.key, "amount", e.target.value)}
                />
                <button
                  type="button"
                  className="charge-remove-btn"
                  onClick={() => removeCharge(c.key)}
                  title="Remove this charge"
                >
                  🗑
                </button>
              </div>
            ))}
            <button type="button" className="add-charge-btn" onClick={addCharge}>
              + Add another charge
            </button>
          </div>

          <div className="bill-total">Total: ₹{total}</div>

          <label htmlFor="dueAmount">Due amount (if any)</label>
          <input
            id="dueAmount"
            type="number"
            value={dueAmount}
            onChange={(e) => setDueAmount(e.target.value)}
          />

          <label htmlFor="dueReason">Due reason</label>
          <input
            id="dueReason"
            type="text"
            placeholder="Optional"
            value={dueReason}
            onChange={(e) => setDueReason(e.target.value)}
          />

          <label htmlFor="dueDate">Due date</label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <label htmlFor="remark">Remark</label>
          <input
            id="remark"
            type="text"
            placeholder="Optional"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />

          {error && <div className="error-message">{error}</div>}

          <div className="bill-form-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save bill"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
