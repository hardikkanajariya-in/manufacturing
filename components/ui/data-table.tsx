"use client";

import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DATA_TABLE_MIN_HEIGHT,
  PAGE_SIZE_OPTIONS,
  type SortDirection,
} from "@/lib/data-table-types";
import type { UseDataTableResult } from "@/hooks/use-data-table";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  cell: (row: T) => React.ReactNode;
}

export interface DataTableFilterOption {
  value: string;
  label: string;
}

export interface DataTableFilter {
  id: string;
  label: string;
  options: DataTableFilterOption[];
  allLabel?: string;
}

interface DataTableProps<T> {
  table: UseDataTableResult<T>;
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  searchPlaceholder?: string;
  filters?: DataTableFilter[];
  emptyMessage?: string;
  minHeight?: string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
}

function SortIcon({
  columnId,
  sortColumnId,
  direction,
}: {
  columnId: string;
  sortColumnId: string | null;
  direction: SortDirection;
}) {
  if (sortColumnId !== columnId) {
    return <ChevronsUpDown className="size-3.5 text-muted-foreground/50" />;
  }
  return direction === "asc" ? (
    <ChevronUp className="size-3.5 text-primary" />
  ) : (
    <ChevronDown className="size-3.5 text-primary" />
  );
}

export function DataTable<T>({
  table,
  columns,
  getRowKey,
  searchPlaceholder = "Search…",
  filters = [],
  emptyMessage = "No records found.",
  minHeight = DATA_TABLE_MIN_HEIGHT,
  onRowClick,
  rowClassName,
}: DataTableProps<T>) {
  const {
    search,
    setSearch,
    filters: filterValues,
    setFilter,
    sort,
    toggleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    filteredCount,
    totalPages,
    paginatedData,
  } = table;

  const rangeStart = filteredCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, filteredCount);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 pl-9"
          />
        </div>
        {filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <Select
                key={filter.id}
                value={filterValues[filter.id] ?? "all"}
                onValueChange={(v) => v && setFilter(filter.id, v)}
              >
                <SelectTrigger className="h-9 w-[160px] text-xs">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">{filter.allLabel ?? `All ${filter.label}`}</SelectItem>
                  {filter.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        )}
      </div>

      <div className={cn("rounded-lg border border-border overflow-hidden flex flex-col", minHeight)}>
        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {columns.map((col) => (
                  <TableHead key={col.id} className={col.headerClassName}>
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.id)}
                        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                      >
                        {col.header}
                        <SortIcon
                          columnId={col.id}
                          sortColumnId={sort.columnId}
                          direction={sort.direction}
                        />
                      </button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className={cn(minHeight, "[&_tr:last-child]:border-0")}>
              {paginatedData.length === 0 ? (
                <TableRow className="hover:bg-transparent border-0">
                  <TableCell
                    colSpan={columns.length}
                    className="h-full min-h-[360px] text-center text-sm text-muted-foreground align-middle"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => (
                  <TableRow
                    key={getRowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(onRowClick && "cursor-pointer", rowClassName?.(row))}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.id} className={col.className}>
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {filteredCount === 0
              ? "0 results"
              : `Showing ${rangeStart}–${rangeEnd} of ${filteredCount}`}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Rows</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => v && setPageSize(Number(v))}
              >
                <SelectTrigger className="h-8 w-[72px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-[80px] text-center text-xs font-medium tabular-nums">
                Page {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
