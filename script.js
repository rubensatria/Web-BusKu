/* ================================
   JAVASCRIPT — BusKu
   DOM, Event Handling, Render Data, Multi-Step Form, localStorage
   ================================ */
 
// Catatan struktur: file ini disusun per halaman (Beranda, Pesan Tiket, Berita, Bantuan).
// Tiap halaman ditandai dengan blok komentar ═══ di bawah, lalu dipecah lagi jadi
// sub-bagian dengan blok ───. Karena satu script.js dipakai bersama oleh semua
// halaman, beberapa fungsi util (mis. showToast) sengaja didefinisikan ulang
// di tiap bagian — masing-masing hanya aktif sesuai elemen yang ada di halaman itu.
 
// ════════════════════════════════
// HALAMAN BERANDA (halaman.html)
// Data rute populer, kartu rute, pencarian tiket cepat, animasi counter statistik
// ════════════════════════════════
 
// data rute populer yang ditampilkan sebagai kartu di halaman beranda
const ruteData = [
  { dari:"Banda Aceh", ke:"Medan", harga:"Rp 135.000", durasi:"8 jam", kelas:"Ekonomi AC" },
  { dari:"Medan", ke:"Jakarta", harga:"Rp 280.000", durasi:"24 jam", kelas:"VIP Sleeper" },
  { dari:"Jakarta", ke:"Surabaya", harga:"Rp 175.000", durasi:"12 jam", kelas:"Eksekutif" },
  { dari:"Surabaya", ke:"Bali", harga:"Rp 120.000", durasi:"5 jam", kelas:"Ekonomi AC" },
  { dari:"Padang", ke:"Pekanbaru", harga:"Rp 95.000", durasi:"6 jam", kelas:"Ekonomi AC" },
  { dari:"Makassar", ke:"Pare-Pare", harga:"Rp 75.000", durasi:"4 jam", kelas:"Ekonomi AC" },
];
 
// Pemetaan label kelas (dipakai di kartu rute) -> value pada <select> kelasLayanan di pesananTiket.html
const KELAS_LABEL_TO_VALUE = { 'Ekonomi AC': 'ekonomi', 'Eksekutif': 'eksekutif', 'VIP Sleeper': 'vip' };
 
// Pemetaan harga khusus per rute (diambil dari kartu Rute Populer di halaman.html)
// Key: "kotaAsal|kotaTujuan|kelas" -> harga dalam angka (bukan string)
// Dipakai di pesananTiket.html supaya harga yang muncul saat checkout SAMA dengan yang ditampilkan di kartu rute populer
const RUTE_HARGA_MAP = {};
ruteData.forEach(r => {
  const kelasVal = KELAS_LABEL_TO_VALUE[r.kelas] || '';
  const angkaHarga = parseInt(r.harga.replace(/[^0-9]/g, ''), 10);
  RUTE_HARGA_MAP[`${r.dari}|${r.ke}|${kelasVal}`] = angkaHarga;
});
 
// fungsi untuk merender kartu-kartu rute populer ke dalam #ruteCards berdasarkan ruteData
function renderRuteCards() {
  const wrap = document.getElementById('ruteCards');
  wrap.innerHTML = ruteData.map(r => {
    const kelasVal = KELAS_LABEL_TO_VALUE[r.kelas] || '';
    const link = `pesananTiket.html?dari=${encodeURIComponent(r.dari)}&ke=${encodeURIComponent(r.ke)}&kelas=${encodeURIComponent(kelasVal)}`;
    return `
    <div class="card">
      <div class="card-body" style="padding:1.3rem;">
        <span class="card-tag">${r.kelas}</span>
        <h3 style="font-size:1.05rem;">${r.dari} → ${r.ke}</h3>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:.8rem;">
          <div>
            <div style="font-size:1.2rem; font-weight:800; color:var(--accent);">${r.harga}</div>
            <div style="font-size:.78rem; color:var(--muted);">⏱ ${r.durasi}</div>
          </div>
          <a href="${link}" class="btn btn-outline btn-sm">Pesan</a>
        </div>
      </div>
    </div>
  `;
  }).join('');
}
 
