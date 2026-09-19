/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fulsiuajohtyotcpbxti.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iMOUS7O7-Qx7Urau9WhpyQ_VipWYXSh';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

if (typeof globalThis.__globalSilentUndoTableIdMap === 'undefined') {
  globalThis.__globalSilentUndoTableIdMap = {};
}

const RECEIPT_UI = {
  lo: { title: 'ໃບບິນລາຍການທັງໝົດ', table: 'ໂຕະເບີ', date: 'ວັນທີເວລາ', total: 'ລວມທັງໝົດ:', qrLabel: 'ສະແກນຮັບເງິນຜ່ານ LAO QR / BCEL One', btnClose: 'ປິດໜ້າຈໍ', colName: 'ລາຍການ', colQty: 'ຈຳນວນ', colPrice: 'ລາຄາ' },
  en: { title: 'Guest Receipt Slip', table: 'Table Number', date: 'Date & Time', total: 'Grand Total:', qrLabel: 'Scan to Pay via BCEL One / LAO QR', btnClose: 'Close View', colName: 'Item Name', colQty: 'Qty', colPrice: 'Price' },
  zh: { title: '所有点单发票', table: '桌号', date: '日期与时间', total: '总计金额:', qrLabel: '扫描 LAO QR / BBEL One 微信支付', btnClose: '关闭窗口', colName: '商品名称', colQty: '数量', colPrice: '金额' },
  th: { title: 'ใบเสร็จรายการทั้งหมด', table: 'โต๊ะน้ำเบอร์', date: 'วันที่เวลา', total: 'รวมทั้งหมด:', qrLabel: 'สแกนรับเงินผ่าน LAO QR / BCEL One', btnClose: 'ปิดหน้าจอ', colName: 'รายการ', colQty: 'จำนวน', colPrice: 'ราคา' }
};
// 🎯 [ເວີຊັນປິດບັກແຖວ 577]: ຝັງຟັງຊັນແປພາສາອັດສະລິຍະ ປິດບັກ localizedField ບໍ່ມີຕົວຕົນທັນທີ!
function localizedField(item, field, lang) {
  var key = field + '_' + lang;
  return item && (item[key] || item[field]) || '';
}
export default function StaffDashboardPage() {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [bills, setBills] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false); 

  // 🎯 [ຈຸດແກ້ໄຂຫຼັກ ໑]: ສ້າງ Alias ໃຫ້ orderItems ແລະ menuItems ຕົງກັນກັບ Logic ຫຼັກບ້ານ
  const [orderItems, setOrderItems] = useState([]); 
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [selectCategory, setSelectCategory] = useState(null); 
  // 🎯 ສ່ວນ States ເດີມຂອງທ່ານ (ຮັກສາໄວ້ຄົບຖ້ວນ ໑ doເປີເຊັນ)
  const [allServerItems, setAllServerItems] = useState([]); 
  const [drinkModalOpen, setDrinkModalOpen] = useState(false);
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [billingModalOpen, setBillingModalOpen] = useState(false); 
  const [selectedTable, setSelectedTable] = useState(null);
  const [receiptDatetime, setReceiptDatetime] = useState('');
  const [receiptLang, setReceiptLang] = useState('lo');
  const [detailedItems, setDetailedItems] = useState([]);
  const [restaurantInfo, setRestaurantInfo] = useState({ name: '', logo_url: '', qr_url: '' });

  const prevServedFoodCountRef = useRef({});
  const prevRequestedTablesRef = useRef([]);
  const staffReceiptModalRef = useRef(null);
  const prevTableBillRequestedMapRef = useRef({});

  const enableAudioSystem = () => {
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) {
      const audio = new Audio('/notification1.mp3');
      audio.play().catch(e => console.log('Audio Active'));
    }
  };

  // 🎯 [ຈຸດປົດລັອກໃຫຍ່ ໑]: ຍົກຟັງຊັນ fetchAllData ຂຶ້ນມາປະກາດໄວ້ດ້ານເທິງສຸດ ປິດບັກ Hoisting 100%
  const fetchAllData = useCallback(async () => {
    try {
      const resStaffData = await fetch('/api/staff-data').catch(() => null);
      if (resStaffData && resStaffData.ok) {
        const staffJson = await resStaffData.json().catch(() => ({}));
        if (staffJson && staffJson.restaurantProfile) {
          setRestaurantInfo(staffJson.restaurantProfile);
        }
      }

      const [tablesRes, ordersRes, itemsRes, menusRes] = await Promise.all([
        supabase.from('tables').select('*').order('id', { ascending: true }),
        supabase.from('orders').select('*'),
        supabase.from('order_items').select('*'),
        supabase.from('menus').select('id, name_lo, name_en, name_zh, name_th, price, category_id')
      ]);

      if (tablesRes.error) throw tablesRes.error;
      const fetchedTables = tablesRes.data || [];
      setTables(fetchedTables);

      // 🎯 [ແກ້ບັກຍອດເງິນບໍ່ຂຶ້ນໃນ Card ໂຕະ - ພາກສ່ວນທີ 1]: ຮວມສະຖານະ completed ເຂົ້າມາໃນກອງຂໍ້ມູນຫຼັກ ປ້ອງກັນຂໍ້ມູນຫຼຸດຫາຍຕອນກົດສຳເລັດ
      const fetchedOrders = ordersRes.data || [];
      const fetchedItems = itemsRes.data || [];
      const fetchedMenus = menusRes.data || [];

      // 🔥 ປັບປຸງໃຫ້ຮວມເອົາ 'completed' ຂອງອໍເດີ້ຮອບປັດຈຸບັນເຂົ້າມານຳ (ຕັດສະເພາະອໍເດີ້ໂຕະຫວ່າງທີ່ເຄຼຍໂຕະໄປແລ້ວຖິ້ມ)
      const activeOrders = fetchedOrders.filter(function(o) {
        const matchTable = fetchedTables.find(t => String(t.id) === String(o.table_id));
        const isTableOpen = matchTable && (matchTable.status === 'occupied' || matchTable.bill_requested === true || String(matchTable.bill_requested).toLowerCase() === 'true');
        return isTableOpen && (o.status === 'pending' || o.status === 'preparing' || o.status === 'served' || o.status === 'completed');
      });

      const activeOrderIds = activeOrders.map(o => o.id);


      const currentServerItems = fetchedItems.filter(item => activeOrderIds.includes(item.order_id)).map(item => {
        const m = fetchedMenus.find(menu => menu.id === item.menu_id);
        const matchingOrder = activeOrders.find(o => o.id === item.order_id);
        return {
          ...item,
          price_per_unit: m ? m.price : 0,
          category_id: m ? Number(m.category_id) : 1,
          name_lo: m ? m.name_lo : '🍲 ລາຍການ',
          name_en: m ? m.name_en : 'Food',
          name_zh: m ? m.name_zh : 'Food',
          name_th: m ? m.name_th : 'อาหาร',
          table_id: matchingOrder ? matchingOrder.table_id : item.table_id,
          parsed_table_id: matchingOrder ? Number(matchingOrder.table_id) : 0,
          lang: matchingOrder ? (matchingOrder.lang || 'lo') : 'lo'
        };
      });
      setAllServerItems(currentServerItems);
 
      // 🎯 [ເວີຊັນປິດບັກຍອດເງິນ ພາກສ່ວນທີ 1]: ຕັດຕົວແປດັກຈັບໂຕະອອກ ບວກເງິນສົດຈາກທຸກລາຍການ 'completed' ປັດຈຸບັນທັນທີ
      const totals = {};
      currentServerItems.forEach((item) => {
        if (item && item.table_id) {
          const status = item.item_status;

          // 🔥 ບັງຄັບເງື່ອນໄຂ: ຖ້າພະນັກງານກົດຮອດ 'completed' (ສຳເລັດ) ໃຫ້ບວກເງິນເຂົ້າບິນລວມສົດທັນທີ!
          if (status === 'completed') {
            const itemTotal = Number(item.price_per_unit || 0) * Number(item.quantity || 0);
            const primaryKey = item.table_id;
            const castKey = Number(item.table_id);
            
            totals[primaryKey] = (totals[primaryKey] || 0) + itemTotal;
            if (primaryKey !== castKey) {
              totals[castKey] = (totals[castKey] || 0) + itemTotal;
            }
          }
        }
      });
      setBills(totals);

    
      // =======================================================================
      // 🚀 ⭐️ [Part 1 - ເວີຊັນແກ້ສຽງດັງຕະຫຼອດ]: ລະບົບສຽງດັງວົນລູກຕະຫຼອດ (Loop Alarm) ຈົນກວ່າຈະກົດເຄຼຍ ⭐️ 🚀
      // =======================================================================
      if (!globalThis.__prevPendingDrinksCountMap) globalThis.__prevPendingDrinksCountMap = {};

      let triggerAlarmLoop = false;

      fetchedTables.forEach(table => {
        const currentPendingDrinks = currentServerItems.filter(i => Number(i.category_id) === 2 && Number(table.id) === Number(i.table_id) && i.item_status === 'pending').length;
        const currentServedFood = currentServerItems.filter(i => Number(i.category_id) === 1 && Number(table.id) === Number(i.table_id) && i.item_status === 'served').length;

        // ກວດເຊັກ ຫາກມີອໍເດີ້ເຄື່ອງດື່ມຄ້າງ pending ຫຼື ອາຫານຄ້າງ served ບັງຄັບໃຫ້ລະບົບເປີດສັນຍານເຕືອນ
        if (currentPendingDrinks > 0 || currentServedFood > 0) {
          triggerAlarmLoop = true;
        }

        globalThis.__prevPendingDrinksCountMap[table.id] = currentPendingDrinks;
        prevServedFoodCountRef.current[table.id] = currentServedFood;
      });

      // 🎯 [ສູດເດັດບັງຄັບສຽງດັງຕະຫຼອດ]: ດັງວົນລູກໄປເລື້ອຍໆ ທຸກໆຮອບ Polling 3 ວິນາທີ ຫາກຍັງບໍ່ທັນມີການກົດເຄຼຍ
      if (triggerAlarmLoop && audioEnabled) {
        try {
          // ສັ່ງຫຼິ້ນສຽງ /notification1.mp3 ຕິດຕໍ່ກັນ ໒ ຄັ້ງຖີ່ໃນແຕ່ລະຮອບ ບໍ່ມີວັນມິດງຽບ [໑]
          const audio1 = new Audio('/notification1.mp3');
          audio1.volume = 1.0;
          audio1.play().then(() => {
            setTimeout(() => {
              const audio2 = new Audio('/notification1.mp3');
              audio2.volume = 1.0;
              audio2.play().catch(() => {});
            }, 500);
          }).catch(() => {});
        } catch (soundErr) { console.log(soundErr); }
      }


      const currentlyRequested = (fetchedTables || []).filter(t => 
        t.bill_requested === true || t.bill_requested === 'true' || String(t.bill_requested).toLowerCase() === 'true'
      ).map(t => t.id);

      const newlyRequested = currentlyRequested.filter(id => !prevRequestedTablesRef.current.includes(id));
      if (newlyRequested.length > 0 && audioEnabled === true) {
        new Audio('/notification1.mp3').play().catch(e => console.error(e));
      }
      prevRequestedTablesRef.current = currentlyRequested;

      if (selectedTable) {
        const freshFiltered = currentServerItems.filter(item => Number(item.table_id) === Number(selectedTable.id) || item.parsed_table_id === Number(selectedTable.id));
        setDetailedItems(freshFiltered);
      }

      setError(null);
    } catch (err) {
      console.error("🎯 Fetch error detailed:", err.message || err);
      setError(err.message || "Connection Error");
    } finally {
      setLoading(false);
    }
  }, [audioEnabled, selectedTable]);
    // 🎯 [ເວີຊັນສ້າງຟັງຊັນອັບເດດສະຖານະ]: ຝັງສ້າງ updateItemStatus ໃໝ່ ປິດບັກແຖວ 787 ຫາຍຂາດ 100%
    const updateItemStatus = async function(itemId, nextStatus) {
      try {
        const { error: updateErr } = await supabase
          .from('order_items')
          .update({ item_status: nextStatus })
          .eq('id', itemId);
  
        if (updateErr) throw updateErr;
        
        // ເອີ້ນໃຊ້ຟັງຊັນດຶງຂໍ້ມູນໃໝ່ທັນທີ (ຫາກໜ້າພະນັກງານຂອງທ່ານໃຊ້ຊື່ອື່ນ ເຊັ່ນ loadData() ໃຫ້ປ່ຽນຊື່ບ່ອນນີ້ໃຫ້ກົງກັນເດີ້ເຈົ້າ)
        if (typeof fetchData === 'function') {
          fetchData();
        } else if (typeof loadData === 'function') {
          loadData();
        }
      } catch (err) {
        alert('ຂໍ້ອະໄພ ອັບເດດສະຖານະຫຼົ້ມ: ' + err.message);
      }
    };
    // 🎯 [ເວີຊັນປິດບັກໃບບິນຫວ່າງເປົ່າ 100%]: ຝັງສ້າງຟັງຊັນ handleUpdateItemStatus ຍັດໃສ່ໄຟລ໌ຮຽບຮ້ອຍ
    const handleUpdateItemStatus = async (itemId, newStatus) => {
      try {
        // 🔥 [ຈຸດແກ້ໄຂຫຼັກ]: ໃຊ້ ...i ເພື່ອຮັກສາ price_per_unit ແລະ category_id ຂອງເກົ່າໄວ້ຄົບຖ້ວນ ບໍ່ໃຫ້ຫຼົກຫາຍ!
        setAllServerItems(prev => prev.map(i => i.id === itemId ? { ...i, item_status: newStatus } : i));
        setDetailedItems(prev => prev.map(i => i.id === itemId ? { ...i, item_status: newStatus } : i));
        
        // ສົ່ງຄ່າໄປອັບເດດໃນ Database Supabase
        await supabase
          .from('order_items')
          .update({ item_status: newStatus })
          .eq('id', itemId);
          
        // ເອີ້ນດຶງຂໍ້ມູນຫຼັງບ້ານທັງໝົດຄືນໃໝ່ໃຫ້ເປະ 100%
        if (typeof fetchAllData === 'function') {
          await fetchAllData();
        }
        if (typeof fetchData === 'function') {
          await fetchData();
        }
      } catch (err) {
        console.error("Error updating status:", err);
        if (typeof fetchAllData === 'function') fetchAllData();
      }
    };
