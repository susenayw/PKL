// Database SPJ (Menyimpan Pagu Awal, Sisa, & Total Pengeluaran)
const databaseSPJ = {
    "1.01.0001.5.1.02.01.01.00026": {
        uraian: "Belanja Alat/Bahan untuk Kegiatan Kantor- Bahan Cetak",
        anggaranAwal: 22249900,
        anggaranSisa: 22249900,
        pengeluaranTotal: 0
    },
    "1.01.0001.5.1.02.02.02.0001": {
        uraian: "Belanja Jasa Kantor - Honorarium Narasumber/Moderator",
        anggaranAwal: 4700000,
        anggaranSisa: 4700000,
        pengeluaranTotal: 0
    },
    "1.01.0004.5.1.02.01.01.00026": {
        uraian: "Belanja Alat/Bahan untuk Kegiatan Kantor- Bahan Cetak (Koordinasi DPA)",
        anggaranAwal: 19655900,
        anggaranSisa: 19655900,
        pengeluaranTotal: 0
    },
    "2.16.03.1.02.0030.5.1.02.02.001.00063": {
        uraian: "Belanja Kawat/Faksimili/Internet/TV Berlangganan Jaringan Intra Pemerintah Daerah",
        anggaranAwal: 150000000,
        anggaranSisa: 150000000,
        pengeluaranTotal: 0
    }
};

// Array untuk menyimpan riwayat transaksi BKU
let riwayatBKU = [];
let saldoKasSaatIni = 805562377; // Saldo awal simulasi berdasarkan gambar fisik BKU

// Fungsi format rupiah 
function formatRupiah(angka) {
    return "Rp " + new Intl.NumberFormat('id-ID').format(angka);
}

// Inisialisasi tampilan data
document.addEventListener("DOMContentLoaded", function() {
    renderSPJTable();
    setupEventListeners();
});

