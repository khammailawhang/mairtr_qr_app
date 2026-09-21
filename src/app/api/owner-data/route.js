import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

async function getOwnerClient(request) {
  const authorization = request.headers.get('authorization') || '';
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!accessToken) return null;

  const ownerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  });
  const { data: { user }, error: userError } = await ownerClient.auth.getUser(accessToken);
  if (userError || !user?.email) return null;

  const { data: owner, error: ownerError } = await ownerClient
    .from('staffs')
    .select('id')
    .eq('email', user.email.toLowerCase())
    .eq('role', 'owner')
    .maybeSingle();
  return !ownerError && owner ? ownerClient : null;
}

async function demoteOtherOwners(ownerClient, currentStaffId) {
  let query = ownerClient
    .from('staffs')
    .update({ role: 'staff' })
    .eq('role', 'owner');
  if (currentStaffId !== undefined && currentStaffId !== null) {
    query = query.neq('id', currentStaffId);
  }
  const { error } = await query;
  if (error) throw error;
}

// 📥 [GET]: ດຶງຂໍ້ມູນຫຼັກ ພ້ອມຕາຕະລາງໝວດໝູ່ (categories) ຈາກ Supabase
export async function GET(request) {
  try {
    const ownerClient = await getOwnerClient(request);
    if (!ownerClient) {
      return NextResponse.json({ success: false, error: 'Owner authentication required' }, { status: 401, headers: corsHeaders(request) });
    }
    
    const dataClient = ownerClient || supabase;
    const [menusRes, tablesRes, orderItemsRes, categoriesRes, profileRes, staffsRes] = await Promise.all([
      dataClient.from('menus').select('*').order('id', { ascending: true }),
      dataClient.from('tables').select('*').order('id', { ascending: true }),
      dataClient.from('order_items').select('*'),
      dataClient.from('categories').select('*').order('id', { ascending: true }),
      dataClient.from('restaurant_profile').select('*').eq('id', 1).maybeSingle(),
      dataClient.from('staffs').select('id, name, email, role, phone_number, pin_code').order('id', { ascending: true })
    ]);

    if (menusRes.error) throw menusRes.error;
    if (tablesRes.error) throw tablesRes.error;

    const allMenus = menusRes.data || [];
    const allTables = tablesRes.data || [];
    const allOrderItems = orderItemsRes.data || [];
    const allCategories = categoriesRes.data || [];

    const completedItems = allOrderItems.filter(i => i.item_status === 'completed' || i.item_status === 'served');
    
    let totalSalesValue = 0;
    completedItems.forEach(item => {
      const targetMenu = allMenus.find(m => m.id === item.menu_id);
      const price = targetMenu ? targetMenu.price : 0;
      totalSalesValue += price * item.quantity;
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalRevenue: totalSalesValue,
        totalOrdersCount: allOrderItems.length,
        totalMenusCount: allMenus.length,
        totalTablesCount: allTables.length
      },
      menus: allMenus,
      menuItems: allMenus,
      tables: allTables,
      categories: allCategories,
      orderItems: allOrderItems,
      restaurant: profileRes.data || null,
      staffs: staffsRes.data || []
    }, { headers: corsHeaders(request) });

  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders(request) });
  }
}

