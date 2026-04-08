import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { OnboardingStackParamList } from './types'
import SplashScreen from '../screens/onboarding/SplashScreen'
import LanguageSelectionScreen from '../screens/onboarding/LanguageSelectionScreen'
import WelcomeSlidesScreen from '../screens/onboarding/WelcomeSlidesScreen'
import TryQuizScreen from '../screens/onboarding/TryQuizScreen'
import TryQuizResultScreen from '../screens/onboarding/TryQuizResultScreen'

const Stack = createNativeStackNavigator<OnboardingStackParamList>()

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
      <Stack.Screen name="WelcomeSlides" component={WelcomeSlidesScreen} />
      <Stack.Screen name="TryQuiz" component={TryQuizScreen} />
      <Stack.Screen name="TryQuizResult" component={TryQuizResultScreen} />
    </Stack.Navigator>
  )
}
