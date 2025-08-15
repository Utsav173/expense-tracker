'use client';

import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '../ui/card';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import { format, isValid, parseISO } from 'date-fns';
import startCase from 'lodash/startCase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';

interface AiRecordsTableProps {
  records: any[];
}

const PREVIEW_ROW_LIMIT = 5;

const RecordsTableContent = ({
  records,
  headers,
  formatCellValue
}: {
  records: any[];
  headers: string[];
  formatCellValue: (value: any, key: string, row: any) => string;
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        {headers.map((header) => (
          <TableHead key={header} className='text-xs font-semibold whitespace-nowrap'>
            {startCase(header)}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {records.map((row, rowIndex) => (
        <TableRow key={rowIndex}>
          {headers.map((header) => (
            <TableCell key={`${rowIndex}-${header}`} className='py-2 text-xs whitespace-nowrap'>
              {formatCellValue(row[header], header, row)}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const AiRecordsTable: React.FC<AiRecordsTableProps> = ({ records }) => {
  const { session } = useAuth();
  const user = session?.user;
  const currency = user?.preferredCurrency || 'INR';

  const headers = useMemo(() => {
    if (!records || records.length === 0) return [];

    const excludedKeys = new Set([
      'id',
      'updatedAt',
      'owner',
      'createdBy',
      'updatedBy',
      'account',
      'userId',
      'category'
    ]);

    const allKeys = Object.keys(records[0]);

    return allKeys.filter((key) => {
      if (excludedKeys.has(key)) {
        return false;
      }

      const isColumnEffectivelyEmpty = records.every(
        (record) => record[key] === null || record[key] === undefined
      );

      return !isColumnEffectivelyEmpty;
    });
  }, [records]);

  const formatCellValue = (value: any, key: string, row: any): string => {
    if (value === null || value === undefined) return 'N/A';

    if (typeof value === 'object' && value !== null) {
      return value.name || JSON.stringify(value);
    }

    if (typeof value === 'boolean') {
      if (key.toLowerCase() === 'isincome') {
        return value ? 'Income' : 'Expense';
      }
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'number') {
      const lowerCaseKey = key.toLowerCase();
      if (
        lowerCaseKey.includes('id') ||
        lowerCaseKey.includes('year') ||
        (value > 1900 && value < 2100 && Number.isInteger(value))
      ) {
        return String(value);
      }
      const rowCurrency = row.currency || currency;
      return formatCurrency(value, rowCurrency);
    }

    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
        const date = parseISO(value);
        if (isValid(date)) {
          return format(date, 'MMM d, yyyy');
        }
      }
    }

    return String(value);
  };

  if (!records || records.length === 0 || headers.length === 0) {
    return null;
  }

  const showPreview = records.length > PREVIEW_ROW_LIMIT;
  const recordsToShow = showPreview ? records.slice(0, PREVIEW_ROW_LIMIT) : records;

  return (
    <Card className='bg-muted/50 mt-2'>
      <CardContent className='p-2'>
        <ScrollArea className='max-h-72 w-full rounded-md border'>
          <RecordsTableContent
            records={recordsToShow}
            headers={headers}
            formatCellValue={formatCellValue}
          />
        </ScrollArea>

        {showPreview && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant='ghost' className='text-primary mt-2 w-full text-xs'>
                View all {records.length} records
                <Icon name='arrowRight' className='ml-2 h-3 w-3' />
              </Button>
            </DialogTrigger>
            <DialogContent className='max-h-[80vh] max-w-4xl'>
              <DialogHeader>
                <DialogTitle>Full Record List</DialogTitle>
                <DialogDescription>
                  Showing all {records.length} records returned by the AI.
                </DialogDescription>
              </DialogHeader>
              <div className='mt-4'>
                <ScrollArea className='h-[60vh] w-full rounded-md border'>
                  <RecordsTableContent
                    records={records}
                    headers={headers}
                    formatCellValue={formatCellValue}
                  />
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

export default AiRecordsTable;
