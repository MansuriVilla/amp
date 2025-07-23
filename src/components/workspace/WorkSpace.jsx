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
  const mainScrollTrigger = useRef(null);

  useEffect(() => {
    if (!mainScrollTrigger.current) {
      return;
    }

    const slideItems = document.querySelectorAll(".work-space--slide-item");

    slideItems.forEach((slideItem) => {
      const cta = slideItem.querySelector(".wrokSpace_cta");

      if (cta) {
        gsap.set(cta, { y: 20, opacity: 0 });

        gsap.to(cta, {
          y: 0,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: slideItem,
            start: "left center",
            end: "left 20%",
            containerAnimation: mainScrollTrigger.current,
            toggleActions: "play none none reverse",
          },
        });
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (
          trigger.trigger &&
          trigger.trigger.classList &&
          trigger.trigger.classList.contains("slide-item")
        ) {
          trigger.kill();
        }
      });
    };
  }, [mainScrollTrigger.current]);

  useEffect(() => {
    const config = {
      SCROLL_SPEED: 0.5,
      LERP_FACTOR: 0.05,
      MAX_VELOCITY: 150,
    };
    const totalSlideCount = WorkSpaceData.length;
    const state = {
      currentX: 0,
      targetX: 0,
      slideWidth: 0,
      slides: [],
      isMobile: false,
      animationId: null, // Store requestAnimationFrame ID
    };

    function checkMobile() {
      state.isMobile = window.innerWidth < 1000;
      state.slideWidth = state.isMobile ? (175 + 2 * 10) : (350 + 2 * 20);
    }

    function initializeSlides() {
      const track = sliderRef.current;
      track.innerHTML = "";
      state.slides = [];
      checkMobile();

      const copiesMultiplier = 5;
      const totalSlidesInTrack = totalSlideCount * copiesMultiplier;

      for (let i = 0; i < totalSlidesInTrack; i++) {
        const dataIndex = i % totalSlideCount;
        const slide = document.createElement("div");
        slide.className = "work-space--slide-item slide_in-view__image";
        slide.innerHTML = `
          <div class="item_bg">
            <img src="${WorkSpaceData[dataIndex].image_bg}" alt="${WorkSpaceData[dataIndex].image_bg}" decoding="async" />
          </div>
        `;
        track.appendChild(slide);
        state.slides.push(slide);
      }

      const initialOffset = (totalSlideCount * state.slideWidth) * Math.floor(copiesMultiplier / 2);
      state.currentX = -initialOffset;
      state.targetX = -initialOffset;
      updateSlidePositions();
    }

    function updateSlidePositions() {
      const track = sliderRef.current;
      const sequenceWidth = totalSlideCount * state.slideWidth;

      if (state.currentX < -sequenceWidth * 3) {
        state.currentX += sequenceWidth;
        state.targetX += sequenceWidth;
      } else if (state.currentX > -sequenceWidth * 2) {
        state.currentX -= sequenceWidth;
        state.targetX -= sequenceWidth;
      }

      track.style.transform = `translate3d(${state.currentX}px, 0, 0)`;
    }

    function updateParallax() {
      const viewportCenter = window.innerWidth / 2;
      state.slides.forEach((slide) => {
        const img = slide.querySelector("img");
        if (!img) return;

        const slideRect = slide.getBoundingClientRect();
        if (slideRect.right < -state.slideWidth || slideRect.left > window.innerWidth + state.slideWidth) {
          img.style.transform = "scale(2.25)";
          return;
        }

        const slideCenter = slideRect.left + slideRect.width / 2;
        const distanceFromCenter = slideCenter - viewportCenter;
        const parallaxOffset = distanceFromCenter * -0.25;
        img.style.transform = `translateX(${parallaxOffset}px) scale(1.8)`;
      });
    }

    function animate() {
      state.currentX += (state.targetX - state.currentX) * config.LERP_FACTOR;
      state.targetX -= config.SCROLL_SPEED;
      updateSlidePositions();
      updateParallax();
      state.animationId = requestAnimationFrame(animate);
    }

    function slideInView() {
      const container = document.querySelector(".slide_in-view__container .slide_in-view__row");
      if (!container || !sliderRef.current) {
        console.warn("Slide-in view elements not found");
        return;
      }

      let initSlides = false;

      ScrollTrigger.create({
        trigger: container,
        start: "10% 83%",
        end: "10% top",
        onEnter: () => {
          if (initSlides) return;
          initSlides = true;

          // Initialize slides and start animation
          initializeSlides();
          gsap.set(".slide_in-view__images .slide_in-view__image", {
            opacity: 0,
            x: "300%",
          });

          gsap.to(".slide_in-view__images .slide_in-view__image", {
            opacity: 1,
            x: "0%",
            duration: 1.6,
            stagger: 0.1,
            ease: "power4.out",
          });

          // Start the continuous animation
          animate();
        },
        onLeaveBack: () => {
          // Stop animation when scrolling out
          if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
          }
        },
      });

      ScrollTrigger.refresh();
    }

    slideInView();
    window.addEventListener("resize", initializeSlides);

    return () => {
      window.removeEventListener("resize", initializeSlides);
      if (state.animationId) {
        cancelAnimationFrame(state.animationId);
      }
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger === document.querySelector(".slide_in-view__container .slide_in-view__row")) {
          trigger.kill();
        }
      });
    };
  }, []);

  return (
    <section className="wrokSpace_section" ref={sectionRef}>
      <div className="wrokSpace_section-inner site_flex flex_column site_gap">
        <div className="wrokSpace_section-top">
          <div className="site_container">
            <span className="section_name">WORKSPACE</span>
            <h2>Inside the Studio</h2>
            <p className="h2 light">
              No sterile cubicles. No corporate vibes. Just a cozy, cluttered,
              creative space where Arizona where ideas come to life.
            </p>
          </div>
        </div>
        <div className="wrokSpace_section-bottom slide_in-view__container">
          <div className="scroll_slider slide_in-view__row">
            <div
              className="slider_items slide_in-view__images work-space_items site_flex site_gap"
              ref={sliderRef}
            ></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WorkSpace;