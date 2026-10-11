/* ================================
   SCRIPT UTAMA — BusKu (satu file)
   Bagian 1: AUTH  (login, logout, penjaga halaman)
   Bagian 2: HALAMAN (beranda, pesan tiket, berita, bantuan)
   Cukup dimuat SEKALI di <head> setiap halaman:
   <script src="script.js"></script>
   Catatan: autentikasi ini sisi klien untuk tugas/demo.
   ================================ */

// ════════════════════════════════
// BAGIAN 1 — AUTH
// ════════════════════════════════

const USERS_KEY   = 'busku_users';
const SESSION_KEY = 'busku_session';

// ───── STORAGE HELPER ─────
function bacaUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch (e) { return []; }
}
function simpanUsers(list) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(list)); } catch (e) {}
}
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch (e) { return null; }
}
function setSession(user) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ nama: user.nama, email: user.email })); } catch (e) {}
}

// ───── HASH PASSWORD ─────
// pakai SHA-256 kalau tersedia, kalau tidak pakai hash sederhana sebagai cadangan
async function hashPassword(teks) {
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(teks));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 5381;
  for (let i = 0; i < teks.length; i++) h = ((h << 5) + h + teks.charCodeAt(i)) | 0;
  return 'f' + h;
}

// ───── TUJUAN SETELAH LOGIN ─────
function tujuanSetelahLogin() {
  const next = new URLSearchParams(window.location.search).get('next');
  // hanya izinkan file html lokal supaya tidak jadi open redirect
  if (next && /^[\w\-]+\.html(\?.*)?$/.test(next) && next.toLowerCase().indexOf('login.html') !== 0) {
    return next;
  }
  return 'halaman.html';
}

// ───── GUARD ─────
// jalan langsung saat script dimuat di <head>
const NAMA_FILE     = (window.location.pathname.split('/').pop() || '').toLowerCase();
const HALAMAN_LOGIN = (NAMA_FILE === 'login.html');

if (getSession()) {
  // sudah login tapi membuka login.html -> langsung ke halaman utama
  if (HALAMAN_LOGIN) {
    window.location.replace(tujuanSetelahLogin());
  }
} else if (!HALAMAN_LOGIN) {
  // belum login dan membuka halaman lain -> ke login.html
  document.documentElement.style.visibility = 'hidden';
  const asal = (NAMA_FILE || 'halaman.html') + window.location.search;
  window.location.replace('login.html?next=' + encodeURIComponent(asal));
}

// ───── LOGOUT ─────
function logout() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  window.location.replace('login.html');
}

// ───── NAVBAR USER + TOMBOL MENU MOBILE (disuntikkan otomatis) ─────
document.addEventListener('DOMContentLoaded', () => {
  const s = getSession();
  const nav = document.querySelector('nav');
  if (!s || !nav) return;

  const box = document.createElement('div');
  box.className = 'nav-user';
  const nama = document.createElement('span');
  nama.className = 'nav-user-name';
  nama.textContent = '👤 ' + (s.nama || '').split(' ')[0];
  nama.title = s.email;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-outline btn-sm';
  btn.id = 'btnLogout';
  btn.textContent = 'Logout';
  btn.addEventListener('click', () => {
    if (confirm('Yakin ingin keluar dari akun?')) logout();
  });
  box.append(nama, btn);
  nav.appendChild(box);
});

// ════════════════════════════════
// FORM LOGIN / DAFTAR (hanya aktif di login.html)
// ════════════════════════════════
function pesanAuth(id, teks, tipe) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = teks ? `<div class="alert alert-${tipe}">${teks}</div>` : '';
}
function setErr(idErr, idInput, tampil) {
  document.getElementById(idErr).classList.toggle('show', tampil);
  if (idInput) document.getElementById(idInput).classList.toggle('error', tampil);
}

function gantiTab(tab) {
  document.getElementById('formLogin').style.display    = tab === 'login' ? 'block' : 'none';
  document.getElementById('formRegister').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
  pesanAuth('alertLogin', '', 'info');
  pesanAuth('alertRegister', '', 'info');
}

function togglePassword(idInput, el) {
  const inp = document.getElementById(idInput);
  const tampil = inp.type === 'password';
  inp.type = tampil ? 'text' : 'password';
  el.textContent = tampil ? '🙈' : '👁️';
}

async function prosesLogin() {
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('loginPass').value;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  setErr('err-lEmail', 'loginEmail', !emailOk);
  setErr('err-lPass', 'loginPass', !pass);
  if (!emailOk || !pass) return;

  const hash = await hashPassword(pass);
  const user = bacaUsers().find(u => u.email === email && u.hash === hash);
  if (!user) {
    pesanAuth('alertLogin', '❌ Email atau password salah.', 'danger');
    return;
  }
  setSession(user);
  pesanAuth('alertLogin', '✅ Login berhasil, mengalihkan...', 'success');
  setTimeout(() => window.location.replace(tujuanSetelahLogin()), 600);
}

async function prosesRegister() {
  const nama  = document.getElementById('regNama').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('regPass').value;
  const pass2 = document.getElementById('regPass2').value;

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passOk  = pass.length >= 6;
  const samaOk  = pass === pass2;
  setErr('err-rNama', 'regNama', !nama);
  setErr('err-rEmail', 'regEmail', !emailOk);
  setErr('err-rPass', 'regPass', !passOk);
  setErr('err-rPass2', 'regPass2', !samaOk);
  if (!nama || !emailOk || !passOk || !samaOk) return;

  const users = bacaUsers();
  if (users.some(u => u.email === email)) {
    pesanAuth('alertRegister', '⚠️ Email ini sudah terdaftar. Silakan login.', 'danger');
    return;
  }
  const user = { nama, email, hash: await hashPassword(pass) };
  users.push(user);
  simpanUsers(users);
  setSession(user);
  pesanAuth('alertRegister', '🎉 Akun berhasil dibuat, mengalihkan...', 'success');
  setTimeout(() => window.location.replace(tujuanSetelahLogin()), 700);
}

// tekan Enter di form login/daftar untuk submit
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const login = document.getElementById('formLogin');
  if (!login) return; // bukan halaman login
  if (login.style.display !== 'none') prosesLogin();
  else prosesRegister();
});

// ════════════════════════════════
// BAGIAN 2 — HALAMAN
// ════════════════════════════════

