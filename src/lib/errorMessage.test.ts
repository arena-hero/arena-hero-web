import { afterEach, describe, expect, it } from 'vitest'
import { APIError } from './api'
import { getErrorMessage } from './errorMessage'
import i18n from './i18n'

describe('getErrorMessage', () => {
  afterEach(() => void i18n.changeLanguage('en'))

  it('turns an API error code into a readable message', () => {
    expect(getErrorMessage(new APIError('EMAIL_NOT_VERIFIED', 401))).toBe('Please verify your email before signing in.')
  })

  it('never exposes an unknown error code', () => {
    expect(getErrorMessage(new APIError('SOME_INTERNAL_CODE', 500))).toBe('Something went wrong. Please try again.')
  })

  it('uses the active language', async () => {
    await i18n.changeLanguage('zh')
    expect(getErrorMessage('EMAIL_NOT_VERIFIED')).toBe('请先完成邮箱验证，再登录游戏。')
  })
})
