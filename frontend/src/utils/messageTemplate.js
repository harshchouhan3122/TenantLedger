export function paymentTotal(payment) {
  return payment.charges.reduce((sum, c) => sum + Number(c.amount), 0);
}

export function buildReminderMessage(tenant, payment) {
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

  return (
    `Hi ${tenant.name},\n` +
    `Your rent details for ${payment.month}:\n` +
    `${chargeLines}\n` +
    `Total: ₹${total}` +
    dueLine +
    remarkLine +
    `\n\nPlease clear the payment at your earliest convenience.`
  );
}

export function buildWhatsAppLink(phone, message) {
  // wa.me expects digits only, no "+" or spaces/dashes.
  const cleanPhone = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
