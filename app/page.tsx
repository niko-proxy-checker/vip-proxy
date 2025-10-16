'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, Play, Pause, RotateCcw, Download, Settings, 
  HelpCircle, Moon, Sun, Languages, Star, Globe, Zap,
  CheckCircle, XCircle, Clock
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { translations, type Language } from '@/lib/i18n';
import { 
  Proxy, ProxyChecker, CheckerSettings, parseProxyList, 
  exportToCSV, exportToJSON
} from '@/lib/proxy-checker';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';

export default function Home() {
  const [lang, setLang] = useState<Language>('en');
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [filteredProxies, setFilteredProxies] = useState<Proxy[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filter, setFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [speedFilter, setSpeedFilter] = useState<string>('all');
  const [settings, setSettings] = useState<CheckerSettings>({
    threads: 10,
    timeout: 10,
    batchSize: 50,
    soundNotification: true
  });
  
  const { theme, setTheme } = useTheme();
  const checkerRef = useRef<ProxyChecker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const t = translations[lang];

  // Auto theme detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme]);

  // Filter proxies
  useEffect(() => {
    let filtered = proxies;
    
    if (filter !== 'all') {
      filtered = filtered.filter(p => p.status === filter);
    }
    
    if (countryFilter !== 'all') {
      filtered = filtered.filter(p => p.country === countryFilter);
    }
    
    if (speedFilter !== 'all') {
      filtered = filtered.filter(p => {
        if (!p.speed) return false;
        
        switch (speedFilter) {
          case 'fast': return p.speed < 1000;
          case 'medium': return p.speed >= 1000 && p.speed < 3000;
          case 'slow': return p.speed >= 3000;
          default: return true;
        }
      });
    }
    
    setFilteredProxies(filtered);
  }, [proxies, filter, countryFilter, speedFilter]);

  // Get unique countries
  const countries = Array.from(new Set(proxies.filter(p => p.country).map(p => p.country as string))) as string[];

  // Calculate stats
  const stats = {
    total: proxies.length,
    valid: proxies.filter(p => p.status === 'valid').length,
    invalid: proxies.filter(p => p.status === 'invalid').length,
    testing: proxies.filter(p => p.status === 'testing').length,
    avgSpeed: proxies.filter(p => p.speed).reduce((acc, p) => acc + (p.speed || 0), 0) / proxies.filter(p => p.speed).length || 0
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsedProxies = parseProxyList(text);
      setProxies(parsedProxies);
      setProgress(0);
    };
    reader.readAsText(file);
  };

  const handleStart = async () => {
    if (proxies.length === 0) return;
    
    setIsRunning(true);
    setIsPaused(false);
    
    const checker = new ProxyChecker(
      proxies,
      settings,
      (updatedProxies, newProgress) => {
        setProxies(updatedProxies);
        setProgress(newProgress);
      }
    );
    
    checkerRef.current = checker;
    await checker.start();
    
    setIsRunning(false);
    
    if (settings.soundNotification && audioRef.current) {
      audioRef.current.play();
    }
  };

  const handlePause = () => {
    if (checkerRef.current) {
      if (isPaused) {
        checkerRef.current.resume();
        setIsPaused(false);
      } else {
        checkerRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const handleStop = () => {
    if (checkerRef.current) {
      checkerRef.current.stop();
      setIsRunning(false);
      setIsPaused(false);
    }
  };

  const handleClear = () => {
    setProxies([]);
    setProgress(0);
    setFilter('all');
    setCountryFilter('all');
    setSpeedFilter('all');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRetestInvalid = async () => {
    const invalidProxies = proxies.filter(p => p.status === 'invalid');
    invalidProxies.forEach(p => p.status = 'pending');
    setProxies([...proxies]);
    await handleStart();
  };

  const handleExport = (format: 'csv' | 'json') => {
    const data = format === 'csv' ? exportToCSV(proxies) : exportToJSON(proxies);
    const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proxies.${format}`;
    a.click();
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'HTTP': return 'badge-http';
      case 'HTTPS': return 'badge-https';
      case 'SOCKS4': return 'badge-socks4';
      case 'SOCKS5': return 'badge-socks5';
      default: return '';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'valid': return 'badge-gradient-valid';
      case 'invalid': return 'badge-gradient-invalid';
      case 'testing': return 'badge-gradient-testing';
      case 'pending': return 'badge-gradient-pending';
      default: return '';
    }
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 ${lang === 'fa' ? 'rtl' : 'ltr'}`}>
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77eafTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgs7y2Ik2CBlou+3mn00QDFCn4/C2YxwGOJLX8sx5LAUkd8fw3ZBBChRetevrqFUUCkaf4PK+bCEFK4LO8tmJNggZaLvt5p9NEAxQp+PwtmMcBjiS1/LMeSwFJHfH8N2QQAoUXrTr66hVFApGn+DyvmwhBSuCzvLZiTYIGWi77eafTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgs7y2Yk2CBlou+3mn00QDFCn4/C2YxwGOJLX8sx5LAUkd8fw3ZBBChRetevrqFUUCkaf4PK+bCEFK4LO8tmJNggZaLvt5p9NEAxQp+PwtmMcBjiS1/LMeSwFJHfH8N2QQAoUXrTr66hVFApGn+DyvmwhBSuCzvLZiTYIGWi77eafTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgs7y2Yk2CBlou+3mn00QDFCn4/C2Yx" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLang(lang === 'en' ? 'fa' : 'en')}
            >
              <Languages className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.settings_modal.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{t.settings_modal.threads}</Label>
                    <Input
                      type="number"
                      value={settings.threads}
                      onChange={(e) => setSettings({ ...settings, threads: parseInt(e.target.value) })}
                      min={1}
                      max={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.settings_modal.timeout}</Label>
                    <Input
                      type="number"
                      value={settings.timeout}
                      onChange={(e) => setSettings({ ...settings, timeout: parseInt(e.target.value) })}
                      min={1}
                      max={60}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.settings_modal.batchSize}</Label>
                    <Input
                      type="number"
                      value={settings.batchSize}
                      onChange={(e) => setSettings({ ...settings, batchSize: parseInt(e.target.value) })}
                      min={1}
                      max={100}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>{t.settings_modal.soundNotification}</Label>
                    <Switch
                      checked={settings.soundNotification}
                      onCheckedChange={(checked) => setSettings({ ...settings, soundNotification: checked })}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t.help_modal.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <h3 className="font-semibold mb-1">1. {t.help_modal.step1}</h3>
                    <p className="text-sm text-muted-foreground">{t.help_modal.step1Desc}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">2. {t.help_modal.step2}</h3>
                    <p className="text-sm text-muted-foreground">{t.help_modal.step2Desc}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">3. {t.help_modal.step3}</h3>
                    <p className="text-sm text-muted-foreground">{t.help_modal.step3Desc}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">4. {t.help_modal.step4}</h3>
                    <p className="text-sm text-muted-foreground">{t.help_modal.step4Desc}</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards with Gradients */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 hover-lift stat-card-total text-white border-0">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-5 h-5 " />
              <span className="text-sm font-medium opacity-90">{t.stats.total}</span>
            </div>
            <p className="text-3xl font-bold">{stats.total}</p>
          </Card>
          
          <Card className="p-4 hover-lift stat-card-valid text-white border-0">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-5 h-5 " />
              <span className="text-sm font-medium opacity-90">{t.stats.valid}</span>
            </div>
            <p className="text-3xl font-bold">{stats.valid}</p>
          </Card>
          
          <Card className="p-4 hover-lift stat-card-invalid text-white border-0">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-5 h-5 " />
              <span className="text-sm font-medium opacity-90">{t.stats.invalid}</span>
            </div>
            <p className="text-3xl font-bold">{stats.invalid}</p>
          </Card>
          
          <Card className="p-4 hover-lift stat-card-testing text-white border-0">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5 " />
              <span className="text-sm font-medium opacity-90">{t.stats.testing}</span>
            </div>
            <p className="text-3xl font-bold">{stats.testing}</p>
          </Card>
          
          <Card className="p-4 hover-lift stat-card-speed text-white border-0">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 " />
              <span className="text-sm font-medium opacity-90">{t.stats.speed}</span>
            </div>
            <p className="text-3xl font-bold">{Math.round(stats.avgSpeed)}ms</p>
          </Card>
        </div>

        {/* Controls */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex-1"
              disabled={isRunning}
            >
              <Upload className="w-4 h-4 mr-2" />
              {t.upload}
            </Button>
            
            <Button
              onClick={handleClear}
              variant="outline"
              className="flex-1"
              disabled={isRunning || proxies.length === 0}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t.clear}
            </Button>
            
            {!isRunning ? (
              <Button
                onClick={handleStart}
                className="flex-1 btn-gradient-primary text-white"
                disabled={proxies.length === 0}
              >
                <Play className="w-4 h-4 mr-2" />
                {t.start}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handlePause}
                  variant="secondary"
                  className="flex-1"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  {isPaused ? t.resume : t.pause}
                </Button>
                
                <Button
                  onClick={handleStop}
                  variant="destructive"
                  className="flex-1"
                >
                  {t.stop}
                </Button>
              </>
            )}
            
            <Button
              onClick={handleRetestInvalid}
              variant="outline"
              className="flex-1"
              disabled={isRunning || stats.invalid === 0}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t.retestInvalid}
            </Button>
            
            <Select onValueChange={(value) => handleExport(value as 'csv' | 'json')}>
              <SelectTrigger className="flex-1" disabled={stats.valid === 0}>
                <Download className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t.export} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Progress Bar */}
          {proxies.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>{Math.round(progress)}%</span>
                <span>{stats.valid + stats.invalid} / {stats.total}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            {t.filters.all}
          </Button>
          <Button
            variant={filter === 'valid' ? 'default' : 'outline'}
            onClick={() => setFilter('valid')}
            size="sm"
          >
            {t.filters.valid}
          </Button>
          <Button
            variant={filter === 'invalid' ? 'default' : 'outline'}
            onClick={() => setFilter('invalid')}
            size="sm"
          >
            {t.filters.invalid}
          </Button>
          
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t.filters.country} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.filters.all}</SelectItem>
              {countries.map(country => (
                <SelectItem key={country} value={country as string}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={speedFilter} onValueChange={setSpeedFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t.filters.speed} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.filters.all}</SelectItem>
              <SelectItem value="fast">{t.filters.fast}</SelectItem>
              <SelectItem value="medium">{t.filters.medium}</SelectItem>
              <SelectItem value="slow">{t.filters.slow}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.table.ip}</TableHead>
                <TableHead>{t.table.port}</TableHead>
                <TableHead>{t.table.type}</TableHead>
                <TableHead>{t.table.country}</TableHead>
                <TableHead>{t.table.speed}</TableHead>
                <TableHead>{t.table.rating}</TableHead>
                <TableHead>{t.table.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProxies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {proxies.length === 0 ? t.uploadDesc : (lang === 'fa' ? 'هیچ پروکسی با این فیلتر پیدا نشد' : 'No proxies found with this filter')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProxies.map(proxy => (
                  <TableRow key={proxy.id} className="table-row-hover">
                    <TableCell className="font-mono">{proxy.ip}</TableCell>
                    <TableCell>{proxy.port}</TableCell>
                    <TableCell>
                      <Badge className={getTypeBadgeClass(proxy.type)}>
                        {proxy.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {proxy.country && (
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{proxy.country}</span>
                          <span className="text-sm">{proxy.country}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {proxy.speed && (
                        <span className={
                          proxy.speed < 1000 ? 'text-green-500 font-semibold' :
                          proxy.speed < 3000 ? 'text-yellow-500' :
                          'text-red-500'
                        }>
                          {proxy.speed}ms
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {renderStars(proxy.rating)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(proxy.status)}>
                        {proxy.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
