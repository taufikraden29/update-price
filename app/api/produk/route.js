import * as cheerio from "cheerio";
import { supabase } from "../../lib/supabaseClient";

export async function GET() {
  try {
    console.log("Mulai fetch data dari URL...");
    const res = await fetch(
      "https://himalayareload.otoreport.com/harga.js.php?id=b61804374cb7e3d207028ac05b492f82265047801111a2c0bc3bb288a7a843341b24cdc21347fbc9ba602392b435df468647-6",
      {
        cache: "no-store",
      }
    );
    console.log("Fetch selesai, membaca teks...");
    const text = await res.text();

    console.log("Loading cheerio...");
    const $ = cheerio.load(text);

    let result = [];

    console.log("Memproses elemen .tablewrapper...");
    $(".tablewrapper").each((i, wrapper) => {
      const title = $(wrapper)
        .find("tr.head td.center.last")
        .first()
        .text()
        .trim();
      console.log(`Kategori ditemukan: ${title}`);

      let items = [];

      $(wrapper)
        .find("tr")
        .slice(2)
        .each((j, row) => {
          const tds = $(row).find("td");
          if (tds.length >= 4) {
            const kode = $(tds[0]).text().trim();
            const keterangan = $(tds[1]).text().trim();
            const harga = $(tds[2]).text().trim();
            const status = $(tds[3]).text().trim();

            console.log(
              `Menambahkan item: Kode=${kode}, Keterangan=${keterangan}`
            );

            items.push({
              kategori: title,
              kode,
              keterangan,
              harga,
              status,
              harga_lama: null,
              tanggal_scrape: new Date().toISOString(),
            });
          }
        });

      result.push({ kategori: title, data: items });
    });

    console.log("Flatten data untuk bulk upsert...");
    const flatData = result.flatMap((kat) =>
      kat.data.map((item) => ({
        kategori: kat.kategori,
        ...item,
      }))
    );

    console.log(`Jumlah data yang akan disimpan: ${flatData.length}`);
    // simpan ke Supabase (bulk upsert)
    const { error } = await supabase
      .from("produk")
      .upsert(flatData, { onConflict: "kode" });

    if (error) {
      console.error("Error saat upsert:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    console.log("Data berhasil disimpan ke database.");
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Terjadi error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