// ───── DATA ─────
const HARGA_KELAS = { ekonomi: 80000, eksekutif: 150000, vip: 250000 };
const NAMA_KELAS  = { ekonomi: 'Ekonomi AC', eksekutif: 'Eksekutif', vip: 'VIP Sleeper' };
const NAMA_BAYAR  = { qris: 'QRIS', bni: 'Transfer BNI', bca: 'Transfer BCA', mandiri: 'Transfer Mandiri', gopay: 'GoPay', ovo: 'OVO' };

// pulau tiap kota (rute antar pulau harganya lebih mahal)
const PULAU = {
  'Banda Aceh': 'Sumatera', 'Medan': 'Sumatera', 'Padang': 'Sumatera', 'Pekanbaru': 'Sumatera',
  'Jakarta': 'Jawa', 'Bandung': 'Jawa', 'Semarang': 'Jawa', 'Yogyakarta': 'Jawa', 'Surabaya': 'Jawa',
  'Bali': 'Bali', 'Makassar': 'Sulawesi', 'Pare-Pare': 'Sulawesi'
};

const KODE_PROMO   = 'BUSHEMAT30';
const DISKON_PROMO = 0.3;
const RIWAYAT_KEY  = 'busku_riwayat';
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const RUTE_POPULER = [
  { asal: 'Medan',    tujuan: 'Jakarta',    tag: 'Terlaris',    durasi: '± 40 jam', emoji: '🚌' },
  { asal: 'Jakarta',  tujuan: 'Bandung',    tag: 'Favorit',     durasi: '± 3 jam',  emoji: '🌄' },
  { asal: 'Jakarta',  tujuan: 'Yogyakarta', tag: 'Populer',     durasi: '± 9 jam',  emoji: '🏯' },
  { asal: 'Surabaya', tujuan: 'Bali',       tag: 'Wisata',      durasi: '± 10 jam', emoji: '🏝️' },
  { asal: 'Padang',   tujuan: 'Pekanbaru',  tag: 'Nyaman',      durasi: '± 6 jam',  emoji: '🌴' },
  { asal: 'Makassar', tujuan: 'Pare-Pare',  tag: 'Terdekat',    durasi: '± 3 jam',  emoji: '🌊' }
];

const DATA_BERITA = [
  { id: 1, judul: 'Diskon 30% Semua Rute dengan Kode BUSHEMAT30', kategori: 'Promo', tanggal: '2026-10-01', status: 'Aktif',
    ringkasan: 'Pesan hari ini dan nikmati potongan 30% untuk semua rute.',
    isi: 'Gunakan kode promo BUSHEMAT30 saat memesan tiket. Promo berlaku untuk semua rute dan semua kelas layanan selama periode promo berlangsung.' },
  { id: 2, judul: 'Jadwal Tambahan Libur Akhir Tahun', kategori: 'Operasional', tanggal: '2026-09-25', status: 'Akan Datang',
    ringkasan: 'BusKu menambah keberangkatan untuk rute favorit saat libur akhir tahun.',
    isi: 'Untuk mengantisipasi lonjakan penumpang, BusKu menambah jadwal keberangkatan pada rute Medan - Jakarta, Jakarta - Yogyakarta, dan Surabaya - Bali.' },
  { id: 3, judul: 'Armada Baru VIP Sleeper Hadir di Rute Sumatera', kategori: 'Armada', tanggal: '2026-09-15', status: 'Aktif',
    ringkasan: 'Bus VIP Sleeper terbaru dengan kursi yang bisa direbahkan penuh.',
    isi: 'Armada baru dilengkapi AC, colokan USB, selimut, dan kursi sleeper yang luas agar perjalanan jauh terasa lebih nyaman.' },
  { id: 4, judul: 'Perubahan Kebijakan Reschedule', kategori: 'Kebijakan', tanggal: '2026-09-01', status: 'Aktif',
    ringkasan: 'Reschedule bisa dilakukan hingga 2 jam sebelum keberangkatan.',
    isi: 'Penumpang dapat mengubah jadwal tanpa biaya tambahan paling lambat 2 jam sebelum jam keberangkatan melalui layanan bantuan BusKu.' },
  { id: 5, judul: 'Promo Pelajar Bulan Agustus', kategori: 'Promo', tanggal: '2026-08-10', status: 'Berakhir',
    ringkasan: 'Potongan harga khusus pelajar dan mahasiswa.',
    isi: 'Promo khusus pelajar dan mahasiswa dengan menunjukkan kartu identitas saat boarding. Periode promo sudah berakhir.' },
  { id: 6, judul: 'Pemeliharaan Sistem Pemesanan', kategori: 'Operasional', tanggal: '2026-08-02', status: 'Berakhir',
    ringkasan: 'Sistem pemesanan sempat tidak dapat diakses selama pemeliharaan.',
    isi: 'Pemeliharaan sistem dilakukan untuk meningkatkan kecepatan dan keamanan layanan. Saat ini seluruh layanan sudah normal kembali.' },
  { id: 7, judul: 'Penambahan 20 Unit Bus Eksekutif', kategori: 'Armada', tanggal: '2026-07-20', status: 'Berakhir',
    ringkasan: 'Armada eksekutif bertambah untuk rute Jawa.',
    isi: 'BusKu menambah 20 unit bus eksekutif baru untuk melayani rute Jakarta, Bandung, Semarang, Yogyakarta, dan Surabaya.' },
  { id: 8, judul: 'Aturan Bagasi Penumpang', kategori: 'Kebijakan', tanggal: '2026-07-05', status: 'Berakhir',
    ringkasan: 'Batas bagasi gratis per penumpang diperbarui.',
    isi: 'Setiap penumpang mendapat bagasi gratis maksimal 20 kg. Kelebihan bagasi dikenakan biaya sesuai ketentuan petugas.' }
];

