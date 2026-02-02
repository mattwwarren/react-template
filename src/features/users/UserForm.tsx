import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { User } from '@/api/types'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useCreateUser, useToast, useUpdateUser } from '@/hooks'

const userSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
})

type UserFormData = z.infer<typeof userSchema>

interface UserFormProps {
  user?: User | undefined
  onSuccess?: () => void
}

export function UserForm({ user, onSuccess }: UserFormProps): React.ReactElement {
  const toast = useToast()
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (data: UserFormData): void => {
    if (user) {
      updateMutation.mutate(
        { id: user.id, data },
        {
          onSuccess: () => {
            toast.success('User updated successfully')
            onSuccess?.()
          },
          onError: (error) => {
            toast.error(error.message)
          },
        }
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success('User created successfully')
          onSuccess?.()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="John Doe" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="john@example.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : user ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
