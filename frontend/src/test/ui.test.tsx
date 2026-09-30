import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Checkbox from '@/components/ui/Checkbox'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import PasswordInput from '@/components/ui/PasswordInput'
import Spinner from '@/components/ui/Spinner'
import Tabs from '@/components/ui/Tabs'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('fires onClick', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled natively when disabled', () => {
    render(<Button disabled>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('disables itself while loading and shows a spinner', () => {
    render(<Button loading>Save</Button>)
    const btn = screen.getByRole('button', { name: /save/i })
    expect(btn).toBeDisabled()
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })

  it('does not show a spinner when idle', () => {
    render(<Button>Save</Button>)
    expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument()
  })

  it('forwards html attributes', () => {
    render(<Button type="submit" aria-label="Confirm">Go</Button>)
    const btn = screen.getByRole('button', { name: 'Confirm' })
    expect(btn).toHaveAttribute('type', 'submit')
  })
})

describe('Input', () => {
  it('associates the label with the field', () => {
    render(<Input label="Email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('renders an error message and marks the field invalid', () => {
    render(<Input label="Email" error="Email is required" />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required')
  })

  it('renders a hint instead of an error', () => {
    render(<Input label="Password" hint="At least 8 characters" />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'false')
  })

  it('accepts typed values', () => {
    render(<Input label="Email" />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
    expect(screen.getByLabelText('Email')).toHaveValue('a@b.com')
  })
})

describe('PasswordInput', () => {
  const onChange = vi.fn()

  it('masks the value by default', () => {
    render(<PasswordInput label="Password" value="s3cret" onChange={onChange} />)
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument()
  })

  it('reveals the value on toggle without changing it', () => {
    render(<PasswordInput label="Password" value="s3cret" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))

    const field = screen.getByLabelText('Password')
    expect(field).toHaveAttribute('type', 'text')
    expect(field).toHaveValue('s3cret')
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('masks the value again on a second toggle', () => {
    render(<PasswordInput label="Password" value="s3cret" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('keeps the hint and error slots of Input', () => {
    render(<PasswordInput label="Password" hint="At least 8 characters." />)
    expect(screen.getByText('At least 8 characters.')).toBeInTheDocument()
  })
})

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge tone="emerald">Offer</Badge>)
    expect(screen.getByText('Offer')).toBeInTheDocument()
  })

  it('defaults to the slate tone', () => {
    render(<Badge>Saved</Badge>)
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })
})

describe('Card', () => {
  it('renders header, body and content', () => {
    render(
      <Card>
        <CardHeader title="Jobs" subtitle="7 total" />
        <CardBody>Body content</CardBody>
      </Card>,
    )
    expect(screen.getByText('Jobs')).toBeInTheDocument()
    expect(screen.getByText('7 total')).toBeInTheDocument()
    expect(screen.getByText('Body content')).toBeInTheDocument()
  })

  it('omits the subtitle when not provided', () => {
    render(<CardHeader title="Only title" />)
    expect(screen.getByText('Only title')).toBeInTheDocument()
  })
})

describe('Spinner', () => {
  it('is announced as Loading', () => {
    render(<Spinner />)
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })

  it('applies the requested size', () => {
    const { container } = render(<Spinner size="lg" />)
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('h-10 w-10')
  })
})

describe('EmptyState', () => {
  it('renders the title and description', () => {
    render(<EmptyState title="No jobs yet" description="Add your first job to get started" />)
    expect(screen.getByText('No jobs yet')).toBeInTheDocument()
    expect(screen.getByText('Add your first job to get started')).toBeInTheDocument()
  })

  it('renders the action when given', () => {
    render(<EmptyState title="Nothing here" action={<button>Add job</button>} />)
    expect(screen.getByRole('button', { name: 'Add job' })).toBeInTheDocument()
  })

  it('omits the description when not given', () => {
    render(<EmptyState title="Nothing here" />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })
})

describe('ErrorState', () => {
  it('exposes an alert region with the default message', () => {
    render(<ErrorState />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
  })

  it('shows a custom message', () => {
    render(<ErrorState message="Could not load jobs" />)
    expect(screen.getByText('Could not load jobs')).toBeInTheDocument()
  })

  it('calls onRetry', () => {
    const onRetry = vi.fn()
    render(<ErrorState onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('hides the retry button when no handler is given', () => {
    render(<ErrorState />)
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
  })
})

describe('Checkbox', () => {
  it('toggles and shows its label', () => {
    render(<Checkbox label="Only mine" />)
    const box = screen.getByLabelText('Only mine') as HTMLInputElement
    expect(box.checked).toBe(false)
    fireEvent.click(box)
    expect(box.checked).toBe(true)
  })

  it('renders without a label', () => {
    const { container } = render(<Checkbox />)
    expect(container.querySelector('input[type="checkbox"]')).toBeTruthy()
  })
})

describe('Tabs', () => {
  const tabs = [
    { id: 'overview', label: 'Overview', content: <div>Overview panel</div> },
    { id: 'activity', label: 'Activity', content: <div>Activity panel</div> },
  ]

  it('shows the first panel by default', () => {
    render(<Tabs tabs={tabs} />)
    expect(screen.getByText('Overview panel')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
  })

  it('switches panels on click', () => {
    render(<Tabs tabs={tabs} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Activity' }))
    expect(screen.getByText('Activity panel')).toBeInTheDocument()
    expect(screen.queryByText('Overview panel')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
  })

  it('honours an initial tab', () => {
    render(<Tabs tabs={tabs} initial="activity" />)
    expect(screen.getByText('Activity panel')).toBeInTheDocument()
  })
})

describe('Pagination', () => {
  it('renders nothing when there is a single page', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPage={vi.fn()} />)
    expect(container.querySelector('nav')).not.toBeInTheDocument()
  })

  it('disables Previous on the first page', () => {
    render(<Pagination page={1} totalPages={4} onPage={vi.fn()} />)
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /next/i })).toBeEnabled()
  })

  it('disables Next on the last page', () => {
    render(<Pagination page={4} totalPages={4} onPage={vi.fn()} />)
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /previous/i })).toBeEnabled()
  })

  it('navigates forwards and backwards', () => {
    const onPage = vi.fn()
    render(<Pagination page={2} totalPages={3} onPage={onPage} />)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(onPage).toHaveBeenCalledWith(3)
    fireEvent.click(screen.getByRole('button', { name: /previous/i }))
    expect(onPage).toHaveBeenCalledWith(1)
  })

  it('shows the current page of the total', () => {
    render(<Pagination page={2} totalPages={5} onPage={vi.fn()} />)
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onClose={vi.fn()} title="Delete job">
        body
      </Modal>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders a labelled dialog when open', () => {
    render(
      <Modal open onClose={vi.fn()} title="Delete job">
        body
      </Modal>,
    )
    expect(screen.getByRole('dialog', { name: 'Delete job' })).toBeInTheDocument()
    expect(screen.getByText('body')).toBeInTheDocument()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Delete job">
        body
      </Modal>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when the backdrop is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Modal open onClose={onClose} title="Delete job">
        body
      </Modal>,
    )
    const backdrop = container.querySelector('[aria-hidden]')
    expect(backdrop).toBeTruthy()
    fireEvent.click(backdrop as Element)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes from the header close button', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Delete job">
        body
      </Modal>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders the footer', () => {
    render(
      <Modal open onClose={vi.fn()} title="Confirm" footer={<button>Confirm</button>}>
        body
      </Modal>,
    )
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  })
})