const DATA_FAQ = [
  { q: 'Bagaimana cara memesan tiket di BusKu?',
    a: 'Buka halaman Pesan Tiket, pilih rute dan jadwal, pilih kursi, isi data penumpang, lalu lakukan pembayaran. E-tiket langsung muncul setelah pembayaran berhasil.' },
  { q: 'Metode pembayaran apa saja yang tersedia?',
    a: 'Kami menerima QRIS, transfer bank (BNI, BCA, Mandiri), serta dompet digital GoPay dan OVO.' },
  { q: 'Berapa maksimal penumpang dalam satu transaksi?',
    a: 'Maksimal 4 penumpang per transaksi. Untuk rombongan lebih besar, lakukan pemesanan beberapa kali.' },
  { q: 'Bagaimana cara melakukan reschedule?',
    a: 'Reschedule bisa dilakukan hingga 2 jam sebelum keberangkatan tanpa biaya tambahan. Hubungi kami lewat WhatsApp atau formulir di halaman ini dengan menyertakan kode booking.' },
  { q: 'Bagaimana cara membatalkan tiket dan refund?',
    a: 'Hubungi layanan bantuan dengan kode booking Anda. Proses refund dilakukan sesuai kebijakan yang berlaku dan memerlukan waktu pemrosesan.' },
  { q: 'E-tiket belum saya terima, apa yang harus dilakukan?',
    a: 'Periksa folder spam pada email Anda. Jika belum ada, hubungi kami dengan kode booking agar tiket dapat dikirim ulang.' },
  { q: 'Bagaimana cara memakai kode promo?',
    a: 'Masukkan kode promo (contoh: BUSHEMAT30) pada kolom Kode Promo di langkah pertama pemesanan, lalu klik Terapkan.' }
];

