import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/services/api';

export type EntityName = string;
export type EntityMutationOp = 'create' | 'update' | 'delete';

export interface EntityRecord {
  id: string | number;
  [key: string]: unknown;
}

export interface MutationInput<T> {
  /** id is required for 'update' and 'delete'; ignored for 'create'. */
  id?: string | number;
  /** Payload is required for 'create' and 'update'; ignored for 'delete'. */
  data?: Partial<T>;
}

const listKey = (name: EntityName) => ['entity', name] as const;
const detailKey = (name: EntityName, id: string | number) => ['entity', name, id] as const;

const listPath = (name: EntityName): string => '/api/' + name;
const detailPath = (name: EntityName, id: string | number): string => '/api/' + name + '/' + String(id);

/**
 * Fetch the canonical entity list. Returns the same shape TanStack Query
 * always returns ({ data, isLoading, error, refetch, ... }) so screens can
 * destructure without translation. data is undefined while loading; default
 * to [] at the call site (e.g. `const { data: items = [] } = useEntityList(...)`).
 */
export function useEntityList<T extends EntityRecord = EntityRecord>(name: EntityName): UseQueryResult<T[], unknown> {
  return useQuery<T[], unknown>({
    queryKey: listKey(name),
    queryFn: async () => {
      const res = await apiGet<T[]>(listPath(name));
      return Array.isArray(res) ? res : [];
    },
  });
}

/**
 * Fetch a single entity by id. Skips the request when id is falsy so it's
 * safe to call from screens before the route param is resolved.
 */
export function useEntityDetail<T extends EntityRecord = EntityRecord>(
  name: EntityName,
  id: string | number | undefined | null,
): UseQueryResult<T | null, unknown> {
  return useQuery<T | null, unknown>({
    queryKey: id != null ? detailKey(name, id) : [...listKey(name), 'no-id'],
    queryFn: async () => {
      if (id == null) return null;
      return apiGet<T>(detailPath(name, id));
    },
    enabled: id != null,
  });
}

/**
 * Canonical CRUD mutation. Returns a TanStack Query mutation that:
 *   • Routes input.data through apiPost / apiPatch / apiDelete based on op.
 *   • Optimistically updates the cached list (create appends, update merges,
 *     delete filters out).
 *   • Rolls back on error so the UI stays correct without manual handling.
 *   • Invalidates list + detail keys on settle so any other screen refetches.
 *
 * Usage (Phase 2 rewire target):
 *   const { mutate: createNote, isPending } = useEntityMutation<Note>('notes', 'create');
 *   createNote({ data: { title: 'Hello' } });
 */
export function useEntityMutation<T extends EntityRecord = EntityRecord>(
  name: EntityName,
  op: EntityMutationOp,
): UseMutationResult<T | null, unknown, MutationInput<T>, { prevList: T[] | undefined }> {
  const qc = useQueryClient();

  return useMutation<T | null, unknown, MutationInput<T>, { prevList: T[] | undefined }>({
    mutationFn: async (input) => {
      if (op === 'create') {
        return apiPost<T>(listPath(name), input.data ?? {});
      }
      if (op === 'update') {
        if (input.id == null) throw new Error('useEntityMutation(update): missing id');
        return apiPatch<T>(detailPath(name, input.id), input.data ?? {});
      }
      // delete
      if (input.id == null) throw new Error('useEntityMutation(delete): missing id');
      await apiDelete(detailPath(name, input.id));
      return null;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: listKey(name) });
      const prevList = qc.getQueryData<T[]>(listKey(name));
      if (prevList) {
        if (op === 'create' && input.data) {
          // Synthetic id so the optimistic row has a stable key; replaced by
          // the server response on success.
          const synthetic: T = { id: 'tmp-' + Date.now(), ...(input.data as object) } as T;
          qc.setQueryData<T[]>(listKey(name), [...prevList, synthetic]);
        } else if (op === 'update' && input.id != null) {
          qc.setQueryData<T[]>(
            listKey(name),
            prevList.map((item) => (item.id === input.id ? ({ ...item, ...input.data } as T) : item)),
          );
        } else if (op === 'delete' && input.id != null) {
          qc.setQueryData<T[]>(
            listKey(name),
            prevList.filter((item) => item.id !== input.id),
          );
        }
      }
      return { prevList };
    },
    onError: (_err, _input, context) => {
      if (context?.prevList) {
        qc.setQueryData(listKey(name), context.prevList);
      }
    },
    onSettled: (_data, _err, input) => {
      qc.invalidateQueries({ queryKey: listKey(name) });
      if (input?.id != null) {
        qc.invalidateQueries({ queryKey: detailKey(name, input.id) });
      }
    },
  });
}
