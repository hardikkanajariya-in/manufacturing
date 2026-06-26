"use client";

import * as React from "react";
import type { SortDirection } from "@/lib/data-table-types";

export interface DataTableSort {
  columnId: string | null;
  direction: SortDirection;
}

export interface UseDataTableOptions<T> {
  data: T[];
  searchFn?: (row: T, query: string) => boolean;
  filterFn?: (row: T, filters: Record<string, string>) => boolean;
  getSortValue?: (row: T, columnId: string) => string | number | Date;
  pageSize?: number;
  initialSort?: DataTableSort;
}

export interface UseDataTableResult<T> {
  search: string;
  setSearch: (value: string) => void;
  filters: Record<string, string>;
  setFilter: (id: string, value: string) => void;
  sort: DataTableSort;
  toggleSort: (columnId: string) => void;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  filteredCount: number;
  totalPages: number;
  paginatedData: T[];
  filteredData: T[];
}

export function useDataTable<T>({
  data,
  searchFn,
  filterFn,
  getSortValue,
  pageSize: defaultPageSize = 10,
  initialSort = { columnId: null, direction: "desc" },
}: UseDataTableOptions<T>): UseDataTableResult<T> {
  const [search, setSearchState] = React.useState("");
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [sort, setSort] = React.useState<DataTableSort>(initialSort);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSizeState] = React.useState(defaultPageSize);

  const setSearch = (value: string) => {
    setSearchState(value);
    setPage(1);
  };

  const setFilter = (id: string, value: string) => {
    setFilters((prev) => ({ ...prev, [id]: value }));
    setPage(1);
  };

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPage(1);
  };

  const toggleSort = (columnId: string) => {
    setSort((prev) => {
      if (prev.columnId !== columnId) {
        return { columnId, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { columnId, direction: "desc" };
      }
      return { columnId: null, direction: "desc" };
    });
    setPage(1);
  };

  const filteredData = React.useMemo(() => {
    let rows = [...data];

    if (search.trim() && searchFn) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((row) => searchFn(row, q));
    }

    if (filterFn) {
      rows = rows.filter((row) => filterFn(row, filters));
    }

    if (sort.columnId && getSortValue) {
      const col = sort.columnId;
      const dir = sort.direction === "asc" ? 1 : -1;
      rows.sort((a, b) => {
        const av = getSortValue(a, col);
        const bv = getSortValue(b, col);
        if (av instanceof Date && bv instanceof Date) {
          return (av.getTime() - bv.getTime()) * dir;
        }
        if (typeof av === "number" && typeof bv === "number") {
          return (av - bv) * dir;
        }
        return String(av).localeCompare(String(bv)) * dir;
      });
    }

    return rows;
  }, [data, search, filters, sort, searchFn, filterFn, getSortValue]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  const paginatedData = React.useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize, totalPages]);

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return {
    search,
    setSearch,
    filters,
    setFilter,
    sort,
    toggleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    filteredCount: filteredData.length,
    totalPages,
    paginatedData,
    filteredData,
  };
}
