/** Shared date formatting so tables and dialogs read the same way. */

const DATE_PARTS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

const TIME_PARTS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "short",
};

/** e.g. "25 Aug 2026, 21:05 IST" — local timezone of the viewer. */
export function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", { ...DATE_PARTS, ...TIME_PARTS });
}

/** e.g. "25 Aug 2026" */
export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", DATE_PARTS);
}

/** e.g. "21:05" */
export function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-GB", TIME_PARTS);
}
