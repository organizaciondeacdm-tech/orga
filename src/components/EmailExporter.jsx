// src/components/EmailExporter.jsx
import { useState } from "react";

export default function EmailExporter({ escuelas }) {
  const [exportFormat, setExportFormat] = useState('csv'); // 'csv' | 'txt' | 'vcf'
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Extraer todos los emails únicos
  const extractAllEmails = () => {
    const emails = new Set();
    
    escuelas.forEach(escuela => {
      // Email de la escuela
      if (escuela.mail) emails.add(escuela.mail);
      
      // Email ACDM de la escuela
      if (escuela.acdmMail) emails.add(escuela.acdmMail);
      
      // Emails de docentes
      if (escuela.docentes) {
        escuela.docentes.forEach(docente => {
          if (docente.email) emails.add(docente.email);
        });
      }
    });
    
    return Array.from(emails).sort();
  };

  // Extraer emails con información de contexto
  const extractEmailsWithContext = () => {
    const emailsData = [];
    
    escuelas.forEach(escuela => {
      // Email de escuela
      if (escuela.mail) {
        emailsData.push({
          email: escuela.mail,
          tipo: 'escuela',
          nombre: escuela.escuela,
          distrito: escuela.de,
          contacto: 'General'
        });
      }
      
      // Email ACDM
      if (escuela.acdmMail) {
        emailsData.push({
          email: escuela.acdmMail,
          tipo: 'acdm',
          nombre: escuela.escuela,
          distrito: escuela.de,
          contacto: 'ACDM'
        });
      }
      
      // Emails de docentes
      if (escuela.docentes) {
        escuela.docentes.forEach(docente => {
          if (docente.email) {
            emailsData.push({
              email: docente.email,
              tipo: 'docente',
              nombre: docente.nombreApellido,
              escuela: escuela.escuela,
              distrito: escuela.de,
              estado: docente.estado || 'Activo'
            });
          }
        });
      }
    });
    
    return emailsData;
  };

  // Exportar a CSV
  const exportToCSV = () => {
    const emailsData = extractEmailsWithContext();
    
    // Crear headers según los datos disponibles
    const headers = ['Email', 'Tipo', 'Nombre', 'Escuela', 'Distrito', 'Contacto', 'Estado'];
    
    const rows = emailsData.map(item => [
      item.email,
      item.tipo,
      item.nombre || item.escuela || '',
      item.escuela || '',
      item.distrito || '',
      item.contacto || '',
      item.estado || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `emails_acdm_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  // Exportar a TXT (lista simple)
  const exportToTXT = () => {
    const emails = extractAllEmails();
    const content = emails.join('\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `emails_acdm_${new Date().toISOString().split('T')[0]}.txt`);
    link.click();
  };

  // Exportar a VCF (formato libreta de direcciones)
  const exportToVCF = () => {
    const emailsData = extractEmailsWithContext();
    let vcfContent = '';
    
    emailsData.forEach((item, index) => {
      vcfContent += 'BEGIN:VCARD\n';
      vcfContent += 'VERSION:3.0\n';
      vcfContent += `FN:${item.nombre || item.escuela}\n`;
      vcfContent += `EMAIL:${item.email}\n`;
      if (item.tipo) vcfContent += `NOTE:Tipo: ${item.tipo}\n`;
      if (item.escuela) vcfContent += `ORG:${item.escuela}\n`;
      vcfContent += 'END:VCARD\n\n';
    });
    
    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `contactos_acdm_${new Date().toISOString().split('T')[0]}.vcf`);
    link.click();
  };

  // Copiar al portapapeles
  const copyToClipboard = async () => {
    const emails = extractAllEmails();
    await navigator.clipboard.writeText(emails.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    switch(exportFormat) {
      case 'csv':
        exportToCSV();
        break;
      case 'txt':
        exportToTXT();
        break;
      case 'vcf':
        exportToVCF();
        break;
    }
    setShowModal(false);
  };

  const totalEmails = extractAllEmails().length;
  const emailsData = extractEmailsWithContext();
  const stats = {
    escuela: emailsData.filter(e => e.tipo === 'escuela').length,
    acdm: emailsData.filter(e => e.tipo === 'acdm').length,
    docente: emailsData.filter(e => e.tipo === 'docente').length
  };

  return (
    <>
      {/* Botón flotante o en el header */}
      <button 
        className="btn-email-exporter"
        onClick={() => setShowModal(true)}
        title="Exportar emails"
      >
        📧 {totalEmails}
      </button>

      {/* Modal de exportación */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <h3 className="title-rajdhani mb-16">📧 Exportar Emails</h3>
            
            {/* Estadísticas */}
            <div className="email-stats mb-20">
              <div className="stat-item">
                <span className="stat-label">Totales:</span>
                <span className="stat-value">{totalEmails}</span>
              </div>
              <div className="stat-breakdown flex gap-12 mt-8">
                <span>🏫 Escuelas: {stats.escuela}</span>
                <span>📨 ACDM: {stats.acdm}</span>
                <span>👥 Docentes: {stats.docente}</span>
              </div>
            </div>

            {/* Selector de formato */}
            <div className="form-group mb-16">
              <label className="form-label">Formato de exportación:</label>
              <select 
                className="form-select"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <option value="csv">CSV (Excel) - Con detalles</option>
                <option value="txt">TXT - Lista simple</option>
                <option value="vcf">VCF - Libreta de contactos</option>
              </select>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-8">
              <button className="btn btn-primary flex-1" onClick={handleExport}>
                ⬇️ Exportar
              </button>
              <button className="btn btn-secondary flex-1" onClick={copyToClipboard}>
                {copied ? '✅ Copiado!' : '📋 Copiar'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                ✖️
              </button>
            </div>

            {/* Vista previa */}
            <div className="email-preview mt-16 p-12 border-top">
              <small className="text-muted">Vista previa (primeros 5):</small>
              <div className="preview-list mt-8">
                {extractAllEmails().slice(0, 5).map((email, idx) => (
                  <div key={idx} className="preview-item">• {email}</div>
                ))}
                {totalEmails > 5 && <div className="preview-more">...y {totalEmails - 5} más</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}