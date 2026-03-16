import React, { useEffect, useRef } from 'react';

import logoImage from './assets/logo1.png';
import logoSymbol from './assets/logo.png';
import stampImage from './assets/stamp.png';

const drawCurves = (ctx, width, height, isTop) => {
  const topBandBlue = '#2f6bff';
  const midBandBlue = '#4f82ff';
  const lightBandBlue = '#e9f0ff';

  ctx.save();
  if (isTop) {
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = lightBandBlue;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.bezierCurveTo(width * 0.7, 180, width * 0.3, 240, 0, 310);
    ctx.fill();

    ctx.fillStyle = midBandBlue;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.bezierCurveTo(width * 0.7, 130, width * 0.3, 190, 0, 260);
    ctx.fill();

    ctx.fillStyle = topBandBlue;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.bezierCurveTo(width * 0.8, 80, width * 0.2, 120, 0, 190);
    ctx.fill();
  } else {
    ctx.fillStyle = lightBandBlue;
    ctx.beginPath();
    ctx.moveTo(width, height);
    ctx.lineTo(0, height);
    ctx.bezierCurveTo(width * 0.3, height - 180, width * 0.7, height - 240, width, height - 310);
    ctx.fill();

    ctx.fillStyle = midBandBlue;
    ctx.beginPath();
    ctx.moveTo(width, height);
    ctx.lineTo(0, height);
    ctx.bezierCurveTo(width * 0.3, height - 130, width * 0.7, height - 190, width, height - 260);
    ctx.fill();

    ctx.fillStyle = topBandBlue;
    ctx.beginPath();
    ctx.moveTo(width, height);
    ctx.lineTo(0, height);
    ctx.bezierCurveTo(width * 0.2, height - 80, width * 0.8, height - 120, width, height - 190);
    ctx.fill();
  }
  ctx.restore();
};

const drawWatermark = (ctx, logo, width, height) => {
  if (!logo) return;
  ctx.save();
  ctx.globalAlpha = 0.12;
  const wmWidth = width * 0.8;
  const wmHeight = (logo.height / logo.width) * wmWidth;
  ctx.drawImage(logo, (width - wmWidth) / 2, (height - wmHeight) / 2, wmWidth, wmHeight);
  ctx.restore();
};

const drawBadge = (ctx, symbol) => {
  if (!symbol) return;
  ctx.save();
  const badgeRadius = 90;
  const badgeX = 150;
  const badgeY = 160;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 10;

  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeRadius, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.lineWidth = 4;
  ctx.strokeStyle = '#7aa7ff';
  ctx.stroke();

  const logoWidth = 170;
  const logoHeight = (symbol.height / symbol.width) * logoWidth;
  ctx.drawImage(symbol, badgeX - logoWidth / 2, badgeY - 105, logoWidth, logoHeight);

  ctx.fillStyle = '#2f6bff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('APPIFLY', badgeX, badgeY + 30);
  ctx.fillText('INFOTECH', badgeX, badgeY + 55);
  ctx.restore();
};

const drawContactInfo = (ctx, width) => {
  ctx.fillStyle = '#333333';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const contactX = width - 60;
  let contactY = 120;
  const contactSpacing = 40;

  ctx.fillText('📞 +91 99094 03993', contactX, contactY);
  contactY += contactSpacing;
  ctx.fillText('📧 info@appiflyinfotech.com', contactX, contactY);
  contactY += contactSpacing;
  ctx.fillText('🌐 www.appiflyinfotech.com', contactX, contactY);
};

const CertificateCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const width = 900;
    const height = 1300;
    
    const loadImg = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
    };

    Promise.all([
      loadImg(logoImage),
      loadImg(stampImage),
      loadImg(logoSymbol)
    ]).then(([logo, stamp, symbol]) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      drawCurves(ctx, width, height, true);
      drawCurves(ctx, width, height, false);
      drawWatermark(ctx, logo, width, height);
      drawBadge(ctx, symbol);
      drawContactInfo(ctx, width);

      let contentY = 370;

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 45px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Certificate of Internship', width / 2, contentY);

      contentY += 50;
      ctx.fillStyle = '#555555';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Date: March 13, 2026', width - 60, contentY);

      contentY += 20;
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Intern ID: APPI144', 60, contentY);
      contentY += 55;
      ctx.fillText('To: Mr. Manav Patel', 60, contentY);

      const closingY = height - 390;
      const maxAllowedY = closingY - 40;

      contentY += 60;
      const certText = "This is to certify that Mr. Manav Patel has successfully completed a 1 month internship at APPIFLY INFOTECH as a Full Stack Development Intern. The internship took place from May 12, 2025 to June 14, 2025. Throughout the internship, he demonstrated dedication, enthusiasm, and a strong work ethic in their chosen field. Their contributions and skills have been invaluable to our team.\n\nWe are glad that you have worked with us.";
      
      ctx.fillStyle = '#444444';
      ctx.font = '22px Arial, sans-serif';
      
      const maxTextWidth = width - 120;
      const lineHeight = 36;
      let y = contentY;

      const paragraphs = certText.split('\n');
      let stopRendering = false;

      paragraphs.forEach((paragraph) => {
        if (stopRendering) return;

        if (paragraph === '') {
          if (y + lineHeight <= maxAllowedY) {
            y += lineHeight;
          } else {
            stopRendering = true;
          }
          return;
        }

        const words = paragraph.split(' ');
        let line = '';

        for (let n = 0; n < words.length; n++) {
          if (stopRendering) break;

          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > maxTextWidth && n > 0) {
            if (y + lineHeight > maxAllowedY) {
              stopRendering = true;
              break;
            }

            const wordsInLine = line.trim().split(' ');
            if (wordsInLine.length > 1) {
              const totalWordsWidth = wordsInLine.reduce((acc, word) => acc + ctx.measureText(word).width, 0);
              const extraSpace = (maxTextWidth - totalWordsWidth) / (wordsInLine.length - 1);
              let currentX = 60;
              for (let i = 0; i < wordsInLine.length; i++) {
                ctx.fillText(wordsInLine[i], currentX, y);
                currentX += ctx.measureText(wordsInLine[i]).width + extraSpace;
              }
            } else {
              ctx.fillText(line.trim(), 60, y);
            }
            line = words[n] + ' ';
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        if (!stopRendering && line.trim() !== '') {
          if (y + lineHeight <= maxAllowedY) {
            ctx.fillText(line.trim(), 60, y);
            y += lineHeight; 
          } else {
            stopRendering = true;
          }
        }
      });

      ctx.fillStyle = '#333333';
      ctx.font = '22px sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText('Yours Sincerely,', 60, closingY);

      let signatureY = closingY + 100;
      const stampY = closingY + 30;
      
      if (stamp) {
        ctx.save();
        const stampWidth = 150;
        const stampHeight = (stamp.height / stamp.width) * stampWidth;
        ctx.drawImage(stamp, 60, stampY, stampWidth, stampHeight);
        ctx.restore();
        signatureY = stampY + stampHeight + 20; 
      } else {
        ctx.beginPath();
        ctx.arc(130, stampY + 70, 70, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('COMPANY', 130, stampY + 60);
        ctx.fillText('STAMP', 130, stampY + 80);
        signatureY = stampY + 170;
      }

      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#000000';
      ctx.font = '20px sans-serif';
      ctx.fillText('Raj Ghevariya', 60, signatureY);

      ctx.font = '18px sans-serif';
      ctx.fillText('Co-founder & CTO', 60, signatureY + 25);
      ctx.fillText('APPIFLY INFOTECH', 60, signatureY + 50);
    });
  }, []);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      const link = document.createElement('a');
      link.download = `Internship_Certificate.png`;
      link.href = image;
      link.click();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', background: '#f8fafc', minHeight: '100vh', margin: 0, fontFamily: 'sans-serif' }}>
      <canvas 
        ref={canvasRef} 
        width={900} 
        height={1300} 
        style={{ width: '100%', height: 'auto', display: 'block', maxWidth: '800px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', backgroundColor: '#ffffff' }}
      />
      <button 
        onClick={handleDownload} 
        style={{ marginTop: '20px', backgroundColor: '#2f6bff', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
      >
        Download Design
      </button>
    </div>
  );
};

export default CertificateCanvas;
