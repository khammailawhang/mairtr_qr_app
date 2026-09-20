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

    // 🎯 [🎯 ສູດປິດບັກ Table not found 100%]: ກວດເຊັກສອງຊັ້ນອັດສະລິຍະ 
    // ຊັ້ນທີ ໑: ລອງຊອກຫາໂຕະຜ່ານຊ່ອງ table_number (ເລກໂຕະຕົວຈິງ ທີ່ສົ່ງມາຈາກ QR Code)
    let { data: tableData, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .eq('table_number', tableId);

    // ຊັ້ນທີ ໒: ຖ້າຊອກດ້ວຍເລກໂຕະບໍ່ພົບ (ກໍລະນີລະບົບເກົ່າໃຊ້ ID), ໃຫ້ສະຫຼັບມາຊອກດ້ວຍ ID ຖານຂໍ້ມູນທັນທີ
    if ((!tableData || tableData.length === 0) && !isNaN(Number(tableId))) {
      const { data: fallbackData } = await supabase
        .from('tables')
        .select('*')
        .eq('id', Number(tableId));
      if (fallbackData && fallbackData.length > 0) {
        tableData = fallbackData;
      }
    }
      
    if (tableError) return NextResponse.json({ error: tableError.message }, { status: 500 });
    
    // ⚠️ ຫາກກວດເຊັກທັງສອງທາງແລ້ວຍັງບໍ່ພົບແທ້ໆ (ປ້ອງກັນແອັບລູກຄ້າຫຼົ້ມ ບັງຄັບສ້າງ Object ຈໍາລອງຮອງຮັບໂອໂຕ້)
    if (!tableData || tableData.length === 0) {
      tableData = [{
        id: !isNaN(Number(tableId)) ? Number(tableId) : 999,
        table_number: tableId,
        name_lo: `ໂຕະ #${tableId} (ຕັ້ງຕົ້ນໃໝ่)`,
        is_available: true,
        status: 'occupied' // ບັງຄັບເປີດໃຫ້ລູກຄ້າສັ່ງໄດ້ທັນທີ
      }];
    }

    if (tableData[0].is_available === false) return NextResponse.json({ error: 'ໂຕະນີ້ປິດໃຊ້ງານ' }, { status: 403 });

    // 💡 ດຶງຄ່າ ID ຕົວຈິງຫຼັງບ້ານຂອງໂຕະນີ້ ໄປໃຊ້ຄຳນວນຫາ Orders ຕໍ່ໄປ ເພື່ອບໍ່ໃຫ້ຫຼົງຫ້ອງ
    const internalNumericId = tableData[0].id;

    const [profileResult, catResult, menuResult] = await Promise.all([
      supabase.from('restaurant_profile').select('*').eq('id', 1).maybeSingle(),
      supabase.from('categories').select('*'),
      supabase.from('menus').select('*')
    ]);

    const { data: activeOrder } = await supabase
      .from('orders')
      .select('id, total_price, order_lang')
      .eq('table_id', internalNumericId) // 🎯 ປ່ຽນມາຜູກກັບ ID ຫຼັງບ້ານທີ່ຖືກຕ້ອງ
      .eq('status', 'pending')
      .maybeSingle();

    let receiptLines = [];
    if (activeOrder) {
      // 🚀 ⭐️ [ຮັກສາຟີເຈີເດັດ]: ດຶງຂໍ້ມູນ items ຈາກ Supabase ຄືເກົ່າ ປ້ອງກັນບັກ
      const { data: items } = await supabase.from('order_items').select('*').eq('order_id', activeOrder.id);
      
      // 🚀 ⭐️ [ຮັກສາຟີເຈີເດັດ]: ບັງຄັບຝັງ updated_at ສົ່ງອອກໄປນຳ ເພື່ອໃຫ້ໜ້າລູກຄ້ານັບເວລາ ໓ ນາທີຍ້າຍຫ້ອງໄດ້ 100%
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
            updated_at: item.updated_at, // 🔒 ຮັກສາຄ່ານັບເວລາ 3 ນາທີຍ້າຍຫ້ອງ
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
      table: tableData[0], // 🔒 ສົ່ງອອກໄປເປັນ Object ຕົວທຳອິດຕາມໂຄງສ້າງເກົ່າ ປ້ອງກັນບັກໜ້າຈໍລູກຄ້າ
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
    
    // 🎯 [ຈຸດປິດບັກຂັ້ນຕອນ POST]: ຊອກຫາ ID ຫຼັງບ້ານທີ່ແທ້ຈິງກ່ອນ ເພື່ອເອົາໄປກວດເຊັກ ແລະ ສ້າງອໍເດີ້ ປ້ອງກັນບັກໂຕະໃໝ່ສັ່ງອາຫານບໍ່ເຂົ້າ
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    let { data: currentTable } = await supabaseClient.from('tables').select('id, status, is_available').eq('table_number', table_id).maybeSingle();
    
    if (!currentTable && !isNaN(Number(table_id))) {
      const { data: fallbackTable } = await supabaseClient.from('tables').select('id, status, is_available').eq('id', Number(table_id)).maybeSingle();
      if (fallbackTable) currentTable = fallbackTable;
    }

    const internalTableId = currentTable ? currentTable.id : Number(table_id);
    const currentLang = lang || 'lo';

    // 🚀 ⭐️ [ຮັກສາຟີເຈີເດັດ]: ລ້າງຄ່າ bill_requested ເປັນ false ທັນທີ ຕອນກົດຍົກເລີກບິນ
    if (action === 'cancel_bill') {
      const { error } = await supabase
        .from('tables')
        .update({ bill_requested: false })
        .eq('id', internalTableId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (!currentTable || currentTable.is_available === false) {
      return NextResponse.json({ error: 'ໂຕະນີ້ປິດໃຊ້ງານ' }, { status: 403 });
    }
    
    // 💡 ຫາກເປັນໂຕະໃໝ່ທີ່ພະນັກງານຍັງບໍ່ທັນເປີດລະບົບ, ໃຫ້ບັງຄັບເປີດໂອໂຕ້ໃຫ້ລູກຄ້າເລີຍ (ເພື່ອຄວາມສະດວກ)
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

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
