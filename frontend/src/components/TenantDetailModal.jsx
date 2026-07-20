import { useState, useEffect, useCallback } from "react";
import apiClient from "../api/client";
import BillFormModal from "./BillFormModal";
import SendReminderConfirmModal from "./SendReminderConfirmModal";
import { paymentTotal } from "../utils/messageTemplate";
import "./TenantDetailModal.css";

export default function TenantDetailModal({ tenant, property, onClose, onDocumentsUpdated }) {
  const [driveLink, setDriveLink] = useState(tenant?.documents?.driveFolderLink || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState(null);

  // null | "new" | the payment object being edited
  const [billFormFor, setBillFormFor] = useState(null);
  // null | the just-saved payment, to trigger the reminder prompt
  const [reminderConfirmFor, setReminderConfirmFor] = useState(null);

  const loadPayments = useCallback(async () => {
    if (!tenant) return;
    setPaymentsLoading(true);
    setPaymentsError(null);
    try {
      const response = await apiClient.get(`/payments/tenant/${tenant._id}`);
      setPayments(response.data);
    } catch (err) {
      setPaymentsError("Couldn't load payment history.");
    } finally {
      setPaymentsLoading(false);
    }
  }, [tenant]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

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

  async function handleDeletePayment(payment) {
    const confirmed = window.confirm(`Delete the ${payment.month} bill? This can't be undone.`);
    if (!confirmed) return;
    try {
      await apiClient.delete(`/payments/${payment._id}`);
      await loadPayments();
    } catch (err) {
      setPaymentsError(err.response?.data?.error || "Couldn't delete this bill.");
    }
  }

  async function handleMarkPaid(payment) {
    const paidThrough = window.prompt(
      "How was this paid? (e.g. Cash, UPI, Bank Transfer)",
      "UPI"
    );
    if (paidThrough === null) return; // cancelled
    try {
      await apiClient.patch(`/payments/${payment._id}/mark-paid`, { paidThrough });
      await loadPayments();
    } catch (err) {
      setPaymentsError(err.response?.data?.error || "Couldn't mark this as paid.");
    }
  }

  async function handleUnmarkPaid(payment) {
    const confirmed = window.confirm(
      "Unmark this bill as paid? You'll be able to edit it again afterward."
    );
    if (!confirmed) return;
    try {
      await apiClient.patch(`/payments/${payment._id}/unmark-paid`);
      await loadPayments();
    } catch (err) {
      setPaymentsError(err.response?.data?.error || "Couldn't unmark this bill.");
    }
  }

  function handleBillSaved(savedPayment) {
    setBillFormFor(null);
    loadPayments();
    // Per the agreed flow: prompt to send a reminder both on create AND
    // on editing an existing pending bill.
    setReminderConfirmFor(savedPayment);
  }

  return (
    <>
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
            <div className="payment-history-header">
              <h3>Payment history</h3>
              {tenant.active && (
                <button className="add-bill-btn" onClick={() => setBillFormFor("new")}>
                  + Add this month's bill
                </button>
              )}
            </div>

            {paymentsLoading && <p className="modal-placeholder">Loading…</p>}
            {paymentsError && <div className="error-message">{paymentsError}</div>}
            {!paymentsLoading && payments.length === 0 && (
              <p className="modal-placeholder">No bills recorded yet.</p>
            )}

            <div className="payment-list">
              {payments.map((payment) => (
                <div className="payment-card" key={payment._id}>
                  <div className="payment-card-top">
                    <span className="payment-month">{payment.month}</span>
                    <span
                      className={
                        payment.status === "paid"
                          ? "badge badge-occupied"
                          : "badge badge-vacant"
                      }
                    >
                      {payment.status === "paid" ? "Paid" : "Pending"}
                    </span>
                  </div>

                  <div className="payment-charges-summary">
                    {payment.charges.map((c) => `${c.label} ₹${c.amount}`).join(" + ")}
                    {" = Total ₹"}
                    {paymentTotal(payment)}
                  </div>

                  {payment.due?.amount > 0 && (
                    <div className="payment-due-line">
                      Due: ₹{payment.due.amount}
                      {payment.due.reason ? ` (${payment.due.reason})` : ""}
                    </div>
                  )}

                  {payment.status === "paid" && (
                    <div className="payment-paid-line">
                      Paid on {payment.paidDate?.split("T")[0]} via {payment.paidThrough}
                    </div>
                  )}

                  <div className="payment-actions">
                    {payment.status === "pending" ? (
                      <>
                        <button onClick={() => setBillFormFor(payment)}>Edit</button>
                        <button onClick={() => handleDeletePayment(payment)}>Delete</button>
                        <button
                          className="mark-paid-btn"
                          onClick={() => handleMarkPaid(payment)}
                        >
                          Mark as paid
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleUnmarkPaid(payment)}>Unmark as paid</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rendered as siblings of the overlay above, not nested inside it —
          otherwise clicking their own backdrop would bubble up and close
          this whole tenant popup too. */}
      {billFormFor && (
        <BillFormModal
          tenant={tenant}
          property={property}
          existingPayment={billFormFor === "new" ? null : billFormFor}
          onClose={() => setBillFormFor(null)}
          onSaved={handleBillSaved}
        />
      )}

      {reminderConfirmFor && (
        <SendReminderConfirmModal
          tenant={tenant}
          payment={reminderConfirmFor}
          onClose={() => setReminderConfirmFor(null)}
        />
      )}
    </>
  );
}
