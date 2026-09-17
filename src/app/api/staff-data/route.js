import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fulsiuajohtyotcpbxti.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iMOUS7O7-Qx7Urau9WhpyQ_VipWYXSh';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ໑. GET Handler - ເວີຊັນປົດລັອກບັກ matchingTable ຫຼົ້ມ ໑໐໐%
export async function GET() {
  try {
    // ດຶງຂໍ້ມູນ Tables
    const { data: tablesData, error: tablesError } = await supabase
      .from('tables')
      .select('*')
      .order('id', { ascending: true });
    if (tablesError) return NextResponse.json({ error: tablesError.message }, { status: 500 });

    // ດຶງຂໍ້ມູນ Orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    if (ordersError) return NextResponse.json({ error: ordersError.message }, { status: 500 });

    // ດຶງຂໍ້ມູນຈາກ restaurant_profile
    const { data: profileData } = await supabase
      .from('restaurant_profile')
      .select('*')
      .limit(1)
      .maybeSingle();

    // ແປງ ID ຂອງໂຕະທີ່ຖືກນຳໃຊ້ໃຫ້ເປັນ String ເພື່ອປ້ອງກັນ Type Mismatch
    const occupiedTableIds = (tablesData || [])
      .filter(t => t.status === 'occupied' || t.bill_requested === true || t.bill_requested === 'true' || t.bill_requested === 1)
      .map(t => t.id.toString());
    
    // 🚀 ⭐️ [ປົດລັອກ ໑]: ສົ່ງບິນທັງສະຖານة pending, preparing, and served ເພື່ອບໍ່ໃຫ້ປ້າຍເຕືອນ ແລະ ຍອດເງິນຫຼົ້ມ ⭐️ 🚀
    const filteredOrders = (ordersData || []).filter(order => {
      if (!order.table_id) return false;
      const isTableActive = occupiedTableIds.includes(order.table_id.toString());
      return isTableActive && (order.status === 'pending' || order.status === 'preparing' || order.status === 'served');
    });

    let allDetailedItems = [];

    if (filteredOrders && filteredOrders.length > 0) {
      const activeOrderIds = filteredOrders.map(o => o.id);

      const [itemsRes, menusRes] = await Promise.all([
        supabase.from('order_items').select('*').in('order_id', activeOrderIds),
        supabase.from('menus').select('id, name_lo, name_en, name_zh, name_th, price, category_id')
      ]);

      if (itemsRes.error) return NextResponse.json({ error: itemsRes.error.message }, { status: 500 });
      if (menusRes.error) return NextResponse.json({ error: menusRes.error.message }, { status: 500 });

      const itemsData = itemsRes.data || [];
      const menusData = menusRes.data || [];

      allDetailedItems = itemsData.map(item => {
        const m = menusData.find(menu => menu.id === item.menu_id);
        const matchingOrder = filteredOrders.find(o => o.id === item.order_id);
        
        // 🚀 ⭐️ [ຈຸດແກ້ບັກໃຫຍ່]: ບັງຄັບຄົ້ນຫາໂຕະເພື່ອເອົາມາເກັບໄວ້ໃນ matchingTable ປ້ອງກັນ API Crash ຫຼົ້ມ ⭐️ 🚀
        const matchingTable = matchingOrder ? (tablesData || []).find(t => t.id.toString() === matchingOrder.table_id.toString()) : null;
        
        return {
          id: item.id,
          order_id: item.order_id,
          quantity: item.quantity,
          note: item.note || '',
          item_status: item.item_status || 'pending',
          price_per_unit: m ? m.price : 0,
          category_id: m ? Number(m.category_id) : 1, 
          name_lo: m ? m.name_lo : '🍲 ອາຫານ',
          name_en: m ? m.name_en : 'Food',
          name_zh: m ? m.name_zh : 'Food',
          name_th: m ? m.name_th : 'อาหาร',
          table_id: matchingOrder ? matchingOrder.table_id : item.table_id,
          // 🚀 ⭐️ [ປົດລັອກ ໒]: ດຶງເລກໂຕະຕົວຈິງອອກມາສະແດງຜົນໃນໃບບິນ ⭐️ 🚀
          table_number: matchingTable ? (matchingTable.table_number || matchingTable.id) : (matchingOrder ? matchingOrder.table_id : 'X'),
          lang: matchingOrder ? (matchingOrder.lang || 'lo') : 'lo'
        };
      });
    }

    return NextResponse.json({
      tables: tablesData || [],
      orders: filteredOrders || [],
      allDetailedItems: allDetailedItems,
      restaurantProfile: profileData || null 
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
// 🍳 ໒. POST Handler - ເວີຊັນປົດລັອກບັກປ້າຍເຕືອນເກັບເງິນສີເຫຼືອງບໍ່ດີດ ໑໐໐%
export async function POST(req) {
  try {
    const reqBody = await req.json().catch(() => ({}));
    const { action, itemId, nextStatus } = reqBody;
    const finalTableId = reqBody.tableId || reqBody.table_id;

    if (!action) {
      return NextResponse.json({ success: false, message: 'Missing action parameter' }, { status: 400 });
    }

    // 🚀 ⭐️ [ຈຸດເພີ່ມໃໝ່]: ດັກຈັບຕອນລູກຄ້າກົດຮຽກເກັບເງິນ ແລ້ວສັ່ງອັບເດດ bill_requested: true ທັນທີ ⭐️ 🚀
    if (action === 'call_bill' && finalTableId) {
      const { error } = await supabase
        .from('tables')
        .update({ bill_requested: true })
        .eq('id', finalTableId);
      if (error) throw error;
    }
    else if (action === 'open') {
      if (!finalTableId) return NextResponse.json({ success: false, message: 'Missing table ID' }, { status: 400 });
      
      // 🚀 ⭐️ [ຈຸດປົດລັອກຫຼັກບ້ານ]: ປ່ຽນໃຫ້ອັບເດດສະເພາະ status ຫວ່າງ ໂດຍຫ້າມໄປລຶບຄ່າ bill_requested ຂອງລູກຄ້າເດັດຂາດ! ⭐️ 🚀
      await supabase.from('tables').update({ status: 'vacant' }).eq('id', finalTableId);
      
      const { data: orders } = await supabase.from('orders').select('id, table_id, status').order('id', { ascending: false });
    } 
    else if (action === 'close') {
      if (!finalTableId) return NextResponse.json({ success: false, message: 'Missing table ID' }, { status: 400 });
      await supabase.from('tables').update({ status: 'vacant', bill_requested: false }).eq('id', finalTableId);
      
      const { data: orders } = await supabase.from('orders').select('id, table_id, status').order('id', { ascending: false });
      
      const activeOrder = orders?.find(o => 
        o.table_id?.toString() === finalTableId.toString() && 
        ['pending', 'preparing', 'served'].includes(o.status)
      );
      
      if (activeOrder) {
        await supabase.from('orders').update({ status: 'paid' }).eq('id', activeOrder.id);
      }
    }
    else if (action === 'undo') {
      if (!finalTableId) return NextResponse.json({ success: false, message: 'Missing table ID' }, { status: 400 });
      
      let { data: lastOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('table_id', finalTableId)
        .neq('status', 'pending')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (lastOrder) {
        await supabase.from('orders').update({ status: 'pending' }).eq('id', lastOrder.id);
      }
      await supabase.from('tables').update({ status: 'occupied', bill_requested: false }).eq('id', finalTableId);
    }
    else if (action === 'serve_item') {
      if (!itemId || !nextStatus) return NextResponse.json({ success: false, message: 'Missing item specifications' }, { status: 400 });
      await supabase.from('order_items').update({ item_status: nextStatus }).eq('id', itemId);
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
