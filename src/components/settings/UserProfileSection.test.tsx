import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserProfileSection } from './UserProfileSection'
import { useUserProfileStore } from '@/stores/userProfileStore'

const DEFAULT_PROFILE = {
  birthYear: null,
  weightKg: null,
  heightCm: null,
  trainingGoal: null,
}

describe('UserProfileSection', () => {
  beforeEach(() => {
    localStorage.clear()
    useUserProfileStore.setState({ profile: { ...DEFAULT_PROFILE } })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('初期描画', () => {
    it('プロフィールセクションラベルを表示する', () => {
      render(<UserProfileSection />)
      expect(screen.getByText('プロフィール')).toBeInTheDocument()
    })

    it('4つの入力フィールドを描画する', () => {
      render(<UserProfileSection />)
      expect(screen.getByLabelText('生まれ年')).toBeInTheDocument()
      expect(screen.getByLabelText('体重')).toBeInTheDocument()
      expect(screen.getByLabelText('身長')).toBeInTheDocument()
      expect(screen.getByLabelText('トレーニング目的')).toBeInTheDocument()
    })

    it('ストアに値がある場合にフォームに反映する', () => {
      // render() 前にストアをセット（lazy initializer で読み込まれるため）
      useUserProfileStore.setState({
        profile: { birthYear: 1990, weightKg: 70, heightCm: 175, trainingGoal: 'muscle_gain' },
      })
      render(<UserProfileSection />)
      expect((screen.getByLabelText('生まれ年') as HTMLInputElement).value).toBe('1990')
      expect((screen.getByLabelText('体重') as HTMLInputElement).value).toBe('70')
      expect((screen.getByLabelText('身長') as HTMLInputElement).value).toBe('175')
      expect((screen.getByLabelText('トレーニング目的') as HTMLSelectElement).value).toBe(
        'muscle_gain',
      )
    })
  })

  describe('生まれ年入力', () => {
    it('デバウンス前は setProfile を呼ばない', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<UserProfileSection />)
      await user.type(screen.getByLabelText('生まれ年'), '1990')
      expect(useUserProfileStore.getState().profile.birthYear).toBeNull()
    })

    it('300ms 後に setProfile を呼ぶ', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<UserProfileSection />)
      await user.type(screen.getByLabelText('生まれ年'), '1990')
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
      })
      expect(useUserProfileStore.getState().profile.birthYear).toBe(1990)
    })

    it('デバウンス中に "保存中…" を表示する', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<UserProfileSection />)
      await user.type(screen.getByLabelText('生まれ年'), '1')
      expect(screen.getByText('保存中…')).toBeInTheDocument()
    })

    it('デバウンス後に "保存済み" を表示する', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<UserProfileSection />)
      await user.type(screen.getByLabelText('生まれ年'), '1990')
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
      })
      expect(screen.getByText('保存済み')).toBeInTheDocument()
    })

    it('フィールドをクリアすると null で保存する', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      useUserProfileStore.setState({ profile: { ...DEFAULT_PROFILE, birthYear: 1990 } })
      render(<UserProfileSection />)
      const input = screen.getByLabelText('生まれ年')
      await user.clear(input)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
      })
      expect(useUserProfileStore.getState().profile.birthYear).toBeNull()
    })
  })

  describe('体重入力', () => {
    it('300ms 後に数値で setProfile を呼ぶ', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<UserProfileSection />)
      await user.type(screen.getByLabelText('体重'), '70')
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
      })
      expect(useUserProfileStore.getState().profile.weightKg).toBe(70)
    })

    it('空入力で null を保存する', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      useUserProfileStore.setState({ profile: { ...DEFAULT_PROFILE, weightKg: 70 } })
      render(<UserProfileSection />)
      await user.clear(screen.getByLabelText('体重'))
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
      })
      expect(useUserProfileStore.getState().profile.weightKg).toBeNull()
    })
  })

  describe('身長入力', () => {
    it('300ms 後に数値で setProfile を呼ぶ', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<UserProfileSection />)
      await user.type(screen.getByLabelText('身長'), '175')
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
      })
      expect(useUserProfileStore.getState().profile.heightCm).toBe(175)
    })

    it('空入力で null を保存する', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      useUserProfileStore.setState({ profile: { ...DEFAULT_PROFILE, heightCm: 175 } })
      render(<UserProfileSection />)
      await user.clear(screen.getByLabelText('身長'))
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
      })
      expect(useUserProfileStore.getState().profile.heightCm).toBeNull()
    })
  })

  describe('トレーニング目的セレクト', () => {
    it('5つの目的オプションを表示する', () => {
      render(<UserProfileSection />)
      const select = screen.getByLabelText('トレーニング目的') as HTMLSelectElement
      // 「選択してください」+ 5つの目的 = 6オプション
      expect(select.options).toHaveLength(6)
    })

    it('選択変更後 300ms で setProfile を呼ぶ', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<UserProfileSection />)
      await user.selectOptions(screen.getByLabelText('トレーニング目的'), 'muscle_gain')
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
      })
      expect(useUserProfileStore.getState().profile.trainingGoal).toBe('muscle_gain')
    })

    it('"選択してください" で null を保存する', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      useUserProfileStore.setState({ profile: { ...DEFAULT_PROFILE, trainingGoal: 'strength' } })
      render(<UserProfileSection />)
      await user.selectOptions(screen.getByLabelText('トレーニング目的'), '')
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
      })
      expect(useUserProfileStore.getState().profile.trainingGoal).toBeNull()
    })
  })

  describe('デバウンスリセット', () => {
    it('連続入力で setProfile は最後の値で1回だけ呼ばれる', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const setProfileSpy = vi.spyOn(useUserProfileStore.getState(), 'setProfile')
      render(<UserProfileSection />)
      const input = screen.getByLabelText('生まれ年')
      await user.type(input, '1')
      await user.type(input, '9')
      await user.type(input, '9')
      await user.type(input, '0')
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
      })
      expect(setProfileSpy).toHaveBeenCalledTimes(1)
      expect(setProfileSpy).toHaveBeenCalledWith({ birthYear: 1990 })
    })
  })

  describe('アンマウント', () => {
    it('アンマウント後に setProfile を呼ばない', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { unmount } = render(<UserProfileSection />)
      await user.type(screen.getByLabelText('生まれ年'), '1990')
      unmount()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000)
      })
      expect(useUserProfileStore.getState().profile.birthYear).toBeNull()
    })
  })
})