// ───── FUNGSI BANTU ─────
function aman(teks) {
  return String(teks).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatRupiah(angka) {
  return 'Rp ' + angka.toLocaleString('id-ID');
}

function formatTanggal(teks) {
  if (!teks) return '–';
  const p = teks.split('-');
  return parseInt(p[2], 10) + ' ' + BULAN[parseInt(p[1], 10) - 1] + ' ' + p[0];
}

function hariIniStr() {
  const d = new Date();
  const bln = String(d.getMonth() + 1).padStart(2, '0');
  const tgl = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + bln + '-' + tgl;
}

function hargaRute(asal, tujuan, kelas) {
  const dasar = HARGA_KELAS[kelas];
  if (!dasar || !asal || !tujuan) return 0;
  const faktor = (PULAU[asal] === PULAU[tujuan]) ? 1 : 1.5;
  return Math.round(dasar * faktor);
}

function tandaiError(idErr, idInput, tampil) {
  const err = document.getElementById(idErr);
  if (err) err.classList.toggle('show', tampil);
  if (idInput) {
    const inp = document.getElementById(idInput);
    if (inp) inp.classList.toggle('error', tampil);
  }
}

let timerToast = null;
function tampilToast(pesan) {
  const t = document.getElementById('toastMsg');
  if (!t) return;
  t.textContent = pesan;
  t.classList.add('show');
  clearTimeout(timerToast);
  timerToast = setTimeout(function () { t.classList.remove('show'); }, 3000);
}

// ════════════════════════════════
// HALAMAN UTAMA (halaman.html)
// ════════════════════════════════
function cariTiket(e) {
  e.preventDefault();
  const asal = document.getElementById('asalKota').value;
  const tujuan = document.getElementById('tujuanKota').value;
  const tgl = document.getElementById('tglBerangkat').value;

  if (asal === tujuan) {
    tampilToast('⚠️ Kota asal dan tujuan tidak boleh sama.');
    return;
  }
  if (tgl < hariIniStr()) {
    tampilToast('⚠️ Tanggal berangkat tidak boleh sebelum hari ini.');
    return;
  }
  window.location.href = 'pesananTiket.html?asal=' + encodeURIComponent(asal) +
    '&tujuan=' + encodeURIComponent(tujuan) + '&tgl=' + tgl;
}

function buatKartuRute() {
  const wadah = document.getElementById('ruteCards');
  wadah.innerHTML = '';
  for (let i = 0; i < RUTE_POPULER.length; i++) {
    const r = RUTE_POPULER[i];
    const harga = hargaRute(r.asal, r.tujuan, 'ekonomi');
    const link = 'pesananTiket.html?asal=' + encodeURIComponent(r.asal) + '&tujuan=' + encodeURIComponent(r.tujuan);
    const kartu = document.createElement('div');
    kartu.className = 'card';
    kartu.innerHTML =
      '<div class="card-banner">' + r.emoji + '</div>' +
      '<div class="card-body">' +
        '<span class="card-tag">' + r.tag + '</span>' +
        '<div class="card-title">' + r.asal + ' → ' + r.tujuan + '</div>' +
        '<div class="card-price">Mulai ' + formatRupiah(harga) + '</div>' +
        '<div class="card-meta">⏱ ' + r.durasi + ' · 3 kelas layanan</div>' +
        '<a href="' + link + '" class="btn btn-primary btn-sm card-btn">Pesan</a>' +
      '</div>';
    wadah.appendChild(kartu);
  }
}

function animasiAngka(id, target, desimal, akhiran) {
  const el = document.getElementById(id);
  if (!el) return;
  let langkah = 0;
  const total = 40;
  const timer = setInterval(function () {
    langkah++;
    const nilai = target * langkah / total;
    if (desimal) el.textContent = nilai.toFixed(1);
    else el.textContent = Math.round(nilai).toLocaleString('id-ID');
    if (langkah >= total) {
      clearInterval(timer);
      el.textContent = (desimal ? target.toFixed(1) : target.toLocaleString('id-ID')) + akhiran;
    }
  }, 35);
}

// ════════════════════════════════
// PESAN TIKET (pesananTiket.html)
// ════════════════════════════════
let jumlah = 1;
let kursiDipilih = [];
let promoDiskon = 0;
let kunciKursi = '';
let dataPesanan = {};
let daftarNama = [];

function ambilForm() {
  return {
    asal:   document.getElementById('kotaAsal').value,
    tujuan: document.getElementById('kotaTujuan').value,
    tgl:    document.getElementById('tanggalBrgkt').value,
    kelas:  document.getElementById('kelasLayanan').value
  };
}

function hitungHarga() {
  const f = ambilForm();
  updateRingkasan();
  return hargaRute(f.asal, f.tujuan, f.kelas);
}

function updateRingkasan() {
  const f = ambilForm();
  const satuan = hargaRute(f.asal, f.tujuan, f.kelas);
  const total = satuan * jumlah;
  const diskon = Math.round(total * promoDiskon);

  document.getElementById('sumRute').textContent = (f.asal && f.tujuan) ? f.asal + ' → ' + f.tujuan : '–';
  document.getElementById('sumTanggal').textContent = formatTanggal(f.tgl);
  document.getElementById('sumKelas').textContent = NAMA_KELAS[f.kelas] || '–';
  document.getElementById('sumPenumpang').textContent = jumlah + ' orang';
  document.getElementById('sumKursi').textContent = kursiDipilih.length ? kursiDipilih.join(', ') : '–';
  document.getElementById('sumHargaSatuan').textContent = satuan ? formatRupiah(satuan) : '–';
  document.getElementById('sumDiskon').textContent = diskon ? '- ' + formatRupiah(diskon) : 'Rp 0';
  document.getElementById('sumTotal').textContent = satuan ? formatRupiah(total - diskon) : '–';
}

function ubahPenumpang(n) {
  const baru = jumlah + n;
  if (baru > 4) { tampilToast('Maksimal 4 penumpang per transaksi.'); return; }
  if (baru < 1) return;
  jumlah = baru;
  document.getElementById('jmlPenumpang').textContent = jumlah;
  if (kursiDipilih.length > jumlah) kursiDipilih = kursiDipilih.slice(0, jumlah);
  updateRingkasan();
}

function terapkanPromo() {
  const kode = document.getElementById('kodePromo').value.trim().toUpperCase();
  const info = document.getElementById('promoInfo');
  if (!kode) {
    promoDiskon = 0;
    info.textContent = 'Masukkan kode promo terlebih dahulu.';
    info.style.color = '';
  } else if (kode === KODE_PROMO) {
    promoDiskon = DISKON_PROMO;
    info.textContent = '✅ Kode berhasil diterapkan! Diskon 30%.';
    info.style.color = 'var(--success)';
  } else {
    promoDiskon = 0;
    info.textContent = '❌ Kode promo tidak valid.';
    info.style.color = 'var(--danger)';
  }
  updateRingkasan();
}

function tampilStep(n) {
  for (let i = 1; i <= 5; i++) {
    const p = document.getElementById('panel' + i);
    if (p) p.classList.toggle('panel-hidden', i !== n);
  }
  for (let i = 1; i <= 4; i++) {
    const s = document.getElementById('step' + i + 'Ind');
    s.classList.toggle('active', i === n);
    s.classList.toggle('done', i < n);
  }
  window.scrollTo(0, 0);
}

function kembaliStep(n) {
  tampilStep(n);
}

function lanjutStep2() {
  const f = ambilForm();
  tandaiError('err-asal', 'kotaAsal', !f.asal);
  tandaiError('err-tujuan', 'kotaTujuan', !f.tujuan);
  tandaiError('err-tgl', 'tanggalBrgkt', !f.tgl);
  tandaiError('err-kelas', 'kelasLayanan', !f.kelas);
  if (!f.asal || !f.tujuan || !f.tgl || !f.kelas) return;

  if (f.asal === f.tujuan) {
    tampilToast('⚠️ Kota asal dan tujuan tidak boleh sama.');
    return;
  }
  if (f.tgl < hariIniStr()) {
    tampilToast('⚠️ Tanggal berangkat tidak boleh sebelum hari ini.');
    return;
  }
  buatKursi();
  tampilStep(2);
}

// angka acak tetap untuk satu kombinasi rute, supaya kursi terpesan tidak berubah-ubah
function hashTeks(teks) {
  let h = 0;
  for (let i = 0; i < teks.length; i++) {
    h = (h * 31 + teks.charCodeAt(i)) % 100000;
  }
  return h;
}

function bacaRiwayat() {
  try { return JSON.parse(localStorage.getItem(RIWAYAT_KEY)) || []; }
  catch (e) { return []; }
}
function simpanRiwayat(list) {
  try { localStorage.setItem(RIWAYAT_KEY, JSON.stringify(list)); } catch (e) {}
}

function ambilKursiTerpesan(kunci) {
  const hasil = [];
  const baseHash = hashTeks(kunci);
  const huruf = ['A', 'B', 'C', 'D'];
  for (let baris = 1; baris <= 10; baris++) {
    for (let k = 0; k < 4; k++) {
      const nomor = (baris - 1) * 4 + k;
      if ((baseHash + nomor * 7) % 5 === 0) hasil.push(baris + huruf[k]);
    }
  }
  // kursi yang sudah dipesan lewat BusKu juga ikut terpesan
  const riwayat = bacaRiwayat();
  for (let i = 0; i < riwayat.length; i++) {
    if (riwayat[i].kunci === kunci) hasil.push(riwayat[i].kursi);
  }
  return hasil;
}

function buatKursi() {
  const f = ambilForm();
  const kunci = f.asal + '>' + f.tujuan + '|' + f.tgl + '|' + f.kelas;
  if (kunci !== kunciKursi) {
    kursiDipilih = [];
    kunciKursi = kunci;
  }
  const terpesan = ambilKursiTerpesan(kunci);
  const grid = document.getElementById('seatGrid');
  const huruf = ['A', 'B', 'C', 'D'];
  grid.innerHTML = '';

  for (let baris = 1; baris <= 10; baris++) {
    const row = document.createElement('div');
    row.className = 'seat-row';
    for (let k = 0; k < 4; k++) {
      if (k === 2) {
        const lorong = document.createElement('div');
        lorong.className = 'seat-aisle';
        row.appendChild(lorong);
      }
      row.appendChild(buatElemenKursi(baris + huruf[k], terpesan));
    }
    grid.appendChild(row);
  }
  updateInfoKursi();
}

function buatElemenKursi(label, terpesan) {
  const el = document.createElement('div');
  el.className = 'seat';
  el.textContent = label;
  if (terpesan.indexOf(label) !== -1) {
    el.classList.add('booked');
    el.title = 'Sudah dipesan';
  } else {
    el.classList.add(kursiDipilih.indexOf(label) !== -1 ? 'selected' : 'available');
    el.addEventListener('click', function () { klikKursi(label, el); });
  }
  return el;
}

function klikKursi(label, el) {
  const idx = kursiDipilih.indexOf(label);
  if (idx !== -1) {
    kursiDipilih.splice(idx, 1);
    el.classList.remove('selected');
    el.classList.add('available');
  } else {
    if (kursiDipilih.length >= jumlah) {
      tampilToast('Kamu hanya bisa memilih ' + jumlah + ' kursi.');
      return;
    }
    kursiDipilih.push(label);
    el.classList.remove('available');
    el.classList.add('selected');
  }
  updateInfoKursi();
}

function updateInfoKursi() {
  const info = document.getElementById('seatInfo');
  if (kursiDipilih.length === 0) {
    info.textContent = 'Belum ada kursi dipilih.';
  } else {
    info.textContent = 'Kursi dipilih: ' + kursiDipilih.join(', ') + ' (' + kursiDipilih.length + '/' + jumlah + ')';
  }
  updateRingkasan();
}

function lanjutStep3() {
  if (kursiDipilih.length !== jumlah) {
    tampilToast('Pilih ' + jumlah + ' kursi sesuai jumlah penumpang.');
    return;
  }
  const wadah = document.getElementById('formPenumpangWrap');
  wadah.innerHTML = '';
  for (let i = 0; i < jumlah; i++) {
    const g = document.createElement('div');
    g.className = 'form-group';
    g.innerHTML =
      '<label>Penumpang ' + (i + 1) + ' – Kursi ' + kursiDipilih[i] + ' <span class="req">*</span></label>' +
      '<input type="text" class="form-control" id="namaPenumpang' + i + '" placeholder="Nama sesuai identitas"/>' +
      '<div class="error-msg" id="err-nama' + i + '">Nama penumpang harus diisi.</div>';
    wadah.appendChild(g);
    document.getElementById('namaPenumpang' + i).value = daftarNama[i] || '';
  }

  // isi otomatis dari akun yang sedang login (kalau masih kosong)
  const s = (typeof getSession === 'function') ? getSession() : null;
  if (s) {
    const nama0 = document.getElementById('namaPenumpang0');
    const email = document.getElementById('emailPemesan');
    if (nama0 && !nama0.value) nama0.value = s.nama;
    if (email && !email.value) email.value = s.email;
  }
  tampilStep(3);
}

function lanjutStep4() {
  let ok = true;
  const nama = [];
  for (let i = 0; i < jumlah; i++) {
    const v = document.getElementById('namaPenumpang' + i).value.trim();
    nama.push(v);
    tandaiError('err-nama' + i, 'namaPenumpang' + i, !v);
    if (!v) ok = false;
  }
  const email = document.getElementById('emailPemesan').value.trim();
  const wa = document.getElementById('noWA').value.trim().replace(/[\s-]/g, '');
  const metode = document.getElementById('metodeBayar').value;

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const waOk = /^(\+62|62|0)8[0-9]{7,12}$/.test(wa);
  tandaiError('err-email', 'emailPemesan', !emailOk);
  tandaiError('err-wa', 'noWA', !waOk);
  tandaiError('err-bayar', 'metodeBayar', !metode);
  if (!emailOk || !waOk || !metode) ok = false;
  if (!ok) return;

  daftarNama = nama;
  dataPesanan = { nama: nama, email: email, wa: wa, metode: metode };
  tampilKonfirmasi();
  tampilStep(4);
}

function tampilKonfirmasi() {
  const f = ambilForm();
  const satuan = hargaRute(f.asal, f.tujuan, f.kelas);
  const total = satuan * jumlah;
  const diskon = Math.round(total * promoDiskon);

  let html = '<div class="order-summary">';
  html += '<div class="summary-row"><span>Rute</span><span class="sum-bold">' + aman(f.asal) + ' → ' + aman(f.tujuan) + '</span></div>';
  html += '<div class="summary-row"><span>Tanggal</span><span>' + formatTanggal(f.tgl) + '</span></div>';
  html += '<div class="summary-row"><span>Kelas</span><span>' + NAMA_KELAS[f.kelas] + '</span></div>';
  for (let i = 0; i < dataPesanan.nama.length; i++) {
    html += '<div class="summary-row"><span>Penumpang ' + (i + 1) + ' (Kursi ' + kursiDipilih[i] + ')</span><span>' + aman(dataPesanan.nama[i]) + '</span></div>';
  }
  html += '<div class="summary-row"><span>Email</span><span>' + aman(dataPesanan.email) + '</span></div>';
  html += '<div class="summary-row"><span>WhatsApp</span><span>' + aman(dataPesanan.wa) + '</span></div>';
  html += '<div class="summary-row"><span>Pembayaran</span><span>' + NAMA_BAYAR[dataPesanan.metode] + '</span></div>';
  html += '<div class="summary-row"><span>Diskon</span><span class="sum-diskon">' + (diskon ? '- ' + formatRupiah(diskon) : 'Rp 0') + '</span></div>';
  html += '<div class="summary-row total"><span>Total Bayar</span><span>' + formatRupiah(total - diskon) + '</span></div>';
  html += '</div>';
  document.getElementById('konfirmasiDetail').innerHTML = html;
}

function buatKodeBooking() {
  const huruf = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let kode = 'BK';
  for (let i = 0; i < 6; i++) {
    kode += huruf.charAt(Math.floor(Math.random() * huruf.length));
  }
  return kode;
}

function bayarSekarang() {
  const f = ambilForm();
  const kode = buatKodeBooking();
  const riwayat = bacaRiwayat();

  for (let i = 0; i < dataPesanan.nama.length; i++) {
    riwayat.push({
      kode: kode,
      nama: dataPesanan.nama[i],
      rute: f.asal + ' → ' + f.tujuan,
      email: dataPesanan.email,
      tanggal: f.tgl,
      kursi: kursiDipilih[i],
      kunci: kunciKursi
    });
  }
  simpanRiwayat(riwayat);

  document.getElementById('kodeBooking').textContent = kode;
  kursiDipilih = [];
  kunciKursi = '';
  tampilkanRiwayat();
  updateRingkasan();
  tampilStep(5);
  tampilToast('🎉 Pembayaran berhasil!');
}

function tampilkanRiwayat() {
  const riwayat = bacaRiwayat();
  const tbody = document.getElementById('tabelRiwayatPemesanan');
  document.getElementById('riwayatCount').textContent = riwayat.length;

  if (riwayat.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="riwayat-empty">Belum ada pesanan yang tercatat</td></tr>';
    return;
  }
  let html = '';
  for (let i = 0; i < riwayat.length; i++) {
    const r = riwayat[i];
    html += '<tr>' +
      '<td class="riwayat-no">' + (i + 1) + '</td>' +
      '<td class="riwayat-nama">' + aman(r.nama) + '</td>' +
      '<td class="riwayat-rute">' + aman(r.rute) + '</td>' +
      '<td class="riwayat-email">' + aman(r.email) + '</td>' +
      '<td>' + formatTanggal(r.tanggal) + '</td>' +
      '</tr>';
  }
  tbody.innerHTML = html;
}

function hapusRiwayatPemesanan() {
  if (bacaRiwayat().length === 0) {
    tampilToast('Riwayat masih kosong.');
    return;
  }
  if (!confirm('Hapus semua riwayat pemesanan?')) return;
  try { localStorage.removeItem(RIWAYAT_KEY); } catch (e) {}
  tampilkanRiwayat();
  tampilToast('🗑️ Riwayat dihapus.');
}

// isi form otomatis dari link (?asal=...&tujuan=...&tgl=...)
function isiDariURL() {
  const p = new URLSearchParams(window.location.search);
  if (p.get('asal'))   document.getElementById('kotaAsal').value = p.get('asal');
  if (p.get('tujuan')) document.getElementById('kotaTujuan').value = p.get('tujuan');
  if (p.get('tgl'))    document.getElementById('tanggalBrgkt').value = p.get('tgl');
  if (p.get('kelas'))  document.getElementById('kelasLayanan').value = p.get('kelas');
}

// ════════════════════════════════
// BERITA (berita.html)
// Data berita & pengumuman, kartu berita bergambar, tabel filter/sort/pagination, modal detail
// ════════════════════════════════

// ───── DATA BERITA ─────
// data berita yang ditampilkan sebagai kartu di #beritaGrid
const beritaData = [
  {
    judul: "Cara Mendapatkan Diskon Pelajar di BusKu:",
    ringkasan: "Mahasiswa dan pelajar bisa hemat hingga 10% dengan program khusus BusKu Student. Begini cara daftarnya.",
    tanggal: "5 Juni 2026",
    kategori: "promo",
    gambar: "img/diskon.png"
  },
  {
    judul: "BusKu Luncurkan Fitur Lacak Bus Real-Time di Aplikasi Terbaru",
    ringkasan: "Kini penumpang bisa memantau posisi bus secara langsung melalui peta interaktif di aplikasi BusKu versi 3.0.",
    tanggal: "20 Mei 2026",
    kategori: "operasional",
    gambar: "img/pelacakan.png"
  },
  {
    judul: "BusKu Renovasi Terminal dengan Fasilitas Modern untuk Kenyamanan Penumpang",
    ringkasan: "BusKu melakukan renovasi terminal dengan menghadirkan fasilitas modern seperti ruang tunggu nyaman, area charging, dan sistem tiket digital untuk meningkatkan kenyamanan penumpang.",
    tanggal: "1 Mei 2026",
    kategori: "Operasional",
    gambar: "img/renov.png"
  },
  {
    judul: "Destinasi Wisata Terpopuler yang Bisa Dijangkau Naik Bus dari Medan",
    ringkasan: "Liburan hemat dan seru! Ini dia 8 destinasi wisata terbaik yang bisa kamu kunjungi langsung dengan bus dari kota-kota di Medan.",
    tanggal: "12 April 2026",
    kategori: "Operasional",
    gambar: "img/DestinasiWisata.png"
  },
  {
    judul: "Bayar Tiket Bus Kini Lebih Mudah dengan QRIS dan Dompet Digital",
    ringkasan: "BusKu kini mendukung lebih dari 12 metode pembayaran termasuk GoPay, OVO, Dana, ShopeePay, dan semua bank nasional.",
    tanggal: "3 April 2026",
    kategori: "Kebijakan",
    gambar: "img/qrisBus.png"
  },
  {
    judul: "5 Tips Agar Perjalanan Bus Malam Tetap Nyaman dan Aman",
    ringkasan: "Perjalanan malam dengan bus bisa sangat menyenangkan jika kamu tahu triknya. Simak panduan lengkap dari tim BusKu.",
    tanggal: "28 Maret 2026",
    kategori: "Operasional",
    gambar: "img/perjalananMalam.png"
  },
];
 
// ───── DATA PENGUMUMAN ─────
// data arsip pengumuman resmi yang ditampilkan di tabel riwayat pengumuman
const pengumumanData = [
  { judul:"Cara Mendapatkan Diskon Pelajar di BusKu", kategori:"Promo", tanggal:"2026-08-01", status:"Akan Datang" },
  { judul:"Armada Bus Baru Rute Aceh–Medan Beroperasi", kategori:"Armada", tanggal:"2026-06-05", status:"Aktif" },
  { judul:"Diskon Lebaran 30% Semua Rute", kategori:"Promo", tanggal:"2026-04-20", status:"Berakhir" },
  { judul:"BusKu Luncurkan Fitur Lacak Bus Real-Time di Aplikasi Terbaru", kategori:"Operasional", tanggal:"2025-05-01", status:"Aktif" },
  { judul:"Reschedule Gratis Diberlakukan Mulai April 2026", kategori:"Kebijakan", tanggal:"2026-04-03", status:"Aktif" },
  { judul:"Rute Baru Medan–siantar Dibuka", kategori:"Operasional", tanggal:"2026-03-28", status:"Aktif" },
  { judul:"Promo Akhir Tahun 25% Untuk Member", kategori:"Promo", tanggal:"2026-12-20", status:"Akan Datang" },
  { judul:"Perubahan Terminal Keberangkatan Yogyakarta", kategori:"Operasional", tanggal:"2025-11-15", status:"Berakhir" },
  { judul:"Peluncuran Program Loyalitas BusPoints", kategori:"Kebijakan", tanggal:"2026-05-01", status:"Aktif" },
  { judul:"BusKu Renovasi Terminal dengan Fasilitas Modern untuk Kenyamanan Penumpang", kategori:"Armada", tanggal:"2025-09-10", status:"Berakhir" },
  { judul:"Bayar Tiket Bus Kini Lebih Mudah dengan QRIS dan Dompet Digital", kategori:"Kebijakan", tanggal:"2026-04-03", status:"Aktif" },
  { judul:"Promo Double Miles Akhir Pekan", kategori:"Promo", tanggal:"2024-07-01", status:"Berakhir" },
];
 
// ───── STATE ─────
// state tabel pengumuman: data hasil filter, kunci & arah sort, halaman aktif
let filteredData = [...pengumumanData];
let sortKey = '';
let sortAsc = true;
let currentPage = 1;
const perPage = 6;
 
// ───── RENDER BERITAA ─────
// fungsi untuk merender kartu-kartu berita ke #beritaGrid
function renderBerita() {
  const grid = document.getElementById('beritaGrid');
  grid.innerHTML = beritaData.map(b => `
    <div class="berita-card">
      <div class="berita-image-wrapper">
        <img src="${b.gambar}" alt="${b.judul}" class="berita-img-content" onerror="this.src='img/placeholder.png';">
      </div>
      <div class="berita-body">
        <span class="card-tag">${b.kategori}</span>
        <h3>${b.judul}</h3>
        <p>${b.ringkasan}</p>
        <div class="berita-meta">
          <span>📅 ${b.tanggal}</span>
          <a href="#" style="color:var(--accent); font-weight:600;" onclick="bukaBerita('${encodeURIComponent(JSON.stringify(b))}'); return false;">Baca →</a>
        </div>
      </div>
    </div>
  `).join('');
}
 
// ───── RENDER TABEL ─────
// fungsi untuk merender tabel riwayat pengumuman sesuai halaman pagination & filter yang aktif
function renderTabel() {
  const tbody = document.getElementById('tabelBody');
  const foot  = document.getElementById('tabelFoot');
  const start = (currentPage - 1) * perPage;
  const slice = filteredData.slice(start, start + perPage);
 
  if (slice.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--muted);">Tidak ada pengumuman ditemukan.</td></tr>`;
    foot.textContent = 'Tidak ada data.';
    renderPaginasi();
    return;
  }
 
  const badgeMap = { Aktif:'badge-success', Berakhir:'badge-danger', 'Akan Datang':'badge-info' };
 
  tbody.innerHTML = slice.map((d, i) => `
    <tr>
      <td style="color:var(--muted); font-size:.82rem;">${start + i + 1}</td>
      <td style="font-weight:600; max-width:280px;">${d.judul}</td>
      <td><span class="badge badge-info">${d.kategori}</span></td>
      <td>${new Date(d.tanggal).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</td>
      <td><span class="badge ${badgeMap[d.status]}">${d.status}</span></td>
      <td><button class="btn btn-outline btn-sm" onclick="lihatDetail(${pengumumanData.indexOf(d)})">Detail</button></td>
    </tr>
  `).join('');
 
  foot.textContent = `Menampilkan ${start+1}–${Math.min(start+perPage, filteredData.length)} dari ${filteredData.length} pengumuman`;
  document.getElementById('jumlahHasil').textContent = `${filteredData.length} hasil`;
  renderPaginasi();
}
 
