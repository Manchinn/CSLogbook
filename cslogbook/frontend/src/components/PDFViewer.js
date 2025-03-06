import React, { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';
import { Spin, message, Empty, Button } from 'antd';
import 'pdfjs-dist/web/pdf_viewer.css';

// ตั้งค่า workerSrc ให้ชี้ไปยัง worker ที่ถูกต้อง
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

const PDFViewer = ({ 
  pdfFile, 
  width = 595,  // ความกว้างเริ่มต้น A4
  height = 842, // ความสูงเริ่มต้น A4
  style,
  onError 
}) => {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const isMountedRef = useRef(true);  // เพิ่ม ref สำหรับตรวจสอบ mounted state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const LOAD_TIMEOUT = 30000; // 30 วินาที

  const handleError = (error) => {
    console.error('Error in PDFViewer:', error);
    setError('ไม่สามารถโหลดไฟล์ PDF ได้');
    setLoading(false);
    if (onError) {
      onError(error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const loadPDF = async () => {
      // เพิ่มการตรวจสอบ pdfFile
      if (!pdfFile) {
        setLoading(false);
        return;
      }

      // ยกเลิก render task ที่กำลังทำงานอยู่
      if (renderTaskRef.current) {
        await renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      if (!pdfFile || !isMounted) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      timeoutId = setTimeout(() => {
        if (loading && isMounted) {
          handleError(new Error('การโหลดใช้เวลานานเกินไป'));
        }
      }, LOAD_TIMEOUT);

      let pdfData;
      let loadingTask;

      try {
        // แก้ไขการส่ง parameter ให้ getDocument
        if (pdfFile instanceof File || pdfFile instanceof Blob) {
          const arrayBuffer = await pdfFile.arrayBuffer();
          loadingTask = getDocument({ data: arrayBuffer });
        } else if (typeof pdfFile === 'string' && pdfFile.trim()) {
          loadingTask = getDocument({ url: pdfFile });
        } else {
          throw new Error('รูปแบบไฟล์ PDF ไม่ถูกต้อง');
        }

        const pdf = await loadingTask.promise;
        
        if (!isMounted) return;
        
        setNumPages(pdf.numPages);
        const page = await pdf.getPage(pageNumber);

        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(width / viewport.width, height / viewport.height);
        const scaledViewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas || !isMounted) return;

        const context = canvas.getContext('2d');
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        renderTaskRef.current = page.render({
          canvasContext: context,
          viewport: scaledViewport
        });

        await renderTaskRef.current.promise;
        
        if (!isMounted) return;
        
        clearTimeout(timeoutId);
        setLoading(false);
      } catch (error) {
        if (isMounted) {
          clearTimeout(timeoutId);
          handleError(error);
        }
      } finally {
        if (pdfData && (pdfFile instanceof File || pdfFile instanceof Blob)) {
          URL.revokeObjectURL(pdfData);
        }
        if (loadingTask && !isMounted) {
          loadingTask.destroy();
        }
      }
    };

    loadPDF();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfFile, pageNumber, width, height]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const goToPrevPage = () => {
    setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages));
  };

  const containerStyle = {
    width: `${width}px`,
    height: `${height}px`,
    margin: '0 auto',
    position: 'relative',
    ...style
  };

  return (
    <div style={containerStyle}>
      <Spin spinning={loading} wrapperClassName="pdf-viewer-spin">
        {error && (
          <div style={{ color: 'red', marginTop: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}
        {!pdfFile && !loading && (
          <Empty description="ไม่มีเอกสาร PDF" />
        )}
        <canvas ref={canvasRef} style={{ display: loading ? 'none' : 'block' }}></canvas>
        {numPages > 1 && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
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
      </Spin>
    </div>
  );
};

export default PDFViewer;