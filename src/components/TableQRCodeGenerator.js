'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function TableQRCodeGenerator({ currentNetlifyUrl }) {
  const [tableId, setTableId] = useState('1');
  const [qrImageUrl, setQrImageUrl] = useState('');

  // 🎯 ຜູກ Link ປາຍທາງຂອງ Netlify ຕົວ Live ຕົວຈິງຂອງທ່ານ
  const baseUrl = currentNetlifyUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const targetUrl = `${baseUrl}/customer/${tableId}`;

  useEffect(() => {
    if (targetUrl) {
      QRCode.toDataURL(targetUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        }
      })
      .then(url => setQrImageUrl(url))
      .catch(err => console.error('QR Code Error:', err));
    }
  }, [tableId, targetUrl]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - Table ${tableId}</title>
          <style>
            body { text-align: center; font-family: sans-serif; padding-top: 50px; }
            .card { border: 3px dashed #000; display: inline-block; padding: 40px; border-radius: 20px; background: #fff; }
            h1 { font-size: 32px; margin: 0 0 10px 0; color: #000; }
            p { font-size: 18px; color: #666; margin: 0 0 20px 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>ໂຕະເບີ: ${tableId}</h1>
            <p>ຍິງ QR Code ເພື່ອສັ່ງອາຫານອອນໄລນ໌</p>
            <img src="${qrImageUrl}" width="250" height="250" />
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto my-6">
      <h3 className="text-xl font-black text-gray-800 mb-4">🖨️ ລະບົບສ້າງຄິວອາໂຄດປະຈຳໂຕະ</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-bold text-gray-600 mb-2">ປ້ອນ ຫຼື ເລືອກເລກໂຕະ:</label>
        <input
          type="number"
          min="1"
          value={tableId}
          onChange={(e) => setTableId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black font-bold"
        />
      </div>

      <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-xs text-gray-400 mb-2 break-all text-center">{targetUrl}</p>
        <picture>
          {qrImageUrl && <img src={qrImageUrl} alt={`QR Code ${tableId}`} className="w-44 h-44 bg-white p-2 rounded-lg" />}
        </picture>
      </div>

      <button
        onClick={handlePrint}
        className="w-full mt-4 bg-black text-white font-bold py-3 px-4 rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
      >
        ປິ່ນ QR Code ປະຈຳໂຕະນີ້
      </button>
    </div>
  );
}
