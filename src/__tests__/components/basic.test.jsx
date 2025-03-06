import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

describe('基本測試', () => {
  test('測試環境是否正常運作', () => {
    expect(true).toBe(true)
  });

  test('基本 DOM 渲染測試', () => {
    render(<div>Hello Test</div>)
    expect(screen.getByText('Hello Test')).toBeInTheDocument()
  });
});