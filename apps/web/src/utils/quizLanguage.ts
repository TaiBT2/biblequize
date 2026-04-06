const KEY = 'quizLanguage'

export type QuizLanguage = 'vi' | 'en'

export function getQuizLanguage(): QuizLanguage {
  const stored = localStorage.getItem(KEY)
  return stored === 'en' ? 'en' : 'vi'
}

export function setQuizLanguage(lang: QuizLanguage): void {
  localStorage.setItem(KEY, lang)
}
