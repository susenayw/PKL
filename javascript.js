// DATABASE KOSONG DI AWAL (Kanvas Bersih)
let hierarkiSPJ = [];
let riwayatBKU = [];
let saldoKasSaatIni = 805562377; // Asumsi saldo awal pembukuan Kas Umum

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

// =================================================================
// SESSION GUARD & LOGOUT BUTTON 
// =================================================================
document.addEventListener("DOMContentLoaded", function() {
    // Cek Sesi Login (Pastikan user masuk lewat login.html)
    if (sessionStorage.getItem('sesi_login_diskominfo') !== 'aktif') {
        alert("Akses Ditolak! Anda harus login terlebih dahulu.");
        window.location.assign('login.html');
        return; 
    }

    buatTombolLogout();
    setupEventListeners();
});

function buatTombolLogout() {
    const header = document.querySelector('header');
    if(header) {
        header.style.position = 'relative'; 
        
        const btnLogout = document.createElement('button');
        btnLogout.innerHTML = '⎋ Keluar / Logout';
        btnLogout.style.position = 'absolute';
        btnLogout.style.top = '20px';
        btnLogout.style.right = '20px';
        btnLogout.style.padding = '8px 16px';
        btnLogout.style.backgroundColor = '#be123c';
        btnLogout.style.color = 'white';
        btnLogout.style.border = 'none';
        btnLogout.style.borderRadius = '6px';
        btnLogout.style.fontWeight = 'bold';
        btnLogout.style.cursor = 'pointer';
        btnLogout.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        btnLogout.style.transition = '0.2s';
        
        btnLogout.addEventListener('mouseover', () => btnLogout.style.backgroundColor = '#9f1239');
        btnLogout.addEventListener('mouseout', () => btnLogout.style.backgroundColor = '#be123c');
        
        btnLogout.addEventListener('click', function() {
            sessionStorage.removeItem('sesi_login_diskominfo');
            window.location.assign('login.html');
        });
        
        header.appendChild(btnLogout);
    }
}
// =================================================================

function isParent(kode) {
    return hierarkiSPJ.some(item => item.kode !== kode && item.kode.startsWith(kode + "."));
}

function getParent(kode) {
    let segments = kode.split('.');
    while (segments.length > 1) {
        segments.pop();
        let parentKode = segments.join('.');
        let parentIndex = hierarkiSPJ.findIndex(i => i.kode === parentKode);
        if (parentIndex !== -1) return hierarkiSPJ[parentIndex];
    }
    return null;
}

function getDepth(kode) {
    return hierarkiSPJ.filter(item => item.kode !== kode && kode.startsWith(item.kode + ".")).length;
}

// Render Tabel SPJ Berjenjang dengan Tombol Hapus
function renderSPJTable(updatedKode = null) {
    const tbody = document.querySelector("#spjTable tbody");
    tbody.innerHTML = ""; 
    
    if (hierarkiSPJ.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #9ca3af; font-style: italic;">Database kosong. Silakan buat rekening kepala baru.</td></tr>`;
        return;
    }

    hierarkiSPJ.forEach(data => {
        const parentStatus = isParent(data.kode);
        const depthLevel = getDepth(data.kode);
        
        let styleStr = parentStatus ? "font-weight: 700; color: #111827;" : "font-style: italic; color: #4b5563;";
        let indentPx = depthLevel * 20; 

        const row = document.createElement("tr");
        row.innerHTML = `
            <td style="${styleStr}">${data.kode}</td>
            <td style="${styleStr} padding-left: ${indentPx}px;">${data.uraian}</td>
            <td style="${styleStr}">${formatRupiah(data.anggaranSisa)}</td>
            <td style="text-align: center;">
                <button onclick="hapusRekening('${data.kode}')" style="background-color: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">Hapus</button>
            </td>
        `;

        if (updatedKode && (updatedKode === data.kode || updatedKode.startsWith(data.kode + "."))) {
            row.style.backgroundColor = "#fecdd3"; 
            row.style.transition = "background-color 2.5s ease"; 
            setTimeout(() => { row.style.backgroundColor = ""; }, 2500);
        }
        
        if (updatedKode === "ADD_" + data.kode) {
            row.style.backgroundColor = "#ccfbf1"; 
            row.style.transition = "background-color 2.5s ease"; 
            setTimeout(() => { row.style.backgroundColor = ""; }, 2500);
        }

        tbody.appendChild(row);
    });
}

