import { addItemsToPhoneCalendar } from '../src/services/calendarService';

describe('Calendar Service Tests', () => {
  it('adds items with valid due dates to phone calendar', async () => {
    const items = [
      { title: 'Order Yearbook', due_date: '2026-05-15', source_snippet: 'Order online' },
      { title: 'Field Trip Slip', due_date: '2026-05-10', source_snippet: 'Return slip' },
    ];

    const count = await addItemsToPhoneCalendar(items);
    expect(count).toBe(2);
  });

  it('skips items without valid due dates safely', async () => {
    const items = [
      { title: 'No Date Item', due_date: null },
    ];

    const count = await addItemsToPhoneCalendar(items);
    expect(count).toBe(0);
  });
});