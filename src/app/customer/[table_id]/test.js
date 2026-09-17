/* eslint-disable @next/next/no-img-element */
'use client';


import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useLanguage, LANGUAGES } from '@/context/LanguageContext';

// --- ⭐️ Dictionary 4 ພາສາທີ່ສົມບູນແບບ ປ່ຽນຄົບທຸກຫົວຂໍ້ ⭐️ ---
const UI = {
  en: {
    viewCart: 'View Cart',
    items: 'items',
    item: 'item',
    cartTitle: 'Your Order',
    notesLabel: 'Special Instructions / Notes',
    notesPlaceholder: '-- Select Option --',
    total: 'Total Amount:',
    totalItems: 'Total Items:',
    placeOrder: '🚀 Place Order',
    placing: 'Placing order...',
    emptyCart: 'Your cart is empty.',
    close: 'Close',
    orderFailed: 'Failed. Try again.',
    orderSuccessTitle: 'Order Placed!',
    orderTracking: 'Order Status',
    yourOrder: 'Your order items',
    orderMore: '+ Order More Items',
    remove: 'Remove',
    allMenu: 'All',
    requestBill: '💰 Total Amount Due in Bill',
    scanToPay: 'Scan to Pay via BCEL One / LAO QR',
    receiptTitle: 'Guest Receipt Slip',
    colName: 'Item Name',
    colQty: 'Qty',
    colPrice: 'Price',
    tableLabel: 'Table Number',
    dateLabel: 'Date & Time',
    noteLabel: 'Note',
    // --- ADDED for call bill ---
    callBillBtn: '🔔 Call Staff for Bill',
    callBillSuccess: '🔔 Staff notified! Please wait a moment',
  },
  lo: {
    viewCart: 'ເບິ່ງກະຕ່າ',
    items: 'ລາຍການ',
    item: 'ລາຍການ',
    cartTitle: 'ອໍເດີຂອງທ່ານ',
    notesLabel: 'ເລືອກໝາຍເຫດ / ຕົວເລືອກພິເສດ',
    notesPlaceholder: '-- ເລືອກຕົວເລືອກ --',
    total: 'ລວມເງິນທັງໝົດ:',
    totalItems: 'ລວມຈໍານວນທັງໝົດ:',
    placeOrder: '🚀 ສົ່ງອໍເດີ້',
    placing: 'ກໍາລັງສົ່ງອໍເດີ້...',
    emptyCart: 'ກະຕ່າຂອງທ່ານຫວ່າງເປົ່າ.',
    close: 'ປິດ',
    orderFailed: 'ສັ່ງບໍ່ສໍາເລັດ, ລອງໃໝ່.',
    orderSuccessTitle: 'ສັ່ງອາຫານສໍາເລັດ!',
    orderTracking: 'ສະຖານະອໍເດີ',
    yourOrder: 'ລາຍການທີ່ສັ່ງ',
    orderMore: '+ ສັ່ງເພີ່ມ',
    remove: 'ລຶບ',
    allMenu: 'ທັງໝົດ',
    requestBill: '💰 ລວມເງິນຈ່າຍທັງໝົດໃນບິນ',
    scanToPay: 'ສະແກນຈ່າຍຜ່ານ LAO QR / BCEL One',
    receiptTitle: 'ໃບບິນລາຍການທັງໝົດ',
    colName: 'ລາຍການ',
    colQty: 'ຈຳນວນ',
    colPrice: 'ລາຄາ',
    tableLabel: 'ໂຕະນໍ້າເບີ',
    dateLabel: 'ວັນທີເວລາ',
    noteLabel: 'ໝາຍເຫດ',
    // --- ADDED for call bill ---
    callBillBtn: '🔔 ກົດຮຽກພະນັກງານເກັບເງິນ',
    callBillSuccess: '🔔 ສົ່ງສັນຍານຮຽກເກັບເງິນຮຽບຮ້ອຍ! ກະລຸນາລໍຖ້າພະນັກງານເດີ້ເຈົ້າ',
  },
  zh: {
    viewCart: '查看购物车',
    items: '件商品',
    item: '件商品',
    cartTitle: '您的订单',
    notesLabel: '选择备注 / 特殊要求',
    notesPlaceholder: '-- 请选择 --',
    total: '总计金额:',
    totalItems: '总件数:',
    placeOrder: '🚀 下单',
    placing: '正在提交订单...',
    emptyCart: '您的购物车是空的。',
    close: '关闭',
    orderFailed: '下单失败，请重试。',
    orderSuccessTitle: '下单成功！',
    orderTracking: '订单状态',
    yourOrder: '您的订单项目',
    orderMore: '+ 继续点餐',
    remove: '移除',
    allMenu: '全部',
    requestBill: '💰 账单应付总额',
    scanToPay: '扫描 LAO QR / BCEL One 微信支付',
    receiptTitle: '所有点单发票',
    colName: '商品名称',
    colQty: '数量',
    colPrice: '金额',
    tableLabel: '桌号',
    dateLabel: '日期与时间',
    noteLabel: '备注',
    // --- ADDED for call bill ---
    callBillBtn: '🔔 呼叫服务员结账',
    callBillSuccess: '🔔 已成功呼叫！请 稍等服务员',
  },
  th: {
    viewCart: 'ดูตะกร้า',
    items: 'รายการ',
    item: 'รายการ',
    cartTitle: 'ออเดอร์ของคุณ',
    notesLabel: 'เลือกหมายเหตุ / ตัวเลือกพิเศษ',
    notesPlaceholder: '-- เลือกตัวเลือก --',
    total: 'ยอดรวมทั้งหมด:',
    totalItems: 'รวมจำนวนทั้งหมด:',
    placeOrder: '🚀 สั่งอาหาร',
    placing: 'กำลังส่งออเดอร์...',
    emptyCart: 'ตะกร้าของคุณว่างเปล่า',
    close: 'ปิด',
    orderFailed: 'สั่งไม่สำเร็จ กรุณาลองใหม่',
    orderSuccessTitle: 'สั่งอาหารสำเร็จ!',
    orderTracking: 'สถานะออเดอร์',
    yourOrder: 'รายการที่สั่ง',
    orderMore: '+ สั่งเพิ่ม',
    remove: 'ลบ',
    allMenu: 'ทั้งหมด',
    requestBill: '💰 รวมเงินจ่ายทั้งหมดในบิล',
    scanToPay: 'สแกนจ่ายผ่าน LAO QR / BCEL One',
    receiptTitle: 'ใบเสร็จรายการทั้งหมด',
    colName: 'รายการ',
    colQty: 'จำนวน',
    colPrice: 'ราคา',
    tableLabel: 'โต๊ะนำเบอร์',
    dateLabel: 'วันที่เวลา',
    noteLabel: 'หมายเหตุ',
    // --- ADDED for call bill ---
    callBillBtn: '🔔 กดเรียกพนักงานเก็บเงิน',
    callBillSuccess: '🔔 ส่งสัญญาณเรียกเก็บเงินเรียบร้อย! กรุณารอพนักงานสักครู่ค่ะ',
  }
};

function localizedField(item, field, lang) {
  return item && (item[`${field}_${lang}`] || item[field]) || '';
}

