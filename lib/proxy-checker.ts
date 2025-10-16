export interface ProxyCheckResult {
  success: boolean;
  error?: string;
  speed?: number;
  country?: string;
}

export interface Proxy {
  ip: string;
  port: number;
  type: string;
  country?: string;
  speed?: number;
  status: 'pending' | 'valid' | 'invalid' | 'testing';
  rating?: number;
}

export interface CheckerSettings {
  threads: number;
  timeout: number;
  batchSize: number;
  soundNotification: boolean;
}

export type ProgressCallback = (proxies: Proxy[], progress: number) => void;

export class ProxyChecker {
  private proxies: Proxy[];
  private settings: CheckerSettings;
  private isRunning = false;
  private isPaused = false;
  private onProgress: ProgressCallback;

  constructor(proxies: Proxy[], settings: CheckerSettings, onProgress: ProgressCallback) {
    this.proxies = proxies;
    this.settings = settings;
    this.onProgress = onProgress;
  }

  setProxies(proxies: Proxy[]): void {
    this.proxies = proxies;
  }

  getProxies(): Proxy[] {
    return this.proxies;
  }

  async checkProxy(proxy: Proxy): Promise<ProxyCheckResult> {
    try {
      const response = await fetch('https://vip-proxy-api.lindy.site/api/test-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxy: `${proxy.ip}:${proxy.port}` })
      });

      const result = await response.json() as ProxyCheckResult;
      
      if (result.success) {
        return {
          success: true,
          speed: result.speed,
          country: result.country
        };
      } else {
        return {
          success: false,
          error: result.error || 'Connection failed'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async start(): Promise<void> {
    this.isRunning = true;
    this.isPaused = false;
  }

  stop(): void {
    this.isRunning = false;
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }
}

export function parseProxyList(text: string): Proxy[] {
  const lines = text.split('\n').filter(line => line.trim());
  return lines.map((line) => {
    const parts = line.trim().split(':');
    return {
      ip: parts[0],
      port: parseInt(parts[1], 10),
      type: parts[2] || 'HTTP',
      status: 'pending'
    };
  });
}

export function exportToCSV(proxies: Proxy[]): string {
  const headers = ['IP', 'Port', 'Type', 'Country', 'Speed', 'Status', 'Rating'];
  const rows = proxies.map(p => [
    p.ip,
    p.port,
    p.type,
    p.country || '',
    p.speed || '',
    p.status,
    p.rating || ''
  ]);
  
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  return csv;
}

export function exportToJSON(proxies: Proxy[]): string {
  return JSON.stringify(proxies, null, 2);
}
