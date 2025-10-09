export interface OffsetPagination<T> {
  list: T[];
  meta: {
    total: number;
    page: number;
    size: number;
  };
}
