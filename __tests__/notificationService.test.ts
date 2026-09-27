import { calculateNotificationTriggerDate } from '../src/services/notificationService';

describe('Notification Date & Time Mathematical Calculations', () => {
  test('calculates exact 19:00 night-before trigger date correctly', () => {
    // Due date: Oct 24, 2026
    const dueAt = '2026-10-24T00:00:00.000Z';
    const now = new Date(2026, 9, 20, 10, 0, 0); // Oct 20, 2026
    const trigger = calculateNotificationTriggerDate(dueAt, '19:00_nightbefore', now);

    // Expected: Oct 23, 2026 at 19:00:00
    expect(trigger.getFullYear()).toBe(2026);
    expect(trigger.getMonth()).toBe(9); // 0-indexed October
    expect(trigger.getDate()).toBe(23); // Night before Oct 24
    expect(trigger.getHours()).toBe(19);
    expect(trigger.getMinutes()).toBe(0);
  });

  test('calculates exact same-day 08:00 trigger date correctly', () => {
    // Due date: Oct 24, 2026
    const dueAt = '2026-10-24T00:00:00.000Z';
    const now = new Date(2026, 9, 20, 10, 0, 0);
    const trigger = calculateNotificationTriggerDate(dueAt, '08:00_sameday', now);

    // Expected: Oct 24, 2026 at 08:00:00
    expect(trigger.getFullYear()).toBe(2026);
    expect(trigger.getMonth()).toBe(9);
    expect(trigger.getDate()).toBe(24);
    expect(trigger.getHours()).toBe(8);
    expect(trigger.getMinutes()).toBe(0);
  });

  test('handles null due date by defaulting to next day at 19:00 if past time', () => {
    const now = new Date(2026, 9, 20, 20, 0, 0); // 8:00 PM today
    const trigger = calculateNotificationTriggerDate(null, '19:00_sameday', now);

    // Past 19:00 today, so trigger is tomorrow Oct 21 at 19:00
    expect(trigger.getDate()).toBe(21);
    expect(trigger.getHours()).toBe(19);
  });
});
