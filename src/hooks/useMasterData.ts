import { useQuery } from "@tanstack/react-query";
import { debtsApi, groupExpensesApi } from "@/lib/api";
import { TransferMethodFilter } from "@/lib/api/debts";

const MASTER_DATA_STALE_TIME = Infinity;
const MASTER_DATA_GC_TIME = Infinity;

export function useTransferMethods(filter: TransferMethodFilter, enabled = true) {
  return useQuery({
    queryKey: ["transfer-methods", filter],
    queryFn: () => debtsApi.getTransferMethods(filter),
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useCalculationMethods() {
  return useQuery({
    queryKey: ["calculation-methods"],
    queryFn: groupExpensesApi.getCalculationMethods,
    staleTime: MASTER_DATA_STALE_TIME,
    gcTime: MASTER_DATA_GC_TIME,
  });
}