// ───── COUNTER ANIMASI ─────
// fungsi untuk menganimasikan angka counter dari 0 ke nilai target (dipakai pada statistik di halaman beranda)
function animateCounter(id, target, suffix = '', decimals = 0) {
  let start = 0;
  const step = target / 60;
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    document.getElementById(id).textContent = decimals
      ? start.toFixed(decimals) + suffix
      : Math.floor(start).toLocaleString('id') + suffix;
  }, 25);
}
 
// ───── CARI TIKET ─────
// fungsi untuk menangani submit form pencarian tiket di hero, lalu redirect ke halaman pesan tiket dengan query params
function cariTiket(e) {
  e.preventDefault();
  const asal = document.getElementById('asalKota').value;
  const tujuan = document.getElementById('tujuanKota').value;
  const tgl = document.getElementById('tglBerangkat').value;
  if (asal === tujuan) {
    showToast('⚠️ Kota asal dan tujuan tidak boleh sama!');
    return;
  }
  const params = new URLSearchParams({ dari: asal, ke: tujuan });
  if (tgl) params.set('tgl', tgl);
  window.location.href = `pesananTiket.html?${params.toString()}`;
}
 
// ───── TOAST ─────
// fungsi untuk menampilkan notifikasi toast sementara di pojok layar
function showToast(msg) {
  const t = document.getElementById('toastMsg');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}
 
// ───── SET TANGGAL MINIMUM (khusus halaman.html) ─────
// batasi input tanggal berangkat agar tidak bisa memilih tanggal yang sudah lewat
if (document.getElementById('tglBerangkat')) {
  document.getElementById('tglBerangkat').min = new Date().toISOString().split('T')[0];
}
 
// ───── INIT (khusus halaman.html) ─────
// render kartu rute populer saat elemen #ruteCards ada di halaman
if (document.getElementById('ruteCards')) {
  renderRuteCards();
}
 
// Jalankan counter saat elemen masuk viewport (halaman.html only)
if (document.getElementById('statPenumpang')) {
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      animateCounter('statPenumpang', 48500, '+');
      animateCounter('statRute', 520, '+');
      animateCounter('statArmada', 210, '+');
      animateCounter('statRating', 4.8, '⭐', 1);
      observer.disconnect();
    }
  });
  observer.observe(document.getElementById('statPenumpang'));
}
 
// ════════════════════════════════
// HALAMAN PESAN TIKET (pesananTiket.html)
// Form multi-step: pilih rute, kursi, data penumpang, konfirmasi, riwayat pemesanan
// ════════════════════════════════
 
// ───── CONFIG ─────
// konfigurasi harga per kelas, daftar kode promo, dan state pemesanan
// (jumlah penumpang, kursi dipilih/terpesan, persentase diskon)
const HARGA = { ekonomi: 80000, eksekutif: 150000, vip: 250000 };
const PROMO = { 'BUSHEMAT30': .30, 'HEMAT10': .10, 'NEWUSER': .15 };
let jumlahPenumpang = 1;
let kursiDipilih = [];
let kursiTerpesan = [3, 7, 12, 18, 24]; // index seat terpesan
let diskonPersen = 0;
 
// ───── UTILS ─────
// fungsi untuk memformat angka menjadi format Rupiah
function fmt(n) { return 'Rp ' + n.toLocaleString('id'); }
// fungsi untuk menampilkan notifikasi toast sementara di pojok layar
function showToast(msg) {
  const t = document.getElementById('toastMsg');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}