// ───── FILTER ─────
// fungsi untuk memfilter data pengumuman berdasarkan kata kunci, kategori, dan status
function filterTabel() {
  const q = document.getElementById('searchPengumuman').value.toLowerCase();
  const kat = document.getElementById('filterKategori').value;
  const stat = document.getElementById('filterStatus').value;
  filteredData = pengumumanData.filter(d => {
    return (!q || d.judul.toLowerCase().includes(q) || d.kategori.toLowerCase().includes(q))
      && (!kat || d.kategori === kat)
      && (!stat || d.status === stat);
  });
  currentPage = 1;
  renderTabel();
}
 
// fungsi untuk mengembalikan semua filter tabel pengumuman ke kondisi awal
function resetFilter() {
  document.getElementById('searchPengumuman').value = '';
  document.getElementById('filterKategori').value = '';
  document.getElementById('filterStatus').value = '';
  filteredData = [...pengumumanData];
  currentPage = 1;
  renderTabel();
}
 
// ───── SORT ─────
// fungsi untuk mengurutkan tabel pengumuman berdasarkan kolom (key) yang diklik
function sortTabel(key) {
  if (sortKey === key) sortAsc = !sortAsc;
  else { sortKey = key; sortAsc = true; }
  filteredData.sort((a,b) => {
    const va = a[key]; const vb = b[key];
    return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
  });
  renderTabel();
}
 
