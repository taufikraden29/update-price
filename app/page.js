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

  useEffect(() => {
    const fetchData = () => {
      fetch('/api/data')
        .then(res => res.json())
        .then(json => {
          setData(json);
          setLastUpdated(new Date().toLocaleString('id-ID'));
        })
        .catch(err => console.error(err));
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // gangguanData untuk grafik
  const gangguanData = useMemo(() => {
    const counts = {};
    data.forEach(kat => {
      kat.data.forEach(item => {
        if (item.status !== 'Open') {
          const key = item.keterangan;
          counts[key] = (counts[key] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [data]);

  // filter data hanya berdasarkan kode
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data
      .map(kategori => {
        const filteredItems = kategori.data.filter(item =>
          (item.kode || '').toLowerCase().includes(term)
        );
        return { ...kategori, data: filteredItems };
      })
      .filter(kat => kat.data.length > 0); // buang kategori kosong
  }, [data, searchTerm]);

  // util untuk download csv
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

  // export laporan harga (semua)
  const exportLaporanHarga = () => {
    let csv = 'Kategori,Kode,Keterangan,Harga,Status\n';
    data.forEach(kat => {
      kat.data.forEach(item => {
        csv += `"${kat.kategori}",${item.kode},"${item.keterangan}",${item.harga},${item.status}\n`;
      });
    });
    downloadCSV(csv, 'laporan_harga.csv');
  };

  const exportPerubahanHarga = () => {
    let csv = 'Kategori,Kode,Keterangan,Harga Lama,Harga Baru,Tanggal Update\n';
    data.forEach(kat => {
      kat.data
        .filter(item => item.hargaLama && item.harga !== item.hargaLama)
        .forEach(item => {
          csv += `"${kat.kategori}",${item.kode},"${item.keterangan}",${item.hargaLama},${item.harga},${item.tanggalUpdate || ''}\n`;
        });
    });
    downloadCSV(csv, 'laporan_perubahan_harga.csv');
  };

  const exportStatusProduk = () => {
    let csv = 'Kategori,Kode,Keterangan,Harga,Status\n';
    data.forEach(kat => {
      kat.data.forEach(item => {
        csv += `"${kat.kategori}",${item.kode},"${item.keterangan}",${item.harga},${item.status}\n`;
      });
    });
    downloadCSV(csv, 'laporan_status_produk.csv');
  };

  const exportProdukPerKategori = () => {
    let csv = 'Kategori,Total Produk\n';
    data.forEach(kat => {
      csv += `"${kat.kategori}",${kat.data.length}\n`;
    });
    downloadCSV(csv, 'laporan_produk_per_kategori.csv');
  };

  const exportTrendHarian = () => {
    let csv = 'Tanggal,Kategori,Kode,Keterangan,Harga,Status\n';
    data.forEach(kat => {
      kat.data.forEach(item => {
        csv += `${item.tanggalScrape || ''},"${kat.kategori}",${item.kode},"${item.keterangan}",${item.harga},${item.status}\n`;
      });
    });
    downloadCSV(csv, 'laporan_trend_harian.csv');
  };

  const exportKetersediaan = () => {
    let csv = 'Kategori,Kode,Keterangan,Harga,Status\n';
    data.forEach(kat => {
      kat.data
        .filter(item => item.status === 'Open')
        .forEach(item => {
          csv += `"${kat.kategori}",${item.kode},"${item.keterangan}",${item.harga},${item.status}\n`;
        });
    });
    downloadCSV(csv, 'laporan_ketersediaan.csv');
  };

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '20px auto',
        padding: '10px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: '#f5f7fa'
      }}
    >
      <h1
        style={{
          textAlign: 'center',
          marginBottom: '10px',
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          color: '#2d3748'
        }}
      >
        Dashboard Produk
      </h1>
      <p style={{ textAlign: 'center', color: '#718096', marginBottom: '20px' }}>
        Terakhir diperbarui: {lastUpdated}
      </p>

      {/* Menu Tab */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '20px'
        }}
      >
        <button
          onClick={() => setActiveTab('tabel')}
          style={tabButton(activeTab === 'tabel')}
        >
          Tabel Data
        </button>
        <button
          onClick={() => setActiveTab('grafik')}
          style={tabButton(activeTab === 'grafik')}
        >
          Grafik Gangguan
        </button>
      </div>

      {/* Tombol laporan */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          justifyContent: 'center',
          marginBottom: '20px'
        }}
      >
        <button onClick={exportLaporanHarga}>Export Laporan Harga</button>
        <button onClick={exportPerubahanHarga}>Export Perubahan Harga</button>
        <button onClick={exportStatusProduk}>Export Status Produk</button>
        <button onClick={exportProdukPerKategori}>Export Produk/Kategori</button>
        <button onClick={exportTrendHarian}>Export Trend Harian</button>
        <button onClick={exportKetersediaan}>Export Ketersediaan</button>
      </div>

      {activeTab === 'grafik' && (
        <div>
          <h2
            style={{
              textAlign: 'center',
              marginBottom: '10px',
              fontSize: 'clamp(1.2rem, 3vw, 1.4rem)'
            }}
          >
            10 Produk Sering Gangguan
          </h2>
          <div style={{ width: '100%', height: 300, marginBottom: '40px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={gangguanData}
                layout="vertical"
                margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={window.innerWidth < 500 ? 100 : 200}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip />
                <Bar dataKey="value" fill="#E53E3E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'tabel' && (
        <div>
          {/* input pencarian */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Cari kode produk..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                width: '90%',
                maxWidth: '400px',
                borderRadius: '4px',
                border: '1px solid #cbd5e0'
              }}
            />
          </div>

          {filteredData.length === 0 && (
            <p style={{ textAlign: 'center', color: '#718096' }}>
              Tidak ada produk dengan kode tersebut.
            </p>
          )}

          {filteredData.map((kategori, idx) => (
            <div key={idx} style={{ marginBottom: '20px' }}>
              <h2
                style={{
                  background: 'linear-gradient(90deg,#4A90E2,#357ABD)',
                  color: '#fff',
                  padding: '12px 20px',
                  borderRadius: '8px 8px 0 0',
                  margin: 0,
                  fontSize: 'clamp(1.1rem,3vw,1.3rem)'
                }}
              >
                {kategori.kategori}
              </h2>
              <div
                style={{
                  overflowX: 'auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  borderRadius: '0 0 8px 8px'
                }}
              >
                <table
                  style={{
                    width: '100%',
                    minWidth: '300px',
                    borderCollapse: 'collapse',
                    backgroundColor: '#fff',
                    fontSize: window.innerWidth < 500 ? '0.8rem' : '0.95rem'
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#edf2f7' }}>
                      <th style={headerStyle}>Kode</th>
                      <th style={headerStyle}>Keterangan</th>
                      <th style={{ ...headerStyle, textAlign: 'right' }}>Harga</th>
                      <th style={{ ...headerStyle, textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kategori.data.map((item, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={cellStyle}>{item.kode}</td>
                        <td style={cellStyle}>{item.keterangan}</td>
                        <td
                          style={{
                            ...cellStyle,
                            textAlign: 'right',
                            fontWeight: '500'
                          }}
                        >
                          {item.harga}
                        </td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              backgroundColor:
                                item.status === 'Open' ? 'tomato' : '#E53E3E',
                              color: '#fff',
                              fontSize: '0.8rem',
                              fontWeight: '600'
                            }}
                          >
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

const tabButton = active => ({
  padding: '8px 14px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: active ? '#4A90E2' : '#E2E8F0',
  color: active ? '#fff' : '#2d3748',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: 'clamp(0.8rem,2.5vw,1rem)'
});

const headerStyle = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: '0.85rem',
  color: '#4a5568',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const cellStyle = {
  padding: '10px 12px',
  color: '#2d3748'
};
