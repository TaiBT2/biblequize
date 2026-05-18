export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

export interface Question {
  id: string
  book: string
  chapter: number
  verseStart?: number
  verseEnd?: number
  difficulty: QuestionDifficulty
  type: string
  content: string
  options: string[]
  correctAnswer: number[]
  explanation?: string
}
