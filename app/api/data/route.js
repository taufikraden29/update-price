import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data.json');

export async function GET() {
  console.log('--- Mulai proses scraping ---');
  try {
    // 1. Ambil data terbaru
    console.log('Mengambil data terbaru dari situs...');
    const res = await fetch('https://himalayareload.otoreport.com/harga.js.php?id=b61804374cb7e3d207028ac05b492f82265047801111a2c0bc3bb288a7a843341b24cdc21347fbc9ba602392b435df468647-6');
    const text = await res.text();
    const $ = cheerio.load(text);

    // 2. Parse HTML
    let result = [];
    $('.tablewrapper').each((i, wrapper) => {
      const title = $(wrapper).find('tr.head td.center.last').first().text().trim();
      let items = [];
      $(wrapper)
        .find('tr')
        .slice(2)
        .each((j, row) => {
          const tds = $(row).find('td');
          if (tds.length >= 4) {
            items.push({
              kode: $(tds[0]).text().trim(),
              keterangan: $(tds[1]).text().trim(),
              harga: $(tds[2]).text().trim(),
              status: $(tds[3]).text().trim(),
              hargaLama: null, // akan diisi kalau update
              tanggalScrape: new Date().toISOString()
            });
          }
        });
      result.push({
        kategori: title,
        data: items,
      });
    });

    // 3. Baca data lama
    let oldData = [];
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      oldData = JSON.parse(raw);
    }

    // 4. Bandingkan dan update
    let updatedData = JSON.parse(JSON.stringify(oldData));
    if (oldData.length === 0) {
      updatedData = result;
    } else {
      result.forEach((kategoriBaru, idx) => {
        if (!updatedData[idx] || updatedData[idx].kategori !== kategoriBaru.kategori) {
          updatedData[idx] = kategoriBaru;
        } else {
          kategoriBaru.data.forEach(itemBaru => {
            const indexLama = updatedData[idx].data.findIndex(i => i.kode === itemBaru.kode);
            if (indexLama === -1) {
              // item baru
              updatedData[idx].data.push(itemBaru);
            } else {
              const itemLama = updatedData[idx].data[indexLama];
              // simpan harga lama sebelum diupdate
              itemBaru.hargaLama = itemLama.harga || null;
              if (
                itemLama.harga !== itemBaru.harga ||
                itemLama.status !== itemBaru.status ||
                itemLama.keterangan !== itemBaru.keterangan
              ) {
                updatedData[idx].data[indexLama] = itemBaru;
              } else {
                // tidak berubah, tetap update tanggalScrape
                itemLama.tanggalScrape = new Date().toISOString();
                updatedData[idx].data[indexLama] = itemLama;
              }
            }
          });
        }
      });
    }

    // 5. Simpan file
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));

    console.log('--- Proses selesai ---');

    return new Response(JSON.stringify(updatedData), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Terjadi error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
