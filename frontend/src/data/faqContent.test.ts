import { describe, expect, it } from 'vitest'
import { FAQ_ITEMS } from './faqContent'

describe('FAQ_ITEMS', () => {
  it('has unique questions', () => {
    const questions = FAQ_ITEMS.map((item) => item.question)
    expect(new Set(questions).size).toBe(questions.length)
  })

  it('every entry has a non-empty question and answer', () => {
    for (const item of FAQ_ITEMS) {
      expect(item.question.trim()).toBeTruthy()
      expect(item.answer.trim()).toBeTruthy()
    }
  })
})
