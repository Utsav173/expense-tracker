import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icon } from '@/components/ui/icon';
import ImportDropzone from '@/components/transactions/import-dropzone';
import type { AccountAPI } from '@/lib/api/api-types';

interface UploadStepProps {
  accountId?: string;
  setAccountId: (value: string | undefined) => void;
  accountsData?: AccountAPI.SimpleAccount[];
  isLoadingAccounts: boolean;
  onFileDrop: (file: File) => void;
  loading: boolean;
  handleDownloadSample: () => void;
}

export const UploadStep = ({
  accountId,
  setAccountId,
  accountsData,
  isLoadingAccounts,
  onFileDrop,
  loading,
  handleDownloadSample
}: UploadStepProps) => (
  <Card>
    <CardHeader>
      <CardTitle className='flex items-center text-xl'>
        <Icon name='sparkles' className='text-primary mr-2 h-5 w-5' />
        Upload & Process
      </CardTitle>
      <CardDescription>
        Support for Excel (.xlsx) and PDF formats with AI-powered extraction.
      </CardDescription>
    </CardHeader>
    <CardContent className='space-y-6'>
      <div className='space-y-2'>
        <label className='text-muted-foreground flex items-center text-sm font-semibold'>
          <Icon name='database' className='mr-2 h-4 w-4' />
          Destination Account *
        </label>
        <Select onValueChange={setAccountId} value={accountId}>
          <SelectTrigger>
            <SelectValue
              placeholder={isLoadingAccounts ? 'Loading accounts...' : 'Select an account'}
            />
          </SelectTrigger>
          <SelectContent>
            {accountsData?.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {`${acc.name} (${acc.currency})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='border-border rounded-lg border-2 border-dashed p-4'>
        <ImportDropzone onFileDrop={onFileDrop} isLoading={loading} disabled={!accountId} />
      </div>

      <div className='flex justify-center'>
        <Button onClick={handleDownloadSample} variant='outline' disabled={loading}>
          <Icon name='fileText' className='mr-2 h-4 w-4' />
          Download Excel Template
        </Button>
      </div>
    </CardContent>
  </Card>
);
