import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrganizations, useUploadDocument, useToast } from '@/hooks';

const uploadSchema = z.object({
  organizationId: z.string().min(1, 'Organization is required'),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDialog({
  open,
  onOpenChange,
}: UploadDialogProps): React.ReactElement {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: orgsData, isLoading: orgsLoading } = useOrganizations({
    page: 1,
    size: 100,
  });
  const uploadMutation = useUploadDocument();

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      organizationId: '',
    },
  });

  const onSubmit = (data: UploadFormData): void => {
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      toast.error('Please select a file');
      return;
    }

    const file = files[0];
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    uploadMutation.mutate(
      { file, organizationId: data.organizationId },
      {
        onSuccess: () => {
          toast.success('Document uploaded successfully');
          onOpenChange(false);
          form.reset();
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a file to an organization
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={orgsLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {orgsData?.items.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>File</FormLabel>
              <FormControl>
                <Input ref={fileInputRef} type="file" />
              </FormControl>
            </FormItem>
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={uploadMutation.isPending}>
                <Upload className="mr-2 h-4 w-4" />
                {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
