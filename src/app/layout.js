import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';

export const metadata = {
  title: 'Table QR Ordering',
  description: 'Scan, order, and enjoy — right from your table.',
};

export default function RootLayout({ children }) {
  return (
    // ✅ ໃສ່ suppressHydrationWarning ໄວ້ທີ່ແທັກເປີດ html ບ່ອນດຽວຄືເກົ່າ ປອດໄພທີ່ສຸດ
    // 🎯 [ສູດປິດບັກ Hydration 100%]: ບັງຄັບໃສ່ suppressHydrationWarning={true} ທີ່ແທັກ body ເພື່ອທຸບລ້າງບັກແດງຫຼົ້ມອອກໄປຖາວອນ
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning={true}>
        {/*
          LanguageProvider is a client component that manages the
          active language (en / lo / zh / th) and exposes it via
          the useLanguage() hook to every page in the app,
          including src/app/customer/[table_id]/page.js.
        */}
        <LanguageProvider>{children}</LanguageProvider>
      </body> 
    </html>
  );
}
