class ApiClient {
  private basePrefix: string;

  // Defaults to '/api'. Next.js rewrites will catch this and route to the Gateway.
  constructor(basePrefix: string = '/api') {
    this.basePrefix = basePrefix;
  }

  public getBaseUrl(endpoint: string): string {
    return `${this.basePrefix}${endpoint}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.getBaseUrl(endpoint);
    
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // CRITICAL: Ensures browser cookies go to the Gateway
    });

    if (!res.ok) {
      // You can add global error handling here later (e.g., redirect on 401)
      throw res;
    }

    const text = await res.text();
    if (!text) {
      return {} as T;
    }

    // Automatically parse and return the JSON payload
    return JSON.parse(text) as T;
  }

  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
  }

  put<T>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
  }

  delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  patch<T>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
  }
}

export function getGatewayApiBase(): string {
  const candidate =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_GATEWAY_URL ??
    process.env.GATEWAY_URL;

  const base = candidate ?? 'https://gateway-service:8443';
  const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
}

// Export a single instance to be used across the app
export const apiClient = new ApiClient();