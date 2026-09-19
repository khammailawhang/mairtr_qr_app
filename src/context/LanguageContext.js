'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export const LANGUAGES = [
  { code: 'lo', label: 'Lao', flag: '🇱🇦' },
  { code: 'en', label: 'EN', flag: '🇺🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
];

export const TRANSLATIONS = {
  en: {
    waitTitle: 'Please Wait',
    waitMessage: 'Please wait for staff to activate this table...',
    waitSub: 'This screen will update automatically once your table is ready.',
    loading: 'Loading menu...',
    errorTitle: 'Something went wrong',
    errorMessage: 'Could not load this table. Please check the QR code and try again.',
    menuTitle: 'Menu',
    table: 'Table',
    noItems: 'No items available in this category right now.',
    currency: '₭',
    unavailable: 'Unavailable',
    addToCart: 'Add',
  },
  lo: {
    waitTitle: 'ກະລຸນາລໍຖ້າ',
    waitMessage: 'ກະລຸນາລໍຖ້າພະນັກງານເປີດໃຊ້ໂຕະນີ້...',
    waitSub: 'ໜ້າຈໍນີ້ຈະອັບເດດອັດຕະໂນມັດເມື່ອໂຕະຂອງທ່ານພ້ອມ.',
    loading: 'ກຳລັງໂຫຼດເມນູ...',
    errorTitle: 'ມີບາງຢ່າງຜິດພາດ',
    errorMessage: 'ບໍ່ສາມາດໂຫຼດຂໍ້ມູນໂຕະນີ້ໄດ້. ກະລຸນາກວດສອບ QR code ແລ້ວລອງໃໝ່.',
    menuTitle: 'ເມນູ',
    table: 'ໂຕະ',
    noItems: 'ບໍ່ມີລາຍການໃນໝວດນີ້ໃນຕອນນີ້.',
    currency: '₭',
    unavailable: 'ໝົດ',
    addToCart: 'ເພີ່ມ',
  },
  zh: {
    waitTitle: '请稍候',
    waitMessage: '请等待工作人员激活此餐桌...',
    waitSub: '一旦您的餐桌准备就绪，此页面将自动更新。',
    loading: '正在加载菜单...',
    errorTitle: '出现错误',
    errorMessage: '无法加载该餐桌信息，请检查二维码后重试。',
    menuTitle: '菜单',
    table: '桌号',
    noItems: '该分类暂无菜品。',
    currency: '₭',
    unavailable: '售罄',
    addToCart: '添加',
  },
  th: {
    waitTitle: 'กรุณารอสักครู่',
    waitMessage: 'กรุณารอพนักงานเปิดใช้งานโต๊ะนี้...',
    waitSub: 'หน้าจอนี้จะอัปเดตอัตโนมัติเมื่อโต๊ะของคุณพร้อม',
    loading: 'กำลังโหลดเมนู...',
    errorTitle: 'เกิดข้อผิดพลาด',
    errorMessage: 'ไม่สามารถโหลดข้อมูลโต๊ะนี้ได้ กรุณาตรวจสอบ QR code แล้วลองใหม่',
    menuTitle: 'เมนู',
    table: 'โต๊ะ',
    noItems: 'ไม่มีรายการในหมวดนี้ในขณะนี้',
    currency: '₭',
    unavailable: 'หมด',
    addToCart: 'เพิ่ม',
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  // Load saved language preference on mount
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('app_lang') : null;
    if (saved && TRANSLATIONS[saved]) {
      setLang(saved);
    }
  }, []);

  const changeLang = (code) => {
    if (!TRANSLATIONS[code]) return;
    setLang(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_lang', code);
    }
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
