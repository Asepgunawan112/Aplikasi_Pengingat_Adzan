
let jadwalSholat = {}
const audioAdzan = new Audio('../assets/adzan.mp3')

let audioEnabled = false
let lastCheckedMinute = ''

function init () {
    updateJam()
    ambilLokasi()
    setInterval(updateJam, 1000)
}

async function cityName (lat, long) {
    const urlCity = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}`
    try {
        const response = await fetch(urlCity)
        const data = await response.json()
        const city = data.address.city || data.address.town || 'Lokasi tidak ditemukan'
        document.getElementById('lokasi-txt').innerText = `${city} (${lat.toFixed(2)}, ${long.toFixed(2)})`
    } catch (error) {
        console.error('Error fetch city name:', error)
        document.getElementById('lokasi-txt').innerText = `Lat: ${lat.toFixed(2)}, Long: ${long.toFixed(2)}`
    }
}

// AMBIL LOKASI
// AMBIL LOKASI
function ambilLokasi () {
    const lokasiTxt = document.getElementById('lokasi-txt')

    if (navigator.geolocation) {
        lokasiTxt.innerText = 'Mencari lokasi via GPS...'
        
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude
            const long = pos.coords.longitude
            lokasiTxt.innerText = 'Mencari nama kota...'
            fetchJadwal(lat, long)
            cityName(lat, long)
        }, err => {
            console.error('Geolocation error:', err)
            let msg = 'Gagal ambil lokasi GPS.'
            
            if (err.code === err.PERMISSION_DENIED) {
                msg = 'Izin lokasi ditolak.'
            } else if (err.code === err.POSITION_UNAVAILABLE) {
                msg = 'Informasi lokasi tidak tersedia.'
            } else if (err.code === err.TIMEOUT) {
                msg = 'Waktu permintaan lokasi habis.'
            }

            lokasiTxt.innerHTML = `${msg} <br> <span class="text-xs text-gray-500">Mencoba via Internet (IP)...</span>`
            
            // Fallback ke IP
            getIpLocation()
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        })
    } else {
        lokasiTxt.innerText = 'Browser tidak mendukung Geolocation. Mencoba IP...'
        getIpLocation()
    }
}

async function getIpLocation() {
    const lokasiTxt = document.getElementById('lokasi-txt')
    try {
        const response = await fetch('https://ipapi.co/json/')
        if (!response.ok) throw new Error('IP API Error')
        
        const data = await response.json()
        const lat = data.latitude
        const long = data.longitude
        const city = data.city || data.region || 'Lokasi Internet'
        
        lokasiTxt.innerText = `${city} (via IP)`
        fetchJadwal(lat, long)
        
    } catch (error) {
        console.error('IP Location error:', error)
        lokasiTxt.innerHTML = `
            Gagal deteksi lokasi. <br>
            <button onclick="ambilLokasi()" class="mt-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200">
                🔄 Coba Lagi
            </button>
        `
    }
}

// API Jadwal Sholat dari Aladhan
async function fetchJadwal (lat, long) {
    const timestamp = Math.floor(Date.now() / 1000)
               // Kemenag RI (API nya ada dari kemenag coy)
    const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${long}&method=20`

    try {
        const response = await fetch(url)
        const data = await response.json()
        const timings = data.data.timings

        // jadwal sholat wajib
        jadwalSholat = {
            Subuh: timings.Fajr,
            Dzuhur: timings.Dhuhr,
            Ashar: timings.Asr,
            Maghrib: timings.Maghrib,
            Isya: timings.Isha
        }

        renderJadwal()
    } catch (error) {
        console.error('Error API:', error)
    }
}
function renderJadwal () {
    const container = document.getElementById('jadwal-list')
    container.innerHTML = ''

    for (const [nama, waktu] of Object.entries(jadwalSholat)) {
        const item = `
            <div class="flex justify-between items-center p-3 bg-white border border-gray-200 rounded hover:bg-emerald-50 transition">
                <span class="font-medium text-gray-700">${nama}</span>
                <span class="font-bold text-emerald-600">${waktu}</span>
            </div>
        `
        container.innerHTML += item
    }
}

// --- 6. JAM REALTIME & CEK WAKTU ADZAN ---
function updateJam () {
    const now = new Date()
    const timeString = now.toLocaleTimeString('id-ID', { hour12: false })
    const currentHM = timeString.substring(0, 5)

    document.getElementById('jam-sekarang').innerText = timeString

    // Cek waktu sholat setiap detik, tapi hanya panggil adzan sekali per menit
    cekWaktuSholat(currentHM)
}

function cekWaktuSholat (waktuSekarang) {
    if (lastCheckedMinute === waktuSekarang) {
        return
    }

    for (const [nama, waktuJadwal] of Object.entries(jadwalSholat)) {
        if (waktuSekarang === waktuJadwal) {
            console.log(`🔔 Waktu ${nama}! Memanggil adzan...`)
            lastCheckedMinute = waktuSekarang
            mainkanAdzan(nama)
            break
        }
    }
}

// AUDIO & POPUP
function enableAudio () {
    audioAdzan.play().then(() => {
        audioAdzan.pause()
        audioAdzan.currentTime = 0
        audioEnabled = true
        alert('Audio diaktifkan! Adzan akan bunyi otomatis.')
    }).catch(e => alert('Gagal akses audio: ' + e))
}

function mainkanAdzan (namaSholat) {
    document.getElementById('nama-sholat').innerText = namaSholat
    const modal = document.getElementById('modal-adzan')
    modal.classList.remove('hidden')
    modal.style.display = 'flex'

    if (audioEnabled) {
        audioAdzan.pause()
        audioAdzan.currentTime = 0
        audioAdzan.play().catch(e => {
            console.error('Audio play error:', e)
        })
    }
}

function tutupModal () {
    audioAdzan.pause()
    audioAdzan.currentTime = 0
    const modal = document.getElementById('modal-adzan')
    modal.classList.add('hidden')
    modal.style.display = 'none'
}

function toggleAdzan () {
    const btn = document.getElementById('playAudio')

    if (audioAdzan.paused) {
        audioAdzan.play()
        btn.innerText = '⏹️ Stop Adzan'
        btn.classList.remove('bg-amber-800', 'hover:bg-amber-950')
        btn.classList.add('bg-red-500', 'hover:bg-red-600')
    } else {
        audioAdzan.pause()
        btn.innerText = '▶️ Coba Putar Adzan'
        btn.classList.remove('bg-red-500', 'hover:bg-red-600')
        btn.classList.add('bg-amber-800', 'hover:bg-amber-950')
    }
}

audioAdzan.onended = function () {
    const btn = document.getElementById('playAudio')
    btn.innerText = '▶️ Coba Putar Adzan'
    btn.classList.remove('bg-red-500', 'hover:bg-red-600')
    btn.classList.add('bg-amber-800', 'hover:bg-amber-950')
}

init()
