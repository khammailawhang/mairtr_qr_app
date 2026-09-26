# 🍲 Smart Restaurant POS & Real-time QR Code Ordering System

ລະບົບຄຸ້ມຄອງຮ້ານອາຫານອັດສະລິຍະ ຄົບວົງຈອນ (Full-Stack Smart Restaurant Ecosystem) ທີ່ຮວມເອົາ **ລະບົບຂາຍເຄື່ອງໜ້າຮ້ານ (POS Cashier)**, **ລະບົບສະແກນ QR Code ສັ່ງອາຫານສາຍຟ້າແລບສຳລັບລູກຄ້າ**, ແລະ **ແຜງຄວບຄຸມເຈົ້າຂອງຮ້ານ (Owner Dashboard) ແບບ Real-time 100%** ໂດຍເຮັດວຽກຜ່ານເຄືອຂ່າຍ Local Network Wi-Fi IP ແລະ ຖານຂໍ້ມູນລະດັບໂລກ Supabase.

---

## 🚀 ຄຸນສົມບັດເດັ່ນຂອງລະບົບ (Key Features)

### 1. 📊 ແຜງຄວບຄຸມເຈົ້າຂອງຮ້ານ (Owner Dashboard)
* **Real-time Database Proxy:** ລະບົບຜູກສັນຍານຜ່ານ Server-side Internal API Proxy ປົດລັອກບັກ CORS ແລະ Network Timeout ສາມາດເຂົ້າໃຊ້ງານແຜງຄວບຄຸມໄດ້ພ້ອມກັນທັງທາງ `localhost:3000` ແລະ ເຄືອຂ່າຍ Wi-Fi IP ພາຍໃນຮ້ານ.
* **4D Sales Analytics Chart:** ກຣາຟແທ່ງສີຂຽວມໍລະກົດສະຫຼຸບສະຖິຕິຍອດຂາຍຈິງ 4 ມິຕິ (ລາຍວັນ, ລາຍອາທິດ, ລາຍເດືອນ 12 ເດືອນ, ແລະ ລາຍປີ) ແຜ່ຂະຫຍາຍເຕັມຈໍ 5 ຖັນ ດີດຍືດຂຶ້ນອັດຕະໂນມັດແບບ Real-time ເມື່ອມີການສັ່ງຊື້ ໂດຍບໍ່ຕ້ອງກົດ F5 ຫຼື Refresh.
* **Widescreen Management Tab:** ແຖບ Sidebar ດີຊາຍນ໌ Premium ພ້ອມແຖບເມັດສີເຫຼືອງນ້ອຍບອກສະຖານະ (Yellow Indicator Strip) ແລະ ພື້ນຫຼັງສີຂຽວມໍລະກົດ ສະຫຼັບໜ້າຈໍຄຸ້ມຄອງ (ພາບລວມ, ໝວດໝູ່, ເມນູ, ໂຕະ, ພະນັກງານ) ແບບ 1-Page at a time ວ່ອງໄວ ບໍ່ຕິດບັກ CSS ຕຳກັນ.

### 🛒 2. ລະບົບຂາຍເຄື່ອງໜ້າເຄົາເຕີ (Professional POS System)
* **Grid Mode Selector:** ປຸ່ມໄອຄອນເມັດຈ້ຳສີ່ແຈ 🎛️ ສາມາດເລືອກສະຫຼັບມຸມມອງລະຫວ່າງ "ໂໝດກາດໃຫຍ່ Premium" ແລະ "ໂໝດແຖວລາຍຊື່ຍາວ" ໄດ້ຕາມຂະໜາດໜ້າຈໍ.
* **Dynamic Column Scaling:** ຊ່ອງປັບມຸມມອງອັດສະລິຍະ ສາມາດເລືອກຂະຫຍາຍລາຍການເມນູອາຫານອອກໄດ້ຕັ້ງແຕ່ 3, 4, 5 ຈົນຮອດ 10 ຖັນ ແລະ ຂະຫຍາຍຄວາມສູງລົງໃຕ້ເຕັມຕາ `85vh` ໂຊເມນູອາຫານພ້ອມຮູບພາບລະດັບ 5 ດາວໄດ້ຄົບຖ້ວນ.
* **Auto-Kip Thousands Entry:** ຊ່ອງຮັບເງິນສົດມາດຕະຖານ POS ພິມຕົວເລກຫຼັກແສນອັດຕະໂນມັດ (ພິມ 100 ➔ ດີດເຕັມ 000 ໂອໂຕ້ເປັນ 100,000 ₭) ພ້ອມລະບົບຄຳນວນເງິນທອນລູກຄ້າ Real-time.
* **Advanced Quantity Controller:** ຊ່ອງພິມຈຳນວນສິນຄ້າທາງກາງລະຫວ່າງປຸ່ມ `-` ແລະ `+` ສາມາດຄລິກພິມຕົວເລກຈຳນວນໃຫຍ່ໆໄດ້ໂດຍຕົງ ພ້ອມປຸ່ມ `✕` ສີແດງຕັດລຶບທ້າຍແຖວທັນຕາ.
* **Click-to-Edit Menu:** ປຸ່ມລັດ ✏️ ແກ້ໄຂ ມຸມຂວາແຈທາງລຸ່ມ ຫຼຸດພົ້ນຈາກການໂດນ Layer ບັງ ກົດປຸບດີດ Modal ໃຫ້ເຈົ້າຂອງຮ້ານແກ້ໄຂຊື່ ແລະ ລາຄາອາຫານແລ່ນຕົງເຂົ້າ Supabase ໄດ້ທັນທີ.

