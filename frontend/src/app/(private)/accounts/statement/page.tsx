'use client';

import { useState } from 'react';
import { useToast } from '@/lib/hooks/useToast';
import { accountGetStatement } from '@/lib/endpoints/accounts';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AccountCombobox from '@/components/ui/account-combobox';
import DatePickerWithRange from '@/components/date/date-range-picker-v2';
import { DateRange } from 'react-day-picker';
import { Switch } from '@/components/ui/switch';

const StatementPage = () => {
  const [accountId, setAccountId] = useState<string | undefined>(undefined);
  const [isGeneratingStatement, setIsGeneratingStatement] = useState(false);
  const [exportType, setExportType] = useState('pdf');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined
  });
  const [accountDateRange, setAccountDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined
  });
  const [numTransactions, setNumTransactions] = useState('');

  const { showError } = useToast();

  const handleGenerateStatement = async () => {
    if (!accountId) {
      showError('Please enter an account ID.');
      return;
    }

    let startDateStr: string | undefined;
    let endDateStr: string | undefined;
    let numTransactionsParam: string | undefined;

    if (dateRange?.from && dateRange?.to) {
      startDateStr = dateRange.from.toISOString().split('T')[0];
      endDateStr = dateRange.to.toISOString().split('T')[0];
    } else if (numTransactions) {
      numTransactionsParam = numTransactions;
    }

    setIsGeneratingStatement(true);
    try {
      await accountGetStatement(accountId, {
        startDate: startDateStr,
        endDate: endDateStr,
        numTransactions: numTransactionsParam,
        exportType
      });
    } catch (error) {
      showError('Failed to generate statement.');
    } finally {
      setIsGeneratingStatement(false);
    }
  };

  return (
    <div className='flex min-h-full items-center justify-center'>
      <Card className='w-[450px]'>
        <CardHeader>
          <CardTitle>Generate Account Statement</CardTitle>
          <CardDescription>Generate a statement for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid w-full items-center gap-4'>
            <AccountCombobox
              value={accountId}
              onChange={setAccountId}
              placeholder='Select an account'
              setDateRange={setAccountDateRange}
            />

            <div className='flex items-center justify-between'>
              <Label htmlFor='exportType'>Export Type</Label>
              <div className='flex items-center gap-4'>
                <span
                  className={`text-sm font-medium ${exportType === 'pdf' ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  PDF
                </span>
                <Switch
                  id='exportType'
                  checked={exportType === 'xlsx'}
                  onCheckedChange={(checked) => setExportType(checked ? 'xlsx' : 'pdf')}
                  aria-label='Toggle export type'
                />
                <span
                  className={`text-sm font-medium ${exportType === 'xlsx' ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  XLSX
                </span>
              </div>
            </div>

            <div className='flex flex-col space-y-1.5'>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
                disabled={!!numTransactions}
                minDate={accountDateRange?.from}
                maxDate={accountDateRange?.to}
              />
            </div>

            <div className='flex flex-col space-y-1.5'>
              <Label htmlFor='numTransactions'>Number of Latest Transactions</Label>
              <Input
                id='numTransactions'
                type='number'
                placeholder='e.g., 100'
                value={numTransactions}
                onChange={(e) => {
                  setNumTransactions(e.target.value);
                  if (e.target.value) {
                    setDateRange({ from: undefined, to: undefined });
                  }
                }}
                disabled={!!(dateRange?.from || dateRange?.to)}
              />
            </div>

            <Button
              onClick={handleGenerateStatement}
              disabled={isGeneratingStatement}
              className='w-full'
            >
              {isGeneratingStatement ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Download className='mr-2 h-4 w-4' />
              )}
              Generate Statement
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatementPage;
