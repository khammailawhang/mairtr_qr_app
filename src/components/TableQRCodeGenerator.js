'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function RowTableQRCode({ table }) {
  const [qrImageUrl, setQrImageUrl] = useState('');

  const tableNumber = table?.table_number || '';
  const tableName = table?.name_lo || `ໂຕະ #${tableNumber}`;
  const formattedNumber = String(tableNumber).padStart(2, '0');

  // 🎯 [🎯 ຈຸດປິດບັກສະແກນບໍ່ຂຶ້ນພາຍໃນຕາຕະລາງ 100%]: 
  // ໃຫ້ທ່ານປ່ຽນ '192.168.1.15' ໃຫ້ກາຍເປັນໝາຍເລກ IPv4 ຕົວຈິງຂອງຄອມພິວເຕີທ່ານ (ທີ່ໄດ້ຈາກຄຳສັ່ງ ipconfig ວັງກີ້ນີ້ເຈົ້າ) [Part 192]
  const computerIp = '192.168.43.24'; 
  
  // 💡 ບັງຄັບສ້າງ Link ໂດຍໃຊ້ໝາຍເລກ IP ປະຈຳເຄື່ອງ ພ້ອມພອດ :3000 ເພື່ອໃຫ້ມືຖືແລ່ນຫາ Docker ຜ່ານ Wi-Fi ໄດ້ຖືກຕ້ອງ [Part 192]
  const targetUrl = `http://${computerIp}:3000/customer/${tableNumber}`;

  useEffect(() => {
    if (tableNumber) {
      QRCode.toDataURL(targetUrl, { width: 200, margin: 1 })
        .then(url => setQrImageUrl(url))
        .catch(err => console.error(err));
    }
  }, [tableNumber, targetUrl]);

  const handlePrint = (e) => {
    e.stopPropagation(); 
    e.preventDefault();

    if (!qrImageUrl) {
      alert('⚠️ ລະບົບກຳລັງສ້າງຮູບພາບ QR Code, ກະລຸນາລອງໃໝ່ອີກຄັ້ງໃນ 1 ວິນາທີ!');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ໂຕະ ${formattedNumber}</title>
          <style>
            body { text-align: center; font-family: sans-serif; padding-top: 60px; background: #ffffff; }
            .card { border: 4px dashed #000000; display: inline-block; padding: 40px; border-radius: 24px; background: #ffffff; }
            h1 { font-size: 42px; margin: 0 0 10px 0; font-weight: 900; color: #000000; }
            p { font-size: 22px; color: #333333; margin: 0 0 25px 0; font-weight: bold; }
            img { display: block; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>ໂຕະເບີ: ${formattedNumber}</h1>
            <p>ຍິງ QR Code ເພື່ອສັ່ງອາຫານອອນໄລນ໌</p>
            <img src="${qrImageUrl}" width="280" height="260" />
          </div>
          <script>
            window.onload = function() { 
              setTimeout(function() {
                window.print(); 
                window.close(); 
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!tableNumber) return null;

  return (
    <div className="flex items-center gap-3">
      <picture>
        {qrImageUrl ? (
          <img 
            src={qrImageUrl} 
            alt={`QR Table ${tableNumber}`} 
            className="w-12 h-12 bg-white border border-gray-200 p-0.5 rounded shadow-md hover:scale-110 transition cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              window.open(targetUrl, '_blank');
            }}
            title="ກົດເພື່ອທົດສອບເປີດໜ້າສັ່ງອາຫານລູກຄ້າ"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded animate-pulse" />
        )}
      </picture>
      
      <button 
        type="button" 
        onClick={handlePrint}
        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black px-3.5 py-2 rounded-xl transition active:scale-95 shadow-md shadow-emerald-500/10 shrink-0 flex items-center gap-1 cursor-pointer"
      >
        🖨️ ປິ່ນ QR
      </button>
    </div>
  );
}
