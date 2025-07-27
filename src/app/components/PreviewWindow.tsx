import { useEffect, useRef } from 'react';
import { useQuery } from 'react-query';

export const PreviewWindow = () => {
  const ref = useRef<HTMLDivElement>(null);

  const query = useQuery('obs-state', () => window.native.obs.readObsModuleState());
  useEffect(() => {
    window.native.obs.onObsModuleStateChange((_evt, _state) => {
      query.refetch(); // TODO: More clever strategy to merge the queried state with the listener state
    });
  }, []);

  // use effect with resize or move listener:
  useEffect(() => {
    if (!ref.current) {
      return;
    }
    if (!query.data?.previewReady) {
      return;
    }
    const clientRects = ref.current?.getClientRects();
    window.native.obs.resizeMovePreview(
      clientRects[0].x,
      clientRects[0].y,
      clientRects[0].width,
      clientRects[0].height,
    );
    const resizeObserver = new ResizeObserver(() => {
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
  }, [query.data?.previewReady]);

  return (
    <div ref={ref} className="w-full h-full bg-red-500">
      Preview
    </div>
  );
};
