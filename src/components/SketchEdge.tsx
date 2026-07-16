import { memo } from 'react';
import { BaseEdge, getBezierPath, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';

export default memo(function SketchEdge(props: EdgeProps) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  });

  const selected = Boolean(props.selected);

  return (
    <>
      <BaseEdge path={path} style={{ stroke: selected ? '#00D4AA' : '#6C47FF', strokeWidth: selected ? 3 : 2.4, strokeDasharray: '7 5' }} markerEnd={props.markerEnd} />
      {props.label ? (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            className="pointer-events-auto rounded-full border border-white/10 bg-[#0A0A0F]/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.24em] text-[#F0F0F0] shadow-[0_8px_18px_rgba(0,0,0,0.35)]"
          >
            {props.label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
});
