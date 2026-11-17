import { useQuery } from '@tanstack/react-query';
import { activityApi } from '../api/endpoints';
import type { ListActivityQuery } from '../api/types';
import { queryKeys } from './keys';

export function useActivity(query: ListActivityQuery = {}) {
  return useQuery({
    queryKey: queryKeys.activity.list(query),
    queryFn: ({ signal }) => activityApi.list(query, signal),
    select: (page) => page.data,
  });
}