function updateDropdownTransaksi() {
    const select = document.getElementById("pilihRekening");
    select.innerHTML = '<option value="">-- Pilih Rekening --</option>';
    
    if (hierarkiSPJ.length === 0) {
        select.innerHTML = '<option value="">-- Kamus Kosong, Buat Rekening Dahulu --</option>';
        return;
    }

    hierarkiSPJ.forEach(item => {
        const option = document.createElement("option");
        option.value = item.kode;
        option.textContent = `${item.kode} - ${item.uraian.substring(0, 50)}${item.uraian.length > 50 ? '...' : ''}`;
        select.appendChild(option);
    });
}

function setupEventListeners() {
    const formRekening = document.getElementById("formRekening");
    const formTransaksi = document.getElementById("formTransaksi");
    
    const inputAlokasi = document.getElementById("newAlokasi");
    const inputPengeluaran = document.getElementById("pengeluaran");
    const pilihRekening = document.getElementById("pilihRekening");
    
    const btnDownloadBKU = document.getElementById("btnDownloadBKU");
    const btnDownloadSPJ = document.getElementById("btnDownloadSPJ");

    [inputAlokasi, inputPengeluaran].forEach(input => {
        input.addEventListener("input", function(e) {
            let rawValue = this.value.replace(/[^0-9]/g, '');
            if (rawValue !== "") {
                this.value = new Intl.NumberFormat('id-ID').format(rawValue);
            } else {
                this.value = "";
            }
        });
    });

    // ==========================================
    // AKSI 1: TAMBAH KODE REKENING / ALOKASI BARU
    // ==========================================
    formRekening.addEventListener("submit", function(e) {
        e.preventDefault();
        
        const kode = document.getElementById("newKode").value.trim();
        const uraian = document.getElementById("newUraian").value.trim();
        const alokasi = parseFloat(inputAlokasi.value.replace(/\./g, '')) || 0;

        let parent = getParent(kode);

        if (parent) {
            if (alokasi > parent.unallocated) {
                alert(`[LIMIT TERCAPAI] Alokasi ditolak!\n\nDompet Induk (${parent.kode}) tidak memiliki sisa dana yang cukup.\nSisa pagu Induk yang bisa dibagikan ke cabang hanya: ${formatRupiah(parent.unallocated)}`);
                return;
            }
            parent.unallocated -= alokasi; 
        } else {
            if (hierarkiSPJ.length > 0 && kode.includes('.')) {
                const isRoot = confirm(`Sistem tidak menemukan Induk untuk rekening '${kode}'.\n\n- Klik [OK] jika '${kode}' adalah KEPALA REKENING UTAMA.\n- Klik [Batal] jika ini adalah Cabang (Anda harus membuat Induknya lebih dulu).`);
                if (!isRoot) return; 
            }
        }

        const existingIndex = hierarkiSPJ.findIndex(i => i.kode === kode);
        
        if (existingIndex !== -1) {
            hierarkiSPJ[existingIndex].anggaranAwal += alokasi;
            hierarkiSPJ[existingIndex].anggaranSisa += alokasi;
            hierarkiSPJ[existingIndex].unallocated += alokasi; 
            showToast(`✔ Dompet Rekening ${kode} berhasil ditambah.`);
        } else {
            hierarkiSPJ.push({
                kode: kode,
                uraian: uraian,
                anggaranAwal: alokasi,
                anggaranSisa: alokasi,
                unallocated: alokasi, 
                pengeluaranTotal: 0
            });
            showToast(`✔ Rekening baru berhasil didaftarkan.`);
        }

        hierarkiSPJ.sort((a, b) => a.kode.localeCompare(b.kode, undefined, {numeric: true}));

        formRekening.reset();
        renderSPJTable("ADD_" + kode);
        updateDropdownTransaksi();
    });

    pilihRekening.addEventListener("change", function() {
        const item = hierarkiSPJ.find(i => i.kode === this.value);
        const info = document.getElementById("budgetInfo");
        if(item) {
            info.innerHTML = `Sisa Anggaran Saat Ini: <strong style="color:#115e59;">${formatRupiah(item.anggaranSisa)}</strong>`;
            info.style.display = "block";
        } else {
            info.style.display = "none";
        }
    });

    // ==========================================
    // AKSI 2: PENGELUARAN BKU
    // ==========================================
    formTransaksi.addEventListener("submit", function(e) {
        e.preventDefault();
        
        const tanggal = document.getElementById("tanggal").value;
        const noBukti = document.getElementById("noBukti").value;
        const kodeTarget = pilihRekening.value;
        const pengeluaran = parseFloat(inputPengeluaran.value.replace(/\./g, '')) || 0;

        if(!kodeTarget) { alert("Pilih rekening tujuan pengeluaran!"); return; }
        if(pengeluaran <= 0) { alert("Jumlah pengeluaran tidak valid!"); return; }

        const itemTarget = hierarkiSPJ.find(i => i.kode === kodeTarget);

        if (pengeluaran > itemTarget.anggaranSisa) {
            alert(`Pengeluaran ditolak! Sisa anggaran di rekening ini tidak mencukupi.`);
            return;
        }

        saldoKasSaatIni -= pengeluaran;
        riwayatBKU.push({
            noUrut: riwayatBKU.length + 1,
            tanggal: tanggal,
            noBukti: noBukti,
            uraian: itemTarget.uraian,
            kodeRekening: kodeTarget,
            penerimaan: 0,
            pengeluaran: pengeluaran,
            saldo: saldoKasSaatIni
        });

        hierarkiSPJ.forEach(item => {
            if (kodeTarget === item.kode || kodeTarget.startsWith(item.kode + ".")) {
                item.anggaranSisa -= pengeluaran;
                item.pengeluaranTotal += pengeluaran;
            }
        });

        formTransaksi.reset();
        document.getElementById("budgetInfo").style.display = "none";
        renderSPJTable(kodeTarget); 
        showToast("✔ Transaksi sukses. Saldo rekening cabang dan kepala berhasil dipotong.");
    });

    btnDownloadBKU.addEventListener("click", generateExcelBKU);
    btnDownloadSPJ.addEventListener("click", generateExcelSPJ);
}

