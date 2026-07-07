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

let riwayatBKU = [];
let saldoKasSaatIni = 805562377; // Berdasarkan saldo awal BKU

function formatRupiah(angka) {
    return "Rp " + new Intl.NumberFormat('id-ID').format(angka);
}

document.addEventListener("DOMContentLoaded", function() {
    renderSPJTable();
    setupEventListeners();
});

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

        if (kode === updatedKode) {
            row.style.backgroundColor = "#ccfbf1"; 
            row.style.transition = "background-color 2.5s ease"; 
            setTimeout(() => { row.style.backgroundColor = ""; }, 2500);
        }
        tbody.appendChild(row);
    }
}

function setupEventListeners() {
    const selectKode = document.getElementById("kodeRekening");
    const inputPengeluaran = document.getElementById("pengeluaran");
    const formBKU = document.getElementById("bkuForm");
    
    const btnDownloadBKU = document.getElementById("btnDownloadBKU");
    const btnDownloadSPJ = document.getElementById("btnDownloadSPJ");

    selectKode.addEventListener("change", handleRekeningChange);

    inputPengeluaran.addEventListener("input", function(e) {
        let rawValue = this.value.replace(/[^0-9]/g, '');
        if (rawValue !== "") {
            this.value = new Intl.NumberFormat('id-ID').format(rawValue);
        } else {
            this.value = "";
        }
        calculateRealtimeBudget();
    });

    formBKU.addEventListener("submit", function(e) {
        e.preventDefault();
        
        const tanggal = document.getElementById("tanggal").value;
        const noBukti = document.getElementById("noBukti").value;
        const selectedKode = selectKode.value;
        
        const cleanValue = inputPengeluaran.value.replace(/\./g, ''); 
        const pengeluaranValue = parseFloat(cleanValue) || 0;

        if (selectedKode && databaseSPJ[selectedKode]) {
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

            databaseSPJ[selectedKode].anggaranSisa -= pengeluaranValue;
            databaseSPJ[selectedKode].pengeluaranTotal += pengeluaranValue;
            
            renderSPJTable(selectedKode);
            formBKU.reset();
            document.getElementById("budgetInfo").style.display = "none";
            showSuccessToast();
        }
    });

    btnDownloadBKU.addEventListener("click", generateExcelBKU);
    btnDownloadSPJ.addEventListener("click", generateExcelSPJ);
}

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

// Helper untuk styling border ExcelJS
function applyBorders(cell) {
    cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
    };
}

