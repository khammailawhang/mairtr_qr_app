/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ມັກເພີ່ມແຖວນີ້ເຂົ້າໄປ (ສຳຄັນຫຼາຍສຳລັບ Docker):
  output: 'standalone',
  allowedDevOrigins: [
    '127.0.0.1',
    '0.0.0.0',
    '192.168.43.1',
    '192.168.43.24',
    '192.168.1.1',
    '192.168.0.1',
    '10.0.0.1',
    ...(process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ],
};

export default nextConfig;
