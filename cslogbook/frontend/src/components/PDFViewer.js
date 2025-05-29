import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { Spin, message, Empty, Button } from 'antd';

// กำหนด worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

const PDFViewer = ({ 
  pdfFile, 
  width = 595,
  height = 842,
  style,
  onError 
}) => {
  // ใช้ useRef สำหรับ canvas element โดยตรง
  const canvasRef = useRef(null);
  
  // ใช้ useRef สำหรับเก็บข้อมูลที่ไม่ต้อง re-render
  const renderTaskRef = useRef(null);
  const isMountedRef = useRef(true);
  const timeoutRef = useRef(null);
  
  // States สำหรับ UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(null);
  
  const LOAD_TIMEOUT = 30000; // 30 วินาที

  // ฟังก์ชันจัดการ error
  const handleError = useCallback((error) => {
    console.error('Error in PDFViewer:', error);
    setError('ไม่สามารถโหลดไฟล์ PDF ได้');
    setLoading(false);
    if (onError) {
      onError(error);
    }
  }, [onError]);

  // ฟังก์ชันสำหรับยกเลิก render task ที่กำลังทำงาน
  const cancelCurrentRender = useCallback(async () => {
    if (renderTaskRef.current) {
      try {
        await renderTaskRef.current.cancel();
      } catch (error) {
        // Ignore cancellation errors
      } finally {
        renderTaskRef.current = null;
      }
    }
  }, []);

  // ฟังก์ชันโหลด PDF
  const loadPDF = useCallback(async () => {
    // ตรวจสอบ pdfFile
    if (!pdfFile) {
      setLoading(false);
      return;
    }

    // ยกเลิก render task ที่กำลังทำงาน
    await cancelCurrentRender();

    if (!isMountedRef.current) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // ตั้งค่า timeout
    timeoutRef.current = setTimeout(() => {
      if (loading && isMountedRef.current) {
        handleError(new Error('การโหลดใช้เวลานานเกินไป'));
      }
    }, LOAD_TIMEOUT);

    let loadingTask;

    try {
      // เตรียมข้อมูล PDF
      if (pdfFile instanceof File || pdfFile instanceof Blob) {
        const arrayBuffer = await pdfFile.arrayBuffer();
        loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      } else if (typeof pdfFile === 'string' && pdfFile.trim()) {
        loadingTask = pdfjsLib.getDocument({ url: pdfFile });
      } else {
        throw new Error('รูปแบบไฟล์ PDF ไม่ถูกต้อง');
      }

      const pdf = await loadingTask.promise;
      
      if (!isMountedRef.current) return;
      
      setNumPages(pdf.numPages);
      const page = await pdf.getPage(pageNumber);

      // คำนวณ viewport และ scale
      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min(width / viewport.width, height / viewport.height);
      const scaledViewport = page.getViewport({ scale });

      // ใช้ ref เพื่อเข้าถึง canvas โดยตรง
      const canvas = canvasRef.current;
      if (!canvas || !isMountedRef.current) return;

      const context = canvas.getContext('2d');
      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      // เริ่ม render
      renderTaskRef.current = page.render({
        canvasContext: context,
        viewport: scaledViewport
      });

      await renderTaskRef.current.promise;
      
      if (!isMountedRef.current) return;
      
      // เคลียร์ timeout และอัพเดต state
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setLoading(false);
      
    } catch (error) {
      if (isMountedRef.current) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        handleError(error);
      }
    } finally {
      if (loadingTask && !isMountedRef.current) {
        loadingTask.destroy();
      }
    }
  }, [pdfFile, pageNumber, width, height, loading, handleError, cancelCurrentRender]);

  // Effect สำหรับโหลด PDF เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    loadPDF();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [loadPDF]);

  // Effect สำหรับ cleanup เมื่อ unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, []);

  // ฟังก์ชันสำหรับนำทางหน้า
  const goToPrevPage = useCallback(() => {
    setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages || 1));
  }, [numPages]);

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
          <div style={{ 
            color: 'red', 
            marginTop: '20px', 
            textAlign: 'center',
            padding: '20px',
            border: '1px solid #ff4d4f',
            borderRadius: '4px',
            backgroundColor: '#fff2f0'
          }}>
            {error}
          </div>
        )}
        
        {!pdfFile && !loading && (
          <Empty description="ไม่มีเอกสาร PDF" />
        )}
        
        <canvas 
          ref={canvasRef} 
          style={{ 
            display: loading || error ? 'none' : 'block',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
        
        {numPages > 1 && !loading && !error && (
          <div style={{ 
            marginTop: '20px', 
            textAlign: 'center',
            padding: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px'
          }}>
            <Button 
              onClick={goToPrevPage} 
              disabled={pageNumber <= 1}
              style={{ marginRight: '8px' }}
            >
              หน้าก่อนหน้า
            </Button>
            <span style={{ 
              margin: '0 10px',
              fontWeight: 'bold'
            }}>
              หน้า {pageNumber} จาก {numPages}
            </span>
            <Button 
              onClick={goToNextPage} 
              disabled={pageNumber >= numPages}
              style={{ marginLeft: '8px' }}
            >
              หน้าถัดไป
            </Button>
          </div>
        )}
      </Spin>
    </div>
  );
};

export default PDFViewer;