// 🎯 [ເວີຊັນປິດບັກໃບບິນຫວ່າງເປົ່າ 100%]: ຮວມອັບເດດທັງ setOrderItems ແລະ setAllServerItems ຄູ່ກັນ ປ້ອງກັນຂໍ້ມູນຫຼົກຫາຍໃນໃບບິນ
const fetchData = useCallback(async function() {
  try {
    // ໑. ດຶງຂໍ້ມູນໂຕະທັງໝົດ
    const tablesRes = await supabase.from('tables').select('*').order('id', { ascending: true });
    if (tablesRes.error) throw tablesRes.error;
    setTables(tablesRes.data || []);

    // ໒. ດຶງຂໍ້ມູນອໍເດີ້ທີ່ຍັງບໍ່ທັນປິດ (ຮວມເອົາ completed ທີ່ຫາກໍ່ກົດມາຄຳນວນຍອດເງິນລວມສົດ)
    const ordersRes = await supabase.from('orders').select('*').in('status', ['pending', 'preparing', 'served', 'completed']);
    if (ordersRes.error) throw ordersRes.error;
    const fetchedOrders = ordersRes.data || [];
    setOrders(fetchedOrders);

    // ໓. ດຶງລາຍການອາຫານໃນອໍເດີ້ທັງໝົດ
    let fetchedItems = [];
    if (fetchedOrders.length > 0) {
      const orderIds = fetchedOrders.map(function(o) { return o.id; });
      const itemsRes = await supabase.from('order_items').select('*').in('order_id', orderIds);
      if (itemsRes.error) throw itemsRes.error;
      fetchedItems = itemsRes.data || [];
    }

    // ໔. ດຶงຂໍ້ມູນເມນູອາຫານທັງໝົດ
    const menusRes = await supabase.from('menus').select('*');
    if (menusRes.error) throw menusRes.error;
    const fetchedMenus = menusRes.data || [];
    setMenuItems(fetchedMenus);

    // ໕. ດຶງຂໍ້ມູນໝວດໝູ່ສົດໆ ຈາກ Database
    const { data: catData, error: catErr } = await supabase.from('categories').select('*').order('id', { ascending: true });
    if (!catErr && catData && catData.length > 0) {
      setCategories(catData);
    } else {
      setCategories([
        { id: 1, name_lo: 'ອາຫານ', name_en: 'Food' },
        { id: 2, name_lo: 'ເຄື່ອງດື່ມ', name_en: 'Drinks' }
      ]);
    }

    // ໖. 🔥 [ຈຸດແກ້ໄຂຫຼັກ]: Map ຝັງຄ່າລາຄາ ແລະ ໝວດໝູ່ ເຂົ້າໄປໃນທັງ ໒ ຕົວແປຫຼັກ ປິດບັກໃບບິນຫວ່າງເປົ່າ 100%!
    const activeOrderIds = fetchedOrders.map(o => o.id);
    const detailedItemsMapped = fetchedItems.map(item => {
      const m = fetchedMenus.find(menu => menu.id === item.menu_id);
      const matchingOrder = fetchedOrders.find(o => o.id === item.order_id);
      return {
        ...item,
        price_per_unit: m ? Number(m.price || 0) : 0,
        category_id: m ? Number(m.category_id) : 1,
        name_lo: m ? m.name_lo : '🍲 ລາຍການ',
        name_en: m ? m.name_en : 'Food',
        name_zh: m ? m.name_zh : 'Food',
        name_th: m ? m.name_th : 'อาหาร',
        table_id: matchingOrder ? matchingOrder.table_id : item.table_id,
        parsed_table_id: matchingOrder ? Number(matchingOrder.table_id) : 0,
        lang: matchingOrder ? (matchingOrder.lang || 'lo') : 'lo'
      };
    });
    
    // 🔥 ສັ່ງອັບເດດຄູ່ກັນທັງສອງຝັ່ງ ປ້ອງກັນໃບບິນຫຼົກຫາຍ!
    setOrderItems(detailedItemsMapped);
    setAllServerItems(detailedItemsMapped); 

    // 🎯 [ຄຳນວນບິນລວມສົດ]: ບວກລາຄາສະເພາະລາຍການທີ່ສະຖານະເປັນ 'served' ຫຼື 'completed' ຂອງອໍເດີ້ປັດຈຸບັນ
    const totals = {};
    detailedItemsMapped.forEach(function(item) {
      const status = item.item_status;
      if (status === 'served' || status === 'completed') {
        const itemTotal = Number(item.price_per_unit || 0) * Number(item.quantity || 0);
        const primaryKey = item.table_id;
        const castKey = Number(item.table_id);

        totals[primaryKey] = (totals[primaryKey] || 0) + itemTotal;
        if (primaryKey !== castKey) {
          totals[castKey] = (totals[castKey] || 0) + itemTotal;
        }
      }
    });
    setBills(totals); // ອັບເດດຍອດເງິນລວມສົດເທິງ Card ໂຕະ

    // 🎯 [Sync ຂໍ້ມູນໃບບິນສົດ]: ຫາກກຳລັງເປີດໃບບິນຂອງໂຕະໃດໜຶ່ງຢູ່ ໃຫ້ອັບເດດຂໍ້ມູນໃນໃບບິນນັ້ນໃຫ້ໂຊສົດ Real-time ທັນທີ
    if (selectedTable) {
      const freshFiltered = detailedItemsMapped.filter(item => Number(item.table_id) === Number(selectedTable.id) || item.parsed_table_id === Number(selectedTable.id));
      setDetailedItems(freshFiltered);
    }

    setError(null);
  } catch (err) {
    console.error('Error fetching staff data:', err);
    setError(err.message || 'Error loading data');
  } finally {
    setLoading(false);
  }
}, [selectedTable]);

