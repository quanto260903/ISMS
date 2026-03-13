export interface ApiResponse<T> {
isSuccess: boolean;
message: string;
statusCode?: number;
responseCode?: string;
data?: T;
}
