import { useEffect, useRef, useState } from "react";
import ProjectData from "../../data/ProjectData.json";
import "./projectsection.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import linkIcon from "/assets/images/anchor-ico.svg";

gsap.registerPlugin(ScrollTrigger);

function ProjectsSection() {
  const itemsRef = useRef([]);
  const ctaRefs = useRef([]);
  const sliderRef = useRef(null);
  const projectSectionBottomRef = useRef(null);
  const mainScrollTrigger = useRef(null);
  const overlayRef = useRef(null);

  const [overlayData, setOverlayData] = useState(null);
  const [isOverlayVisible, setOverlayVisible] = useState(false);

  useEffect(() => {
    const setupAnimations = () => {
      const slider = sliderRef.current;
      const projectSectionBottom = projectSectionBottomRef.current;

      // Kill existing main ScrollTrigger if it exists
      if (mainScrollTrigger.current) {
        mainScrollTrigger.current.kill(true); // Kills tween and ScrollTrigger
        mainScrollTrigger.current = null;
      }
      // Removed: ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      // We no longer kill all ScrollTriggers, only this component's

      // Check if screen width is 768px or less
      if (window.innerWidth <= 768) {
        if (slider) {
          gsap.set(slider, { x: 0 });
        }
        if (projectSectionBottom) {
          ScrollTrigger.refresh(); // Refresh to remove pinning effects
        }
        ctaRefs.current.forEach((cta) => {
          if (cta) {
            gsap.set(cta, { y: 0, opacity: 1 }); // Ensure CTAs are visible
          }
        });
        return; // Exit if on mobile
      }

      // Setup animations for larger screens
      if (slider && projectSectionBottom) {
        const totalContentWidth = slider.scrollWidth;
        const visibleContainerWidth = slider.clientWidth;
        const scrollableDistance = Math.max(
          0,
          totalContentWidth - visibleContainerWidth
        );
        const startXPercent = 5;

        gsap.set(slider, { x: (totalContentWidth * startXPercent) / 100 });

        mainScrollTrigger.current = gsap.to(slider, {
          x: -scrollableDistance,
          ease: "none",
          scrollTrigger: {
            trigger: projectSectionBottom,
            start: "11% top",
            end: () =>
              "+=" +
              (scrollableDistance + (totalContentWidth * startXPercent) / 100),
            pin: true,
            pinSpacing: true,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
      }
    };

    setupAnimations();
    window.addEventListener("resize", setupAnimations);

    return () => {
      window.removeEventListener("resize", setupAnimations);
      if (mainScrollTrigger.current) {
        mainScrollTrigger.current.kill(true);
        mainScrollTrigger.current = null;
      }
    };
  }, []);

  // CTA Button Animations
  useEffect(() => {
    if (!mainScrollTrigger.current) {
      return;
    }

    const slideItems = document.querySelectorAll(".slide-item");
    const ctaScrollTriggers = []; // Array to store CTA ScrollTriggers

    slideItems.forEach((slideItem) => {
      const cta = slideItem.querySelector(".project_cta");

      if (cta) {
        gsap.set(cta, { y: 20, opacity: 0 });

        const tween = gsap.to(cta, {
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
          },
        });

        ctaScrollTriggers.push(tween.scrollTrigger); // Store the ScrollTrigger instance
      }
    });

    // Cleanup only this component's CTA ScrollTriggers
    return () => {
      ctaScrollTriggers.forEach((st) => st.kill());
    };
  }, [mainScrollTrigger.current]);

  // Overlay animation effect (unchanged)
  useEffect(() => {
    if (isOverlayVisible && overlayRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { y: "100%" },
        { y: 0, duration: 0.5, ease: "power2.out" }
      );
      document.body.style.overflow = "hidden";
      if (window.lenis) window.lenis.stop();
    } else {
      document.body.style.overflow = "auto";
      if (window.lenis) window.lenis.start();
    }
  }, [isOverlayVisible]);

  const handleCardClick = (data) => {
    setOverlayData(data);
    setOverlayVisible(true);
  };

  const closeOverlay = () => {
    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        y: "100%",
        duration: 0.5,
        ease: "power2.in",
        onComplete: () => {
          setOverlayVisible(false);
          setOverlayData(null);
        },
      });
    } else {
      setOverlayVisible(false);
      setOverlayData(null);
    }
  };

  const setItemRef = (el, index) => {
    itemsRef.current[index] = el;
  };

  const setCtaRef = (el, index) => {
    ctaRefs.current[index] = el;
  };

  // JSX remains unchanged
  return (
    <>
      <section className="projects_section" ref={projectSectionBottomRef}>
        <div className="projects_section-inner site_flex flex_column site_gap reveal-section">
          <div className="project_section-top">
            <div className="site_container ">
              <span className="section_name reveal-text">PROJECTS</span>
              <h2 className="reveal-text">Built, Not Bragged</h2>
              <p className="h2 light reveal-text">
                Launched. Delivered. Live. <br /> These aren’t mockups —they’re
                real projects we’ve brought into the world.
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
                        decoding="async"
                      />
                    </div>
                    <div className="item_content">
                      <a
                        href="javascript:void(0);"
                        onClick={() => handleCardClick(data)}
                        className="project_cta"
                        ref={(el) => setCtaRef(el, index)}
                      >
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

      {isOverlayVisible && overlayData && (
        <div className="overlay">
          <div className="overlay_content" ref={overlayRef}>
            <div className="overlay_inner" data-lenis-prevent>
              <div className="overlay_close" onClick={closeOverlay}>
                <button className="overlay_close-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="26px"
                    height="26px"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z"
                      fill="#fff"
                    />
                  </svg>
                </button>
              </div>
              <div className="project_overlay-cover">
                <img src={overlayData.image_bg} alt={overlayData.image_bg} />
              </div>
              <div className="overlay_project-details ">
                <div className="overlay_project-details--inner site_flex">
                  <div className="project_deatils--text ">
                    <h2>{overlayData.heading}</h2>
                    <p>{overlayData.description}</p>
                  </div>
                  <div className="project_details-link">
                    <a
                      href={overlayData.project_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="site_flex "
                    >
                      <span className="anchor_hover site_flex">
                        {overlayData.project_link_linkText}{" "}
                      </span>{" "}
                      <span className="site_flex">
                        <img className="icon-default" src={linkIcon} alt="Email Link Icon" />
                        <img className="icon-hover" src={linkIcon} alt="Email Link Icon" />
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProjectsSection;