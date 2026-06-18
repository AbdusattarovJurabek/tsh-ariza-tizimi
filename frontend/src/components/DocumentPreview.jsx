/**
 * DocumentPreview — TSH hujjatini A4 ko'rinishida ko'rsatadi.
 * editable=true bo'lsa, barcha maydonlarni to'g'ridan-to'g'ri bosib tahrirlash mumkin.
 */
export default function DocumentPreview({ wordData = {}, appNumber = '', signedAt = null, editable = false, onFieldChange }) {
  const d = wordData;
  const trackUrl = `${window.location.origin}/document/${appNumber}`;

  /* Inline tahrirlanadigan span */
  const Field = ({ fieldKey, placeholder = '___________', multiline = false, style = {} }) => {
    const value = d[fieldKey];
    const display = (value === null || value === undefined || value === '') ? '' : String(value);

    if (!editable) {
      return display
        ? <span style={style}>{display}</span>
        : <span style={{ color: '#bbb', ...style }}>{placeholder}</span>;
    }
    return (
      <span
        contentEditable
        suppressContentEditableWarning
        onBlur={e => onFieldChange && onFieldChange(fieldKey, e.currentTarget.textContent.trim())}
        style={{
          display: multiline ? 'block' : 'inline-block',
          minWidth: 60,
          minHeight: multiline ? 60 : undefined,
          borderBottom: '1.5px dashed #3b82f6',
          outline: 'none',
          padding: '0 2px',
          cursor: 'text',
          color: display ? '#000' : '#999',
          ...style,
        }}
        title="Bosing va tahrirlang"
      >
        {display || (editable ? placeholder : '')}
      </span>
    );
  };

  return (
    <div style={{ background: '#e5e7eb', padding: 24, minHeight: '100%' }}>
      {editable && (
        <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 8, padding: '8px 16px', marginBottom: 16, maxWidth: 793, margin: '0 auto 16px', fontSize: 13, color: '#1d4ed8' }}>
          ✏️ Tahrirlash rejimi — istalgan maydonni bosing va o'zgartiring, so'ng <strong>Saqlash</strong> tugmasini bosing.
        </div>
      )}

      {/* A4 sahifa */}
      <div style={{
        background: '#fff',
        width: 793,
        minHeight: 1122,
        margin: '0 auto',
        padding: '56px 70px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        fontFamily: 'Times New Roman, serif',
        fontSize: 13,
        lineHeight: 1.6,
        color: '#000',
      }}>
        {/* Sarlavha */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            O'ZBEKISTON RESPUBLIKASI
          </div>
          <div style={{ fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            AGROSANOAT RIVOJLANTIRISH AGENTLIGI
          </div>
          {appNumber && (
            <div style={{ fontSize: 11, marginTop: 8 }}>
              № <strong>{appNumber}</strong>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase', marginBottom: 6, textDecoration: 'underline' }}>
          TEXNIK SHART
        </div>
        <div style={{ textAlign: 'center', fontSize: 13, marginBottom: 24 }}>
          Bog' tashkil etish bo'yicha
        </div>

        {/* Tashkilot */}
        <SectionTitle>TASHKILOT MA'LUMOTLARI</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 12 }}>
          <tbody>
            <TR label="Subyekt nomi"    value={<Field fieldKey="subject_name" />} />
            <TR label="INN / STIR"      value={<Field fieldKey="stir" />} />
            <TR label="Rahbar F.I.Sh."  value={<Field fieldKey="leader_full_name" />} />
            <TR label="Yuridik manzil"  value={<Field fieldKey="legal_address" />} />
            <TR label="MFO"             value={<Field fieldKey="mfo" />} />
            <TR label="Hisob raqami"    value={<Field fieldKey="bank_account" />} />
            <TR label="Bank nomi"       value={<Field fieldKey="bank_name" />} />
          </tbody>
        </table>

        {/* Yer maydoni */}
        <SectionTitle>YER MAYDONI HAQIDA MA'LUMOT</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 12 }}>
          <tbody>
            <TR label="Jami yer maydoni (ga)"  value={<Field fieldKey="total_land_area" />} />
            <TR label="Bog' maydoni (ga)"       value={<Field fieldKey="garden_area" />} />
            <TR label="Ixtisoslashtirish"        value={<Field fieldKey="land_specialization" />} />
            <TR label="Bog' manzili"             value={<Field fieldKey="garden_address" />} />
            <TR label="Yer qaror sanasi"         value={<Field fieldKey="land_decision_date" placeholder="kk.oo.yyyy" />} />
            <TR label="Yer qaror raqami"         value={<Field fieldKey="land_decision_number" />} />
            <TR label="Ijara shartnoma sanasi"   value={<Field fieldKey="lease_contract_date" placeholder="kk.oo.yyyy" />} />
            <TR label="Ijara shartnoma raqami"   value={<Field fieldKey="lease_contract_number" />} />
            <TR label="Kadastr raqami"           value={<Field fieldKey="registry_number" />} />
          </tbody>
        </table>

        {/* Tuproq */}
        <SectionTitle>TUPROQ TAHLILI</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 12 }}>
          <tbody>
            <TR label="Tuproq turi"       value={<Field fieldKey="soil_type" />} />
            <TR label="Tuproq sifati"     value={<Field fieldKey="soil_quality" />} />
            <TR label="Suv ta'minoti"     value={<Field fieldKey="water_supply_info" />} />
            <TR label="Ob-havo tahlili"   value={<Field fieldKey="weather_analysis" />} />
          </tbody>
        </table>

        {/* Agrotexnik */}
        <SectionTitle>AGROTEXNIK TADBIRLAR</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 12 }}>
          <tbody>
            <TR label="Meva turi"        value={<Field fieldKey="fruit_type" />} />
            <TR label="Nav"              value={<Field fieldKey="fruit_variety" />} />
            <TR label="Ekish sxemasi"    value={<Field fieldKey="planting_scheme" />} />
            <TR label="Ko'chat soni"     value={<Field fieldKey="seedling_count" />} />
            <TR label="Ekish muddati"    value={<Field fieldKey="planting_period" />} />
            <TR label="Suv manbai"       value={<Field fieldKey="water_source" />} />
          </tbody>
        </table>

        {/* Moliyaviy */}
        <SectionTitle>MOLIYAVIY KO'RSATKICHLAR</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 12 }}>
          <tbody>
            <TR label="Loyiha summasi (so'm)"  value={<Field fieldKey="project_amount" />} />
            <TR label="Doimiy ish o'rni"        value={<Field fieldKey="permanent_jobs" />} />
            <TR label="Mavsumiy ish o'rni"      value={<Field fieldKey="seasonal_jobs" />} />
            <TR label="Yetkazib beruvchilar"     value={<Field fieldKey="supplier_companies" />} />
          </tbody>
        </table>

        {/* Ilmiy tavsiya */}
        <SectionTitle>ILMIY TAVSIYALAR</SectionTitle>
        <div style={{ border: '1px solid #000', padding: 8, marginBottom: 16, minHeight: 60, fontSize: 12 }}>
          <Field fieldKey="scientific_recommendation" placeholder="Ilmiy tavsiyalarni kiriting..." multiline />
        </div>

        {/* Imzo bloki */}
        {signedAt ? (
          <>
            <SectionTitle>TASDIQ</SectionTitle>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(trackUrl)}&size=90x90`}
                  alt="QR"
                  style={{ width: 90, height: 90, display: 'block' }}
                />
                <div style={{ fontSize: 9, marginTop: 4, maxWidth: 160, wordBreak: 'break-all', color: '#444' }}>{trackUrl}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12 }}>Agentlik direktori</div>
                <div style={{ marginTop: 40, borderTop: '1px solid #000', paddingTop: 4, fontSize: 11 }}>Imzo / M.O.</div>
                <div style={{ fontSize: 11, marginTop: 8 }}>{new Date(signedAt).toLocaleDateString('uz-UZ')}</div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12 }}>Agentlik direktori</div>
              <div style={{ marginTop: 40, borderTop: '1px solid #000', paddingTop: 4, fontSize: 11, width: 200 }}>Imzo / M.O.</div>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: 10, color: '#888', marginTop: 24, borderTop: '1px solid #eee', paddingTop: 8 }}>
          Hujjat raqami: {appNumber} · {new Date().toLocaleDateString('uz-UZ')}
        </div>
      </div>
    </div>
  );
}

function TR({ label, value }) {
  return (
    <tr>
      <td style={{ border: '1px solid #000', padding: '5px 8px', width: '40%', fontWeight: 'bold', background: '#f9fafb', verticalAlign: 'top', fontSize: 12 }}>
        {label}
      </td>
      <td style={{ border: '1px solid #000', padding: '5px 8px', verticalAlign: 'top', fontSize: 12 }}>
        {value}
      </td>
    </tr>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontWeight: 'bold', fontSize: 11, textTransform: 'uppercase', background: '#dcfce7', padding: '5px 10px', marginBottom: 4, borderLeft: '4px solid #16a34a', letterSpacing: 0.5 }}>
      {children}
    </div>
  );
}
