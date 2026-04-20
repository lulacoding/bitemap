import { Pressable, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../tokens';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="radiogroup"
      style={{
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: radius.pill,
        padding: 4,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.value)}
            style={{
              paddingHorizontal: spacing[4],
              paddingVertical: 6,
              borderRadius: radius.pill,
              backgroundColor: active ? '#FFFFFF' : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: active ? colors.primary : '#4B5563',
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
