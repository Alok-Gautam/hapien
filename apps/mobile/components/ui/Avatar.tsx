import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { getInitials } from '@hapien/shared/utils'

interface AvatarProps {
  uri?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const SIZES = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
}

const FONT_SIZES = {
  sm: 12,
  md: 14,
  lg: 20,
  xl: 28,
}

export function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const dimension = SIZES[size]
  const fontSize = FONT_SIZES[size]
  const initials = getInitials(name)

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { width: dimension, height: dimension, borderRadius: dimension / 2 },
        ]}
      />
    )
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#E5E7EB',
  },
  fallback: {
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
})
