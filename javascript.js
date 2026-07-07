// STRUKTUR DATA (Semua 0, Kecuali Kepala Rekening 23M)
const hierarkiSPJ = [
    { kode: "2.16.01", uraian: "PROGRAM PENUNJANG URUSAN PEMERINTAHAN DAERAH PROVINSI", anggaranAwal: 23179870578, type: "header", isBold: true, dropdownLevel: 1, parentUI: null },
    
    { kode: "2.16.01.1.01", uraian: "Perencanaan, Penganggaran, dan Evaluasi Kinerja Perangkat Daerah", anggaranAwal: 0, type: "header", isBold: true, dropdownLevel: 2, parentUI: "2.16.01" },
    { kode: "2.16.01.1.01.0001", uraian: "Penyusunan Dokumen Perencanaan Perangkat Daerah", anggaranAwal: 0, type: "header", isBold: true, dropdownLevel: null, parentUI: null },
    { kode: "2.16.01.1.01.0001.5", uraian: "BELANJA DAERAH", anggaranAwal: 0, type: "header", isBold: true, dropdownLevel: null, parentUI: null },
    { kode: "2.16.01.1.01.0001.5.1", uraian: "BELANJA OPERASI", anggaranAwal: 0, type: "header", isBold: true, dropdownLevel: null, parentUI: null },
    { kode: "2.16.01.1.01.0001.5.1.02", uraian: "Belanja Barang dan Jasa", anggaranAwal: 0, type: "header", isBold: true, dropdownLevel: null, parentUI: null },
    
    // Rincian Cabang 1
    { kode: "2.16.01.1.01.0001.5.1.02.01", uraian: "Belanja Barang", anggaranAwal: 0, type: "header", isBold: true, dropdownLevel: null, parentUI: null },
    { kode: "2.16.01.1.01.0001.5.1.02.01.001", uraian: "Belanja Barang Pakai Habis", anggaranAwal: 0, type: "header", isBold: true, dropdownLevel: null, parentUI: null },
    { kode: "2.16.01.1.01.0001.5.1.02.01.001.00026", uraian: "Belanja Alat/Bahan untuk Kegiatan Kantor- Bahan Cetak", anggaranAwal: 0, type: "leaf", isItalic: true, dropdownLevel: 3, parentUI: "2.16.01.1.01" },
    
    // Rincian Cabang 2
    { kode: "2.16.01.1.01.0001.5.1.02.02", uraian: "Belanja Jasa", anggaranAwal: 0, type: "header", isBold: true, dropdownLevel: null, parentUI: null },
    { kode: "2.16.01.1.01.0001.5.1.02.02.001", uraian: "Belanja Jasa Kantor", anggaranAwal: 0, type: "header", isBold: true, dropdownLevel: null, parentUI: null },
    { kode: "2.16.01.1.01.0001.5.1.02.02.001.00003", uraian: "Honorarium Narasumber atau Pembahas, Moderator, Pembawa Acara, dan Panitia", anggaranAwal: 0, type: "leaf", isItalic: true, dropdownLevel: 3, parentUI: "2.16.01.1.01" }
];

// Setup data sisa anggaran default
hierarkiSPJ.forEach(item => {
    item.anggaranSisa = item.anggaranAwal;
    item.pengeluaranTotal = 0;
});

let riwayatBKU = [];
let saldoKasSaatIni = 805562377; 
let targetLeafKode = null; 

function formatRupiah(angka) {
    return "Rp " + new Intl.NumberFormat('id-ID').format(angka);
}

