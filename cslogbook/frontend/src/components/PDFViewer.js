import React, { useEffect, useRef } from 'react';
import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';

// ตั้งค่า workerSrc ให้ชี้ไปยัง worker ที่ถูกต้อง
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PDFViewer = ({ pdfUrl }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const loadPDF = async () => {
      const loadingTask = getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      page.render(renderContext);
    };

    loadPDF();
  }, [pdfUrl]);

  return <canvas ref={canvasRef}></canvas>;
};

export default PDFViewer;