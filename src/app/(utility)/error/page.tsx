'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'We encountered an unexpected issue.';
  const title = searchParams.get('title') || 'Oops! Something Went Wrong';

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Icon name="alertTriangle" className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
            >
              Go Back
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
