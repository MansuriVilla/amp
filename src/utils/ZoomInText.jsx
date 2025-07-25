import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(SplitText, ScrollTrigger);

export function useZoomInTextEffect(elementRef, config = {}) {
  const defaultConfig = {
    type: "words", // Split text into words
    linesClass: "zoom-line",
    initialScale: 0.5, // Start small
    finalScale: 1, // End at full size
    opacity: true, // Include opacity animation
    initialOpacity: 0, // Start invisible
    finalOpacity: 1, // End fully visible
    stagger: 0.05, // Stagger for each word/line within the scrubbed animation
    ease: "power2.out", // Smooth easing for individual word/line animations
    start: "top center", // Start when top of element hits center of viewport
    end: "bottom center", // End when bottom of element leaves center of viewport
    markers: false, // Debugging markers (set to true if needed)
    revertDuration: 0.3, // Duration for the explicit revert animation when leaving the section
  };

  const mergedConfig = { ...defaultConfig, ...config };
  const animationsRef = useRef([]);
  const scrollTriggersRef = useRef([]);
  const splitTextInstancesRef = useRef([]);

  useEffect(() => {
    if (!elementRef.current) {
      console.warn("[ZoomInTextEffect] No element reference provided.");
      return;
    }

    // Wait for fonts to load to avoid layout shifts
    document.fonts.ready.then(() => {
      const {
        type,
        linesClass,
        initialScale,
        finalScale,
        opacity,
        initialOpacity,
        finalOpacity,
        stagger,
        ease,
        start,
        end,
        markers,
        revertDuration,
      } = mergedConfig;

      const element = elementRef.current;
      let targets = [element];
      let split = null;

      // Split text if a type (e.g., "words") is specified
      if (type) {
        split = new SplitText(element, {
          type,
          linesClass,
        });
        splitTextInstancesRef.current.push(split);
        targets = type.includes("lines") ? split.lines : split.words;
      }

      // Set initial state explicitly *before* any animation or ScrollTrigger setup.
      // This ensures the text is hidden/scaled down initially and when reset.
      gsap.set(targets, {
        scale: initialScale,
        ...(opacity && { opacity: initialOpacity }),
        transformOrigin: "center center",
      });

      // Create the main animation timeline. This timeline will be scrubbed.
      const tl = gsap.timeline();
      tl.to(
        targets,
        {
          scale: finalScale,
          ...(opacity && { opacity: finalOpacity }),
          stagger: type ? stagger : 0, // Stagger applies to individual elements within the scrub
          ease,
          // No duration here, as ScrollTrigger's scrub controls the overall progress
        }
      );

      // Configure ScrollTrigger
      const trigger = ScrollTrigger.create({
        trigger: element,
        start,
        end,
        animation: tl, // Link the timeline to scrub
        scrub: true, // This makes the animation progress tied to scroll
        markers, // Debugging

        // Callbacks to explicitly handle the "reset on leave" and "reset on enter" behavior.
        onLeave: () => {
          // When scrolling down and leaving the trigger, revert to initial state
          gsap.to(targets, {
            scale: initialScale,
            ...(opacity && { opacity: initialOpacity }),
            duration: revertDuration,
            ease: "power2.out",
            overwrite: true, // Ensures this tween takes precedence and stops any conflicting animations
          });
        },
        onLeaveBack: () => {
          // When scrolling up and leaving the trigger, revert to initial state
          gsap.to(targets, {
            scale: initialScale,
            ...(opacity && { opacity: initialOpacity }),
            duration: revertDuration,
            ease: "power2.out",
            overwrite: true, // Ensures this tween takes precedence
          });
        },
        // ADDED: Explicitly reset when entering the section from either direction
        onEnter: () => {
          // When entering the trigger from the top (scrolling down), snap to initial state
          gsap.set(targets, {
            scale: initialScale,
            ...(opacity && { opacity: initialOpacity }),
            overwrite: true, // Ensure any lingering tweens are killed
          });
        },
        onEnterBack: () => {
          // When entering the trigger from the bottom (scrolling up), snap to initial state
          gsap.set(targets, {
            scale: initialScale,
            ...(opacity && { opacity: initialOpacity }),
            overwrite: true, // Ensure any lingering tweens are killed
          });
        },
      });

      // Store the timeline and trigger for cleanup
      animationsRef.current.push(tl);
      scrollTriggersRef.current.push(trigger);
    });

    // Cleanup on unmount
    return () => {
      console.log("[ZoomInTextEffect] Cleaning up animations and ScrollTriggers");
      animationsRef.current.forEach((animation) => animation.kill());
      scrollTriggersRef.current.forEach((trigger) => trigger.kill());
      splitTextInstancesRef.current.forEach((split) => split.revert());
      // Also kill any ongoing tweens that might have been triggered by onLeave/onLeaveBack
      gsap.killTweensOf(elementRef.current); // Kill tweens on the main element
      if (splitTextInstancesRef.current.length > 0) {
        // If text was split, kill tweens on the individual targets as well
        const splitTargets = type.includes("lines") ? splitTextInstancesRef.current[0].lines : splitTextInstancesRef.current[0].words;
        gsap.killTweensOf(splitTargets);
      }

      animationsRef.current = [];
      scrollTriggersRef.current = [];
      splitTextInstancesRef.current = [];
    };
  }, [elementRef, mergedConfig]); // Re-run effect if elementRef or mergedConfig changes
}
