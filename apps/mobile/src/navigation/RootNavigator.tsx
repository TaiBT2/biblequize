import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { useOnboardingStore } from '../stores/onboardingStore'
import { useAuthStore } from '../stores/authStore'
import OnboardingNavigator from './OnboardingNavigator'
import AuthNavigator from './AuthNavigator'
import MainTabNavigator from './MainTabNavigator'

export default function RootNavigator() {
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <NavigationContainer>
      {!hasSeenOnboarding ? (
        <OnboardingNavigator />
      ) : !isAuthenticated ? (
        <AuthNavigator />
      ) : (
        <MainTabNavigator />
      )}
    </NavigationContainer>
  )
}
