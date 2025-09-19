'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export default function Home() {
  const [data, setData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [activeTab, setActiveTab] = useState('tabel');
  const [searchTerm, setSearchTerm] = useState('');
  const [windowWidth, setWindowWidth] = useState(1200);

  // === Fetch data dari API ===
  useEffect(() => {
    const fetchData = () => {
      fetch('/api/produk')
        .then(res => res.json())
        .then(json => {
          let normalized = [];

          // kalau responsnya array of { kategori, data: [...] }
if (Array.isArray(json) && json.length > 0 && json[0].data) {
  normalized = json.flatMap(group =>
    group.data.map(item => ({
      ...item,
      kategori: group.kategori || "Umum"
    }))
  );
}
// kalau responsnya langsung array
else if (Array.isArray(json)) {
  normalized = json;
}
// kalau responsnya { kategori, data: [...] } tanpa array luar
else if (json?.data && Array.isArray(json.data)) {
  normalized = json.data.map(item => ({
    ...item,
    kategori: json.kategori || "Umum"
  }));
}

          setData(normalized);
          setLastUpdated(new Date().toLocaleString('id-ID'));
        })
        .catch(err => console.error(err));
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // === Resize window ===
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // === Data grafik gangguan ===
  const gangguanData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const counts = {};
    data.forEach(item => {
      if (item.status !== 'Open') {
        counts[item.keterangan] = (counts[item.keterangan] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [data]);

  // === Filter search ===
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item =>
      (item.kode || '').toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  // === Utility Export CSV ===
  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportLaporanHarga = () => {
    let csv = 'Kategori,Kode,Keterangan,Harga,Status\n';
    data.forEach(item => {
      csv += `"${item.kategori}",${item.kode},"${item.keterangan}",${item.harga},${item.status}\n`;
    });
    downloadCSV(csv, 'laporan_harga.csv');
  };

  const exportPerubahanHarga = () => {
    let csv = 'Kategori,Kode,Keterangan,Harga Lama,Harga Baru,Tanggal Update\n';
    data.forEach(item => {
      if (item.harga_lama && item.harga !== item.harga_lama) {
        csv += `"${item.kategori}",${item.kode},"${item.keterangan}",${item.harga_lama},${item.harga},${item.tanggal_scrape || ''}\n`;
      }
    });
    downloadCSV(csv, 'laporan_perubahan_harga.csv');
  };

  const exportStatusProduk = () => {
    let csv = 'Kategori,Kode,Keterangan,Harga,Status\n';
    data.forEach(item => {
      csv += `"${item.kategori}",${item.kode},"${item.keterangan}",${item.harga},${item.status}\n`;
    });
    downloadCSV(csv, 'laporan_status_produk.csv');
  };

  const exportProdukPerKategori = () => {
    let csv = 'Kategori,Total Produk\n';
    const grouped = data.reduce((acc, item) => {
      acc[item.kategori] = (acc[item.kategori] || 0) + 1;
      return acc;
    }, {});
    Object.entries(grouped).forEach(([kategori, total]) => {
      csv += `"${kategori}",${total}\n`;
    });
    downloadCSV(csv, 'laporan_produk_per_kategori.csv');
  };

  const exportTrendHarian = () => {
    let csv = 'Tanggal,Kategori,Kode,Keterangan,Harga,Status\n';
    data.forEach(item => {
      csv += `${item.tanggal_scrape || ''},"${item.kategori}",${item.kode},"${item.keterangan}",${item.harga},${item.status}\n`;
    });
    downloadCSV(csv, 'laporan_trend_harian.csv');
  };

  const exportKetersediaan = () => {
    let csv = 'Kategori,Kode,Keterangan,Harga,Status\n';
    data.filter(item => item.status === 'Open').forEach(item => {
      csv += `"${item.kategori}",${item.kode},"${item.keterangan}",${item.harga},${item.status}\n`;
    });
    downloadCSV(csv, 'laporan_ketersediaan.csv');
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>📊 Dashboard Produk</h1>
      <p style={{ textAlign: 'center', color: '#718096' }}>
        Terakhir diperbarui: <span style={{ fontWeight: 500 }}>{lastUpdated}</span>
      </p>

      {/* Tab */}
      <div style={tabWrapper}>
        <button onClick={() => setActiveTab('tabel')} style={tabButton(activeTab === 'tabel')}>Tabel Data</button>
        <button onClick={() => setActiveTab('grafik')} style={tabButton(activeTab === 'grafik')}>Grafik Gangguan</button>
      </div>

      {/* Tombol Export */}
      <div style={exportWrapper}>
        <button style={btnExport} onClick={exportLaporanHarga}>Export Harga</button>
        <button style={btnExport} onClick={exportPerubahanHarga}>Export Perubahan Harga</button>
        <button style={btnExport} onClick={exportStatusProduk}>Export Status</button>
        <button style={btnExport} onClick={exportProdukPerKategori}>Export Produk/Kategori</button>
        <button style={btnExport} onClick={exportTrendHarian}>Export Trend Harian</button>
        <button style={btnExport} onClick={exportKetersediaan}>Export Ketersediaan</button>
      </div>

      {activeTab === 'grafik' && (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={gangguanData} layout="vertical" margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={windowWidth < 500 ? 100 : 200} />
              <Tooltip />
              <Bar dataKey="value" fill="#3182CE" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'tabel' && (
        <div style={{ marginTop: '20px' }}>
          <input
            type="text"
            placeholder="🔍 Cari kode produk..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={searchInput}
          />

          {Object.entries(
  filteredData.reduce((acc, item) => {
    if (!acc[item.kategori]) acc[item.kategori] = [];
    acc[item.kategori].push(item);
    return acc;
  }, {})
).map(([kategori, items], idx) => (
  <div key={idx} style={{ marginTop: '30px' }}>
    <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '10px' }}>
      {kategori}
    </h2>
    <div style={tableWrapper}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={headerStyle}>Kode</th>
            <th style={headerStyle}>Keterangan</th>
            <th style={headerStyle}>Harga</th>
            <th style={headerStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={rowStyle}>
              <td style={cellStyle}>{item.kode}</td>
              <td style={cellStyle}>{item.keterangan}</td>
              <td style={cellStyle}>Rp {Number(item.harga)?.toLocaleString('id-ID')}</td>
              <td style={cellStyle}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  backgroundColor: item.status === 'Open' ? '#C6F6D5' : '#FED7D7',
                  color: item.status === 'Open' ? '#22543D' : '#742A2A'
                }}>
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
))}

        </div>
      )}
    </div>
  );
}

/* === Styles === */
const containerStyle = { maxWidth: '1200px', margin: '20px auto', padding: '20px', fontFamily: 'sans-serif', color: '#2D3748' };
const titleStyle = { textAlign: 'center', fontSize: '28px', fontWeight: '700', marginBottom: '10px' };
const tabWrapper = { display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' };
const exportWrapper = { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', margin: '20px 0' };

const tabButton = active => ({
  padding: '10px 16px',
  borderRadius: '8px',
  border: '1px solid #CBD5E0',
  backgroundColor: active ? '#3182CE' : '#EDF2F7',
  color: active ? '#fff' : '#2D3748',
  cursor: 'pointer',
  fontWeight: 600,
  transition: 'all 0.2s',
});

const btnExport = {
  padding: '8px 14px',
  borderRadius: '6px',
  border: '1px solid #CBD5E0',
  backgroundColor: '#F7FAFC',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'all 0.2s',
};
btnExport[':hover'] = { backgroundColor: '#E2E8F0' };

const searchInput = {
  display: 'block',
  margin: '10px auto',
  padding: '10px 14px',
  width: '100%',
  maxWidth: '400px',
  borderRadius: '8px',
  border: '1px solid #CBD5E0',
  outline: 'none',
};

const tableWrapper = { overflowX: 'auto', background: '#fff', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', marginTop: '20px' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const headerStyle = { padding: '12px', borderBottom: '2px solid #E2E8F0', textAlign: 'left', background: '#F7FAFC', fontWeight: 600 };
const cellStyle = { padding: '10px', borderBottom: '1px solid #E2E8F0', fontSize: '14px' };
const rowStyle = { transition: 'background 0.2s', cursor: 'default' };
