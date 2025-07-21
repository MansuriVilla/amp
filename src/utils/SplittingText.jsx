import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react"; // Add React's useEffect

gsap.registerPlugin(SplitText, ScrollTrigger);

const SplittingTextConfig = {
  selector: "p:not(p > a)",
  type: "words,lines",
  linesClass: "line",
  autoSplit: true,
  mask: "lines",
  yPercent: 100,
  opacity: 0,
  stagger: 0.1,
  ease: "cubic-bezier(0.77, 0, 0.175, 1)",
  start: "top 100%",
  duration: 0.999,
};

export function SplittingText() {
  useEffect(() => {
    // Wait for fonts to load to avoid layout shifts
    document.fonts.ready.then(() => {
      const elements = document.querySelectorAll(SplittingTextConfig.selector);

      // Set elements to visible by default
      gsap.set(elements, { opacity: 1 });

      // Create IntersectionObserver to trigger animations
      const observer = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateElement(entry.target);
              observer.unobserve(entry.target); // Stop observing after triggering
            }
          });
        },
        {
          threshold: SplittingTextConfig.threshold,
        }
      );

      function animateElement(element) {
        // Split the text
        const split = SplitText.create(element, {
          type: SplittingTextConfig.type,
          linesClass: SplittingTextConfig.linesClass,
          autoSplit: SplittingTextConfig.autoSplit,
          mask: SplittingTextConfig.mask,
        });

        // Use fromTo to explicitly control start and end states
        const animation = gsap.fromTo(
          split.lines,
          { yPercent: 100, opacity: 0 }, // Start hidden and shifted
          {
            duration: SplittingTextConfig.duration,
            yPercent: 0, // End at normal position
            opacity: 1, // End fully visible
            stagger: SplittingTextConfig.stagger,
            ease: SplittingTextConfig.ease,
            onComplete: () => {
              // Ensure elements stay visible after animation
              gsap.set(split.lines, { opacity: 1, yPercent: 0 });
            },
          }
        );

        // Create ScrollTrigger to play animation
        ScrollTrigger.create({
          trigger: element,
          start: SplittingTextConfig.start,
          onEnter: () => {
            animation.play();
          },
          once: SplittingTextConfig.once, // Only play once
        });
      }

      // Observe all target elements
      elements.forEach((element) => {
        observer.observe(element);
      });

      // Cleanup function to run when component unmounts
      return () => {
        observer.disconnect(); // Stop observing
        SplitText.revert(); // Revert SplitText DOM changes
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill()); // Kill all ScrollTriggers
      };
    });
  }, []); // Empty dependency array: run once on mount

  return null; // If used as a component, it doesn't render anything
}