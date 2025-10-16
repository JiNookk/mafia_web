export interface OffsetPagination<T> {
  list: T[];
  meta: {
    page: number;
    totalPage: number;
    limit: number;
  };
}
