'use client'; 

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js'; 
import { Bell, Boxes, ChevronRight, Eye, EyeOff, LayoutDashboard, LogOut, Menu, Search, Settings2, ShoppingBag, Store, Table2, Users, X } from 'lucide-react';

const SUPABASE_URL = 'https://fulsiuajohtyotcpbxti.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iMOUS7O7-Qx7Urau9WhpyQ_VipWYXSh';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 

async function ownerApiFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(options.headers || {});
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  return fetch(url, { cache: 'no-store', ...options, headers });
}

if (typeof globalThis.__globalSilentUndoTableIdMap === 'undefined') {
globalThis.__globalSilentUndoTableIdMap = {};
} 

const RECEIPT_UI = {
lo: { title: 'ໃບບິນລາຍການທັງໝົດ', table: 'ໂຕະເບີ', date: 'ວັນທີເວລາ', total: 'ລວມທັງໝົດ:', qrLabel: 'ສະແກນຮັບເງິນຜ່ານ LAO QR / BCEL One', btnClose: 'ປິດໜ້າຈໍ', colName: 'ລາຍການ', colQty: 'ຈຳນວນ', colPrice: 'ລາຄາ' },
en: { title: 'Guest Receipt Slip', table: 'Table Number', date: 'Date & Time', total: 'Grand Total:', qrLabel: 'Scan to Pay via BCEL One / LAO QR', btnClose: 'Close View', colName: 'Item Name', colQty: 'Qty', colPrice: 'Price' },
zh: { title: '所有点单发票', table: '桌号', date: '日期与时间', total: '总计金额:', qrLabel: '扫描 LAO QR / BCEL One 微信支付', btnClose: '关闭窗口', colName: '商品名称', colQty: '数量', colPrice: '金额' },
th: { title: 'ใบเสร็จรายการทั้งหมด', table: 'โต๊ะน้ำเบอร์', date: 'วันที่เวลา', total: 'รวมทั้งหมด:', qrLabel: 'สแกนรับเงินผ่าน LAO QR / BCEL One', btnClose: 'ปิดหน้าจอ', colName: 'รายการ', colQty: 'จำนวน', colPrice: 'ราคา' }
}; 

export default function OwnerDashboardPage() {
const router = useRouter();
const [authChecking, setAuthChecking] = useState(true);
const [ownerAccessLost, setOwnerAccessLost] = useState(false);
const [summary, setSummary] = useState({ totalRevenue: 0, totalOrdersCount: 0, totalMenusCount: 0, totalTablesCount: 0, foodRevenue: 0, drinkRevenue: 0, foodItemsCount: 0, drinkItemsCount: 0 });
const [menus, setMenus] = useState([]);
const [tables, setTables] = useState([]);
const [staffs, setStaffs] = useState([]);
const pendingStaffRolesRef = useRef({});
const [staffSearchTerm, setStaffSearchTerm] = useState('');
const [visibleStaffPins, setVisibleStaffPins] = useState({});
const [addStaffModalOpen, setAddStaffModalOpen] = useState(false);
const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'staff', phone_number: '', pin_code: '' });
const [editStaffModalOpen, setEditStaffModalOpen] = useState(false);
const [editingStaff, setEditingStaff] = useState(null);
const [categories, setCategories] = useState([]);
const [restaurant, setRestaurant] = useState(null);
const [restaurantSettingsOpen, setRestaurantSettingsOpen] = useState(false);
const [restaurantDraft, setRestaurantDraft] = useState({ logo_url: '', qr_url: '', name_lo: '', name_en: '', name_zh: '', name_th: '' });
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null); 

const [newMenu, setNewMenu] = useState({ name_lo: '', name_en: '', name_zh: '', name_th: '', image_url: '', price: '', category_id: '' });
const [newTable, setNewTable] = useState({ table_number: '', name_lo: '', name_en: '', name_zh: '', name_th: '' });
const [newCategory, setNewCategory] = useState({ name_lo: '', name_en: '', name_zh: '', name_th: '' });

const [editingPriceId, setEditingPriceId] = useState(null);
const [newPriceValue, setNewPriceValue] = useState(''); 
const [sidebarOpen, setSidebarOpen] = useState(false);
const [activeSection, setActiveSection] = useState('owner-overview');
const [showSalesDetails, setShowSalesDetails] = useState(false);
const [salesItems, setSalesItems] = useState([]);
const [selectedCategoryId, setSelectedCategoryId] = useState(null);
const [editingMenuId, setEditingMenuId] = useState('');
const [editingMenu, setEditingMenu] = useState(null);
const [menuSearchTerm, setMenuSearchTerm] = useState('');
const [menuTableSearchTerm, setMenuTableSearchTerm] = useState('');
const [menuTableCategoryId, setMenuTableCategoryId] = useState('');
const [addMenuModalOpen, setAddMenuModalOpen] = useState(false);
const [addTableModalOpen, setAddTableModalOpen] = useState(false);
const [editTableModalOpen, setEditTableModalOpen] = useState(false);
const [editingTable, setEditingTable] = useState(null);
const [editMenuModalOpen, setEditMenuModalOpen] = useState(false);
const [addCategoryModalOpen, setAddCategoryModalOpen] = useState(false);
const [editCategoryModalOpen, setEditCategoryModalOpen] = useState(false);
const [editingCategory, setEditingCategory] = useState(null);
const [categorySearchTerm, setCategorySearchTerm] = useState('');
const [tableSearchTerm, setTableSearchTerm] = useState('');
const [categoryPage, setCategoryPage] = useState(1);
const [menuPage, setMenuPage] = useState(1);

useEffect(() => {
  let mounted = true;
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (!mounted) return;
    let isOwner = false;
    if (session?.user?.email) {
      const { data: ownerRecord } = await supabase
        .from('staffs')
        .select('id')
        .eq('email', session.user.email.toLowerCase())
        .eq('role', 'owner')
        .maybeSingle();
      isOwner = Boolean(ownerRecord);
    }
    if (!isOwner) {
      await supabase.auth.signOut();
      router.replace('/owner/login');
    }
    setAuthChecking(false);
  });
  return () => { mounted = false; };
}, [router]);

const fetchOwnerData = useCallback(async () => {
try {
const { data: { session } } = await supabase.auth.getSession();
const res = await ownerApiFetch('/api/owner-data', {
  headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
});
      // 🎯 ປ່ຽນແທນບລັອກ if (!res.ok) ດ້ວຍໂຄ້ດຊຸດນີ້ ທີ່ໃສ່ເຄື່ອງໝາຍ Backtick ຄົບຖ້ວນ
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setOwnerAccessLost(true);
          setError(null);
          return;
        }
        throw new Error(errorJson.error || `Server responded with status: ${res.status}`);
      }


const json = await res.json();
if (json.success) {
const fetchedMenus = json.menus || [];
const fetchedTables = json.tables || [];
const fetchedCategories = json.categories || [];
setMenus(fetchedMenus);
setTables(fetchedTables);
const pendingStaffRoles = pendingStaffRolesRef.current;
const refreshedStaffs = (json.staffs || []).map(staff => {
  const pendingRole = pendingStaffRoles[String(staff.id)];
  return pendingRole ? { ...staff, role: pendingRole } : staff;
});
Object.keys(pendingStaffRoles).forEach(staffId => {
  const refreshedStaff = (json.staffs || []).find(staff => String(staff.id) === staffId);
  if (refreshedStaff && String(refreshedStaff.role || '').trim().toLowerCase() === pendingStaffRoles[staffId]) {
    delete pendingStaffRoles[staffId];
  }
});
setStaffs(refreshedStaffs);
setCategories(fetchedCategories); 
setRestaurant(json.restaurant || null);
setRestaurantDraft({ logo_url: json.restaurant?.logo_url || '', qr_url: json.restaurant?.qr_url || '', name_lo: json.restaurant?.name_lo || '', name_en: json.restaurant?.name_en || '', name_zh: json.restaurant?.name_zh || '', name_th: json.restaurant?.name_th || '' });

if (fetchedCategories.length > 0 && !newMenu.category_id) {
  setNewMenu(prev => ({ ...prev, category_id: String(fetchedCategories[0].id) }));
}

let totalRevenue = json.summary?.totalRevenue || 0;
let foodSales = 0; let drinkSales = 0; let foodQty = 0; let drinkQty = 0;

const { data: allItems } = await supabase.from('order_items').select('*');
const completedItems = (allItems || []).filter(i => i.item_status === 'completed' || i.item_status === 'served');
setSalesItems(completedItems);

completedItems.forEach(item => {
  const m = fetchedMenus.find(menu => menu.id === item.menu_id);
  if (m) {
    const itemTotal = Number(m.price || 0) * Number(item.quantity || 0);
    if (Number(m.category_id) === 2) { 
      drinkSales += itemTotal; 
      drinkQty += Number(item.quantity || 0); 
    } else { 
      foodSales += itemTotal; 
      foodQty += Number(item.quantity || 0); 
    }
  }
});

setSummary({
  totalRevenue: totalRevenue,
  totalOrdersCount: json.summary?.totalOrdersCount || 0,
  totalMenusCount: fetchedMenus.length,
  totalTablesCount: fetchedTables.length,
  foodRevenue: foodSales, 
  drinkRevenue: drinkSales,
  foodItemsCount: foodQty, 
  drinkItemsCount: drinkQty
});
setError(null);

}
} catch (err) {
setError(err.message || "Connection Failed");
} finally {
setLoading(false);
}

}, [newMenu.category_id]); 

useEffect(() => {
let isMounted = true;
const runFetchInitial = async () => {
if (isMounted && !authChecking && typeof fetchOwnerData === 'function') {
await fetchOwnerData();
}
};
runFetchInitial(); 

const interval = setInterval(() => {
if (isMounted && !ownerAccessLost && typeof fetchOwnerData === 'function') {
fetchOwnerData();
}
}, 5000);

return () => {
isMounted = false;
clearInterval(interval);
};

}, [authChecking, fetchOwnerData, ownerAccessLost]); 

{/* useEffect(() => {
  if (typeof window !== 'undefined' && window.innerWidth >= 1024) setSidebarOpen(true);
}, []);*/}

const handleUpdatePrice = async (menuId) => {
if (!newPriceValue || isNaN(newPriceValue)) return alert('ກະລຸນາປ້ອນລາຄາເປັນຕົວເລກ!');
try {
const res = await ownerApiFetch('/api/owner-data', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ action: 'update_menu_price', payload: { menuId, newPrice: newPriceValue } })
});
if (res.ok) { alert('💵 ອັບເດດລາຄາຮຽບຮ້ອຍ!'); setEditingPriceId(null); setNewPriceValue(''); fetchOwnerData(); }
} catch (e) { alert(e.message); }
}; 

const handleAddMenu = async (e) => {
e.preventDefault();
if (!newMenu.name_lo || !newMenu.price || !newMenu.category_id) return alert('ກະລຸນາປ້ອນຊື່, ລາຄາ ແລະ ເລືອກໝວດໝູ່!');
try {
const res = await ownerApiFetch('/api/owner-data', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ action: 'add_new_menu', payload: newMenu })
});
if (res.ok) { alert('🍔 ເພີ່ມເມນູອາຫານໃໝ່ຮຽບຮ້ອຍແລ້ວ!'); setNewMenu({ name_lo: '', name_en: '', name_zh: '', name_th: '', image_url: '', price: '', category_id: categories?.id ? String(categories.id) : '' }); setAddMenuModalOpen(false); fetchOwnerData(); }
} catch (e) { alert(e.message); }
}; 