// -------------------------------------------------------------
// FUNGSI EXPORT BKU Sesuai Format Fisik
// -------------------------------------------------------------
async function generateExcelBKU() {
    if (riwayatBKU.length === 0) {
        alert("Belum ada transaksi BKU yang diinput.");
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('BKU Mei 2026');

    ws.columns = [
        { width: 8 }, { width: 15 }, { width: 35 }, { width: 45 }, 
        { width: 25 }, { width: 20 }, { width: 20 }, { width: 20 }
    ];

    // Header BKU
    ws.mergeCells('A1:H1'); ws.getCell('A1').value = 'BUKU KAS UMUM';
    ws.mergeCells('A2:H2'); ws.getCell('A2').value = 'DINAS KOMUNIKASI DAN INFORMATIKA PROVINSI SUMATERA UTARA';
    ws.mergeCells('A3:H3'); ws.getCell('A3').value = 'TAHUN ANGGARAN 2026';
    ws.mergeCells('A4:H4'); ws.getCell('A4').value = 'MEI';
    
    ['A1', 'A2', 'A3', 'A4'].forEach(cell => {
        ws.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getCell(cell).font = { bold: true, size: 12 };
    });

    // Tabel Kolom BKU
    const headerTitle = ws.addRow(['NO URUT', 'TANGGAL', 'NOMOR BUKTI PENGELUARAN KAS', 'URAIAN', 'KODE REKENING', 'PENERIMAAN', 'PENGELUARAN', 'SALDO']);
    const headerNum = ws.addRow(['1', '2', '3', '4', '5', '6', '7', '8']);
    
    [headerTitle, headerNum].forEach(row => {
        row.eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            applyBorders(cell);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        });
    });

    // Isi Data BKU
    riwayatBKU.forEach(item => {
        const row = ws.addRow([item.noUrut, item.tanggal, item.noBukti, item.uraian, item.kodeRekening, item.penerimaan, item.pengeluaran, item.saldo]);
        row.eachCell((cell, colNum) => {
            applyBorders(cell);
            if (colNum === 4) cell.alignment = { horizontal: 'left', wrapText: true };
            else cell.alignment = { horizontal: 'center', vertical: 'middle' };
            if (colNum >= 6) cell.numFmt = '#,##0.00';
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, "BKU_Sumut_Mei_2026.xlsx");
}

// -------------------------------------------------------------
// FUNGSI EXPORT SPJ Sesuai Format Fisik (14 Kolom)
// -------------------------------------------------------------
async function generateExcelSPJ() {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('SPJ Belanja Fungsional');

    // Setup 14 Kolom sesuai gambar fisik
    ws.columns = [
        { width: 25 }, { width: 35 }, { width: 20 }, // A, B, C
        { width: 15 }, { width: 15 }, { width: 15 }, // D, E, F (LS GAJI)
        { width: 15 }, { width: 15 }, { width: 15 }, // G, H, I (LS BARANG)
        { width: 15 }, { width: 15 }, { width: 15 }, // J, K, L (UP/GU/TU)
        { width: 20 }, { width: 20 }                 // M (Jumlah), N (Sisa Pagu)
    ];

    // Judul Utama SPJ
    ws.mergeCells('A1:N1'); ws.getCell('A1').value = 'PROVINSI SUMATERA UTARA';
    ws.mergeCells('A2:N2'); ws.getCell('A2').value = 'LAPORAN PERTANGGUNGJAWABAN BENDAHARA PENGELUARAN';
    ws.mergeCells('A3:N3'); ws.getCell('A3').value = '( SPJ BELANJA - FUNGSIONAL )';
    ['A1', 'A2', 'A3'].forEach(cell => {
        ws.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getCell(cell).font = { bold: true, size: 12 };
    });

    // Informasi SKPD (Simulasi Text Biasa)
    ws.getCell('A5').value = 'SKPD: Dinas Komunikasi dan Informatika';
    ws.getCell('A6').value = 'Tahun Anggaran: 2026';
    ws.getCell('A7').value = 'Bulan: Mei';

    // MERGE CELLS UNTUK HEADER TABEL BERTINGKAT (Baris 9 & 10)
    ws.mergeCells('A9:A10'); ws.getCell('A9').value = 'KODE REKENING';
    ws.mergeCells('B9:B10'); ws.getCell('B9').value = 'URAIAN';
    ws.mergeCells('C9:C10'); ws.getCell('C9').value = 'ANGGARAN TAHUN INI (Rp)';
    
    ws.mergeCells('D9:F9'); ws.getCell('D9').value = 'SPJ - LS GAJI';
    ws.getCell('D10').value = 's.d Bulan Lalu'; ws.getCell('E10').value = 'Bulan ini'; ws.getCell('F10').value = 's.d Bulan ini';
    
    ws.mergeCells('G9:I9'); ws.getCell('G9').value = 'SPJ - LS BARANG DAN JASA';
    ws.getCell('G10').value = 's.d Bulan Lalu'; ws.getCell('H10').value = 'Bulan ini'; ws.getCell('I10').value = 's.d Bulan ini';
    
    ws.mergeCells('J9:L9'); ws.getCell('J9').value = 'SPJ UP / GU / TU';
    ws.getCell('J10').value = 's.d Bulan Lalu'; ws.getCell('K10').value = 'Bulan ini'; ws.getCell('L10').value = 's.d Bulan ini';
    
    ws.mergeCells('M9:M10'); ws.getCell('M9').value = 'Jumlah SPJ\n(LS+UP/GU/TU)\ns.d Bulan ini';
    ws.mergeCells('N9:N10'); ws.getCell('N9').value = 'Sisa Pagu Anggaran';

    // Baris Nomor Kolom
    const headerNum = ws.addRow(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14']);

    // Styling khusus untuk area Header Tabel (A9:N11)
    for (let r = 9; r <= 11; r++) {
        ws.getRow(r).eachCell((cell) => {
            cell.font = { bold: true, size: 10 };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            applyBorders(cell);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        });
    }
    ws.getRow(9).height = 30;
    ws.getRow(10).height = 25;

    // Masukkan Data SPJ ke dalam kolom yang tepat
    for (const [kode, data] of Object.entries(databaseSPJ)) {
        // Pemetaan: Anggaran awal di Kolom 3. Pengeluaran simulasi diletakkan di Kolom 11 (UP/GU/TU Bulan Ini) dan Kolom 13 (Jumlah). Sisa di Kolom 14.
        const row = ws.addRow([
            kode, data.uraian, data.anggaranAwal, 
            0, 0, 0, // LS Gaji
            0, 0, 0, // LS Barang/Jasa
            0, data.pengeluaranTotal, data.pengeluaranTotal, // UP/GU/TU (Diasumsikan pengeluaran masuk sini)
            data.pengeluaranTotal, data.anggaranSisa // Jumlah & Sisa
        ]);
        
        row.eachCell((cell, colNum) => {
            applyBorders(cell);
            if (colNum === 2) cell.alignment = { horizontal: 'left', wrapText: true };
            else cell.alignment = { horizontal: 'center', vertical: 'middle' };
            
            if (colNum >= 3) {
                cell.numFmt = '#,##0.00';
                // Jika nilai 0, bisa dibuat kosong atau strip, tapi kita biarkan format angka standar
            }
        });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, "SPJ_Belanja_Sumut_Mei_2026.xlsx");
}

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