// fungsi untuk berpindah antar step form pemesanan (indikator step + panel yang ditampilkan)
function setStep(n) {
  for (let i = 1; i <= 4; i++) {
    const ind = document.getElementById('step'+i+'Ind');
    ind.classList.remove('active','done');
    if (i < n) ind.classList.add('done');
    else if (i === n) ind.classList.add('active');
  }
  for (let i = 1; i <= 5; i++) {
    document.getElementById('panel'+i).style.display = i === n ? 'block' : 'none';
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
 
// ───── COUNTER PENUMPANG ─────
// fungsi untuk menambah/mengurangi jumlah penumpang (dibatasi 1–4 orang)
function ubahPenumpang(delta) {
  jumlahPenumpang = Math.min(4, Math.max(1, jumlahPenumpang + delta));
  document.getElementById('jmlPenumpang').textContent = jumlahPenumpang;
  kursiDipilih = [];
  hitungHarga();
  updateSummary();
}
 
// ───── HARGA ─────
// fungsi untuk menghitung dan menampilkan harga satuan, diskon, dan total ke ringkasan pesanan
function hitungHarga() {
  const kelas = document.getElementById('kelasLayanan').value;
  const asal  = document.getElementById('kotaAsal').value;
  const tujuan= document.getElementById('kotaTujuan').value;
  const tgl   = document.getElementById('tanggalBrgkt').value;
 
  const kelasLabel = { ekonomi:'Ekonomi AC', eksekutif:'Eksekutif', vip:'VIP Sleeper' };
 
  // Cek dulu apakah rute + kelas yang dipilih cocok dengan salah satu Rute Populer.
  // Kalau cocok, pakai harga khusus rute itu (sama seperti yang tampil di kartu halaman beranda).
  // Kalau tidak cocok (kombinasi kota manual), fallback ke harga generik per kelas.
  const kunciRute = `${asal}|${tujuan}|${kelas}`;
  const hargaSatuan = kelas ? (RUTE_HARGA_MAP[kunciRute] ?? HARGA[kelas]) : 0;
 
  const total = hargaSatuan * jumlahPenumpang;
  const diskon = Math.round(total * diskonPersen);
  const bayar = total - diskon;
 
  document.getElementById('sumRute').textContent      = (asal && tujuan) ? `${asal} → ${tujuan}` : '–';
  document.getElementById('sumTanggal').textContent   = tgl ? new Date(tgl).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '–';
  document.getElementById('sumKelas').textContent     = kelas ? kelasLabel[kelas] : '–';
  document.getElementById('sumPenumpang').textContent = jumlahPenumpang + ' orang';
  document.getElementById('sumHargaSatuan').textContent = hargaSatuan ? fmt(hargaSatuan) : '–';
  document.getElementById('sumDiskon').textContent    = diskon > 0 ? '−' + fmt(diskon) : 'Rp 0';
  document.getElementById('sumTotal').textContent     = bayar > 0 ? fmt(bayar) : '–';
}
 
// fungsi untuk memperbarui ringkasan pesanan (kursi terpilih) setelah hitungHarga()
function updateSummary() {
  hitungHarga();
  document.getElementById('sumKursi').textContent = kursiDipilih.length ? kursiDipilih.join(', ') : '–';
}
 
// ───── PROMO ─────
// fungsi untuk memvalidasi kode promo yang diinput dan menerapkannya ke diskonPersen
function terapkanPromo() {
  const kode = document.getElementById('kodePromo').value.trim().toUpperCase();
  const info = document.getElementById('promoInfo');
  if (PROMO[kode]) {
    diskonPersen = PROMO[kode];
    info.innerHTML = `<span style="color:var(--success);">✅ Promo berhasil! Diskon ${diskonPersen*100}% diterapkan.</span>`;
    showToast('🎉 Kode promo berhasil diterapkan!');
  } else {
    diskonPersen = 0;
    info.innerHTML = `<span style="color:var(--danger);">❌ Kode promo tidak valid atau sudah kadaluarsa.</span>`;
  }
  hitungHarga();
}
 
// ───── SEAT PICKER ─────
// fungsi untuk merender denah kursi bus (status tersedia / dipilih / terpesan)
function renderSeat() {
  const grid = document.getElementById('seatGrid');
  const layout = [
    ['A1','A2',null,'A3','A4'],
    ['B1','B2',null,'B3','B4'],
    ['C1','C2',null,'C3','C4'],
    ['D1','D2',null,'D3','D4'],
    ['E1','E2',null,'E3','E4'],
    ['F1','F2',null,'F3','F4'],
    ['G1','G2',null,'G3','G4'],
  ];
  let idx = 0;
  grid.innerHTML = layout.map(row => {
    return '<div class="seat-row">' + row.map(seat => {
      if (!seat) return '<div class="seat-aisle"></div>';
      const i = idx++;
      const isBooked = kursiTerpesan.includes(i);
      const isSelected = kursiDipilih.includes(seat);
      const cls = isBooked ? 'booked' : isSelected ? 'selected' : 'available';
      return `<div class="seat ${cls}" id="seat-${seat}" onclick="toggleSeat('${seat}',${isBooked})">${seat}</div>`;
    }).join('') + '</div>';
  }).join('');
}
 
// fungsi untuk memilih/membatalkan pilihan kursi saat diklik, lalu memperbarui info & ringkasan
function toggleSeat(id, booked) {
  if (booked) { showToast('⚠️ Kursi ini sudah dipesan.'); return; }
  const idx = kursiDipilih.indexOf(id);
  if (idx > -1) {
    kursiDipilih.splice(idx, 1);
  } else {
    if (kursiDipilih.length >= jumlahPenumpang) {
      showToast(`⚠️ Anda hanya bisa memilih ${jumlahPenumpang} kursi.`);
      return;
    }
    kursiDipilih.push(id);
  }
  renderSeat();
  const info = document.getElementById('seatInfo');
  info.textContent = kursiDipilih.length
    ? `Kursi terpilih: ${kursiDipilih.join(', ')} (${kursiDipilih.length}/${jumlahPenumpang})`
    : 'Belum ada kursi dipilih.';
  updateSummary();
}
 
// ───── FORM PENUMPANG DINAMIS ─────
// fungsi untuk merender form data penumpang sebanyak jumlahPenumpang yang dipilih
function renderFormPenumpang() {
  const wrap = document.getElementById('formPenumpangWrap');
  wrap.innerHTML = Array.from({length: jumlahPenumpang}, (_, i) => `
    <div style="border:1.5px solid var(--border); border-radius:8px; padding:1.1rem; margin-bottom:1rem;">
      <div style="font-weight:700; font-size:.92rem; color:var(--primary); margin-bottom:.8rem;">Penumpang ${i+1} ${kursiDipilih[i] ? '– Kursi ' + kursiDipilih[i] : ''}</div>
      <div class="form-row">
        <div class="form-group">
          <label>Nama Lengkap <span class="req">*</span></label>
          <input type="text" class="form-control" id="nama_${i}" placeholder="Sesuai KTP"/>
        </div>
        <div class="form-group">
          <label>No. KTP / Identitas <span class="req">*</span></label>
          <input type="text" class="form-control" id="ktp_${i}" maxlength="16" placeholder="16 digit"/>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Jenis Kelamin</label>
          <select class="form-control" id="jk_${i}">
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tanggal Lahir</label>
          <input type="date" class="form-control" id="tl_${i}"/>
        </div>
      </div>
    </div>
  `).join('');
}
 
// ───── VALIDASI & NAVIGASI STEP ─────
// fungsi untuk memvalidasi Step 1 (rute & jadwal) sebelum lanjut ke Step 2 (pilih kursi)
function lanjutStep2() {
  const asal   = document.getElementById('kotaAsal').value;
  const tujuan = document.getElementById('kotaTujuan').value;
  const tgl    = document.getElementById('tanggalBrgkt').value;
  const kelas  = document.getElementById('kelasLayanan').value;
  let ok = true;
 
  const show = (id, show) => { document.getElementById(id).classList.toggle('show', show); };
  const markErr = (id, err) => { document.getElementById(id).classList.toggle('error', err); };
 
  show('err-asal',  !asal);   markErr('kotaAsal',  !asal);
  show('err-tujuan',!tujuan); markErr('kotaTujuan',!tujuan);
  show('err-tgl',   !tgl);    markErr('tanggalBrgkt',!tgl);
  show('err-kelas', !kelas);  markErr('kelasLayanan',!kelas);
  if (!asal || !tujuan || !tgl || !kelas) ok = false;
 
  if (asal && tujuan && asal === tujuan) {
    showToast('⚠️ Kota asal dan tujuan tidak boleh sama!');
    ok = false;
  }
 
  if (ok) { renderSeat(); setStep(2); }
}
 
// fungsi untuk memvalidasi pilihan kursi sebelum lanjut ke Step 3 (data penumpang)
function lanjutStep3() {
  if (kursiDipilih.length < jumlahPenumpang) {
    showToast(`⚠️ Pilih ${jumlahPenumpang} kursi terlebih dahulu.`);
    return;
  }
  renderFormPenumpang();
  setStep(3);
}
 
// fungsi untuk memvalidasi data penumpang & kontak, lalu menyusun ringkasan konfirmasi pesanan
function lanjutStep4() {
  const email = document.getElementById('emailPemesan').value;
  const wa    = document.getElementById('noWA').value;
  const bayar = document.getElementById('metodeBayar').value;
  let ok = true;
 
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  document.getElementById('err-email').classList.toggle('show', !emailValid);
  document.getElementById('emailPemesan').classList.toggle('error', !emailValid);
  if (!emailValid) ok = false;
 
  const waValid = /^08[0-9]{8,12}$/.test(wa);
  document.getElementById('err-wa').classList.toggle('show', !waValid);
  document.getElementById('noWA').classList.toggle('error', !waValid);
  if (!waValid) ok = false;
 
  const bayarValid = bayar !== '';
  document.getElementById('err-bayar').classList.toggle('show', !bayarValid);
  if (!bayarValid) ok = false;
 
  // cek nama penumpang
  for (let i = 0; i < jumlahPenumpang; i++) {
    const nama = document.getElementById('nama_'+i)?.value;
    if (!nama) { showToast('⚠️ Nama penumpang ' + (i+1) + ' harus diisi.'); ok = false; break; }
  }
 
  if (!ok) return;
 
  // buat konfirmasi
  const kelas = document.getElementById('kelasLayanan').value;
  const kelasLabel = { ekonomi:'Ekonomi AC', eksekutif:'Eksekutif', vip:'VIP Sleeper' };
  const hargaSatuan = HARGA[kelas];
  const total  = hargaSatuan * jumlahPenumpang;
  const diskon = Math.round(total * diskonPersen);
  const bayarTotal = total - diskon;
  const namaList = Array.from({length:jumlahPenumpang}, (_,i) => document.getElementById('nama_'+i).value);
  const metodeLabel = { qris:'QRIS', bni:'Transfer BNI', bca:'Transfer BCA', mandiri:'Transfer Mandiri', gopay:'GoPay', ovo:'OVO' };
 
  document.getElementById('konfirmasiDetail').innerHTML = `
    <div class="alert alert-info" style="margin-bottom:1rem;">Harap periksa kembali detail pesanan Anda sebelum membayar.</div>
    <div class="order-summary">
      <h4>Detail Perjalanan</h4>
      <div class="summary-row"><span>Rute</span><span style="font-weight:600;">${document.getElementById('kotaAsal').value} → ${document.getElementById('kotaTujuan').value}</span></div>
      <div class="summary-row"><span>Tanggal</span><span>${new Date(document.getElementById('tanggalBrgkt').value).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span></div>
      <div class="summary-row"><span>Kelas</span><span>${kelasLabel[kelas]}</span></div>
      <div class="summary-row"><span>Kursi</span><span>${kursiDipilih.join(', ')}</span></div>
      <div class="summary-row"><span>Penumpang</span><span>${namaList.join(', ')}</span></div>
      <div class="summary-row"><span>Email</span><span>${email}</span></div>
      <div class="summary-row"><span>WhatsApp</span><span>${wa}</span></div>
      <div class="summary-row"><span>Pembayaran</span><span>${metodeLabel[bayar]}</span></div>
      ${diskon > 0 ? `<div class="summary-row"><span>Diskon (${diskonPersen*100}%)</span><span style="color:var(--success);">−${fmt(diskon)}</span></div>` : ''}
      <div class="summary-row total"><span>Total Bayar</span><span style="color:var(--accent);">${fmt(bayarTotal)}</span></div>
    </div>
  `;
  setStep(4);
}
 
// fungsi untuk kembali ke step sebelumnya
function kembaliStep(n) { setStep(n); }
 
// fungsi untuk memproses pembayaran, membuat kode booking, dan mencatat riwayat pemesanan
function bayarSekarang() {
  const kode = 'BN-' + Math.random().toString(36).toUpperCase().slice(2,8);
  document.getElementById('kodeBooking').textContent = kode;
 
  // Catat pesanan ke Riwayat Pemesanan — satu baris per penumpang
  const asal     = document.getElementById('kotaAsal').value;
  const tujuan   = document.getElementById('kotaTujuan').value;
  const tgl      = document.getElementById('tanggalBrgkt').value;
  const email    = document.getElementById('emailPemesan').value;
  const namaList = Array.from({length: jumlahPenumpang}, (_, i) => document.getElementById('nama_'+i)?.value || '-');
  const tglFmt   = new Date(tgl).toLocaleDateString('id-ID', { day:'numeric', month:'numeric', year:'numeric' });
 
  namaList.forEach(nama => {
    tambahRiwayatPemesanan({
      nama: nama,
      rute: `${asal} → ${tujuan}`,
      email: email,
      tanggal: tglFmt
    });
  });
 
  document.getElementById('panel4').style.display = 'none';
  document.getElementById('panel5').style.display = 'block';
  // Update step semua done
  for (let i = 1; i <= 4; i++) {
    document.getElementById('step'+i+'Ind').classList.remove('active');
    document.getElementById('step'+i+'Ind').classList.add('done');
  }
  showToast('🎉 Pembayaran berhasil! Tiket dikirim ke email Anda.');
}
 
// ───── RIWAYAT PEMESANAN ─────
// Disimpan di localStorage supaya tidak hilang saat pindah halaman / refresh
const RIWAYAT_KEY = 'busnusantara_riwayat_pemesanan';
 
// fungsi untuk memuat riwayat pemesanan dari localStorage
function muatRiwayatPemesanan() {
  try {
    const saved = localStorage.getItem(RIWAYAT_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}
 
// fungsi untuk menyimpan riwayat pemesanan ke localStorage
function simpanRiwayatPemesanan() {
  try {
    localStorage.setItem(RIWAYAT_KEY, JSON.stringify(riwayatPemesananLocal));
  } catch (e) {
    // localStorage tidak tersedia (mis. mode private) — abaikan, tetap jalan di memori
  }
}
 
let riwayatPemesananLocal = muatRiwayatPemesanan();
 
// fungsi untuk menambahkan satu baris riwayat pemesanan baru, lalu menyimpan & merender ulang tabel
function tambahRiwayatPemesanan(data) {
  riwayatPemesananLocal.push(data); // pesanan terbaru tampil di bawah
  simpanRiwayatPemesanan();
  renderTabelRiwayatPemesanan();
}
 
// fungsi untuk merender tabel riwayat pemesanan ke #tabelRiwayatPemesanan
function renderTabelRiwayatPemesanan() {
  const tbody   = document.getElementById('tabelRiwayatPemesanan');
  const countEl = document.getElementById('riwayatCount');
  if (!tbody) return;
 
  if (countEl) countEl.textContent = riwayatPemesananLocal.length;
 
  if (riwayatPemesananLocal.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="riwayat-empty">Belum ada pesanan yang tercatat</td></tr>`;
    return;
  }
 
  tbody.innerHTML = riwayatPemesananLocal.map((r, i) => `
    <tr>
      <td class="riwayat-no">${i + 1}</td>
      <td class="riwayat-nama">${r.nama}</td>
      <td class="riwayat-rute">${r.rute}</td>
      <td class="riwayat-email">${r.email}</td>
      <td>${r.tanggal}</td>
    </tr>
  `).join('');
}
 
// fungsi untuk menghapus seluruh riwayat pemesanan
function hapusRiwayatPemesanan() {
  if (riwayatPemesananLocal.length === 0) return;
  riwayatPemesananLocal = [];
  simpanRiwayatPemesanan();
  renderTabelRiwayatPemesanan();
  showToast('🗑️ Riwayat pemesanan dikosongkan.');
}
 
// ───── INIT (khusus pesananTiket.html) ─────
if (document.getElementById('tanggalBrgkt')) {
  document.getElementById('tanggalBrgkt').min = new Date().toISOString().split('T')[0];
}
 
// Ambil query params dari halaman beranda (pencarian tiket / kartu rute populer)
if (document.getElementById('kotaAsal')) {
  const params = new URLSearchParams(window.location.search);
  if (params.get('dari')) {
    const sel = document.getElementById('kotaAsal');
    [...sel.options].forEach(o => { if (o.text === params.get('dari')) o.selected = true; });
  }
  if (params.get('ke')) {
    const sel = document.getElementById('kotaTujuan');
    [...sel.options].forEach(o => { if (o.text === params.get('ke')) o.selected = true; });
  }
  if (params.get('tgl')) {
    document.getElementById('tanggalBrgkt').value = params.get('tgl');
  }
  if (params.get('kelas')) {
    document.getElementById('kelasLayanan').value = params.get('kelas');
  }
  hitungHarga();
}
 
if (document.getElementById('tabelRiwayatPemesanan')) {
  renderTabelRiwayatPemesanan();
}
 
// ════════════════════════════════
// HALAMAN BERITA (berita.html)
// Data berita & pengumuman, render kartu, tabel filter/sort/pagination, modal detail
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
if (document.getElementById('modalOverlay')) {
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) tutupModal();
  });
}
 
// ───── INIT (khusus berita.html) ─────
if (document.getElementById('beritaGrid')) renderBerita();
if (document.getElementById('tabelBody')) renderTabel();
 
// ════════════════════════════════
// HALAMAN BANTUAN (bantuan.html)
// Data FAQ, pencarian FAQ, form kontak dengan validasi & rating bintang
// ════════════════════════════════
 
// ───── DATA FAQ ─────
// data pertanyaan & jawaban yang ditampilkan di accordion FAQ
const faqData = [
  { q:"Bagaimana cara memesan tiket bus di BusKu?", a:"Kunjungi halaman Pesan Tiket, pilih kota asal dan tujuan, tanggal berangkat, kelas layanan, lalu pilih kursi dan isi data penumpang. Tiket akan langsung dikirim ke email dan WhatsApp Anda setelah pembayaran." },
  { q:"Apa saja metode pembayaran yang tersedia?", a:"Kami mendukung QRIS, transfer bank (BNI, BCA, Mandiri), GoPay, OVO, dan DANA. Semua transaksi diproses secara aman dan terenkripsi." },
  { q:"Bisakah saya membatalkan atau mengubah jadwal tiket?", a:"Ya, tiket bisa di-reschedule hingga 2 jam sebelum keberangkatan tanpa biaya tambahan. Pembatalan dapat dilakukan hingga 6 jam sebelum keberangkatan dengan pengembalian dana 80% dari harga tiket." },
  { q:"Bagaimana cara menggunakan kode promo?", a:"Masukkan kode promo pada kolom yang tersedia di halaman Pesan Tiket setelah memilih rute dan kelas. Klik 'Terapkan' untuk mengaktifkan diskon secara otomatis." },
  { q:"Bagaimana jika saya kehilangan e-tiket?", a:"Tiket dapat dikirim ulang ke email atau WhatsApp yang terdaftar. Hubungi kami di 0800-123-4567 atau gunakan formulir kontak dengan menyertakan kode booking Anda." },
  { q:"Apakah ada bagasi tambahan yang diizinkan?", a:"Setiap penumpang diizinkan membawa bagasi maksimal 20 kg tanpa biaya tambahan. Bagasi lebih dari 20 kg dikenakan biaya Rp 5.000 per kg." },
  { q:"Bagaimana cara melacak posisi bus saya?", a:"Fitur lacak bus tersedia di menu utama website dan aplikasi BusKu. Masukkan kode booking Anda untuk melihat posisi bus secara real-time." },
  { q:"Berapa lama proses refund setelah pembatalan?", a:"Proses refund membutuhkan waktu 3–7 hari kerja tergantung metode pembayaran. Transfer bank biasanya 3 hari kerja, sedangkan e-wallet 1–2 hari kerja." },
];
 
// ───── FAQ ─────
// fungsi untuk merender daftar pertanyaan FAQ ke #faqList
function renderFAQ(data) {
  const list = document.getElementById('faqList');
  if (data.length === 0) {
    list.innerHTML = '<p style="color:var(--muted); font-size:.9rem;">Tidak ada pertanyaan yang cocok.</p>';
    return;
  }
  list.innerHTML = data.map((f, i) => `
    <div class="faq-item">
      <button class="faq-q" onclick="toggleFAQ(${i})" id="faqQ${i}">
        ${f.q}
        <span class="faq-icon">+</span>
      </button>
      <div class="faq-a" id="faqA${i}">${f.a}</div>
    </div>
  `).join('');
}
 
// fungsi untuk membuka/menutup jawaban FAQ (accordion, hanya satu yang terbuka dalam satu waktu)
function toggleFAQ(i) {
  const btn = document.getElementById('faqQ'+i);
  const ans = document.getElementById('faqA'+i);
  const isOpen = btn.classList.contains('open');
  // tutup semua
  document.querySelectorAll('.faq-q').forEach(b => b.classList.remove('open'));
  document.querySelectorAll('.faq-a').forEach(a => a.classList.remove('open'));
  if (!isOpen) { btn.classList.add('open'); ans.classList.add('open'); }
}
 
// fungsi untuk memfilter FAQ berdasarkan kata kunci pencarian
function filterFAQ() {
  const q = document.getElementById('cariFAQ').value.toLowerCase();
  const filtered = faqData.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  renderFAQ(filtered);
}
 
// ───── FORM KONTAK ─────
// batasi & tampilkan sisa karakter pada textarea pesan kontak
if (document.getElementById('kontakPesan')) document.getElementById('kontakPesan').addEventListener('input', function() {
  const len = this.value.length;
  if (len > 500) this.value = this.value.slice(0, 500);
  document.getElementById('charCount').textContent = Math.min(len, 500) + ' / 500 karakter';
});
 
let nilaiRating = 0;
// fungsi untuk mengatur nilai rating bintang yang dipilih pengguna
function setRating(n) {
  nilaiRating = n;
  document.getElementById('nilaiRating').value = n;
  document.querySelectorAll('.star').forEach(s => {
    s.textContent = parseInt(s.dataset.v) <= n ? '★' : '☆';
    s.style.color = parseInt(s.dataset.v) <= n ? 'var(--accent)' : '#ccc';
  });
}
 
// fungsi untuk memvalidasi dan mengirim form kontak, lalu menampilkan alert sukses & mereset form
function kirimKontak() {
  const nama  = document.getElementById('kontakNama').value.trim();
  const email = document.getElementById('kontakEmail').value.trim();
  const topik = document.getElementById('kontakTopik').value;
  const pesan = document.getElementById('kontakPesan').value.trim();
  const alertBox = document.getElementById('alertKontak');
  let ok = true;
 
  const show = (id, show) => document.getElementById(id).classList.toggle('show', show);
  const markErr = (id, err) => document.getElementById(id).classList.toggle('error', err);
 
  show('err-kNama', !nama); markErr('kontakNama', !nama); if (!nama) ok = false;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  show('err-kEmail', !emailOk); markErr('kontakEmail', !emailOk); if (!emailOk) ok = false;
  show('err-kTopik', !topik); if (!topik) ok = false;
  show('err-kPesan', !pesan); markErr('kontakPesan', !pesan); if (!pesan) ok = false;
 
  if (!ok) return;
 
  alertBox.innerHTML = `
    <div class="alert alert-success">
      ✅ Pesan Anda telah terkirim! Tim kami akan menghubungi <strong>${email}</strong> dalam 1x24 jam.
    </div>`;
  // Reset form
  ['kontakNama','kontakEmail','kontakTelp','kontakPesan','kontakKode'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('kontakTopik').value = '';
  document.getElementById('charCount').textContent = '0 / 500 karakter';
  setRating(0);
  showToast('📤 Pesan berhasil terkirim!');
  alertBox.scrollIntoView({ behavior:'smooth', block:'nearest' });
}
 
// ───── TOAST ─────
// fungsi untuk menampilkan notifikasi toast sementara di pojok layar
function showToast(msg) {
  const t = document.getElementById('toastMsg');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}
 
// ───── INIT (khusus bantuan.html) ─────
if (document.getElementById('faqList')) {
  renderFAQ(faqData);
}