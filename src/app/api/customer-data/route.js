import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1. ບັງຄັບໃຊ້ລະຫັດ Anon Key ຕົວຈິງ ປົດລັອກບັກ CORS ຜ່ານເຄືອຂ່າຍ IP 43.24 [Part 233]
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fulsiuajohtyotcpbxti.supabase.co';
const JWT_ANON_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bHNpdWFqb2h0eW90Y3BieHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI3MTg3MDMsImV4cCI6MjAyODMwMDcwM30.eXNBMklpQU93a0ZvbXlhWDF3QUFfU3N1a3I3MGg0dzNhUGVfa1NodEw0UQ==';
const PUBLISHABLE_ANON_FALLBACK = 'sb_publishable_iMOUS7O7-Qx7Urau9WhpyQ_VipWYXSh';
function resolvePublicAnonKey() {
  const envKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  const isPlaceholder = (key) => !key || key.includes('...') || key.includes('eXNBMklpQU93a0ZvbXlhWDF3QUFfU3N1a3I3MGg0dzNhUGVfa1NodEw0UQ');
  if (!isPlaceholder(envKey)) return envKey;
  if (!isPlaceholder(JWT_ANON_FALLBACK)) return JWT_ANON_FALLBACK;
  return PUBLISHABLE_ANON_FALLBACK;
}
const SUPABASE_ANON_KEY = resolvePublicAnonKey();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. 🎯 [ສູດປົດລັອກບັກ CORS 100%]: ຟັງຊັນສ້າງ Headers ອະນຸຍາດໃຫ້ເລກ IP ພາຍໃນວົງ Wi-Fi ດຶງຂໍ້ມູນໄດ້ສະລຸຍ [Part 233]
function corsHeaders(req) {
  const origin = req.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS(req) {
  return NextResponse.json({}, { headers: corsHeaders(req) });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const tableId = searchParams.get('table_id');
    if (!tableId) {
      return NextResponse.json({ error: 'Missing table_id' }, { status: 400, headers: corsHeaders(req) });
    }

    // 💡 ກໍລະນີພິເສດ: ຫາກເຈົ້າຂອງຮ້ານຮ້ອງຂໍ "all" ໃຫ້ດຶງຂໍ້ມູນໂຕະທັງໝົດສົ່ງອອກໄປທັນທີ
    if (tableId === 'all') {
      const { data: allTables } = await supabase.from('tables').select('*').order('table_number', { ascending: true });
      const { data: allOrders } = await supabase.from('orders').select('*');
      const [catRes, menuRes] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('menus').select('*')
      ]);
      const allMenus = menuRes.data || [];
      const tables = allTables || [];
      const orders = allOrders || [];
      return NextResponse.json({
        tables,
        orders,
        categories: catRes.data || [],
        menus: allMenus,
        menuItems: allMenus,
        summary: {
          totalRevenue: orders.reduce((sum, order) => sum + Number(order.total_revenue || order.total_price || 0), 0),
          totalOrdersCount: orders.length,
          totalMenusCount: allMenus.length,
          totalTablesCount: tables.length
        }
      }, { headers: corsHeaders(req) });
    }

    // 🎯 [🎯 ຈຸດປິດບັກຫຼັກ]: ບັງຄັບແປງຄ່າ tableId ໃຫ້ກາຍເປັນຕົວເລກ (Number) ກ່ອນ Query ປ້ອງກັນບັກ Data Type Mismatch [Part 228]
    const numericTableNumber = !isNaN(Number(tableId)) ? Number(tableId) : 1;

    // ຊັ້ນທີ 1: ລອງຊອກຫາໂຕະຜ່ານຊ່ອງ table_number (ເລກໂຕະຕົວຈິງ) [Part 233]
    let { data: tableData, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .eq('table_number', numericTableNumber);

    // 💡 ຊັ້ນທີ 2: ຖ້າຊອກດ້ວຍເລກໂຕະບໍ່ພົບ, ໃຫ້ສະຫຼັບມາຊອກດ້ວຍ ID ຖານຂໍ້ມູນທັນທີ [Part 233]
    if ((!tableData || tableData.length === 0)) {
      const { data: fallbackData } = await supabase
        .from('tables')
        .select('*')
        .eq('id', numericTableNumber);
      if (fallbackData && fallbackData.length > 0) {
        tableData = fallbackData;
      }
    }
      
    if (tableError) {
      return NextResponse.json({ error: tableError.message }, { status: 500, headers: corsHeaders(req) });
    }
    
    // ⚠️ ຫາກກວດເຊັກທັງສອງທາງແລ້ວຍັງບໍ່ພົບແທ້ໆ ໃຫ້ສ້າງ Object ຈໍາລອງຮອງຮັບ ເພື່ອປ້ອງກັນແອັບລູກຄ້າຫຼົ້ມ [Part 233]
    if (!tableData || tableData.length === 0) {
      tableData = [{
        id: numericTableNumber,
        table_number: numericTableNumber,
        name_lo: `ໂຕະ #${numericTableNumber}`,
        is_available: true,
        status: 'occupied'
      }];
    }

    if (tableData[0].is_available === false) {
      return NextResponse.json({ error: 'ໂຕະນີ້ປິດໃຊ້ງານ' }, { status: 403, headers: corsHeaders(req) });
    }

    const internalNumericId = tableData[0].id;

    const [profileResult, catResult, menuResult] = await Promise.all([
      supabase.from('restaurant_profile').select('*').eq('id', 1).maybeSingle(),
      supabase.from('categories').select('*'),
      supabase.from('menus').select('*')
    ]);

    const { data: activeOrder } = await supabase
      .from('orders')
      .select('id, total_price, order_lang')
      .eq('table_id', internalNumericId)
      .eq('status', 'pending')
      .maybeSingle();

    let receiptLines = [];
    if (activeOrder) {
      const { data: items } = await supabase.from('order_items').select('*').eq('order_id', activeOrder.id);
      
      if (items && items.length > 0) {
        receiptLines = items.map(item => {
          const m = menuResult.data?.find(menu => menu.id === item.menu_id);
          return {
            id: item.id,
            order_id: item.order_id,
            quantity: item.quantity,
            note: item.note,
            price_per_unit: m ? m.price : 0,
            item_status: item.item_status || 'pending',
            category_id: m ? Number(m.category_id) : 1, 
            updated_at: item.updated_at,
            menu_name_lo: m ? m.name_lo : '🍲 ລາຍການ',
            menu_name_en: m ? m.name_en : 'Food',
            menu_name_zh: m ? m.name_zh : 'Food',
            menu_name_th: m ? m.name_th : 'อาหาร',
            lang: activeOrder.order_lang || 'lo',
            order_lang: activeOrder.order_lang || 'lo'
          };
        });
      }
    }

    const availableCategories = (catResult.data || []).filter(category => category.is_available !== false);
    const availableCategoryIds = new Set(availableCategories.map(category => String(category.id)));

    // 🎯 ບັງຄັບຝັງ corsHeaders ເຂົ້າໄປໃນຂາອອກ Response ທຸກໆຄັ້ງ ເພື່ອປົດລັອກເລກ IP 100% [Part 233]
    return NextResponse.json({
      table: tableData[0],
      restaurant: profileResult.data || null,
      categories: availableCategories,
      menuItems: (menuResult.data || []).filter(menu => menu.is_available !== false && availableCategoryIds.has(String(menu.category_id))),
      activeOrder: activeOrder ? { id: activeOrder.id, total_price: activeOrder.total_price } : null,
      receiptItems: receiptLines
    }, { headers: corsHeaders(req) });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders(req) });
  }
}

