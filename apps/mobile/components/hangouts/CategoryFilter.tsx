import React from 'react'
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { HANGOUT_CATEGORIES } from '@hapien/shared/constants'

interface CategoryFilterProps {
  selected: string | null
  onSelect: (category: string | null) => void
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity
        style={[styles.chip, !selected && styles.chipActive]}
        onPress={() => onSelect(null)}
      >
        <Text style={[styles.chipText, !selected && styles.chipTextActive]}>
          All
        </Text>
      </TouchableOpacity>

      {HANGOUT_CATEGORIES.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[styles.chip, selected === category.id && styles.chipActive]}
          onPress={() => onSelect(category.id)}
        >
          <Text style={styles.emoji}>{category.emoji}</Text>
          <Text
            style={[
              styles.chipText,
              selected === category.id && styles.chipTextActive,
            ]}
          >
            {category.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  content: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#7C3AED',
  },
  emoji: {
    fontSize: 14,
    marginRight: 4,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
})
