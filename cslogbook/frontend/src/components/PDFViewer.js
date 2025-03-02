import React, { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';
import { Spin, message, Empty, Button } from 'antd';
import 'pdfjs-dist/web/pdf_viewer.css';

// ตั้งค่า workerSrc ให้ชี้ไปยัง worker ที่ถูกต้อง
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

const PDFViewer = ({ pdfFile }) => {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(null);

  useEffect(() => {
    const loadPDF = async () => {
      if (renderTaskRef.current) {
        await renderTaskRef.current.cancel();
      }

      if (!pdfFile) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const fileReader = new FileReader();
        fileReader.onload = async () => {
          try {
            const loadingTask = getDocument({ data: fileReader.result });
            const pdf = await loadingTask.promise;
            setNumPages(pdf.numPages);
            const page = await pdf.getPage(pageNumber);

            // ปรับขนาด viewport ให้ตรงกับขนาด A4
            const viewport = page.getViewport({ scale: 1 });
            const scale = Math.min(595 / viewport.width, 842 / viewport.height);
            const scaledViewport = page.getViewport({ scale });

            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;

            const renderContext = {
              canvasContext: context,
              viewport: scaledViewport,
            };

            renderTaskRef.current = page.render(renderContext);
            await renderTaskRef.current.promise;
            renderTaskRef.current = null; // Reset renderTaskRef after rendering is complete
            setLoading(false);
          } catch (error) {
            console.error('Error rendering PDF:', error);
            setError('Invalid PDF structure.');
            setLoading(false);
          }
        };
        fileReader.readAsArrayBuffer(pdfFile);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setError('Failed to load PDF.');
        setLoading(false);
      }
    };

    loadPDF();

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfFile, pageNumber]);

  const goToPrevPage = () => {
    setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages));
  };

  return (
    <div style={{ position: 'relative', textAlign: 'center' }}>
      {loading && (
        <Spin
          size="large"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
          }}
        />
      )}
      {error && (
        <div style={{ color: 'red', marginTop: '20px' }}>
          {error}
        </div>
      )}
      {!pdfFile && !loading && (
        <Empty description="ไม่มีเอกสาร PDF" />
      )}
      <canvas ref={canvasRef} style={{ display: loading ? 'none' : 'block' }}></canvas>
      {numPages && (
        <div style={{ marginTop: '20px' }}>
          <Button onClick={goToPrevPage} disabled={pageNumber <= 1}>
            หน้าก่อนหน้า
          </Button>
          <span style={{ margin: '0 10px' }}>
            หน้า {pageNumber} จาก {numPages}
          </span>
          <Button onClick={goToNextPage} disabled={pageNumber >= numPages}>
            หน้าถัดไป
          </Button>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;