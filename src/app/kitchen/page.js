
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fulsiuajohtyotcpbxti.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iMOUS7O7-Qx7Urau9WhpyQ_VipWYXSh';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function KitchenDashboardPage() {
  const [allKitchenItems, setAllKitchenItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const prevPendingCountRef = useRef(0);

  // 🚀 ⭐️ [ຈຸດປົດລັອກຫຼັກ]: ດຶງຂໍ້ມູນສົດໆ (Direct Query) ຈາກ Supabase ໂດຍກົງ ແໜ້ນໜາ 100% ⭐️ 🚀
  const fetchKitchenOrders = useCallback(async () => {
    try {
      const [{ data: tables }, { data: menus }] = await Promise.all([
        supabase.from('tables').select('*'),
        supabase.from('menus').select('id, name_lo, category_id')
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // ດຶງທຸກອໍເດີ້ທີ່ເກີດຂຶ້ນພາຍໃນວັນນີ້ ໂດຍບໍ່ສົນໃຈວ່າຈະ paid ຫຼື ປິດໂຕະໄປແລ້ວ
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', todayISO);

      if (ordersError) throw ordersError;

      if (!orders || orders.length === 0) {
        setAllKitchenItems([]);
        setLoading(false);
        return;
      }

      const orderIds = orders.map(o => o.id);

      // ດຶງລາຍການອໍເດີ້ໄອເທັມທັງໝົດຂອງມື້ນີ້
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (itemsError) throw itemsError;

      // ມັດຂໍ້ມູນຜູກເລກໂຕະ ແລະ ຊື່ເມນູເຂົ້າຫາກັນ
      const mappedItems = (items || []).map(item => {
        const matchingMenu = menus?.find(m => m.id === item.menu_id);
        const matchingOrder = orders?.find(o => o.id === item.order_id);
        const matchingTable = matchingOrder ? tables?.find(t => t.id === matchingOrder.table_id) : null;

        return {
          ...item,
          name_lo: matchingMenu ? matchingMenu.name_lo : '🍲 ລາຍການອາຫານ',
          category_id: matchingMenu ? Number(matchingMenu.category_id) : 1,
          table_number: matchingTable ? (matchingTable.table_number || matchingTable.id) : (matchingOrder ? matchingOrder.table_id : 'X')
        };
      }).filter(item => Number(item.category_id) === 1);

      const currentPendingCount = mappedItems.filter(item => item.item_status === 'pending').length;
      if (currentPendingCount > prevPendingCountRef.current && audioEnabled) {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.error(e));
      }

      prevPendingCountRef.current = currentPendingCount;
      setAllKitchenItems(mappedItems);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [audioEnabled]);

  useEffect(() => {
    // 💡 Push the initial execution to the next event loop tick
    const timer = setTimeout(() => {
      fetchKitchenOrders();
    }, 0);

    const interval = setInterval(fetchKitchenOrders, 4000);

    return () => {
      clearTimeout(timer); // Clean up the timeout
      clearInterval(interval);
    };
  }, [fetchKitchenOrders]);

  const updateItemStatus = async (itemId, currentStatus) => {
    setUpdatingId(itemId);
    try {
      let nextStatus = 'preparing'; 
      if (currentStatus === 'preparing') nextStatus = 'served'; 

      const { error } = await supabase
        .from('order_items')
        .update({ item_status: nextStatus })
        .eq('id', itemId);

      if (error) throw error;
      fetchKitchenOrders(); 
    } catch (err) {
      alert(`ບໍ່ສາມາດອັບເດດສະຖານະໄດ້: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const enableAudioSystem = () => {
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Kitchen Audio Unlocked'));
    }
  };

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white"><div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mb-4" /><p className="text-gray-400 text-sm font-black">ກຳລັງເຊື່ອມຕໍ່ລະບົບອໍເດີ້ຫ້ອງຄົວ Real-time...</p></div>;
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 px-6 text-center text-white"><div className="text-5xl mb-4">⚠️</div><h1 className="text-lg font-bold text-red-400 mb-2">ເກີດຂໍ́ຜິດພາດໃນຫ້ອງຄົວ</h1><p className="text-gray-400 text-xs mb-4 font-mono">{error}</p><button onClick={fetchKitchenOrders} className="bg-orange-500 text-white text-sm font-black px-5 py-2.5 rounded-full">ລອງໃໝ່ອີກຄັ້ງ</button></div>;
  // ⭐️ ແຍກຂໍ້ມູນອາຫານອອກເປັນ 3 ຫ້ອງຢ່າງເດັດຂາດ ⭐️
  const pendingItems = allKitchenItems.filter(i => i.item_status === 'pending');
  const preparingItems = allKitchenItems.filter(i => i.item_status === 'preparing');
  const servedItems = allKitchenItems.filter(i => i.item_status === 'served' || i.item_status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50 pb-16 max-w-7xl mx-auto shadow-2xl border-x border-gray-100 relative text-black">
      
      {/* Header ແຖບດ້ານເທິງ */}
      <div className="bg-white shadow-sm px-6 py-5 mb-6 flex items-center justify-between border-b border-gray-100 rounded-b-2xl">
        <div>
          <h1 className="text-2xl font-black text-black flex items-center gap-2">
            👨‍🍳 ລະບົບຈັດການລາຍການອາຫານແບບ Real-time
          </h1>
          <p className="text-xs text-gray-500 font-black mt-1 ml-1">
            🔥 ອໍເດີ້ອາຫານຫຼັ່ງໄຫຼເຂົ້າຄົວສົດໆ (Real-time Kitchen Monitor)
          </p>
        </div>
        
        <button 
          onClick={enableAudioSystem}
          className={`px-4 py-2.5 rounded-full text-xs font-black shadow-md transition active:scale-95 border ${
            audioEnabled ? 'bg-green-500 text-white border-green-400' : 'bg-red-500 text-white animate-pulse border-red-400'
          }`}
        >
          {audioEnabled ? '🔊 ເປີດສຽງເຕືອນ' : '🔇 ປິດສຽງເຕືອນ'}
        </button>
      </div>

      {/* ລະບົບ 3 ຫ້ອງຄໍລຳໃຫຍ່ (Pending | Preparing | Served) */}
      <div className="px-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* ຫ້ອງທີ 1: ອໍເດີ້ເຂົ້າມາໃໝ່ (Pending) */}
        <div className="bg-gray-100/80 p-4 rounded-3xl border border-gray-200 min-h-[500px]">
          <h2 className="text-base font-black bg-amber-500 text-black px-4 py-2 rounded-xl mb-4 text-center shadow-md">
            📥 ອໍເດີ້ເຂົ້າມາໃໝ່ ({pendingItems.length})
          </h2>
          <div className="space-y-3">
            {pendingItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 text-black flex flex-col justify-between gap-3">
                <div className="flex items-start border-b pb-2">
                  <span className="text-lg font-black text-black">📍 ໂຕະເບີ {item.table_number}</span>
                </div>
                <div className="flex justify-between text-sm font-black">
                  <span className="text-gray-900 max-w-[180px]">{item.name_lo}</span>
                  <span className="text-orange-600 bg-orange-50 border border-orange-100 px-2 rounded-lg font-mono font-black text-sm">
                    ຈຳນວນ: {item.quantity}
                  </span>
                </div>
                {item.note && <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 font-black px-2 py-1 rounded-lg">📝 ໝາຍເຫດ: {item.note}</p>}
                <button onClick={() => updateItemStatus(item.id, 'pending')} disabled={updatingId === item.id} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black text-xs py-2 rounded-xl active:scale-95 transition shadow-sm">👨‍🍳 ກົດເລີ່ມແຕ່ງອາຫານ</button>
              </div>
            ))}
          </div>
        </div>

        {/* ຫ້ອງທີ 2: ກຳລັງເຮັດອາຫານ (Preparing) */}
        <div className="bg-gray-100/80 p-4 rounded-3xl border border-gray-200 min-h-[500px]">
          <h2 className="text-base font-black bg-blue-600 text-white px-4 py-2 rounded-xl mb-4 text-center shadow-md">
            🔥 ກຳລັງເຮັດອາຫານ ({preparingItems.length})
          </h2>
          <div className="space-y-3">
            {preparingItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 text-black flex flex-col justify-between gap-3">
                <div className="flex items-start border-b pb-2">
                  <span className="text-lg font-black text-black">📍 ໂຕະເບີ {item.table_number}</span>
                </div>
                <div className="flex justify-between text-sm font-black">
                  <span className="text-gray-900 max-w-[180px]">{item.name_lo}</span>
                  <span className="text-orange-600 bg-orange-50 border border-orange-100 px-2 rounded-lg font-mono font-black text-sm">
                    ຈຳນວນ: {item.quantity}
                  </span>
                </div>
                {item.note && <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 font-black px-2 py-1 rounded-lg">📝 ໝາຍເຫດ: {item.note}</p>}
                <button onClick={() => updateItemStatus(item.id, 'preparing')} disabled={updatingId === item.id} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-2 rounded-xl active:scale-95 transition shadow-sm">✅ ແຕ່ງເສັດແລ້ວ (ສົ່ງ)</button>
              </div>
            ))}
          </div>
        </div>

        {/* ຫ້ອງທີ 3: ອາຫານແຕ່ງເສັດແລ້ວ (Served) */}
        <div className="bg-gray-100/80 p-4 rounded-3xl border border-gray-200 min-h-[500px]">
          <h2 className="text-base font-black bg-emerald-600 text-white px-4 py-2 rounded-xl mb-4 text-center shadow-md">
            ✅ ອາຫານແຕ່ງເສັດແລ້ວ ({servedItems.length})
          </h2>
          <div className="space-y-3">
            {servedItems.map((item) => (
              <div key={item.id} className="bg-white/90 opacity-75 rounded-2xl p-4 shadow-md border border-gray-200 text-black flex flex-col gap-2">
                <div className="flex items-start border-b pb-2">
                  <span className="text-base font-black text-gray-500">📍 ໂຕະເບີ {item.table_number}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-gray-400 line-through">
                  <span>🍲 {item.name_lo}</span>
                  <span className="text-orange-600 bg-orange-50 border border-orange-100 px-2 rounded-lg font-mono font-black text-sm">
                    ຈຳນວນ: {item.quantity}
                  </span>
                </div>
                {item.note && <p className="text-[10px] text-gray-400 line-through">📝 ໝາຍເຫດ: {item.note}</p>}
                <span className="text-[10px] text-center font-black text-emerald-600 bg-emerald-50 py-1 rounded-lg border border-emerald-100 block shadow-sm">✔️ ເສີບບາດນີ້ຮຽບຮ້ອຍ</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
