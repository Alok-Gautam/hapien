import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface BadgeProps {
  label: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md'
}

export function Badge({ label, variant = 'default', size = 'md' }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], styles[`${size}Badge`]]}>
      <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  default: {
    backgroundColor: '#F3F4F6',
  },
  primary: {
    backgroundColor: '#EDE9FE',
  },
  success: {
    backgroundColor: '#D1FAE5',
  },
  warning: {
    backgroundColor: '#FEF3C7',
  },
  error: {
    backgroundColor: '#FEE2E2',
  },
  smBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  mdBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  text: {
    fontWeight: '500',
  },
  defaultText: {
    color: '#6B7280',
  },
  primaryText: {
    color: '#7C3AED',
  },
  successText: {
    color: '#059669',
  },
  warningText: {
    color: '#D97706',
  },
  errorText: {
    color: '#DC2626',
  },
  smText: {
    fontSize: 12,
  },
  mdText: {
    fontSize: 14,
  },
})
