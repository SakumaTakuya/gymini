import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SettingsContent } from './SettingsContent'
import { useSettingsStore } from '@/stores/settingsStore'

describe('SettingsContent', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettingsStore.setState({ apiKey: '', hasApiKey: false })
  })

  it('renders APIKeySection', () => {
    render(<SettingsContent />)
    expect(screen.getByText('Gemini API')).toBeInTheDocument()
  })

  it('renders ExerciseMasterSection', () => {
    render(<SettingsContent />)
    expect(screen.getByText('種目マスター')).toBeInTheDocument()
  })
})
