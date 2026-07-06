// Database SPJ lokal sementara berdasarkan data ril di lembar SPJ Belanja Diskominfo
const databaseSPJ = {
    "1.01.0001.5.1.02.01.01.00026": {
        uraian: "Belanja Alat/Bahan untuk Kegiatan Kantor- Bahan Cetak",
        anggaran: 22249900 // Berdasarkan data SPJ Belanja Diskominfo Sumut
    },
    "1.01.0001.5.1.02.02.02.0001": {
        uraian: "Belanja Jasa Kantor - Honorarium Narasumber/Moderator",
        anggaran: 4700000 // Berdasarkan data SPJ Belanja Diskominfo Sumut
    },
    "1.01.0004.5.1.02.01.01.00026": {
        uraian: "Belanja Alat/Bahan untuk Kegiatan Kantor- Bahan Cetak (Koordinasi DPA)",
        anggaran: 19655900 // Berdasarkan data SPJ Belanja Diskominfo Sumut
    },
    "2.16.03.1.02.0030.5.1.02.02.001.00063": {
        uraian: "Belanja Kawat/Faksimili/Internet/TV Berlangganan Jaringan Intra Pemerintah Daerah",
        anggaran: 150000000 // Berdasarkan data ril transaksi BKU nomor bukti 636
    }
};

// Fungsi format rupiah untuk mempermudah pembacaan nominal keuangan
function formatRupiah(angka) {
    return "Rp " + new Intl.NumberFormat('id-ID').format(angka);
}

// Inisialisasi tampilan data pada saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", function() {
    renderSPJTable();
    setupEventListeners();
});

// Mengisi Tabel Referensi SPJ di sebelah kanan secara dinamis
function renderSPJTable() {
    const tbody = document.querySelector("#spjTable tbody");
    tbody.innerHTML = ""; // Bersihkan tabel sebelum dimuat ulang
    
    for (const [kode, data] of Object.entries(databaseSPJ)) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><strong>${kode}</strong></td>
            <td>${data.uraian}</td>
            <td>${formatRupiah(data.anggaran)}</td>
        `;
        tbody.appendChild(row);
    }
}

// Memasang Event Listener pada Form input
function setupEventListeners() {
    const selectKode = document.getElementById("kodeRekening");
    const inputPengeluaran = document.getElementById("pengeluaran");
    const formBKU = document.getElementById("bkuForm");

    // Deteksi perubahan Kode Rekening (Auto-populate "yang lain-lain")
    selectKode.addEventListener("change", handleRekeningChange);

    // Format input angka secara real-time dan hitung anggaran
    inputPengeluaran.addEventListener("input", function(e) {
        let rawValue = this.value.replace(/[^0-9]/g, '');
        
        if (rawValue !== "") {
            this.value = new Intl.NumberFormat('id-ID').format(rawValue);
        } else {
            this.value = "";
        }
        
        calculateRealtimeBudget();
    });

    // PERUBAHAN UTAMA: Logika sinkronisasi langsung ke tabel tanpa alert window bawaan
    formBKU.addEventListener("submit", function(e) {
        e.preventDefault();
        
        const selectedKode = selectKode.value;
        const cleanValue = inputPengeluaran.value.replace(/\./g, ''); 
        const pengeluaranValue = parseFloat(cleanValue) || 0;

        if (selectedKode && databaseSPJ[selectedKode]) {
            // 1. Kurangi sisa anggaran langsung di database lokal
            databaseSPJ[selectedKode].anggaran -= pengeluaranValue;
            
            // 2. Jalankan ulang fungsi render agar tabel referensi langsung terupdate di layar
            renderSPJTable();
            
            // 3. Reset form input kembali kosong bersih
            formBKU.reset();
            document.getElementById("budgetInfo").style.display = "none";
            
            // 4. Panggil notifikasi sukses kustom yang halus (bukan pop-up alert HTML)
            showSuccessToast();
        }
    });
}

// Logika Utama Auto-populate Uraian & Anggaran Tahun Ini
function handleRekeningChange() {
    const selectedKode = document.getElementById("kodeRekening").value;
    const uraianField = document.getElementById("uraian");
    const anggaranField = document.getElementById("anggaran");
    const budgetInfoDiv = document.getElementById("budgetInfo");

    if (selectedKode && databaseSPJ[selectedKode]) {
        uraianField.value = databaseSPJ[selectedKode].uraian;
        anggaranField.value = formatRupiah(databaseSPJ[selectedKode].anggaran);
        budgetInfoDiv.style.display = "block"; // Tampilkan kotak sisa pagu
        calculateRealtimeBudget();
    } else {
        uraianField.value = "";
        anggaranField.value = "";
        budgetInfoDiv.style.display = "none";
    }
}

// Logika kalkulasi sisa pagu anggaran secara dinamis
function calculateRealtimeBudget() {
    const selectedKode = document.getElementById("kodeRekening").value;
    const inputPengeluaran = document.getElementById("pengeluaran");
    const sisaSpan = document.getElementById("sisaAnggaran");

    if (selectedKode && databaseSPJ[selectedKode]) {
        const totalAnggaran = databaseSPJ[selectedKode].anggaran;
        const cleanValue = inputPengeluaran.value.replace(/\./g, ''); 
        const pengeluaranValue = parseFloat(cleanValue) || 0;
        
        const sisa = totalAnggaran - pengeluaranValue;

        sisaSpan.textContent = formatRupiah(sisa);
        
        if (sisa < 0) {
            sisaSpan.style.color = "#dc2626"; // Merah jika over-budget
            sisaSpan.textContent += " (Over-budget!)";
        } else {
            sisaSpan.style.color = "#115e59"; // Hijau stabil
        }
    }
}

// Fungsi tambahan untuk membuat Toast Notifikasi sukses yang bersih tanpa alert browser
function showSuccessToast() {
    let toast = document.getElementById("customToast");
    
    // Jika elemen toast belum ada di HTML, buat otomatis menggunakan Javascript
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "customToast";
        toast.style.position = "fixed";
        toast.style.bottom = "20px";
        toast.style.right = "20px";
        toast.style.backgroundColor = "#0d9488"; // Warna teal administrasi sesuai tema
        toast.style.color = "white";
        toast.style.padding = "14px 22px";
        toast.style.borderRadius = "8px";
        toast.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
        toast.style.zIndex = "9999";
        toast.style.fontSize = "13px";
        toast.style.fontWeight = "600";
        toast.style.transition = "opacity 0.3s ease";
        document.body.appendChild(toast);
    }
    
    toast.textContent = "✔ Transaksi berhasil disimpan. Kamus referensi anggaran diperbarui secara instan!";
    toast.style.opacity = "1";
    toast.style.display = "block";
    
    // Hilangkan notifikasi secara otomatis setelah 3.5 detik
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => { toast.style.display = "none"; }, 300);
    }, 3500);
}