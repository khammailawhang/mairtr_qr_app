import { NextResponse } from 'next/server';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export function apiHeaders(req) {
  const origin = req?.headers?.get?.('origin') || '*';
  return {
    ...NO_STORE_HEADERS,
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function jsonSuccess(req, data, status = 200) {
  return NextResponse.json(
    { success: true, data, error: null },
    { status, headers: apiHeaders(req) },
  );
}

export function jsonError(req, error, status = 500) {
  const message = typeof error === 'string' ? error : error?.message || 'Internal Server Error';
  return NextResponse.json(
    { success: false, data: null, error: message },
    { status, headers: apiHeaders(req) },
  );
}

export function corsPreflight(req) {
  return NextResponse.json({ success: true, data: null, error: null }, { headers: apiHeaders(req) });
}

export async function resolveTable(supabase, tableId, { allowVirtual = false } = {}) {
  if (tableId === undefined || tableId === null || tableId === '') {
    return { table: null, error: 'Missing table_id' };
  }

  const numericTableNumber = !Number.isNaN(Number(tableId)) ? Number(tableId) : tableId;

  let { data: tableData, error: tableError } = await supabase
    .from('tables')
    .select('*')
    .eq('table_number', numericTableNumber);

  if (tableError) {
    return { table: null, error: tableError.message };
  }

  if (!tableData || tableData.length === 0) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('tables')
      .select('*')
      .eq('id', numericTableNumber);

    if (fallbackError) {
      return { table: null, error: fallbackError.message };
    }
    tableData = fallbackData;
  }

  if (!tableData || tableData.length === 0) {
    if (allowVirtual && !Number.isNaN(Number(tableId))) {
      return {
        table: {
          id: Number(tableId),
          table_number: Number(tableId),
          name_lo: `ໂຕະ #${tableId}`,
          is_available: true,
          status: 'occupied',
        },
        error: null,
      };
    }
    return { table: null, error: 'Table not found' };
  }

  return { table: tableData[0], error: null };
}

export function mapReceiptItems(items, menus, orderLang = 'lo') {
  return (items || []).map((item) => {
    const menu = menus?.find((m) => m.id === item.menu_id);
    return {
      id: item.id,
      order_id: item.order_id,
      menu_id: item.menu_id,
      quantity: item.quantity,
      note: item.note,
      price_per_unit: menu ? menu.price : 0,
      item_status: item.item_status || 'pending',
      category_id: menu ? Number(menu.category_id) : 1,
      updated_at: item.updated_at,
      created_at: item.created_at,
      menu_name_lo: menu ? menu.name_lo : '🍲 ລາຍການ',
      menu_name_en: menu ? menu.name_en : 'Food',
      menu_name_zh: menu ? menu.name_zh : 'Food',
      menu_name_th: menu ? menu.name_th : 'อาหาร',
      lang: orderLang || 'lo',
      order_lang: orderLang || 'lo',
    };
  });
}

export function normalizeOrderItems(body) {
  if (Array.isArray(body?.items) && body.items.length > 0) {
    return body.items
      .map((item) => ({
        menu_id: Number(item.menu_id ?? item.id),
        quantity: Number(item.quantity ?? item.qty ?? 0),
        note: item.note || '',
      }))
      .filter((item) => item.menu_id && item.quantity > 0);
  }

  const cart = body?.cart || {};
  const cartNotes = body?.cartNotes || {};
  return Object.entries(cart)
    .map(([menuId, qty]) => ({
      menu_id: Number(menuId),
      quantity: Number(qty),
      note: cartNotes?.[menuId] || '',
    }))
    .filter((item) => item.menu_id && item.quantity > 0);
}

export async function getActiveOrderForTable(supabase, tableInternalId) {
  const { data: activeOrder, error } = await supabase
    .from('orders')
    .select('*')
    .eq('table_id', tableInternalId)
    .eq('status', 'pending')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return activeOrder || null;
}

export async function buildCustomerOrderPayload(supabase, table) {
  const [profileResult, catResult, menuResult] = await Promise.all([
    supabase.from('restaurant_profile').select('*').eq('id', 1).maybeSingle(),
    supabase.from('categories').select('*'),
    supabase.from('menus').select('*'),
  ]);

  const activeOrder = await getActiveOrderForTable(supabase, table.id);

  let receiptItems = [];
  if (activeOrder) {
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', activeOrder.id)
      .order('id', { ascending: true });
    if (itemsError) throw itemsError;
    receiptItems = mapReceiptItems(items, menuResult.data, activeOrder.order_lang);
  }

  const availableCategories = (catResult.data || []).filter((category) => category.is_available !== false);
  const availableCategoryIds = new Set(availableCategories.map((category) => String(category.id)));
  const menuItems = (menuResult.data || []).filter(
    (menu) => menu.is_available !== false && availableCategoryIds.has(String(menu.category_id)),
  );

  return {
    table,
    restaurant: profileResult.data || null,
    categories: availableCategories,
    menus: menuItems,
    menuItems,
    activeOrder: activeOrder
      ? { id: activeOrder.id, total_price: activeOrder.total_price, status: activeOrder.status, order_lang: activeOrder.order_lang }
      : null,
    orders: activeOrder ? [activeOrder] : [],
    receiptItems,
  };
}

export async function getOrderDetails(supabase, orderId) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order) return null;

  const [{ data: items, error: itemsError }, { data: menus }, { data: table }] = await Promise.all([
    supabase.from('order_items').select('*').eq('order_id', order.id).order('id', { ascending: true }),
    supabase.from('menus').select('*'),
    supabase.from('tables').select('*').eq('id', order.table_id).maybeSingle(),
  ]);

  if (itemsError) throw itemsError;

  return {
    order,
    table: table || null,
    items: mapReceiptItems(items, menus, order.order_lang),
  };
}