const handleMenuImageChange = (e) => {
  const selectedFile = e.target.files?.[0];
  if (!selectedFile) return;
  if (!selectedFile.type.startsWith('image/')) {
    alert('ກະລຸນາເລືອກໄຟລ໌ຮູບພາບເທົ່ານັ້ນ');
    return;
  }
  if (selectedFile.size > 2 * 1024 * 1024) {
    alert('ຮູບໃຫຍ່ເກີນໄປ, ກະລຸນາເລືອກຮູບບໍ່ເກີນ 2MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => setNewMenu(prev => ({ ...prev, image_url: String(reader.result || '') }));
  reader.readAsDataURL(selectedFile);
};

const handleEditMenuImageChange = (e) => {
  const selectedFile = e.target.files?.[0];
  if (!selectedFile) return;
  if (!selectedFile.type.startsWith('image/')) return alert('ກະລຸນາເລືອກໄຟລ໌ຮູບພາບເທົ່ານັ້ນ');
  if (selectedFile.size > 2 * 1024 * 1024) return alert('ຮູບໃຫຍ່ເກີນໄປ, ກະລຸນາເລືອກຮູບບໍ່ເກີນ 2MB');
  const reader = new FileReader();
  reader.onload = () => setEditingMenu(prev => ({ ...prev, image_url: String(reader.result || '') }));
  reader.readAsDataURL(selectedFile);
};

const handleSelectMenuForEdit = (menuId) => {
  setEditingMenuId(menuId);
  const menu = menus.find(item => String(item.id) === String(menuId));
  setEditingMenu(menu ? { ...menu, price: menu.price ?? '', image_url: menu.image_url || '' } : null);
  if (menu) setEditMenuModalOpen(true);
};

const handleUpdateMenu = async (e) => {
  e.preventDefault();
  if (!editingMenu) return;
  if (!editingMenu.name_lo || !editingMenu.price || !editingMenu.category_id) return alert('ກະລຸນາປ້ອນຊື່, ລາຄາ ແລະ ເລືອກໝວດໝູ່!');
  try {
    const res = await ownerApiFetch('/api/owner-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_menu', payload: editingMenu })
    });
    if (!res.ok) throw new Error('ບໍ່ສາມາດປັບປຸງເມນູໄດ້');
    alert('✅ ປັບປຸງລາຍການສຳເລັດແລ້ວ!');
    setEditingMenuId('');
    setEditingMenu(null);
    setEditMenuModalOpen(false);
    fetchOwnerData();
  } catch (e) { alert(e.message); }
};

const handleDeleteMenu = async (menu) => {
  if (!window.confirm(`ຕ້ອງການລຶບ "${menu.name_lo || menu.name_en || menu.name_zh || menu.name_th}" ແທ້ບໍ?`)) return;
  try {
    const res = await ownerApiFetch('/api/owner-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_menu', payload: { menuId: menu.id } })
    });
    if (!res.ok) throw new Error('ບໍ່ສາມາດລຶບລາຍການໄດ້');
    if (String(editingMenuId) === String(menu.id)) {
      setEditingMenuId('');
      setEditingMenu(null);
      setEditMenuModalOpen(false);
    }
    fetchOwnerData();
  } catch (e) { alert(e.message); }
};

const handleToggleMenuAvailability = async (menu) => {
  try {
    const res = await ownerApiFetch('/api/owner-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_menu_availability', payload: { menuId: menu.id, isAvailable: menu.is_available === false } })
    });
    if (!res.ok) throw new Error('ບໍ່ສາມາດປ່ຽນສະຖານະເມນູໄດ້');
    fetchOwnerData();
  } catch (e) { alert(e.message); }
};

const handleAddTable = async (e) => {
e.preventDefault();
if (!newTable.table_number || !newTable.name_lo) return alert('ກະລຸນາປ້ອນເລກໂຕະ ແລະ ຊື່ໂຕະ!');
try {
const res = await ownerApiFetch('/api/owner-data', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ action: 'add_new_table', payload: newTable })
});
if (res.ok) { alert('🪑 ເພີ່ມໂຕະໃໝ່ຮຽບຮ້ອຍແລ້ວ!'); setNewTable({ table_number: '', name_lo: '', name_en: '', name_zh: '', name_th: '' }); fetchOwnerData(); }
} catch (e) { alert(e.message); }
}; 

const handleEditTable = (table) => {
  setEditingTable({ ...table });
  setEditTableModalOpen(true);
};

const handleUpdateTable = async (e) => {
  e.preventDefault();
  if (!editingTable?.table_number || !editingTable?.name_lo) return alert('ກະລຸນາປ້ອນເລກໂຕະ ແລະ ຊື່ໂຕະ!');
  try {
    const res = await ownerApiFetch('/api/owner-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_table', payload: editingTable })
    });
    if (!res.ok) throw new Error('ບໍ່ສາມາດແກ້ໄຂໂຕະໄດ້');
    setEditTableModalOpen(false);
    setEditingTable(null);
    fetchOwnerData();
  } catch (e) { alert(e.message); }
};

const handleDeleteTable = async (table) => {
  if (!window.confirm(`ຕ້ອງການລຶບໂຕະ #${table.table_number} ແທ້ບໍ?`)) return;
  try {
    const res = await ownerApiFetch('/api/owner-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_table', payload: { tableId: table.id } })
    });
    if (!res.ok) throw new Error('ບໍ່ສາມາດລຶບໂຕະໄດ້');
    fetchOwnerData();
  } catch (e) { alert(e.message); }
};

const handleToggleTableAvailability = async (table) => {
  const isAvailable = table.is_available === false;
  try {
    const res = await ownerApiFetch('/api/owner-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_table_availability', payload: { tableId: table.id, isAvailable } })
    });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.error || errorBody.message || 'ບໍ່ສາມາດປ່ຽນສະຖານະໂຕະໄດ້');
    }
    setTables(currentTables => currentTables.map(currentTable => String(currentTable.id) === String(table.id) ? { ...currentTable, is_available: isAvailable } : currentTable));
    fetchOwnerData();
  } catch (e) { alert(e.message); }
};

const handleEditStaff = (staff) => {
  setEditingStaff({ ...staff, email: staff.email || '', role: staff.role || 'staff', pin_code: staff.pin_code || '' });
  setEditStaffModalOpen(true);
};

const handleAddStaff = async (event) => {
  event.preventDefault();
  if (!newStaff.name || !newStaff.phone_number || !newStaff.pin_code) return alert('ກະລຸນາປ້ອນຊື່, ເບີໂທ ແລະ PIN ພະນັກງານ!');
  if (newStaff.role === 'owner' && !newStaff.email.trim()) return alert('ກະລຸນາປ້ອນ email ສໍາລັບ owner!');
  if (newStaff.pin_code.length !== 4) return alert('PIN ຕ້ອງມີ 4 ຫຼັກ!');
  try {
    const res = await ownerApiFetch('/api/owner-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_staff', payload: newStaff }) });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.error || 'ບໍ່ສາມາດເພີ່ມພະນັກງານໄດ້');
    if (Array.isArray(result.staffs)) {
      const pendingStaffRoles = pendingStaffRolesRef.current;
      setStaffs(result.staffs.map(staff => pendingStaffRoles[String(staff.id)] ? { ...staff, role: pendingStaffRoles[String(staff.id)] } : staff));
    }
    setNewStaff({ name: '', email: '', role: 'staff', phone_number: '', pin_code: '' });
    setAddStaffModalOpen(false);
  } catch (e) { alert(e.message); }
};

const handleUpdateStaff = async (event) => {
  event.preventDefault();
  if (!editingStaff?.name || !editingStaff?.phone_number) return alert('ກະລຸນາປ້ອນຊື່ ແລະ ເບີໂທພະນັກງານ!');
  if (editingStaff.role === 'owner' && !editingStaff.email?.trim()) return alert('ກະລຸນາປ້ອນ email ສໍາລັບ owner!');
  const previousStaffs = staffs;
  const savedStaff = { ...editingStaff, role: String(editingStaff.role || 'staff').trim().toLowerCase() };
  const optimisticStaffs = staffs.map(staff => {
    if (String(staff.id) === String(savedStaff.id)) return savedStaff;
    return savedStaff.role === 'owner' ? { ...staff, role: 'staff' } : staff;
  });
  optimisticStaffs.forEach(staff => {
    if (String(staff.id) !== String(savedStaff.id) && savedStaff.role === 'owner') {
      pendingStaffRolesRef.current[String(staff.id)] = 'staff';
    }
  });
  pendingStaffRolesRef.current[String(savedStaff.id)] = savedStaff.role;
  setStaffs(optimisticStaffs);
  setEditStaffModalOpen(false);
  setEditingStaff(null);
  try {
    const res = await ownerApiFetch('/api/owner-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_staff', payload: savedStaff }) });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.error || 'ບໍ່ສາມາດແກ້ໄຂພະນັກງານໄດ້');
    if (Array.isArray(result.staffs)) {
      const pendingStaffRoles = pendingStaffRolesRef.current;
      setStaffs(result.staffs.map(staff => pendingStaffRoles[String(staff.id)] ? { ...staff, role: pendingStaffRoles[String(staff.id)] } : staff));
    }
    const { data: { session } } = await supabase.auth.getSession();
    const currentEmail = session?.user?.email?.toLowerCase();
    const currentStaff = staffs.find(staff => String(staff.email || '').trim().toLowerCase() === currentEmail);
    if (currentStaff && (String(currentStaff.id) === String(savedStaff.id) ? savedStaff.role !== 'owner' : savedStaff.role === 'owner')) {
      setOwnerAccessLost(true);
    }
  } catch (e) {
    Object.keys(pendingStaffRolesRef.current).forEach(staffId => {
      delete pendingStaffRolesRef.current[staffId];
    });
    setStaffs(previousStaffs);
    alert(e.message);
  }
};

const handleDeleteStaff = async (staff) => {
  if (!window.confirm(`ຕ້ອງການລຶບພະນັກງານ ${staff.phone_number || ''} ແທ້ບໍ?`)) return;
  try {
    const res = await ownerApiFetch('/api/owner-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_staff', payload: { staffId: staff.id } }) });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.error || 'ບໍ່ສາມາດລຶບພະນັກງານໄດ້');
    fetchOwnerData();
  } catch (e) { alert(e.message); }
};

const handleUpdateRestaurantSettings = async (event) => {
  event.preventDefault();
  try {
    const res = await ownerApiFetch('/api/owner-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_restaurant_profile', payload: restaurantDraft })
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.error || 'ບໍ່ສາມາດບັນທຶກຕັ້ງຄ່າຮ້ານໄດ້');
    setRestaurant(result.restaurant || restaurantDraft);
    setRestaurantSettingsOpen(false);
    fetchOwnerData();
  } catch (e) { alert(e.message); }
};

