"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import styles from "./page-scrollbar.module.css";

type ScrollMetrics = { max: number; top: number; height: number; travel: number };

const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value));

export function PageScrollbar() {
  const rail = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; offset: number } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alwaysVisible = useRef(false);
  const nearEdge = useRef(false);
  const [visible, setVisible] = useState(false);
  const [metrics, setMetrics] = useState<ScrollMetrics | null>(null);

  const cancelHide = useCallback(() => {
    if (hideTimer.current !== null) clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }, []);

  const reveal = useCallback(() => {
    cancelHide();
    setVisible(true);
  }, [cancelHide]);

  const retract = useCallback(() => {
    const keepVisible = () => alwaysVisible.current || nearEdge.current || drag.current !== null ||
      (rail.current !== null && document.activeElement === rail.current);

    if (hideTimer.current !== null || keepVisible()) return;
    hideTimer.current = setTimeout(() => {
      hideTimer.current = null;
      if (!keepVisible()) setVisible(false);
    }, 220);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(max-width: 800px), (hover: none), (pointer: coarse)");
    let frame: number | null = null;
    const measure = () => {
      frame = null;
      const viewport = root.clientHeight;
      const contentHeight = root.scrollHeight;
      const track = Math.max(0, viewport - 8);
      const max = Math.max(0, contentHeight - viewport);
      const height = Math.min(track, Math.max(36, (track * viewport) / Math.max(1, contentHeight)));
      setMetrics({ max, top: clamp(window.scrollY, max), height, travel: track - height });
    };
    const requestMeasure = () => {
      if (frame === null) frame = window.requestAnimationFrame(measure);
    };
    const updateMode = () => {
      alwaysVisible.current = media.matches;
      nearEdge.current = false;
      cancelHide();
      setVisible(media.matches || drag.current !== null ||
        (rail.current !== null && document.activeElement === rail.current));
      requestMeasure();
    };
    const pointerMoved = (event: globalThis.PointerEvent) => {
      if (alwaysVisible.current || event.pointerType === "touch") return;
      const wasNear = nearEdge.current;
      nearEdge.current = event.clientX >= window.innerWidth - 44;
      if (nearEdge.current && !wasNear) reveal();
      else if (!nearEdge.current && wasNear) retract();
    };
    const pointerLeft = () => {
      nearEdge.current = false;
      retract();
    };

    root.dataset.pageScrollbar = "custom";
    updateMode();
    const observer = new ResizeObserver(requestMeasure);
    observer.observe(document.body);
    observer.observe(root);
    window.addEventListener("scroll", requestMeasure, { passive: true });
    window.addEventListener("resize", requestMeasure);
    window.addEventListener("pointermove", pointerMoved, { passive: true });
    document.addEventListener("pointerleave", pointerLeft);
    media.addEventListener("change", updateMode);

    return () => {
      observer.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
      cancelHide();
      window.removeEventListener("scroll", requestMeasure);
      window.removeEventListener("resize", requestMeasure);
      window.removeEventListener("pointermove", pointerMoved);
      document.removeEventListener("pointerleave", pointerLeft);
      media.removeEventListener("change", updateMode);
      delete root.dataset.pageScrollbar;
    };
  }, [cancelHide, retract, reveal]);

  if (!metrics?.max) return null;

  const progress = metrics.top / metrics.max;
  const position = progress * metrics.travel;
  const scrollTo = (top: number) => window.scrollTo({ top: clamp(top, metrics.max), behavior: "instant" });
  const moveToPointer = (event: PointerEvent<HTMLDivElement>, offset: number) => {
    if (!metrics.travel) return;
    const local = event.clientY - event.currentTarget.getBoundingClientRect().top - offset;
    scrollTo((local / metrics.travel) * metrics.max);
  };
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    reveal();
    const local = event.clientY - event.currentTarget.getBoundingClientRect().top;
    const offset = local >= position && local <= position + metrics.height ? local - position : metrics.height / 2;
    drag.current = { pointerId: event.pointerId, offset };
    event.currentTarget.setPointerCapture(event.pointerId);
    moveToPointer(event, offset);
  };
  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    retract();
  };
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const pageStep = window.innerHeight * 0.85;
    const targets: Record<string, number> = {
      ArrowDown: metrics.top + 40,
      ArrowUp: metrics.top - 40,
      PageDown: metrics.top + pageStep,
      PageUp: metrics.top - pageStep,
      Home: 0,
      End: metrics.max,
      " ": metrics.top + (event.shiftKey ? -pageStep : pageStep),
    };
    if (!Object.hasOwn(targets, event.key)) return;
    event.preventDefault();
    reveal();
    scrollTo(targets[event.key]);
  };

  return (
    <div
      ref={rail}
      className={styles.rail}
      data-visible={visible}
      role="scrollbar"
      aria-label="Rolagem da página"
      aria-controls="page-content"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={Math.ceil(metrics.max)}
      aria-valuenow={Math.round(metrics.top)}
      aria-valuetext={`${Math.round(progress * 100)}% da página`}
      tabIndex={0}
      onFocus={reveal}
      onBlur={retract}
      onPointerDown={pointerDown}
      onPointerMove={(event) => {
        const activeDrag = drag.current;
        if (activeDrag?.pointerId === event.pointerId) moveToPointer(event, activeDrag.offset);
      }}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onLostPointerCapture={finishDrag}
      onKeyDown={keyDown}
    >
      <div className={styles.thumb} style={{ height: metrics.height, transform: `translateY(${position}px)` }} />
    </div>
  );
}
