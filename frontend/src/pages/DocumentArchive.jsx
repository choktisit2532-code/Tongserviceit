import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatThaiDate } from '../utils/date';
import DocumentPreview from '../components/DocumentPreview.jsx';

export default function DocumentArchive({ settings, showToast }) {
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState(null);

  async function load() {
    try {
      setDocuments(await api.listDocuments());
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  useEffect(() => { load(); }, []);

  async function openDoc(id) {
    try {
      setSelected(await api.getDocument(id));
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>คลังเอกสาร</h1>
          <p>ค้นหาและพิมพ์เอกสารย้อนหลัง</p>
        </div>
      </div>

      <div className="split wide">
        <div className="card">
          <h2>รายการเอกสาร</h2>
          <table>
            <thead>
              <tr><th>เลขที่</th><th>ประเภท</th><th>วันที่</th><th>ลูกค้า</th><th>สถานะ</th><th></th></tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id}>
                  <td>{d.doc_no}</td>
                  <td>{d.doc_type}</td>
                  <td>{formatThaiDate(d.doc_date)}</td>
                  <td>{d.customers?.name || '-'}</td>
                  <td><span className="badge">{d.status}</span></td>
                  <td><button onClick={() => openDoc(d.id)}>เปิด</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DocumentPreview document={selected} settings={settings} />
      </div>
    </section>
  );
}
