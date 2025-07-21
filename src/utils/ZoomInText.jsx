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
  duration: 1,
  stagger: 0.05,
  ease: "power2.out",
  start: "top 95%",
  end: "bottom bottom",
  scrub: 1,
  once: false,
};

export function useZoomInText(config = {}) {
  const configRef = useRef({ ...ZoomInTextConfig, ...config });
  const animationsRef = useRef([]);
  const scrollTriggersRef = useRef([]);
  const splitTextInstancesRef = useRef([]);

  useEffect(() => {
    // Wait for fonts to load to avoid layout shifts
    document.fonts.ready.then(() => {
      const {
        selector,
        type,
        linesClass,
        initialScale,
        finalScale,
        opacity,
        initialOpacity,
        finalOpacity,
        duration,
        stagger,
        ease,
        start,
        end,
        scrub,
        once,
      } = configRef.current;

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
          splitTextInstancesRef.current.push(split);
          targets = type.includes("lines") ? split.lines : split.words;
        }

        // Set initial state
        gsap.set(targets, {
          scale: initialScale,
          ...(opacity && { opacity: initialOpacity }),
          transformOrigin: "center center",
        });

        // Create a timeline for better control
        const tl = gsap.timeline({ paused: true });
        tl.fromTo(
          targets,
          {
            scale: initialScale,
            ...(opacity && { opacity: initialOpacity }),
          },
          {
            scale: finalScale,
            ...(opacity && { opacity: finalOpacity }),
            duration,
            stagger: type ? stagger : 0,
            ease,
          }
        );

        // Create ScrollTrigger
        const trigger = ScrollTrigger.create({
          trigger: element,
          start,
          end,
          scrub,
          once,
          animation: tl,
          onEnterBack: () => {
            tl.play(); // Play when re-entering from above
          },
          onLeave: () => {
            // Reset to initial state when leaving downward
            gsap.set(targets, {
              scale: initialScale,
              ...(opacity && { opacity: initialOpacity }),
            });
            tl.progress(0).pause();
          },
          onLeaveBack: () => {
            // Reset to initial state when leaving upward
            gsap.set(targets, {
              scale: initialScale,
              ...(opacity && { opacity: initialOpacity }),
            });
            tl.progress(0).pause();
          },
          markers: true, // Set to true for debugging
        });

        animationsRef.current.push(tl);
        scrollTriggersRef.current.push(trigger);
      });

      return () => {
        console.log("[ZoomInText] Cleaning up animations and ScrollTriggers");
        animationsRef.current.forEach((animation) => animation.kill());
        scrollTriggersRef.current.forEach((trigger) => trigger.kill());
        splitTextInstancesRef.current.forEach((split) => split.revert());
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