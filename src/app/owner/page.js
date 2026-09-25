'use client'; 

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js'; 
import { Bell, Boxes, ChevronRight, Eye, EyeOff, LayoutDashboard, LogOut, Menu, Search, Settings2, ShoppingBag, Store, Table2, Users, X } from 'lucide-react';
import TableQRCodeGenerator from '@/components/TableQRCodeGenerator';
import RowTableQRCode from '@/components/RowTableQRCode';
import SalesAnalyticsChart from '@/components/SalesAnalyticsChart';

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

function resolveOwnerApiUrl(url) {
  if (!url || /^https?:\/\//i.test(url)) return url;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
}

async function ownerApiFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(options.headers || {});
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  return fetch(resolveOwnerApiUrl(url), { cache: 'no-store', ...options, headers });
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
const [orders, setOrders] = useState([]);
const [staffs, setStaffs] = useState([]);
const pendingStaffRolesRef = useRef({});
const [posCart, setPosCart] = useState({});
  // 🎯 [ຕົວແປໃໝ່]: ເກັບຈຳນວນເງິນສົດທີ່ຮັບມາຈາກລູກຄ້າ ເພື່ອເອົາໄປຄຳນວນເງິນທອນໂອໂຕ້
  const [cashReceived, setCashReceived] = useState('');
  

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

  // 🎯 [ສູດເປີດທໍ່ສັນຍານ Real-time 100%]: ດັກຈັບຕາຕະລາງ orders ຫາກມີອໍເດີ້ໃໝ່ ໃຫ້ດີດຕົວເລກ ແລະ ກຣາຟຍືດຂຶ້ນໂອໂຕ້ ໂດຍບໍ່ຕ້ອງ Refresh
  // 🎯 [ສູດປິດບັກພະນັກງານ 0 ຄົນ + Real-time 100%]: ບັງຄັບດຶງຂໍ້ມູນຕາຕະລາງ staffs ແລະ ເປີດທໍ່ດັກຈັບສັນຍານ Real-time ຈາກ Supabase ໂອໂຕ້
  useEffect(() => {
    let mounted = true;

    const loadDashboardDataWithIP = async () => {
      try {
        console.log('🚀 Loading live data grid through server-side internal API proxy loop...');
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        const res = await fetch(`${currentOrigin}/api/customer-data?table_id=all`);
        
        if (!res.ok) throw new Error('Network API pipeline error');
        const data = await res.json();

        if (!mounted) return;

        // 📥 normalization layer ຝັງຄ່າລົງ State ຫຼັກ [Part 254]
        const tablesList = data.tables || [];
        const categoriesList = data.categories || [];
        const menusList = data.menus || [];
        const ordersList = data.orders || [];

        // ➕ [🎯 ຈຸດແກ້ໄຂສະເພາະຈຸດ]: ບັງຄັບດຶງຂໍ້ມູນພະນັກງານສົດໆ ຈາກຕາຕະລາງ staffs ຂອງ Supabase ໂດຍກົງ ປິດບັກເລກ 0 [Part 254]
        const { data: staffsData } = await supabase.from('staffs').select('*').order('name', { ascending: true });

        setTables(tablesList);
        setCategories(categoriesList);
        if (typeof setMenus === 'function') setMenus(menusList);
        setOrders(ordersList); // ຍັດຄ່າອໍເດີ້ [Part 254]
        
        // 📥 ຍັດຄ່າລາຍຊື່ພະນັກງານຕົວຈິງລົງ State [Part 254]
        if (staffsData) setStaffs(staffsData);

        // ຄໍານວນສະຫຼຸບຍອດຂາຍລວມສົດໆ [Part 254]
        const totalRevenue = ordersList.reduce((sum, order) => sum + Number(order.total_price || order.total_revenue || 0), 0);

        setSummary({
          totalOrdersCount: ordersList.length,
          totalRevenue: totalRevenue,
          totalTablesCount: tablesList.length,
          totalMenusCount: menusList.length,
          // ບັງຄັບຜູກຄ່າຈຳນວນພະນັກງານຕົວຈິງ ໃສ່ກ່ອງສະຖິຕິ [Part 254]
          totalStaffsCount: staffsData?.length || 0 
        });

        setAuthChecking(false);

      } catch (err) {
        console.error('Bypass IP Data Loading Error:', err);
        setAuthChecking(false);
      }
    };

    // ລັນໂຫລດຂໍ້ມູນຮອບທຳອິດຕອນເປີດໜ້າຈໍ [Part 254]
    loadDashboardDataWithIP();

    // 🔥 ເປີດລະບົບ Real-time ເຝົ້າດັກຈັບຕາຕະລາງ orders ຫຼັງບ້ານ [Part 254]
    const ordersChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('🔔 Detection: ມີການອັບເດດຂໍ້ມູນອໍເດີ້ໃນຕາຕະລາງ orders ໂອໂຕ້!', payload);
          loadDashboardDataWithIP(); // ບັງຄັບອັບເດດໜ້າຈໍ ແລະ ແທ່ງກຣາຟທັນທີ [Part 254]
        }
      )
      .subscribe();

    return () => { 
      mounted = false; 
      supabase.removeChannel(ordersChannel); // ປິດທໍ່ສັນຍານຄວາມປອດໄພ [Part 254]
    };
  }, [router]);

