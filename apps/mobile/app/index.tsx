import { Redirect } from 'expo-router'
import { useAuthContext } from '../contexts/AuthContext'
import { LoadingSpinner } from '../components/ui'

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthContext()

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  // Redirect based on auth state
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/feed" />
  }

  return <Redirect href="/(auth)/login" />
}
