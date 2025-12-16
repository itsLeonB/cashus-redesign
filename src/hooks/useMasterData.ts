import { useQuery } from "@tanstack/react-query";
import { debtsApi, groupExpensesApi } from "@/lib/api";

const MASTER_DATA_STALE_TIME = Infinity;
const MASTER_DATA_GC_TIME = Infinity;

export function useTransferMethods() {
  return useQuery({
    queryKey: ["transfer-methods"],
    queryFn: debtsApi.getTransferMethods,
    staleTime: MASTER_DATA_STALE_TIME,
    gcTime: MASTER_DATA_GC_TIME,
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
