import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '../theme/colors'
import { HomeStack } from './HomeStack'
import { QuizStack } from './QuizStack'
import { DailyChallengeScreen } from '../screens/quiz/DailyChallengeScreen'
import { GroupStack } from './GroupStack'
import { ProfileStack } from './ProfileStack'

const Tab = createBottomTabNavigator()

export const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg.secondary,
          borderTopColor: 'rgba(255,255,255,0.05)',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="RankedTab"
        component={QuizStack}
        options={{
          tabBarLabel: 'Leo hạng',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="sword-cross" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="DailyTab"
        component={DailyChallengeScreen}
        options={{
          tabBarLabel: 'Hàng ngày',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-today" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="GroupsTab"
        component={GroupStack}
        options={{
          tabBarLabel: 'Nhóm',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}
