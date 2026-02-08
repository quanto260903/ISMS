// AI Search API Service
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Types for AI Search (Updated for new response structure)
export interface ColumnMapping {
  [key: string]: string; // English key -> Vietnamese label
}

export interface MetadataSchema {
  name: string;
  type: string;
  source: string;
  description: string;
}

export interface Metadata {
  main_table_schema: MetadataSchema[];
  validation: {
    used_tables: string[];
    used_columns: string[];
    joins: string[];
    assumptions: string[];
  };
  summary_query_available: boolean;
}

export interface AISearchResult {
  sql: string;
  result: any[]; // Array of data records
  columnMapping: ColumnMapping;
  metadata: Metadata;
}

export interface AISearchResponse {
  isSuccess: boolean;
  responseCode: string;
  statusCode: number;
  data: AISearchResult;
  message: string;
}

export const aiSearchApi = {
  // Search by voice/text query
  search: async (query: string): Promise<AISearchResponse> => {
    const { data } = await apiClient.post('/text-to-sql/query', { naturalLanguage: query });
    return data;
  },

  // Get search history (if available)
  getHistory: async (): Promise<any> => {
    const { data } = await apiClient.get('/text-to-sql/history');
    return data;
  },
};

export default aiSearchApi;
