import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "./style.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const starterSongs = [
  { title: "Kasih Setia-Mu", lines: ["Kasih setia-Mu tak pernah berakhir", "Rahmat-Mu selalu baru tiap pagi", "Besar setia-Mu, Tuhan", "Besar setia-Mu"] },
  { title: "Lagu Contoh", lines: ["Tambahkan lirik lagu melalui panel editor", "Pisahkan setiap slide dengan satu baris kosong", "Klik Terapkan, lalu pilih slide di daftar"] }
];
const bibleExamples = [
  { title: "Mazmur 23:1", text: "TUHAN adalah gembalaku, takkan kekurangan aku." },
  { title: "Filipi 4:13", text: "Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku." },
  { title: "Yohanes 3:16", text: "Karena begitu besar kasih Allah akan dunia ini, sehingga Ia telah mengaruniakan Anak-Nya yang tunggal, supaya setiap orang yang percaya kepada-Nya tidak binasa, melainkan beroleh hidup yang kekal." }
];

function App() {
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [songTitle, setSongTitle] = useState(starterSongs[0].title);
  const [songText, setSongText] = useState(starterSongs[0].lines.join("\n\n"));
  const [songSlides, setSongSlides] = useState(starterSongs[0].lines);
  const [verseRef, setVerseRef] = useState(bibleExamples[0].title);
  const [verseText, setVerseText] = useState(bibleExamples[0].text);
  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState({ type: "song", index: 0 });
  const [projector, setProjector] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [showText, setShowText] = useState(true);
  const [textSize, setTextSize] = useState(42);
  const [bg, setBg] = useState("#101827");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const pdfInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const current = active.type === "song"
    ? { heading: songTitle, text: songSlides[active.index] || songSlides[0] || "" }
    : active.type === "bible"
      ? { heading: verseRef, text: verseText }
      : { heading: slides[active.index]?.name || "Slide", image: slides[active.index]?.data, text: "" };

  useEffect(() => {
    if (videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  }, [cameraOn, projector]);

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCameraOn(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      setCameraError("Kamera tidak dapat dibuka. Izinkan akses kamera di browser dan pastikan kamera tidak sedang dipakai aplikasi lain.");
    }
  }
  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }
  function applySong() {
    const parsed = songText.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
    setSongSlides(parsed.length ? parsed : ["Tulis lirik lagu di panel editor."]);
    setActive({ type: "song", index: 0 });
  }
  async function loadPdf(file) {
    if (!file) return;
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const pages = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        const viewport = page.getViewport({ scale: 1.8 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        pages.push({ name: `${file.name} — ${n}/${pdf.numPages}`, data: canvas.toDataURL("image/png") });
      }
      setSlides(pages);
      setActive({ type: "ppt", index: 0 });
    } catch (e) {
      alert("PDF tidak bisa dibaca. Coba ekspor PowerPoint menjadi PDF, lalu unggah kembali.");
    }
  }
  async function loadImages(fileList) {
    const files = Array.from(fileList || []).filter(f => f.type.startsWith("image/"));
    const items = await Promise.all(files.map(file => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, data: reader.result });
      reader.readAsDataURL(file);
    })));
    if (items.length) {
      setSlides(items);
      setActive({ type: "ppt", index: 0 });
    }
  }
  function move(delta) {
    if (active.type === "song") setActive(s => ({ ...s, index: Math.max(0, Math.min(songSlides.length - 1, s.index + delta)) }));
    else if (active.type === "ppt") setActive(s => ({ ...s, index: Math.max(0, Math.min(slides.length - 1, s.index + delta)) }));
  }
  function selectSong(i) { setActive({ type: "song", index: i }); }
  function selectPpt(i) { setActive({ type: "ppt", index: i }); }
  function selectBible(v) { setVerseRef(v.title); setVerseText(v.text); setActive({ type: "bible", index: 0 }); }

  const stage = (
    <div className={`stage ${projector ? "stage-projector" : ""}`} style={{ "--stage-bg": bg, "--font-size": `${textSize}px` }}>
      {showCamera && <div className="live-pane">
        {cameraOn ? <video ref={videoRef} autoPlay playsInline muted /> : <div className="camera-placeholder"><div className="camera-symbol">◉</div><b>LIVE KAMERA</b><span>Aktifkan kamera dari panel operator</span></div>}
        <span className="live-tag"><i /> LIVE</span>
      </div>}
      {showText && <div className="slide-pane">
        {current.image ? <img className="slide-image" src={current.image} alt={current.heading} /> : <div className="slide-copy">
          <div className="slide-heading">{current.heading}</div>
          <div className="slide-main">{current.text}</div>
        </div>}
        <div className="slide-counter">{active.type === "song" ? `${active.index + 1} / ${songSlides.length}` : active.type === "ppt" ? `${active.index + 1} / ${slides.length}` : "AYAT ALKITAB"}</div>
      </div>}
    </div>
  );

  return <div className="app">
    {!projector && <header className="topbar">
      <div className="brand-mark">✦</div><div><h1>Ibadah Presenter</h1><p>Presentasi ibadah · versi awal</p></div>
      <div className="top-actions"><span className="status"><i /> Mode operator</span><button className="primary" onClick={() => { const w = window.open("", "ibadah-projector", "popup,width=1400,height=800"); if (!w) { alert("Izinkan pop-up untuk membuka layar proyektor."); return; } w.document.write(`<html><head><title>Layar Ibadah</title><style>body{margin:0;background:#080d16;color:white;font-family:Arial}#note{position:fixed;inset:0;display:grid;place-items:center;color:#9ba9bd;text-align:center}#note b{font-size:24px}#note p{max-width:560px;line-height:1.6} </style></head><body><div id="note"><div><b>Layar proyektor terpisah</b><p>Untuk versi pertama, gunakan tombol “Layar penuh” pada panel operator untuk memproyeksikan layar ini, atau gunakan mode layar penuh browser. Pastikan browser dan proyektor berada pada layar yang benar.</p><button onclick="document.documentElement.requestFullscreen()">Layar penuh</button></div></div></body></html>`); w.document.close(); setProjector(true); }} >Buka layar proyektor ↗</button></div>
    </header>}
    {projector ? <div className="projector-view">{stage}<button className="exit-projector" onClick={() => setProjector(false)}>Kembali ke operator</button></div> :
    <main className="workspace">
      <section className="preview-column">
        <div className="section-heading"><div><h2>Pratinjau layar</h2><p>Tampilan gabungan kamera dan slide</p></div><span className="pill">16:9</span></div>
        <div className="preview-frame">{stage}</div>
        <div className="transport">
          <button onClick={() => move(-1)} disabled={active.index <= 0}>← Sebelumnya</button>
          <div className="now-showing"><span>Sedang ditampilkan</span><b>{current.heading}</b></div>
          <button className="primary" onClick={() => move(1)} disabled={active.type === "bible" || active.index >= (active.type === "song" ? songSlides.length : slides.length) - 1}>Berikutnya →</button>
        </div>
        <div className="settings-row">
          <label className="toggle"><input type="checkbox" checked={showCamera} onChange={e => setShowCamera(e.target.checked)} /> Tampilkan kamera</label>
          <label className="toggle"><input type="checkbox" checked={showText} onChange={e => setShowText(e.target.checked)} /> Tampilkan slide</label>
          <label className="range-label">Ukuran teks <input type="range" min="24" max="64" value={textSize} onChange={e => setTextSize(Number(e.target.value))}/></label>
        </div>
      </section>
      <aside className="control-column">
        <div className="panel camera-panel">
          <div className="panel-title"><div><span className="eyebrow">SUMBER VIDEO</span><h3>Kamera live</h3></div><span className={`mini-status ${cameraOn ? "on" : ""}`}>{cameraOn ? "AKTIF" : "NONAKTIF"}</span></div>
          <p className="muted">Gunakan webcam laptop atau kamera USB.</p>
          {cameraError && <p className="error">{cameraError}</p>}
          {cameraOn ? <button className="danger full" onClick={stopCamera}>Matikan kamera</button> : <button className="primary full" onClick={startCamera}>Aktifkan kamera</button>}
          <p className="tiny">Browser biasanya memerlukan HTTPS atau localhost untuk mengakses kamera.</p>
        </div>
        <div className="panel">
          <div className="panel-title"><div><span className="eyebrow">KONTEN IBADAH</span><h3>Tambah PowerPoint</h3></div><span className="file-icon">▤</span></div>
          <p className="muted">Ekspor berkas .pptx menjadi PDF terlebih dahulu, lalu unggah PDF-nya. Setiap halaman menjadi satu slide.</p>
          <input ref={pdfInputRef} hidden type="file" accept="application/pdf,.pdf" onChange={e => loadPdf(e.target.files?.[0])}/>
          <button className="secondary full" onClick={() => pdfInputRef.current?.click()}>↑ Unggah PDF dari PowerPoint</button>
          <input ref={imageInputRef} hidden type="file" accept="image/*" multiple onChange={e => loadImages(e.target.files)}/>
          <button className="secondary full spaced" onClick={() => imageInputRef.current?.click()}>Unggah slide sebagai gambar</button>
          {slides.length > 0 && <p className="success-note">{slides.length} slide berhasil dimuat.</p>}
        </div>
        <div className="panel">
          <div className="panel-title"><div><span className="eyebrow">LIRIK PUJIAN</span><h3>Editor lagu</h3></div><span className="file-icon">♫</span></div>
          <label className="field-label">Judul lagu</label><input className="text-input" value={songTitle} onChange={e => setSongTitle(e.target.value)} placeholder="Judul lagu"/>
          <label className="field-label">Lirik (pisahkan slide dengan baris kosong)</label><textarea className="lyrics-input" value={songText} onChange={e => setSongText(e.target.value)} rows="5" placeholder="Tulis lirik di sini..."/>
          <button className="primary full" onClick={applySong}>Terapkan lirik</button>
          <div className="slide-list">
            {songSlides.map((line, i) => <button key={i} className={`list-item ${active.type === "song" && active.index === i ? "selected" : ""}`} onClick={() => selectSong(i)}><span className="list-num">{String(i+1).padStart(2,"0")}</span><span>{line}</span></button>)}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title"><div><span className="eyebrow">FIRMAN TUHAN</span><h3>Ayat Alkitab</h3></div><span className="file-icon">✧</span></div>
          <div className="verse-list">{bibleExamples.map(v => <button key={v.title} className={`verse-option ${active.type === "bible" && verseRef === v.title ? "selected" : ""}`} onClick={() => selectBible(v)}><b>{v.title}</b><span>{v.text}</span></button>)}</div>
          <label className="field-label">Referensi ayat khusus</label><input className="text-input" value={verseRef} onChange={e => setVerseRef(e.target.value)} placeholder="Contoh: Mazmur 23:1"/>
          <label className="field-label">Teks ayat</label><textarea className="lyrics-input" rows="3" value={verseText} onChange={e => setVerseText(e.target.value)} placeholder="Masukkan teks ayat..."/>
          <button className="secondary full" onClick={() => setActive({type:"bible",index:0})}>Tampilkan ayat</button>
        </div>
      </aside>
    </main>}
    {!projector && <footer>IBADAH PRESENTER <span>•</span> Konten contoh perlu diperiksa sebelum ibadah.</footer>}
  </div>;
}

createRoot(document.getElementById("root")).render(<App />);
