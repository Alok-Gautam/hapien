import React, { ReactNode } from 'react'
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native'

interface CardProps {
  children: ReactNode
  style?: ViewStyle
  onPress?: () => void
  variant?: 'default' | 'elevated'
}

export function Card({ children, style, onPress, variant = 'default' }: CardProps) {
  const cardStyles = [
    styles.base,
    variant === 'elevated' && styles.elevated,
    style,
  ]

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyles} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    )
  }

  return <View style={cardStyles}>{children}</View>
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
})
