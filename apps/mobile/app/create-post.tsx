import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../contexts/AuthContext'
import { Avatar, Button } from '../components/ui'

export default function CreatePostScreen() {
  const { user } = useAuthContext()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write something to post')
      return
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to post')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
        visibility: 'friends',
      })

      if (error) throw error

      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Create Post',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <Button
              title="Post"
              onPress={handleSubmit}
              disabled={!content.trim() || isSubmitting}
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
          <View style={styles.header}>
            <Avatar name={user?.email} size="md" />
            <Text style={styles.userName}>{user?.email?.split('@')[0]}</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="What's on your mind?"
            placeholderTextColor="#9CA3AF"
            multiline
            value={content}
            onChangeText={setContent}
            autoFocus
            maxLength={1000}
          />

          <View style={styles.footer}>
            <Text style={styles.charCount}>{content.length}/1000</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userName: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 18,
    color: '#111827',
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
  },
})
