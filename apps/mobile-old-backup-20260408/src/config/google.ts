import Constants from 'expo-constants'

const extra = Constants.expoConfig?.extra ?? {}

export const GOOGLE_ANDROID_CLIENT_ID: string = extra.googleAndroidClientId ?? ''
export const GOOGLE_WEB_CLIENT_ID: string = extra.googleWebClientId ?? ''
export const GOOGLE_IOS_CLIENT_ID: string = extra.googleIosClientId ?? ''
export const GOOGLE_ENABLED = GOOGLE_WEB_CLIENT_ID.length > 0
