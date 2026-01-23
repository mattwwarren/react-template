import { FileText, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getDocumentDownloadUrl, useDeleteDocument, useToast } from '@/hooks';
import type { Document } from '@/api/types';

interface DocumentsListProps {
  documents: Document[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = sizes[i];
  if (!size) return `${bytes} Bytes`;
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${size}`;
}

export function DocumentsList({
  documents,
}: DocumentsListProps): React.ReactElement {
  const deleteMutation = useDeleteDocument();
  const toast = useToast();

  const handleDelete = (doc: Document): void => {
    deleteMutation.mutate(doc.id, {
      onSuccess: () => {
        toast.success('Document deleted successfully');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  if (documents.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
        <FileText className="mb-2 h-8 w-8" />
        <p>No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              <span className="truncate">{doc.filename}</span>
            </CardTitle>
            <CardDescription>
              {formatBytes(doc.file_size)} &middot; {doc.content_type}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={getDocumentDownloadUrl(doc.id)}
                  download={doc.filename}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(doc)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
