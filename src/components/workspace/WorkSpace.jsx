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


  useEffect(() => {
    function slideInView() {
      const container = document.querySelector(
        ".slide_in-view__container .slide_in-view__row"
      );
      const imagesContainer = document.querySelector(".slide_in-view__images");
      const images = imagesContainer.querySelectorAll(".slide_in-view__image");

      if (!container || !imagesContainer || images.length === 0) {
        console.warn("Slide-in view elements not found");
        return;
      }

      // Calculate total width of original images dynamically
      let originalImagesWidth = 0;
      images.forEach((img) => {
        const style = window.getComputedStyle(img);
        const marginLeft = parseFloat(style.marginLeft);
        const marginRight = parseFloat(style.marginRight);
        originalImagesWidth += img.offsetWidth + marginLeft + marginRight;
      });

      // Clone images
      images.forEach((img) => {
        const clone = img.cloneNode(true);
        imagesContainer.appendChild(clone);
      });

      let initSlides = false;

      ScrollTrigger.create({
        trigger: container,
        start: "10% 83%",
        end: "10% top",
        // markers: true,
        onEnter: () => {
          if (initSlides) return;
          initSlides = true;

          gsap.set(".slide_in-view__images .slide_in-view__image", {
            opacity: 0,
            x: "100%",
          });

          gsap.to(".slide_in-view__images .slide_in-view__image", {
            opacity: 1,
            x: "0%",
            duration: 1.6,
            stagger: 0.1,
            ease: "power4.out",
          });

          gsap.to(imagesContainer, {
            x: -originalImagesWidth,
            ease: "none",
            duration: 80,
            repeat: -1,
          });
        },
      });

      ScrollTrigger.refresh();
    }
    slideInView();
  }, []);


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
        <div className="wrokSpace_section-bottom slide_in-view__container">
          <div className="scroll_slider   slide_in-view__row">
            <div className="slider_items slide_in-view__images work-space_items site_flex site_gap" ref={sliderRef}>
              {WorkSpaceData.map((data, index) => (
                <div className="work-space--slide-item slide_in-view__image" key={data.id}>
                  <div className="item_bg">
                    <img
                    
                      src={data.image_bg}
                      alt={data.image_bg}
                      ref={(el) => setItemRef(el, index)}
                      decoding="async"
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