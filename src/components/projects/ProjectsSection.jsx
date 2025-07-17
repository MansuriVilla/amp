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
    // Existing parallax animation for images (can remain as is or adjust if it conflicts)
    itemsRef.current.forEach((item, index) => {
      if (item) {
        gsap.to(item, {
          y: window.innerHeight * 0.2, // Parallax movement (adjust as needed)
          ease: "none",
          scrollTrigger: {
            trigger: item,
            start: "top bottom", // Start when top of image hits bottom of viewport
            end: "bottom top", // End when bottom of image hits top of viewport
            scrub: true, // Smoothly animate with scroll
            invalidateOnRefresh: true, // Recalculate on resize
            // markers: true, // Debug markers (remove in production)
            onUpdate: (self) => {
              const progress = self.progress;
              const translateY = progress * window.innerHeight * 0.26;
              item.style.transform = `matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, ${translateY}, 0, 1)`;
              item.style.scale = "1.5";
            },
          },
        });
      }
    });

    // --- Horizontal Scroll Animation for Slider Items with Section Pinning ---
    // Ensure both refs are available before proceeding
    if (sectionRef.current && sliderRef.current) {
      const sliderItems = gsap.utils.toArray(sliderRef.current.children); // Get direct children of sliderRef
      let totalWidth = 0;
      sliderItems.forEach((item) => {
        totalWidth +=
          item.offsetWidth +
          parseFloat(getComputedStyle(item).marginRight || 0) +
          parseFloat(getComputedStyle(item).marginLeft || 0);
      });

      // Initial position: start the slider items at -50% of the viewport width.
      const initialXOffset = -window.innerWidth * 0.5;

      // Final position: The point where the right edge of the last slide aligns with the viewport's right edge.
      // This is calculated as (total width of all items) - (width of the visible container, i.e., viewport width).
      const finalXPosition = -(totalWidth - window.innerWidth);

      // Calculate the total horizontal distance the slider needs to travel during the animation.
      const horizontalTravelDistance = Math.abs(finalXPosition - initialXOffset);

      // Determine the vertical scroll duration for pinning.
      // This should be sufficient to allow the horizontal animation to complete.
      // A multiplier helps control the scroll speed (higher multiplier = slower scroll).
      // Adjust the '1.5' multiplier to make the horizontal scroll faster or slower.
      const pinDuration = horizontalTravelDistance * 1.5;

      // Create a timeline for the horizontal scroll and its ScrollTrigger
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current, // The element to pin
          pin: true, // Pin the entire section
          start: "top top", // Start pinning when the top of the section hits the top of the viewport
          end: `+=${pinDuration}`, // The duration (vertical scroll distance) for which the section remains pinned
          scrub: 1, // Smoothly animate with scroll, 1 means it lags 1 second behind the scroll
          invalidateOnRefresh: true, // Recalculate on window resize
          markers: true, // Enable debug markers (remove in production)
          onEnter: () => {
            // Set the initial horizontal position when the pinning starts.
            // This ensures it starts correctly even on refresh or if scrolled quickly.
            gsap.set(sliderRef.current, { x: initialXOffset });
          },
          onLeaveBack: () => {
            // Reset position when scrolling back up and leaving the trigger area.
            gsap.set(sliderRef.current, { x: initialXOffset });
          },
        },
      });

      // Add the horizontal animation to the timeline
      tl.to(sliderRef.current, {
        x: finalXPosition, // Animate to the final calculated position
        ease: "none", // Linear animation for scrubbing
      });
    }

    // Cleanup ScrollTrigger instances on unmount
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []); // Empty dependency array means this runs once after initial render

  // Helper function to assign refs to each item (for existing parallax)
  const setItemRef = (el, index) => {
    itemsRef.current[index] = el;
  };

  return (
    // Assign sectionRef to the main <section> element for pinning
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
            {/* Assign sliderRef to the .slider_items div for horizontal movement */}
            <div className="slider_items site_flex site_gap" ref={sliderRef}>
              {ProjectData.map((data, index) => (
                <div className="slide-item" key={data.id}>
                  <div className="item_bg">
                    <img
                      src={data.image_bg}
                      alt={data.image_bg}
                      ref={(el) => setItemRef(el, index)} // For parallax effect
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