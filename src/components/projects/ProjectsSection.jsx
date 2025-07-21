import { useEffect, useRef } from "react";
import ProjectData from "../../data/ProjectData.json";
import "./projectsection.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function ProjectsSection() {
  const itemsRef = useRef([]);
  // We no longer need sectionRef for pinning the whole section,
  // it can be removed or kept if used for other purposes.
  // const sectionRef = useRef(null);
  const sliderRef = useRef(null); // This refers to the .slider_items div now
  const projectSectionBottomRef = useRef(null); // New ref for the .project_section-bottom div
  const mainScrollTrigger = useRef(null);

  useEffect(() => {
    const slider = sliderRef.current;
    const projectSectionBottom = projectSectionBottomRef.current; // Get the .project_section-bottom element

    if (slider && projectSectionBottom) {
      const totalContentWidth = slider.scrollWidth;
      const visibleContainerWidth = slider.clientWidth;
      const scrollableDistance = totalContentWidth - visibleContainerWidth;

      const startXPercent = 5; // Initial offset for the slider content

      gsap.set(slider, { x: (totalContentWidth * startXPercent) / 100 });

      mainScrollTrigger.current = gsap.to(slider, {
        x: -scrollableDistance,
        ease: "none",
        scrollTrigger: {
          trigger: projectSectionBottom, // Trigger the pin and scroll on the bottom section
          start: "top top", // When the top of project_section-bottom hits the top of the viewport
          end: () =>
            "+=" +
            (scrollableDistance + (totalContentWidth * startXPercent) / 100),
          pin: true, // Pin ONLY project_section-bottom
          pinSpacing: true,
          scrub: true,
          invalidateOnRefresh: true,
          // markers: true, // Uncomment for debugging horizontal scroll
        },
      });
    }

    return () => {
      if (mainScrollTrigger.current) {
        mainScrollTrigger.current.kill();
        mainScrollTrigger.current = null;
      }
      // This will kill all triggers, make sure it's intentional or refine it
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []); // Depend on nothing for initial setup

  useEffect(() => {
    if (!mainScrollTrigger.current) {
      return;
    }

    const slideItems = document.querySelectorAll(".slide-item");

    slideItems.forEach((slideItem) => {
      const cta = slideItem.querySelector(".project_cta");

      if (cta) {
        gsap.set(cta, { y: 20, opacity: 0 });

        gsap.to(cta, {
          y: 0,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: slideItem,
            start: "left 60%",
            end: "left 60%",
            containerAnimation: mainScrollTrigger.current,
            toggleActions: "play none none reverse",
            scrub: true,
            // markers: true
          },
        });
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger && trigger.trigger.classList && trigger.trigger.classList.contains('slide-item')) {
          trigger.kill();
        }
      });
    };
  }, [mainScrollTrigger.current]);


  const setItemRef = (el, index) => {
    itemsRef.current[index] = el;
  };

  return (
    <section className="projects_section" ref={projectSectionBottomRef}> 
      <div className="projects_section-inner site_flex flex_column site_gap">
        <div className="project_section-top">
          <div className="site_container">
            <span className="section_name">PROJECTS</span>
            <h2>Built, Not Bragged</h2>
            <p className="h2 light">
              Launched. Delivered. Live. <br /> These aren’t mockups —they’re real
              projects we’ve brought into the world.
            </p>
          </div>
        </div>
        
        <div className="project_section-bottom" >
          <div className="scroll_slider">
            <div className="slider_items site_flex site_gap" ref={sliderRef}>
              {ProjectData.map((data, index) => (
                <div className="slide-item" key={data.id}>
                  <div className="item_bg">
                    <img
                      src={data.image_bg}
                      alt={data.image_bg}
                      ref={(el) => setItemRef(el, index)}
                      decoding="async"
                    />
                  </div>
                  <div className="item_content">
                    <a href="javascript:void(0);" className="project_cta">
                      {data.button_text}
                    </a>
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