// ───── PAGINATION ─────
// fungsi untuk merender tombol-tombol pagination sesuai jumlah halaman hasil filter
function renderPaginasi() {
  const total = Math.ceil(filteredData.length / perPage);
  const wrap = document.getElementById('pagination');
  if (total <= 1) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = Array.from({length:total}, (_,i) => `
    <button class="btn btn-sm ${i+1===currentPage ? 'btn-primary' : 'btn-outline'}" onclick="gantiPage(${i+1})">${i+1}</button>
  `).join('');
}
 
// fungsi untuk berpindah ke halaman tabel tertentu
function gantiPage(n) {
  currentPage = n;
  renderTabel();
  document.querySelector('.section').scrollIntoView({behavior:'smooth'});
}
 
// ───── MODAL ─────
// fungsi untuk menampilkan detail pengumuman pada modal
function lihatDetail(idx) {
  const d = pengumumanData[idx];
  const badgeMap = { Aktif:'badge-success', Berakhir:'badge-danger', 'Akan Datang':'badge-info' };
  document.getElementById('modalContent').innerHTML = `
    <span class="badge ${badgeMap[d.status]}" style="margin-bottom:.8rem;">${d.status}</span>
    <h3 style="font-size:1.15rem; font-weight:700; color:var(--primary); margin-bottom:.6rem;">${d.judul}</h3>
    <div style="display:flex; gap:.8rem; font-size:.85rem; color:var(--muted); margin-bottom:1rem;">
      <span>📅 ${new Date(d.tanggal).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span>
      <span>🏷️ ${d.kategori}</span>
    </div>
    <p style="font-size:.9rem; color:var(--text); line-height:1.7;">Detail lengkap pengumuman ini akan tersedia segera. Untuk informasi lebih lanjut, hubungi tim layanan pelanggan BusKu di <strong>0800-123-4567</strong>.</p>
    <div style="margin-top:1.2rem; display:flex; justify-content:flex-end;">
      <button class="btn btn-primary btn-sm" onclick="tutupModal()">Tutup</button>
    </div>
  `;
  document.getElementById('modalOverlay').style.display = 'flex';
}
 
