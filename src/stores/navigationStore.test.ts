import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import useNavigationStore from './navigationStore'

beforeEach(() => {
  act(() => {
    useNavigationStore.setState({ currentRoute: 'training' })
  })
})

describe('navigationStore initial state', () => {
  it('defaults to training route', () => {
    expect(useNavigationStore.getState().currentRoute).toBe('training')
  })
})

describe('navigate', () => {
  it('changes currentRoute to history', () => {
    act(() => useNavigationStore.getState().navigate('history'))
    expect(useNavigationStore.getState().currentRoute).toBe('history')
  })

  it('changes currentRoute back to training', () => {
    act(() => useNavigationStore.getState().navigate('history'))
    act(() => useNavigationStore.getState().navigate('training'))
    expect(useNavigationStore.getState().currentRoute).toBe('training')
  })
})