function getNamaBulanTahun(dateString) {
    if(!dateString) return "Bulan_Ini";
    const date = new Date(dateString);
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${months[date.getMonth()]}_${date.getFullYear()}`;
}

function getNamaBulanHeader(dateString) {
    if(!dateString) return "";
    const date = new Date(dateString);
    const months = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
    return months[date.getMonth()];
}

document.addEventListener("DOMContentLoaded", function() {
    renderSPJTable();
    initDropdowns();
    setupEventListeners();
});

function renderSPJTable(updatedKode = null) {
    const tbody = document.querySelector("#spjTable tbody");
    tbody.innerHTML = ""; 
    
    hierarkiSPJ.forEach(data => {
        const row = document.createElement("tr");
        
        let styleStr = data.isBold ? "font-weight: 700;" : "";
        styleStr += data.type === 'leaf' ? "font-style: italic; color: #4b5563;" : "";

        let indentPx = (data.kode.split('.').length - 3) * 12; 
        if (indentPx < 0) indentPx = 0;

        row.innerHTML = `
            <td style="${styleStr}">${data.kode}</td>
            <td style="${styleStr} padding-left: ${indentPx}px;">${data.uraian}</td>
            <td style="${styleStr}">${formatRupiah(data.anggaranSisa)}</td>
        `;

        if (updatedKode && updatedKode.startsWith(data.kode)) {
            row.style.backgroundColor = "#ccfbf1"; 
            row.style.transition = "background-color 2.5s ease"; 
            setTimeout(() => { row.style.backgroundColor = ""; }, 2500);
        }
        tbody.appendChild(row);
    });
}

function initDropdowns() {
    const area = document.getElementById('dropdownArea');
    area.innerHTML = `
        <div class="form-group" id="group-level1">
            <label>1. Pilih Program Utama (Induk)</label>
            <select id="level1" class="dynamic-select" data-level="1" required>
                <option value="">-- Pilih Program Kepala --</option>
                ${hierarkiSPJ.filter(i => i.dropdownLevel === 1).map(i => `<option value="${i.kode}">${i.kode} - ${i.uraian}</option>`).join('')}
            </select>
        </div>
    `;
}

function setupEventListeners() {
    const dropdownArea = document.getElementById('dropdownArea');
    const inputAlokasi = document.getElementById("alokasi");
    const inputPengeluaran = document.getElementById("pengeluaran");
    const formBKU = document.getElementById("bkuForm");
    
    const btnDownloadBKU = document.getElementById("btnDownloadBKU");
    const btnDownloadSPJ = document.getElementById("btnDownloadSPJ");

    dropdownArea.addEventListener('change', function(e) {
        if(e.target.classList.contains('dynamic-select')) {
            const currentLevel = parseInt(e.target.dataset.level);
            const selectedKode = e.target.value;

            const allGroups = document.querySelectorAll('#dropdownArea .form-group');
            allGroups.forEach(group => {
                const select = group.querySelector('select');
                if(select && parseInt(select.dataset.level) > currentLevel) {
                    group.remove();
                }
            });

            targetLeafKode = null; 
            resetUIInfo();

            if(selectedKode) {
                const children = hierarkiSPJ.filter(item => item.parentUI === selectedKode);
                
                if(children.length > 0) {
                    const nextLevel = currentLevel + 1;
                    const wrapper = document.createElement('div');
                    wrapper.className = 'form-group';
                    wrapper.id = `group-level${nextLevel}`;
                    
                    let labelText = nextLevel === 2 ? "2. Pilih Kegiatan (Cabang)" : "3. Pilih Rincian Belanja (Pecahan Terdalam)";
                    
                    wrapper.innerHTML = `
                        <label>${labelText}</label>
                        <select id="level${nextLevel}" class="dynamic-select" data-level="${nextLevel}" required>
                            <option value="">-- Pilih Bagian --</option>
                            ${children.map(c => `<option value="${c.kode}">${c.kode} - ${c.uraian.substring(0,60)}...</option>`).join('')}
                        </select>
                    `;
                    dropdownArea.appendChild(wrapper);
                } else {
                    targetLeafKode = selectedKode;
                    calculateRealtimeBudget(); 
                }
            }
        }
    });

    // Format input angka otomatis
    [inputAlokasi, inputPengeluaran].forEach(input => {
        input.addEventListener("input", function(e) {
            let rawValue = this.value.replace(/[^0-9]/g, '');
            if (rawValue !== "") {
                this.value = new Intl.NumberFormat('id-ID').format(rawValue);
            } else {
                this.value = "";
            }
            calculateRealtimeBudget();
        });
    });

    // LOGIKA PENYIMPANAN ALOKASI & PENGELUARAN
    formBKU.addEventListener("submit", function(e) {
        e.preventDefault();
        
        if (!targetLeafKode) {
            alert("Harap pilih hingga ke Rincian Belanja terdalam (Level 3)!");
            return;
        }

        const tanggal = document.getElementById("tanggal").value;
        const noBukti = document.getElementById("noBukti").value;
        
        const alokasiValue = parseFloat(inputAlokasi.value.replace(/\./g, '')) || 0;
        const pengeluaranValue = parseFloat(inputPengeluaran.value.replace(/\./g, '')) || 0;

        if (alokasiValue === 0 && pengeluaranValue === 0) {
            alert("Harap isi Alokasi Anggaran ATAU Jumlah Pengeluaran untuk melanjutkan.");
            return;
        }

        const leafItem = hierarkiSPJ.find(i => i.kode === targetLeafKode);

        // Jika ada pengeluaran, pastikan noBukti diisi dan catat di BKU
        if (pengeluaranValue > 0) {
            if (!noBukti) {
                alert("Nomor Bukti wajib diisi jika Anda melakukan pengeluaran!");
                return;
            }
            saldoKasSaatIni -= pengeluaranValue;
            riwayatBKU.push({
                noUrut: riwayatBKU.length + 1,
                tanggal: tanggal,
                noBukti: noBukti,
                uraian: leafItem.uraian,
                kodeRekening: targetLeafKode,
                penerimaan: 0,
                pengeluaran: pengeluaranValue,
                saldo: saldoKasSaatIni
            });
        }

        // PEMBARUAN ANGGARAN SPJ BERJENJANG (Alokasi & Pemotongan)
        hierarkiSPJ.forEach(item => {
            if (targetLeafKode.startsWith(item.kode)) {
                
                // 1. Logika Alokasi: Tambah anggaran ke anak cabang (kecuali Kepala Rekening agar tetap 23M)
                if (item.dropdownLevel !== 1 && alokasiValue > 0) {
                    item.anggaranAwal += alokasiValue;
                    item.anggaranSisa += alokasiValue;
                }
                
                // 2. Logika Pengeluaran: Potong saldo dari anak hingga Kepala Rekening
                if (pengeluaranValue > 0) {
                    item.anggaranSisa -= pengeluaranValue;
                    item.pengeluaranTotal += pengeluaranValue;
                }
            }
        });
        
        renderSPJTable(targetLeafKode);
        
        // Reset formulir kembali bersih
        formBKU.reset();
        initDropdowns();
        resetUIInfo();
        targetLeafKode = null;
        
        showSuccessToast();
    });

    btnDownloadBKU.addEventListener("click", generateExcelBKU);
    btnDownloadSPJ.addEventListener("click", generateExcelSPJ);
}

function resetUIInfo() {
    document.getElementById('uraian').value = "";
    document.getElementById('budgetInfo').style.display = "none";
}

// SIMULASI VISUAL REAL-TIME MATEMATIKA ALOKASI & PENGELUARAN
function calculateRealtimeBudget() {
    if (!targetLeafKode) return;

    const inputAlokasi = document.getElementById("alokasi");
    const inputPengeluaran = document.getElementById("pengeluaran");
    
    const alokasiVal = parseFloat(inputAlokasi.value.replace(/\./g, '')) || 0;
    const pengeluaranVal = parseFloat(inputPengeluaran.value.replace(/\./g, '')) || 0;

    const leaf = hierarkiSPJ.find(i => i.kode === targetLeafKode);
    const kegiatan = hierarkiSPJ.find(i => i.kode === leaf.parentUI);
    const program = hierarkiSPJ.find(i => i.kode === kegiatan.parentUI);

    document.getElementById('uraian').value = leaf.uraian;

    // Kalkulasi simulasi sisa
    const leafSisa = leaf.anggaranSisa + alokasiVal - pengeluaranVal;
    const kegiatanSisa = kegiatan.anggaranSisa + alokasiVal - pengeluaranVal;
    const programSisa = program.anggaranSisa - pengeluaranVal; // Program Utama (Kepala) tidak bertambah pagunya, hanya berkurang saat pengeluaran

    const info = document.getElementById('budgetInfo');
    info.innerHTML = `
        <div style="font-size: 13px; margin-bottom: 8px;"><strong>Simulasi Saldo Saat Ini:</strong></div>
        <ul style="margin-left: 20px; font-size: 13px; color: #374151;">
            <li>Kepala (${program.kode}): <strong style="color:#1e3a8a;">${formatRupiah(programSisa)}</strong></li>
            <li>Kegiatan (${kegiatan.kode}): <strong>${formatRupiah(kegiatanSisa)}</strong></li>
            <li>Rincian Terpilih (${leaf.kode}): <strong style="color:${leafSisa < 0 ? '#dc2626' : '#115e59'};">${formatRupiah(leafSisa)}</strong></li>
        </ul>
    `;
    info.style.display = 'block';
}

function applyBorders(cell) {
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
}

// -------------------------------------------------------------
// FUNGSI EXPORT EXCEL BKU - DINAMIS BULANAN
// -------------------------------------------------------------
async function generateExcelBKU() {
    if (riwayatBKU.length === 0) {
        alert("Belum ada transaksi BKU yang diinput.");
        return;
    }

    const tanggalInput = document.getElementById("tanggal").value;
    const bulanStr = getNamaBulanTahun(tanggalInput);
    const bulanHeader = getNamaBulanHeader(tanggalInput);

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet(`BKU ${bulanStr}`);

    ws.columns = [{ width: 8 }, { width: 15 }, { width: 35 }, { width: 45 }, { width: 25 }, { width: 20 }, { width: 20 }, { width: 20 }];

    ws.mergeCells('A1:H1'); ws.getCell('A1').value = 'BUKU KAS UMUM';
    ws.mergeCells('A2:H2'); ws.getCell('A2').value = 'DINAS KOMUNIKASI DAN INFORMATIKA PROVINSI SUMATERA UTARA';
    ws.mergeCells('A3:H3'); ws.getCell('A3').value = 'TAHUN ANGGARAN 2026';
    ws.mergeCells('A4:H4'); ws.getCell('A4').value = `BULAN ${bulanHeader}`;
    
    ['A1', 'A2', 'A3', 'A4'].forEach(cell => {
        ws.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getCell(cell).font = { bold: true, size: 12 };
    });

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
    saveAs(blob, `BKU_Sumut_${bulanStr}.xlsx`);
}

// -------------------------------------------------------------
// FUNGSI EXPORT EXCEL SPJ - TAHUNAN & BERCABANG (Sesuai Gambar 100%)
// -------------------------------------------------------------
async function generateExcelSPJ() {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('SPJ Belanja Fungsional');

    ws.columns = [
        { width: 25 }, { width: 45 }, { width: 20 },
        { width: 15 }, { width: 15 }, { width: 15 }, 
        { width: 15 }, { width: 15 }, { width: 15 }, 
        { width: 15 }, { width: 15 }, { width: 15 }, 
        { width: 20 }, { width: 20 }                 
    ];

    ws.mergeCells('A1:N1'); ws.getCell('A1').value = 'PROVINSI SUMATERA UTARA';
    ws.mergeCells('A2:N2'); ws.getCell('A2').value = 'LAPORAN PERTANGGUNGJAWABAN BENDAHARA PENGELUARAN';
    ws.mergeCells('A3:N3'); ws.getCell('A3').value = '( SPJ BELANJA - FUNGSIONAL )';
    ['A1', 'A2', 'A3'].forEach(cell => {
        ws.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getCell(cell).font = { bold: true, size: 12 };
    });

    ws.getCell('A5').value = 'SKPD: Dinas Komunikasi dan Informatika';
    ws.getCell('A6').value = 'Tahun Anggaran: 2026';

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

    const headerNum = ws.addRow(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14']);

    for (let r = 9; r <= 11; r++) {
        ws.getRow(r).eachCell((cell) => {
            cell.font = { bold: true, size: 10 };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            applyBorders(cell);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        });
    }

    hierarkiSPJ.forEach(data => {
        const row = ws.addRow([
            data.kode, data.uraian, data.anggaranAwal, 
            0, 0, 0, 0, 0, 0, 
            0, data.pengeluaranTotal, data.pengeluaranTotal, 
            data.pengeluaranTotal, data.anggaranSisa 
        ]);
        
        row.eachCell((cell, colNum) => {
            applyBorders(cell);
            
            if (data.isBold) cell.font = { bold: true };
            if (data.type === 'leaf') cell.font = { italic: true };

            if (colNum === 2) {
                let indentLvl = (data.kode.split('.').length - 3);
                if (indentLvl < 0) indentLvl = 0;
                cell.alignment = { horizontal: 'left', wrapText: true, indent: indentLvl };
            } else {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }

            if (colNum >= 3 && cell.value !== null) cell.numFmt = '#,##0.00';
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, "SPJ_Belanja_Sumut_Tahunan_2026.xlsx");
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
    toast.textContent = "✔ Aksi berhasil disimpan ke Database SPJ & BKU!";
    toast.style.opacity = "1";
    toast.style.display = "block";
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => { toast.style.display = "none"; }, 300);
    }, 4000);
}