// fungsi untuk menampilkan detail berita pada modal
function bukaBerita(encoded) {
  const b = JSON.parse(decodeURIComponent(encoded));
  document.getElementById('modalContent').innerHTML = `
    <span class="badge badge-info" style="margin-bottom:.8rem;">${b.kategori}</span>
    <h3 style="font-size:1.2rem; font-weight:700; color:var(--primary); margin-bottom:.6rem;">${b.judul}</h3>
    <div style="font-size:.83rem; color:var(--muted); margin-bottom:1rem;">📅 ${b.tanggal}</div>
    <p style="font-size:.92rem; color:var(--text); line-height:1.8;">${b.ringkasan}</p>
    <div style="margin-top:1.2rem;">
      <button class="btn btn-primary btn-sm" onclick="tutupModal()">Tutup</button>
    </div>
  `;
  document.getElementById('modalOverlay').style.display = 'flex';
}
 
// fungsi untuk menutup modal yang sedang terbuka
function tutupModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

// ════════════════════════════════
// BANTUAN (bantuan.html)
// ════════════════════════════════
function buatItemFAQ(f) {
  const item = document.createElement('div');
  item.className = 'faq-item';

  const q = document.createElement('button');
  q.type = 'button';
  q.className = 'faq-q';
  const teks = document.createElement('span');
  teks.textContent = f.q;
  const ikon = document.createElement('span');
  ikon.className = 'faq-icon';
  ikon.textContent = '+';
  q.appendChild(teks);
  q.appendChild(ikon);

  const a = document.createElement('div');
  a.className = 'faq-a';
  a.textContent = f.a;

  q.addEventListener('click', function () {
    const sudahBuka = a.classList.contains('open');
    // tutup semua dulu
    const semuaQ = document.querySelectorAll('#faqList .faq-q');
    const semuaA = document.querySelectorAll('#faqList .faq-a');
    for (let i = 0; i < semuaQ.length; i++) {
      semuaQ[i].classList.remove('open');
      semuaA[i].classList.remove('open');
    }
    if (!sudahBuka) {
      q.classList.add('open');
      a.classList.add('open');
    }
  });

  item.appendChild(q);
  item.appendChild(a);
  return item;
}

