import {
  buildReminderMessage,
  buildWhatsAppLink,
  paymentTotal,
  phoneLooksIncomplete,
} from "../utils/messageTemplate";
import "./SendReminderConfirmModal.css";

const TITLES = {
  new: "Bill saved",
  updated: "Bill updated",
  reminder: "Send reminder",
};

export default function SendReminderConfirmModal({ tenant, payment, variant = "new", onClose }) {
  const total = paymentTotal(payment);
  const chargesSummary = payment.charges.map((c) => `${c.label} ₹${c.amount}`).join(" + ");

  const message = buildReminderMessage(tenant, payment, variant);
  const link = buildWhatsAppLink(tenant.phone, message);
  const incompletePhone = phoneLooksIncomplete(tenant.phone);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{TITLES[variant] || TITLES.new}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <p className="reminder-summary">
          <strong>{tenant.name}</strong> — {payment.month}
          <br />
          Total: ₹{total} ({chargesSummary})
        </p>

        <p className="reminder-question">Send WhatsApp reminder to {tenant.name} now?</p>

        {incompletePhone && (
          <div className="error-message">
            This tenant's phone number ({tenant.phone || "empty"}) looks incomplete —
            the WhatsApp link below may not open the right chat. You can still try it,
            or fix their number first via "Edit tenant" in the popup.
          </div>
        )}

        <div className="reminder-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Not now
          </button>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-send-btn"
            onClick={onClose}
          >
            Send WhatsApp reminder
          </a>
        </div>
      </div>
    </div>
  );
}
