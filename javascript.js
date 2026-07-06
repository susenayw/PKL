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
    tbody.innerHTML = ""; // Bersihkan tabel
    
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

    // Deteksi input angka pengeluaran (Penghitungan sisa anggaran real-time)
    inputPengeluaran.addEventListener("input", calculateRealtimeBudget);

    // Simulasi penyimpanan data saat disubmit
    formBKU.addEventListener("submit", function(e) {
        e.preventDefault();
        alert("Transaksi berhasil dicatat ke BKU lokal! Selisih pagu anggaran telah diperbarui secara otomatis.");
    });
}

// Logika Utama Auto-populate Uraian & Anggaran Tahun Ini
function handleRekeningChange() {
    const selectedKode = document.getElementById("kodeRekening").value;
    const uraianField = document.getElementById("uraian");
    const anggaranField = document.getElementById("anggaran");
    const budgetInfoDiv = document.getElementById("budgetInfo");

    if (selectedKode && databaseSPJ[selectedKode]) {
        // Otomatis isi uraian dan anggaran tahun ini
        uraianField.value = databaseSPJ[selectedKode].uraian;
        anggaranField.value = formatRupiah(databaseSPJ[selectedKode].anggaran);
        budgetInfoDiv.style.display = "block"; // Tampilkan kotak sisa pagu
        calculateRealtimeBudget();
    } else {
        // Reset jika tidak ada opsi yang dipilih
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
        const pengeluaranValue = parseFloat(inputPengeluaran.value) || 0;
        const sisa = totalAnggaran - pengeluaranValue;

        sisaSpan.textContent = formatRupiah(sisa);
        
        // Peringatan visual jika pengeluaran melebihi anggaran tahun ini
        if (sisa < 0) {
            sisaSpan.style.color = "#dc2626"; // Merah
            sisaSpan.textContent += " (Over-budget!)";
        } else {
            sisaSpan.style.color = "#115e59"; // Hijau stabil
        }
    }
}