const handleOwnerLogout = async () => {
  await supabase.auth.signOut();
  router.replace('/owner/login');
};

const handleAddCategory = async (e) => {
e.preventDefault();
if (!newCategory.name_lo) return alert('ກະລຸນາປ້ອນຊື່ໝວດໝູ່ພາສາລາວ!');
try {
const res = await ownerApiFetch('/api/owner-data', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ action: 'add_new_category', payload: newCategory })
});
if (res.ok) {
alert('✨ ເພີ່ມໝວດໝູ່ໃໝ່ລົງຖານຂໍ້ມູນສຳເລັດແລ້ວ!');
                setNewCategory({ name_lo: '', name_en: '', name_zh: '', name_th: '' });
                setAddCategoryModalOpen(false);
fetchOwnerData();
}
} catch (e) { alert(e.message); }
}; 

const handleEditCategory = (category) => {
  setEditingCategory({ ...category });
  setEditCategoryModalOpen(true);
};

const handleUpdateCategory = async (e) => {
  e.preventDefault();
  if (!editingCategory?.name_lo) return alert('ກະລຸນາປ້ອນຊື່ໝວດໝູ່ພາສາລາວ!');
  try {
    const res = await ownerApiFetch('/api/owner-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_category', payload: editingCategory })
    });
    if (!res.ok) throw new Error('ບໍ່ສາມາດແກ້ໄຂໝວດໝູ່ໄດ້');
    setEditCategoryModalOpen(false);
    setEditingCategory(null);
    fetchOwnerData();
  } catch (e) { alert(e.message); }
};

const handleDeleteCategory = async (category) => {
  if (!window.confirm(`ຕ້ອງການລຶບໝວດ "${category.name_lo || category.name_en || category.name_zh || category.name_th}" ແທ້ບໍ?`)) return;
  try {
    const res = await ownerApiFetch('/api/owner-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_category', payload: { categoryId: category.id } })
    });
    if (!res.ok) throw new Error('ບໍ່ສາມາດລຶບໝວດໝູ່ໄດ້');
    fetchOwnerData();
  } catch (e) { alert(e.message); }
};

const handleToggleCategoryAvailability = async (category) => {
  try {
    const res = await ownerApiFetch('/api/owner-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_category_availability', payload: { categoryId: category.id, isAvailable: category.is_available === false } })
    });
    if (!res.ok) {
      const responseBody = await res.json().catch(() => ({}));
      throw new Error(responseBody.error || responseBody.message || 'ບໍ່ສາມາດປ່ຽນສະຖານະໝວດໝູ່ໄດ້');
    }
    fetchOwnerData();
  } catch (e) { alert(e.message); }
};

const pageSize = 10;
const filteredCategories = categories.filter((category) => {
  const searchValue = categorySearchTerm.trim().toLowerCase();
  if (!searchValue) return true;
  return [category.name_lo, category.name_en, category.name_zh, category.name_th]
    .some(value => String(value || '').toLowerCase().includes(searchValue));
});
const categoryPageCount = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
const visibleCategories = filteredCategories.slice((categoryPage - 1) * pageSize, categoryPage * pageSize);
const filteredTables = tables.filter((table) => {
  const searchValue = tableSearchTerm.trim().toLowerCase();
  if (!searchValue) return true;
  return [table.table_number, table.name_lo, table.status]
    .some(value => String(value || '').toLowerCase().includes(searchValue));
});
const filteredStaffs = staffs.filter((staff) => {
  const searchValue = staffSearchTerm.trim().toLowerCase();
  if (!searchValue) return true;
  return [staff.name, staff.name_lo, staff.name_en, staff.name_zh, staff.name_th, staff.phone_number]
    .some(value => String(value || '').toLowerCase().includes(searchValue));
});
const getStaffRole = (staff) => String(staff.role || 'staff').trim().toLowerCase();
const filteredMenuRows = menus.filter((menu) => {
  const searchValue = menuTableSearchTerm.trim().toLowerCase();
  const matchesCategory = !menuTableCategoryId || String(menu.category_id) === String(menuTableCategoryId);
  if (!matchesCategory) return false;
  if (!searchValue) return true;
  const category = categories.find(item => String(item.id) === String(menu.category_id));
  return [menu.name_lo, menu.name_en, menu.name_zh, menu.name_th, menu.price, category?.name_lo, category?.name_en, category?.name_zh, category?.name_th]
    .some(value => String(value || '').toLowerCase().includes(searchValue));
});
const menuPageCount = Math.max(1, Math.ceil(filteredMenuRows.length / pageSize));
const visibleMenus = filteredMenuRows.slice((menuPage - 1) * pageSize, menuPage * pageSize);
const restaurantName = restaurant?.name_lo || restaurant?.name_en || restaurant?.name_zh || restaurant?.name_th || 'MairTR Kitchen';

if (authChecking) {
  return <main className="modern-admin-loading"><div className="loading-mark"><Store size={22} /></div><p>ກຳລັງກວດສອບສິດເຂົ້າໃຊ້...</p></main>;
}


