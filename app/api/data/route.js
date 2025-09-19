import * as cheerio from 'cheerio'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  try {
    const res = await fetch('https://himalayareload.otoreport.com/harga.js.php?id=b61804374cb7e3d207028ac05b492f82265047801111a2c0bc3bb288a7a843341b24cdc21347fbc9ba602392b435df468647-6', {
      cache: 'no-store'
    })
    const text = await res.text()
    const $ = cheerio.load(text)

    let result = []
    $('.tablewrapper').each((i, wrapper) => {
      const title = $(wrapper).find('tr.head td.center.last').first().text().trim()
      let items = []
      $(wrapper).find('tr').slice(2).each((j, row) => {
        const tds = $(row).find('td')
        if (tds.length >= 4) {
          items.push({
            kategori: title,
            kode: $(tds[0]).text().trim(),
            keterangan: $(tds[1]).text().trim(),
            harga: $(tds[2]).text().trim(),
            status: $(tds[3]).text().trim(),
            harga_lama: null,
            tanggal_scrape: new Date().toISOString()
          })
        }
      })
      result.push({ kategori: title, data: items })
    })

    // simpan ke Supabase
    for (const kat of result) {
      for (const item of kat.data) {
        await supabase
          .from('produk')
          .upsert({
            kategori: kat.kategori,
            kode: item.kode,
            keterangan: item.keterangan,
            harga: item.harga,
            status: item.status,
            harga_lama: item.harga_lama,
            tanggal_scrape: item.tanggal_scrape
          }, { onConflict: 'kode' })
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