// 🎯 [ເວີຊັນປິດບັກ Refresh ປ້າຍຫາຍ + ຂໍ້ມູນໃບບິນຄົບ 100%]: ສັ່ງລັນຮວມທັງ ໒ ຟັງຊັນພ້ອມກັນໃນທຸກໆ 4 ວິນາທີອັດຕະໂນມັດ
useEffect(function() {
  let isMounted = true;

  var runAllSyncData = async function() {
    if (!isMounted) return;
    // 🔥 ສັ່ງລັນຄູ່ກັນທັນທີ ບັງຄັບໃຫ້ປ້າຍເຕືອນໄພສີແດງ, ຕົວເລກ, ແລະ ຍອດເງິນດີດຂຶ້ນໂອໂຕ້ທັນຕາ ຕັ້ງແຕ່ Refresh!
    if (typeof fetchAllData === 'function') {
      await fetchAllData();
    }
    if (typeof fetchData === 'function') {
      await fetchData();
    }
  };

  // ລັນຮອບທຳອິດທັນທີຕອນ Refresh ເປີດໜ້າຈໍ
  runAllSyncData();

  // 🔄 ຕັ້ງວົງລູບ Polling ໃຫ້ຄອຍກວາດດຶງຂໍ້ມູນໂອໂຕ້ທຸກໆ 4 ວິນາທີ ຄົບຖ້ວນທຸກຕົວແປ
  var interval = setInterval(function() {
    runAllSyncData();
  }, 4000);

  return function() {
    isMounted = false;
    clearInterval(interval);
  };
}, [fetchAllData, fetchData]); // ຝັງ Dependency ໃຫ້ຄົບຖ້ວນ ຕັດບັນຫາຄ່າຫຼົກຫາຍ 100%

  // 🎯 [ຈຸດປົດລັອກໃຫຍ່ ໒]: ລະບົບດັກຟັງ Supabase Real-time ເອົາໄວ້ດ້ານລຸ່ມ fetchAllData ແລະ ຝັງ Dependency ຄົບຖ້ວນ
  useEffect(() => {
    if (!supabase) return;

    const tablesChannel = supabase
      .channel('staff-dashboard-tables-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tables' }, (payload) => {
        if (payload.new && (payload.new.bill_requested === true || payload.new.bill_requested === 'true' || String(payload.new.bill_requested).toLowerCase() === 'true')) {
          try {
            const audioAlert = new Audio('/notification1.mp3');
            audioAlert.volume = 1.0;
            audioAlert.play().catch((e) => console.log("Audio play loading...", e));
          } catch (err) { console.log(err); }
        }
        fetchAllData();
      })
      .subscribe();

    const broadcastChannel = supabase
      .channel('table-updates')
      .on('broadcast', { event: 'call_bill' }, (response) => {
        try {
          const audioAlert = new Audio('/notification1.mp3');
          audioAlert.volume = 1.0;
          audioAlert.play().catch(() => {});
        } catch(e){}
        fetchAllData();
      })
      .on('broadcast', { event: 'cancel_bill' }, (response) => {
        fetchAllData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tablesChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [fetchAllData]);

  // 🎯 [ແກ້ໄຂສະເພາະການລຽງໂຕະ ພາກສ່ວນທີ 3]: ໂຕະເປີດ/ຮຽກເກັບເງິນ ດີດຂຶ້ນເທິງສຸດ, ໂຕະຫວ່າງລົງລຸ່ມ, ສ່ວນອື່ນໆຮັກສາໄວ້ຄືເກົ່າ 100%
  const sortedTables = useMemo(() => {
    if (!tables) return [];
    return [...tables].sort((a, b) => {
      // ໑. ກວດເຊັກສະຖານະລູກຄ້າກົດຮຽກເກັບເງິນ (Bill Requested)
      const aBill = a.bill_requested === true || a.bill_requested === 'true' || String(a.bill_requested).toLowerCase() === 'true';
      const bBill = b.bill_requested === true || b.bill_requested === 'true' || String(b.bill_requested).toLowerCase() === 'true';
      
      // ໒. ກວດເຊັກສະຖານະໂຕະເປີດ (Occupied / ມີລູກຄ້ານັ່ງ)
      const aOccupied = a.status === 'occupied';
      const bOccupied = b.status === 'occupied';

      // 🏆 ເງື່ອນໄຂທີ 1: ໂຕະຮຽກເກັບເງິນ 🔔 ບັງຄັບດີດຂຶ້ນເທິງສຸດກ່ອນໝູ່
      if (aBill && !bBill) return -1;
      if (!aBill && bBill) return 1;

      // 🥈 ເງື່ອນໄຂທີ 2: ໂຕະທີ່ກຳລັງເປີດຢູ່ 🔴 (ມີລູກຄ້ານັ່ງ) ໃຫ້ດີດຂຶ້ນມາລຽງຕໍ່ກັນຢູ່ແຖວເທິງສຸດ
      if (aOccupied && !bOccupied) return -1;
      if (!aOccupied && bOccupied) return 1;

      // 🥉 ເງື່ອນໄຂທີ 3: ໂຕະຫວ່າງ ⚪ ໃຫ້ຫຼົກລົງໄປຢູ່ດ້ານລຸ່ມສຸດ ຫາກສະຖານະເທົ່າກັນໃຫ້ລຽງຕາມເບີໂຕະປົກຕິ
      return Number(a.id) - Number(b.id);
    });
  }, [tables]);


  // 🎯 [ຈຸດແກ້ໄຂ ໑]: ລະບົບດັກຈັບອໍເດີ້ໃໝ່ (pending) ພໍລູກຄ້າກົດສັ່ງປຸບ ສັ່ງດັງເພງແຈ້ງເຕືອນພະນັກງານທັນທີ 100%
  useEffect(function() {
    if (!audioEnabled || orderItems.length === 0) return;

    // ກັບສອບຫາລາຍການອາຫານໃໝ່ທັງໝົດໃນຮ້ານ ທີ່ມີສະຖານະເປັນ pending
    const currentPendingItems = orderItems.filter(function(item) {
      return item.item_status === 'pending';
    });

    // ດຶງຄ່າຈຳນວນ pending ເກົ່າທີ່ເຄີຍບັນທຶກໄວ້ໃນ Memory
    const prevPendingCount = prevServedFoodCountRef.current.__totalPending || 0;

    // ⚠️ ຖ້າຈຳນວນ pending ປັດຈຸບັນ ຫຼາຍກວ່າຄ່າເກົ່າ (ສະແດງວ່າມີລູກຄ້າກົດສັ່ງເຂົ້າມາໃໝ່ສົດໆ!)
    if (currentPendingItems.length > prevPendingCount) {
      const audio = new Audio('/notification1.mp3');
      audio.play().catch(function(e) { console.log('Audio error:', e); });
    }

    // ບັນທຶກຄ່າຈຳນວນ pending ປັດຈຸບັນ ເກັບໄວ້ທຽບໃນຮອບ Polling ຖັດໄປ
    prevServedFoodCountRef.current.__totalPending = currentPendingItems.length;
  }, [orderItems, audioEnabled]);

  const prepareModalContext = async (table, modalType) => {
    setSelectedTable(table);
    setReceiptDatetime(new Date().toLocaleString('lo-LA', { hour12: false }));
    const allTableItems = allServerItems.filter(item =>
      Number(item.table_id) === Number(table.id) ||
      item.parsed_table_id === Number(table.id)
    );
    setDetailedItems(allTableItems);

    try {
      const { data: orderData } = await supabase
        .from('orders')
        .select('order_lang')
        .eq('table_id', table.id)
        .in('status', ['pending', 'preparing', 'served'])
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (orderData?.order_lang) {
        setReceiptLang(orderData.order_lang);
      } else if (allTableItems && allTableItems.length > 0) {
        const foundItemWithLang = allTableItems.find(item => item.order_lang || item.lang);
        setReceiptLang(foundItemWithLang ? (foundItemWithLang.order_lang || foundItemWithLang.lang) : 'lo');
      } else {
        setReceiptLang('lo');
      }
    } catch (e) {
      console.error(e);
      setReceiptLang('lo');
    }

    if (modalType === 'drink') setDrinkModalOpen(true);
    if (modalType === 'food') setFoodModalOpen(true);
    if (modalType === 'billing') setBillingModalOpen(true);
  };

  const handleServeDrinksDone = async (itemId) => {
    try {
      const { error: updateError } = await supabase
        .from('order_items')
        .update({ item_status: 'served' })
        .eq('id', itemId);
      if (updateError) throw updateError;
      await fetchAllData();
      setDetailedItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err) {
      console.error(err);
      fetchAllData();
    }
  };

  const handleServeFoodDone = async (itemId) => {
    try {
      const { error: updateError } = await supabase
        .from('order_items')
        .update({ item_status: 'completed' })
        .eq('id', itemId);
      if (updateError) throw updateError;
      await fetchAllData();
      setDetailedItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err) {
      console.error(err);
      fetchAllData();
    }
  };



  const openTable = async (table) => {
    setActionLoadingId(table.id);
    await supabase.from('tables').update({ status: 'occupied', bill_requested: false }).eq('id', table.id);
    await supabase.from('orders').insert([{
      table_id: Number(table.id),
      status: 'pending',
      lang: 'lo'
    }]);
    fetchAllData();
    setActionLoadingId(null);
  };

  const closeTable = async (table) => {
    setActionLoadingId(table.id);
    try {
      const isCurrentlyRequested = table.bill_requested === true || table.bill_requested === 'true' || String(table.bill_requested).toLowerCase() === 'true';
      prevTableBillRequestedMapRef.current[table.id] = isCurrentlyRequested;
      prevTableBillRequestedMapRef.current[Number(table.id)] = isCurrentlyRequested;

      await fetch('/api/staff-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close', tableId: table.id })
      });

      setDrinkModalOpen(false);
      setFoodModalOpen(false);
      setBillingModalOpen(false);
      setSelectedTable(null);
      await fetchAllData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

   // 🎯 [ແກ້ບັກປ້າຍເຕືອນຫາຍຕອນກູ້ຄືນໂຕະ]: ຝັງສັ່ງ fetchData() ທັນທີ ປ້າຍເຕືອນໄພດີດຂຶ້ນຄາຕາ 100% ໂດຍບໍ່ຕ້ອງຄລິກໜ້າຈໍ
   const handleUndoTable = async (table) => {
    setActionLoadingId(table.id);
    globalThis.__globalSilentUndoTableIdMap[table.id] = true;
    globalThis.__globalSilentUndoTableIdMap[Number(table.id)] = true;
    try {
      if (!prevRequestedTablesRef.current.includes(table.id)) {
        prevRequestedTablesRef.current.push(table.id);
      }
      const res = await fetch('/api/staff-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'undo', tableId: table.id, table_id: table.id })
      });

      if (!res.ok) throw new Error('Failed to undo table parameters');

      const wasRequestedBeforeClose =
        prevTableBillRequestedMapRef.current[table.id] === true ||
        prevTableBillRequestedMapRef.current[Number(table.id)] === true;
      await supabase.from('tables').update({ bill_requested: wasRequestedBeforeClose }).eq('id', table.id);

      // 🔥 [ຈຸດແກ້ໄຂຫຼັກ]: ສັ່ງລັນທັງ ໒ ຟັງຊັນຄູ່ກັນ ເພື່ອໃຫ້ປ້າຍເຕືອນໄພສີແດງ ແລະ ຕົວເລກດີດຂຶ້ນມາທັນທີ!
      await fetchAllData();
      if (typeof fetchData === 'function') {
        await fetchData();
      }

      setTimeout(async () => {
        await fetchAllData();
        if (typeof fetchData === 'function') {
          await fetchData();
        }
        globalThis.__globalSilentUndoTableIdMap[table.id] = false;
        globalThis.__globalSilentUndoTableIdMap[Number(table.id)] = false;
      }, 5000);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };


  if (loading) return 'ກຳລັງໂຫຼດຂໍ້ມູນລະບົບພະນັກງານ...';
  if (error) return { error };
  const rUi = RECEIPT_UI[receiptLang] || RECEIPT_UI.lo;


  return (
    <div className="min-h-screen bg-gray-50 pb-16 max-w-5xl mx-auto shadow-sm border-x border-gray-200/60 relative">
      {/* Header Area */}
      <div className="bg-white shadow-sm px-4 sm:px-6 py-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 rounded-b-2xl gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-1.5">🖥️ ແຜງຄວບຄຸມພະນັກງານ</h1>
          <p className="text-[11px] text-gray-500 font-black mt-0.5">🟢 ສະຖານະໂຕະ Real-time</p>
        </div>
        <button 
          onClick={enableAudioSystem} 
          className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-black shadow-sm transition border text-center ${
            audioEnabled ? 'bg-green-500 text-white border-green-400' : 'bg-red-500 text-white animate-pulse border-red-400'
          }`}
        >
          {audioEnabled ? '🔊 ເປີດສຽງເຕືອນ' : '🔇 ປິດສຽງເຕືອນ'}
        </button>
      </div>
      {/* 🎯 ໕. ແຜນຜັງວາດ Card ໂຕະ ເວີຊັນອ່ານຊື່ໂຕະຫຼາຍພາສາ (name_lo, name_en...) ຈາກ Database 100% */}
      <div className="px-3 sm:px-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 text-black">
        {sortedTables.map((table) => {
          const isOccupied = table.status === 'occupied';
          const isBillRequested = table.bill_requested === true || table.bill_requested === 'true' || String(table.bill_requested).toLowerCase() === 'true';
          const bill = bills[table.id] || bills[Number(table.id)] || 0;
          const isProcessing = actionLoadingId === table.id;

          const hasDrinksPending = allServerItems.some(i => Number(i.category_id) === 2 && Number(i.table_id) === Number(table.id) && i.item_status === 'pending');
          const hasFoodReady = allServerItems.some(i => Number(i.category_id) === 1 && Number(i.table_id) === Number(table.id) && i.item_status === 'served');
        
          const cardStyle = isBillRequested 
            ? 'bg-amber-100/90 border-amber-500 animate-pulse ring-4 ring-amber-400/50 shadow-md' 
            : isOccupied ? 'bg-red-50/60 border-red-300' : 'bg-green-50/60 border-green-300';

          // 🎯 [ຈຸດປ່ຽນແປງຫຼັກ]: ດຶງຊື່ໂຕະພາສາລາວ (name_lo) ເປັນຫຼັກສຳລັບໜ້າຈໍພະນັກງານ ຫາກຫວ່າງເປົ່າໃຫ້ໃຊ້ table_number
          const currentTableName = table.name_lo || table.name || `ໂຕະເບີ ${table.table_number || table.id}`;

          return (
            <div key={table.id} className={`rounded-2xl border-2 p-3 sm:p-4 flex flex-col shadow-sm justify-between min-h-[190px] sm:min-h-[210px] transition hover:shadow-md ${cardStyle}`}>
              <div>
                <div className="flex items-start justify-between gap-1">
                  <div>
                    {isBillRequested && (
                      <p className="text-[10px] bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black px-2 py-0.5 rounded-md mb-1.5 text-center shadow-md animate-pulse border border-amber-600 flex items-center justify-center gap-0.5">
                        <span>🔔</span> ເກັບເງິນ!
                      </p>
                    )}
                    <h2 className="text-base sm:text-lg font-black text-black tracking-wide">
                      {currentTableName}
                    </h2>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <button
                      disabled={isProcessing}
                      onClick={async () => {
                        if (isOccupied || isBillRequested) {
                          const confirmClose = bill > 0 ? window.confirm(`${currentTableName} ມີຍອດຄ້າງ ${bill.toLocaleString()} K, ທ່ານແນ່ໃຈບໍ່ທີ່ຈະປິດໂຕະນີ້?`) : true;
                          if (confirmClose) closeTable(table);
                        } else { openTable(table); }
                      }}
                      className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 shadow-inner ${(isOccupied || isBillRequested) ? 'bg-green-600' : 'bg-gray-300'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${(isOccupied || isBillRequested) ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-[9px] font-black text-gray-500 mt-1 uppercase tracking-tighter">{(isOccupied || isBillRequested) ? '🔒 ເປີດໂຕະ' : '🔓 ຫວ່າງ'}</span>
                  </div>
                </div>

                {/* 🎯 [ແກ້ບັກຍອດເງິນສູງເກີນຈິງ]: ດຶງຄ່າຈາກ Object bills ທີ່ຄຳນວນມາຈາກຫຼັງບ້ານໂດຍກົງ ບໍ່ຄຳນວນຊ້ອນກັນ */}
                <div className="mt-1">
                  <span className="bg-gray-100/90 text-gray-800 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded border border-gray-200 block w-max shadow-sm">
                    {isOccupied || isBillRequested 
                      ? "💰 ຍອດ: " + (bills[table.id] || bills[Number(table.id)] || 0).toLocaleString() + " K" 
                      : "🟢 ໂຕະຫວ່າງ"}
                  </span>
                </div>

              </div>
            {/* 🎯 [ເວີຊັນປິດບັກປ້າຍເຕືອນບໍ່ໂອໂຕ້]: ປ່ຽນມາກວດເຊັກອໍເດີ້ໃໝ່ຜ່ານ allServerItems ບັງຄັບໃຫ້ປ້າຍແດງຂຶ້ນໂອໂຕ້ທັນທີ 100% */}
            <div className="mt-3 space-y-1.5">
              {isOccupied || isBillRequested ? (
                <>
                         {(() => {
                    // ໑. ຄົ້ນຫາອໍເດີ້ທັງໝົດທີ່ກຳລັງດຳເນີນງານຂອງໂຕະນີ້
                    const currentTableOrders = (orders || []).filter(function(o) { 
                      return String(o.table_id) === String(table.id); 
                    });
                    const activeOrderIds = currentTableOrders.map(function(o) { 
                      return o.id; 
                    });

                    // 🎯 [Logic ຄຳນວນສີປຸ່ມໝວດໝູ່ ຝັ່ງພະນັກງານ 100%]: ບັງຄັບເລີ່ມຕົ້ນສີແດງ 🔴 ແລະ ປ່ຽນຕາມສະຖານະ
                    const getCategoryBgColorClass = (catId) => {
                      // ກັ່ນຕອງເອົາສະເພາະອາຫານທີ່ຢູ່ໃນໝວດໝູ່ນີ້ ແລະ ເປັນອໍເດີ້ຂອງໂຕະນີ້ເທົ່ານັ້ນ (ຜ່ານ allServerItems)
                      const catItems = (allServerItems || []).filter(function(item) {
                        return Number(item.category_id) === Number(catId) && activeOrderIds.includes(item.order_id);
                      });
                      
                      if (catItems.length === 0) return "";

                      const hasPending = catItems.some(item => (item.item_status || item.status) === 'pending');
                      const hasPreparing = catItems.some(item => (item.item_status || item.status) === 'preparing');
                      const hasServed = catItems.some(item => (item.item_status || item.status) === 'served');
                      const allCompleted = catItems.every(item => (item.item_status || item.status) === 'completed');

                      if (hasPending) return "bg-red-600 text-white border-red-500 animate-pulse font-black";
                      if (hasPreparing) return "bg-orange-500 text-white border-orange-400 animate-pulse font-black";
                      if (hasServed) return "bg-purple-600 text-white border-purple-500 font-black";
                      if (allCompleted) return "bg-green-600 text-white border-green-500 font-black";
                      return "";
                    };

                    // ໒. ວາດປຸ່ມກົດແຍກຕາມໝວດໝູ່ທັງໝົດໃນ Database
                    return categories.map(function(cat) {
                      const catName = localizedField(cat, 'name', receiptLang) || 'ໝວດໝູ່';
                      
                      // ກັ່ນຕອງລາຍການອາຫານໃໝ່ (Pending) ໃນໝວດນີ້ເພື່ອຂຶ້ນປ້າຍວົງມົນແຈ້ງເຕືອນ
                      const newItemsInCat = (allServerItems || []).filter(function(item) {
                        return Number(item.category_id) === Number(cat.id) && 
                               activeOrderIds.includes(item.order_id) && 
                               (item.item_status === 'pending' || item.status === 'pending');
                      });

                      const totalPendingQty = newItemsInCat.reduce(function(sum, item) {
                        return sum + (Number(item.quantity) || 0);
                      }, 0);

                      const hasNewOrderItems = totalPendingQty >= 1;
                      const isDrink = Number(cat.id) === 2;
                      const btnIcon = isDrink ? '🥤 ' : '🍲 ';

                      // 🎯 ດຶງຄ່າສີ Dynamic ທີ່ຄຳນວນໄດ້, ຫາກບໍ່ມີອາຫານໃນໝວດນັ້ນໃຫ້ຫຼົກໄປໃຊ້ສີ Fallback ຕາມປົກກະຕິ
                      const dynamicColorClass = getCategoryBgColorClass(cat.id);
                      const btnStyleClass = dynamicColorClass || (isDrink 
                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-bold' 
                        : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 font-bold');

                      return (
                        <button 
                          key={cat.id}
                          onClick={function() { 
                            if (typeof setSelectCategory !== 'undefined') { setSelectCategory(cat); }
                            setSelectedTable(table);
                            setFoodModalOpen(true); 
                          }} 
                          className={"w-full text-[10px] sm:text-[11px] py-2 px-3 rounded-xl transition border flex items-center justify-between gap-1 shadow-sm active:scale-98 " + btnStyleClass}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span>{btnIcon}</span>
                            <span className="truncate">{catName}</span>
                          </div>
                          
                          {/* ປ້າຍຕົວເລກແຈ້ງເຕືອນໄພວົງມົນສີຂາວ */}
                          {hasNewOrderItems && (
                            <span className="bg-white text-red-600 text-[10px] font-mono font-black h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center shadow-inner animate-bounce">
                              {totalPendingQty}
                            </span>
                          )}
                        </button>
                      );
                    });
                  })()}


                  {/* 💵 ປຸ່ມເຊັກບິນເກັບເງິນ (ພາສາລາວ 100%) */}
                  <button onClick={function() { setSelectedTable(table); setReceiptDatetime(new Date().toLocaleString('lo-LA', { hour12: false })); setBillingModalOpen(true); }} className="w-full bg-gray-800 hover:bg-gray-900 text-white text-[11px] font-black py-2.5 rounded-xl transition shadow-sm flex items-center justify-center gap-1 active:scale-98">
                    💵 ເຊັກບິນເກັບເງິນ
                  </button>
                </>
              ) : (
                <div className="space-y-1.5">
                  <button disabled={isProcessing} onClick={() => handleUndoTable(table)} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] sm:text-[11px] font-black py-2 rounded-xl transition border border-gray-300 shadow-sm active:scale-95 flex items-center justify-center gap-1">
                    {isProcessing ? '...' : '↩️ ກູ້ຄືນໂຕະຫຼ້າສຸດ'}
                  </button>
                  <p className="text-[9px] text-gray-400 font-bold text-center py-1 bg-gray-100/40 rounded-lg border border-dashed border-gray-200">💡 ຫຼື ເለື່ອນປຸ່ມແຈຂວาເພື່ອເປີດໂຕະໃໝ່</p>
                </div>
              )}
            </div>

            </div>
          );
        })}
      </div>
      {/* 📥 🥤 ໑. ປ໊ອບອັບ ເຄື່ອງດື່ມ (ແປພາສາຊື່ໂຕະຕາມລູກຄ້າອັດສະລິຍະ) */}
      {drinkModalOpen && selectedTable && (
        <div onClick={() => setDrinkModalOpen(false)} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl w-full max-w-sm p-5 text-center shadow-2xl overflow-y-auto max-h-[85vh] text-black cursor-default">
            <h2 className="font-black text-xl text-gray-900 mb-0.5">ລາຍການອໍເດີເຄື່ອງດື່ມ</h2>
            {/* 🎯 ດຶງຄ່າແຍກ ໔ ພາສາກົງໆຈາກຄໍລຳໃນຕາຕະລາງ tables ຕາມພາສາທີ່ລູກຄ້າກົດສັ່ງ */}
            <p className="text-sm text-gray-950 font-black">
              {receiptLang === 'en' ? (selectedTable.name_en || `Table ${selectedTable.table_number || selectedTable.id}`)
               : receiptLang === 'zh' ? (selectedTable.name_zh || `${selectedTable.table_number || selectedTable.id}号桌`)
               : receiptLang === 'th' ? (selectedTable.name_th || `โต๊ะ ${selectedTable.table_number || selectedTable.id}`)
               : (selectedTable.name_lo || `ໂຕະເບີ ${selectedTable.table_number || selectedTable.id}`)}
            </p>
            <p className="text-[11px] text-gray-400 font-bold">...ວັນທີເວລາ: {receiptDatetime}</p>
            <div className="border-t border-b border-dashed border-gray-300 py-3 my-3 text-left text-xs space-y-2.5">
              <div className="flex justify-between text-gray-900 font-black text-xs pb-1 border-b">
                <span className="w-[140px]">ລາຍການຄ້າງເສີບ</span>
                <span className="w-[60px] text-center">ຈຳນວນ</span>
                <span className="w-[60px] text-right">ເສີບ</span>
              </div>
              {detailedItems.filter(i => Number(i.category_id) === 2 && (i.item_status === 'pending' || i.status === 'pending')).map((line) => {
                const drinkName = receiptLang === 'en' ? (line.name_en || 'Beverage') : (line.name_lo || '...ເຄື່ອງດື່ມ');
                return (
                  <div key={line.id} className="flex justify-between items-center font-black text-sm py-1 text-gray-900">
                    <div className="w-[140px] leading-tight">
                      <p>🥤 {drinkName}</p>
                      {line.note && <p className="text-[10px] text-red-500 font-bold mt-0.5">📝 {line.note}</p>}
                    </div>
                    <span className="w-[60px] text-center font-mono text-orange-600 text-sm">x{line.quantity}</span>
                    <div className="w-[60px] text-right">
                      <button onClick={() => handleServeDrinksDone(line.id)} className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-2.5 py-1 rounded-lg active:scale-95 transition shadow-sm">✔️ ເສີບ</button>
                    </div>
                  </div>
                );
              })}
              <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100 mt-2 flex justify-between items-center text-xs font-black text-blue-950">
                <span>ຄ້າງເສີບທັງໝົດ:</span>
                <span className="text-base text-blue-700 font-mono">{detailedItems.filter(i => Number(i.category_id) === 2 && (i.item_status === 'pending' || i.status === 'pending')).reduce((sum, i) => sum + i.quantity, 0)} ລາຍການ</span>
              </div>
            </div>
            <button onClick={() => setDrinkModalOpen(false)} className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black text-xs rounded-xl py-2 shadow-sm transition active:scale-95">ປິດໜ້າຈໍ</button>
          </div>
        </div>
      )}

      {/* 🎯 [ເວີຊັນປຸ່ມປິດສີແດງຫຼູຫຼາ]: ປ່ຽນຂໍ້ຄວາມປຸ່ມປິດເປັນຄຳວ່າ "ປິດ" ແລະ ປ່ຽນເປັນສີແດງງາມເປະ 100% */}
      {foodModalOpen && selectedTable && (
        <div 
          onClick={function() { setFoodModalOpen(false); }} 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={function(e) { e.stopPropagation(); }} 
            className="bg-white rounded-3xl w-full max-w-md p-5 max-h-[85vh] overflow-y-auto text-black shadow-2xl animate-fade-in cursor-default"
          >
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="text-left">
                <h3 className="text-base font-black text-gray-900 leading-tight">
                  📋 {(() => {
                    const currentCat = typeof selectCategory !== 'undefined' ? selectCategory : typeof selectedCategory !== 'undefined' ? selectedCategory : null;
                    return currentCat ? localizedField(currentCat, 'name', receiptLang) : '...';
                  })()}
                </h3>
                <p className="text-[11px] text-gray-500 font-black mt-0.5">
                  {localizedField(selectedTable, 'name', receiptLang) || 'ໂຕະ #' + selectedTable.id}
                </p>
              </div>
              <button onClick={() => setFoodModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-black text-sm">✕</button>
            </div>

                      {/* List ລາຍການອໍເດີ້ພາຍໃນ Modal */}
            <div className="space-y-4 overflow-y-auto max-h-[55vh] pr-1">
              {(() => {
                // 🎯 [ປິດບັກແຖວ 644 ຫາຍຂາດ 100%]: ດັກຈັບ ຫາກ selectedTable ເປັນ null ໃຫ້ຢຸດແລ່ນທັນທີ ປ້ອງກັນແອັບຫຼົ້ມ
                if (!selectedTable) {
                  return <p className="text-center text-gray-400 py-8 font-black italic text-xs">ກຳລັງໂຫຼດຂໍ້ມູນໂຕະ...</p>;
                }

                // ໑. 🎯 [ປິດບັກລາຍການເກົ່າດີດຂຶ້ນມາທັງໝົດ]: ບັງຄັບໃຫ້ດຶງສະເພາະອໍເດີ້ທີ່ກຳລັງເປີດຢູ່ (ບໍ່ເອົາອໍເດີ້ທີ່ເຄຼຍປິດໂຕະໄປແລ້ວ)
                const currentTableOrders = (orders || []).filter(function(o) {
                  return String(o.table_id) === String(selectedTable.id) && 
                         (o.status === 'pending' || o.status === 'preparing' || o.status === 'served');
                });

                const activeOrderIds = currentTableOrders.map(o => o.id);
                const currentTableItems = (orderItems || []).filter(item => activeOrderIds.includes(item.order_id));
                const currentCat = typeof selectCategory !== 'undefined' ? selectCategory : typeof selectedCategory !== 'undefined' ? selectedCategory : null;

                const filteredModalItems = currentTableItems.filter(function(item) {
                  const matchMenu = (menuItems || []).find(function(m) { return m.id === item.menu_id; }) || 
                                    (menus || []).find(function(m) { return m.id === item.menu_id; });
                  const actualCategoryId = matchMenu ? String(matchMenu.category_id) : '';
                  const activeCat = typeof selectCategory !== 'undefined' && selectCategory ? selectCategory : (typeof selectedCategory !== 'undefined' && selectedCategory ? selectedCategory : null);
                  return activeCat ? actualCategoryId === String(activeCat.id) : actualCategoryId !== '2';
                });

                if (filteredModalItems.length === 0) {
                  return <p className="text-center text-gray-400 py-8 font-black italic text-xs">ຍັງບໍ່ມີລາຍການໃນໝວດນີ້ເທື່ອເຈົ້າ</p>;
                }

                // ຈັດກຸ່ມລຽງລໍາດັບຄ່າຕາມສະຖານະ: ໃໝ່ (pending) -> ແຕ່ງແລ້ວ (preparing) -> ມາເສີບ (served) -> ສຳເລັດ (completed)
                const baseReversedItems = [...filteredModalItems].reverse();
                const smartSortedItems = baseReversedItems.sort(function(a, b) {
                  const weight = { 'pending': 1, 'preparing': 2, 'served': 3, 'completed': 4 };
                  const weightA = weight[a.item_status || 'pending'] || 1;
                  const weightB = weight[b.item_status || 'pending'] || 1;
                  return weightA - weightB;
                });

                return smartSortedItems.map((item, idx) => {
                  const matchMenu = (menuItems || []).find(m => m.id === item.menu_id) || (menus || []).find(m => m.id === item.menu_id);
                  const status = item.item_status || 'pending';
                  const itemPriceStr = matchMenu ? Number(matchMenu.price).toLocaleString() + " K" : "";

                  // ⏳ ລະບົບຄິດໄລ່ເວລານາທີ Real-time (ປ່ຽນ "ຫາກໍ່ສັ່ງ" ໃຫ້ກາຍເປັນ "0 ນາທີ" ພາສາລາວ 100%)
                  let minutesElapsedStr = "";
                  if (item.created_at) {
                    const orderTime = new Date(item.created_at).getTime();
                    const currentTime = new Date().getTime();
                    const diffInMs = currentTime - orderTime;
                    const diffInMinutes = Math.floor(diffInMs / 60000);
                    
                    // 🎯 ປັບປຸງ: ຖ້າຫາກໍ່ສັ່ງ ຫຼື ເວລານ້ອຍກວ່າ 0 ໃຫ້ດີດສະແດງເປັນ "0 ນາທີ" ທັນທີ
                    if (diffInMinutes <= 0) {
                      minutesElapsedStr = "0 ນາທີ";
                    } else {
                      minutesElapsedStr = diffInMinutes + " ນາທີ";
                    }
                  }

                  return (
                    <div key={item.id} className="bg-gray-50 p-3 rounded-2xl border border-gray-150 flex flex-col gap-2.5 shadow-inner text-xs font-black">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="text-gray-900 font-black text-xs leading-snug flex flex-wrap items-center gap-x-1.5 gap-y-1">
                            {/* ຊື່ລາຍການອາຫານ */}
                            <span>✨ {matchMenu ? localizedField(matchMenu, 'name', receiptLang) : '🍲 ລາຍການອາຫານ'}</span>
                            
                            {/* ລາຄາອາຫານ */}
                            {itemPriceStr && <span className="text-orange-600 font-mono">({itemPriceStr})</span>}
                            
                            {/* ⏳ ປ້າຍเวลาຫຼັງລາຄາ */}
                            {minutesElapsedStr && (
                              <span className={"text-[10px] font-mono font-black px-1.5 py-0.5 rounded border inline-flex items-center gap-0.5 shrink-0 " + 
                                (status === 'completed' 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : (status === 'pending' || status === 'preparing'
                                      ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'))}
                              >
                                ⏳ {minutesElapsedStr}
                              </span>
                            )}
                          </div>

                          {item.note && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-3">📝 ໝາຍເຫດ: {item.note}</p>}
                        </div>
                        <span className="font-mono text-gray-900 font-black text-xs shrink-0 bg-gray-200 px-2 py-0.5 rounded-md">x{item.quantity}</span>
                      </div>

                      {/* 🚥 4 ປຸ່ມສະຖານະອິດສະຫຼະ */}
                      <div className="border-t border-gray-200/60 pt-2">
                        <div className="grid grid-cols-4 gap-1 text-[9px] font-black text-center text-black">
                          
                          <div 
                            onClick={function() { updateItemStatus(item.id, 'pending'); }}
                            className={"p-2 rounded-md border cursor-pointer transition select-none " + (status === 'pending' ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-300 animate-pulse' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-100')}
                          >
                            👨‍🍳 ຮັບອໍເດີ້
                          </div>

                          <div 
                            onClick={function() { updateItemStatus(item.id, 'preparing'); }}
                            className={"p-2 rounded-md border cursor-pointer transition select-none " + (status === 'preparing' ? 'bg-orange-500 text-white border-orange-400 shadow-md ring-2 ring-orange-300 animate-pulse' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-100')}
                          >
                            🍳 ແຕ່ງແລ້ວ
                          </div>

                          <div 
                            onClick={function() { updateItemStatus(item.id, 'served'); }}
                            className={"p-2 rounded-md border cursor-pointer transition select-none " + (status === 'served' ? 'bg-purple-500 text-white border-purple-400 shadow-md ring-2 ring-purple-300 animate-pulse' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-100')}
                          >
                            🚚 ມາເສີບ
                          </div>

                          <div 
                            onClick={function() { updateItemStatus(item.id, 'completed'); }}
                            className={"p-2 rounded-md border cursor-pointer transition select-none " + (status === 'completed' ? 'bg-green-600 text-white border-green-500 shadow-md ring-2 ring-green-300' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-100')}
                          >
                            ✅ ສຳເລັດ
                          </div>

                        </div>
                      </div>

                    </div>
                  );
                });
              })()}
            </div>

            {/* 🔴 [ຈຸດປັບປຸງຫຼ້າສຸດ]: ປຸ່ມປິດສີແດງຍາວຫຼູຫຼາ ສະອາດຕາ ເຂົ້າກັບລະບົບ 100% */}
            <button 
              type="button" 
              onClick={function() { setFoodModalOpen(false); }} 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-2xl py-3 tracking-wide transition active:scale-98 shadow-md mt-5 block"
            >
              {receiptLang === 'en' ? 'Close' : 'ປິດ'}
            </button>
          </div>
        </div>
      )}


      {/* 📥 💵 🧾 ໓. ປ໊ອບອັບ ເກັບເງິນ / ໃບບິນ (ແປພາສາຊື່ໂຕະໃນໃບບິນເຈ້ຍຄວາມຮ້ອນ) */}
      {billingModalOpen && selectedTable && (
        <div onClick={() => setBillingModalOpen(false)} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 print:p-0 print:bg-white print:static print:block cursor-pointer">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              @page { size: auto; margin: 0mm; }
              body { background: white; color: black; margin: 0; padding: 0; }
              .print-receipt-container { width: 100% !important; max-w: 100% !important; padding: 4mm !important; margin: 0 !important; box-shadow: none !important; }
              img { filter: grayscale(100%); }
            }
          `}} />

          <div ref={staffReceiptModalRef} onClick={(e) => e.stopPropagation()} className="print-receipt-container bg-white rounded-3xl w-full max-w-sm p-5 text-center shadow-2xl overflow-y-auto max-h-[85vh] text-black print:shadow-none print:max-h-full print:p-2 print:text-black cursor-default">
            <div className="flex flex-col items-center justify-center mb-1">
              {restaurantInfo?.logo_url && (
                <img src={restaurantInfo.logo_url} alt="Logo" className="w-14 h-14 object-contain rounded-xl print:w-12 print:h-12" />
              )}
              <h1 className="text-lg font-black text-gray-900 tracking-wide mt-1.5 leading-tight print:text-sm print:text-black font-sans">
                {(() => {
                  if (receiptLang === 'en') return restaurantInfo?.name_en || restaurantInfo?.restaurant_name_en || restaurantInfo?.name || "Our Restaurant";
                  if (receiptLang === 'zh') return restaurantInfo?.name_zh || restaurantInfo?.restaurant_name_zh || restaurantInfo?.name || "我们的餐厅";
                  if (receiptLang === 'th') return restaurantInfo?.name_th || restaurantInfo?.restaurant_name_th || restaurantInfo?.name || "ร้านอาหารของเรา";
                  return restaurantInfo?.name_lo || restaurantInfo?.restaurant_name_lo || restaurantInfo?.name || "ຮ້ານອາຫານຂອງທ່ານ";
                })()}
              </h1>
            </div>

            <div className="text-center mt-2 border-t border-dashed border-gray-300 pt-2 print:border-black print:pt-1">
              {/* 🎯 [ຈຸດປົດລັອກໃຫຍ່]: ດີດສະແດງຜົນຊື່ໂຕະ ໔ ພາສາໃນໃບບິນ ເຂົ້າກັນກັບພາສາທີ່ລູກຄ້າເລືອກ 100% */}
              <h2 className="font-black text-base text-gray-900 mb-0.5 print:text-sm print:text-black">
                {receiptLang === 'en' ? (selectedTable.name_en || `Table ${selectedTable.table_number || selectedTable.id}`)
                 : receiptLang === 'zh' ? (selectedTable.name_zh || `${selectedTable.table_number || selectedTable.id}号桌`)
                 : receiptLang === 'th' ? (selectedTable.name_th || `โต๊ะ ${selectedTable.table_number || selectedTable.id}`)
                 : (selectedTable.name_lo || `ໂຕະເບີ ${selectedTable.table_number || selectedTable.id}`)}
              </h2>
              <p className="text-[11px] text-gray-500 font-black print:text-[10px] print:text-black">
                {rUi.date}: {receiptDatetime}
              </p>
            </div>

            <div className="border-t border-b border-dashed border-gray-400 py-3 my-3 text-left text-xs space-y-2 print:border-black print:my-2 print:py-2">
              <div className="flex justify-between text-gray-900 font-black text-xs pb-1 border-b border-gray-200 print:border-black print:text-[11px] print:text-black">
                <span className="w-[140px]">{rUi.colName}</span>
                <span className="w-[50px] text-center">{rUi.colQty}</span>
                <span className="w-[90px] text-right">{rUi.colPrice}</span>
              </div>
              {/* 🎯 [ປິດບັກໃບບິນບໍ່ໂຊເຄື່ອງດື່ມ/ໝວດອື່ນ]: ປົດລັອກໃຫ້ທຸກໝວດໝູ່ (ອາຫານ/ເຄື່ອງດື່ມ/ຕຳ) ທີ່ສະຖານະເປັນ served ຫຼື completed ສະແດງຜົນໃນໃບບິນທັນທີ */}
              {detailedItems
                .filter((line) => {
                  const status = line.item_status;
                  // 🔥 ປົດລັອກໃຫຍ່: ຖ້າລາຍການອາຫານ/ເຄື່ອງດື່ມ/ຕຳ ມີສະຖານະເປັນ 'served' (ມາເສີບ) ຫຼື 'completed' (ສຳເລັດ) ໃຫ້ດຶງມາໂຊໃນໃບບິນທັນທີ!
                  return status === 'served' || status === 'completed';
                })
                .map((line, index) => {
                  const foodName = receiptLang === 'en' ? line.name_en : receiptLang === 'zh' ? line.name_zh : receiptLang === 'th' ? line.name_th : line.name_lo;
                  return (
                    <div key={line.id} className="flex justify-between items-start text-gray-900 font-black text-xs py-0.5 border-b border-gray-50/50 print:text-[12px] print:text-black print:py-1">
                      <div className="w-[140px] leading-tight flex items-start gap-1">
                        <span className="text-gray-500 print:text-black">{index + 1}.</span>
                        <div>
                          <p>{foodName}</p>
                          {line.note && <p className="text-[9px] text-red-500 font-bold mt-0.5 print:text-black">📝 {line.note}</p>}
                        </div>
                      </div>
                      <span className="w-[50px] text-center font-mono text-black font-black">x{line.quantity}</span>
                      <span className="w-[90px] text-right font-mono text-gray-900 print:text-black">{(line.price_per_unit * line.quantity).toLocaleString()} K</span>
                    </div>
                  );
                })}
            </div>
            {/* 🎯 [ເວີຊັນປິດບັກຍອດເງິນທ້າຍບິນບໍ່ບວກກັນ 100%]: ຄິດໄລ່ບວກລວມເງິນສົດໆ ຈາກທຸກໝວດໝູ່ (ອາຫານ/ເຄື່ອງດື່ມ/ຕຳ) ທີ່ເສີບ ຫຼື ສຳເລັດແລ້ວ */}
            <div className="bg-gray-100 rounded-xl p-2 mb-2 text-left border border-gray-150 shadow-inner print:bg-white print:border-black print:p-1">
              <div className="flex justify-between text-base font-black text-gray-900 items-center print:text-sm print:text-black">
                <span className="text-base font-black uppercase tracking-wide print:text-xs">{rUi.total}</span>
                <span className="text-orange-500 text-base font-black font-mono">
                  {(() => {
                    // ໄລ່ບວກລວມເງິນສົດໆ ຈາກທຸກລາຍການໃນ detailedItems ທີ່ຖືກກັ່ນຕອງໂຊໃນໃບບິນ
                    const receiptTotalSum = (detailedItems || []).reduce(function(sum, line) {
                      const status = line.item_status;
                      const price = Number(line.price_per_unit || 0);
                      const qty = Number(line.quantity || 0);
                      
                      // ຖ້າສະຖານະເປັນ 'served' (ມາເສີບ) ຫຼື 'completed' (ສຳເລັດ) ໃຫ້ບວກລາຄາເຂົ້າໃບບິນທັນທີ
                      if (status === 'served' || status === 'completed') {
                        return sum + (price * qty);
                      }
                      return sum;
                    }, 0);
                    
                    return receiptTotalSum.toLocaleString();
                  })()} K
                </span>
              </div>
            </div>

            {restaurantInfo?.qr_url && (
              <div className="border-3 border-dashed border-emerald-300 rounded-2xl p-3 bg-emerald-50 flex flex-col items-center justify-center mb-3 print:border-black print:bg-white print:p-1 print:border-2">
                <p className="text-[10px] font-black text-emerald-900 max-w-[200px] leading-tight text-center mb-1 print:text-[9px] print:text-black">{rUi.qrLabel}</p>
                <img src={restaurantInfo.qr_url} alt="BCEL One QR Code" className="w-full max-w-[240px] h-auto object-contain rounded-xl border bg-white p-1.5 shadow-sm print:max-w-[140px] print:p-0 print:border-0" />
              </div>
            )}

            <div className="hidden print:block text-[10px] text-center font-black mt-4 border-t border-dashed border-black pt-2 pb-6">
              <p>*** ຂໍຂອບໃຈ ທຸກໆທ່ານທີ່ມາອຸດໜູນ ***</p>
              <p>THANK YOU & SEE YOU AGAIN</p>
            </div>

            <div className="space-y-2 mt-4 print:hidden">
              <button onClick={() => window.print()} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl py-2.5 shadow-md active:scale-95 transition">🖨️ ພິມໃບບິນຂະໜາດນ້ອຍ</button>
              <button onClick={() => setBillingModalOpen(false)} className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black text-xs rounded-xl py-2.5 transition active:scale-95 text-center shadow-sm">ປິດ</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
