import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCreateOrganization, useUpdateOrganization, useToast } from '@/hooks';
import type { Organization } from '@/api/types';

const organizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface OrganizationFormProps {
  organization?: Organization | undefined;
  onSuccess?: () => void;
}

export function OrganizationForm({
  organization,
  onSuccess,
}: OrganizationFormProps): React.ReactElement {
  const toast = useToast();
  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization?.name ?? '',
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: OrganizationFormData): void => {
    if (organization) {
      updateMutation.mutate(
        { id: organization.id, data },
        {
          onSuccess: () => {
            toast.success('Organization updated successfully');
            onSuccess?.();
          },
          onError: (error) => {
            toast.error(error.message);
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success('Organization created successfully');
          onSuccess?.();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      });
    }
  };

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
                <Input {...field} placeholder="Acme Inc." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? 'Saving...'
              : organization
                ? 'Update Organization'
                : 'Create Organization'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
