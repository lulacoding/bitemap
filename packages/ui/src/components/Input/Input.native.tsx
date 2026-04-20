import { Text, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../../tokens';

export interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helper?: string;
  placeholder?: string;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export function Input({
  label,
  value,
  onChange,
  error,
  helper,
  placeholder,
  multiline = false,
  autoCapitalize,
}: InputProps) {
  const borderColor = error ? colors.danger : '#D1D5DB';
  return (
    <View style={{ flexDirection: 'column', gap: spacing[1] }}>
      <Text style={{ fontWeight: '500', fontSize: 14, color: colors.textOnLight }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        style={{
          minHeight: multiline ? 96 : 44,
          paddingHorizontal: spacing[3],
          paddingVertical: multiline ? spacing[2] : 0,
          borderRadius: radius.card,
          borderColor,
          borderWidth: 1,
          fontSize: 16,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
      {error ? (
        <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>
      ) : helper ? (
        <Text style={{ color: '#6B7280', fontSize: 13 }}>{helper}</Text>
      ) : null}
    </View>
  );
}
