import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LocalFieldsEditor, normalizeLocalFields } from '@/shared/components/LocalFieldsEditor'

function typedInputs() {
  return {
    keys: screen.getAllByLabelText('Key') as HTMLInputElement[],
    values: screen.getAllByLabelText('Value') as HTMLInputElement[],
  }
}

describe('LocalFieldsEditor', () => {
  it('renders prefilled rows from value', () => {
    render(<LocalFieldsEditor value={{ instagram: '@doe', vip: 'yes' }} onChange={vi.fn()} />)

    const { keys, values } = typedInputs()
    expect(keys).toHaveLength(2)
    expect(keys[0]).toHaveValue('instagram')
    expect(values[0]).toHaveValue('@doe')
    expect(keys[1]).toHaveValue('vip')
    expect(values[1]).toHaveValue('yes')
  })

  it('adds a row and emits the typed key-value pair', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LocalFieldsEditor value={{}} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Add field' }))
    const { keys, values } = typedInputs()
    expect(keys).toHaveLength(1)

    await user.type(keys[0] as HTMLInputElement, 'source')
    await user.type(values[0] as HTMLInputElement, 'referral')

    const lastCall = onChange.mock.calls.at(-1)?.[0]
    expect(lastCall).toEqual({ source: 'referral' })
  })

  it('removes a pair and emits the remaining value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LocalFieldsEditor value={{ first: '1', second: '2' }} onChange={onChange} />)

    const removeButtons = screen.getAllByRole('button', { name: 'Remove' })
    expect(removeButtons).toHaveLength(2)

    await user.click(removeButtons[0] as HTMLButtonElement)

    expect(onChange).toHaveBeenCalledWith({ second: '2' })
    expect(screen.getAllByLabelText('Key')).toHaveLength(1)
    expect(screen.getByLabelText('Key')).toHaveValue('second')
  })

  it('ignores rows with an empty key until a key is typed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LocalFieldsEditor value={{}} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Add field' }))
    await user.type(screen.getByLabelText('Value'), 'secret')

    for (const call of onChange.mock.calls) {
      expect(call[0]).toEqual({})
    }

    await user.type(screen.getByLabelText('Key'), 'token')
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual({ token: 'secret' })
  })

  it('re-syncs rows when the incoming value changes externally', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(<LocalFieldsEditor value={{}} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Add field' }))
    await user.type(screen.getByLabelText('Key'), 'draft_key')

    rerender(<LocalFieldsEditor value={{ loyalty: 'gold' }} onChange={onChange} />)

    const { keys, values } = typedInputs()
    expect(keys).toHaveLength(1)
    expect(keys[0]).toHaveValue('loyalty')
    expect(values[0]).toHaveValue('gold')
  })

  describe('normalizeLocalFields', () => {
    it('trims keys and values and drops empty keys', () => {
      expect(
        normalizeLocalFields({ '  source  ': '  referral  ', '': 'dropped', empty: '' }),
      ).toEqual({ source: 'referral', empty: '' })
    })

    it('returns an empty object for null/undefined', () => {
      expect(normalizeLocalFields(null)).toEqual({})
      expect(normalizeLocalFields(undefined)).toEqual({})
    })
  })
})
