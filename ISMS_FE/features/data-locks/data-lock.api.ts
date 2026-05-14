import { baseApi } from "@/services/baseApi";
import type {
  DataLock,
  GetCurrentLockResponse,
  LockDataRequest,
  LockModule,
} from "./types/data-lock";

// GET /api/DataLocks/{module}
export async function getCurrentLock(
  module: LockModule
): Promise<GetCurrentLockResponse> {
  return baseApi.get<GetCurrentLockResponse>(`/DataLocks/${module}`);
}

// GET tất cả module song song
export async function getAllLocks(): Promise<
  Record<LockModule, GetCurrentLockResponse>
> {
  const modules: LockModule[] = ["INVENTORY", "CASH", "BANK", "CUSTOMER"];
  const results = await Promise.all(modules.map(getCurrentLock));
  return Object.fromEntries(
    modules.map((m, i) => [m, results[i]])
  ) as Record<LockModule, GetCurrentLockResponse>;
}

// POST /api/DataLocks/{module}/lock
export async function lockData(
  module: LockModule,
  body: LockDataRequest
): Promise<DataLock> {
  return baseApi.post<DataLock>(`/DataLocks/${module}/lock`, body);
}

// POST /api/DataLocks/{module}/unlock
export async function unlockData(module: LockModule): Promise<DataLock> {
  return baseApi.post<DataLock>(`/DataLocks/${module}/unlock`, {});
}