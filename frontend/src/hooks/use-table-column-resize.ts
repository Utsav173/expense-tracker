'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ColumnSizingState } from '@tanstack/react-table';

/**
 * Custom hook to manage table column sizing with localStorage persistence.
 * @param tableId - A unique identifier for the table to store its state.
 * @param enableResizing - A boolean to enable or disable this functionality.
 * @returns An object with column sizing state and control functions.
 */
export function useTableColumnResize(tableId: string, enableResizing: boolean = true) {
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const initialLoadComplete = useRef(false);

  useEffect(() => {
    if (enableResizing && !initialLoadComplete.current) {
      try {
        const savedSizing = localStorage.getItem(`table-column-sizing-${tableId}`);
        if (savedSizing) {
          const parsed = JSON.parse(savedSizing);
          setColumnSizing(parsed);
        }
      } catch (error) {
        console.warn('Failed to load saved column sizing from localStorage:', error);
      } finally {
        initialLoadComplete.current = true;
      }
    }
  }, [tableId, enableResizing]);

  useEffect(() => {
    if (enableResizing && initialLoadComplete.current) {
      try {
        localStorage.setItem(`table-column-sizing-${tableId}`, JSON.stringify(columnSizing));
      } catch (error) {
        console.warn('Failed to save column sizing to localStorage:', error);
      }
    }
  }, [columnSizing, tableId, enableResizing]);

  const resetColumnSizing = useCallback(() => {
    setColumnSizing({});
    if (enableResizing) {
      try {
        localStorage.removeItem(`table-column-sizing-${tableId}`);
      } catch (error) {
        console.warn('Failed to remove column sizing from localStorage:', error);
      }
    }
  }, [enableResizing, tableId]);

  return {
    columnSizing,
    setColumnSizing,
    resetColumnSizing
  };
}
