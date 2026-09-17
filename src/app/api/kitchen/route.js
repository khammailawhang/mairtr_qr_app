import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fulsiuajohtyotcpbxti.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iMOUS7O7-Qx7Urau9WhpyQ_VipWYXSh';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ໑. GET Handler - ດຶງຂໍ້ມູນລາຍການອາຫານທັງໝົດຂອງມື້ນີ້ ໂດຍບໍ່ສົນໃຈວ່າໂຕະຈະປິດໄປແລ້ວຫຼືບໍ່
export async function GET() {
  try {
    const [{ data: tables }, { data: menus }] = await Promise.all([
      supabase.from('tables').select('*'),
      supabase.from('menus').select('id, name_lo, category_id')
    ]);

    // ຄຳນວນຫາເວລາເລີ່ມຕົ້ນຂອງມື້ນີ້ (Today 00:00:00) ເພື່ອດຶງຂໍ້ມູນສະເພາະວັນນີ້
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // 🚀 ⭐️ [ຈຸດປົດລັອກຫຼັກບ້ານ ໑]: ດຶງທຸກອໍເດີ້ທີ່ເກີດຂຶ້ນພາຍໃນວັນນີ້ ໂດຍບໍ່ສົນໃຈວ່າຈະ paid ຫຼື ປິດໂຕະໄປແລ້ວ ⭐️ 🚀
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', todayISO);

    if (ordersError) throw ordersError;
    if (!orders || orders.length === 0) return NextResponse.json([]);

    const orderIds = orders.map(o => o.id);

    // ດຶງລາຍການອາຫານຂອງມື້ນີ້ທັງໝົດ
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
    }).filter(item => Number(item.category_id) === 1); // ກັ່ນຕອງເອົາສະເພາະອາຫານ

    return NextResponse.json(mappedItems, {
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ໒. POST Handler - 🚀 ⭐️ [ຈຸດປົດລັອກຫຼັກບ້ານ ໒]: ຮອງຮັບການກົດປ່ຽນສະຖານະອາຫານໃນຄົວ ⭐️ 🚀
export async function POST(req) {
  try {
    const { itemId, currentStatus } = await req.json();
    
    let nextStatus = 'preparing'; 
    if (currentStatus === 'preparing') nextStatus = 'served'; 

    const { error } = await supabase
      .from('order_items')
      .update({ item_status: nextStatus })
      .eq('id', itemId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