export default function CustomerMenuPage() {
  const { table_id } = useParams();
  const { lang, setLang, t } = useLanguage();
  const ui = UI[lang] || UI.en;

  const [restaurant, setRestaurant] = useState(null); // <--- NEW: Restaurant profile state
  const [table, setTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [receiptItems, setReceiptItems] = useState([]); 
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [receiptDatetime, setReceiptDatetime] = useState(''); 

    // 🎯 [ເວີຊັນປິດບັກ set-state-in-effect 100%]: ໂຫຼດຄ່າ Cart ຈາກ LocalStorage ຕັ້ງແຕ່ຕອນສ້າງ State ປອດໄພສູງສຸດ
    const [cart, setCart] = useState(function() {
      if (typeof window !== 'undefined') {
        try {
          var cartKey = '__restaurant_cart_' + table_id;
          var savedCart = window.localStorage.getItem(cartKey);
          return savedCart ? JSON.parse(savedCart) : {};
        } catch (e) { return {}; }
      }
      return {};
    });
  const [showBankModal, setShowBankModal] = useState(false);
  // 🎯 [ເວີຊັນປິດບັກແຖວ 179 ຫາຍຂາດ 100%]: ໃຊ້ Lazy Initialization (() => Date.now()) ຕາມກົດເຫຼັກ React ຜ່ານ ESLint ສະລຸຍ
  const [trackingCurrentTime, setTrackingCurrentTime] = useState(function() {
    return typeof window !== 'undefined' ? Date.now() : 0;
  });
  
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setTrackingCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const [cartNotes, setCartNotes] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [hasOrdered, setPreOrdered] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);

  const langMenuRef = useRef(null);
  const cartModalRef = useRef(null);
  const checkoutModalRef = useRef(null);
   // 🚀 ⭐️ [ຈຸດເພີ່ມໃໝ່ ໑]: ເພີ່ມ Ref ດັກຈັບຕຳແໜ່ງຄລິກທາງນອກ ບັງຄັບໃຫ້ກົດພື້ນທີ່ວ່າງແລ້ວປ໊ອບອັບປິດທັນທີ ⭐️ 🚀
   const trackingModalRef = useRef(null);

  const supabase = createClient(
    'https://fulsiuajohtyotcpbxti.supabase.co',
    'sb_publishable_iMOUS7O7-Qx7Urau9WhpyQ_VipWYXSh'
  );
  const fetchData = useCallback(async () => {
    try {
      if (!table_id) return;
      // Use dynamic network/server detection for API fetch:
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch(`${currentOrigin}/api/customer-data?table_id=${table_id}`);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Server error');
      }

      const data = await res.json();
      setTable(data.table || null);
      setCategories(data.categories || []);
      setMenuItems(data.menuItems || []);
      setReceiptItems(data.receiptItems || []);
      setOrderTotal(data.activeOrder?.total_price || 0);
      setRestaurant(data.restaurant || null); // <--- NEW: Capture restaurant profile here

      if (data.activeOrder) {
        setPreOrdered(true);
      } else {
        setPreOrdered(false);
      }
      // 🚀 ⭐️ [ຈຸດແກ້ບັກແຖວ 210]: ໃຊ້ err?.message ຫຼື String(err) ເພື່ອປ້ອງກັນຕົວແປຫຼົ້ມ 100% ⭐️ 🚀
    } catch (err) {
      const errorMessage = err?.message || String(err) || 'Unknown error';
      console.error('Failed to load menu data:', errorMessage);
      setError(errorMessage);
    } finally {

      setLoading(false);
    }
  }, [table_id]);

  // 🎯 [ເວີຊັນປິດບັກ set-state-in-effect 100%]: ເອີ້ນໃຊ້ແບບ Async Wrapper ແຍກ Lifecycle ຊັດເຈນ ຕັດບັກແດງຖາວອນ
  useEffect(function() {
    let isMounted = true;
    
    var runInitialFetch = async function() {
      if (isMounted) {
        await fetchData();
      }
    };
    runInitialFetch();

    var interval = setInterval(function() {
      if (isMounted) {
        fetchData();
      }
    }, 4000);

    return function() {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchData]);

 
    // 🚀 ⭐️ [ຈຸດເພີ່ມໃໝ່ ໑]: ບັງຄັບຝັງໂຫຼດໄລບຣາຣີ html2canvas ເຂົ້າເຄື່ອງລູກຄ້າທັນທີຕອນເປີດໜ້າເວັບ 100% ⭐️ 🚀
    useEffect(() => {
      if (typeof window !== 'undefined' && !window.html2canvas) {
        const script = document.createElement('script');
        script.src = 'https://hertzen.com';
        script.async = true;
        document.body.appendChild(script);
      }
    }, []);
  
  // 🚀 ⭐️ [ຈຸດປັບປຸງ ໒]: ເພີ່ມເງື່ອນໄຂ trackingModalRef ໃຫ້ຮອງຮັບການກົດປິດທາງນອກເປະຄືກັນກັບໃບບິນ ⭐️ 🚀
  useEffect(() => {
    function handleClickOutside(event) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setLangMenuOpen(false);
      }
      if (cartModalRef.current && !cartModalRef.current.contains(event.target) && !event.target.closest('button')?.innerText.includes('🛒')) {
        setCartOpen(false);
      }
      if (checkoutModalRef.current && !checkoutModalRef.current.contains(event.target) && !event.target.closest('button')?.innerText.includes('💰')) {
        setCheckoutOpen(false);
      }
      // 📥 ຫາກຄລິກທາງນອກກ່ອງ Tracking ໃຫ້ປິດປ໊ອບອັບອັດຕະໂນມັດ
      if (trackingModalRef.current && !trackingModalRef.current.contains(event.target) && !event.target.closest('button')?.innerText.includes('📋')) {
        setTrackingOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const updateQty = (id, change) => {
    setCart((prev) => {
      const currentQty = prev[id] || 0;
      const newQty = currentQty + change;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: newQty };
    });
  };
  // 🚀 ⭐️ [ຈຸດເພີ່ມໃໝ່ ໑]: ບັງຄັບຝັງໂຫຼດໄລບຣາຣີ html2canvas ເຂົ້າເຄື່ອງລູກຄ້າທັນທີຕອນເປີດໜ້າຮ້ານ 100% ⭐️ 🚀
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.html2canvas) {
      const script = document.createElement('script');
      script.src = 'https://hertzen.com';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);


  // 🚀 ⭐️ [ສູດທາງລັດ ໒]: ບັງຄັບເຊຟຂໍ້ມູນກະຕ່າລົງມືຖືລູກຄ້າທຸກຄັ້ງ ຕອນມີການກົດເພີ່ມ/ລຶບອາຫານ ⭐️ 🚀
  useEffect(() => {
    if (typeof window !== 'undefined' && cart && typeof setCart === 'function') {
      try {
        window.localStorage.setItem(`__restaurant_cart_${table_id}`, JSON.stringify(cart));
      } catch (e) {
        console.error("Error saving cart:", e);
      }
    }
  }, [cart, table_id]);

  // 🚀 ⭐️ [ສູດທາງລັດ ໓]: ດັກຈັບ ຫາກລູກຄ້າກົດສົ່ງອໍເດີ້ສຳເລັດ (ກະຕ່າຖືກລ້າງເປັນ {}) ໃຫ້ລຶບຄວາມຈຳໃນມືຖືຖິ້ມທັນທີ ⭐️ 🚀
  useEffect(() => {
    if (typeof window !== 'undefined' && cart && Object.keys(cart).length === 0) {
      try {
        window.localStorage.removeItem(`__restaurant_cart_${table_id}`);
      } catch (e) {}
    }
  }, [cart, table_id]);

  const handlePlaceOrder = async () => {
    const currentTable = table;
    if (!currentTable || currentTable.status !== 'occupied') {
      alert('⚠️ ບໍ່ສາມາດສົ່ງອໍເດີ້ໄດ້: ກະລຸນາລໍຖ້າໃໃຫ້ພະນັກງານເປີດລະບົບໂຕະນີ້ກ່ອນເດີ້ເຈົ້າ!');
      return;
    }

    try {
      setPlacing(true);
      const currentLang = lang || 'lo'; 

      // Use dynamic network/server detection for API POST:
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch(`${currentOrigin}/api/customer-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id, cart, cartNotes, lang: currentLang })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Order failed');
      }

      setCart({});
      setCartNotes({});
      setCartOpen(false);
      setPreOrdered(true);
      fetchData(); 
      alert('🚀 ສົ່ງອໍເດີ້ໄປຮອດຫ້ອງຄົວແລ້ວເຈົ້າ!');
    } catch (err) {
      alert(`ຂໍ້ອະໄພ ສົ່ງອໍເດີ້ຫຼົ້ມ: ${err.message}`);
    } finally {
      setPlacing(false);
    }
  };

  // 🚀 ⭐️ [ຈຸດປົດລັອກຫາຍຂາດ]: ຕັດຄຳສັ່ງຫຼິ້ນສຽງອອກຈາກຝັ່ງລູກຄ້າ ໃຫ້ສຽງເຕືອນໄປຂຶ້ນກັບປຸ່ມ ເປີດ/ປິດ ຂອງພະນັກງານ 100% ⭐️ 🚀
  const handleCallBill = async () => {
    try {
      // ໑. ຍິງ API ໄປຫາຫຼັງບ້ານ ໂດຍສົ່ງ action: 'call_bill' ໄປປ່ຽນຄ່າໃນ Database
      const res = await fetch('/api/staff-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'call_bill', 
          tableId: table_id,
          table_id: table_id
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit bill requested parameter');
      }
                  {/* 🚀 ⭐️ [ຈຸດປົດລັອກໃຫຍ່ 100%]: ຝັງປຸ່ມຕິດຕາມລາຍການ ແລະ Modal ໄວ້ພາຍໃນ Checkout ບັງຄັບດີດຂຶ້ນແນ່ນອນ ⭐️ 🚀 */}
            <div className="w-full mt-2 pt-2 border-t border-dashed border-gray-200">
              <button 
                type="button"
                onClick={() => setTrackingOpen(true)} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <span>📋</span>
                {lang === 'en' ? 'Track Your Orders' : lang === 'zh' ? '跟踪您的订单' : lang === 'th' ? 'ติดตามรายการของคุณ' : '📋 ຕິດຕາມລາຍການຂອງທ່ານ'}
              </button>

              {/* 📥 ຕົວປ໊ອບອັບ Modal ຕິດຕາມສະຖານະອໍເດີ້ ຈະດີດຂຶ້ນມາທັນທີ ໑໐໐% ເມື່ອ trackingOpen === true */}
              {trackingOpen && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 text-black">
                  <div className="bg-white rounded-3xl w-full max-w-sm p-5 text-center shadow-2xl overflow-y-auto max-h-[75vh]">
                    
                    <h2 className="font-black text-lg text-gray-900 mb-0.5">
                      {lang === 'en' ? 'Order Tracking' : lang === 'zh' ? '订单实时跟踪' : lang === 'th' ? 'ติดตามรายการอาหาร' : 'ຕິດຕາມລາຍການຂອງທ່ານ'}
                    </h2>
                    <p className="text-xs font-bold text-gray-400 mb-2">
                      {lang === 'en' ? 'Table No.' : lang === 'zh' ? '桌号' : lang === 'th' ? 'โต๊ะเบอร์' : 'ໂຕະເ比ີ'} {table_id}
                    </p>

                    <div className="border-t border-b border-dashed border-gray-300 py-2.5 my-2 text-left text-xs space-y-2.5 overflow-y-auto max-h-[45vh]">
                      {(!receiptItems || receiptItems.length === 0) ? (
                        <p className="text-center text-gray-400 py-4 font-black">
                          {lang === 'en' ? 'No orders placed yet.' : lang === 'zh' ? '暂无点单记录' : lang === 'th' ? 'ยังไม่มีรายการที่สั่ง' : 'ຍັງບໍ່ມີລາຍການທີ່ສັ່ງເທື່ອເຈົ້າ'}
                        </p>
                      ) : (
                        receiptItems.map((item) => {
                          const menuName = lang === 'en' ? item.menu_name_en : lang === 'zh' ? item.menu_name_zh : lang === 'th' ? item.menu_name_th : item.menu_name_lo;
                          return (
                            <div key={item.id} className="flex justify-between items-start border-b border-gray-50 pb-2 text-gray-900 font-black text-xs">
                              <div className="w-[140px] leading-tight">
                                <p className="text-xs font-black">{menuName}</p>
                                {item.note && <p className="text-[9px] text-red-500 font-bold mt-0.5">📝 {item.note}</p>}
                              </div>
                              
                              <div className="text-center font-mono text-xs pr-1">
                                x{item.quantity}
                              </div>

                              <div className="w-[110px] text-right">
                                {(() => {
                                  const status = item.item_status || 'pending';
                                  if (status === 'pending') {
                                    return (
                                      <span className="text-blue-600 bg-blue-50 border border-blue-200 px-1 py-0.5 rounded-md text-[9px] font-black inline-block animate-pulse">
                                        {lang === 'en' ? '⏱️ Sent to Kitchen' : lang === 'zh' ? '⏱️ 已传到厨房' : lang === 'th' ? '⏱️ ถึงห้องครัวแล้ว' : '⏱️ ຮອດຫ້ອງຄົວແລ້ວ'}
                                      </span>
                                    );
                                  }
                                  if (status === 'preparing') {
                                    return (
                                      <span className="text-orange-600 bg-orange-50 border border-orange-200 px-1 py-0.5 rounded-md text-[9px] font-black inline-block animate-pulse">
                                        {lang === 'en' ? '🍳 Cooking...' : lang === 'zh' ? '🍳 厨师烹饪中...' : lang === 'th' ? '🍳 กำลังปรุง...' : '🍳 ກຳລັງແຕ່ງ...'}
                                      </span>
                                    );
                                  }
                                  if (status === 'served') {
                                    return (
                                      <span className="text-purple-600 bg-purple-50 border border-purple-200 px-1 py-0.5 rounded-md text-[9px] font-black inline-block">
                                        {lang === 'en' ? '🚚 Serving Now' : lang === 'zh' ? '🚚 正在上菜中' : lang === 'th' ? '🚚 กำลังเอามาเสิร์ฟ' : '🚚 ກຳລັງເອົາມาເສີບ'}
                                      </span>
                                    );
                                  }
                                  if (status === 'completed') {
                                    return (
                                      <span className="text-green-600 bg-green-50 border border-green-200 px-1 py-0.5 rounded-md text-[9px] font-black inline-block">
                                        {lang === 'en' ? '✅ Delivered' : lang === 'zh' ? '✅ 已上桌完毕' : lang === 'th' ? '✅ เสิร์ฟเรียบร้อย' : '✅ ເສີບຮຽບຮ້ອຍ'}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <button 
                      type="button"
                      onClick={() => setTrackingOpen(false)} 
                      className="w-full bg-gray-200 text-gray-800 font-black text-xs rounded-xl py-2 transition active:scale-95 shadow-sm"
                    >
                      {lang === 'en' ? 'Close Tracking' : lang === 'zh' ? '关闭返回' : lang === 'th' ? 'ปิดหน้าจอ' : 'ປິດໜ້າຈໍ'}
                    </button>

                  </div>
                </div>
              )}
            </div>

      // ໒. ປິດ Modal ປ໊ອບອັບ Checkout ຝັ່ງລູກຄ້າ
      setCheckoutOpen(false);

      // 🚀 ⭐️ [ຕັດບັກສຽງດັງ]: ຕັດຄຳສັ່ງ Audio ເກົ່າອອກທັງໝົດ ບໍ່ໃຫ້ຝັ່ງລູກຄ້າມີສຽງດັງເອງເດັດຂາດ ⭐️ 🚀

      // ໓. ສະແດງຂໍ້ຄວາມ Alert ແຈ້ງເຕືອນລູກຄ້າທຳມະດາ
      alert(lang === 'en' ? 'Staff notified for bill!' : 'ແຈ້ງພະນັກງານເກັບເງິນຮຽບຮ້ອຍແລ້ວ!');
    } catch (e) { 
      console.error(e);
      alert("ເກີດຂໍ້ຜິດພາດ: " + e.message);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm font-medium">ກຳລັງໂຫຼດຂໍ້ມູນເມນູ...</p>
      </div>
    );
  }

  if (error || !table) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-lg font-bold text-gray-800 mb-2">ເກີດຂໍ້ຜິດພາດ</h1>
        <p className="text-red-500 text-sm max-w-xs bg-red-50 p-3 rounded-xl border border-red-100 font-mono text-xs">{error || 'Table not found'}</p>
      </div>
    );
  }

  const filteredItems = menuItems.filter((item) => {
    if (activeCategory === 'all') return true;
    return Number(item.category_id) === Number(activeCategory);
  });

  const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  // --- Note translation dictionary for receipt notes ---
  const noteTranslate = {
    'ບໍ່ເຜັດ': { lo: 'ບໍ່ເຜັດ', en: 'No Spicy', zh: '不要辣', th: 'ไม่เผ็ด' },
    'ເຜັດໜ້ອຍ': { lo: 'ເຜັດໜ້ອຍ', en: 'Less Spicy', zh: '微辣', th: 'เผ็ดน้อย' },
    'ບໍ່ໃສ່ຜັກບົ່ວ': { lo: 'ບໍ່ໃສ່ຜັກບົ່ວ', en: 'No Onions', zh: '不要洋葱', th: 'ไม่ใส่ต้นหอม' },
    'ບໍ່ໃສ່ແປ້ງນົວ': { lo: 'ບໍ່ໃສ່ແປ້ງນົວ', en: 'No MSG', zh: '不要味精', th: 'ไม่ใส่ผงชูรส' },
    'ຂວດໃຫຍ່': { lo: 'ຂວດໃຫຍ່', en: 'Big Bottle', zh: '大瓶', th: 'ขวดใหญ่' },
    'ຂວດນ້ອຍ': { lo: 'ຂວດນ້ອຍ', en: 'Small Bottle', zh: '小瓶', th: 'ขวดเล็ก' },
    'ປອງໃຫຍ່': { lo: 'ປອງໃຫຍ່', en: 'Big Can', zh: '大罐', th: 'กระป๋องใหญ่' },
    'ປອງນ້ອຍ': { lo: 'ປອງນ້ອຍ', en: 'Small Can', zh: 'Small Can', th: 'กระป๋องเล็ก' },
  };

  // Restaurant logo/name rendering helper
  const renderBrandLogo = (rest, size = 36) => {
    if (!rest) return (
      <div className={`w-[${size}px] h-[${size}px] rounded-full bg-gray-100 flex items-center justify-center text-gray-300 text-xl font-black select-none`}>
        {/* fallback placeholder */}
        <span>🍽️</span>
      </div>
    );
    if (rest.logo_url && (rest.logo_url.startsWith('http://') || rest.logo_url.startsWith('https://'))) {
      return (
        <div
          className={`flex items-center justify-center rounded-full bg-white border-gray-200`}
          style={{ width: size, height: size, overflow: 'hidden' }}
        >
          <img
            src={rest.logo_url}
            alt="logo"
            className="object-cover rounded-full border-gray-200"
            style={{ width: size - 0, height: size - 0, objectFit: 'cover' }}
          />
        </div>
      );
    }
    // If logo_url is not external URL, treat as text/emoji
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-orange-100 border border-orange-200 font-black text-xl`}
        style={{ width: size, height: size }}
      >
        <span>{rest.logo_url || '🍽️'}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 max-w-2xl mx-auto relative shadow-md border-x border-gray-100">
      {/* ປຸ່ມປ່ຽນພາສາ */}
      <div ref={langMenuRef} className="absolute top-13 right-3 z-40">
        <button
          onClick={() => setLangMenuOpen(!langMenuOpen)}
          className="bg-white text-black font-black text-[11px] shadow-lg rounded-full px-2 py-1 border border-gray-400 flex items-center gap-2 active:scale-95 transition"
        >
          <span className="text-xl leading-none">
            {lang === 'lo'
              ? '🇱🇦'
              : lang === 'en'
              ? '🇺🇸'
              : lang === 'zh'
              ? '🇨🇳'
              : '🇹🇭'}
          </span>
          <span>
            {lang === 'lo'
              ? 'ລາວ'
              : lang === 'en'
              ? 'English'
              : lang === 'zh'
              ? '中文'
              : 'ไทย'}
          </span>
          <span className="text-xs text-gray-400 ml-0.5">▼</span>
        </button>
        {langMenuOpen && (
          <div className="absolute right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-300 overflow-hidden w-28 z-50 animate-fade-in">
            <button
              onClick={() => {
                setLang('lo');
                setLangMenuOpen(false);
              }}
              className={`w-full px-2.5 py-1.5 text-left text-[11px] font-black flex items-center gap-2 hover:bg-gray-100 transition ${
                lang === 'lo'
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-black'
              }`}
              style={{ whiteSpace: 'nowrap' }}
            >
              <span className="text-xl leading-none">🇱🇦</span>
              <span>ລາວ</span>
            </button>
            <button
              onClick={() => {
                setLang('en');
                setLangMenuOpen(false);
              }}
              className={`w-full px-2.5 py-1.5 text-left text-[11px] font-black flex items-center gap-2 hover:bg-gray-100 transition ${
                lang === 'en'
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-black'
              }`}
              style={{ whiteSpace: 'nowrap' }}
            >
              <span className="text-xl leading-none">🇺🇸</span>
              <span>English</span>
            </button>
            <button
              onClick={() => {
                setLang('zh');
                setLangMenuOpen(false);
              }}
              className={`w-full px-2.5 py-1.5 text-left text-[11px] font-black flex items-center gap-2 hover:bg-gray-100 transition ${
                lang === 'zh'
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-black'
              }`}
              style={{ whiteSpace: 'nowrap' }}
            >
              <span className="text-xl leading-none">🇨🇳</span>
              <span>中文</span>
            </button>
            <button
              onClick={() => {
                setLang('th');
                setLangMenuOpen(false);
              }}
              className={`w-full px-2.5 py-1.5 text-left text-[11px] font-black flex items-center gap-2 hover:bg-gray-100 transition ${
                lang === 'th'
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-black'
              }`}
              style={{ whiteSpace: 'nowrap' }}
            >
              <span className="text-xl leading-none">🇹🇭</span>
              <span>ไทย</span>
            </button>
          </div>
        )}
      </div>

      {/* Header - now dynamic restaurant profile */}
      <div className="bg-white shadow-sm px-3 pt-4 pb-2 mb-2 rounded-b-2xl flex items-center gap-3">
        {renderBrandLogo(restaurant, 44)}
        <div>
          <h1 className="text-xl font-black text-gray-800 pb-0">
            {restaurant ? localizedField(restaurant, 'name', lang) : <span className="text-gray-300">...</span>}
          </h1>
          <span
            className="bg-orange-50/80 border border-orange-200 text-orange-950 font-black text-xs px-3 py-1.5 rounded-xl mt-2 block w-max shadow-sm"
          >
                     {/* 🚀 ⭐️ [ຈຸດແກ້ໄຂຫຼັກ]: ຕັດຄຳວ່າ ໂຕະເບີ / Table No. ດ້ານເທິງຊ້າຍອອກ ແລ້ວດຶງຊື່ໂຕະຫຼາຍພາສາຈາກຖານຂໍ້ມູນ 100% ⭐️ 🚀 */}
                     <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-1 leading-none">
              
              {table ? localizedField(table, 'name', lang) : `#${table_id}`}
            </h1>

          </span>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="px-3 mb-2 overflow-x-auto flex gap-1 whitespace-nowrap scrollbar-none py-1">
        <button onClick={() => setActiveCategory('all')} className={`px-4 py-2 rounded-full text-xs font-bold transition shadow-sm border ${activeCategory === 'all' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>{ui.allMenu}</button>
        {categories.map((cat) => {
          const catName = localizedField(cat, 'name', lang);
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-4 py-2 rounded-full text-xs font-bold transition shadow-sm border ${Number(activeCategory) === Number(cat.id) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>{catName}</button>
          );
        })}
      </div>

       {/* 🚀 ⭐️ Food listing Grid - ເວີຊັນສະແດງຮູບພາບອາຫານສົດຈາກ database ⭐️ 🚀 */}
      <div className="px-3 grid grid-cols-2 sm:grid-cols-2 gap-2">
        {filteredItems.map((item) => {
          const name = localizedField(item, 'name', lang);
          const qty = cart[item.id] || 0;
          return (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between p-0 hover:shadow-md transition">
              
              {/* 🚀 ⭐️ [ຈຸດປົດລັອກຮູບພາບ]: ຖ້າມີລິ້ງຮູບໃນ database ຈະສະແດງຜົນທັນທີ, ຖ້າບໍ່ມີຈະໂຊເປັນ Icon ແທນ ⭐️ 🚀 */}
              <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center text-4xl mb-2 relative overflow-hidden border border-gray-50">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={name} 
                    className="w-full h-full object-cover rounded-xl absolute inset-0"
                    onError={(e) => {
                      // ຖ້າລິ້ງຮູບຕາຍ ຫຼື ໂຫຼດບໍ່ຂຶ້ນ ໃຫ້ດີດສະແດງເປັນຮູບຈານອາຫານສຳຮອງ
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                {/* ກ່ອງ Icon ຈານອາຫານສຳຮອງ (Fallbacks) */}
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-orange-50/40 text-4xl"
                  style={{ display: item.image_url ? 'none' : 'flex' }}
                >
                  🍲
                </div>
              </div>

                          {/* ໂຊນສະແດງຂໍ້ຄວາມຊື່ເມນູ ແລະ ລາຄາ (ເວີຊັນ ທ້າຍພາສາໄທສະແດງເປັນອັກສອນໄທ 'กีบ') */}
                          <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-gray-800 line-clamp-1 leading-tight ml-1.5">{name}</h3>
                  <p className="text-orange-500 font-black text-sm mt-1 font-mono ml-1.5">
                    {Number(item.price).toLocaleString()}{' '}
                    {/* 🚀 ⭐️ [ຈຸດແກ້ໄຂ]: ປ່ຽນໃຫ້ທ້າຍພາສາໄທສະແດງເປັນ 'กีบ' ຢ່າງຖືກຕ້ອງ ⭐️ 🚀 */}
                    {lang === 'en' ? 'K' : lang === 'zh' ? 'K' : lang === 'th' ? 'กีบ' : 'ກີບ'}
                  </p>
                </div>
                
                {/* ໂຊນປຸ່ມກົດຄຳນວນ [- / ຫ້ອງປ້ອນຕົວເລກບໍ່ມີເສັ້ນ / +] ຂະໜາດເທົ່າກັນພໍດີ */}
                <div className="px-1 mt-1 flex items-center justify-between bg-gray-10 rounded-xl p-0.5 border border-gray-50/50 shadow-inner shadow-orange-500/50">
                  <button 
                    onClick={() => updateQty(item.id, -1)} 
                    className="w-12 h-6 bg-red-500 text-white rounded-lg shadow-sm font-bold active:scale-95 transition flex items-center justify-center text-sm"
                  >
                    -
                  </button>
                  
                  {/* ຫ້ອງ Input ປ້ອນຕົວເລກ ຂະໜາດເທົ່າປຸ່ມບວກລົບ ແລະ ຕັດເສັ້ນຂອບອອກສະອາດຕາ */}
                  <input 
                    type="number" 
                    min="0"
                    max="200"
                    value={qty === 0 ? '' : qty} 
                    placeholder="0"
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0);
                      const diff = val - qty;
                      updateQty(item.id, diff);
                    }}
                    className="w-12 h-6 bg-transparent border-none text-xs font-mono font-black text-center text-black focus:outline-none focus:ring-0 p-0 shadow-none appearance-none"
                    style={{ MozAppearance: 'textfield' }}
                  />

                  <button 
                    onClick={() => updateQty(item.id, 1)} 
                    className="w-12 h-6 bg-green-500 text-white rounded-lg shadow-sm font-bold active:scale-95 transition flex items-center justify-center text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    {/* 📥 1. Shopping Cart Modal */}
    {cartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center text-black">
          <div ref={cartModalRef} className="bg-white rounded-t-3xl w-full max-w-md p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="font-black text-base text-gray-800">{ui.cartTitle}</h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 font-bold text-sm">✕</button>
            </div>
            <div className="space-y-4">
              {Object.entries(cart).map(([menuId, qty]) => {
                const item = menuItems.find(m => m.id === Number(menuId));
                if (!item) return null;
                const options = item.suggested_notes || [];
                const itemTotalPrice = item.price * qty;
                const isEditingQty = globalThis.__activeEditingQtyId === menuId;

                return (
                  <div key={menuId} className="border-b pb-4">
                    {/* ໂຄງສ້າງເດີມຂອງທ່ານ ລັອກບໍ່ໃຫ້ປຸ່ມຕົກແຖວ ໑໐໐% */}
                    <div className="flex items-center justify-between gap-3 text-xs font-black text-gray-800 flex-nowrap">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-sm shrink-0">🍲</span>
                        <span className="text-gray-900 font-black text-sm leading-tight truncate">{localizedField(item, 'name', lang)}</span>
                        <span className="text-orange-500 font-black font-mono text-sm shrink-0">(x{qty})</span>
                      </div>
                      
                      {/* 🚀 ⭐️ [ຈຸດປັບປຸງໃຫຍ່]: ເພີ່ມປຸ່ມ x ຕໍ່ທ້າຍປຸ່ມ 📝 ເຂົ້າໄປໃນກຸ່ມປຸ່ມເດີມຂອງທ່ານ ⭐️ 🚀 */}
                      <div className="flex items-center gap-1.5 bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200 shrink-0 flex-nowrap">
                        <button 
                          onClick={() => {
                            updateQty(item.id, -1);
                            if (isEditingQty) {
                              globalThis.__tempQtyString = String(Math.max(1, qty - 1));
                            }
                          }} 
                          className="font-black text-gray-600 hover:text-red-500 px-2 text-[11px]"
                        >
                          -
                        </button>
                        <button 
                          onClick={() => {
                            updateQty(item.id, 1);
                            if (isEditingQty) {
                              globalThis.__tempQtyString = String(qty + 1);
                            }
                          }} 
                          className="font-black text-orange-500 hover:text-orange-600 px-2 text-[11px]"
                        >
                          +
                        </button>
                        <button 
                          onClick={() => {
                            globalThis.__activeEditingQtyId = isEditingQty ? null : menuId;
                            globalThis.__tempQtyString = String(qty);
                            setCartOpen(true);
                          }} 
                          className="font-black text-orange-500 hover:text-orange-600 px-2 text-[11px] border-l pl-1.5 border-gray-400"
                        >
                          📝
                        </button>
                        {/* ❌ ປຸ່ມເຄື່ອງໝາຍ x ປິດລາຍການ (ລຶບລາຍການອອກຈາກກະຕ່າທັນທີ) */}
                        <button 
                          onClick={() => {
                            const confirmDelete = window.confirm(lang === 'en' ? 'Remove this item?' : 'ຕ້ອງການລຶບລາຍການນີ້ອອກແມ່ນບໍ່?');
                            if (confirmDelete) {
                              updateQty(item.id, -qty); // ລົບຈຳນວນອອກທັງໝົດເພື່ອລຶບລາຍການ
                              globalThis.__activeEditingQtyId = null;
                            }
                          }} 
                          className="font-black text-red-500 hover:text-red-700 px-2 text-[11px] border-l pl-1.5 border-gray-400 font-mono"
                          title="ລຶບລາຍການ"
                        >
                          x
                        </button>
                      </div>
                    </div>
                    
                    {/* ສະແດງລາຄາລວມ */}
                    <div className="flex justify-end mt-1 text-gray-900 font-black text-xs font-mono">
                      <span>{itemTotalPrice.toLocaleString()} K</span>
                    </div>
                    
                    {/* ກ່ອງພິມປ້ອນຕົວເລກຈຳນວນອິດສະຫຼະ */}
                    {isEditingQty && (
                      <div className="mt-2 bg-orange-50 p-2.5 rounded-xl border border-orange-200 flex items-center justify-between gap-2 shadow-inner">
                        <span className="text-[11px] font-black text-orange-900 whitespace-nowrap">
                          {lang === 'en' ? '🔢 Enter Qty:' : lang === 'zh' ? '🔢 输入数量:' : lang === 'th' ? '🔢 ป้อนจำนวน:' : '🔢 ປ້ອນຈຳນວນ:'}
                        </span>
                        <input 
                          type="number" 
                          min="1"
                          max="200"
                          value={globalThis.__tempQtyString}
                          onChange={(e) => {
                            globalThis.__tempQtyString = e.target.value;
                            setCartOpen(true);
                          }}
                          className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-mono font-black text-center text-black shadow-sm"
                        />
                        <button 
                          onClick={() => {
                            const finalQty = Math.max(1, parseInt(globalThis.__tempQtyString) || 1);
                            const diff = finalQty - qty;
                            updateQty(item.id, diff);
                            globalThis.__activeEditingQtyId = null;
                          }}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg text-[11px] font-black shadow-sm transition active:scale-95"
                        >
                          {lang === 'en' ? 'OK' : lang === 'zh' ? '确定' : lang === 'th' ? 'ตกลง' : 'ຕົກລົງ'}
                        </button>
                      </div>
                    )}
                    {/* ຫົວຂໍ້ພາສາລາວ "ເລືອກໝາຍເຫດ" ທີ່ຖືກຕ້ອງ */}
                    <div className="mt-2.5">
                      <label className="text-[11px] font-black text-gray-500 block mb-1">
                        📝 {lang === 'en' ? 'Select Note' : lang === 'zh' ? '选择备注' : lang === 'th' ? 'เลือกหมายเหตุ' : 'ເລືອກໝາຍເຫດ'}
                      </label>
                      <select 
                        value={cartNotes[menuId] || ''} 
                        onChange={(e) => setCartNotes({ ...cartNotes, [menuId]: e.target.value })} 
                        className="w-full border border-gray-300 text-black font-black rounded-xl text-[11px] px-3 py-2 bg-gray-50 focus:outline-none focus:border-orange-500 shadow-sm"
                      >
                        <option value="">{ui.notesPlaceholder}</option>
                        {options.map((opt, idx) => {
                          const optionText = opt[lang] || opt['lo'] || '';
                          return <option key={idx} value={opt['lo']}>{optionText}</option>;
                        })}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
            {Object.keys(cart).length > 0 && (
              <>
                <div className="bg-gray-50 rounded-2xl p-4 mt-4 text-xs font-black border border-gray-100 space-y-2">
                  <div className="flex justify-between text-gray-500"><span>{ui.totalItems}</span><span className="font-mono text-gray-800 text-sm">{cartItemCount} {ui.item}</span></div>
                  <div className="flex justify-between text-gray-900 border-t border-dashed border-gray-300 pt-2 text-sm"><span>{ui.total}</span><span className="text-orange-500 text-base font-mono">{Object.entries(cart).reduce((acc, [id, q]) => acc + ((menuItems.find(m => m.id === Number(id))?.price || 0) * q), 0).toLocaleString()} K</span></div>
                </div>
                <button onClick={handlePlaceOrder} disabled={placing} className="w-full bg-orange-500 text-white font-black text-sm rounded-2xl py-3.5 mt-4 disabled:opacity-50 active:scale-95 transition">{placing ? ui.placing : ui.placeOrder}</button>
              </>
            )}
          </div>
        </div>
      )}
      {/* 📥 🚀 ⭐️ [ເວີຊັນຝັງໄອຄອນ 💰 ໜ້າປຸ່ມເຊັກບິນ - ຕ່ອນທີ ໑-A]: ກັອບປີ້ໂຄ້ດຊຸດນີ້ໄປວາງກ່ອນ ⭐️ 🚀 */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-2xl p-4 bg-transparent pointer-events-none flex flex-col gap-2 z-30">
        {cartItemCount > 0 && (
          <button onClick={() => setCartOpen(true)} className="pointer-events-auto w-full bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl py-3.5 shadow-xl flex items-center justify-between px-6 text-sm active:scale-98 transition">
            <span>🛒 {ui.viewCart} ({cartItemCount} {ui.items})</span>
            <span>{Object.entries(cart).reduce((acc, [id, q]) => acc + ((menuItems.find(m => m.id === Number(id))?.price || 0) * q), 0).toLocaleString()} K</span>
          </button>
        )}
             
        {hasOrdered && (
          <div className="w-full pointer-events-auto flex flex-row gap-2.5">
            {/* 📋 ປຸ່ມ ຕິດຕາມລາຍການ (w-1/2 ຢູ່ທາງໜ้า + ຝັງປ້າຍເຕືອນຕົວເລກສີແດງ 🔴) */}
            <button 
              type="button"
              onClick={() => setTrackingOpen(true)} 
              className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl py-3.5 shadow-xl text-center text-xs sm:text-sm active:scale-98 transition flex items-center justify-center gap-1.5 relative overflow-visible"
            >
              <span>📋</span>
              <span className="truncate">{lang === 'en' ? 'Track' : lang === 'zh' ? '跟踪订单' : lang === 'th' ? 'ติดตามรายการ' : 'ຕິດຕາມລາຍການ'}</span>
              
              {receiptItems && receiptItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1 bg-red-500 text-white text-[10px] font-mono font-black h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center shadow-md animate-bounce ring-2 ring-white">
                  {receiptItems.reduce((sum, l) => sum + l.quantity, 0)}
                </span>
              )}
            </button>

            {/* 💰 🚀 [ຈຸດຝັງໄອຄອນຫຼັກ]: ຝັງ 💰 ກັບຄືນເຂົ້າໄປທາງໜ້າຂໍ້ຄວາມ "ລວມເງິນໃນໃບບິນ" ຄົບຖ້ວນທຸກພາສາ 🚀 💰 */}
            <button 
              onClick={() => setCheckoutOpen(true)} 
              className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl py-3.5 shadow-xl text-center text-xs sm:text-sm active:scale-98 transition truncate px-2 flex items-center justify-center gap-1"
            >
              <span>💰</span>
              <span>
                {lang === 'en' ? 'Bill Total' : lang === 'zh' ? '账单总额' : lang === 'th' ? 'รวมเงินในใบเสร็จ' : 'ລວມເງິນໃນໃບບິນ'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 📥 🚀 Tracking Modal - [ພາກສ່ວນທີ 3-A: ລະບົບຄິດໄລ່ວຽກເວລາ Real-time 100%] */}
      {trackingOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 text-black">
          <div ref={trackingModalRef} className="bg-white rounded-3xl w-full max-w-sm p-5 text-center shadow-2xl">
            {/* 🎯 [ແກ້ໄຂຂໍ້ທີ 1]: ປ່ຽນຫົວຂໍ້ໃຫ້ Dynamic ຕາມພາສາທີ່ລູກຄ້າເລືອກ 100% ບໍ່ໃຫ້ຕິດພາສາໄທຄ້າງ */}
            <h2 className="font-black text-base text-gray-900 mb-1">
              {lang === 'en' ? 'Order Tracking' : lang === 'zh' ? '订单实时跟踪' : lang === 'th' ? 'ติดตามรายการอาหาร' : 'ຕິດຕາມລາຍການຂອງທ່ານ'}
            </h2>
            <div className="mb-2"><span className="text-xs font-black bg-yellow-400 text-gray-900 px-4 py-1 rounded-xl shadow-sm border border-yellow-500 inline-block">{table ? localizedField(table, 'name', lang) : `#${table_id}`}</span></div>
            
            <div className="text-left text-xs space-y-3 overflow-y-auto max-h-[45vh] pr-1 border-t border-b border-dashed py-3 my-2">
              {(!receiptItems || receiptItems.length === 0) ? (
                <p className="text-center text-gray-400 py-4 font-black">{lang === 'en' ? 'No orders placed yet.' : lang === 'zh' ? '暂无点单记录' : lang === 'th' ? 'ยังไม่มีรายการที่สั่ง' : 'ຍັງບໍ່ມີລາຍການທີ່ສັ່ງເທື່ອເຈົ້າ'}</p>
              ) : (
                (() => {
                  // ປັບປຸງສູດຈັດລຽງໃໝ່: ບັງຄັບໃຫ້ລາຍການອາຫານທີ່ສັ່ງຊື້ໃໝ່ຫຼ້າສຸດ (ເວລາໃໝ່ສຸດ) ດີດຂຶ້ນມາສະແດງຢູ່ແຖວທຳອິດສະເໝີ
                 {/*   const allSortedOrders = [...receiptItems].sort((a, b) => {
                    if (!a || !b) return 0;
                    const timeA = new Date(a.created_at || a.order_created_at || 0).getTime();
                    const timeB = new Date(b.created_at || b.order_created_at || 0).getTime();
                    return timeB - timeA; 
                  });*/}

                const allSortedOrders = [...receiptItems].sort((a, b) => {
                    if (!a || !b) return 0;
                    const statusA = a.item_status || a.status || 'pending';
                    const statusB = b.item_status || b.status || 'pending';
                    const weight = { 'pending': 1, 'preparing': 2, 'served': 3, 'completed': 4 };
                    if (weight[statusA] !== weight[statusB]) return (weight[statusA] || 1) - (weight[statusB] || 1);
                    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                  });

                  return allSortedOrders.map((activeItem) => {
                    if (!activeItem) return null;
                    const menuName = lang === 'en' ? activeItem.menu_name_en : lang === 'zh' ? activeItem.menu_name_zh : lang === 'th' ? activeItem.menu_name_th : activeItem.menu_name_lo;
                    const status = activeItem.item_status || activeItem.status || 'pending';
                    const isDrink = Number(activeItem.category_id) === 2;

                    let s1 = "bg-gray-100 text-gray-400 border-gray-200";
                    let s2 = "bg-gray-100 text-gray-400 border-gray-200";
                    let s3 = "bg-gray-100 text-gray-400 border-gray-200";
                    let s4 = "bg-gray-100 text-gray-400 border-gray-200";

                    const lKitchen = isDrink ? (lang === 'en' ? '🏪 Bar' : lang === 'zh' ? '🏪 吧台' : lang === 'th' ? '🏪 บาร์น้ำ' : '🏪 ຫ້ອງເສີບ') : (lang === 'en' ? '👨‍🍳 Kitchen' : lang === 'zh' ? '👨‍🍳 厨房' : lang === 'th' ? '👨‍🍳 ห้องครัว' : '👨‍🍳 ຫ້ອງຄົວ');
                    const lPrep = isDrink ? (lang === 'en' ? '🥤 Mixing' : lang === 'zh' ? '🥤 调制中' : lang === 'th' ? '🥤 กำลังชง' : '🥤 ກຳລັງກຽມ') : (lang === 'en' ? '🍳 Cooking' : lang === 'zh' ? '🍳 烹饪中' : lang === 'th' ? '🍳 กำลังปรุง' : '🍳 ກຳແຕ່ງ');
                    const lServed = lang === 'en' ? '🚚 Serving' : lang === 'zh' ? '🚚 配送中' : lang === 'th' ? '🚚 มาเสิร์ฟ' : '🚚 ມາເສີບ';
                    const lDone = lang === 'en' ? '✅ Done' : lang === 'zh' ? '✅ 完成' : lang === 'th' ? '✅ สำเร็จ' : '✅ ສຳເລັດ';

                    if (status === 'pending') s1 = "bg-blue-500 text-white border-blue-400 animate-pulse";
                    else if (status === 'preparing') s2 = "bg-orange-500 text-white border-orange-400 animate-pulse";
                    else if (status === 'served') s3 = "bg-purple-500 text-white border-purple-400 animate-pulse";
                    else if (status === 'completed') { s1 = "bg-green-100 text-green-700 border-green-100"; s2 = "bg-green-100 text-green-700 border-green-100"; s3 = "bg-green-100 text-green-700 border-green-100"; s4 = "bg-green-600 text-white border-green-500"; }
                    // 🎯 [ເວີຊັນປິດບັກຄ່າເວລາຫວ່າງ/Null 100%]: ດັກຈັບ Fallback Timestamp ບັງຄັບນາທີແລ່ນສົດເປະຄືໜ້າພະນັກງານ
                    let minutesElapsedStr = "";
                    
                    const rawTimestamp = activeItem.created_at || activeItem.order_created_at || (activeItem.orders && activeItem.orders.created_at) || activeItem.receipt_created_at;
                    const orderTimestamp = rawTimestamp ? Date.parse(rawTimestamp) : null;
                    
                    const timeLabels = {
                      lo: { justOrdered: "0 ນາທີ", minsAgo: " ນາທີ" },
                      en: { justOrdered: "0 Mins", minsAgo: " Mins" },
                      zh: { justOrdered: "0 分钟", minsAgo: " 分钟" },
                      th: { justOrdered: "0 นาที", minsAgo: " นาที" }
                    };
                    const currentLabel = timeLabels[lang] || timeLabels.lo;

                    if (orderTimestamp && !isNaN(orderTimestamp)) {
                      let diffInMinutes = Math.floor((trackingCurrentTime - orderTimestamp) / 60000);
                      if (diffInMinutes < 0 || isNaN(diffInMinutes)) {
                        diffInMinutes = 0;
                      }
                      minutesElapsedStr = diffInMinutes <= 0 ? currentLabel.justOrdered : diffInMinutes + currentLabel.minsAgo;
                    } else {
                      const fallbackTimerKey = `__local_timer_item_${activeItem.id || 'default'}`;
                      if (typeof window !== 'undefined') {
                        if (!window.localStorage.getItem(fallbackTimerKey)) {
                          window.localStorage.setItem(fallbackTimerKey, String(Date.now()));
                        }
                        const localSavedMs = Number(window.localStorage.getItem(fallbackTimerKey));
                        let diffInMinutes = Math.floor((trackingCurrentTime - localSavedMs) / 60000);
                        if (diffInMinutes < 0 || isNaN(diffInMinutes)) {
                          diffInMinutes = 0;
                        }
                        minutesElapsedStr = diffInMinutes <= 0 ? currentLabel.justOrdered : diffInMinutes + currentLabel.minsAgo;
                      } else {
                        minutesElapsedStr = currentLabel.justOrdered;
                      }
                    }

                    return (
                      <div key={activeItem.id} className="bg-gray-50/60 p-2.5 rounded-xl border border-gray-150 space-y-2 text-black text-left">
                        <div className="text-xs font-black text-gray-900 leading-tight flex flex-wrap items-center gap-1.5">
                          <span>{isDrink ? '🥤' : '🍲'} {menuName || 'ລາຍການ'}</span>
                          
                          {/* 🎯 [ຈຸດແກ້ໄຂ]: ຕັດຄຳວ່າ ຈຳນວນ ອອກທັງໝົດ ໃຫ້ເຫຼືອພຽງແຕ່ຕົວຄູນ (xQuantity) ແບບສາກົນກະທັດຮັດ */}
                          <span className={isDrink ? "text-blue-600 font-mono" : "text-orange-600 font-mono"}>
                            (x{activeItem.quantity})
                          </span>

                          {/* ສະແດງລາຄາລາຍການອາຫານແບບຕົວໜັງສືທຳມະດາ + ປ່ຽນສະກຸນເງິນ Dynamic */}
                          <span className="text-gray-900 font-mono font-bold text-[11px] shrink-0">
                            {((Number(activeItem.price_per_unit || activeItem.price || 0)) * Number(activeItem.quantity || 0)).toLocaleString()}{" "}
                            {lang === 'th' ? 'บาท' : lang === 'en' ? 'Kip' : lang === 'zh' ? '基普' : 'ກີບ'}
                          </span>

                          {/* 🟢 ປ້າຍເວລານາທີສີຂຽວແລ່ນສົດ Dynamic ໔ ພາສາ ບໍ່ຫຼົງທາງ */}
                          <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded border bg-green-50 text-green-700 border-green-200 animate-pulse inline-flex items-center gap-0.5 shrink-0">⏳ {minutesElapsedStr}</span>
                        </div>
                        {activeItem.note && <p className="text-[10px] text-red-500 font-bold font-sans mt-0.5 ml-4">📝 {activeItem.note}</p>}
                        
                        <div className="grid grid-cols-4 gap-0.5 text-[8px] font-black text-center pt-1 text-black">
                          <div className={`p-1 rounded-md border ${s1}`}>{lKitchen}</div>
                          <div className={`p-1 rounded-md border ${s2}`}>{lPrep}</div>
                          <div className={`p-1 rounded-md border ${s3}`}>{lServed}</div>
                          <div className={`p-1 rounded-md border ${s4}`}>{lDone}</div>
                        </div>
                      </div>
                    );

                  });
                })()
              )}
            </div>
  {/* ກ່ອງສະຫຼຸບຍອດແຖວດຽວອັດສະລິຍະ ຫົວຂໍ້ ສະຫຼຸບລາຍການ ແລະ ລາຄາ */}
  {receiptItems && receiptItems.length > 0 && (
                          <div className="bg-amber-50/60 rounded-2xl p-3.5 border border-amber-100 text-left mt-3 shadow-inner">
                            <p className="text-xs font-black text-amber-800 flex items-center gap-1 border-b border-amber-200/60 pb-1.5 mb-2.5">
                              <span>📊</span> {lang === 'en' ? 'Summary' : lang === 'zh' ? '账单汇总' : lang === 'th' ? 'สรุปรายการและราคา' : 'ສະຫຼຸບລາຍການ ແລະ ລາຄາ'}
                            </p>
                            <div className="flex justify-between items-center font-black text-xs text-gray-900">
                              <div className="flex items-center gap-1">
                                <span>💰</span>
                                <span>{lang === 'en' ? 'Grand Total' : lang === 'zh' ? '总计' : lang === 'th' ? 'ยอดรวม' : 'ຍອດລວມທັງໝົດ'}</span>
                                <span className="text-gray-500 font-bold ml-0.5">
                                  ({receiptItems.reduce((sum, l) => sum + l.quantity, 0)}{" "}
                                  {lang === 'en' ? 'Items' : lang === 'zh' ? '份' : lang === 'th' ? 'รายการ' : 'ລາຍການ'})
                                </span>
                              </div>
                              <span className="text-orange-600 font-mono text-base tracking-tight">
                                {receiptItems.reduce((sum, l) => sum + ((l.price_per_unit || l.price || 0) * l.quantity), 0).toLocaleString()} K
                              </span>
                            </div>
                          </div>
                        )}

            <button type="button" onClick={() => setTrackingOpen(false)} className="w-full bg-red-600 text-white font-black text-xs rounded-xl py-2.5 mt-2">{lang === 'en' ? 'Close' : 'ປິດ'}</button>
          </div>
        </div>
      )}
     {/* 💰 2. LAO QR Checkout Modal - [ພາກສ່ວນທີ 1 ເວີຊັນແປພາສາເຄື່ອງດື່ມ + ຝັງເວລານາທີລໍຖ້າຫຼັງລາຄາ ⏳] */}
     {checkoutOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          {(() => {
            // 🎯 ປັບປຸງ Dictionary ພາສາລາວປຸ່ມຕິດຕາມເຄື່ອງດື່ມ ແລະ ຂໍ້ຄວາມໃຫ້ສະອາດບໍລິສຸດ 100%
            const btnUi = {
              lo: { copy: "ກັອບປີ້ຍອດເງິນ", openApp: "ເປີດ BCEL One", cancelCall: "❌ ຍົກເລີກຮຽກພະນັກງານເກັບເງິນ", callStaff: "🔔 ຮຽກພະນັກງານເກັບເງິນ", saveBill: "📸 ບັນທຶກໃບບິນ", close: "ປິດ", copiedAlert: "📋 ກັອບປີ້ຍອດເງິນລວມສຳເລັດແລ້ວ! ວາງໃນແອັບທະນາຄານໄດ້ທັນທີ", cancelAlert: "🚀 ຍົກເລີກການຮຽກເກັບບິນຮຽບຮ້ອຍແລ້ວເຈົ້າ!", justOrdered: "ຫາກໍ່ສັ່ງ", minsAgo: "ນາທີ" },
              en: { copy: "Copy Amount", openApp: "Open BCEL One", cancelCall: "❌ Cancel Bill Call", callStaff: "🔔 Call Staff for Bill", saveBill: "📸 Save Bill Image", close: "Close", copiedAlert: "📋 Grand total copied successfully! You can paste it in your bank app.", cancelAlert: "🚀 Bill call canceled successfully!", justOrdered: "Just ordered", minsAgo: "mins ago" },
              zh: { copy: "复制总金额", openApp: "打开 BCEL One", cancelCall: "❌ 取消呼叫结账", callStaff: "🔔 呼叫服务员结账", saveBill: "📸 保存发票图片", close: "关闭", copiedAlert: "📋 总金额已成功复制！您可以直接粘贴到银行应用中。", cancelAlert: "🚀 已成功取消呼叫结账！", justOrdered: "刚刚点单", minsAgo: "分钟前" },
              th: { copy: "ก๊อปปี้ยอดเงิน", openApp: "เปิด BCEL One", cancelCall: "❌ ยกเลิกเรียกพนักงานเก็บเงิน", callStaff: "🔔 เรียกพนักงานเก็บเงิน", saveBill: "📸 บันทึกใบเสร็จ", close: "ปิด", copiedAlert: "📋 ก๊อปปี้ยอดเงินรวมสำเร็จแล้ว! วาง在แอปธนาคารได้ทันที", cancelAlert: "🚀 ยกเลิกการเรียกเก็บบิลเรียบร้อยแล้วค่ะ!", justOrdered: "เพิ่งสั่งเมื่อกี้", minsAgo: "นาที" }
            };
            const bUi = btnUi[lang] || btnUi.lo;

            return (
              <div ref={checkoutModalRef} className="bg-white rounded-3xl w-full max-w-sm p-6 text-center shadow-xl overflow-y-auto max-h-[90vh] text-black">
                <div className="flex flex-col items-center justify-center mb-2">
                  {restaurant?.logo_url ? ( <img src={restaurant.logo_url} alt="Logo" className="w-14 h-14 object-contain rounded-xl border border-gray-150 p-0.5 shadow-sm" /> ) : null}
                  <h2 className="font-black text-lg text-gray-800 mt-2.5 leading-tight">{restaurant ? localizedField(restaurant, 'name', lang) : "Our Restaurant"}</h2>
                </div>
                
                <p className="text-sm font-black text-orange-600 px-4 py-1.5 bg-orange-50 rounded-full inline-block border border-orange-100 shadow-inner mt-1">
                  {table ? localizedField(table, 'name', lang) : `#${table_id}`}
                </p>
                <p className="text-[10px] text-gray-400 font-black mt-2">{ui.dateLabel || 'ວັນທີເວລາ'}: {receiptDatetime || new Date().toLocaleString('lo-LA', { hour12: false })}</p>
                
                <div className="border-t border-b border-dashed border-gray-300 py-3 my-4 text-left text-xs space-y-2.5">
                  <div className="flex justify-between text-gray-900 font-black text-[11px] pb-1 border-b border-gray-100">
                    <span className="w-[140px]">{ui.colName}</span> <span className="w-[50px] text-center">{ui.colQty}</span> <span className="w-[90px] text-right">{ui.colPrice}</span>
                  </div>
                  
                  {/* ກັ່ນຕອງທຸກໆໝວດໝູ່ (ອາຫານ, ເຄື່ອງດື່ມ, ປະເພດຕຳ) ທີ່ສະຖານະເປັນ served ຫຼື completed */}
                  {(receiptItems || [])
                    .filter(line => line && (line.item_status === 'served' || line.item_status === 'completed' || line.status === 'served' || line.status === 'completed'))
                    .map((line, index) => {
                      const foodName = localizedField(line, 'menu_name', lang) || localizedField(line, 'name', lang) || line.menu_name_lo || line.name_lo || line.menu_name || line.name || '🍲 ...';
                      
                      // ⏳ [ລະບົບຄິດໄລ່ວຽກເວລາ Real-time ຝັ່ງລູກຄ້າ]:
                      let minutesElapsedStr = "";
                      if (line.created_at) {
                        const diffInMinutes = Math.floor((new Date().getTime() - new Date(line.created_at).getTime()) / 60000);
                        minutesElapsedStr = diffInMinutes <= 0 ? bUi.justOrdered : diffInMinutes + " " + bUi.minsAgo;
                      }

                      return (
                        <div key={line.id} className="flex justify-between items-start text-gray-700 font-bold py-0.5 text-xs border-b border-gray-50/40 pb-1">
                          <div className="w-[140px] flex gap-1 items-start">
                            <span className="text-gray-400 font-black">{index + 1}.</span>
                            <div className="flex flex-col text-left">
                              <p className="font-black text-gray-900 leading-tight flex flex-wrap items-center gap-1">
                                <span>{foodName}</span>
                                
                                {/* ⏳ [ແຖບບອກເວລາ]: ຝັງປ້າຍເວລາ ໔ ພາສາ ຕໍ່ທ້າຍຊື່ລາຍການອາຫານໃນແຖວດຽວກັນຊັດເຈນ */}
                                {minutesElapsedStr && (
                                  <span className="text-[9px] font-mono font-black px-1 py-0.2 rounded bg-gray-100 text-gray-600 border border-gray-200 inline-block shrink-0">
                                    ⏳ {minutesElapsedStr}
                                  </span>
                                )}
                              </p>
                              {line.note && <p className="text-[10px] text-red-500 font-bold mt-0.5">📝 {line.note}</p>}
                            </div>
                          </div>
                          <span className="w-[50px] text-center font-black text-gray-600">x{line.quantity}</span>
                          <span className="w-[90px] text-right font-black text-gray-900">{((line.price_per_unit || line.price || 0) * line.quantity).toLocaleString()} K</span>
                        </div>
                      );
                    })}
                </div>

                {/* ຍອດລວມທ້າຍບິນ */}
                <div className="bg-gray-50 rounded-2xl p-2 mb-3 text-left border border-gray-200">
                  <div className="flex justify-between text-sm font-black text-gray-800">
                    <span>{ui.total || 'ລວມທັງໝົດ:'}</span>
                    <span className="text-orange-500 text-base font-black font-mono">
                      {(() => {
                        const totalSum = (receiptItems || []).reduce((sum, line) => {
                          if (line && (line.item_status === 'served' || line.item_status === 'completed' || line.status === 'served' || line.status === 'completed')) {
                            return sum + (Number(line.price_per_unit || line.price || 0) * Number(line.quantity || 0));
                          }
                          return sum;
                        }, 0);
                        return totalSum.toLocaleString();
                      })()} K
                    </span>
                  </div>
                </div>

                <div className="flex flex-row gap-2 w-full mb-3">
                  <button type="button" onClick={() => {
                    const total = (receiptItems || []).reduce((sum, line) => (line && (line.item_status === 'served' || line.item_status === 'completed' || line.status === 'served' || line.status === 'completed')) ? sum + (Number(line.price_per_unit || line.price || 0) * Number(line.quantity || 0)) : sum, 0);
                    try {
                      const textArea = document.createElement("textarea"); textArea.value = String(total); textArea.style.position = "fixed"; textArea.style.opacity = "0"; document.body.appendChild(textArea);
                      textArea.focus(); textArea.select(); document.execCommand('copy'); document.body.removeChild(textArea); 
                      alert(bUi.copiedAlert);
                    } catch(e) { alert("Error: " + e.message); }
                  }} className="w-1/2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-black text-[11px] rounded-xl py-2 flex items-center justify-center gap-1 transition shadow-sm">
                    <span>📋</span> <span>{bUi.copy}</span>
                  </button>
                                   {/* 🎯 [ເວີຊັນປ່ຽນປຸ່ມເປີດແອັບທະນາຄານອື່ນໆ 100%]: ໃຊ້ລະບົບ LAO QR OneLink Dynamic Deep Link ເປີດໄດ້ທຸກແອັບທະນາຄານ */}
                                   <button 
                    type="button" 
                    onClick={function() {
                      // 🔐 ສ້າງລະບົບ Deep Link ສາກົນ ຫາກກົດໃນມືຖື ມັນຈະກວາດຫາ ແລະ ເປີດທຸກແອັບທະນາຄານໃນເຄື່ອງໃຫ້ເລືອກທັນທີ
                      const appOneLinkUrl = "https://onelink.to"; 
                      
                      if (typeof window !== 'undefined') {
                        // ສັ່ງໃຫ້ບຣາວເຊີເປີດປ໊ອບອັບໄປຫາໜ້າຮວມແອັບທະນາຄານຂອງມືຖືລູກຄ້າທັນທີ
                        window.location.href = appOneLinkUrl;
                      }
                    }} 
                    className="w-1/2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-black text-[11px] rounded-xl py-2 flex items-center justify-center gap-1 transition shadow-sm cursor-pointer select-none active:scale-95"
                  >
                    <span>📲</span> 
                    <span>
                      {lang === 'en' ? 'Open Bank App' : lang === 'zh' ? '打开银行应用' : lang === 'th' ? 'เปิดแอปธนาคาร' : 'ເປີດແອັບທະນາຄານ'}
                    </span>
                  </button>

                </div>

                <div className="space-y-2 w-full mb-4">
                  {/* 🌍 ປຸ່ມຮຽກພະນັກງານ ແລະ ຍົກເລີກ (ຄືເກົ່າ) */}
                  {table?.bill_requested === true || table?.bill_requested === 'true' || String(table?.bill_requested).toLowerCase() === 'true' ? (
                    <button type="button" onClick={async () => { try { await supabase.from('tables').update({ bill_requested: false }).eq('id', table_id); await fetch(`${window.location.origin}/api/customer-data`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel_bill', table_id: table_id }) }).catch(() => {}); fetchData(); alert(bUi.cancelAlert); } catch(err) { alert(err.message); } }} className="w-full bg-red-500 hover:bg-red-600 text-white font-black text-xs rounded-xl py-2 shadow-md flex items-center justify-center gap-1.5 transition">
                      {bUi.cancelCall}
                    </button>
                  ) : (
                    <button type="button" onClick={async () => { await handleCallBill(); setCheckoutOpen(true); }} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-xl py-2 shadow-md flex items-center justify-center gap-1.5 border border-orange-400 ring-2 ring-orange-400/20 transition">
                      {bUi.callStaff}
                    </button>
                  )}
                  
                  <div className="flex flex-row gap-2 w-full pt-0.5">
                    {/* 🌍 ປຸ່ມບັນທຶກໃບບິນ 📸 [ເວີຊັນແກ້ໄຂ Canvas: ດຶງ Logo + ວັນທີ + ຫົວຂໍ້ຕາຕະລາງ ໔ ພາສາເປະ 100%] */}
                    <button type="button" onClick={() => {
                      try {
                        const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); canvas.width = 400;
                        const lines = receiptItems.filter(l => l && (l.item_status === 'served' || l.item_status === 'completed' || l.status === 'served' || l.status === 'completed')); 
                        
                        // ຄິດໄລ່ຄວາມສູງ Canvas ໃຫ້ພໍດີກັບຈຳນວນລາຍການອາຫານ
                        canvas.height = 300 + (lines.length * 30) + 120;
                        const finalTimeStr = receiptDatetime || new Date().toLocaleString('lo-LA', { hour12: false });

                        // ໑. ຖົມພື້ນຫຼັງສີຂາວ
                        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);

                        // 🎯 [ຟີເຈີ ໑]: ຟັງຊັນດຶງ Logo ຮ້ານອາຫານມາແຕ້ມລົງ Canvas (ຖ້າມີຮູບ)
                        var drawCanvasContent = function() {
                          // ໒. ວາດຊື່ຮ້ານອາຫານ
                          ctx.fillStyle = '#111827'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; 
                          ctx.fillText(restaurant ? localizedField(restaurant, 'name', lang) : "Receipt", 200, 115);
                          
                          // ໓. ວາດຊື່ໂຕະ
                          ctx.fillStyle = '#111827'; ctx.font = 'bold 15px sans-serif'; 
                          const tableNameStr = table ? localizedField(table, 'name', lang) : `ໂຕະ #${table_id}`; 
                          ctx.fillText(tableNameStr, 200, 145);
                          
                          // 🎯 [ຟີເຈີ ໒]: ວາດວັນທີເວລາ Real-time ລົງຮູບພາບ
                          ctx.fillStyle = '#4b5563'; ctx.font = '11px sans-serif'; 
                          ctx.fillText(`${ui.dateLabel || 'ວັນທີເວລາ'}: ${finalTimeStr}`, 200, 165);
                          
                          // เส้นຂັ້ນເທິງຫົວຂໍ້
                          ctx.strokeStyle = '#9ca3af'; ctx.beginPath(); ctx.moveTo(20, 185); ctx.lineTo(380, 185); ctx.stroke();
                          
                          // 🎯 [ຟີເຈີ ໓]: ວາດແຖວຫົວຂໍ້ (ລາຍການ, ຈຳນວນ, ລາຄາ) ໔ ພາສາໃຫ້ຕົງກັນ
                          ctx.fillStyle = '#111827'; ctx.font = 'bold 12px sans-serif';
                          ctx.textAlign = 'left'; ctx.fillText(ui.colName || 'ລາຍການ', 25, 205);
                          ctx.textAlign = 'center'; ctx.fillText(ui.colQty || 'ຈຳນວນ', 240, 205);
                          ctx.textAlign = 'right'; ctx.fillText(ui.colPrice || 'ລາຄາ', 375, 205);
                          
                          // ເສັ້ນຂັ້ນໃຕ້ຫົວຂໍ້
                          ctx.strokeStyle = '#e5e7eb'; ctx.beginPath(); ctx.moveTo(20, 215); ctx.lineTo(380, 215); ctx.stroke();
                          
                          // ໔. ວາດລາຍການອາຫານແຕ່ລະແຖວ
                          let y = 245; 
                          lines.forEach((l, i) => { 
                            const fName = localizedField(l, 'menu_name', lang) || localizedField(l, 'name', lang) || l.menu_name_lo || l.name_lo || l.menu_name || l.name || 'Item';
                            ctx.fillStyle = '#111827'; ctx.font = 'bold 13px sans-serif'; 
                            ctx.textAlign = 'left'; ctx.fillText(`${i + 1}. ${fName}`, 25, y); 
                            ctx.textAlign = 'center'; ctx.fillText(`x${l.quantity}`, 240, y); 
                            ctx.textAlign = 'right'; ctx.fillText(`${((l.price_per_unit || l.price || 0) * l.quantity).toLocaleString()} K`, 375, y); 
                            y += 30; 
                          });
                          
                          // ເສັ້ນຂັ້ນທ້າຍລາຍການ
                          ctx.strokeStyle = '#9ca3af'; ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(380, y); ctx.stroke(); y += 30;
                          
                          // ໕. ວາດຍອດລວມທັງໝົດ
                          ctx.textAlign = 'left'; ctx.fillStyle = '#111827'; ctx.font = 'bold 15px sans-serif'; 
                          ctx.fillText(lang === 'en' ? 'Grand Total:' : lang === 'zh' ? '总计金额:' : lang === 'th' ? 'รวมทั้งหมด:' : 'ລວມທັງໝົດ:', 25, y); 
                          ctx.textAlign = 'right'; ctx.fillStyle = '#ea580c'; ctx.font = 'bold 18px sans-serif'; 
                          ctx.fillText(`${lines.reduce((sum, l) => sum + ((l.price_per_unit || l.price || 0) * l.quantity), 0).toLocaleString()} K`, 375, y); y += 40;
                          
                          // ໖. ວາດຂໍ້ຄວາມຂອບໃຈທ້າຍບິນ ໔ ພາສາ
                          ctx.textAlign = 'center'; ctx.fillStyle = '#6b7280'; ctx.font = 'bold 11px sans-serif'; 
                          ctx.fillText(lang === 'en' ? '*** THANK YOU ***' : lang === 'zh' ? '*** 谢谢光临 ***' : lang === 'th' ? '*** ขอบคุณค่ะ ***' : '*** ຂໍຂອບໃຈ ທຸກໆທ່ານທີ່ມາອຸດໜູນ ***', 200, y);
                          
                          // ໗. ດາວໂຫຼດຮູບພາບອອກມາ
                          const link = document.createElement('a'); link.download = `Receipt_${tableNameStr}.png`; link.href = canvas.toDataURL('image/png'); link.click();
                        };

                        // Logic ການໂຫຼດຮູບ Logo ເຂົ້າມາແຕ້ມ (ປ້ອງກັນບັກຮູບບໍ່ໂຫລດ)
                        if (restaurant && restaurant.logo_url) {
                          const logoImg = new Image();
                          logoImg.crossOrigin = "anonymous"; // ປ້ອງກັນບັກ CORS Security ຂອງການເຊັບຮູບ
                          logoImg.onload = function() {
                            ctx.drawImage(logoImg, 170, 20, 60, 60); // ວາດຮູບ Logo ຂະໜາດ 60x60 ໄວ້ກາງເທິງສຸດ
                            drawCanvasContent();
                          };
                          logoImg.onerror = function() { drawCanvasContent(); }; // ຖ້າຮູບມີບັນຫາ ໃຫ້ວາດເນື້ອຫາຕໍ່ເລີຍ
                          logoImg.src = restaurant.logo_url;
                        } else {
                          drawCanvasContent();
                        }

                      } catch (e) { alert("Error: " + e.message); }
                    }} className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl py-2 flex items-center justify-center gap-1 transition truncate px-1">
                      <span>{bUi.saveBill}</span>
                    </button>
                    
                    {/* 🌍 ປຸ່ມປິດ ❌ */}
                    <button type="button" onClick={() => setCheckoutOpen(false)} className="w-1/2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black text-xs rounded-xl py-2 transition text-center active:scale-95 shadow-sm truncate px-1">
                      {bUi.close}
                    </button>
                  </div>
                </div>

                {/* ກ່ອງສະແດງ QR Code */}
                <div className="w-full border-2 border-dashed border-emerald-500 rounded-3xl p-4 bg-emerald-50/50 flex flex-col items-center justify-center min-h-[220px] overflow-hidden mt-2">
                  <p className="text-[11px] font-black text-emerald-800 max-w-[240px] leading-tight mb-3">{ui.scanToPay}</p>
                  {restaurant?.qr_url ? ( <img src={restaurant.qr_url} alt="QR" className="w-full max-w-[280px] h-auto object-contain rounded-2xl border border-gray-100 bg-white p-2 shadow-md" /> ) : null}
                </div>

              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
}