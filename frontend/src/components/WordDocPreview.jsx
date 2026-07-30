/**
 * WordDocPreview
 * - TSH_template.docx ni mammoth orqali HTML ga aylantirib ko'rsatadi
 * - A4 sahifalarga (1-list, 2-list) ajratib chiroyli ko'rsatadi
 * - Yon va ustki/ostki masofalar bir xil 20mm (equal margins)
 * - 1-list muqovasida "Toshkent - 2026" eng pastki qismida joylashadi
 */
import { useEffect, useState, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';

const WordDocPreview = forwardRef(function WordDocPreview({ fetchFn, trigger = 0, editable = true }, ref) {
  const [pages, setPages]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [imgOverlay, setImgOverlay] = useState(null); // { top, left, img }
  const pageRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getHtml: () => {
      const elems = pageRef.current?.querySelectorAll('.word-content');
      if (!elems || elems.length === 0) return '';
      return Array.from(elems).map(el => el.innerHTML).join('<hr class="page-break" />');
    },
  }));

  // Rasmni o'chirish
  const deleteImage = useCallback(() => {
    if (!imgOverlay?.img) return;
    const img = imgOverlay.img;
    const parent = img.parentElement;
    if (parent && parent.childNodes.length === 1) {
      parent.remove();
    } else {
      img.remove();
    }
    setImgOverlay(null);
  }, [imgOverlay]);

  // Rasm ustiga bosilganda overlay ko'rsat
  useEffect(() => {
    if (pages.length === 0 || !editable) return;
    const container = pageRef.current;
    if (!container) return;

    const handleClick = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
        const rect = e.target.getBoundingClientRect();
        const pageRect = pageRef.current?.getBoundingClientRect() || { top: 0, left: 0 };
        setImgOverlay({
          top:  rect.top  - pageRect.top  + pageRef.current.scrollTop,
          left: rect.left - pageRect.left,
          width: rect.width,
          img: e.target,
        });
      } else {
        setImgOverlay(null);
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [pages, editable]);

  const loadPreview = async () => {
    setLoading(true);
    setError('');
    setImgOverlay(null);
    try {
      const response = await fetchFn();

      let arrayBuffer;
      if (response.data instanceof ArrayBuffer) {
        arrayBuffer = response.data;
      } else if (response.data?.buffer instanceof ArrayBuffer) {
        const d = response.data;
        arrayBuffer = d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength);
      } else {
        arrayBuffer = response.data;
      }

      let convertFn;
      if (window.mammoth?.convertToHtml) {
        convertFn = window.mammoth.convertToHtml.bind(window.mammoth);
      } else {
        const m = await import('mammoth');
        convertFn = (m.default?.convertToHtml || m.convertToHtml).bind(m.default || m);
      }

      const result = await convertFn({
        arrayBuffer,
        styleMap: [
          "br[type='page'] => hr.page-break",
        ]
      });

      const rawHtml = result.value || '<p>(Hujjat bo\'sh)</p>';

      // A4 sahifalarga bo'lish logic-i
      let pageList = [];
      if (rawHtml.includes('class="page-break"') || rawHtml.includes('<hr')) {
        pageList = rawHtml.split(/<hr[^>]*class="page-break"[^>]*>|<hr[^>]*>/i);
      } else if (rawHtml.includes('Toshkent - 2026')) {
        const idx = rawHtml.indexOf('Toshkent - 2026');
        const pEnd = rawHtml.indexOf('</p>', idx);
        if (idx !== -1 && pEnd !== -1) {
          const page1 = rawHtml.slice(0, pEnd + 4);
          const page2 = rawHtml.slice(pEnd + 4);
          pageList = [page1, page2];
        } else {
          pageList = [rawHtml];
        }
      } else {
        pageList = [rawHtml];
      }

      const filteredPages = pageList.filter(p => p && p.trim().length > 0);
      setPages(filteredPages.length > 0 ? filteredPages : [rawHtml]);
    } catch (e) {
      console.error('Word preview xatosi:', e);
      setError(`Xato: ${e.message || 'Noma\'lum'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPreview(); }, []);
  useEffect(() => { if (trigger > 0) loadPreview(); }, [trigger]);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar */}
      <div className="shrink-0 bg-gray-200 px-3 py-1.5 flex items-center justify-between border-b">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          📄 Word hujjat ko'rinishi ({pages.length} ta list)
          {editable && !loading && pages.length > 0 && (
            <span className="ml-2 text-blue-600 font-medium">✏️ Matnni bosib tahrirlang · Rasmni bosib o'chiring</span>
          )}
        </span>
        <button
          onClick={loadPreview}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '⏳...' : '🔄 Yangilash'}
        </button>
      </div>

      {/* Kontent */}
      <div ref={pageRef} className="flex-1 overflow-y-auto relative">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            <p className="text-sm">Word hujjat yuklanmoqda...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-red-500 text-sm">{error}</p>
            <button onClick={loadPreview} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
              Qayta urinish
            </button>
          </div>
        )}

        {pages.length > 0 && !loading && (
          <div className="p-6 flex flex-col items-center gap-8">
            <style>{`
              .word-content {
                height: 100%;
                display: flex;
                flex-direction: column;
              }
              .word-content p {
                margin: 4px 0;
                font-family: 'Times New Roman', serif;
                font-size: 12pt;
                line-height: 1.6;
                text-align: justify;
              }
              .word-content h1, .word-content h2, .word-content h3,
              .word-content h4, .word-content h5 {
                font-family: 'Times New Roman', serif;
                text-align: center;
                margin: 8px 0 4px;
              }
              .word-content table {
                width: 100%;
                border-collapse: collapse;
                margin: 6px 0;
              }
              .word-content td, .word-content th {
                border: 1px solid #ccc;
                padding: 5px 8px;
                font-family: 'Times New Roman', serif;
                font-size: 11pt;
              }
              .word-content img {
                display: block;
                margin: 12px auto !important;
                max-width: 180px !important;
                max-height: 180px !important;
                height: auto !important;
                cursor: pointer;
              }
              .word-content img:hover {
                outline: 2px dashed #ef4444;
                outline-offset: 2px;
              }
              .word-content img.img-selected {
                outline: 2px solid #ef4444;
                outline-offset: 2px;
              }
              /* 1-list muqovasidagi eng oxirgi p ("Toshkent - 2026") ni eng pastga surish */
              .word-content-page1 p:last-child {
                margin-top: auto !important;
                text-align: center !important;
                font-weight: bold;
                padding-top: 16px;
              }
              [contenteditable]:focus { outline: none; }
              [contenteditable] p:hover { background: rgba(59,130,246,0.03); }
            `}</style>

            {/* Rasm ustidagi overlay tugma */}
            {editable && imgOverlay && (
              <div
                style={{
                  position: 'absolute',
                  top:  imgOverlay.top - 34,
                  left: imgOverlay.left + imgOverlay.width / 2 - 50,
                  zIndex: 50,
                }}
              >
                <button
                  onMouseDown={(e) => { e.preventDefault(); deleteImage(); }}
                  className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-xs rounded shadow-lg hover:bg-red-700"
                >
                  🗑️ Rasmni o'chirish
                </button>
              </div>
            )}

            {/* Har bir A4 sahifa alohida oq varaq (list) sathi sifatida */}
            {pages.map((pageHtml, index) => {
              const isPage1 = index === 0;
              return (
                <div
                  key={index}
                  className="bg-white shadow-2xl relative border border-gray-200 rounded-sm flex flex-col justify-between transition-all"
                  style={{
                    width: '210mm',
                    minHeight: '297mm',
                    height: isPage1 ? '297mm' : 'auto',
                    padding: '20mm 20mm', // yon va ustki/ostki masofalar bir xil 20mm
                    boxSizing: 'border-box',
                  }}
                >
                  {/* List belgisi badge-i */}
                  <div className="absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-400 rounded border border-gray-100 select-none">
                    {index + 1}-list
                  </div>

                  <div
                    className={`word-content ${isPage1 ? 'word-content-page1' : ''}`}
                    contentEditable={editable}
                    suppressContentEditableWarning
                    dangerouslySetInnerHTML={{ __html: pageHtml }}
                    style={{ outline: 'none' }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export default WordDocPreview;
