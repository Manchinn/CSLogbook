import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { Spin, Empty, Button } from 'antd';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

const PDFViewer = ({ 
  pdfFile, 
  size = 595,  
  height = 842, 
  style,
  onError 
}) => {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const isMountedRef = useRef(true);
  const loadingTaskRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const LOAD_TIMEOUT = 30000;

  const handleError = useCallback((err) => {
    console.error('Error in PDFViewer:', err);
    setError('ไม่สามารถโหลดไฟล์ PDF ได้');
    setLoading(false);
    if (onError) {
      onError(err);
    }
  }, [onError]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const loadPDF = async () => {
      if (!pdfFile) {
        setLoading(false);
        return;
      }

      if (renderTaskRef.current) {
        try {
            await renderTaskRef.current.cancel();
        } catch (cancelError) {
            // console.warn("Failed to cancel previous render task:", cancelError);
        }
        renderTaskRef.current = null;
      }
      
      if (loadingTaskRef.current) {
        try {
          await loadingTaskRef.current.destroy();
        } catch (destroyError) {
          // console.warn("Failed to destroy previous loading task:", destroyError);
        }
        loadingTaskRef.current = null;
      }

      if (!isMounted) {
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

      try {
        if (pdfFile instanceof File || pdfFile instanceof Blob) {
          const arrayBuffer = await pdfFile.arrayBuffer();
          loadingTaskRef.current = pdfjsLib.getDocument({ data: arrayBuffer });
        } else if (typeof pdfFile === 'string' && pdfFile.trim()) {
          loadingTaskRef.current = pdfjsLib.getDocument({ url: pdfFile });
        } else {
          throw new Error('รูปแบบไฟล์ PDF ไม่ถูกต้อง');
        }

        const pdf = await loadingTaskRef.current.promise;
        
        if (!isMounted) return;
        
        setNumPages(pdf.numPages);
        const page = await pdf.getPage(pageNumber);

        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(size / viewport.width, height / viewport.height);
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
      } catch (err) {
        if (isMounted) {
          clearTimeout(timeoutId);
          handleError(err);
        }
      } 
    };

    loadPDF();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel().catch(e => console.warn("Error cancelling render task on unmount", e));
        renderTaskRef.current = null;
      }
      if (loadingTaskRef.current) {
        loadingTaskRef.current.destroy().catch(e => console.warn("Error destroying loading task on unmount", e));
        loadingTaskRef.current = null;
      }
    };
  }, [pdfFile, pageNumber, size, height, handleError, loading]);

  useEffect(() => {
    isMountedRef.current = true;
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
    width: `${size}px`,
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
        {!pdfFile && !loading && !error && (
          <Empty description="ไม่มีเอกสาร PDF" />
        )}
        <canvas ref={canvasRef} style={{ display: (loading || error) ? 'none' : 'block' }}></canvas>
        {numPages > 1 && !error && (
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