return (
  <>
    <>
        <div className={`admin-sidebar-backdrop fixed inset-0 z-30 lg:hidden ${sidebarOpen ? 'is-visible' : ''}`} onClick={() => setSidebarOpen(false)} />
        <aside className={`admin-sidebar fixed left-0 top-0 z-40 h-screen w-[82vw] max-w-64 text-white shadow-2xl p-5 pt-6 lg:hidden transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="admin-brand border-b border-white/10 pb-5 mb-5">
            <div className="brand-icon">
              {restaurant?.logo_url ? <img src={restaurant.logo_url} alt="Restaurant logo" className="h-full w-full rounded-[0.7rem] object-cover" /> : <Store size={18} />}
            </div>
            <div><h2 className="text-lg font-black">{restaurantName}</h2></div>
            <button type="button" onClick={() => setSidebarOpen(false)} className="ml-auto text-gray-500 hover:text-red-600" title="ປິດ" aria-label="ປິດ sidebar"><X size={20} /></button>
          </div>
          <nav className="admin-nav space-y-2 text-sm font-black">
            <a href="#owner-overview" onClick={() => { setActiveSection('owner-overview'); setSidebarOpen(false); }} className={activeSection === 'owner-overview' ? 'active' : ''}><LayoutDashboard size={17} /> ພາບລວມ <ChevronRight size={15} /></a>
            <a href="#owner-categories" onClick={() => { setActiveSection('owner-categories'); setSidebarOpen(false); }} className={activeSection === 'owner-categories' ? 'active' : ''}><Boxes size={17} /> ໝວດໝູ່ <ChevronRight size={15} /></a>
            <a href="#owner-menus" onClick={() => { setActiveSection('owner-menus'); setSidebarOpen(false); }} className={activeSection === 'owner-menus' ? 'active' : ''}><ShoppingBag size={17} /> ເມນູທັງໝົດ <ChevronRight size={15} /></a>
            <a href="#owner-tables" onClick={() => { setActiveSection('owner-tables'); setSidebarOpen(false); }} className={activeSection === 'owner-tables' ? 'active' : ''}><Table2 size={17} /> ໂຕະທັງໝົດ <ChevronRight size={15} /></a>
            <a href="#owner-staff" onClick={() => { setActiveSection('owner-staff'); setSidebarOpen(false); document.getElementById('owner-staff')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className={activeSection === 'owner-staff' ? 'active' : ''}><Users size={17} /> ພະນັກງານ <ChevronRight size={15} /></a>
          </nav>
          <button type="button" className="admin-sidebar-footer w-full text-left" onClick={() => setRestaurantSettingsOpen(true)}><Settings2 size={16} /> ຕັ້ງຄ່າຮ້ານ</button>
          <button type="button" className="admin-sidebar-footer w-full text-left" onClick={handleOwnerLogout}><LogOut size={16} /> ອອກຈາກລະບົບ</button>
        </aside>
    </>

  <div className={`modern-admin min-h-screen pb-16 relative text-gray-950 p-3 pt-0 sm:p-4 sm:pt-0 lg:pt-0 font-sans ${sidebarOpen ? 'lg:pl-[292px]' : 'lg:pl-[88px] sidebar-collapsed'}`}>
    <aside className={`admin-sidebar desktop-sidebar fixed left-0 top-0 z-20 hidden h-screen ${sidebarOpen ? 'lg:flex w-64 p-4' : 'lg:flex w-16 p-3 desktop-sidebar-collapsed'}`}>
      <div className="admin-sidebar-inner w-full">
        <div className="admin-brand border-b border-white/10 pb-6 mb-7">
          <div className="brand-icon">
            {restaurant?.logo_url ? <img src={restaurant.logo_url} alt="Restaurant logo" className="h-full w-full rounded-[0.7rem] object-cover" /> : <Store size={18} />}
          </div>
          <div className="desktop-sidebar-copy"><h2 className="text-lg font-black">{restaurantName}</h2></div>
        </div>
        <nav className="admin-nav space-y-2 text-sm font-black">
          <a href="#owner-overview" onClick={() => setActiveSection('owner-overview')} className={activeSection === 'owner-overview' ? 'active' : ''}><LayoutDashboard size={17} /><span className="desktop-sidebar-copy">ພາບລວມ</span><ChevronRight size={15} /></a>
          <a href="#owner-categories" onClick={() => setActiveSection('owner-categories')} className={activeSection === 'owner-categories' ? 'active' : ''}><Boxes size={17} /><span className="desktop-sidebar-copy">ໝວດໝູ່</span><ChevronRight size={15} /></a>
          <a href="#owner-menus" onClick={() => setActiveSection('owner-menus')} className={activeSection === 'owner-menus' ? 'active' : ''}><ShoppingBag size={17} /><span className="desktop-sidebar-copy">ເມນູທັງໝົດ</span><ChevronRight size={15} /></a>
          <a href="#owner-tables" onClick={() => setActiveSection('owner-tables')} className={activeSection === 'owner-tables' ? 'active' : ''}><Table2 size={17} /><span className="desktop-sidebar-copy">ໂຕະທັງໝົດ</span><ChevronRight size={15} /></a>
          <a href="#owner-staff" onClick={() => { setActiveSection('owner-staff'); document.getElementById('owner-staff')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className={activeSection === 'owner-staff' ? 'active' : ''}><Users size={17} /><span className="desktop-sidebar-copy">ພະນັກງານ</span><ChevronRight size={15} /></a>
        </nav>
        <button type="button" className="admin-sidebar-footer w-full text-left" onClick={() => setRestaurantSettingsOpen(true)}><Settings2 size={16} /> ຕັ້ງຄ່າຮ້ານ</button>
        <button type="button" className="admin-sidebar-footer w-full text-left" onClick={handleOwnerLogout}><LogOut size={16} /> ອອກຈາກລະບົບ</button>
      </div>
    </aside>
    
    <div className="admin-topbar sticky top-0 z-30 px-0 py-3 mb-4 scroll-mt-6">
      <div className="admin-control-room flex items-center gap-2 sm:gap-1 pr-4 sm:pr-5">
        <button
          type="button"
          onClick={() => setSidebarOpen(prev => !prev)}
          className={`admin-menu-toggle shrink-0 transition-colors duration-200 ${sidebarOpen ? 'admin-menu-toggle-open' : ''}`}
          aria-label={sidebarOpen ? 'ປິດ Sidebar' : 'ເປີດ Sidebar'}
          title={sidebarOpen ? 'ປິດ Sidebar' : 'ເປີດ Sidebar'}
          aria-expanded={sidebarOpen}
        >
          <Menu size={20} />
        </button>
        <input type="search" value={menuTableSearchTerm} onChange={(event) => { setMenuTableSearchTerm(event.target.value); setMenuPage(1); }} onKeyDown={(event) => { if (event.key === 'Enter') document.getElementById('owner-menus')?.scrollIntoView({ behavior: 'smooth' }); }} placeholder="ຄົ້ນຫາເມນູ..." className="admin-search w-[min(42vw,20rem)]" />
        <button type="button" className="admin-icon-button" title="ຄົ້ນຫາ" aria-label="ຄົ້ນຫາ" onClick={() => document.getElementById('owner-menus')?.scrollIntoView({ behavior: 'smooth' })}><Search size={18} /></button>
        <button type="button" className="admin-icon-button ml-auto" title="ແຈ້ງເຕືອນ"><Bell size={18} /></button>
        <div className="admin-status"><span /> ລະບົບ Online</div>
      </div>
    </div>

    {/* 📊 ໂຊນທີ 1: ກ່ອງສະຫຼຸບສະຖິຕິຍອດຂາຍ (Summary Cards) - ເພີ່ມຄວາມເຂັ້ມຂອງຕົວໜັງສື */}
    <h2 id="owner-overview" className={`admin-section-heading mb-4 flex items-center gap-2 border-b-2 border-gray-200 pb-3 scroll-mt-24 text-sm font-black text-gray-950 ${activeSection === 'owner-overview' ? 'active' : ''}`}><LayoutDashboard size={17} className="text-orange-500" /> ພາບລວມ</h2>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 text-gray-950">
      {/* ໒. ກ່ອງໝວດໝູ່ລາຍການ */}
      <button type="button" onClick={() => { setSelectedCategoryId(null); setShowSalesDetails(false); document.getElementById('owner-categories')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="bg-blue-600 p-4 rounded-2xl shadow-sm border-2 border-blue-700 ring-2 ring-blue-500/10 text-left cursor-pointer hover:bg-blue-700 transition active:scale-[0.99]">
        <p className="flex items-center gap-1 text-[11px] font-black text-white uppercase tracking-wide"><Boxes size={14} /> ໝວດໝູ່ລາຍການ</p>
        <h3 className="text-xl sm:text-2xl font-black text-white font-mono mt-1 flex items-baseline gap-0.5">
          {categories.length || 0} <span className="text-xs font-black text-white">ໝວດ</span>
        </h3>
        <span className="text-[10px] font-black text-white/90 mt-2 block">➕ ກົດເພື່ອສ້າງໝວດໝູ່</span>
      </button>

      {/* ໓. ກ່ອງເມນູອາຫານທັງໝົດ */}
      <button type="button" onClick={() => document.getElementById('owner-menus')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="bg-red-500 p-4 rounded-2xl shadow-sm border-2 border-red-600 text-left cursor-pointer hover:bg-red-600 transition active:scale-[0.99]">
        <p className="flex items-center gap-1 text-[11px] font-black text-white uppercase tracking-wide"><ShoppingBag size={14} /> ເມນູອາຫານທັງໝົດ</p>
        <h3 className="text-xl sm:text-2xl font-black text-white font-mono mt-1 flex items-baseline gap-0.5">
          {summary.totalMenusCount || 0} <span className="text-xs font-black text-white">ເມນູ</span>
        </h3>
        <span className="text-[10px] font-black text-white/90 mt-2 block">➕ ກົດເບິ່ງລາຍການເມນູ</span>
      </button>

      {/* ໔. ກ່ອງໂຕະທັງໝົດ */}
      <button id="owner-tables-summary" type="button" onClick={() => document.getElementById('owner-tables')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="w-full text-left bg-yellow-300 p-4 rounded-2xl shadow-sm border-2 border-yellow-400 hover:bg-yellow-400 transition active:scale-[0.99] scroll-mt-24">
        <p className="flex items-center gap-1 text-[11px] font-black text-yellow-950 uppercase tracking-wide"><Table2 size={14} /> ໂຕະທັງໝົດ</p>
        <h3 className="text-xl sm:text-2xl font-black text-yellow-950 font-mono mt-1 flex items-baseline gap-0.5">
          {summary.totalTablesCount || 0} <span className="text-xs font-black text-yellow-900">ໂຕະ</span>
        </h3>
        <span className="text-[10px] font-black text-yellow-950 mt-2 block">➕ ກົດເພື່ອຈັດການໂຕະ</span>
      </button>

      {/* ໕. ກ່ອງອໍເດີ້ທັງໝົດ */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-gray-200">
        <p className="text-[11px] font-black text-gray-600 uppercase tracking-wide">🛒 ອໍເດີ້ທັງໝົດ</p>
        <h3 className="text-xl sm:text-2xl font-black text-gray-950 font-mono mt-1 flex items-baseline gap-0.5">
          {summary.totalOrdersCount || 0} <span className="text-xs font-black text-gray-600">ຄັ້ງ</span>
        </h3>
      </div>

      {/* ໕. ກ່ອງຍອດຂາຍລວມທັງໝົດ */}
      <button type="button" onClick={() => setShowSalesDetails(prev => !prev)} className="bg-emerald-500 p-4 rounded-2xl shadow-md text-white col-span-2 md:col-span-1 text-left cursor-pointer hover:bg-emerald-600 transition active:scale-[0.99]">
        <p className="text-[11px] font-black uppercase tracking-wide">💰 ຍອດຂາຍລວມ</p>
        <h3 className="text-lg sm:text-xl font-black font-mono mt-1 tracking-tight">
          {(summary.totalRevenue || 0).toLocaleString()} K
        </h3>
        <span className="text-[10px] font-black text-emerald-100 mt-2 block">{showSalesDetails ? '▲ ເຊື່ອງລາຍການຂາຍດີ' : '▼ ກົດເບິ່ງລາຍການຂາຍດີ'}</span>
      </button>

    </div>

    {showSalesDetails && (
      <div className="bg-white border-2 border-emerald-200 rounded-2xl shadow-md p-4 mb-8 text-gray-950">
        <h2 className="text-base font-black text-emerald-800 mb-4">📈 ລາຍການຂາຍດີແຍກຕາມໝວດໝູ່</h2>
        <div className="space-y-4">
          {categories.filter(category => selectedCategoryId === null || String(category.id) === String(selectedCategoryId)).map(category => {
            const categoryItems = salesItems
              .filter(item => {
                const menu = menus.find(currentMenu => currentMenu.id === item.menu_id);
                return menu && String(menu.category_id) === String(category.id);
              })
              .reduce((items, item) => {
                const menu = menus.find(currentMenu => currentMenu.id === item.menu_id);
                const existingItem = items.find(currentItem => currentItem.menuId === item.menu_id);
                if (existingItem) {
                  existingItem.quantity += Number(item.quantity || 0);
                } else {
                  items.push({ menuId: item.menu_id, name: menu.name_lo || menu.name_en || 'ເມນູ', quantity: Number(item.quantity || 0), price: Number(menu.price || 0) });
                }
                return items;
              }, [])
              .sort((a, b) => b.quantity - a.quantity);

            if (categoryItems.length === 0) return null;

            return (
              <div key={category.id} className="border border-gray-200 rounded-xl p-3">
                <h3 className="font-black text-sm text-orange-700 mb-2">📁 {category.name_lo || category.name_en || category.name_zh || category.name_th}</h3>
                <div className="space-y-2">
                  {categoryItems.map((item, index) => (
                    <div key={item.menuId} className="flex items-center justify-between gap-3 text-xs font-black">
                      <span className="min-w-0 truncate"><span className="text-gray-400 mr-1">#{index + 1}</span>{item.name}</span>
                      <span className="shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-2 py-1">{item.quantity} ລາຍການ</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {salesItems.length === 0 && <p className="text-center text-gray-500 text-xs font-bold py-3">ຍັງບໍ່ມີລາຍການຂາຍສຳເລັດ</p>}
        </div>
      </div>
    )}

    {/* ແຖວທີ 2: ກ່ອງ Card ສະຫຼຸບແຍກໝວດໝູ່ອາຫານ 🍲 VS ເຄື່ອງດື່ມ 🥤 - ພື້ນຫຼັງສີເທົາອ່ອນຕັດຂອບເຂັ້ມ */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      <div className="bg-orange-50/40 p-5 rounded-2xl shadow-sm border-l-8 border-orange-500 border-2 border-gray-200 flex justify-between items-center">
        <div>
          <p className="text-xs font-black text-orange-700 uppercase tracking-wide">🍲 ໝວດອາຫານຫຼັກ (Food Sales)</p>
          <h4 className="text-xl sm:text-2xl font-black font-mono text-gray-950 mt-1">
            {(summary.foodRevenue || 0).toLocaleString()} K
          </h4>
        </div>
        <div className="text-right">
          <span className="text-xs font-black bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full border-2 border-orange-300 shadow-sm">
            {summary.foodItemsCount || 0} ຈານ
          </span>
        </div>
      </div>

      <div className="bg-blue-50/40 p-5 rounded-2xl shadow-sm border-l-8 border-blue-500 border-2 border-gray-200 flex justify-between items-center">
        <div>
          <p className="text-xs font-black text-blue-700 uppercase tracking-wide">🥤 ໝວດເຄື່ອງດື່ມ (Beverage Sales)</p>
          <h4 className="text-xl sm:text-2xl font-black font-mono text-gray-950 mt-1">
            {(summary.drinkRevenue || 0).toLocaleString()} K
          </h4>
        </div>
        <div className="text-right">
          <span className="text-xs font-black bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full border-2 border-blue-300 shadow-sm">
            {summary.drinkItemsCount || 0} ແກ້ວ
          </span>
        </div>
      </div>
    </div>

    {/* ⚙️ 🍔 ໂຊນທີ 2: ຟອມເພີ່ມເມນູ, ເພີ່ມໂຕະ */}
    {false && (
    <div id="owner-forms" className="admin-workspace-grid">
      <div className="bg-gray-50 p-5 rounded-2xl shadow-sm border-2 border-gray-200 md:col-span-2">
        <form onSubmit={handleAddMenu} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-black text-gray-700 mb-1">ຊື່ເມນູ (ພາສາລາວ) *</label>
            <input type="text" value={newMenu.name_lo} onChange={(e) => setNewMenu({...newMenu, name_lo: e.target.value})} className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black outline-none focus:border-orange-500 text-black placeholder:text-gray-400 shadow-inner" placeholder="ຕົວຢ່າງ: ຕຳໝາກຫຸ່ງ" />
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-700 mb-1">ຊື່ເມນູ (ພາສາອັງກິດ)</label>
            <input type="text" value={newMenu.name_en} onChange={(e) => setNewMenu({...newMenu, name_en: e.target.value})} className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black outline-none focus:border-orange-500 text-black placeholder:text-gray-400 shadow-inner" placeholder="ຕົວຢ່າງ: Papaya Salad" />
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-700 mb-1">ຊື່ເມນູ (中文)</label>
            <input type="text" value={newMenu.name_zh} onChange={(e) => setNewMenu({...newMenu, name_zh: e.target.value})} className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black outline-none focus:border-orange-500 text-black placeholder:text-gray-400 shadow-inner" placeholder="例如: 泰式沙拉" />
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-700 mb-1">ຊື່ເມນູ (ไทย)</label>
            <input type="text" value={newMenu.name_th} onChange={(e) => setNewMenu({...newMenu, name_th: e.target.value})} className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black outline-none focus:border-orange-500 text-black placeholder:text-gray-400 shadow-inner" placeholder="ตัวอย่าง: ส้มตำ" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-black text-gray-700 mb-1">ຮູບລາຍການ (Image URL)</label>
            <input type="file" accept="image/*" onChange={handleMenuImageChange} className="w-full bg-white border-2 border-gray-200 rounded-xl p-2 font-black text-black file:mr-3 file:rounded-lg file:border-0 file:bg-orange-500 file:px-3 file:py-1.5 file:text-white file:font-black file:cursor-pointer" />
            {newMenu.image_url && (
              <img src={newMenu.image_url} alt="Menu preview" className="mt-2 h-20 w-20 rounded-xl object-cover border border-gray-200 shadow-sm" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
            )}
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-700 mb-1">ລາຄາອາຫານ (Kip) *</label>
            <input type="number" value={newMenu.price} onChange={(e) => setNewMenu({...newMenu, price: e.target.value})} className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black outline-none focus:border-orange-500 text-black placeholder:text-gray-400 shadow-inner" placeholder="ຕົວຢ່າງ: 35000" />
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-700 mb-1">ໝວດໝູ່ອາຫານ *</label>
            <select value={newMenu.category_id} onChange={(e) => setNewMenu({...newMenu, category_id: e.target.value})} className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black outline-none focus:border-orange-500 text-black cursor-pointer shadow-inner">
              <option value="" className="font-black text-gray-500">-- ກະລຸນາເລືອກໝວດໝູ່ --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)} className="font-black text-black">
                  📁 {cat.name_lo} {cat.name_en ? `(${cat.name_en})` : ''} {cat.name_zh ? `(${cat.name_zh})` : ''} {cat.name_th ? `(${cat.name_th})` : ''}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="w-full sm:col-span-2 bg-orange-500 hover:bg-orange-600 text-white font-black py-3 rounded-xl mt-2 shadow-md transition active:scale-98 text-center text-sm tracking-wide">
            🚀 ບັງຄັບເພີ່ມເມນູອາຫານເຂົ້າລະບົບທັນທີ
          </button>
        </form>
      </div>

      <div className="bg-blue-50/50 p-5 rounded-2xl shadow-sm border-2 border-blue-200">
        <input
          type="search"
          value={menuSearchTerm}
          onChange={(e) => setMenuSearchTerm(e.target.value)}
          placeholder="🔎 ຄົ້ນຫາຊື່ລາຍການ..."
          className="w-full bg-white border-2 border-blue-200 rounded-xl p-2.5 mb-2 font-black text-black outline-none focus:border-blue-500 text-xs"
        />
        {menuSearchTerm.trim() && (
          <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
            {menus
              .filter(menu => [menu.name_lo, menu.name_en, menu.name_zh, menu.name_th].some(name => String(name || '').toLowerCase().includes(menuSearchTerm.trim().toLowerCase())))
              .map(menu => (
                <button type="button" key={menu.id} onClick={() => handleSelectMenuForEdit(String(menu.id))} className="w-full bg-white hover:bg-blue-100 border border-blue-100 rounded-lg px-3 py-2 flex items-center justify-between gap-2 text-left transition">
                  <span className="truncate text-xs font-black text-gray-900">{menu.name_lo || menu.name_en || menu.name_zh || menu.name_th}</span>
                  <span className="shrink-0 text-xs font-black font-mono text-orange-600">{Number(menu.price || 0).toLocaleString()} K</span>
                </button>
              ))}
            {menus.filter(menu => [menu.name_lo, menu.name_en, menu.name_zh, menu.name_th].some(name => String(name || '').toLowerCase().includes(menuSearchTerm.trim().toLowerCase()))).length === 0 && (
              <p className="text-[11px] text-gray-500 font-bold text-center py-2">ບໍ່ພົບລາຍການ</p>
            )}
          </div>
        )}
        <select value={editingMenuId} onChange={(e) => handleSelectMenuForEdit(e.target.value)} className="w-full bg-white border-2 border-blue-200 rounded-xl p-2.5 mb-3 font-black text-black outline-none focus:border-blue-500 text-xs">
          <option value="">-- ເລືອກລາຍການທີ່ຈະແກ້ --</option>
          {menus.map(menu => <option key={menu.id} value={String(menu.id)}>{menu.name_lo || menu.name_en || menu.name_zh || menu.name_th} - {Number(menu.price || 0).toLocaleString()} K</option>)}
        </select>

        {editingMenu && (
          <form onSubmit={handleUpdateMenu} className="space-y-2.5 text-xs">
            <input type="text" value={editingMenu.name_lo || ''} onChange={(e) => setEditingMenu({...editingMenu, name_lo: e.target.value})} placeholder="ຊື່ລາວ" className="w-full bg-white border border-gray-200 rounded-lg p-2 font-black text-black" />
            <input type="text" value={editingMenu.name_en || ''} onChange={(e) => setEditingMenu({...editingMenu, name_en: e.target.value})} placeholder="English name" className="w-full bg-white border border-gray-200 rounded-lg p-2 font-black text-black" />
            <input type="text" value={editingMenu.name_zh || ''} onChange={(e) => setEditingMenu({...editingMenu, name_zh: e.target.value})} placeholder="中文名称" className="w-full bg-white border border-gray-200 rounded-lg p-2 font-black text-black" />
            <input type="text" value={editingMenu.name_th || ''} onChange={(e) => setEditingMenu({...editingMenu, name_th: e.target.value})} placeholder="ชื่อภาษาไทย" className="w-full bg-white border border-gray-200 rounded-lg p-2 font-black text-black" />
            <input type="number" value={editingMenu.price} onChange={(e) => setEditingMenu({...editingMenu, price: e.target.value})} placeholder="ລາຄາ" className="w-full bg-white border border-gray-200 rounded-lg p-2 font-black text-black" />
            <select value={String(editingMenu.category_id || '')} onChange={(e) => setEditingMenu({...editingMenu, category_id: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg p-2 font-black text-black">
              {categories.map(cat => <option key={cat.id} value={String(cat.id)}>{cat.name_lo || cat.name_en || cat.name_zh || cat.name_th}</option>)}
            </select>
            <input type="file" accept="image/*" onChange={handleEditMenuImageChange} className="w-full bg-white border border-gray-200 rounded-lg p-1.5 text-black file:mr-2 file:rounded-md file:border-0 file:bg-blue-600 file:px-2 file:py-1 file:text-white file:font-black" />
            {editingMenu.image_url && <img src={editingMenu.image_url} alt="Menu preview" className="h-16 w-16 rounded-lg object-cover border border-gray-200" />}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-xl shadow-md transition active:scale-95">💾 ບັນທຶກການແກ້ໄຂ</button>
          </form>
        )}
      </div>
    </div>
    )}
      {restaurantSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setRestaurantSettingsOpen(false)}>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="flex items-center gap-2 text-base font-black text-blue-700"><Settings2 size={18} /> ຕັ້ງຄ່າຮ້ານ</h2>
              <button type="button" onClick={() => setRestaurantSettingsOpen(false)} className="text-gray-500 hover:text-red-600 text-lg font-black">✕</button>
            </div>
            <form onSubmit={handleUpdateRestaurantSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-black text-gray-700 mb-1">Logo ຮ້ານ</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0];
                    if (!selectedFile) return;
                    if (!selectedFile.type.startsWith('image/')) return alert('ກະລຸນາເລືອກໄຟລ໌ຮູບພາບເທົ່ານັ້ນ');
                    if (selectedFile.size > 2 * 1024 * 1024) return alert('Logo ໃຫຍ່ເກີນໄປ, ກະລຸນາເລືອກຮູບບໍ່ເກີນ 2MB');
                    const reader = new FileReader();
                    reader.onload = () => setRestaurantDraft(prev => ({ ...prev, logo_url: String(reader.result || '') }));
                    reader.readAsDataURL(selectedFile);
                  }}
                  className="w-full bg-white border-2 border-gray-200 rounded-xl p-2 font-black text-black file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white file:font-black file:cursor-pointer"
                />
                {restaurantDraft.logo_url && <img src={restaurantDraft.logo_url} alt="Restaurant logo preview" className="mt-2 h-16 w-16 rounded-xl object-cover border border-gray-200" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-black text-gray-700 mb-1">QR ຮ້ານ</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0];
                    if (!selectedFile) return;
                    if (!selectedFile.type.startsWith('image/')) return alert('ກະລຸນາເລືອກໄຟລ໌ QR ເປັນຮູບພາບ');
                    if (selectedFile.size > 2 * 1024 * 1024) return alert('QR ໃຫຍ່ເກີນໄປ, ກະລຸນາເລືອກຮູບບໍ່ເກີນ 2MB');
                    const reader = new FileReader();
                    reader.onload = () => setRestaurantDraft(prev => ({ ...prev, qr_url: String(reader.result || '') }));
                    reader.readAsDataURL(selectedFile);
                  }}
                  className="w-full bg-white border-2 border-gray-200 rounded-xl p-2 font-black text-black file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-white file:font-black file:cursor-pointer"
                />
                {restaurantDraft.qr_url && <img src={restaurantDraft.qr_url} alt="Restaurant QR preview" className="mt-2 h-28 w-28 rounded-xl object-contain border border-gray-200 bg-white p-1" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
              </div>
              <input required value={restaurantDraft.name_lo} onChange={(event) => setRestaurantDraft({ ...restaurantDraft, name_lo: event.target.value })} placeholder="ຊື່ຮ້ານ (ລາວ) *" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={restaurantDraft.name_en} onChange={(event) => setRestaurantDraft({ ...restaurantDraft, name_en: event.target.value })} placeholder="Restaurant name (English)" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={restaurantDraft.name_zh} onChange={(event) => setRestaurantDraft({ ...restaurantDraft, name_zh: event.target.value })} placeholder="餐厅名称 (中文)" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={restaurantDraft.name_th} onChange={(event) => setRestaurantDraft({ ...restaurantDraft, name_th: event.target.value })} placeholder="ชื่อร้าน (ไทย)" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <button type="submit" className="sm:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-md transition active:scale-95">💾 ບັນທຶກຕັ້ງຄ່າ</button>
            </form>
          </div>
        </div>
      )}

      {addTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setAddTableModalOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="flex items-center gap-2 text-base font-black text-blue-700"><Table2 size={18} /> ເພີ່ມໂຕະບໍລິການ</h2>
              <button type="button" onClick={() => setAddTableModalOpen(false)} className="text-gray-500 hover:text-red-600 text-lg font-black">✕</button>
            </div>
            <form onSubmit={(event) => { handleAddTable(event); setAddTableModalOpen(false); }} className="space-y-3 text-xs">
              <input required type="number" value={newTable.table_number} onChange={(event) => setNewTable({ ...newTable, table_number: event.target.value })} placeholder="ເລກໂຕະ *" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input required value={newTable.name_lo} onChange={(event) => setNewTable({ ...newTable, name_lo: event.target.value })} placeholder="ຊື່ໂຕະ (ລາວ) *" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={newTable.name_en} onChange={(event) => setNewTable({ ...newTable, name_en: event.target.value })} placeholder="Table name (English)" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={newTable.name_zh} onChange={(event) => setNewTable({ ...newTable, name_zh: event.target.value })} placeholder="桌名 (中文)" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={newTable.name_th} onChange={(event) => setNewTable({ ...newTable, name_th: event.target.value })} placeholder="ชื่อโต๊ะ (ไทย)" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl shadow-md transition active:scale-95">💾 ບັນທຶກໂຕະ</button>
            </form>
          </div>
        </div>
      )}

      {editTableModalOpen && editingTable && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditTableModalOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-black text-gray-900">✏️ ແກ້ໄຂໂຕະ</h2>
              <button type="button" onClick={() => setEditTableModalOpen(false)} className="text-gray-500 hover:text-red-600 text-lg font-black">✕</button>
            </div>
            <form onSubmit={handleUpdateTable} className="space-y-3 text-xs">
              <input required type="number" value={editingTable.table_number ?? ''} onChange={(event) => setEditingTable({ ...editingTable, table_number: event.target.value })} placeholder="ເລກໂຕະ *" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input required value={editingTable.name_lo || ''} onChange={(event) => setEditingTable({ ...editingTable, name_lo: event.target.value })} placeholder="ຊື່ໂຕະ (ລາວ) *" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={editingTable.name_en || ''} onChange={(event) => setEditingTable({ ...editingTable, name_en: event.target.value })} placeholder="Table name (English)" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={editingTable.name_zh || ''} onChange={(event) => setEditingTable({ ...editingTable, name_zh: event.target.value })} placeholder="桌名 (中文)" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={editingTable.name_th || ''} onChange={(event) => setEditingTable({ ...editingTable, name_th: event.target.value })} placeholder="ชื่อโต๊ะ (ไทย)" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-md transition active:scale-95">💾 ບັນທຶກການແກ້ໄຂ</button>
            </form>
          </div>
        </div>
      )}

      {editStaffModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditStaffModalOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="flex items-center gap-2 text-base font-black text-blue-700"><Users size={18} /> ແກ້ໄຂພະນັກງານ</h2>
              <button type="button" onClick={() => setEditStaffModalOpen(false)} className="text-gray-500 hover:text-red-600 text-lg font-black">✕</button>
            </div>
            <form onSubmit={handleUpdateStaff} className="space-y-3 text-xs">
              <input required value={editingStaff.name || ''} onChange={(event) => setEditingStaff({ ...editingStaff, name: event.target.value })} placeholder="ຊື່ພະນັກງານ *" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input type="email" value={editingStaff.email || ''} onChange={(event) => setEditingStaff({ ...editingStaff, email: event.target.value })} placeholder="Email (ຈໍາເປັນສໍາລັບ owner)" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <select value={editingStaff.role || 'staff'} onChange={(event) => setEditingStaff({ ...editingStaff, role: event.target.value })} className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black">
                <option value="staff">👤 ພະນັກງານ</option>
                <option value="owner">👑 ເຈົ້າຂອງຮ້ານ</option>
              </select>
              <input required value={editingStaff.phone_number || ''} onChange={(event) => setEditingStaff({ ...editingStaff, phone_number: event.target.value })} placeholder="ເບີໂທລະສັບ *" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input type="password" inputMode="numeric" maxLength={4} value={editingStaff.pin_code || ''} onChange={(event) => setEditingStaff({ ...editingStaff, pin_code: event.target.value.replace(/[^0-9]/g, '') })} placeholder="PIN 4 ຫຼັກ (ປ່ອຍວ່າງເພື່ອບໍ່ປ່ຽນ)" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-md transition active:scale-95">💾 ບັນທຶກການແກ້ໄຂ</button>
            </form>
          </div>
        </div>
      )}

      {addStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setAddStaffModalOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="flex items-center gap-2 text-base font-black text-blue-700"><Users size={18} /> ເພີ່ມພະນັກງານ</h2>
              <button type="button" onClick={() => setAddStaffModalOpen(false)} className="text-gray-500 hover:text-red-600 text-lg font-black">✕</button>
            </div>
            <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
              <input required value={newStaff.name} onChange={(event) => setNewStaff({ ...newStaff, name: event.target.value })} placeholder="ຊື່ພະນັກງານ *" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input type="email" value={newStaff.email} onChange={(event) => setNewStaff({ ...newStaff, email: event.target.value })} placeholder="Email (ຈໍາເປັນສໍາລັບ owner)" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <select value={newStaff.role} onChange={(event) => setNewStaff({ ...newStaff, role: event.target.value })} className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black">
                <option value="staff">👤 ພະນັກງານ</option>
                <option value="owner">👑 ເຈົ້າຂອງຮ້ານ</option>
              </select>
              <input required value={newStaff.phone_number} onChange={(event) => setNewStaff({ ...newStaff, phone_number: event.target.value })} placeholder="ເບີໂທລະສັບ *" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input required type="password" inputMode="numeric" maxLength={4} value={newStaff.pin_code} onChange={(event) => setNewStaff({ ...newStaff, pin_code: event.target.value.replace(/[^0-9]/g, '') })} placeholder="PIN 4 ຫຼັກ *" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-md transition active:scale-95">💾 ບັນທຶກພະນັກງານ</button>
            </form>
          </div>
        </div>
      )}

      {addMenuModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setAddMenuModalOpen(false)}>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-black text-gray-900">➕ ເພີ່ມເມນູອາຫານ / ເຄື່ອງດື່ມໃໝ່</h2>
              <button type="button" onClick={() => setAddMenuModalOpen(false)} className="text-gray-500 hover:text-red-600 text-lg font-black">✕</button>
            </div>
            <form onSubmit={handleAddMenu} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <input required value={newMenu.name_lo} onChange={(e) => setNewMenu({...newMenu, name_lo: e.target.value})} placeholder="ຊື່ເມນູ (ລາວ) *" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={newMenu.name_en} onChange={(e) => setNewMenu({...newMenu, name_en: e.target.value})} placeholder="Menu name (English)" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={newMenu.name_zh} onChange={(e) => setNewMenu({...newMenu, name_zh: e.target.value})} placeholder="菜单名称 (中文)" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={newMenu.name_th} onChange={(e) => setNewMenu({...newMenu, name_th: e.target.value})} placeholder="ชื่อเมนู (ไทย)" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input required type="number" value={newMenu.price} onChange={(e) => setNewMenu({...newMenu, price: e.target.value})} placeholder="ລາຄາ (Kip) *" className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <select required value={newMenu.category_id} onChange={(e) => setNewMenu({...newMenu, category_id: e.target.value})} className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black">
                <option value="">-- ເລືອກໝວດໝູ່ --</option>
                {categories.map(cat => <option key={cat.id} value={String(cat.id)}>{cat.name_lo || cat.name_en || cat.name_zh || cat.name_th}</option>)}
              </select>
              <div className="sm:col-span-2">
                <input type="file" accept="image/*" onChange={handleMenuImageChange} className="w-full bg-white border-2 border-gray-200 rounded-xl p-2 text-black file:mr-3 file:rounded-lg file:border-0 file:bg-orange-500 file:px-3 file:py-1.5 file:text-white file:font-black" />
                {newMenu.image_url && <img src={newMenu.image_url} alt="Menu preview" className="mt-2 h-24 w-24 rounded-xl object-cover border border-gray-200" />}
              </div>
              <button type="submit" className="sm:col-span-2 bg-orange-500 hover:bg-orange-600 text-white font-black py-3 rounded-xl shadow-md transition active:scale-95">🚀 ບັນທຶກເມນູ</button>
            </form>
          </div>
        </div>
      )}

      {editMenuModalOpen && editingMenu && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditMenuModalOpen(false)}>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-black text-gray-900">✏️ ແກ້ໄຂລາຍການ</h2>
              <button type="button" onClick={() => setEditMenuModalOpen(false)} className="text-gray-500 hover:text-red-600 text-lg font-black">✕</button>
            </div>
            <form onSubmit={handleUpdateMenu} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <input required value={editingMenu.name_lo || ''} onChange={(e) => setEditingMenu({...editingMenu, name_lo: e.target.value})} placeholder="ຊື່ເມນູ (ລາວ) *" className="w-full border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={editingMenu.name_en || ''} onChange={(e) => setEditingMenu({...editingMenu, name_en: e.target.value})} placeholder="Menu name (English)" className="w-full border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={editingMenu.name_zh || ''} onChange={(e) => setEditingMenu({...editingMenu, name_zh: e.target.value})} placeholder="菜单名称 (中文)" className="w-full border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={editingMenu.name_th || ''} onChange={(e) => setEditingMenu({...editingMenu, name_th: e.target.value})} placeholder="ชื่อเมนู (ไทย)" className="w-full border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input required type="number" value={editingMenu.price} onChange={(e) => setEditingMenu({...editingMenu, price: e.target.value})} placeholder="ລາຄາ *" className="w-full border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <select required value={String(editingMenu.category_id || '')} onChange={(e) => setEditingMenu({...editingMenu, category_id: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl p-2.5 font-black text-black">
                {categories.map(cat => <option key={cat.id} value={String(cat.id)}>{cat.name_lo || cat.name_en || cat.name_zh || cat.name_th}</option>)}
              </select>
              <div className="sm:col-span-2">
                <input type="file" accept="image/*" onChange={handleEditMenuImageChange} className="w-full border-2 border-gray-200 rounded-xl p-2 text-black file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white file:font-black" />
                {editingMenu.image_url && <img src={editingMenu.image_url} alt="Menu preview" className="mt-2 h-24 w-24 rounded-xl object-cover border border-gray-200" />}
              </div>
              <button type="submit" className="sm:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-md transition active:scale-95">💾 ບັນທຶກການແກ້ໄຂ</button>
            </form>
          </div>
        </div>
      )}

      {addCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setAddCategoryModalOpen(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-black text-gray-900">➕ ເພີ່ມໝວດໝູ່</h2>
              <button type="button" onClick={() => setAddCategoryModalOpen(false)} className="text-gray-500 hover:text-red-600 text-lg font-black">✕</button>
            </div>
            <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <input required value={newCategory.name_lo} onChange={(e) => setNewCategory({...newCategory, name_lo: e.target.value})} placeholder="ຊື່ໝວດ (ລາວ) *" className="w-full border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={newCategory.name_en} onChange={(e) => setNewCategory({...newCategory, name_en: e.target.value})} placeholder="Category name (English)" className="w-full border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={newCategory.name_zh} onChange={(e) => setNewCategory({...newCategory, name_zh: e.target.value})} placeholder="分类名称 (中文)" className="w-full border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={newCategory.name_th} onChange={(e) => setNewCategory({...newCategory, name_th: e.target.value})} placeholder="ชื่อหมวดหมู่ (ไทย)" className="w-full border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <button type="submit" className="sm:col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl shadow-md transition active:scale-95">💾 ບັນທຶກໝວດໝູ່</button>
            </form>
          </div>
        </div>
      )}

      {editCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditCategoryModalOpen(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-black text-gray-900">✏️ ແກ້ໄຂໝວດໝູ່</h2>
              <button type="button" onClick={() => setEditCategoryModalOpen(false)} className="text-gray-500 hover:text-red-600 text-lg font-black">✕</button>
            </div>
            <form onSubmit={handleUpdateCategory} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <input required value={editingCategory.name_lo || ''} onChange={(e) => setEditingCategory({...editingCategory, name_lo: e.target.value})} placeholder="ຊື່ໝວດ (ລາວ) *" className="w-full border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={editingCategory.name_en || ''} onChange={(e) => setEditingCategory({...editingCategory, name_en: e.target.value})} placeholder="Category name (English)" className="w-full border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={editingCategory.name_zh || ''} onChange={(e) => setEditingCategory({...editingCategory, name_zh: e.target.value})} placeholder="分类名称 (中文)" className="w-full border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <input value={editingCategory.name_th || ''} onChange={(e) => setEditingCategory({...editingCategory, name_th: e.target.value})} placeholder="ชื่อหมวดหมู่ (ไทย)" className="w-full border-2 border-gray-200 rounded-xl p-2.5 font-black text-black" />
              <button type="submit" className="sm:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-md transition active:scale-95">💾 ບັນທຶກການແກ້ໄຂ</button>
            </form>
          </div>
        </div>
      )}

      {/* 📁 ໑. ໂຊນຟອມເພີ່ມໝວດໝູ່ໃໝ່ - ປ່ຽນພື້ນຫຼັງເປັນສີເທົາອ່ອນ ຕົວໜັງສືດຳເຂັ້ມແຈ້ງ */}
      <div id="owner-categories" className="bg-gray-50 p-5 rounded-2xl shadow-sm border-2 border-gray-200 mb-8 text-gray-950 scroll-mt-24">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h3 className={`admin-section-heading admin-categories-heading text-sm font-black text-gray-900 flex items-center gap-2 ${activeSection === 'owner-categories' ? 'active' : ''}`}><Boxes size={17} className="text-blue-600" /> ສ້າງໝວດໝູ່ລາຍການ</h3>
          <div className="flex-1 min-w-[220px] max-w-[360px]">
            <input
              type="search"
              value={categorySearchTerm}
              onChange={(event) => { setCategorySearchTerm(event.target.value); setCategoryPage(1); }}
              placeholder="🔎 ຄົ້ນຫາໝວດໝູ່..."
              className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black outline-none focus:border-blue-500 text-xs"
            />
          </div>
          <button type="button" onClick={() => setAddCategoryModalOpen(true)} className="ml-auto shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3 py-2 rounded-xl shadow-md transition active:scale-95">➕ ເພີ່ມໝວດໝູ່</button>
        </div>
        <form onSubmit={handleAddCategory} className="hidden">
          <div>
            <label className="block text-[11px] font-black text-gray-700 mb-1">ຊື່ໝວດໝູ່ (ພາສາລາວ) *</label>
            <input type="text" value={newCategory.name_lo} onChange={(e) => setNewCategory({...newCategory, name_lo: e.target.value})} className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black outline-none focus:border-blue-600 text-black placeholder:text-gray-400 shadow-inner" placeholder="ຕົວຢ່າງ: ປະເພດຕຳ / ອາຫານຕາມສັ່ງ" />
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-700 mb-1">ຊື່ໝວດໝູ່ (ພາສາອັງກິດ)</label>
            <input type="text" value={newCategory.name_en} onChange={(e) => setNewCategory({...newCategory, name_en: e.target.value})} className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black outline-none focus:border-blue-600 text-black placeholder:text-gray-400 shadow-inner" placeholder="ຕົວຢ່າງ: Som Tum / À La Carte" />
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-700 mb-1">ຊື່ໝວດໝູ່ (中文)</label>
            <input type="text" value={newCategory.name_zh} onChange={(e) => setNewCategory({...newCategory, name_zh: e.target.value})} className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black outline-none focus:border-blue-600 text-black placeholder:text-gray-400 shadow-inner" placeholder="例如: 泰式沙拉" />
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-700 mb-1">ຊື່ໝວດໝູ່ (ไทย)</label>
            <input type="text" value={newCategory.name_th} onChange={(e) => setNewCategory({...newCategory, name_th: e.target.value})} className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black outline-none focus:border-blue-600 text-black placeholder:text-gray-400 shadow-inner" placeholder="ตัวอย่าง: ส้มตำ" />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl shadow-md transition active:scale-98 text-center font-black">
            ✨ ບັງຄັບສ້າງໝວດໝູ່ໃໝ່ລົງ Database
          </button>
        </form>

        <div className="mt-5 pt-4 border-t-2 border-dashed border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white text-gray-900 font-black border-b-2 border-gray-200">
                  <th className="p-3 w-[60px]">ລດ</th>
                  <th className="p-3">ລາວ</th>
                  <th className="p-3">English</th>
                  <th className="p-3">中文</th>
                  <th className="p-3">ไทย</th>
                  <th className="p-3 w-[110px] text-center">ສະຖານະ</th>
                  <th className="p-3 w-[100px] text-center">ຈັດການ</th>
                </tr>
              </thead>
              <tbody>
            {visibleCategories.map((cat, pageIndex) => (
              <tr key={cat.id} onClick={() => { setSelectedCategoryId(cat.id); setShowSalesDetails(true); }} className="border-b border-gray-200 font-black text-gray-950 hover:bg-white cursor-pointer transition">
                <td className="p-3 text-gray-500 font-mono">{(categoryPage - 1) * pageSize + pageIndex + 1}</td>
                <td className="p-3">{cat.name_lo || '-'}</td>
                <td className="p-3">{cat.name_en || '-'}</td>
                <td className="p-3">{cat.name_zh || '-'}</td>
                <td className="p-3">{cat.name_th || '-'}</td>
                <td className="p-3 text-center" onClick={(event) => event.stopPropagation()}>
                  <button type="button" onClick={() => handleToggleCategoryAvailability(cat)} className={`px-2 py-1 rounded-lg text-[10px] font-black border transition active:scale-95 ${cat.is_available === false ? 'bg-gray-100 text-gray-500 border-gray-300' : 'bg-emerald-50 text-emerald-700 border-emerald-300'}`}>
                    {cat.is_available === false ? '⚪ ປິດສະແດງ' : '🟢 ເປີດສະແດງ'}
                  </button>
                </td>
                <td className="p-3 text-center" onClick={(event) => event.stopPropagation()}>
                  <div className="flex items-center justify-center gap-2">
                    <button type="button" onClick={() => handleEditCategory(cat)} className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-1 text-lg transition active:scale-95" title="ແກ້ໄຂ" aria-label="ແກ້ໄຂ">✏️</button>
                    <button type="button" onClick={() => handleDeleteCategory(cat)} className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg p-1 text-lg transition active:scale-95" title="ລຶບ" aria-label="ລຶບ">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs font-black">
            <button type="button" disabled={categoryPage === 1} onClick={() => setCategoryPage(page => page - 1)} className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40">← ກ່ອນ</button>
            <span>ໜ້າ {categoryPage} / {categoryPageCount}</span>
            <button type="button" disabled={categoryPage >= categoryPageCount} onClick={() => setCategoryPage(page => page + 1)} className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40">ຕໍ່ໄປ →</button>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-black text-gray-700">
            <span>📊 ຈຳນວນໝວດໝູ່ທັງໝົດ</span>
            <span className="font-mono text-emerald-600">{categories.length.toLocaleString()} ໝວດໝູ່</span>
          </div>
        </div>
      </div>

      {/* ໂຊນຕາຕະລາງໂຕະບໍລິການ */}
      <div id="owner-tables" className="box-border w-full max-w-full overflow-hidden bg-gray-50 p-5 rounded-2xl shadow-sm border-2 border-gray-200 mb-8 text-gray-950 scroll-mt-24">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h3 className={`admin-section-heading admin-categories-heading text-sm font-black text-gray-900 flex items-center gap-2 ${activeSection === 'owner-tables' ? 'active' : ''}`}><Table2 size={17} className="text-blue-600" /> ໂຕະທັງໝົດ</h3>
          <div className="flex-1 min-w-[220px] max-w-[360px]">
            <input type="search" value={tableSearchTerm} onChange={(event) => setTableSearchTerm(event.target.value)} placeholder="🔎 ຄົ້ນຫາໂຕະ..." className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 font-black text-black outline-none focus:border-blue-500 text-xs" />
          </div>
          <button type="button" onClick={() => setAddTableModalOpen(true)} className="ml-auto shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3 py-2 rounded-xl shadow-md transition active:scale-95">➕ ເພີ່ມໂຕະ</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white text-gray-900 font-black border-b-2 border-gray-200">
                <th className="p-3 w-[60px]">ລດ</th>
                <th className="p-3 w-[140px]">ເລກໂຕະ</th>
                <th className="p-3">ຊື່ໂຕະ (ລາວ)</th>
                <th className="p-3">English</th>
                <th className="p-3">中文</th>
                <th className="p-3">ไทย</th>
                <th className="p-3 w-[140px] text-center">ສະຖານະ</th>
                <th className="p-3 w-[110px] text-center">ຈັດການ</th>
              </tr>
            </thead>
            <tbody>
              {filteredTables.map((table, index) => (
                <tr key={table.id || table.table_number || index} className="border-b border-gray-200 font-black text-gray-950 hover:bg-white transition">
                  <td className="p-3 text-gray-500 font-mono">{index + 1}</td>
                  <td className="p-3 font-mono">#{table.table_number}</td>
                  <td className="p-3">{table.name_lo || `ໂຕະ #${table.table_number}`}</td>
                  <td className="p-3">{table.name_en || '-'}</td>
                  <td className="p-3">{table.name_zh || '-'}</td>
                  <td className="p-3">{table.name_th || '-'}</td>
                  <td className="p-3 text-center">
                    <button type="button" onClick={() => handleToggleTableAvailability(table)} className={`rounded-lg border px-2 py-1 text-[10px] font-black transition active:scale-95 ${table.is_available === false ? 'border-gray-300 bg-gray-100 text-gray-500' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}`}>
                      {table.is_available === false ? '⚪ ປິດໃຊ້ງານ' : '🟢 ເປີດໃຊ້ງານ'}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button type="button" onClick={() => handleEditTable(table)} className="text-blue-600 hover:text-blue-800 text-lg transition active:scale-95" title="ແກ້ໄຂ" aria-label="ແກ້ໄຂ">✏️</button>
                      <button type="button" onClick={() => handleDeleteTable(table)} className="text-red-600 hover:text-red-800 text-lg transition active:scale-95" title="ລຶບ" aria-label="ລຶບ">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTables.length === 0 && <p className="py-4 text-center text-xs font-bold text-gray-500">ບໍ່ພົບໂຕະ</p>}
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-black text-gray-700">
          <span>📊 ຈຳນວນໂຕະທັງໝົດ</span>
          <span className="font-mono text-yellow-700">{tables.length.toLocaleString()} ໂຕະ</span>
        </div>
        
      </div>

      <div id="owner-staff" className="box-border w-full max-w-full overflow-hidden bg-gray-50 p-5 rounded-2xl shadow-sm border-2 border-gray-200 mb-8 text-gray-950 scroll-mt-24">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h3 className={`admin-section-heading admin-categories-heading text-sm font-black text-gray-900 flex items-center gap-2 ${activeSection === 'owner-staff' ? 'active' : ''}`}><Users size={17} className="text-blue-600" /> ພະນັກງານ</h3>
          <div className="flex-1 min-w-[220px] max-w-[360px]"><input type="search" value={staffSearchTerm} onChange={(event) => setStaffSearchTerm(event.target.value)} placeholder="🔎 ຄົ້ນຫາພະນັກງານ..." className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-2.5 font-black text-black outline-none focus:border-blue-500 text-xs" /></div>
          <button type="button" onClick={() => setAddStaffModalOpen(true)} className="ml-auto shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3 py-2 rounded-xl shadow-md transition active:scale-95">➕ ເພີ່ມພະນັກງານ</button>
        </div>
        <div className="overflow-x-auto"><table className="w-full table-fixed text-left text-xs border-collapse">
          <thead><tr className="bg-gray-100 text-gray-900 font-black border-b-2 border-gray-200"><th className="p-3 w-[6%]">ລດ</th><th className="p-3 w-[20%]">ຊື່ພະນັກງານ</th><th className="p-3 w-[22%]">Email</th><th className="p-3 w-[16%]">ເບີໂທ</th><th className="p-3 w-[14%]">ສິດ</th><th className="p-3 w-[12%]">ລະຫັດ PIN</th><th className="p-3 w-[10%] text-center">ຈັດການ</th></tr></thead>
          <tbody>{filteredStaffs.map((staff, index) => { const role = getStaffRole(staff); return <tr key={staff.id || staff.phone_number || index} className="border-b border-gray-200 font-black text-gray-950 hover:bg-gray-50 transition"><td className="p-3 text-gray-500 font-mono">{index + 1}</td><td className="p-3 truncate">{staff.name || `Staff #${staff.id}`}</td><td className="p-3 truncate text-[10px]">{staff.email || '-'}</td><td className="p-3 truncate font-mono">{staff.phone_number || '-'}</td><td className="p-3"><span className={`inline-block rounded-lg border px-2 py-1 text-[10px] ${role === 'owner' ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-blue-300 bg-blue-50 text-blue-700'}`}>{role === 'owner' ? '👑 Owner' : '👤 Staff'}</span></td><td className="p-3 font-mono"><div className="flex items-center gap-2"><span className="truncate">{visibleStaffPins[staff.id] ? (staff.pin_code || '-') : '••••'}</span><button type="button" onClick={() => setVisibleStaffPins(current => ({ ...current, [staff.id]: !current[staff.id] }))} className="shrink-0 text-blue-600 hover:text-blue-800" aria-label="ສະແດງ/ເຊື່ອງ PIN">{visibleStaffPins[staff.id] ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></td><td className="p-3 text-center"><div className="flex items-center justify-center gap-2"><button type="button" onClick={() => handleEditStaff(staff)} className="text-blue-600 text-lg" aria-label="ແກ້ໄຂ">✏️</button><button type="button" onClick={() => handleDeleteStaff(staff)} className="text-red-600 text-lg" aria-label="ລຶບ">🗑️</button></div></td></tr>; })}</tbody>
        </table></div>
        {filteredStaffs.length === 0 && <p className="py-4 text-center text-xs font-bold text-gray-500">ບໍ່ພົບພະນັກງານ</p>}
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-black text-gray-700"><span>📊 ຈຳນວນພະນັກງານທັງໝົດ</span><span className="font-mono text-yellow-700">{staffs.length.toLocaleString()} ຄົນ</span></div>
      </div>

      {/* 📋 💵 ໂຊນທີ 3: ຕາຕະລາງລາຍການເມນູ - ເລັ່ງຕົວໜັງສືຕາຕະລາງໃຫ້ດຳເຂັ້ມຈັດແຈ້ງຊັດເຈນ */}
      <div id="owner-menus" className="bg-white p-5 rounded-2xl shadow-md border-2 border-gray-200 text-gray-950 scroll-mt-24">
        <div className="menu-heading-row flex flex-wrap lg:flex-nowrap items-center gap-3 mb-4">
          <h3 className={`admin-section-heading admin-menus-heading text-sm font-black text-gray-900 flex items-center gap-2 ${activeSection === 'owner-menus' ? 'active' : ''}`}><ShoppingBag size={17} className="text-orange-600" /> ລາຍການເມນູ ແລະ ປັບປຸງລາຄາຂາຍ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-2 flex-1 min-w-[280px] max-w-[560px]">
            <input
              type="search"
              value={menuTableSearchTerm}
              onChange={(e) => { setMenuTableSearchTerm(e.target.value); setMenuPage(1); }}
              placeholder="🔎 ຄົ້ນຫາລາຍການ, ໝວດ ຫຼື ລາຄາ..."
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-2.5 font-black text-black outline-none focus:border-orange-500 text-xs"
            />
            <select value={menuTableCategoryId} onChange={(e) => { setMenuTableCategoryId(e.target.value); setMenuPage(1); }} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-2.5 font-black text-black outline-none focus:border-orange-500 text-xs">
              <option value="">📁 ທຸກໝວດໝູ່</option>
              {categories.map(category => <option key={category.id} value={String(category.id)}>{category.name_lo || category.name_en || category.name_zh || category.name_th}</option>)}
            </select>
          </div>
          <button type="button" onClick={() => setAddMenuModalOpen(true)} className="ml-auto shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3 py-2 rounded-xl shadow-md transition active:scale-95">➕ ເພີ່ມລາຍການ</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-900 font-black border-b-2 border-gray-200">
                <th className="p-3 w-[60px] text-sm">ລດ</th>
                <th className="p-3 w-[76px] text-sm">ຮູບ</th>
                <th className="p-3 text-sm">ຊື່ເມນູອາຫານ (ລາວ / English)</th>
                <th className="p-3 w-[150px] text-sm">ໝວດໝູ່</th>
                <th className="p-3 w-[220px] text-right text-sm">ລາຄາຂາຍປັດຈຸບັນ</th>
                <th className="p-3 w-[110px] text-center text-sm">ສະຖານະ</th>
                <th className="p-3 w-[90px] text-center text-sm">ຈັດການ</th>
              </tr>
            </thead>
            <tbody>
              {filteredMenuRows.slice((menuPage - 1) * pageSize, menuPage * pageSize).map((menu, index) => {
                return (
                <tr key={menu.id} className="border-b border-gray-200 font-black text-gray-950 hover:bg-gray-50 transition duration-150">
                  <td className="p-3 text-gray-500 font-mono font-black">{(menuPage - 1) * pageSize + index + 1}</td>
                  <td className="p-3">
                    {menu.image_url ? <img src={menu.image_url} alt={menu.name_lo || 'Menu'} className="h-12 w-12 rounded-lg object-cover border border-gray-200" /> : <span className="text-gray-400 text-lg">🍲</span>}
                  </td>
                  <td className="p-3">
                    <p className="text-gray-950 font-black text-sm leading-snug">{menu.name_lo || '🍲 ອາຫານ'}</p>
                    {menu.name_en && <p className="text-[11px] text-gray-500 font-black font-sans mt-0.5">{menu.name_en}</p>}
                  </td>
                  <td className="p-3">
                    {(() => {
                      const matchedCat = categories.find(c => String(c.id) === String(menu.category_id));
                      return (
                        <span className="bg-gray-100 text-gray-900 border-2 border-gray-200 px-2.5 py-1 rounded-xl text-[10px] font-black shadow-sm">
                          📁 {matchedCat ? matchedCat.name_lo : `ໝວດ #${menu.category_id}`}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="p-3 text-right">
                    {editingPriceId === menu.id ? (
                      /* ໂໝດແກ້ໄຂລາຄາ */
                      <div className="flex items-center justify-end gap-1.5 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <input type="number" value={newPriceValue} onChange={(e) => setNewPriceValue(e.target.value)} className="w-24 bg-white border-2 border-orange-500 rounded-lg p-1 text-right font-mono font-black text-black outline-none" placeholder="ລາຄາໃໝ່" autoFocus />
                        <button type="button" onClick={() => handleUpdatePrice(menu.id)} className="bg-emerald-600 text-white font-black px-2 py-1 rounded-lg text-[10px] active:scale-95 transition">ເຊຟ</button>
                        <button type="button" onClick={() => setEditingPriceId(null)} className="bg-gray-100 text-gray-500 font-black px-2 py-1 rounded-lg text-[10px] active:scale-95 transition">❌</button>
                      </div>
                    ) : (
                      /* ໂໝດສະແດງຜົນລາຄາ */
                      <div className="flex items-center justify-end gap-2 group">
                        <span className="font-mono font-black text-gray-900 text-sm tracking-tight">
                          {(menu.price || 0).toLocaleString()} K
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button type="button" onClick={() => handleToggleMenuAvailability(menu)} className={`px-2 py-1 rounded-lg text-[10px] font-black border transition active:scale-95 ${menu.is_available === false ? 'bg-gray-100 text-gray-500 border-gray-300' : 'bg-emerald-50 text-emerald-700 border-emerald-300'}`} title={menu.is_available === false ? 'ເປີດສະແດງ' : 'ປິດສະແດງ'}>
                      {menu.is_available === false ? '⚪ ປິດສະແດງ' : '🟢 ເປີດສະແດງ'}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button type="button" onClick={() => handleSelectMenuForEdit(String(menu.id))} className="text-blue-600 hover:text-blue-800 text-lg transition active:scale-95" title="ແກ້ໄຂ" aria-label="ແກ້ໄຂ">✏️</button>
                      <button type="button" onClick={() => handleDeleteMenu(menu)} className="text-red-600 hover:text-red-800 text-lg transition active:scale-95" title="ລຶບ" aria-label="ລຶບ">🗑️</button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs font-black">
          <button type="button" disabled={menuPage === 1} onClick={() => setMenuPage(page => page - 1)} className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40">← ກ່ອນ</button>
          <span>ໜ້າ {menuPage} / {menuPageCount}</span>
          <button type="button" disabled={menuPage >= menuPageCount} onClick={() => setMenuPage(page => page + 1)} className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40">ຕໍ່ໄປ →</button>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-black text-gray-700">
          <span>📊 ຈຳນວນລາຍການທັງໝົດ</span>
          <span className="font-mono text-orange-600">{menus.length.toLocaleString()} ເມນູ</span>
        </div>
        

      </div>
      </div>
    
    </>
  );
}
