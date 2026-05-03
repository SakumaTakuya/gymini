import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { AppHeaderProvider, AppHeaderContent } from './AppHeaderContext'

describe('AppHeaderProvider + AppHeaderContent', () => {
  it('子コンポーネントがコンテンツを登録しない場合、見出しなしのバナーを提供する', () => {
    render(
      <AppHeaderProvider>
        <div>body</div>
      </AppHeaderProvider>,
    )
    const banner = screen.getByRole('banner')
    expect(banner).toBeInTheDocument()
    expect(banner.dataset.variant).toBe('default')
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
  })

  it('子コンポーネントがポータル経由で公開したタイトルを描画する', () => {
    render(
      <AppHeaderProvider>
        <AppHeaderContent title="履歴" />
      </AppHeaderProvider>,
    )
    expect(screen.getByRole('heading', { level: 1, name: '履歴' })).toBeInTheDocument()
  })

  it('ポータル経由でleadingスロットとtrailingスロットを描画する', () => {
    render(
      <AppHeaderProvider>
        <AppHeaderContent
          title="AIコーチ"
          leading={<span data-testid="lead-icon">L</span>}
          trailing={<button>act</button>}
        />
      </AppHeaderProvider>,
    )
    expect(screen.getByTestId('lead-icon')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'act' })).toBeInTheDocument()
  })

  it('子コンポーネントがsession-activeを要求するとvariantを切り替える', () => {
    render(
      <AppHeaderProvider>
        <AppHeaderContent title="セッション中" variant="session-active" />
      </AppHeaderProvider>,
    )
    expect(screen.getByRole('banner').dataset.variant).toBe('session-active')
  })

  it('子コンポーネントが再描画されるとtrailingをリアクティブに更新する', async () => {
    function Counter() {
      const [n, setN] = useState(0)
      return (
        <>
          <AppHeaderContent
            title="counter"
            trailing={<span data-testid="count">{n}</span>}
          />
          <button onClick={() => setN((v) => v + 1)}>inc</button>
        </>
      )
    }
    render(
      <AppHeaderProvider>
        <Counter />
      </AppHeaderProvider>,
    )
    expect(screen.getByTestId('count').textContent).toBe('0')
    await userEvent.click(screen.getByRole('button', { name: 'inc' }))
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('providerなしでAppHeaderContentを使用するとエラーをスローする', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<AppHeaderContent title="x" />)).toThrow(
      /AppHeaderProvider/,
    )
    spy.mockRestore()
  })
})