// Render tabel dengan efek highlight jika ada update
function renderSPJTable(updatedKode = null) {
    const tbody = document.querySelector("#spjTable tbody");
    tbody.innerHTML = ""; 
    
    for (const [kode, data] of Object.entries(databaseSPJ)) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><strong>${kode}</strong></td>
            <td>${data.uraian}</td>
            <td>${formatRupiah(data.anggaranSisa)}</td>
        `;

        // Highlight baris yang baru saja di-update
        if (kode === updatedKode) {
            row.style.backgroundColor = "#ccfbf1"; 
            row.style.transition = "background-color 2.5s ease"; 
            setTimeout(() => { row.style.backgroundColor = ""; }, 2500);
        }
        tbody.appendChild(row);
    }
}

// Memasang Event Listener
function setupEventListeners() {
    const selectKode = document.getElementById("kodeRekening");
    const inputPengeluaran = document.getElementById("pengeluaran");
    const formBKU = document.getElementById("bkuForm");
    const btnDownload = document.getElementById("btnDownloadExcel");

    // Ganti kode rekening -> auto-populate
    selectKode.addEventListener("change", handleRekeningChange);

    // Format input angka secara real-time
    inputPengeluaran.addEventListener("input", function(e) {
        let rawValue = this.value.replace(/[^0-9]/g, '');
        if (rawValue !== "") {
            this.value = new Intl.NumberFormat('id-ID').format(rawValue);
        } else {
            this.value = "";
        }
        calculateRealtimeBudget();
    });

    // Proses Submit (Simpan transaksi)
    formBKU.addEventListener("submit", function(e) {
        e.preventDefault();
        
        const tanggal = document.getElementById("tanggal").value;
        const noBukti = document.getElementById("noBukti").value;
        const selectedKode = selectKode.value;
        
        // Hapus titik sebelum konversi ke angka Float
        const cleanValue = inputPengeluaran.value.replace(/\./g, ''); 
        const pengeluaranValue = parseFloat(cleanValue) || 0;

        if (selectedKode && databaseSPJ[selectedKode]) {
            // 1. Simpan ke Riwayat BKU
            saldoKasSaatIni -= pengeluaranValue;
            riwayatBKU.push({
                noUrut: riwayatBKU.length + 1,
                tanggal: tanggal,
                noBukti: noBukti,
                uraian: databaseSPJ[selectedKode].uraian,
                kodeRekening: selectedKode,
                penerimaan: 0,
                pengeluaran: pengeluaranValue,
                saldo: saldoKasSaatIni
            });

            // 2. Update Database SPJ lokal
            databaseSPJ[selectedKode].anggaranSisa -= pengeluaranValue;
            databaseSPJ[selectedKode].pengeluaranTotal += pengeluaranValue;
            
            // 3. Render Ulang & Reset UI
            renderSPJTable(selectedKode);
            formBKU.reset();
            document.getElementById("budgetInfo").style.display = "none";
            showSuccessToast();
        }
    });

    // Event Listener untuk Download Excel
    btnDownload.addEventListener("click", generateExcel);
}

// Logika Auto-populate
function handleRekeningChange() {
    const selectedKode = document.getElementById("kodeRekening").value;
    const uraianField = document.getElementById("uraian");
    const anggaranField = document.getElementById("anggaran");
    const budgetInfoDiv = document.getElementById("budgetInfo");

    if (selectedKode && databaseSPJ[selectedKode]) {
        uraianField.value = databaseSPJ[selectedKode].uraian;
        anggaranField.value = formatRupiah(databaseSPJ[selectedKode].anggaranSisa);
        budgetInfoDiv.style.display = "block";
        calculateRealtimeBudget();
    } else {
        uraianField.value = "";
        anggaranField.value = "";
        budgetInfoDiv.style.display = "none";
    }
}

// Kalkulasi real-time saat mengetik nominal pengeluaran
function calculateRealtimeBudget() {
    const selectedKode = document.getElementById("kodeRekening").value;
    const inputPengeluaran = document.getElementById("pengeluaran");
    const sisaSpan = document.getElementById("sisaAnggaran");

    if (selectedKode && databaseSPJ[selectedKode]) {
        const totalAnggaran = databaseSPJ[selectedKode].anggaranSisa;
        const cleanValue = inputPengeluaran.value.replace(/\./g, ''); 
        const pengeluaranValue = parseFloat(cleanValue) || 0;
        const sisa = totalAnggaran - pengeluaranValue;

        sisaSpan.textContent = formatRupiah(sisa);
        
        if (sisa < 0) {
            sisaSpan.style.color = "#dc2626";
            sisaSpan.textContent += " (Over-budget!)";
        } else {
            sisaSpan.style.color = "#115e59";
        }
    }
}

// Fungsi Ekspor ke Excel menggunakan SheetJS
function generateExcel() {
    if (riwayatBKU.length === 0) {
        alert("Belum ada transaksi BKU yang diinput. Silakan input data terlebih dahulu.");
        return;
    }

    // 1. Format Data untuk Sheet BKU
    const dataBkuExcel = [
        ["NO URUT", "TANGGAL", "NOMOR BUKTI PENGELUARAN KAS", "URAIAN", "KODE REKENING", "PENERIMAAN", "PENGELUARAN", "SALDO"] 
    ];
    
    riwayatBKU.forEach(item => {
        dataBkuExcel.push([
            item.noUrut,
            item.tanggal,
            item.noBukti,
            item.uraian,
            item.kodeRekening,
            item.penerimaan,
            item.pengeluaran,
            item.saldo
        ]);
    });

    // 2. Format Data untuk Sheet SPJ Belanja
    const dataSpjExcel = [
        ["KODE REKENING", "URAIAN", "ANGGARAN TAHUN INI", "JUMLAH SPJ (PENGELUARAN)", "SISA PAGU ANGGARAN"] 
    ];

    for (const [kode, data] of Object.entries(databaseSPJ)) {
        dataSpjExcel.push([
            kode,
            data.uraian,
            data.anggaranAwal,
            data.pengeluaranTotal,
            data.anggaranSisa
        ]);
    }

    // 3. Konversi array ke format SheetJS
    const wsBKU = XLSX.utils.aoa_to_sheet(dataBkuExcel);
    const wsSPJ = XLSX.utils.aoa_to_sheet(dataSpjExcel);

    // Membuat file Excel virtual (Workbook)
    const wb = XLSX.utils.book_new();
    
    // Menambahkan sheet ke dalam workbook
    XLSX.utils.book_append_sheet(wb, wsBKU, "Buku Kas Umum (BKU)");
    XLSX.utils.book_append_sheet(wb, wsSPJ, "SPJ Belanja");

    // 4. Unduh File Excel
    XLSX.writeFile(wb, "Laporan_BKU_SPJ_Sumut.xlsx");
}

// Toast Notifikasi (menggantikan pop-up alert bawaan browser)
function showSuccessToast() {
    let toast = document.getElementById("customToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "customToast";
        toast.style.position = "fixed";
        toast.style.bottom = "20px";
        toast.style.right = "20px";
        toast.style.backgroundColor = "#0d9488"; 
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
    
    toast.textContent = "✔ Transaksi berhasil dicatat dan disinkronkan!";
    toast.style.opacity = "1";
    toast.style.display = "block";
    
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => { toast.style.display = "none"; }, 300);
    }, 3500);
}