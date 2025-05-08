import debugLib from 'debug';

const debug = debugLib('holded:http');

export interface HttpRequestConfig {
  method: string;
  url: string;
  baseURL?: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface HttpResponse<T = any> {
  status: number;
  statusText: string;
  headers: Headers;
  data: T;
}

export default class HttpClient {
  private baseURL?: string;
  private defaultHeaders: Record<string, string>;

  constructor(options: { baseURL?: string; headers?: Record<string, string> } = {}) {
    this.baseURL = options.baseURL;
    this.defaultHeaders = options.headers || {};
    debug('HTTP client (fetch) created', { baseURL: this.baseURL });
  }

  async request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    const url = this.baseURL
      ? `${this.baseURL.replace(/\/$/, '')}/${config.url.replace(/^\//, '')}`
      : config.url;

    const headers = { ...this.defaultHeaders, ...(config.headers || {}) };

    debug('%s %s...', (config.method || 'GET').toUpperCase(), url);
    if (config.body) debug(config.body);
    debug(headers);

    const response = await fetch(url, {
      method: config.method,
      headers,
      body: config.body ? JSON.stringify(config.body) : undefined,
    });

    const contentType = response.headers.get('content-type');
    let data: any;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    debug('%s: %s (%d)', url, response.statusText, response.status);
    debug(data);

    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data,
    };
  }
}
