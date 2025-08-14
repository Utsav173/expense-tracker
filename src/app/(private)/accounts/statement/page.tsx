'use client';

import { useState } from 'react';
import { useToast } from '@/lib/hooks/useToast';
import { accountGetStatement } from '@/lib/endpoints/accounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AccountCombobox from '@/components/ui/account-combobox';
import DatePickerWithRange from '@/components/date/date-range-picker-v2';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Icon } from '@/components/ui/icon';

const StatementPage = () => {
  const [accountId, setAccountId] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'xlsx'>('pdf');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [accountDateRange, setAccountDateRange] = useState<DateRange | undefined>();
  const [numTransactions, setNumTransactions] = useState('');

  const { showError } = useToast();

  const handleGenerateStatement = async () => {
    if (!accountId) {
      showError('Please select an account.');
      return;
    }

    setIsGenerating(true);
    try {
      await accountGetStatement(accountId, {
        startDate: dateRange?.from?.toISOString().split('T')[0],
        endDate: dateRange?.to?.toISOString().split('T')[0],
        numTransactions: numTransactions || undefined,
        exportType
      });
    } catch (error) {
      showError('Failed to generate statement. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className='mx-auto w-full max-w-2xl p-4 sm:p-8'>
      <Card className='shadow-lg'>
        <CardHeader>
          <CardTitle className='text-2xl'>Generate Account Statement</CardTitle>
          <CardDescription>
            Export a detailed statement of your account transactions in PDF or XLSX format.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className='grid w-full gap-6'
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerateStatement();
            }}
          >
            <div className='space-y-2'>
              <Label htmlFor='accountId'>Account</Label>
              <AccountCombobox
                id='accountId'
                value={accountId}
                onChange={setAccountId}
                placeholder='Select an account'
                setDateRange={setAccountDateRange}
              />
            </div>

            <div className='space-y-2'>
              <Label>Export Format</Label>
              <ToggleGroup
                type='single'
                value={exportType}
                onValueChange={(value: 'pdf' | 'xlsx') => value && setExportType(value)}
                className='w-full'
              >
                <ToggleGroupItem value='pdf' className='w-full'>
                  PDF
                </ToggleGroupItem>
                <ToggleGroupItem value='xlsx' className='w-full'>
                  XLSX
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className='relative flex items-center'>
              <div className='border-border flex-grow border-t'></div>
              <span className='text-muted-foreground mx-4 flex-shrink-0 text-xs uppercase'>Or</span>
              <div className='border-border flex-grow border-t'></div>
            </div>

            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='dateRange'>By Date Range</Label>
                <DatePickerWithRange
                  date={dateRange}
                  onDateChange={setDateRange}
                  disabled={!!numTransactions}
                  minDate={accountDateRange?.from}
                  maxDate={accountDateRange?.to}
                  noLabel
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='numTransactions'>By Latest Transactions</Label>
                <Input
                  id='numTransactions'
                  type='number'
                  placeholder='e.g., 100'
                  value={numTransactions}
                  onChange={(e) => {
                    setNumTransactions(e.target.value);
                    if (e.target.value) setDateRange(undefined);
                  }}
                  disabled={!!dateRange?.from}
                />
              </div>
            </div>

            <Button type='submit' disabled={isGenerating} className='w-full'>
              {isGenerating ? (
                <Icon name='loader2' className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Icon name='download' className='mr-2 h-4 w-4' />
              )}
              Generate Statement
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatementPage;
