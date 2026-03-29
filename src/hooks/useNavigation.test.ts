import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import useNavigationStore from '../stores/navigationStore'
import useNavigation from './useNavigation'

beforeEach(() => {
  act(() => {
    useNavigationStore.setState({ currentRoute: 'training' })
  })
})

describe('useNavigation', () => {
  it('returns currentRoute as training by default', () => {
    const { result } = renderHook(() => useNavigation())
    expect(result.current.currentRoute).toBe('training')
  })

  it('navigate changes currentRoute', () => {
    const { result } = renderHook(() => useNavigation())
    act(() => result.current.navigate('history'))
    expect(result.current.currentRoute).toBe('history')
  })

  it('navigate back to training', () => {
    const { result } = renderHook(() => useNavigation())
    act(() => result.current.navigate('history'))
    act(() => result.current.navigate('training'))
    expect(result.current.currentRoute).toBe('training')
  })
})
