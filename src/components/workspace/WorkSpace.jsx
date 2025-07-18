import { useEffect, useRef } from "react";
import WorkSpaceData from "../../data/WorkSpaceData.json";
import "./workspace.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function WorkSpace() {
  const itemsRef = useRef([]);
  const sectionRef = useRef(null);
  const sliderRef = useRef(null);
  const mainScrollTrigger = useRef(null); // New ref to store the main ScrollTrigger

  useEffect(() => {
    const slider = sliderRef.current;
    const section = sectionRef.current;

    // if (slider && section) {
    //   const totalContentWidth = slider.scrollWidth;
    //   const visibleContainerWidth = slider.clientWidth;
    //   const scrollableDistance = totalContentWidth - visibleContainerWidth;

    //   const startXPercent = 5;

    //   gsap.set(slider, { x: (totalContentWidth * startXPercent) / 100 });

    //   // Store the created ScrollTrigger instance in the ref
    //   mainScrollTrigger.current = gsap.to(slider, {
    //     x: -scrollableDistance,
    //     ease: "none",
    //     scrollTrigger: {
    //       trigger: section,
    //       start: "top top",
    //       end: () =>
    //         "+=" +
    //         (scrollableDistance + (totalContentWidth * startXPercent) / 100),
    //       pin: true,
    //       pinSpacing: true,
    //       scrub: 1,
    //       invalidateOnRefresh: true,
    //       // markers: true, // Uncomment for debugging horizontal scroll
    //     },
    //   });
    // }

    // return () => {
    //   // Clean up the main ScrollTrigger
    //   if (mainScrollTrigger.current) {
    //     mainScrollTrigger.current.kill();
    //     mainScrollTrigger.current = null;
    //   }
    //   ScrollTrigger.getAll().forEach((trigger) => trigger.kill()); // This can still be useful for other triggers
    // };
  }, []);

  useEffect(() => {
    // Only set up CTA animations if the main horizontal scroll trigger exists
    if (!mainScrollTrigger.current) {
      return; // Exit if the main trigger isn't ready yet
    }

    const slideItems = document.querySelectorAll(".work-space--slide-item");

    slideItems.forEach((slideItem) => {
      const cta = slideItem.querySelector(".wrokSpace_cta");

      if (cta) {
        gsap.set(cta, { y: 20, opacity: 0 }); // Start slightly below and invisible

        gsap.to(cta, {
          y: 0,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: slideItem,
            start: "left center",
            end: "left 20%",
            // Use the stored reference directly here
            containerAnimation: mainScrollTrigger.current,
            toggleActions: "play none none reverse",
            // markers: true, // Uncomment for debugging individual CTA animations
          },
        });
      }
    });

    // Clean up individual CTA ScrollTriggers when component unmounts
    return () => {
      // Find and kill only the ScrollTriggers related to wrokSpace_cta
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger && trigger.trigger.classList && trigger.trigger.classList.contains('slide-item')) {
          trigger.kill();
        }
      });
    };
  }, [mainScrollTrigger.current]); // Re-run this effect when mainScrollTrigger.current changes (i.e., when it's set)


  const setItemRef = (el, index) => {
    itemsRef.current[index] = el;
  };

  return (
    <section className="wrokSpace_section" ref={sectionRef}>
      <div className="wrokSpace_section-inner site_flex flex_column site_gap">
        <div className="wrokSpace_section-top">
          <div className="site_container">
            <span className="section_name">WORKSPACE</span>
            <h2>Inside the Studio</h2>
            <p className="h2 light">
            No sterile cubicles. No corporate vibes. Just a cozy, cluttered, creative space where ideas come to life.
            </p>
          </div>
        </div>
        <div className="wrokSpace_section-bottom">
          <div className="scroll_slider">
            <div className="slider_items work-space_items site_flex site_gap" ref={sliderRef}>
              {WorkSpaceData.map((data, index) => (
                <div className="work-space--slide-item" key={data.id}>
                  <div className="item_bg">
                    <img
                      src={data.image_bg}
                      alt={data.image_bg}
                      ref={(el) => setItemRef(el, index)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WorkSpace;