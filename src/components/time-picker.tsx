import React, { useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ScrollView,
  Text,
  I18nManager,
} from 'react-native';
import { useCalendarContext } from '../calendar-context';
import Wheel from './time-picker/wheel';
import { CONTAINER_HEIGHT } from '../enums';
import { getParsedDate, formatNumber } from '../utils';
import { Numerals, PickerOption } from '../types';
import { zoned } from '../utils';
import PeriodPicker from './time-picker/period-picker';

export type Period = 'AM' | 'PM';

const createNumberList = (
  total: number,
  numerals: Numerals,
  startFrom: number = 0,
  step: number = 1
): PickerOption[] => {
  const count = Math.ceil((total - startFrom) / step);
  return Array.from({ length: count }, (_, i) => {
    const value = startFrom + i * step;
    const text =
      value < 10
        ? `${formatNumber(0, numerals)}${formatNumber(value, numerals)}`
        : formatNumber(value, numerals);
    return { value, text };
  });
};

const TimePicker = () => {
  const {
    currentDate,
    date,
    onSelectDate,
    styles,
    classNames,
    timeZone,
    numerals = 'latn',
    use12Hours,
    minuteInterval = 1,
    minDate,
  } = useCalendarContext();

  const hours = useMemo(
    () => createNumberList(use12Hours ? 12 : 24, numerals, use12Hours ? 1 : 0),
    [numerals, use12Hours]
  );

  const minutes = useMemo(
    () => createNumberList(60, numerals, 0, minuteInterval),
    [numerals, minuteInterval]
  );

  const { hour, hour12, minute, period } = getParsedDate(date || currentDate);

  // Filter hours and minutes based on minDate
  const { filteredHours, filteredMinutes } = useMemo(() => {
    if (!minDate) {
      return { filteredHours: hours, filteredMinutes: minutes };
    }

    const minDateTime = zoned(minDate);
    const currentDateTime = zoned(date || currentDate);

    // Check if we're on the same day as minDate
    const isSameDay = currentDateTime.isSame(minDateTime, 'day');

    if (!isSameDay) {
      // Different day - no restrictions
      return { filteredHours: hours, filteredMinutes: minutes };
    }

    // Same day - filter hours and minutes
    const minHour = minDateTime.hour();
    const minMinute = minDateTime.minute();

    // Round up minMinute to next valid interval
    const roundedMinMinute =
      Math.ceil(minMinute / minuteInterval) * minuteInterval;

    let filteredHours = hours;
    let filteredMinutes = minutes;

    if (use12Hours) {
      // Convert 24h minHour to 12h format
      const minHour12 =
        minHour === 0 ? 12 : minHour > 12 ? minHour - 12 : minHour;
      const minPeriod = minHour < 12 ? 'AM' : 'PM';

      // Only filter if we're in the same period
      if (period === minPeriod) {
        // First, filter hours >= minHour
        filteredHours = hours.filter((h) => Number(h.value) >= minHour12);

        // Remove the min hour if it has no valid minutes remaining
        if (roundedMinMinute >= 60) {
          // All minutes are past, remove this hour
          filteredHours = filteredHours.filter(
            (h) => Number(h.value) !== minHour12
          );
        }

        // Filter minutes based on selected hour
        if (hour12 === minHour12) {
          filteredMinutes = minutes.filter(
            (m) => Number(m.value) >= roundedMinMinute
          );
        }
      } else if (period === 'AM' && minPeriod === 'PM') {
        // Can't select AM if minDate is PM on same day
        filteredHours = [];
        filteredMinutes = [];
      }
    } else {
      // 24-hour format
      // First, filter hours >= minHour
      filteredHours = hours.filter((h) => Number(h.value) >= minHour);

      // Remove the min hour if it has no valid minutes remaining
      if (roundedMinMinute >= 60) {
        // All minutes are past, remove this hour
        filteredHours = filteredHours.filter(
          (h) => Number(h.value) !== minHour
        );
      }

      // Filter minutes based on selected hour
      if (hour === minHour) {
        filteredMinutes = minutes.filter(
          (m) => Number(m.value) >= roundedMinMinute
        );
      }
    }

    return { filteredHours, filteredMinutes };
  }, [
    minDate,
    date,
    currentDate,
    hours,
    minutes,
    hour,
    hour12,
    period,
    use12Hours,
    minuteInterval,
  ]);

  // Select the nearest minute tick (ensures 00 is recognized)
  const selectedMinute = useMemo(() => {
    // Ensure minute is a number
    const currentMinute =
      typeof minute === 'number' ? minute : parseInt(`${minute}`, 10);

    // Find the closest available minute option
    if (filteredMinutes.length === 0) return 0;

    const firstValue = filteredMinutes[0]?.value;
    if (firstValue === undefined) return 0;

    let closest = Number(firstValue);
    let bestDiff = Math.abs(closest - currentMinute);

    for (const m of filteredMinutes) {
      const diff = Math.abs(Number(m.value) - currentMinute);
      if (diff < bestDiff) {
        bestDiff = diff;
        closest = Number(m.value);
      }
    }

    return closest;
  }, [filteredMinutes, minute]);

  // Auto-adjust time if current selection becomes invalid due to minDate filtering
  useEffect(() => {
    if (!minDate) return;

    const currentHourValue = use12Hours ? hour12 : hour;
    const hourExists = filteredHours.some(
      (h) => Number(h.value) === currentHourValue
    );
    const minuteExists = filteredMinutes.some(
      (m) => Number(m.value) === selectedMinute
    );

    // If current hour is not in filtered list, select first available hour
    if (!hourExists && filteredHours.length > 0) {
      const firstHour = filteredHours[0];
      if (!firstHour) return;

      const firstAvailableHour = Number(firstHour.value);
      let hour24 = firstAvailableHour;

      if (use12Hours && period === 'PM' && firstAvailableHour < 12) {
        hour24 = firstAvailableHour + 12;
      }

      const newDate = zoned(date).hour(hour24);
      onSelectDate(newDate);
      return;
    }

    // If current minute is not in filtered list, select first available minute
    if (!minuteExists && filteredMinutes.length > 0) {
      const firstMinute = filteredMinutes[0];
      if (!firstMinute) return;

      const firstAvailableMinute = Number(firstMinute.value);
      const newDate = zoned(date).minute(firstAvailableMinute);
      onSelectDate(newDate);
    }
  }, [
    minDate,
    filteredHours,
    filteredMinutes,
    hour,
    hour12,
    selectedMinute,
    use12Hours,
    period,
    date,
    timeZone,
    onSelectDate,
  ]);

  const handleChangeHour = useCallback(
    (value: number) => {
      let hour24 = value;

      if (use12Hours) {
        if (period === 'PM' && value < 12) {
          hour24 = value + 12;
        } else if (period === 'PM' && value === 12) {
          hour24 = 0;
        }
      }
      const newDate = zoned(date).hour(hour24).minute(minute);
      onSelectDate(newDate);
    },
    [date, onSelectDate, timeZone, use12Hours, period, minute]
  );

  const handleChangeMinute = useCallback(
    (value: number) => {
      const newDate = zoned(date).minute(value);
      onSelectDate(newDate);
    },
    [date, onSelectDate, timeZone]
  );

  const handlePeriodChange = useCallback(
    (newPeriod: Period) => {
      let newHour = hour12;
      if (newPeriod === 'PM' && hour12 < 12) {
        newHour = hour12 + 12;
      } else if (newPeriod === 'AM' && hour12 === 12) {
        newHour = 0;
      } else if (newPeriod === 'AM' && hour >= 12) {
        newHour = hour12;
      }

      const newDate = zoned(date || currentDate).hour(newHour);
      onSelectDate(newDate);
    },
    [date, currentDate, onSelectDate, timeZone, hour, hour12]
  );

  const timePickerContainerStyle: ViewStyle = useMemo(
    () => ({
      ...defaultStyles.timePickerContainer,
      flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    }),
    [I18nManager.isRTL]
  );

  const timePickerTextStyle: TextStyle = useMemo(
    () => ({ ...defaultStyles.timeSeparator, ...styles?.time_label }),
    [styles?.time_label]
  );

  return (
    <ScrollView
      horizontal={true}
      scrollEnabled={false}
      contentContainerStyle={defaultStyles.container}
      testID="time-selector"
    >
      <View style={timePickerContainerStyle}>
        <View style={defaultStyles.wheelContainer}>
          <Wheel
            value={use12Hours ? hour12 : hour}
            items={filteredHours}
            setValue={handleChangeHour}
            styles={styles}
            classNames={classNames}
          />
        </View>
        <Text style={timePickerTextStyle} className={classNames?.time_label}>
          :
        </Text>
        <View style={defaultStyles.wheelContainer}>
          <Wheel
            value={selectedMinute}
            items={filteredMinutes}
            setValue={(value: number) => {
              handleChangeMinute(value);
            }}
            styles={styles}
            classNames={classNames}
          />
        </View>
      </View>
      {use12Hours && period ? (
        <View style={defaultStyles.periodContainer}>
          <PeriodPicker
            value={period}
            setValue={handlePeriodChange}
            styles={styles}
            classNames={classNames}
          />
        </View>
      ) : null}
    </ScrollView>
  );
};

const defaultStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelContainer: {
    flex: 1,
  },
  timePickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: CONTAINER_HEIGHT / 2,
    height: CONTAINER_HEIGHT / 2,
  },
  timeSeparator: {
    marginHorizontal: 5,
  },
  periodContainer: {
    marginLeft: 10,
  },
});

export default TimePicker;
