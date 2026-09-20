'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function RowTableQRCode({ table, tableNumber: fallbackNumber }) {
  const [qrImageUrl, setQrImageUrl] = useState('');

  // 🎯 [🎯 ສູດປິດບັກຫຼັກ 100%]: ກວດເຊັກທຸກມິຕິ ຫາກຝັ່ງ owner ສົ່ງ table.table_number ມາ ຫຼື ສົ່ງ tableNumber ມາ ກໍຈະດຶງຄ່າເລກໂຕະໄດ້ຢ່າງຖືກຕ້ອງເປະ 100%
  let actualTableNumber = '';
  
  if (table && typeof table === 'object') {
    actualTableNumber = table.table_number || table.id || '';
  } else if (table) {
    actualTableNumber = String(table);
  } else if (fallbackNumber) {
    actualTableNumber = String(fallbackNumber);
  }

  const tableName = (table && typeof table === 'object' && table.name_lo) || `ໂຕະ #${actualTableNumber}`;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const targetUrl = `${baseUrl}/customer/${actualTableNumber}`;

  useEffect(() => {
    if (actualTableNumber) {
      QRCode.toDataURL(targetUrl, { width: 200, margin: 1 })
        .then(url => setQrImageUrl(url))
        .catch(err => console.error(err));
    }
  }, [actualTableNumber, targetUrl]);

  const handlePrint = (e) => {
    e.stopPropagation();
    if (!actualTableNumber) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${tableName}</title>
          <style>
            body { text-align: center; font-family: sans-serif; padding-top: 60px; }
            .card { border: 3px dashed #000; display: inline-block; padding: 40px; border-radius: 20px; }
            h1 { font-size: 36px; margin: 0 0 10px 0; }
            p { font-size: 20px; color: #555; margin: 0 0 20px 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${tableName}</h1>
            <p>ຍິງ QR Code ເພື່ອສັ່ງອາຫານ</p>
            <img src="${qrImageUrl}" width="260" height="260" />
          </div>
          <script>window.onload = function() { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!actualTableNumber) return null;

  return (
    <div className="flex items-center gap-3">
      <picture>
        {qrImageUrl ? (
          <img 
            src={qrImageUrl} 
            alt={`QR Table ${actualTableNumber}`} 
            className="w-12 h-12 bg-white border border-gray-200 p-0.5 rounded shadow-sm hover:scale-110 transition cursor-pointer"
            onClick={() => window.open(targetUrl, '_blank')}
            title="ກົດເພື່ອທົດສອບເປີດໜ້າສັ່ງອາຫານລູກຄ້າ"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded animate-pulse" />
        )}
      </picture>
      <button 
        type="button" 
        onClick={handlePrint}
        className="bg-gray-900 hover:bg-black text-white text-[10px] font-black px-2 py-1 rounded transition"
      >
        🖨️ ປິ່ນ QR
      </button>
    </div>
  );
}