### 📱 3. ລະບົບສະແກນ QR Code ສັ່ງອາຫານ (Customer QR Ordering)
* **Table QR Code Engine:** ລະບົບສ້າງ ແລະ ສະແກນ QR Code ແຍກຕາມເລກໂຕະອາຫານຈິງ (ເຊັ່ນ ໂຕະ 01, ໂຕະ 02) ແລ່ນຜ່ານ Google Lens ດີດເຂົ້າໜ້າເມນູ Next.js 16 ໄດ້ອັດຕະໂນມັດ.
* **Live Sync Pipeline:** ຂໍ້ມູນການສັ່ງອາຫານຈາກມືຖືລູກຄ້າ ຈະແລ່ນທະລຸ Wi-Fi ເຂົ້າຖານຂໍ້ມູນ Supabase ແລ້ວດີດເຕືອນໜ້າຈໍ POS ແລະ Dashboard ເຈົ້າຂອງຮ້ານທັນທີ.

---

## 🛠️ ເຕັກໂນໂລຊີທີ່ໃຊ້ (Tech Stack)

* **Frontend:** Next.js 16 (App Router), React, Tailwind CSS
* **Database & Real-time Stream:** Supabase (PostgreSQL)
* **Icons & UI Dynamic:** Lucide React, Framer Motion
* **Compiler & Bundler:** Next.js Turbopack (`--turbo`)

---

## 📥 ຂັ້ນຕອນການຕິດຕັ້ງ ແລະ ເປີດໃຊ້ງານ (Installation & Setup)

### 1. Clone Project ຈາກ GitHub
```bash
git clone https://github.com
cd smart-restaurant-pos
```

### 2. ຕິດຕັ້ງ Dependencies ທັງໝົດ
```bash
npm install
```

### 3. ຕັ້ງຄ່າ Environment Variables (`.env.local`)
ສ້າງໄຟລ໌ `.env.local` ໄວ້ຢູ່ Root Project ແລ້ວປ້ອນ Key ຈາກ Supabase ຂອງທ່ານ:
```env
NEXT_PUBLIC_SUPABASE_URL=https://supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. ລ້າງ Build Cache ແລະ ເປີດ Dev Server ຜ່ານ Turbopack 🚀
ລັນຄຳສັ່ງ PowerShell ບັນທັດນີ້ເພື່ອທຳລາຍ Cache ເກົ່າ ປ້ອງກັນບັກຈໍຫວ່າງ ແລະ ເປີດລະບົບແບບບໍລິສຸດ:
```bash
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
npm run dev
```

---

## 🖥️ ວິທີການທົດສອບລະບົບພາຍໃນຮ້ານ (Local Network Testing)

1. **ເປີດໜ້າຈໍເຈົ້າຂອງຮ້ານ:** ເປີດ Browser ພາຍໃນຄອມພິວເຕີແຄັດເຊຍ ແລ້ວເຂົ້າ Link:
   `http://192.168.43`
2. **ເອົາມືຖືສະແກນສັ່ງອາຫານ:** ເປີດແອັບ Google Lens ພາຍໃນໂທລະສັບມືຖື Android ຂອງທ່ານ ແລ້ວຍິງສະແກນ QR Code ໂຕະອາຫານທີ່ໂຜ່ເທິງໜ້າຈໍຄອມພິວເຕີ.
3. **ຍິງອໍເດີ້ຈິງ:** ກົດເລືອກເມນູອາຫານໃນມືຖື ➔ ກົດ "ສົ່ງອໍເດີ້" ➔ ຂໍ້ມູນຈະແລ່ນເຂົ້າຖານຂໍ້ມູນ ແລະ ດີດຕົວເລກຍອດຂາຍລວມ ພ້ອມຍືດແທ່ງກຣາຟສີຂຽວມໍລະກົດຢູ່ໜ້າຈໍຄອມພິວເຕີໃຫ້ເຫັນຄາຕາ Real-time ທັນທີ 100%!

---


