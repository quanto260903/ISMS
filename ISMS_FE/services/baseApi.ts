// services/baseApi.ts
import axiosInstance from "./axios";

export const baseApi = {
  get:    <T>(url: string) => axiosInstance.get<T>(url).then(r => r.data),
  post:   <T>(url: string, data: unknown) => axiosInstance.post<T>(url, data).then(r => r.data),
  put:    <T>(url: string, data: unknown) => axiosInstance.put<T>(url, data).then(r => r.data),
  delete: <T>(url: string) => axiosInstance.delete<T>(url).then(r => r.data),
};