const fetchOwnerData = useCallback(async () => {
try {
const origin = typeof window !== 'undefined' ? window.location.origin : '';
const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalNetwork = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname.startsWith('192.168.') || hostname.startsWith('10.');

const res = await ownerApiFetch(`${origin}/api/owner-data`);
let json = {};

if (res.status === 401 && !isLocalNetwork) {
  setOwnerAccessLost(true);
  setError(null);
  return;
}

if (res.ok) {
  json = await res.json().catch(() => ({}));
}

if (!json.success) {
  const publicRes = await fetch(`${origin}/api/customer-data?table_id=all`, { cache: 'no-store' });
  if (!publicRes.ok) {
    const errorJson = await publicRes.json().catch(() => ({}));
    throw new Error(errorJson.error || `Server responded with status: ${publicRes.status}`);
  }
  json = await publicRes.json();
  json.success = true;
}

if (json.success) {
const fetchedMenus = json.menus || json.menuItems || [];
const fetchedTables = json.tables || [];
const fetchedCategories = json.categories || [];
const fetchedOrders = json.orders || [];
setMenus(fetchedMenus);
setTables(fetchedTables);
setOrders(ordersList);
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
if (Array.isArray(json.staffs)) setStaffs(refreshedStaffs);
setCategories(fetchedCategories); 
if (json.restaurant !== undefined) {
  setRestaurant(json.restaurant || null);
  setRestaurantDraft({ logo_url: json.restaurant?.logo_url || '', qr_url: json.restaurant?.qr_url || '', name_lo: json.restaurant?.name_lo || '', name_en: json.restaurant?.name_en || '', name_zh: json.restaurant?.name_zh || '', name_th: json.restaurant?.name_th || '' });
}

if (fetchedCategories.length > 0 && !newMenu.category_id) {
  setNewMenu(prev => ({ ...prev, category_id: String(fetchedCategories[0].id) }));
}

const allItems = json.orderItems || json.order_items || json.salesItems || [];
const completedItems = (allItems || []).filter(i => i.item_status === 'completed' || i.item_status === 'served');
setSalesItems(completedItems);

let foodSales = 0; let drinkSales = 0; let foodQty = 0; let drinkQty = 0;
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

const orderRevenue = fetchedOrders.reduce((sum, order) => sum + Number(order.total_revenue || order.total_price || 0), 0);
const totalRevenue = json.summary?.totalRevenue || orderRevenue || (foodSales + drinkSales);

setSummary({
  totalRevenue: totalRevenue,
  totalOrdersCount: json.summary?.totalOrdersCount || fetchedOrders.length || allItems.length || 0,
  totalMenusCount: json.summary?.totalMenusCount || fetchedMenus.length,
  totalTablesCount: json.summary?.totalTablesCount || fetchedTables.length,
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
          {/* 🎛️ 1. [ຈຸດແກ້ໄຂ Sidebar ດ້ານຊ້າຍ]: ເພີ່ມເມນູ "ຂາຍເຄື່ອງ" ໃຫ້ສະຫຼັບໜ້າຈໍພາຍໃນກອບຫຼັກເປ໊ະ 100% */}
          {/* 🎛️ [ຂັ້ນຕອນທີ 1]: ປັບແຖບເມນູດ້ານຊ້າຍ ໃຫ້ສະແດງເມນູ ຂາຍເຄື່ອງ (POS) ຢ່າງສົມບູນແບບ */}
          <nav className="admin-nav space-y-2 text-sm font-black">
            <a href="#owner-overview" onClick={() => { setActiveSection('owner-overview'); setSidebarOpen(false); }} className={activeSection === 'owner-overview' ? 'active' : ''}><LayoutDashboard size={17} /> ພາບລວມ<ChevronRight size={15} /></a>
            <a href="#owner-categories" onClick={() => { setActiveSection('owner-categories'); setSidebarOpen(false); }} className={activeSection === 'owner-categories' ? 'active' : ''}><Boxes size={17} /> ໝວດໝູ່ <ChevronRight size={15} /></a>
            <a href="#owner-menus" onClick={() => { setActiveSection('owner-menus'); setSidebarOpen(false); }} className={activeSection === 'owner-menus' ? 'active' : ''}><ShoppingBag size={17} /> ເມນູທັງໝົດ <ChevronRight size={15} /></a>
            <a href="#owner-tables" onClick={() => { setActiveSection('owner-tables'); setSidebarOpen(false); }} className={activeSection === 'owner-tables' ? 'active' : ''}><Table2 size={17} /> ໂຕະທັງໝົດ <ChevronRight size={15} /></a>
            <a href="#owner-staff" onClick={() => { setActiveSection('owner-staff'); setSidebarOpen(false); }} className={activeSection === 'owner-staff' ? 'active' : ''}><Users size={17} /> ພະນັກງານ <ChevronRight size={15} /></a>
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
          <a href="#owner-pos" onClick={() => setActiveSection('owner-pos')} className={activeSection === 'owner-pos' ? 'active !bg-emerald-600 !text-white' : '!text-emerald-600 hover:bg-emerald-50'}><ShoppingBag size={17} /><span className="desktop-sidebar-copy">ຂາຍເຄື່ອງ (POS) 🌟</span><ChevronRight size={15} /></a>
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

 {/*<TableQRCodeGenerator currentNetlifyUrl="https://mairtr-qr-app.netlify.app/" /> 
 <TableQRCodeGenerator />*/}
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
      {/* 🎯 [ຈຸດປິດບັກໄລຍະຫ່າງລະຫວ່າງ ກຣາຟ ແລະ POS 100%]: ປ່ຽນຈາກ mb-6 ໃຫ້ກາຍເປັນ mb-0 ເພື່ອດຶງໃຫ້ໜ້າ POS ຂຍັບຂຶ້ນມາໃກ້ກຣາຟທັນທີ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-0 text-gray-950">
        <div className="col-span-2 md:col-span-5 w-full">
          <SalesAnalyticsChart orders={orders} />
        </div>
      </div>

      {/* 🛒 ບຼັອກໜ້າຈໍ ຂາຍເຄື່ອງ (POS System) ຕົວເກົ່າຂອງທ່ານ ປັບ mt-1 ໃຫ້ເຂົ້າມາໃກ້ຊິດເປະ */}
      {activeSection === 'owner-pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn text-gray-950 w-full clear-both mt-0 mb-8">

          {/* 🍔 ຝັ່ງລາຍການເມນູອາຫານ (2 ຖັນ) - ເວີຊັນປຸ່ມໄອຄອນສີ່ແຈເມັດຈ້ຳ ສະຫຼັບກາດໃຫຍ່ / ຫຼາຍແຖວນ້ອຍລົງ 100% [Part 275, Part 276] */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="border-b border-gray-100 pb-4 mb-4">
                
                {/* 🎯 [ຈັດ Layout ຫົວຂໍ້]: ປ່ຽນປຸ່ມກົດໃຫ້ກາຍເປັນ ປຸ່ມໄອຄອນສີ່ແຈເມັດຈ້ຳ ສວຍງາມ Premium [Part 276] */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">🛒 ລາຍການເມນູອາຫານຂາຍໜ້າຮ້ານ</h3>
                  </div>
                  
                  {/* 🔎 ຊ່ອງຄົ້ນຫາຊື່ເມນູອາຫານ [Part 275] */}
                  <div className="w-full sm:w-48">
                    <input 
                      type="search" 
                      value={menuSearchTerm || ''} 
                      onChange={(e) => typeof setMenuSearchTerm === 'function' ? setMenuSearchTerm(e.target.value) : setTableSearchTerm(e.target.value)} 
                      placeholder="🔎 ພິມຄົ້ນຫາຊື່ເມນູອາຫານ..." 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-[11px] font-black outline-none focus:border-orange-500 font-bold shadow-sm" 
                    />
                  </div>

                  <div className="flex items-center gap-2 ml-auto shrink-0">
                    
                    {/* 🎛️ [🎯 ປ່ຽນເປັນປຸ່ມໄອຄອນສີ່ແຈເມັດຈ້ຳ 2 ໂໝດ]: ດີດສະແດງຮູບເມັດຈ້ຳສີ່ແຈ ເພື່ອສະຫຼັບກາດໃຫຍ່ / ຫຼາຍແຖວນ້ອຍລົງ [Part 276] */}
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof globalThis.__globalPosViewMode === 'undefined') {
                          globalThis.__globalPosViewMode = 'grid';
                        }
                        globalThis.__globalPosViewMode = globalThis.__globalPosViewMode === 'grid' ? 'list' : 'grid';
                        // ບັງຄັບໃຫ້ລະບົບ Next.js 16 Fast Refresh ແຕ້ມໂຄງສ້າງໃໝ່ [Part 276]
                        setActiveSection('owner-overview');
                        setTimeout(() => setActiveSection('owner-pos'), 10);
                      }}
                      className={`p-2 rounded-xl border shadow-sm transition active:scale-95 flex items-center justify-center gap-1 ${typeof globalThis.__globalPosViewMode === 'undefined' || globalThis.__globalPosViewMode === 'grid' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}
                      title="ສະຫຼັບມຸມມອງ (ກາດໃຫຍ່ / ຫຼາຍແຖວນ້ອຍລົງ)"
                    >
                      {typeof globalThis.__globalPosViewMode === 'undefined' || globalThis.__globalPosViewMode === 'grid' ? (
                        // 🎛️ ຮູບເມັດຈ້ຳ 4 ແຈໃຫຍ່ (Grid 2 ຖັນ)
                        <div className="grid grid-cols-2 gap-0.5 w-4 h-4 p-0.5">
                          <div className="bg-current rounded-sm"></div>
                          <div className="bg-current rounded-sm"></div>
                          <div className="bg-current rounded-sm"></div>
                          <div className="bg-current rounded-sm"></div>
                        </div>
                      ) : (
                        // 📋 ຮູບເມັດຈ້ຳຫຼາຍແຖວລຽນກັນ (List View 1 ຖັນ)
                        <div className="flex flex-col gap-0.5 w-4 h-4 justify-center p-0.5">
                          <div className="bg-current h-1 rounded-sm w-full"></div>
                          <div className="bg-current h-1 rounded-sm w-full"></div>
                          <div className="bg-current h-1 rounded-sm w-full"></div>
                        </div>
                      )}
                      <span className="text-[10px] font-black font-sans px-0.5">
                        {typeof globalThis.__globalPosViewMode === 'undefined' || globalThis.__globalPosViewMode === 'grid' ? 'ກາດໃຫຍ່' : 'ລາຍຊື່'}
                      </span>
                    </button>

                    {/* ປຸ່ມເພີ່ມລາຍການອາຫານ [Part 275] */}
                    <button type="button" onClick={() => setAddMenuModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3 py-2 rounded-xl shadow-md transition active:scale-95">➕ ເພີ່ມລາຍການ</button>
                  </div>
                </div>

                {/* 🗂️ ແຖບໝວດໝູ່ອາຫານ ຄືໜ້າລູກຄ້າ [Part 275] */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none text-[11px] font-black mt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(null)}
                    className={`px-3 py-1.5 rounded-xl border transition whitespace-nowrap ${selectedCategoryId === null ? 'bg-orange-600 text-white border-orange-700 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200/80 hover:bg-gray-100'}`}
                  >
                    🍽️ ທັງໝົດ
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`px-3 py-1.5 rounded-xl border transition whitespace-nowrap ${selectedCategoryId === cat.id ? 'bg-orange-600 text-white border-orange-700 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200/80 hover:bg-gray-100'}`}
                    >
                      {cat.name_lo}
                    </button>
                  ))}
                </div>
              </div>

              {/* 🍔 Grid ລາຍການເມນູອາຫານ ພ້ອມລະບົບສະຫຼັບມຸມມອງ Dynamic 4 ຖັນເຕັມຕາ Premium [Part 277] */}
              {menus.length === 0 ? (
                <p className="text-center py-12 text-xs font-bold text-gray-400">📋 ບໍ່ພົບລາຍການເມນູອາຫານໃນລະບົບ</p>
              ) : (
                <div 
                  style={{
                    display: 'grid',
                    gap: '12px',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    paddingRight: '4px',
                    gridTemplateColumns: globalThis.__globalPosViewMode === 'list' 
                      ? 'repeat(1, minmax(0, 1fr))' 
                      : `repeat(${typeof globalThis.__globalPosCols === 'undefined' ? 5 : globalThis.__globalPosCols}, minmax(0, 1fr))`
                  }}
                  className="w-full text-gray-950 clear-both"
                >
                  {menus
                    .filter((item) => {
                      const matchCategory = selectedCategoryId === null || Number(item.category_id) === Number(selectedCategoryId);
                      const search = (menuSearchTerm || '').toLowerCase();
                      return matchCategory && (!search || (item.name_lo && item.name_lo.toLowerCase().includes(search)) || (item.name_en && item.name_en.toLowerCase().includes(search)));
                    })
                    .map((item) => {
                      const cartQty = posCart?.[item.id] || 0;
                      const finalImageUrl = item.image_url || item.image || 'https://unsplash.com';
                      const isListView = globalThis.__globalPosViewMode === 'list';
                      return (
                        /* 🎯 [ໂຄງສ້າງປິດບັກຫຼັກ 100%]: ຈັດກອບກາດອາຫານໃໝ່ ໃຫ້ກົດງ່າຍ, ປອດໄພ, ບໍ່ມີ layer ບັງຊ້ອນກັນ */
                        <div 
                          key={item.id} 
                          onClick={() => setPosCart(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                          /* 🎯 [ຈຸດປິດບັກຕົວແປຫຼົ້ມ 100%]: ຫຼຸດພົ້ນຈາກບັກຊື່ຕົວແປຫຼົ້ມ ໂດຍບັງຄັບໃຊ້ isListView ກວດສອບໂໝດມຸມມອງຢ່າງຖືກຕ້ອງ */
                          className={`bg-gray-50 border rounded-2xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/20 transition relative flex select-none shadow-sm ${cartQty > 0 ? 'border-emerald-500 bg-emerald-50/10' : 'border-gray-200/80'} ${isListView ? 'flex-row items-center p-2 min-h-[60px]' : 'flex-col overflow-hidden min-h-[220px]'}`}
                        >

                          {/* 🎈 ປ້າຍບອກຈຳນວນສິນຄ້າໃນຕະກ້າ [Part 285] */}
                          {cartQty > 0 && (
                            <span className={`absolute bg-emerald-600 text-white font-mono font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-white shadow-md z-10 ${isListView ? 'top-1.5 left-1.5' : 'top-2 right-2'}`}>
                              {cartQty}
                            </span>
                          )}

                          {/* 📸 ກ່ອງສະແດງຮູບພາບອາຫານ [Part 285] */}
                          <div className={`bg-gray-100 overflow-hidden relative shrink-0 border-gray-100 ${isListView ? 'w-12 h-12 rounded-xl border' : 'w-full h-36 border-b'}`}>
                            <img src={finalImageUrl} alt={item.name_lo} className="w-full h-full object-cover" loading="lazy" />
                          </div>

                          {/* 🏷️ ໂຊນລາຍລະອຽດຂໍ້ຄວາມ ແລະ [🎯 ຍົກຍ້າຍລາຄາມາວາງດ້ານຊ້າຍທາງລຸ່ມ] */}
                          <div className={`p-2.5 flex flex-col justify-between flex-1 w-full relative ${isListView ? '!flex-row !items-center !gap-2' : ''}`}>
                            <div className="min-w-0 flex-1">
                              <h4 className={`font-black text-gray-900 leading-tight truncate ${isListView ? 'text-xs' : 'text-sm line-clamp-2'}`}>{item.name_lo}</h4>
                              {!isListView && <p className="text-[10px] font-bold text-gray-400 mt-0.5 truncate">{item.name_en || '-'}</p>}
                            </div>
                            
                            {/* 🎯 ໂຊນລຸ່ມສຸດ: ຍ້າຍລາຄາມາຢູ່ດ້ານຊ້າຍ ແລະ ເອົາປຸ່ມແກ້ໄຂມາຂ້າງໆກັນ ປ້ອງກັນບັກຕຳກັນ */}
                            <div className={`flex items-center justify-between mt-2 pt-2 border-t border-gray-100/60 w-full ${isListView ? '!mt-0 !pt-0 !border-0 !justify-end !gap-4' : ''}`}>
                              {/* 🟢 ລາຄາວາງທາງດ້ານຊ້າຍທາງລຸ່ມ ຕາມທີ່ທ່ານຕ້ອງການຊັດເຈນ 100% */}
                              <p className="font-black text-emerald-600 font-mono text-left text-sm shrink-0">
                                {(Number(item.price) || 0).toLocaleString()} ₭
                              </p>

                              {/* ✏️ ປຸ່ມແກ້ໄຂຍ້າຍມາຢູ່ໃນກອບ Flexbox ປອດໄພ 100% ກົດຕິດທັນທີ ໂດຍບໍ່ຫຼົ້ມ */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation(); // 🔒 ບັງຄັບຢຸດການເຮັດວຽກບໍ່ໃຫ້ແລ່ນລົງຕະກ້າ [Part 287]
                                  setEditingMenu({ ...item }); // ເປີດ Modal ປັອບອັບແກ້ໄຂ [Part 287]
                                }}
                                className="bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 shadow-sm transition rounded-xl font-black active:scale-90 px-2.5 py-1 text-[10px] shrink-0 cursor-pointer flex items-center justify-center"
                                title="✏️ ຄລິກເພື່ອແກ້ໄຂ"
                              >
                                ✏️ ແກ້ໄຂ
                              </button>
                            </div>
                          </div>

                        </div>
                      );

                    })}
                </div>
              )}

            </div>
          </div>

            {/* 📋 ຝັ່ງຕະກ້າຄິດເງິນ POS (1 ຖັນ) - ເວີຊັນປັບຕົວໜັງສືໃຫຍ່ ໜາ ເຂັ້ມ ເຫັນແຈ້ງ 100% [10] */}
            <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100 flex flex-col justify-between min-h-[50vh] text-gray-950">
              <div>
                {/* ໂຊນຫົວຂໍ້ ພ້ອມປຸ່ມລຶບທັງໝົດ (ຕົວໜັງສືໃຫຍ່ຂຶ້ນ) [10] */}
                <div className="flex items-center justify-between border-b-2 border-gray-100 pb-3 mb-4">
                  <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">📋 ຕະກ້າ POS</h3>
                  {Object.keys(posCart || {}).filter(id => posCart[id] > 0).length > 0 && (
                    <button 
                      type="button" 
                      onClick={() => { if (confirm('🧹 ທ່ານຕ້ອງການລຶບລາຍການອາຫານທັງໝົດອອກຈາກຕະກ້າແທ້ຫຼືບໍ່?')) setPosCart({}); setCashReceived(''); }}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black text-xs px-3 py-1.5 rounded-xl transition active:scale-95"
                    >
                      🗑️ ລຶບທັງໝົດ
                    </button>
                  )}
                </div>

                {/* ບັນຊີລາຍການສິນຄ້າໃນຕະກ້າ (ປັບຕົວໜັງສືໃຫຍ່ text-sm & text-base) [10] */}
                {Object.keys(posCart || {}).filter(id => posCart[id] > 0).length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <p className="text-4xl mb-2">🛒</p>
                    <p className="text-sm font-black">ຕະກ້າຫວ່າງເປົ່າ</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[32vh] overflow-y-auto pr-1">
                    {Object.entries(posCart).map(([id, qty]) => {
                      if (qty <= 0) return null;
                      const item = menus.find(m => String(m.id) === String(id));
                      if (!item) return null;
                      return (
                        <div key={id} className="flex items-center justify-between gap-2 bg-gray-50 p-3 rounded-2xl text-sm font-black text-gray-900 border border-gray-200/60 shadow-sm animate-fadeIn">
                          {/* 🏷️ ໑. ຝັ່ງຊື່ເມນູອາຫານ ແລະ ລາຄາຕົ້ນທຶນ [Part 284] */}
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-gray-900 truncate text-[13px]">{item.name_lo}</p>
                            <p className="text-xs text-gray-400 font-mono font-bold mt-0.5">{(Number(item.price) || 0).toLocaleString()} ₭</p>
                          </div>
                          
                          {/* 🎛️ ໒. [ຈຸດແກ້ໄຂຊ່ອງຕົວເລກກາງ]: ປ່ຽນເປັນຊ່ອງ input ໃຫ້ຄລິກພິມຕົວເລກໄດ້ໂດຍຕົງ ພ້ອມປຸ່ມ - + */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button type="button" onClick={() => setPosCart(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }))} className="w-6 h-6 bg-white border border-gray-300 rounded-lg flex items-center justify-center text-sm font-black text-gray-700 shadow-sm active:bg-gray-100">-</button>
                            
                            {/* 📥 ຊ່ອງພິມຕົວເລກກາງອັດສະລິຍະ ບັງຄັບຮັບແຕ່ຕົວເລກສາກົນ 1, 2, 3 */}
                            <input 
                              type="text"
                              inputMode="numeric"
                              value={qty}
                              onChange={(e) => {
                                const val = Number(e.target.value.replace(/\D/g, '')) || 0;
                                setPosCart(prev => ({ ...prev, [id]: val }));
                              }}
                              className="w-10 h-6 bg-white border border-gray-300 rounded-lg text-center font-mono font-black text-sm outline-none focus:border-emerald-500 text-gray-950 p-0 shadow-inner"
                            />
                            
                            <button type="button" onClick={() => setPosCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }))} className="w-6 h-6 bg-white border border-gray-300 rounded-lg flex items-center justify-center text-sm font-black text-gray-700 shadow-sm active:bg-gray-100">+</button>
                          </div>

                          {/* 💰 ໓. ຍອດລາຄາລວມຂອງເມນູນັ້ນໆ [Part 284] */}
                          <p className="font-mono font-black text-right min-w-[75px] text-gray-950 text-sm">{((Number(item.price) || 0) * qty).toLocaleString()} ₭</p>

                          {/* 🗑️ ໔. [🎯 ຟີເຈີໃໝ່ຫຼັກ]: ເພີ່ມປຸ່ມລຶບ (Icon) ໄວ້ທາງທ້າຍສຸດຂອງລາຍການຂາຍ ກົດປຸບຕັດອອກທັນທີ 100% */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`🗑️ ຕ້ອງການລຶບລາຍການ "${item.name_lo}" ອອກຈາກຕະກ້າແທ້ບໍ່?`)) {
                                setPosCart(prev => ({ ...prev, [id]: 0 }));
                              }
                            }}
                            className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition shrink-0 ml-1"
                            title="ລຶບລາຍການນີ້"
                          >
                            <X size={16} strokeWidth={3} />
                          </button>
                        </div>
                      );
                    })}

                  </div>
                )}
              </div>

              {/* ໂຊນສະຫຼຸບຍອດເງິນ, ປ້ອນເງິນສົດ ແລະ ໄລ່ເງິນທອນ (ເວີຊັນຂະຫຍາຍຕົວໜັງສືໃຫຍ່ພິເສດ 🌟) [10] */}
              <div className="border-t-2 border-gray-100 pt-4 mt-4 space-y-4">
                
                {/* ຄຳນວນຍອດລວມສຸດທິ [10] */}
                {(() => {
                  const totalCartPrice = Object.entries(posCart || {}).reduce((sum, [id, qty]) => {
                    const item = menus.find(m => String(m.id) === String(id));
                    return sum + (item ? (Number(item.price) || 0) * qty : 0);
                  }, 0);
                  const cashNum = Number(cashReceived) || 0;
                  const changeDue = cashNum > 0 ? cashNum - totalCartPrice : 0;

                  return (
                    <div className="space-y-4">
                      {/* 💰 ຍອດລວມທັງໝົດ ປັບເປັນ text-base ແລະ text-xl ໃຫຍ່ເຕັມຈໍ [10] */}
                      <div className="flex items-center justify-between text-gray-900 border-b border-dashed border-gray-200 pb-3">
                        <span className="text-sm font-black flex items-center gap-1">💵 ຍອດລວມທັງໝົດ:</span>
                        <span className="text-xl font-black font-mono text-emerald-600 tracking-tight">{totalCartPrice.toLocaleString()} ₭</span>
                      </div>

                      {/* ຊ່ອງປ້ອນຮັບເງິນສົດ (ຂະຫຍາຍກອບ ແລະ ຕົວໜັງສືໃຫຍ່ຂຶ້ນ) [10] */}
                      {totalCartPrice > 0 && (
                        <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border-2 border-gray-200 shadow-sm animate-fadeIn">
                          <div className="flex items-center justify-between gap-3">
                            <label className="text-xs font-black text-gray-700 shrink-0">📥 ຮັບເງິນສົດມາ:</label>
                            {/* 🎯 [ຈຸດປິດບັກລະບົບຕື່ມເລກ 0 ອັດຕະໂນມັດ 3 ຕົວ]: ພິມຕົວເລກຫຼັກແສນ/ຫຼັກພັນປຸບ ຕົວແອັບເຕັມ 000 ໃຫ້ໂອໂຕ້ທັນທີ */}
                            <div className="relative flex-1">
                              <input 
                                type="text"
                                inputMode="numeric"
                                placeholder="ປ້ອນຈຳນວນເງິນ..."
                                value={cashReceived}
                                onChange={(e) => {
                                  // 🔒 ບັງຄັບໃຫ້ພິມໄດ້ສະເພາະຕົວເລກ [Part 284]
                                  const val = e.target.value.replace(/\D/g, '');
                                  setCashReceived(val);
                                }}
                                onBlur={(e) => {
                                  // 💡 [ສູດເດັດອັດສະລິຍະ]: ເມື່ອພະນັກງານພິມເສັດ ແລ້ວເອົາມືອອກຈາກຊ່ອງພິມ (OnBlur)
                                  // ຫາກຕົວເລກທີ່ພິມມີຄ່າໜ້ອຍກວ່າ 5000, ໃຫ້ລະບົບບັງຄັບຕື່ມເລກ 000 ຍັດທ້າຍໃຫ້ໂອໂຕ້ທັນທີ!
                                  const rawVal = e.target.value.replace(/\D/g, '');
                                  if (rawVal && Number(rawVal) > 0 && Number(rawVal) < 5000) {
                                    const autoMultiplied = String(Number(rawVal) * 1000);
                                    setCashReceived(autoMultiplied);
                                  }
                                }}
                                className="w-full bg-white border-2 border-gray-300 rounded-xl p-2 pr-7 text-right font-mono font-black text-base outline-none focus:border-emerald-500 text-gray-950 shadow-inner"
                              />
                              <span className="absolute right-2 top-2.5 text-xs font-black text-gray-400">₭</span>
                            </div>

                          </div>

                          {/* 💰 ໂຊນສະແດງຜົນເງິນທອນ ປັບເປັນ text-sm ແລະ text-lg ໃຫຍ່ຊັດເຈນ [10] */}
                          <div className="flex items-center justify-between pt-2 text-sm font-black border-t-2 border-gray-200/80 mt-2">
                            <span className="text-gray-700">💰 ເງິນທອນລູກຄ້າ:</span>
                            <span className={`font-mono text-lg font-black ${changeDue >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                              {changeDue >= 0 ? `${changeDue.toLocaleString()} ₭` : '⚠️ ເງິນສົດບໍ່ພໍດີ'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* ປຸ່ມກົດຊຳລະເງິນ (ຕົວໜັງສືໃຫຍ່ text-sm) [10] */}
                      <button 
                        type="button" 
                        onClick={async () => {
                          const cartItems = Object.entries(posCart || {}).filter(([_, qty]) => qty > 0);
                          if (cartItems.length === 0) return alert('❌ ກະລຸນາເລືອກເມນູອາຫານກ່ອນຄິດເງິນ!');
                          if (cashReceived && cashNum < totalCartPrice) return alert('⚠️ ຈຳນວນεງິນສົດທີ່ຮັບມາ ບໍ່ພໍດີກັບຍອດບິນ!');
                          
                          try {
                            const { data: newOrder, error: oErr } = await supabase
                              .from('orders')
                              .insert([{ table_id: 999, status: 'completed', total_price: totalCartPrice, order_lang: 'lo' }])
                              .select()
                              .single();

                            if (oErr) throw oErr;

                            const insertItems = cartItems.map(([id, qty]) => ({ 
                              order_id: newOrder.id, 
                              menu_id: Number(id), 
                              quantity: qty, 
                              item_status: 'completed' 
                            }));

                            await supabase.from('order_items').insert(insertItems);
                            alert(`🎉 ຊຳລະເງິນສົດສຳເລັດຮຽບຮ້ອຍ!\n💰 ເງິນທອນລູກຄ້າ: ${changeDue.toLocaleString()} ₭`);
                            setPosCart({});
                            setCashReceived('');
                          } catch (err) { alert('Error POS: ' + err.message); }
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl text-center shadow-md transition active:scale-[0.97] flex items-center justify-center gap-2 text-sm tracking-wide"
                      >
                        💵 ຢືນຢັນການຊຳລະເງິນ (ອອກບິນ)
                      </button>
                    </div>
                  );
                })()}

              </div>
            </div>
          </div>

      )}


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
      {/* 📥 MODAL: ປັອບອັບໜ້າຕ່າງແກ້ໄຂເມນູອາຫານ Real-time (Edit Menu Modal) */}
      {editingMenu && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-gray-950 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 text-xs font-bold text-gray-700">
            <div className="flex items-center justify-between border-b-2 border-gray-100 pb-3 mb-4">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">✏️ ແກ້ໄຂຂໍ້ມູນເມນູອາຫານ</h3>
              <button type="button" onClick={() => setEditingMenu(null)} className="text-gray-400 hover:text-black text-sm">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-gray-600">ຊື່ລາຍການອາຫານ (ພາສາລາວ) *</label>
                <input 
                  type="text" 
                  value={editingMenu.name_lo || ''}
                  onChange={(e) => setEditingMenu({ ...editingMenu, name_lo: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-orange-500 font-black text-gray-900 text-xs shadow-inner"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-600">ລາຄາຂາຍ (ເງິນກີບ ₭) *</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={editingMenu.price || ''}
                  onChange={(e) => setEditingMenu({ ...editingMenu, price: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-mono font-black text-emerald-600 text-xs outline-none focus:border-emerald-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-600">ລິ້ງຮູບພາບອາຫານ (Image URL)</label>
                <input 
                  type="text" 
                  value={editingMenu.image_url || ''}
                  onChange={(e) => setEditingMenu({ ...editingMenu, image_url: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-orange-500 text-gray-900 text-[11px] shadow-inner"
                />
              </div>
            </div>

            {/* ປຸ່ມກົດ ຍົກເລີກ / ບັນທຶກ */}
            <div className="flex gap-3 mt-6 text-xs font-black">
              <button type="button" onClick={() => setEditingMenu(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-xl transition">ຍົກເລີກ</button>
              <button 
                type="button" 
                onClick={async () => {
                  if (!editingMenu.name_lo || !editingMenu.price) return alert('❌ ກະລຸນາປ້ອນຂໍ້ມູນຊື່ ແລະ ລາຄາໃຫ້ຄົບຖ້ວນ!');
                  
                  try {
                    // ຍິງຄຳສັ່ງ Update ໄປແກ້ໄຂຂໍ້ມູນໃນຕາຕະລາງ menus ຂອງ Supabase ໂອໂຕ້ 100%
                    const { error } = await supabase
                      .from('menus')
                      .update({
                        name_lo: editingMenu.name_lo,
                        price: Number(editingMenu.price),
                        image_url: editingMenu.image_url
                      })
                      .eq('id', editingMenu.id);

                    if (error) throw error;

                    // ອັບເດດຄ່າໃນລາຍຊື່ State ໜ້າແອັບທັນທີ ໂດຍບໍ່ຕ້ອງປິດເປີດໃຫໝ່ [Part 197]
                    setMenus(prev => prev.map(m => m.id === editingMenu.id ? { ...editingMenu, price: Number(editingMenu.price) } : m));
                    alert('🎉 ແກ້ໄຂຂໍ້ມູນເມນູອາຫານ Real-timeຳເລັດຮຽບຮ້ອຍ!');
                    setEditingMenu(null);
                  } catch (err) { alert('Error: ' + err.message); }
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                💾 ບັນທຶກການແກ້ໄຂ
              </button>
            </div>

          </div>
        </div>
      )}

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
                      {/* 🎯 [ເວີຊັນປິດບັກຮູບ QR ບໍ່ຂຶ້ນໃນ PDF 100%]: ສ້າງຮູບໃຫ້ສຳເລັດ 100% ຈາກຕົ້ນທາງ ກ່ອນຈະສັ່ງປິ່ນ ບັງຄັບໂຊຮູບຄົບທຸກໂຕະແນ່ນອນ */}
            <button 
              type="button" 
              onClick={async () => {
                if (!filteredTables || filteredTables.length === 0) {
                  alert('⚠️ ບໍ່ພົບຂໍ້ມູນໂຕະອາຫານໃນລະບົບ ເພື່ອທຳການ Export!');
                  return;
                }
                
                try {
                  // ໑. ດຶງປລັກອິນ qrcode ຕົ້ນສະບັບມາໃຊ້ງານ [Part 135]
                  const QRCode = (await import('qrcode')).default;
                  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                  
                  // ໒. ຈັດລຽງລໍາດັບເລກໂຕະຈາກນ້ອຍໄປຫຼາຍ (01, 02, 03...) [Part 185, Part 186]
                  const sortedTables = [...filteredTables].sort((a, b) => Number(a.table_number || 0) - Number(b.table_number || 0));
                  
                  let qrCardsHtml = '';
                  
                  // ໓. 🔥 [ຈຸດປ່ຽນຫຼັກ]: ບັງຄັບສ້າງຮູບພາບ QR Code Base64 ໃຫ້ເສັດສິ້ນ 100% ຄົບທຸກໂຕະກ່ອນເປີດໜ້າຕ່າງໃໝ່
                  for (let table of sortedTables) {
                    const num = table.table_number;
                    const formattedNum = String(num).padStart(2, '0');
                    const name = table.name_lo || `ໂຕະ #${formattedNum}`;
                    const targetUrl = `${baseUrl}/customer/${num}`;
                    
                    // ສ້າງຮູບພາບ QR ຕົ້ນທາງ
                    const imgData = await QRCode.toDataURL(targetUrl, { 
                      width: 250, 
                      margin: 1,
                      color: { dark: '#000000', light: '#ffffff' }
                    });
                    
                    // ຫໍ່ໂຄງສ້າງ HTML ຂອງແຕ່ລະກາດໄວ້
                    qrCardsHtml += `
                      <div class="qr-card">
                        <h1>${name}</h1>
                        <p>ຍິງ QR Code ເພື່ອສັ່ງອາຫານ</p>
                        <img src="${imgData}" width="220" height="220" />
                      </div>
                    `;
                  }
                  
                  // ໔. ພໍສ້າງຮູບພາບຄົບຖ້ວນແລ້ວ ຄ່ອຍສັ່ງເປີດໜ້າຈໍພິມ PDF ບາດດຽວ [Part 186]
                  const printWindow = window.open('', '_blank');
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Export All Table QR Codes - Catalog</title>
                        <style>
                          body { font-family: sans-serif; background: #ffffff; padding: 20px; margin: 0; text-align: center; }
                          .grid-container { display: grid; grid-template-cols: repeat(2, 1fr); gap: 30px; justify-items: center; padding: 10px; }
                          .qr-card { border: 4px dashed #000000; padding: 25px; border-radius: 24px; width: 280px; background: #ffffff; box-sizing: border-box; text-align: center; page-break-inside: avoid; }
                          h1 { font-size: 32px; margin: 0 0 5px 0; font-weight: 900; color: #000000; }
                          p { font-size: 16px; color: #333333; margin: 0 0 15px 0; font-weight: bold; }
                          img { display: block; margin: 0 auto; background: #ffffff; }
                          @media print {
                            body { padding: 0; }
                            .grid-container { gap: 20px; }
                          }
                        </style>
                      </head>
                      <body>
                        <h2 class="no-print">📦 ໃບລວບລວມຄິວອາໂຄດສັ່ງອາຫານທັງໝົດ (${sortedTables.length} ໂຕະ)</h2>
                        <p class="no-print" style="color: #666; font-size: 13px; margin-bottom: 30px;">ກະລຸນາເລືອກປາຍທາງເປັນ "Save as PDF" ເພື່ອບັນທຶກໄຟລ໌ ຫຼື ສັ່ງປິ່ນອອກບາດດຽວ</p>
                        
                        <div class="grid-container">
                          ${qrCardsHtml}
                        </div>

                        <script>
                          // ບັງຄັບຫຼັກຖ້າ 300ms ໃຫ້ຮູບພາບ Render ນິ້ງສະນິດ ແລ້ວດີດໜ້າຈໍພິມ PDF ຂຶ້ນມາທັນທີ [Part 184]
                          window.onload = function() {
                            setTimeout(function() {
                              window.print();
                            }, 300);
                          };
                        </script>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  
                } catch (error) {
                  console.error('Export PDF Error:', error);
                  alert(' เกิดข้อผิดพลาดໃນການສ້າງ PDF: ' + error.message);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-3 py-2 rounded-xl shadow-md transition active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              📥 Export QR ທັງໝົດ (PDF)
            </button>

          <button type="button" onClick={() => setAddTableModalOpen(true)} className="ml-auto shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3 py-2 rounded-xl shadow-md transition active:scale-95">➕ ເພີ່ມໂຕະ</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white text-gray-900 font-black border-b-2 border-gray-200">
                {/* 🎯 [ປັບຫົວຂໍ້ຖັນໃຫ້ຕົງເປະ]: ຂະຫຍາຍຄວາມກວ້າງໃຫ້ພໍດີກັບຕົວເລກ ແລະ QR Code ທີ່ຍາກອອກ */}
                <th className="p-3 w-[260px]">ເລກໂຕະ | ຄິວອາໂຄດ (Table & QR)</th>
                <th className="p-3">ຊື່ໂຕະ (ລາວ)</th>
                <th className="p-3">English</th>
                <th className="p-3">中文</th>
                <th className="p-3">ไทย</th>
                <th className="p-3 w-[140px] text-center">ສະຖານະ</th>
                <th className="p-3 w-[110px] text-center">ຈັດການ</th>
              </tr>
            </thead>
            <tbody>
              {/* 🎯 ລຽງລໍາດັບເລກໂຕະຈາກນ້ອຍໄປຫຼາຍ (01, 02, 03...) อัตโนมัติ */}
              {[...filteredTables]
                .sort((a, b) => Number(a.table_number || 0) - Number(b.table_number || 0))
                .map((table, index) => (
                <tr key={table.id || table.table_number || index} className="border-b border-gray-200 font-black text-gray-950 hover:bg-white transition">
                  
                  {/* 🎯 [ຈຸດຍາກຊ່ອງຫວ່າງ Premium]: ເພີ່ມ pl-2 ຫ້ອງຫຼັກ ແລະ ml-4 ຢູ່ກ່ອງ QR Code ເພື່ອບໍ່ໃຫ້ຕິດເລກໂຕະເກີນໄປ */}
                  <td className="p-3 pl-4">
                    <div className="flex items-center">
                      {/* ກ່ອງໂຊເລກໂຕະ 01, 02 */}
                      <span className="font-mono font-black text-sm text-gray-900 bg-gray-100 px-2.5 py-1 rounded-xl border border-gray-200 min-w-[38px] text-center shadow-sm">
                        {String(table.table_number).padStart(2, '0')}
                      </span>
                      
                      {/* 🚀 ຍາກຮູບ QR Code ອອກມາດ້ານຂວາ ດ້ວຍຄຳສັ່ງ pl-4 (Padding-Left) ໃຫ້ເບິ່ງງາມ ມີລະດັບ */}
                      <div className="pl-4">
                        <RowTableQRCode table={table} />
                      </div>
                    </div>
                  </td>

                  <td className="p-3">{table.name_lo || `ໂຕະ #${table.table_number}`}</td>
                  <td className="p-3">{table.name_en || '-'}</td>
                  <td className="p-3">{table.name_zh || '-'}</td>
                  <td className="p-3">{table.name_th || '-'}</td>
                  <td className="p-3 text-center">
                    <button type="button" onClick={() => handleToggleTableAvailability(table)} className={`rounded-lg border px-2 py-1 text-[10px] font-black transition active:scale-[0.95] ${table.is_available === false ? 'border-gray-300 bg-gray-100 text-gray-500' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}`}>
                      {table.is_available === false ? '⚪ ປິດໃຊ້ງານ' : '🟢 ເປີດໃຊ້ງານ'}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button type="button" onClick={() => handleEditTable(table)} className="text-blue-600 hover:text-blue-800 text-lg transition active:scale-[0.95]" title="ແກ້ໄຂ" aria-label="ແກ້ໄຂ">✏️</button>
                      <button type="button" onClick={() => handleDeleteTable(table)} className="text-red-600 hover:text-red-800 text-lg transition active:scale-[0.95]" title="ລຶບ" aria-label="ລຶບ">🗑️</button>
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
