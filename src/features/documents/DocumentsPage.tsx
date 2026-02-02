import { FileText, Upload } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadDialog } from './UploadDialog'

export function DocumentsPage(): React.ReactElement {
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  // Note: The API doesn't have a list documents endpoint
  // In a real app, you would either:
  // 1. Add a list endpoint to the API
  // 2. Fetch documents per organization
  // For now, we show a placeholder with upload functionality

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Manage files and documents</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
          <CardDescription>Files uploaded to the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
            <FileText className="mb-4 h-12 w-12" />
            <p className="text-center">
              Document listing requires a list API endpoint.
              <br />
              Use the upload button to add documents to organizations.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>Upload files to organizations for storage</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => setIsUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Choose File to Upload
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization Documents</CardTitle>
            <CardDescription>View documents by organization</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Navigate to an organization&apos;s detail page to view its documents.
            </p>
          </CardContent>
        </Card>
      </div>

      <UploadDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </div>
  )
}

export default DocumentsPage