// 📤 [POST]: ສໍາລັບເຈົ້າຂອງຮ້ານກົດ ເພີ່ມເມນູ, ເພີ່ມໂຕະ, ແລະ ເພີ່ມໝວດໝູ່ໃໝ່
export async function POST(request) {
  try {
    const ownerClient = await getOwnerClient(request);
    if (!ownerClient) {
      return NextResponse.json({ success: false, error: 'Owner authentication required' }, { status: 401, headers: corsHeaders(request) });
    }
    const supabase = ownerClient;
    const body = await request.json();
    const { action, payload } = body;

    // ໑. ອັບເດດລາຄາອາຫານ
    if (action === 'update_menu_price') {
      const { menuId, newPrice } = payload;
      const { error } = await supabase.from('menus').update({ price: Number(newPrice) }).eq('id', menuId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'update_menu') {
      const { id, name_lo, name_en, name_zh, name_th, image_url, price, category_id, is_available } = payload;
      const { error } = await supabase
        .from('menus')
        .update({ name_lo, name_en, name_zh, name_th, image_url, price: Number(price), category_id: Number(category_id), is_available: is_available !== false })
        .eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle_menu_availability') {
      const { menuId, isAvailable } = payload;
      const { error } = await supabase.from('menus').update({ is_available: isAvailable === true }).eq('id', menuId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_menu') {
      const { menuId } = payload;
      const { error } = await supabase.from('menus').delete().eq('id', menuId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // ໒. ເພີ່ມເມນູອາຫານໃໝ່
    if (action === 'add_new_menu') {
      const { name_lo, name_en, name_zh, name_th, image_url, price, category_id } = payload;
      const { error } = await supabase.from('menus').insert([{ name_lo, name_en, name_zh, name_th, image_url, price: Number(price), category_id: Number(category_id), is_available: true }]);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // ໓. ເພີ່ມໂຕະໃໝ່
    if (action === 'add_new_table') {
      const { table_number, name_lo, name_en, name_zh, name_th } = payload;
      const { error } = await supabase.from('tables').insert([{ table_number: Number(table_number), name_lo, name_en, name_zh, name_th, status: 'vacant', is_available: true, bill_requested: false }]);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'update_table') {
      const { id, table_number, name_lo, name_en, name_zh, name_th } = payload;
      const { error } = await supabase.from('tables').update({ table_number: Number(table_number), name_lo, name_en, name_zh, name_th }).eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_table') {
      const { tableId } = payload;
      const { error } = await supabase.from('tables').delete().eq('id', tableId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle_table_availability') {
      const { tableId, isAvailable } = payload;
      const { error } = await supabase.from('tables').update({ is_available: isAvailable === true }).eq('id', tableId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'update_restaurant_profile') {
      const { logo_url, qr_url, name_lo, name_en, name_zh, name_th } = payload;
      const { data, error } = await supabase
        .from('restaurant_profile')
        .upsert([{ id: 1, logo_url, qr_url, name_lo, name_en, name_zh, name_th }], { onConflict: 'id' })
        .select('*')
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, restaurant: data });
    }

    if (action === 'update_staff') {
      const { id, name, email, role, phone_number, pin_code } = payload;
      const updateData = { name, phone_number };
      if (email !== undefined) updateData.email = email || null;
      const normalizedRole = String(role || '').trim().toLowerCase();
      if (normalizedRole === 'owner' || normalizedRole === 'staff') updateData.role = normalizedRole;
      if (pin_code) updateData.pin_code = pin_code;
      const { data: existingStaffs, error: existingStaffsError } = await supabase
        .from('staffs')
        .select('id, name, email, role, phone_number, pin_code')
        .order('id', { ascending: true });
      if (existingStaffsError) throw existingStaffsError;
      const { data: updatedStaff, error } = await supabase
        .from('staffs')
        .update(updateData)
        .eq('id', id)
        .select('id, name, email, role, phone_number, pin_code')
        .single();
      if (error) throw error;
      if (normalizedRole === 'owner') await demoteOtherOwners(supabase, id);
      const updatedStaffs = (existingStaffs || []).map(staff => {
        if (String(staff.id) === String(id)) return { ...staff, ...updateData };
        return normalizedRole === 'owner' ? { ...staff, role: 'staff' } : staff;
      });
      return NextResponse.json({ success: true, staff: updatedStaff, staffs: updatedStaffs });
    }

    if (action === 'add_staff') {
      const { name, email, role, phone_number, pin_code } = payload;
      if (!name || !phone_number || !pin_code) return NextResponse.json({ success: false, error: 'Name, phone number and PIN are required' }, { status: 400 });
      const safeRole = String(role || 'staff').trim().toLowerCase() === 'owner' ? 'owner' : 'staff';
      const { data: insertedStaff, error } = await supabase.from('staffs').insert([{ name, email: email || null, role: safeRole, phone_number, pin_code }]).select('id, name, email, role, phone_number, pin_code').single();
      if (error) throw error;
      const { data: existingStaffs, error: existingStaffsError } = await supabase
        .from('staffs')
        .select('id, name, email, role, phone_number, pin_code')
        .neq('id', insertedStaff.id)
        .order('id', { ascending: true });
      if (existingStaffsError) throw existingStaffsError;
      if (safeRole === 'owner') await demoteOtherOwners(supabase);
      const updatedStaffs = (existingStaffs || []).map(staff => safeRole === 'owner' ? { ...staff, role: 'staff' } : staff);
      return NextResponse.json({ success: true, staffs: [...updatedStaffs, insertedStaff] });
    }

    if (action === 'delete_staff') {
      const { staffId } = payload;
      const { error } = await supabase.from('staffs').delete().eq('id', staffId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // ໔. 🎯 [ຈຸດເພີ່ມໃໝ່]: ຄຳສັ່ງກົດເພີ່ມ "ໝວດໝູ່ໃໝ່" (ເຊັ່ນ ອາຫານຕາມສັ່ງ, ປະເພດຕຳ) ລົງຕາຕະລາງ categories
    if (action === 'add_new_category') {
      const { name_lo, name_en, name_zh, name_th } = payload;
      const { error } = await supabase.from('categories').insert([{ name_lo, name_en, name_zh, name_th, is_available: true }]);
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Category added successfully' });
    }

    if (action === 'update_category') {
      const { id, name_lo, name_en, name_zh, name_th, is_available } = payload;
      const { error } = await supabase.from('categories').update({ name_lo, name_en, name_zh, name_th, is_available: is_available !== false }).eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_category') {
      const { categoryId } = payload;
      const { error } = await supabase.from('categories').delete().eq('id', categoryId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle_category_availability') {
      const { categoryId, isAvailable } = payload;
      const { error } = await supabase.from('categories').update({ is_available: isAvailable === true }).eq('id', categoryId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });

  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
