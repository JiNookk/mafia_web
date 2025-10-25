import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  message?: string;
}

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // 응답 인터셉터 설정
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );
  }

  private async request<T, D = Record<string, never>>(
    method: 'get' | 'post' | 'put' | 'delete',
    endpoint: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.request<T>({
        method,
        url: endpoint,
        data,
        ...config,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        return {
          success: false,
          error: errorData?.message || error.message || 'API 요청에 실패했습니다',
          errorCode: errorData?.errorCode,
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : '네트워크 오류가 발생했습니다',
      };
    }
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('get', endpoint, undefined, config);
  }

  async post<T, D = Record<string, never>>(
    endpoint: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T, D>('post', endpoint, data, config);
  }

  async put<T, D = Record<string, never>>(
    endpoint: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T, D>('put', endpoint, data, config);
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('delete', endpoint, undefined, config);
  }
}

export const apiClient = new ApiClient(API_URL);
