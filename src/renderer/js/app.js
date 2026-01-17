
        let jadwalSholat = {}; 
        let audioAdzan = new Audio('../assets/adzan.mp3'); // Path updated for Electron structure (relative to index.html)
        
        let audioEnabled = false; // Status izin audio
        let lastCheckedMinute = ''; // Untuk mencegah adzan dipanggil berkali-kali di menit yang sama

        // --- 2. FUNGSI UTAMA (MAIN) ---
        function init() {
            updateJam();
            ambilLokasi();
            setInterval(updateJam, 1000); // Update jam tiap detik
        }

        async function cityName (lat, long) {
            const urlCity = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}`;
            try {
                const response = await fetch(urlCity);
                const data = await response.json();
                const city = data.address.city || data.address.town || "Lokasi tidak ditemukan";
                document.getElementById('lokasi-txt').innerText = `${city} (${lat.toFixed(2)}, ${long.toFixed(2)})`;
            }
            catch (error) {
                console.error("Error fetch city name:", error);
                document.getElementById('lokasi-txt').innerText = `Lat: ${lat.toFixed(2)}, Long: ${long.toFixed(2)}`;
            }   
        }



        //AMBIL LOKASI
        function ambilLokasi() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                    const lat = pos.coords.latitude;
                    const long = pos.coords.longitude;
                    document.getElementById('lokasi-txt').innerText = `Mencari nama kota...`;
                    fetchJadwal(lat, long);
                    cityName(lat, long);
                }, err => {
                    document.getElementById('lokasi-txt').innerText = "Gagal ambil lokasi. Pastikan GPS aktif.";
                    // Default fallback location if needed, or just show error
                    console.error("Geolocation error:", err);
                });
            } else {
                 document.getElementById('lokasi-txt').innerText = "Browser tidak mendukung Geolocation.";
            }
        }

    // API Jadwal Sholat dari Aladhan
        async function fetchJadwal(lat, long) {
            const timestamp = Math.floor(Date.now() / 1000);
            // Kemenag RI (API nya ada dari kemenag coy)
            const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${long}&method=20`;
            
            try {
                const response = await fetch(url);
                const data = await response.json();
                const timings = data.data.timings;

                // Filter hanya waktu sholat wajib
                jadwalSholat = {
                    Subuh: timings.Fajr,
                    Dzuhur: timings.Dhuhr,
                    Ashar: timings.Asr,
                    Maghrib: timings.Maghrib,
                    Isya: timings.Isha
                };

                renderJadwal();
            } catch (error) {
                console.error("Error API:", error);
            }
        }
        function renderJadwal() {
            const container = document.getElementById('jadwal-list');
            container.innerHTML = '';

            for (const [nama, waktu] of Object.entries(jadwalSholat)) {
                const item = `
                    <div class="flex justify-between items-center p-3 bg-white border border-gray-200 rounded hover:bg-emerald-50 transition">
                        <span class="font-medium text-gray-700">${nama}</span>
                        <span class="font-bold text-emerald-600">${waktu}</span>
                    </div>
                `;
                container.innerHTML += item;
            }
        }

        // --- 6. JAM REALTIME & CEK WAKTU ADZAN ---
        function updateJam() {
            const now = new Date();
            const timeString = now.toLocaleTimeString('id-ID', { hour12: false });
            const currentHM = timeString.substring(0, 5); 

            document.getElementById('jam-sekarang').innerText = timeString;
            
            // Cek waktu sholat setiap detik, tapi hanya panggil adzan sekali per menit
            cekWaktuSholat(currentHM);
        }

        function cekWaktuSholat(waktuSekarang) {
            // Jika menit ini sudah dicek, skip
            if (lastCheckedMinute === waktuSekarang) {
                return;
            }

            for (const [nama, waktuJadwal] of Object.entries(jadwalSholat)) {
                
                if (waktuSekarang === waktuJadwal) {
                    console.log(`🔔 Waktu ${nama}! Memanggil adzan...`);
                    lastCheckedMinute = waktuSekarang; // Tandai sudah dicek
                    mainkanAdzan(nama);
                    break; // Keluar setelah menemukan waktu yang cocok
                }
            }
        }

        // AUDIO & POPUP
        function enableAudio() {
            audioAdzan.play().then(() => {
                audioAdzan.pause();
                audioAdzan.currentTime = 0;
                audioEnabled = true;
                alert("Audio diaktifkan! Adzan akan bunyi otomatis.");
            }).catch(e => alert("Gagal akses audio: " + e));
        }

        function mainkanAdzan(namaSholat) {
            // Tampilkan Popup
            document.getElementById('nama-sholat').innerText = namaSholat;
            document.getElementById('modal-adzan').classList.remove('hidden');
            
            // Mainkan audio adzan
            if (audioEnabled) {
                audioAdzan.pause(); // Hentikan dulu jika sedang playing
                audioAdzan.currentTime = 0; // Reset ke awal
                audioAdzan.play().catch(e => {
                    console.error("Audio play error:", e);
                    // alert("Gagal memutar adzan: " + e.message); // Don't allow multiple alerts to block
                });
            } else {
                // alert("Audio belum diaktifkan. Klik tombol 'Aktifkan Audio' terlebih dahulu.");
            }
        }

        function tutupModal() {
            audioAdzan.pause();
            audioAdzan.currentTime = 0;
            document.getElementById('modal-adzan').classList.add('hidden');
        }
       

function toggleAdzan() {
    const btn = document.getElementById('playAudio');

    if (audioAdzan.paused) {
        
        audioAdzan.play();
        
        btn.innerText = "⏹️ Stop Adzan";
        btn.classList.remove('bg-amber-800', 'hover:bg-amber-950'); 
        btn.classList.add('bg-red-500', 'hover:bg-red-600');  

    } else {
        
        audioAdzan.pause();
        
        btn.innerText = "▶️ Coba Putar Adzan";
        btn.classList.remove('bg-red-500', 'hover:bg-red-600');
        btn.classList.add('bg-amber-800', 'hover:bg-amber-950');
    }
}

audioAdzan.onended = function() {
    const btn = document.getElementById('playAudio');
    btn.innerText = "▶️ Coba Putar Adzan";
    btn.classList.remove('bg-red-500', 'hover:bg-red-600');
    btn.classList.add('bg-amber-800', 'hover:bg-amber-950');
};
        init();
