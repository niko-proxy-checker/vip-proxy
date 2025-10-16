export interface Proxy {
  id: string;
  ip: string;
  port: string;
  type: 'HTTP' | 'HTTPS' | 'SOCKS4' | 'SOCKS5';
  status: 'pending' | 'testing' | 'valid' | 'invalid';
  speed?: number;
  country?: string;
  countryCode?: string;
  rating?: number;
  error?: string;
}

export interface CheckerSettings {
  threads: number;
  timeout: number;
  batchSize: number;
  soundNotification: boolean;
}

export interface ProxyTestResult {
  success: boolean;
  speed?: number;
  country?: string;
  countryCode?: string;
  error?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vip-proxy-api.lindy.site';

export function parseProxyList(text: string): Proxy[] {
  const lines = text.split('\n').filter(line => line.trim());
  const proxies: Proxy[] = [];
  
  lines.forEach((line, index) => {
    line = line.trim();
    if (!line) return;
    
    let type: Proxy['type'] = 'HTTP';
    let proxyString = line;
    
    // Check for protocol prefix
    if (line.startsWith('http://')) {
      type = 'HTTP';
      proxyString = line.replace('http://', '');
    } else if (line.startsWith('https://')) {
      type = 'HTTPS';
      proxyString = line.replace('https://', '');
    } else if (line.startsWith('socks4://')) {
      type = 'SOCKS4';
      proxyString = line.replace('socks4://', '');
    } else if (line.startsWith('socks5://')) {
      type = 'SOCKS5';
      proxyString = line.replace('socks5://', '');
    }
    
    const [ip, port] = proxyString.split(':');
    
    if (ip && port) {
      // Port-based detection if no protocol prefix
      if (line.indexOf('://') === -1) {
        const portNum = parseInt(port);
        if (portNum === 1080) {
          type = 'SOCKS5';
        } else if (portNum === 1081) {
          type = 'SOCKS4';
        } else if (portNum === 443 || portNum === 8443) {
          type = 'HTTPS';
        }
      }
      
      proxies.push({
        id: `${ip}:${port}-${index}`,
        ip,
        port,
        type,
        status: 'pending'
      });
    }
  });
  
  return proxies;
}

export async function testProxy(proxy: Proxy, timeout: number = 10): Promise<ProxyTestResult> {
  try {
    const response = await fetch(`${API_URL}/api/test-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ip: proxy.ip,
        port: proxy.port,
        type: proxy.type,
        timeout
      }),
      signal: AbortSignal.timeout(timeout * 1000 + 2000)
    });
    
    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        speed: result.speed,
        country: result.country,
        countryCode: result.countryCode
      };
    } else {
      return {
        success: false,
        error: result.error || 'Connection failed'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Request failed'
    };
  }
}

export function calculateRating(speed: number): number {
  if (speed < 500) return 5;
  if (speed < 1000) return 4;
  if (speed < 2000) return 3;
  if (speed < 3000) return 2;
  return 1;
}

export class ProxyChecker {
  private proxies: Proxy[];
  private settings: CheckerSettings;
  private onUpdate: (proxies: Proxy[], progress: number) => void;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private currentIndex: number = 0;
  
  constructor(
    proxies: Proxy[],
    settings: CheckerSettings,
    onUpdate: (proxies: Proxy[], progress: number) => void
  ) {
    this.proxies = proxies;
    this.settings = settings;
    this.onUpdate = onUpdate;
  }
  
  async start() {
    this.isRunning = true;
    this.isPaused = false;
    
    const pendingProxies = this.proxies.filter(p => p.status === 'pending');
    const batches: Proxy[][] = [];
    
    for (let i = 0; i < pendingProxies.length; i += this.settings.batchSize) {
      batches.push(pendingProxies.slice(i, i + this.settings.batchSize));
    }
    
    for (const batch of batches) {
      if (!this.isRunning) break;
      
      while (this.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      await this.processBatch(batch);
    }
    
    this.isRunning = false;
  }
  
  private async processBatch(batch: Proxy[]) {
    const chunks: Proxy[][] = [];
    for (let i = 0; i < batch.length; i += this.settings.threads) {
      chunks.push(batch.slice(i, i + this.settings.threads));
    }
    
    for (const chunk of chunks) {
      if (!this.isRunning) break;
      
      while (this.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Mark as testing
      chunk.forEach(proxy => {
        proxy.status = 'testing';
      });
      this.updateProgress();
      
      // Test in parallel
      await Promise.all(
        chunk.map(async (proxy) => {
          const result = await testProxy(proxy, this.settings.timeout);
          
          if (result.success) {
            proxy.status = 'valid';
            proxy.speed = result.speed;
            proxy.country = result.country;
            proxy.countryCode = result.countryCode;
            proxy.rating = result.speed ? calculateRating(result.speed) : undefined;
          } else {
            proxy.status = 'invalid';
            proxy.error = result.error;
          }
          
          this.currentIndex++;
          this.updateProgress();
        })
      );
    }
  }
  
  private updateProgress() {
    const total = this.proxies.length;
    const tested = this.proxies.filter(p => p.status === 'valid' || p.status === 'invalid').length;
    const progress = total > 0 ? (tested / total) * 100 : 0;
    
    this.onUpdate([...this.proxies], progress);
  }
  
  pause() {
    this.isPaused = true;
  }
  
  resume() {
    this.isPaused = false;
  }
  
  stop() {
    this.isRunning = false;
    this.isPaused = false;
  }
  
  isActive() {
    return this.isRunning;
  }
}

export function exportToCSV(proxies: Proxy[]): string {
  const validProxies = proxies.filter(p => p.status === 'valid');
  const headers = ['IP', 'Port', 'Type', 'Speed (ms)', 'Country', 'Rating'];
  const rows = validProxies.map(p => [
    p.ip,
    p.port,
    p.type,
    p.speed?.toString() || '',
    p.country || '',
    p.rating?.toString() || ''
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export function exportToJSON(proxies: Proxy[]): string {
  const validProxies = proxies.filter(p => p.status === 'valid').map(p => ({
    ip: p.ip,
    port: p.port,
    type: p.type,
    speed: p.speed,
    country: p.country,
    countryCode: p.countryCode,
    rating: p.rating
  }));
  
  return JSON.stringify(validProxies, null, 2);
}
