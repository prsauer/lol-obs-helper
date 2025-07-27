import { useEffect, useRef } from 'react';

export const PreviewWindow = () => {
  const ref = useRef<HTMLDivElement>(null);

  // use effect with resize or move listener:
  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const resizeObserver = new ResizeObserver(() => {
      console.log('resize', ref.current?.getClientRects());
      const clientRects = ref.current?.getClientRects();
      if (clientRects) {
        window.native.obs.resizeMovePreview(
          clientRects[0].x,
          clientRects[0].y,
          clientRects[0].width,
          clientRects[0].height,
        );
      }
    });
    resizeObserver.observe(ref.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full h-full bg-red-500">
      Preview
    </div>
  );
};