// ==========================================
// FUNGSI HAPUS REKENING DINAMIS
// ==========================================
function hapusRekening(kode) {
    if (!confirm(`Apakah Anda yakin ingin menghapus rekening ${kode}?`)) return;

    // Validasi 1: Jangan izinkan hapus jika punya anak cabang
    const hasChildren = hierarkiSPJ.some(item => item.kode !== kode && item.kode.startsWith(kode + "."));
    if (hasChildren) {
        alert(`[DITOLAK] Rekening ${kode} memiliki anak cabang.\nSilakan hapus anak cabangnya terlebih dahulu!`);
        return;
    }

    // Validasi 2: Jangan izinkan hapus jika rekening sudah dipakai transaksi
    const isUsedInTransactions = riwayatBKU.some(item => item.kodeRekening === kode || item.kodeRekening.startsWith(kode + "."));
    if (isUsedInTransactions) {
        alert(`[DITOLAK] Rekening ${kode} sudah memiliki riwayat transaksi di BKU.\nData tidak dapat dihapus untuk menjaga integritas laporan!`);
        return;
    }

    // Proses Refund: Kembalikan uang alokasi ke dompet induknya
    const rekeningToHapus = hierarkiSPJ.find(i => i.kode === kode);
    const parent = getParent(kode);

    if (parent && rekeningToHapus) {
        parent.unallocated += rekeningToHapus.anggaranAwal;
    }

    // Eksekusi Hapus dari Database Array
    hierarkiSPJ = hierarkiSPJ.filter(item => item.kode !== kode);

    renderSPJTable();
    updateDropdownTransaksi();
    showToast(`✔ Rekening ${kode} berhasil dihapus.`);
}

function applyBorders(cell) {
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
}

// -------------------------------------------------------------
// FUNGSI EXPORT EXCEL BKU
// -------------------------------------------------------------
async function generateExcelBKU() {
    if (riwayatBKU.length === 0) {
        alert("Belum ada transaksi BKU yang diinput.");
        return;
    }

    const tanggalInput = document.getElementById("tanggal") ? document.getElementById("tanggal").value : new Date();
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
// FUNGSI EXPORT EXCEL SPJ 
// -------------------------------------------------------------
async function generateExcelSPJ() {
    if (hierarkiSPJ.length === 0) {
        alert("Database kosong. Tidak ada SPJ yang bisa diekspor.");
        return;
    }

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
        const parentStatus = isParent(data.kode);
        const depthLevel = getDepth(data.kode);

        const row = ws.addRow([
            data.kode, data.uraian, data.anggaranAwal, 
            0, 0, 0, 0, 0, 0, 
            0, data.pengeluaranTotal, data.pengeluaranTotal, 
            data.pengeluaranTotal, data.anggaranSisa 
        ]);
        
        row.eachCell((cell, colNum) => {
            applyBorders(cell);
            
            if (parentStatus) cell.font = { bold: true };
            else cell.font = { italic: true };

            if (colNum === 2) {
                cell.alignment = { horizontal: 'left', wrapText: true, indent: depthLevel };
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

function showToast(message) {
    let toast = document.getElementById("customToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "customToast";
        toast.style.position = "fixed";
        toast.style.bottom = "20px";
        toast.style.right = "20px";
        toast.style.backgroundColor = "#111827"; 
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
    toast.textContent = message;
    toast.style.opacity = "1";
    toast.style.display = "block";
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => { toast.style.display = "none"; }, 300);
    }, 4000);
}