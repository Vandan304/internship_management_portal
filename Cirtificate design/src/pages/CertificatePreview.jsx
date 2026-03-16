import React from 'react';
import CertificateCanvas from '../components/CertificateCanvas';
import { certificateData } from '../data/certificateSample';
import '../styles/certificate.css';

const CertificatePreview = () => {
  const handleDownload = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      const link = document.createElement('a');
      link.download = `${certificateData.name.replace(' ', '_')}_Certificate.png`;
      link.href = image;
      link.click();
    }
  };

  return (
    <div className="preview-container">
      <h1 className="title">Certificate Preview</h1>
      <CertificateCanvas data={certificateData} />
      <button onClick={handleDownload} className="download-btn">
        Download Certificate (PNG)
      </button>
    </div>
  );
};

export default CertificatePreview;
