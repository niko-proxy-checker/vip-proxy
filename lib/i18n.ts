export type Language = 'en' | 'fa';

export const translations = {
  en: {
    title: 'Vip-Proxy/ByA.S',
    subtitle: 'Professional Proxy Checker',
    upload: 'Upload Proxies',
    start: 'Start Test',
    stop: 'Stop',
    pause: 'Pause',
    resume: 'Resume',
    clear: 'Clear All',
    retestInvalid: 'Retest Invalid',
    export: 'Export Results',
    uploadDesc: 'Upload your proxy list (one per line)',
    stats: {
      total: 'Total',
      valid: 'Valid',
      invalid: 'Invalid',
      testing: 'Testing',
      speed: 'Avg Speed'
    },
    filters: {
      all: 'All',
      valid: 'Valid',
      invalid: 'Invalid',
      country: 'Country',
      speed: 'Speed',
      fast: 'Fast (<1s)',
      medium: 'Medium (1-3s)',
      slow: 'Slow (>3s)'
    },
    table: {
      ip: 'IP Address',
      port: 'Port',
      type: 'Type',
      country: 'Country',
      speed: 'Speed',
      rating: 'Rating',
      status: 'Status'
    },
    settings_modal: {
      title: 'Settings',
      threads: 'Threads',
      timeout: 'Timeout (seconds)',
      batchSize: 'Batch Size',
      soundNotification: 'Sound Notification'
    },
    help_modal: {
      title: 'How to Use',
      step1: 'Upload Proxy List',
      step1Desc: 'Click "Upload Proxies" and select a .txt file with proxies (format: IP:PORT or protocol://IP:PORT)',
      step2: 'Configure Settings',
      step2Desc: 'Click the settings icon to adjust threads, timeout, and batch size',
      step3: 'Start Testing',
      step3Desc: 'Click "Start Test" to begin checking proxies. You can pause/resume anytime',
      step4: 'Export Results',
      step4Desc: 'After testing, export valid proxies to CSV or JSON format'
    }
  },
  fa: {
    title: 'Vip-Proxy/ByA.S',
    subtitle: 'چکر حرفه‌ای پروکسی',
    upload: 'آپلود پروکسی',
    start: 'شروع تست',
    stop: 'توقف',
    pause: 'مکث',
    resume: 'ادامه',
    clear: 'پاک کردن همه',
    retestInvalid: 'تست مجدد نامعتبرها',
    export: 'خروجی نتایج',
    uploadDesc: 'لیست پروکسی خود را آپلود کنید (هر خط یک پروکسی)',
    stats: {
      total: 'کل',
      valid: 'معتبر',
      invalid: 'نامعتبر',
      testing: 'در حال تست',
      speed: 'سرعت متوسط'
    },
    filters: {
      all: 'همه',
      valid: 'معتبر',
      invalid: 'نامعتبر',
      country: 'کشور',
      speed: 'سرعت',
      fast: 'سریع (<۱ثانیه)',
      medium: 'متوسط (۱-۳ثانیه)',
      slow: 'کند (>۳ثانیه)'
    },
    table: {
      ip: 'آدرس IP',
      port: 'پورت',
      type: 'نوع',
      country: 'کشور',
      speed: 'سرعت',
      rating: 'امتیاز',
      status: 'وضعیت'
    },
    settings_modal: {
      title: 'تنظیمات',
      threads: 'تعداد Thread',
      timeout: 'تایم‌اوت (ثانیه)',
      batchSize: 'اندازه دسته',
      soundNotification: 'اعلان صوتی'
    },
    help_modal: {
      title: 'راهنمای استفاده',
      step1: 'آپلود لیست پروکسی',
      step1Desc: 'روی "آپلود پروکسی" کلیک کنید و فایل .txt حاوی پروکسی‌ها را انتخاب کنید (فرمت: IP:PORT یا protocol://IP:PORT)',
      step2: 'تنظیم پیکربندی',
      step2Desc: 'روی آیکون تنظیمات کلیک کنید تا Thread، تایم‌اوت و اندازه دسته را تنظیم کنید',
      step3: 'شروع تست',
      step3Desc: 'روی "شروع تست" کلیک کنید تا بررسی پروکسی‌ها آغاز شود. می‌توانید هر زمان مکث/ادامه دهید',
      step4: 'خروجی نتایج',
      step4Desc: 'پس از تست، پروکسی‌های معتبر را به فرمت CSV یا JSON خروجی بگیرید'
    }
  }
};
