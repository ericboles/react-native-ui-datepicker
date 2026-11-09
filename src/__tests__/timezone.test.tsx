import React from 'react';
import { render, screen } from '@testing-library/react-native';
import DateTimePicker from '../datetime-picker';
import { getParsedDate, setActiveTimeZone, zoned } from '../utils';
import 'dayjs/locale/en';

// Run with the device in a zone that skips an hour, e.g.
//   TZ=Europe/London npx jest timezone
// London skips 01:00-02:00 on Mar 28 2027, so a 01:30 shown in the device's
// zone would read 02:30. With timeZone set, dates must read in that zone.
const GAP = new Date(Date.UTC(2027, 2, 28, 1, 30)); // 01:30 UTC

afterEach(() => setActiveTimeZone(undefined));

describe('timeZone prop', () => {
  test('header shows the date and time in the picker zone', () => {
    render(
      <DateTimePicker
        mode="single"
        date={GAP}
        timePicker
        timeZone="UTC"
        showViewToggleHeader
        toggleHeaderLabel="Starts"
        onChange={() => {}}
      />
    );
    expect(screen.getByText('2027-03-28')).toBeVisible();
    expect(screen.getByText('01:30')).toBeVisible();
  });

  test('time fields read in the picker zone', () => {
    setActiveTimeZone('UTC');
    expect(getParsedDate(GAP)).toMatchObject({
      year: 2027,
      month: 2,
      hour: 1,
      hour12: 1,
      minute: 30,
      period: 'AM',
    });
    // Setting the hour in UTC keeps the instant exact
    expect(zoned(GAP).hour(2).minute(15).toDate().toISOString()).toBe(
      '2027-03-28T02:15:00.000Z'
    );
  });

  test('without a timeZone, dates read in the device zone as before', () => {
    const local = new Date(2024, 2, 19, 9, 45);
    expect(getParsedDate(local)).toMatchObject({ hour: 9, minute: 45 });
  });
});
