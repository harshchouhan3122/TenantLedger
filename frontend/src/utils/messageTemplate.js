export function paymentTotal(payment) {
  return payment.charges.reduce((sum, c) => sum + Number(c.amount), 0);
}

const INTRO_LINES = {
  new: (month) => `Your rent details for ${month}:`,
  updated: (month) => `Updated bill details for ${month}:`,
  reminder: (month) => `Reminder — your rent details for ${month} are still pending:`,
};

export function buildReminderMessage(tenant, payment, variant = "new") {
  const total = paymentTotal(payment);
  const chargeLines = payment.charges
    .map((c) => `- ${c.label}: ₹${c.amount}`)
    .join("\n");

  const dueAmount = Number(payment.due?.amount || 0);
  // Skip the due line entirely when there's no due, rather than showing ₹0.
  const dueLine =
    dueAmount > 0
      ? `\n\nDue: ₹${dueAmount}${payment.due?.reason ? ` (${payment.due.reason})` : ""}`
      : "";

  const remarkLine = payment.remark ? `\nRemark: ${payment.remark}` : "";
  const introLine = (INTRO_LINES[variant] || INTRO_LINES.new)(payment.month);

  return (
    `Hi ${tenant.name},\n` +
    `${introLine}\n` +
    `${chargeLines}\n` +
    `Total: ₹${total}` +
    dueLine +
    remarkLine +
    `\n\nPlease clear the payment at your earliest convenience.`
  );
}

export function buildWhatsAppLink(phone, message) {
  // wa.me needs digits only, WITH country code, no "+", no spaces/dashes.
  let digitsOnly = (phone || "").replace(/\D/g, "");

  // If it looks like a bare 10-digit Indian number (no country code was
  // ever entered), assume +91 — otherwise wa.me can't route the message
  // correctly even though the link looks "valid".
  if (digitsOnly.length === 10) {
    digitsOnly = "91" + digitsOnly;
  }

  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

export function phoneLooksIncomplete(phone) {
  const digitsOnly = (phone || "").replace(/\D/g, "");
  return digitsOnly.length < 10;
}
