import { useState } from "react";
import {
  buildReminderMessage,
  buildWhatsAppLink,
  paymentTotal,
} from "../utils/messageTemplate";
import "./SendReminderConfirmModal.css";
import "./UniversalReminderModal.css";

export default function UniversalReminderModal({
  reminders,
  onClose,
}) {
  const [selectedIds, setSelectedIds] = useState(
    new Set(reminders.map((r) => r.payment._id))
  );

  function toggleSelection(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

//   function handleSend() {
//     reminders
//       .filter((item) => selectedIds.has(item.payment._id))
//       .forEach((item) => {
//         const message = buildReminderMessage(
//           item.tenant,
//           item.payment,
//           "reminder"
//         );

//         const link = buildWhatsAppLink(
//           item.tenant.phone,
//           message
//         );

//         window.open(link, "_blank");
//       });

//     onClose();
//   }

    const [currentIndex, setCurrentIndex] = useState(0);


    const selectedReminders = reminders.filter((item) =>
      selectedIds.has(item.payment._id)
    );

    const [completed, setCompleted] = useState(false);

    function handleSend() {
      if (!selectedReminders.length) {
        alert("Please select at least one tenant.");
        return;
      }

      const current = selectedReminders[currentIndex];

      const message = buildReminderMessage(
        current.tenant,
        current.payment,
        "reminder"
      );

      const link = buildWhatsAppLink(
        current.tenant.phone,
        message
      );

      window.open(link, "_blank");

      setCurrentIndex((prev) => prev + 1);

      if (currentIndex + 1 === selectedReminders.length) {
        // onClose();
        setCompleted(true);
        return;
      }

    }


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header" >
          <h2>Pending Payment</h2>

          <button
            className="modal-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* <p>
          {selectedIds.size} of {reminders.length} selected
        </p> */}

        <div className="universal-reminder-list">

        <hr />

        {reminders.map((item) => (

            <div
              key={item.payment._id}
              className="universal-reminder-row"
            >

            <input
              type="checkbox"
              className="universal-reminder-checkbox"
              checked={selectedIds.has(item.payment._id)}
              onChange={() => toggleSelection(item.payment._id)}
            />

            {/* 📱  */}{/* 📅  */}{/* 🏠 */}{/* 💰  */}
            <div className="universal-reminder-details">
              <div className="universal-reminder-name">
                {item.tenant.name}
              </div>

              <div className="universal-reminder-info">
                {item.property?.name || "Unknown Property"} • {item.payment.month}
              </div>

              <div className="universal-reminder-info">
                {item.tenant.phone}
              </div>

              <div className="universal-reminder-amount">
                ₹{paymentTotal(item.payment)}
              </div>
            </div>



            </div>

        ))}


        </div>


            <p className="universal-reminder-progress">
              {selectedIds.size} selected

              {selectedIds.size > 0 &&
                ` • Sent: ${currentIndex } / ${selectedReminders.length}`}
            </p>

            {completed && (
              <div className="universal-reminder-success">
                ✅ All selected reminders processed.
              </div>
            )}

            <div className="reminder-actions">
              <button
                className="secondary-btn"
                onClick={onClose}
              >
                {completed ? "Close" : "Cancel"}
              </button>

              {!completed && (
                <button
                  className="whatsapp-send-btn"
                  onClick={handleSend}
                  disabled={selectedIds.size === 0}
                >
                  {currentIndex === 0
                    ? "Send Selected"
                    : `Send Next (${currentIndex + 1}/${selectedReminders.length})`}
                </button>
              )}
            </div>

      </div>
    </div>
  );
}