import React from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { zoned } from '../../utils';
import { useCalendarContext } from '../../calendar-context';
import { COLORS } from '../../theme';

export default function ViewToggle() {
  const {
    date,
    timePicker,
    use12Hours,
    setCalendarView,
    calendarView,
    toggleHeaderLabel,
    styles: customStyles = {},
    classNames = {},
  } = useCalendarContext();

  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = COLORS[scheme];

  return (
    <View
      style={[
        styles.container,
        { borderBottomWidth: 1, borderBottomColor: themeColors.border },
      ]}
    >
      {toggleHeaderLabel && (
        <Text
          style={[
            styles.label,
            { color: themeColors.foreground },
            customStyles.toggle_header_label,
          ]}
          className={classNames.toggle_header_label}
        >
          {toggleHeaderLabel}
        </Text>
      )}

      <View style={styles.buttonGroup}>
        <Pressable
          onPress={() => setCalendarView('day')}
          style={[
            styles.button,
            {
              backgroundColor:
                calendarView === 'day'
                  ? themeColors.primary
                  : themeColors.accent,
            },
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color:
                  calendarView === 'day'
                    ? themeColors.primaryForeground
                    : themeColors.accentForeground,
              },
            ]}
          >
            {zoned(date).format('YYYY-MM-DD')}
          </Text>
        </Pressable>

        {timePicker && (
          <Pressable
            onPress={() => setCalendarView('time')}
            style={[
              styles.button,
              {
                backgroundColor:
                  calendarView === 'time'
                    ? themeColors.primary
                    : themeColors.accent,
              },
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color:
                    calendarView === 'time'
                      ? themeColors.primaryForeground
                      : themeColors.accentForeground,
                },
              ]}
            >
              {zoned(date).format(use12Hours ? 'hh:mm A' : 'HH:mm')}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between', // label left, buttonGroup right
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row', // date and time side by side
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8, // space between date & time buttons
  },
  buttonText: {
    fontSize: 14,
  },
});
