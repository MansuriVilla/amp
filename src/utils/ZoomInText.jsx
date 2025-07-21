import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(SplitText, ScrollTrigger);

const ZoomInTextConfig = {
  selector: ".zoom-text",
  type: "words",
  linesClass: "zoom-line",
  initialScale: 0.5,
  finalScale: 1,
  opacity: true,
  initialOpacity: 0,
  finalOpacity: 1,
  duration: 0.8,
  stagger: 0.05,
  ease: "power2.out",
  start: "top 80%",
  once: true,
};

export function useZoomInText(config = {}) {
  const configRef = useRef({ ...ZoomInTextConfig, ...config });
  const animationsRef = useRef([]);
  const scrollTriggersRef = useRef([]);
  const splitTextInstancesRef = useRef([]); // Track SplitText instances

  useEffect(() => {
    // Wait for fonts to load
    document.fonts.ready.then(() => {
      const { selector, type, linesClass, initialScale, finalScale, opacity, initialOpacity, finalOpacity, duration, stagger, ease, start, once } = configRef.current;

      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`[ZoomInText] No elements found for selector: ${selector}`);
        return;
      }

      elements.forEach((element) => {
        let targets = [element];
        let split = null;
        if (type) {
          split = new SplitText(element, {
            type,
            linesClass,
          });
          splitTextInstancesRef.current.push(split); // Store instance
          targets = type.includes("lines") ? split.lines : split.words;
        }

        gsap.set(targets, {
          scale: initialScale,
          ...(opacity && { opacity: initialOpacity }),
          transformOrigin: "center center",
        });

        const animation = gsap.to(targets, {
          scale: finalScale,
          ...(opacity && { opacity: finalOpacity }),
          duration,
          stagger: type ? stagger : 0,
          ease,
          paused: true,
          onComplete: () => {
            gsap.set(targets, { scale: finalScale, ...(opacity && { opacity: finalOpacity }) });
          },
        });

        const trigger = ScrollTrigger.create({
          trigger: element,
          start,
          once,
          onEnter: () => {
            animation.play();
          },
        });

        animationsRef.current.push(animation);
        scrollTriggersRef.current.push(trigger);
      });

      return () => {
        console.log("[ZoomInText] Cleaning up animations and ScrollTriggers");
        animationsRef.current.forEach((animation) => animation.kill());
        scrollTriggersRef.current.forEach((trigger) => trigger.kill());
        splitTextInstancesRef.current.forEach((split) => split.revert()); // Revert each instance
        animationsRef.current = [];
        scrollTriggersRef.current = [];
        splitTextInstancesRef.current = [];
      };
    });

    return () => {
      console.log("[ZoomInText] Early cleanup");
      animationsRef.current.forEach((animation) => animation.kill());
      scrollTriggersRef.current.forEach((trigger) => trigger.kill());
      splitTextInstancesRef.current.forEach((split) => split.revert());
      animationsRef.current = [];
      scrollTriggersRef.current = [];
      splitTextInstancesRef.current = [];
    };
  }, []);

  return null;
}