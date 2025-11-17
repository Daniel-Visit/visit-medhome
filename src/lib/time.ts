export function getCheckinWindow(
  scheduledStart: Date,
  minutesBefore: number,
  minutesAfter: number
) {
  const startAllowed = new Date(scheduledStart);
  startAllowed.setMinutes(startAllowed.getMinutes() - minutesBefore);

  const endAllowed = new Date(scheduledStart);
  endAllowed.setMinutes(endAllowed.getMinutes() + minutesAfter);

  return { startAllowed, endAllowed };
}

