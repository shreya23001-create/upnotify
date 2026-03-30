import { describe, it, expect } from 'vitest'
import { getEnvironment } from '@/lib/utils/environment'

describe('project setup', () => {
  it('detects development environment in test', () => {
    expect(getEnvironment()).toBe('development')
  })
})
