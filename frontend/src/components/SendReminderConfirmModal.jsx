import { buildReminderMessage, buildWhatsAppLink, paymentTotal } from "../utils/messageTemplate";
import "./SendReminderConfirmModal.css";

export default function SendReminderConfirmModal({ tenant, payment, onClose }) {
  const total = paymentTotal(payment);
  const chargesSummary = payment.charges.map((c) => `${c.label} ₹${c.amount}`).join(" + ");

  function handleSend() {
    const message = buildReminderMessage(tenant, payment);
    const link = buildWhatsAppLink(tenant.phone, message);
    window.open(link, "_blank");
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Bill saved</h2>
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

        <div className="reminder-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Not now
          </button>
          <button type="button" className="whatsapp-send-btn" onClick={handleSend}>
            Send WhatsApp reminder
          </button>
        </div>
      </div>
    </div>
  );
}
