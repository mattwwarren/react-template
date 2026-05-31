# Feature Modules

Feature-based architecture. Each domain gets its own directory with pages, components, and tests.

## Module Structure

```
features/users/
  index.ts              # Barrel export
  UsersPage.tsx         # List page
  UserDetailPage.tsx    # Detail page
  UsersTable.tsx        # Table component
  UserForm.tsx          # Create/edit form (shared)
  UserDialog.tsx        # Dialog wrapper for form
  __tests__/            # Feature-specific tests
```

## Page Pattern

```tsx
export function UsersPage() {
  const [searchParams] = useSearchParams()
  const { page, size } = getPaginationParams(searchParams)
  const { data, isLoading } = useUsers({ page, size })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">...</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Create User</Button>
      </div>
      <Card>
        <CardContent className="space-y-4">
          <UsersTable data={data?.items} isLoading={isLoading} />
          {data && data.pages > 1 && <Pagination {...data} />}
        </CardContent>
      </Card>
    </div>
  )
}
```

Key conventions:
- **Pagination via URL**: `useSearchParams()`, not React state
- **Custom hooks** from `@/hooks` for all data fetching
- **shadcn/ui** Card, Button, Dialog for UI structure
- **Prefetch on hover**: `onMouseEnter={() => prefetchUser(id)}` on links

## Form Pattern

```tsx
const userSchema = z.object({
  name: z.string().min(1, 'Required').max(100),
  email: z.string().email('Invalid email'),
})

export function UserForm({ user, onSuccess }: Props) {
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  })
  // ...
}
```

- Zod schemas mirror backend Pydantic constraints
- React Hook Form + `zodResolver` for validation
- Same form component for create AND edit (conditional on `entity` prop)
- Mutation callbacks: toast notification + `onSuccess?.()` callback

## Table Pattern

- `useMemo()` for column definitions
- `memo()` for row action components
- Shared `DataTable` from `@/components/shared`
- Column accessors are functions, not string keys