function filterFAQ() {
  const cari = document.getElementById('cariFAQ').value.trim().toLowerCase();
  const wadah = document.getElementById('faqList');
  wadah.innerHTML = '';
  let ada = false;
  for (let i = 0; i < DATA_FAQ.length; i++) {
    const f = DATA_FAQ[i];
    if (f.q.toLowerCase().indexOf(cari) !== -1 || f.a.toLowerCase().indexOf(cari) !== -1) {
      wadah.appendChild(buatItemFAQ(f));
      ada = true;
    }
  }
  if (!ada) {
    wadah.innerHTML = '<p class="text-muted-sm">Pertanyaan tidak ditemukan. Silakan hubungi kami lewat formulir.</p>';
  }
}

function setRating(n) {
  const bintang = document.querySelectorAll('#ratingWrap .star');
  for (let i = 0; i < bintang.length; i++) {
    bintang[i].textContent = (i < n) ? '★' : '☆';
  }
  document.getElementById('nilaiRating').value = n;
}

function updateCharCount() {
  const len = document.getElementById('kontakPesan').value.length;
  document.getElementById('charCount').textContent = len + ' / 500 karakter';
}

function kirimKontak() {
  const nama = document.getElementById('kontakNama').value.trim();
  const email = document.getElementById('kontakEmail').value.trim();
  const topik = document.getElementById('kontakTopik').value;
  const pesan = document.getElementById('kontakPesan').value.trim();

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  tandaiError('err-kNama', 'kontakNama', !nama);
  tandaiError('err-kEmail', 'kontakEmail', !emailOk);
  tandaiError('err-kTopik', 'kontakTopik', !topik);
  tandaiError('err-kPesan', 'kontakPesan', !pesan);
  if (!nama || !emailOk || !topik || !pesan) return;

  document.getElementById('alertKontak').innerHTML =
    '<div class="alert alert-success">✅ Terima kasih, ' + aman(nama) + '! Pesan Anda sudah kami terima dan akan dibalas dalam 1x24 jam.</div>';
  tampilToast('📤 Pesan terkirim!');

  document.getElementById('kontakNama').value = '';
  document.getElementById('kontakEmail').value = '';
  document.getElementById('kontakTelp').value = '';
  document.getElementById('kontakTopik').value = '';
  document.getElementById('kontakPesan').value = '';
  document.getElementById('kontakKode').value = '';
  setRating(0);
  updateCharCount();
}

// ════════════════════════════════
// JALANKAN SAAT HALAMAN DIMUAT
// ════════════════════════════════
function mulai() {
  // batas tanggal: tidak boleh sebelum hari ini
  const idTanggal = ['tglBerangkat', 'tanggalBrgkt'];
  for (let i = 0; i < idTanggal.length; i++) {
    const el = document.getElementById(idTanggal[i]);
    if (el) el.min = hariIniStr();
  }

  // halaman utama
  if (document.getElementById('ruteCards')) {
    buatKartuRute();
    animasiAngka('statPenumpang', 25000, false, '+');
    animasiAngka('statRute', 500, false, '+');
    animasiAngka('statArmada', 350, false, '+');
    animasiAngka('statRating', 4.8, true, '/5');
  }

  // pesan tiket
  if (document.getElementById('panel1')) {
    isiDariURL();
    updateRingkasan();
    tampilkanRiwayat();
    document.getElementById('tanggalBrgkt').addEventListener('change', updateRingkasan);
  }

  // berita
  if (document.getElementById('beritaGrid')) {
    renderBerita();
    renderTabel();
    const overlay = document.getElementById('modalOverlay');
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) tutupModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') tutupModal();
    });
  }

  // bantuan
  if (document.getElementById('faqList')) {
    filterFAQ();
    const kotak = document.getElementById('kontakPesan');
    kotak.setAttribute('maxlength', 500);
    kotak.addEventListener('input', updateCharCount);
  }
}

// jalankan setelah seluruh halaman selesai dimuat
document.addEventListener('DOMContentLoaded', mulai);