export async function POST(req) {
  try {
    const reqBody = await req.json().catch(() => ({}));
    const { action, table_id, cart, cartNotes, lang } = reqBody;
    
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    let { data: currentTable } = await supabaseClient.from('tables').select('id, status, is_available').eq('table_number', Number(table_id)).maybeSingle();
    
    if (!currentTable && !isNaN(Number(table_id))) {
      const { data: fallbackTable } = await supabaseClient.from('tables').select('id, status, is_available').eq('id', Number(table_id)).maybeSingle();
      if (fallbackTable) currentTable = fallbackTable;
    }

    const internalTableId = currentTable ? currentTable.id : Number(table_id);
    const currentLang = lang || 'lo';

    if (action === 'cancel_bill') {
      const { error } = await supabase
        .from('tables')
        .update({ bill_requested: false })
        .eq('id', internalTableId);
      if (error) throw error;
      return NextResponse.json({ success: true }, { headers: corsHeaders(req) });
    }

    if (!currentTable || currentTable.is_available === false) {
      return NextResponse.json({ error: 'ໂຕະນີ້ປິດໃຊ້ງານ' }, { status: 403, headers: corsHeaders(req) });
    }
    
    if (currentTable.status !== 'occupied') {
      await supabaseClient.from('tables').update({ status: 'occupied' }).eq('id', internalTableId);
    }

    const { data: activeOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('table_id', internalTableId)
      .eq('status', 'pending')
      .maybeSingle();

    let orderId = activeOrder?.id;

    if (orderId) {
      await supabase.from('orders').update({ order_lang: currentLang }).eq('id', orderId);
    } else {
      const { data: newOrder, error: oErr } = await supabase
        .from('orders')
        .insert({ table_id: internalTableId, status: 'pending', total_price: 0, order_lang: currentLang })
        .select()
        .single();
      if (oErr) throw oErr;
      orderId = newOrder.id;
    }

    const insertItems = Object.entries(cart || {}).map(([menuId, qty]) => ({
      order_id: orderId,
      menu_id: Number(menuId),
      quantity: qty,
      note: cartNotes?.[menuId] || '',
      item_status: 'pending'
    }));

    if (insertItems.length > 0) {
      const { error: itemErr } = await supabase.from('order_items').insert(insertItems);
      if (itemErr) throw itemErr;
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders(req) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders(req) });
  }
}
