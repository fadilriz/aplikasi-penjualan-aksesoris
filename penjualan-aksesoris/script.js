const scriptURL = "https://script.google.com/macros/s/AKfycbykorsFz6j22kazT1I2OHD8B-PWahkI8BQVyTCu_YyxShPNC5jcYKUIE7hqNrYzsUlp/exec";

/* ==========================
   FORMAT RUPIAH
========================== */
function formatRupiah(angka) {
  return "Rp " + Number(angka).toLocaleString("id-ID");
}

/* ==========================
   GLOBAL DATA
========================== */
let semuaData = [];

/* ==========================
   LOAD DATA SEKALI SAJA
========================== */
document.addEventListener("DOMContentLoaded", () => {

  fetch(scriptURL)
    .then(res => res.json())
    .then(data => {

      semuaData = data;

      // Dashboard
      if (document.getElementById("totalHariIni")) {
        renderDashboard(data);
      }

      // Laporan
      if (document.getElementById("laporanContainer")) {
        populateFilter(data);
        renderTable(data);
      }

    })
    .catch(err => console.log(err));

});


/* ==========================
   INPUT PENJUALAN
========================== */
const form = document.getElementById("form");

if (form) {
  form.addEventListener("submit", e => {
    e.preventDefault();

    const harga = Number(document.getElementById("harga").value);
    const jumlah = Number(document.getElementById("jumlah").value);

    fetch(scriptURL, {
      method: "POST",
      body: JSON.stringify({
        tanggal: document.getElementById("tanggal").value,
        nama: document.getElementById("nama").value,
        harga: harga,
        jumlah: jumlah
      })
    })
    .then(() => {
      alert("Data berhasil disimpan!");
      form.reset();
      location.reload();
    })
    .catch(err => console.log(err));
  });
}


/* ==========================
   DASHBOARD
========================== */
function renderDashboard(data) {

  const totalHariIniEl = document.getElementById("totalHariIni");
  const totalTransaksiEl = document.getElementById("totalTransaksi");
  const grafikDashboard = document.getElementById("grafikDashboard");

  let total = 0;
  let grouped = {};

  data.forEach(item => {

    let totalItem = Number(item["Harga"]) * Number(item["Jumlah"]);
    total += totalItem;

    let nama = item["Nama Barang"];
    if (!grouped[nama]) grouped[nama] = 0;
    grouped[nama] += totalItem;
  });

  totalHariIniEl.innerText = formatRupiah(total);
  totalTransaksiEl.innerText = data.length;

  if (grafikDashboard) {
    new Chart(grafikDashboard, {
      type: "bar",
      data: {
        labels: Object.keys(grouped),
        datasets: [{
          data: Object.values(grouped),
          backgroundColor: "#4f6edb",
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}


/* ==========================
   DROPDOWN PRODUK
========================== */
function populateFilter(data) {

  const filterProduk = document.getElementById("filterProduk");
  if (!filterProduk) return;

  filterProduk.innerHTML = '<option value="">Semua Produk</option>';

  const produkSet = new Set();

  data.forEach(item => {
    produkSet.add(item["Nama Barang"]);
  });

  produkSet.forEach(nama => {
    const option = document.createElement("option");
    option.value = nama;
    option.textContent = nama;
    filterProduk.appendChild(option);
  });
}


/* ==========================
   FILTER PRODUK
========================== */
function filterData() {

  const filterProduk = document.getElementById("filterProduk");
  const produkDipilih = filterProduk.value;

  if (!produkDipilih) {
    renderTable(semuaData);
    return;
  }

  const hasil = semuaData.filter(item =>
    item["Nama Barang"] === produkDipilih
  );

  renderTable(hasil);
}


/* ==========================
   RENDER TABLE + DELETE
========================== */
function renderTable(data) {

  const laporanContainer = document.getElementById("laporanContainer");
  if (!laporanContainer) return;

  let totalSemua = 0;

  let table = `
    <table class="laporan-table">
      <tr>
        <th>Tanggal</th>
        <th>Nama Barang</th>
        <th>Harga</th>
        <th>Jumlah</th>
        <th>Total</th>
        <th>Aksi</th>
      </tr>
  `;

  data.forEach(item => {

    let tanggal = item["Tanggal"]
      .split("T")[0]
      .split("-")
      .reverse()
      .join("/");

    let totalItem = Number(item["Harga"]) * Number(item["Jumlah"]);
    totalSemua += totalItem;

    table += `
      <tr>
        <td>${tanggal}</td>
        <td>${item["Nama Barang"]}</td>
        <td class="angka">${Number(item["Harga"]).toLocaleString("id-ID")}</td>
        <td class="angka">${item["Jumlah"]}</td>
        <td class="angka">${totalItem.toLocaleString("id-ID")}</td>
        <td>
          <button class="btn-delete" onclick="deleteData(${item.rowIndex})">
            Hapus
          </button>
        </td>
      </tr>
    `;
  });

  table += `
      <tr class="total-row">
        <td colspan="4">Total Semua</td>
        <td class="angka">${totalSemua.toLocaleString("id-ID")}</td>
        <td></td>
      </tr>
    </table>
  `;

  laporanContainer.innerHTML = table;
}


/* ==========================
   DELETE DATA
========================== */
function deleteData(rowIndex) {

  if (!confirm("Yakin ingin menghapus data ini?")) return;

  fetch(scriptURL, {
    method: "POST",
    body: JSON.stringify({
      action: "delete",
      rowIndex: rowIndex
    })
  })
  .then(res => res.json())
  .then(() => {
    alert("Data berhasil dihapus!");
    location.reload();
  })
  .catch(err => console.log(err));
}