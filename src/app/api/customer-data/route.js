import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fulsiuajohtyotcpbxti.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iMOUS7O7-Qx7Urau9WhpyQ_VipWYXSh';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const tableId = searchParams.get('table_id');
    if (!tableId) return NextResponse.json({ error: 'Missing table_id' }, { status: 400 });

    const numericTableId = Number(tableId);

    const { data: tableData, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .eq('id', numericTableId);
      
    if (tableError) return NextResponse.json({ error: tableError.message }, { status: 500 });
    if (!tableData || tableData.length === 0) return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    if (tableData[0].is_available === false) return NextResponse.json({ error: 'ໂຕະນີ້ປິດໃຊ້ງານ' }, { status: 403 });

    const [profileResult, catResult, menuResult] = await Promise.all([
      supabase.from('restaurant_profile').select('*').eq('id', 1).maybeSingle(),
      supabase.from('categories').select('*'),
      supabase.from('menus').select('*')
    ]);

    const { data: activeOrder } = await supabase
      .from('orders')
      .select('id, total_price, order_lang')
      .eq('table_id', numericTableId)
      .eq('status', 'pending')
      .maybeSingle();

    let receiptLines = [];
    if (activeOrder) {
      // 🚀 ⭐️ [ຈຸດປົດລັອກຫຼັກ]: ເອົາບລັອກດຶງຂໍ້ມູນ items ຈາກ Supabase ກັບຄືນມາເພື່ອປ້ອງກັນບັກ ⭐️ 🚀
      const { data: items } = await supabase.from('order_items').select('*').eq('order_id', activeOrder.id);
      
          // 🚀 ⭐️ [ຈຸດປົດລັອກໃຫຍ່]: ບັງຄັບຝັງ updated_at ສົ່ງອອກໄປນຳ ເພື່ອໃຫ້ໜ້າລູກຄ້ານັບເວລາ ໓ ນາທີຍ້າຍຫ້ອງໄດ້ 100% ⭐️ 🚀
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
                
                // 📥 🎯 [ແຖວປົດລັອກຫຼັກ]: ສົ່ງວັນທີເວລາຫຼ້າສຸດທີ່ກົດເສີບ ອອກໄປໃຫ້ໜ້າຈໍລູກຄ້າຄຳນວນ ໓ ນາທີ
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

    return NextResponse.json({
      // ແກ້ໄຂໃຫ້ສົ່ງ tableData[0] ກົງໆຄືເກົ່າ ປ້ອງກັນບັກໜ້າຈໍລູກຄ້າຫຼົ້ມ
      table: tableData && tableData.length > 0 ? tableData[0] : null, 
      restaurant: profileResult.data || null,
      categories: availableCategories,
      menuItems: (menuResult.data || []).filter(menu => menu.is_available !== false && availableCategoryIds.has(String(menu.category_id))),
      activeOrder: activeOrder ? { id: activeOrder.id, total_price: activeOrder.total_price } : null,
      receiptItems: receiptLines
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const reqBody = await req.json().catch(() => ({}));
    const { action, table_id, cart, cartNotes, lang } = reqBody;
    const numericTableId = Number(table_id);
    const currentLang = lang || 'lo';

       // 🚀 ⭐️ [ເພີ່ມໃໝ່ຝັ່ງ API]: ດັກຈັບ Event ຕອນລູກຄ້າກົດຍົກເລີກ ໃຫ້ລ້າງຄ່າ bill_requested ເປັນ false ทັນທີ ⭐️ 🚀
       if (action === 'cancel_bill') {
        const { error } = await supabase
          .from('tables')
          .update({ bill_requested: false })
          .eq('id', numericTableId);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }
  

    const { data: table } = await supabase.from('tables').select('status').eq('id', numericTableId).single();
    if (!table || table.is_available === false) {
      return NextResponse.json({ error: 'ໂຕະນີ້ປິດໃຊ້ງານ' }, { status: 403 });
    }
    if (table.status !== 'occupied') {
      return NextResponse.json({ error: '⚠️ ພະນັກງານຍັງບໍ່ທັນໄດ້ເປີດລະບົບໂຕະນີ້!' }, { status: 400 });
    }

    const { data: activeOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('table_id', numericTableId)
      .eq('status', 'pending')
      .maybeSingle();

    let orderId = activeOrder?.id;

    if (orderId) {
      await supabase.from('orders').update({ order_lang: currentLang }).eq('id', orderId);
    } else {
      const { data: newOrder, error: oErr } = await supabase
        .from('orders')
        .insert({ table_id: numericTableId, status: 'pending', total_price: 0, order_lang: currentLang })
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

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
