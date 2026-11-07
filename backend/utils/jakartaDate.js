
const TIMEZONE = "Asia/Jakarta";

const getJakartaDateString = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const getJakartaDayRange = (
  dateString = getJakartaDateString(),
) => {
  const startOfDay = new Date(
    `${dateString}T00:00:00+07:00`,
  );

  const endOfDay = new Date(
    startOfDay.getTime() + 24 * 60 * 60 * 1000,
  );

  return { startOfDay, endOfDay };
};

const getJakartaDateTime = (dateString, timeString) => {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateString) ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(timeString)
  ) {
    throw new Error("Format tanggal atau waktu tidak valid");
  }

  const date = new Date(
    `${dateString}T${timeString}:00+07:00`,
  );

  if (
    Number.isNaN(date.getTime()) ||
    getJakartaDateString(date) !== dateString
  ) {
    throw new Error("Tanggal tidak valid");
  }

  return date;
};

const getJakartaTimeString = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.hour}:${values.minute}`;
};

module.exports = {
  getJakartaDateString,
  getJakartaTimeString,
  getJakartaDayRange,
  getJakartaDateTime,
};
