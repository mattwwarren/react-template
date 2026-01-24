---
description: Generate a new React component with tests and Storybook story
argument-hint: <ComponentName> [--feature=<feature>] [--with-api]
---

# Generate React Component

Generate a new React component with full test coverage and Storybook documentation.

## Usage

```bash
/react-component UserCard --feature=users
/react-component DataTable --with-api
/react-component LoginForm --feature=auth --with-api
```

## Options

- `--feature=<name>` - Place in specific feature folder (default: components/shared)
- `--with-api` - Include TanStack Query integration and MSW handler

## Generated Files

### Basic Component

```
src/features/<feature>/components/
├── <ComponentName>.tsx
└── <ComponentName>.test.tsx

src/stories/
└── <ComponentName>.stories.tsx
```

### With API (`--with-api`)

```
src/features/<feature>/
├── components/<ComponentName>.tsx
├── hooks/use<ComponentName>.ts
└── <ComponentName>.test.tsx

src/mocks/handlers/
└── <resource>.ts (if new)

src/stories/
└── <ComponentName>.stories.tsx
```

## Component Template

```typescript
// src/features/users/components/UserCard.tsx
import type { User } from '@/api/generated/types'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export interface UserCardProps {
  user: User
  className?: string
  onSelect?: (id: string) => void
}

export function UserCard({ user, className, onSelect }: UserCardProps) {
  return (
    <Card
      className={cn('cursor-pointer hover:shadow-md transition-shadow', className)}
      onClick={() => onSelect?.(user.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.(user.id)
        }
      }}
    >
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar src={user.avatar} alt={user.name} />
        <div>
          <h3 className="font-semibold">{user.name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </CardHeader>
    </Card>
  )
}
```

## Test Template

```typescript
// src/features/users/components/UserCard.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserCard } from './UserCard'
import { createUser } from '@/mocks/factories/users'

describe('UserCard', () => {
  const mockUser = createUser({ name: 'John Doe', email: 'john@example.com' })
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders user information', () => {
    render(<UserCard user={mockUser} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup()
    render(<UserCard user={mockUser} onSelect={mockOnSelect} />)

    await user.click(screen.getByRole('button'))

    expect(mockOnSelect).toHaveBeenCalledWith(mockUser.id)
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<UserCard user={mockUser} onSelect={mockOnSelect} />)

    const card = screen.getByRole('button')
    card.focus()
    await user.keyboard('{Enter}')

    expect(mockOnSelect).toHaveBeenCalledWith(mockUser.id)
  })
})
```

## Storybook Template

```typescript
// src/stories/UserCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { UserCard } from '@/features/users/components/UserCard'
import { createUser } from '@/mocks/factories/users'

const meta: Meta<typeof UserCard> = {
  title: 'Features/Users/UserCard',
  component: UserCard,
  tags: ['autodocs'],
  argTypes: {
    onSelect: { action: 'selected' },
  },
}

export default meta
type Story = StoryObj<typeof UserCard>

export const Default: Story = {
  args: {
    user: createUser({ name: 'John Doe', email: 'john@example.com' }),
  },
}

export const LongName: Story = {
  args: {
    user: createUser({
      name: 'Alexander Bartholomew Christopher Davidson III',
      email: 'alex@example.com',
    }),
  },
}
```

## Component Checklist

- [ ] TypeScript interfaces exported
- [ ] Props have default values where sensible
- [ ] className prop for customization
- [ ] Keyboard accessible (if interactive)
- [ ] ARIA attributes present
- [ ] Uses cn() for conditional classes
- [ ] Uses CSS variables for colors
- [ ] Loading state handled (if async)
- [ ] Error state handled (if async)
- [ ] Unit tests written
- [ ] Storybook story created

---

**After generation:** Run `npm test` to verify tests pass.
