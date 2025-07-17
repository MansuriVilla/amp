import { useEffect, useRef } from "react";
import ProjectData from "../../data/ProjectData.json";
import "./projectsection.css"; // Ensure your CSS file is linked
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger with GSAP
gsap.registerPlugin(ScrollTrigger);

function ProjectsSection() {
  // Create an array to store refs for each image (for the existing parallax)
  const itemsRef = useRef([]);
  // Ref for the main section to be pinned
  const sectionRef = useRef(null);
  // Ref for the slider container for horizontal animation
  const sliderRef = useRef(null);

  // Scroll-based animation logic with ScrollTrigger
  useEffect(() => {
    // Existing parallax animation for images
    itemsRef.current.forEach((item, index) => {
      if (item) {
        gsap.to(item, {
          // --- CHANGE HERE: from y to x ---
          x: window.innerWidth * 0.1, // Parallax movement on X-axis (adjust as needed, e.g., 10% of viewport width)
          ease: "none",
          scrollTrigger: {
            trigger: item,
            start: "top bottom", // Still triggers vertically based on image position
            end: "bottom top", // Still ends vertically
            scrub: true, // Smoothly animate with scroll
            invalidateOnRefresh: true, // Recalculate on resize
            markers: true, // Debug markers (remove in production)
            onUpdate: (self) => {
              // --- CHANGE HERE: from translateY to translateX in matrix3d ---
              const progress = self.progress; // 0 to 1 based on scroll
              const translateX = progress * window.innerWidth * 0.1; // Match the 'x' value
              item.style.transform = `matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)`; // Reset to base matrix for correct update
              item.style.transform = `translateX(${translateX}px) scale(1.5)`; // Apply translateX and scale
              // Note: Combining scale and translate using individual transforms is often easier
              // than manipulating matrix3d directly unless you have very specific 3D needs.
              // GSAP handles these combinations internally very well.
            },
          },
        });
      }
    });

    // --- Horizontal Scroll Animation for Slider Items with Section Pinning ---
    if (sectionRef.current && sliderRef.current) {
      const sliderItems = gsap.utils.toArray(sliderRef.current.children);
      let totalWidth = 0;
      sliderItems.forEach((item) => {
        totalWidth +=
          item.offsetWidth +
          parseFloat(getComputedStyle(item).marginRight || 0) +
          parseFloat(getComputedStyle(item).marginLeft || 0);
      });

      const initialXOffset = -window.innerWidth * 0.5;
      const finalXPosition = -(totalWidth - window.innerWidth);

      const horizontalTravelDistance = Math.abs(finalXPosition - initialXOffset);
      const pinDuration = horizontalTravelDistance * 1.5;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: true,
          start: "top top",
          end: `+=${pinDuration}`,
          scrub: 1,
          invalidateOnRefresh: true,
        //   markers: true,        
          onEnter: () => {
            gsap.set(sliderRef.current, { x: initialXOffset });
          },
          onLeaveBack: () => {
            gsap.set(sliderRef.current, { x: initialXOffset });
          },
        },
      });

      tl.to(sliderRef.current, {
        x: finalXPosition,
        ease: "none",
      });
    }

    // Cleanup ScrollTrigger instances on unmount
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  // Helper function to assign refs to each item (for existing parallax)
  const setItemRef = (el, index) => {
    itemsRef.current[index] = el;
  };

  return (
    <section className="projects_section" ref={sectionRef}>
      <div className="projects_section-inner site_flex flex_column site_gap">
        <div className="project_section-top">
          <div className="site_container">
            <span className="section_name">PROJECTS</span>
            <h2>Built, Not Bragged</h2>
            <p>
              Launched. Delivered. Live. These aren’t mockups —they’re real
              projects we’ve brought into the world.
            </p>
          </div>
        </div>
        <div className="project_section-bottom">
          <div className="scroll_slider">
            <div className="slider_items site_flex site_gap" ref={sliderRef}>
              {ProjectData.map((data, index) => (
                <div className="slide-item" key={data.id}>
                  <div className="item_bg">
                    <img
                      src={data.image_bg}
                      alt={data.image_bg}
                      ref={(el) => setItemRef(el, index)}
                    />
                  </div>
                  <div className="item_content">
                    <img src={data.logo} alt={data.logo} />
                    <a href="javascript:void(0);">{data.button_text}</a>
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

export default ProjectsSection;