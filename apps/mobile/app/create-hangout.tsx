import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../contexts/AuthContext'
import { Button, Card } from '../components/ui'
import { HANGOUT_CATEGORIES } from '@hapien/shared/constants'

export default function CreateHangoutScreen() {
  const { user } = useAuthContext()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('')
  const [dateTime, setDateTime] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000))
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!user) return

    if (!title.trim()) {
      Alert.alert('Error', 'Title is required')
      return
    }

    if (!category) {
      Alert.alert('Error', 'Please select a category')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('hangouts').insert({
        title: title.trim(),
        description: description.trim() || null,
        category,
        date_time: dateTime.toISOString(),
        location: city || address ? { city: city || null, address: address || null } : null,
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        host_id: user.id,
      })

      if (error) throw error

      Alert.alert('Success', 'Hangout created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (error: any) {
      console.error('Error creating hangout:', error)
      Alert.alert('Error', error.message || 'Failed to create hangout')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (selectedDate) {
      setDateTime(selectedDate)
    }
  }

  const onTimeChange = (_event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios')
    if (selectedTime) {
      const newDateTime = new Date(dateTime)
      newDateTime.setHours(selectedTime.getHours())
      newDateTime.setMinutes(selectedTime.getMinutes())
      setDateTime(newDateTime)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Create Hangout',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <Button
              title="Create"
              onPress={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
              size="sm"
            />
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="What's the plan?"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell people more about this hangout..."
                  placeholderTextColor="#9CA3AF"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryList}>
                    {HANGOUT_CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          category === cat.id && styles.categoryChipSelected,
                        ]}
                        onPress={() => setCategory(cat.id)}
                      >
                        <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                        <Text
                          style={[
                            styles.categoryLabel,
                            category === cat.id && styles.categoryLabelSelected,
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date & Time *</Text>
                <View style={styles.dateTimeRow}>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                    <Text style={styles.dateTimeText}>{formatDate(dateTime)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Ionicons name="time-outline" size={20} color="#6B7280" />
                    <Text style={styles.dateTimeText}>{formatTime(dateTime)}</Text>
                  </TouchableOpacity>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={dateTime}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    minimumDate={new Date()}
                  />
                )}

                {showTimePicker && (
                  <DateTimePicker
                    value={dateTime}
                    mode="time"
                    display="default"
                    onChange={onTimeChange}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor="#9CA3AF"
                  value={city}
                  onChangeText={setCity}
                  maxLength={100}
                />
                <TextInput
                  style={[styles.input, styles.inputSpacing]}
                  placeholder="Address or venue"
                  placeholderTextColor="#9CA3AF"
                  value={address}
                  onChangeText={setAddress}
                  maxLength={200}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Max Participants</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Leave empty for unlimited"
                  placeholderTextColor="#9CA3AF"
                  value={maxParticipants}
                  onChangeText={setMaxParticipants}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  inputSpacing: {
    marginTop: 8,
  },
  categoryList: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: '#7C3AED',
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryLabelSelected: {
    color: '#FFFFFF',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#111827',
  },
})
