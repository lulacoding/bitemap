import { Pressable, Text, View } from 'react-native';
import { colors, spacing } from '../../tokens';

export interface TabItem {
  key: string;
  label: string;
  icon?: string;
}

export interface TabBarProps {
  tabs: readonly TabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  onReportPress?: () => void;
  reportIndex?: number;
}

export function TabBar({
  tabs,
  activeKey,
  onSelect,
  onReportPress,
  reportIndex = 2,
}: TabBarProps) {
  return (
    <View
      accessibilityLabel="Primary navigation"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
      }}
    >
      {tabs.map((tab, i) => {
        if (i === reportIndex && onReportPress) {
          return (
            <Pressable
              key="__report__"
              accessibilityLabel="Report a catch"
              accessibilityRole="button"
              onPress={onReportPress}
              style={{
                width: 56,
                height: 56,
                marginTop: -24,
                borderRadius: 9999,
                backgroundColor: colors.tertiary,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '600' }}>+</Text>
            </Pressable>
          );
        }
        const active = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            accessibilityState={{ selected: active }}
            style={{
              alignItems: 'center',
              paddingHorizontal: spacing[2],
            }}
          >
            {tab.icon ? (
              <Text style={{ fontSize: 18 }}>{tab.icon}</Text>
            ) : null}
            <Text
              style={{
                fontSize: 11,
                color: active ? colors.primary : '#6B7280',
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
