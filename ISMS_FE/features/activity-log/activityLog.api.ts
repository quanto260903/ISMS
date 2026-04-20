import { baseApi } from "@/services/baseApi";
import type { ActivityLogResult } from "./types/activityLog.types";

export const getActivityLogs = async (params: {
  module?:   string;
  fromDate?: string;
  toDate?:   string;
  keyword?:  string;
  page?:     number;
  pageSize?: number;
}): Promise<ActivityLogResult> => {
  const q = new URLSearchParams();
  if (params.module)   q.set("module",   params.module);
  if (params.fromDate) q.set("fromDate", params.fromDate);
  if (params.toDate)   q.set("toDate",   params.toDate);
  if (params.keyword)  q.set("keyword",  params.keyword);
  q.set("page",     String(params.page     ?? 1));
  q.set("pageSize", String(params.pageSize ?? 50));

  const res = await baseApi.get<{ data: ActivityLogResult }>(`/ActivityLog/list?${q}`);
  return res.data;
};
