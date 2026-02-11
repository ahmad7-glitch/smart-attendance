# Cara Menambahkan User (Admin, Principal, Teacher)

## Metode 1: Melalui Supabase Dashboard (Untuk Admin Pertama)

### Langkah 1: Buat User di Authentication
1. Buka **Supabase Dashboard** → **Authentication** → **Users**
2. Klik **Add User** → **Create new user**
3. Isi:
   - **Email**: `admin@example.com` (ganti dengan email Anda)
   - **Password**: buat password yang kuat
   - **Auto Confirm User**: ✅ centang (agar langsung aktif)
4. Klik **Create User**
5. **Salin UUID** user yang baru dibuat (contoh: `5df60b13-8a8e-4bf5-a07a-3d11c098241b`)

### Langkah 2: Tambahkan ke Tabel `users`
1. Buka **Supabase Dashboard** → **SQL Editor**
2. Jalankan query ini (ganti UUID dan nama):

```sql
-- Tambah Admin
INSERT INTO public.users (id, full_name, role)
VALUES ('5df60b13-8a8e-4bf5-a07a-3d11c098241b', 'Admin Utama', 'admin');

-- Atau untuk Principal
INSERT INTO public.users (id, full_name, role)
VALUES ('UUID_DARI_AUTH', 'Nama Principal', 'principal');

-- Atau untuk Teacher
INSERT INTO public.users (id, full_name, role)
VALUES ('UUID_DARI_AUTH', 'Nama Guru', 'teacher');
```

3. Klik **Run**

### Langkah 3: Login
1. Buka aplikasi Anda di browser: `http://localhost:3000/login`
2. Login dengan email dan password yang tadi dibuat
3. Anda akan diarahkan ke dashboard sesuai role

---

## Metode 2: Melalui Admin Dashboard (Setelah Admin Pertama Ada)

Setelah Anda punya 1 admin, Anda bisa menambahkan user lain langsung dari aplikasi:

### Untuk Menambahkan Teacher/Admin/Principal Baru:
1. Login sebagai **Admin**
2. Pergi ke **Dashboard Admin** → **Kelola Guru**
3. Klik tombol **+ Tambah Guru**
4. Isi form:
   - **Nama Lengkap**: Nama user
   - **Email**: Email untuk login
   - **Password**: Password (minimal 6 karakter)
   - **Role**: Pilih `teacher`, `admin`, atau `principal`
5. Klik **Simpan**

Sistem akan otomatis:
- Membuat akun di Supabase Auth
- Menambahkan data ke tabel `users`
- User baru bisa langsung login

---

## Contoh Cepat: Buat Admin Pertama

```sql
-- 1. Buat user di Auth (via Dashboard UI)
-- Email: admin@sekolah.com
-- Password: Admin123!
-- Salin UUID yang dihasilkan, misalnya: abc123-def456-...

-- 2. Jalankan SQL ini:
INSERT INTO public.users (id, full_name, role)
VALUES ('abc123-def456-...', 'Administrator', 'admin');
```

Selesai! Sekarang login dengan `admin@sekolah.com` dan Anda bisa menambahkan user lain dari dashboard.

---

## Troubleshooting

### Error: "duplicate key value violates unique constraint"
- UUID sudah ada di tabel `users`
- Cek dengan: `SELECT * FROM public.users WHERE id = 'UUID_ANDA';`

### Error: "insert or update on table violates foreign key constraint"
- User belum dibuat di Authentication
- Pastikan user sudah ada di **Authentication → Users** dulu

### User tidak bisa login
- Pastikan **Auto Confirm User** dicentang saat membuat user
- Atau confirm manual via email verification

### Role tidak sesuai
- Update role dengan SQL:
```sql
UPDATE public.users 
SET role = 'admin' 
WHERE id = 'UUID_USER';
```
