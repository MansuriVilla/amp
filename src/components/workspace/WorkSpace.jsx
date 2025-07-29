import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import WorkSpaceData from "../../data/WorkSpaceData.json";
import "./workspace.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function WorkSpace() {
  const sectionRef = useRef(null);
  const sliderRef = useRef(null);
  const mainScrollTrigger = useRef(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isLightboxMounted, setIsLightboxMounted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const lightboxRef = useRef(null);
  const lightboxContentRef = useRef(null);
  const lightboxThumbnailsRef = useRef(null);

  const [customCursorVisible, setCustomCursorVisible] = useState(false);
  const [customCursorPosition, setCustomCursorPosition] = useState({
    x: 0,
    y: 0,
  });
  const [customCursorType, setCustomCursorType] = useState("default");
  const customCursorRef = useRef(null);

  const lightboxImagesRefs = useRef([]);
  const lightboxThumbnailElementsRefs = useRef([]);

  const addLightboxImageRef = useCallback((el) => {
    if (el && !lightboxImagesRefs.current.includes(el)) {
      lightboxImagesRefs.current.push(el);
      lightboxImagesRefs.current.sort(
        (a, b) => parseInt(a.dataset.index) - parseInt(b.dataset.index)
      );
    }
  }, []);

  const addLightboxThumbnailRef = useCallback((el) => {
    if (el && !lightboxThumbnailElementsRefs.current.includes(el)) {
      lightboxThumbnailElementsRefs.current.push(el);
      lightboxThumbnailElementsRefs.current.sort(
        (a, b) => parseInt(a.dataset.index) - parseInt(b.dataset.index)
      );
    }
  }, []);

  useEffect(() => {
    const slideItems = document.querySelectorAll(".work-space--slide-item");
    const ctaTriggers = [];

    slideItems.forEach((slideItem) => {
      const cta = slideItem.querySelector(".wrokSpace_cta");

      if (cta) {
        gsap.set(cta, { y: 20, opacity: 0 });

        const ctaTrigger = ScrollTrigger.create({
          trigger: slideItem,
          start: "left center",
          end: "left 20%",
          toggleActions: "play none none reverse",
          animation: gsap.to(cta, {
            y: 0,
            opacity: 1,
            ease: "power1.out",
          }),
        });
        ctaTriggers.push(ctaTrigger);
      }
    });

    return () => {
      ctaTriggers.forEach((trigger) => trigger.kill());
    };
  }, []);

  useEffect(() => {
    const config = {
      SCROLL_SPEED: 1.5,
      LERP_FACTOR: 0.05,
    };
    const totalSlideCount = WorkSpaceData.length;
    const state = {
      currentX: 0,
      targetX: 0,
      slideWidth: 0,
      slides: [],
      isMobile: false,
      animationId: null,
    };

    const checkMobile = () => {
      state.isMobile = window.innerWidth < 1000;

      state.slideWidth = state.isMobile ? 175 + 2 * 10 : 350 + 2 * 20;
    };

    const initializeSlides = () => {
      const track = sliderRef.current;
      if (!track) return;

      track.innerHTML = "";
      state.slides = [];
      checkMobile();

      const copiesMultiplier = 5;
      const totalSlidesInTrack = totalSlideCount * copiesMultiplier;

      for (let i = 0; i < totalSlidesInTrack; i++) {
        const dataIndex = i % totalSlideCount;
        const slide = document.createElement("div");
        slide.className = "work-space--slide-item slide_in-view__image";
        slide.dataset.index = dataIndex;
        slide.innerHTML = `
          <div class="item_bg">
            <img src="${WorkSpaceData[dataIndex].image_bg}" alt="${
          WorkSpaceData[dataIndex].name
        }" decoding="async" loading="lazy" />
          </div>
          ${
            WorkSpaceData[dataIndex].cta_text
              ? `<div class="wrokSpace_cta">${WorkSpaceData[dataIndex].cta_text}</div>`
              : ""
          }
        `;

        slide.addEventListener("click", () => {
          openLightbox(dataIndex);
        });

        track.appendChild(slide);
        state.slides.push(slide);
      }

      const initialOffset =
        totalSlideCount * state.slideWidth * Math.floor(copiesMultiplier / 2);
      state.currentX = -initialOffset;
      state.targetX = -initialOffset;
      updateSlidePositions();
    };

    const updateSlidePositions = () => {
      const track = sliderRef.current;
      if (!track) return;

      const sequenceWidth = totalSlideCount * state.slideWidth;

      if (
        state.currentX <
        -sequenceWidth * (Math.floor(WorkSpaceData.length / 2) + 1)
      ) {
        state.currentX += sequenceWidth;
        state.targetX += sequenceWidth;
      } else if (
        state.currentX >
        -sequenceWidth * Math.floor(WorkSpaceData.length / 2)
      ) {
        state.currentX -= sequenceWidth;
        state.targetX -= sequenceWidth;
      }

      track.style.transform = `translate3d(${state.currentX}px, 0, 0)`;
    };

    const updateParallax = () => {
      const viewportCenter = window.innerWidth / 2;
      state.slides.forEach((slide) => {
        const img = slide.querySelector(".item_bg img");
        if (!img) return;

        const slideRect = slide.getBoundingClientRect();

        if (slideRect.right < 0 || slideRect.left > window.innerWidth) {
          img.style.transform = "scale(1.8) translateX(0px)";
          return;
        }

        const slideCenter = slideRect.left + slideRect.width / 2;
        const distanceFromCenter = slideCenter - viewportCenter;
        const parallaxOffset = distanceFromCenter * -0.25;

        img.style.transform = `translateX(${parallaxOffset}px) scale(1.8)`;
      });
    };

    const animate = () => {
      state.currentX += (state.targetX - state.currentX) * config.LERP_FACTOR;
      state.targetX -= config.SCROLL_SPEED;
      updateSlidePositions();
      updateParallax();
      state.animationId = requestAnimationFrame(animate);
    };

    const setupScrollTrigger = () => {
      const container = document.querySelector(
        ".slide_in-view__container .slide_in-view__row"
      );
      if (!container || !sliderRef.current) {
        console.warn("Slide-in view elements not found");
        return;
      }

      mainScrollTrigger.current = ScrollTrigger.create({
        trigger: container,
        start: "top 80%",
        onEnter: () => {
          initializeSlides();
          animate();

          gsap.fromTo(
            ".slide_in-view__images .work-space--slide-item",
            {
              opacity: 0,
              x: "100%",
            },
            {
              opacity: 1,
              x: "0%",
              duration: 1.6,
              stagger: 0.1,
              ease: "power4.out",
              onComplete: () => {
                gsap.set(".slide_in-view__images .work-space--slide-item", {
                  pointerEvents: "auto",
                });
              },
            }
          );
        },
        onLeaveBack: () => {
          if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
          }

          gsap.set(".slide_in-view__images .work-space--slide-item", {
            pointerEvents: "none",
          });
        },
      });
      ScrollTrigger.refresh();
    };

    setupScrollTrigger();
    window.addEventListener("resize", () => {
      ScrollTrigger.refresh();
      initializeSlides();
    });

    return () => {
      window.removeEventListener("resize", () => {
        ScrollTrigger.refresh();
        initializeSlides();
      });
      if (state.animationId) {
        cancelAnimationFrame(state.animationId);
      }
      if (mainScrollTrigger.current) {
        mainScrollTrigger.current.kill();
        mainScrollTrigger.current = null;
      }
      ScrollTrigger.getAll().forEach((trigger) => {
        if (
          trigger.trigger &&
          trigger.trigger.classList &&
          trigger.trigger.classList.contains("slide_in-view__row")
        ) {
          trigger.kill();
        }
      });
    };
  }, []);

  const updateThumbnailsHighlight = useCallback((index) => {
    if (lightboxThumbnailElementsRefs.current.length > 0) {
      lightboxThumbnailElementsRefs.current.forEach((thumb, i) => {
        if (i === index) {
          thumb.classList.add("active");
          thumb.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        } else {
          thumb.classList.remove("active");
        }
      });
    }
  }, []);

  useEffect(() => {
    if (lightboxOpen) {
      setIsLightboxMounted(true);
      document.body.style.overflow = "hidden";
      document.body.classList.add("hide-cursor");

      lightboxImagesRefs.current.forEach((imgEl, idx) => {
        gsap.set(imgEl, {
          autoAlpha: 0,
          zIndex: 1,
          x: "0%",
          scale: 1,
        });
      });

      if (lightboxImagesRefs.current[currentImageIndex]) {
        const img = new Image();
        img.src = WorkSpaceData[currentImageIndex].image_bg;
        img.onload = () => {
          setIsImageLoading(false);
          gsap.fromTo(
            lightboxImagesRefs.current[currentImageIndex],
            { scale: 0.8, autoAlpha: 0, zIndex: 10 },
            {
              scale: 1,
              autoAlpha: 1,
              duration: 0.5,
              ease: "back.out(1.7)",
              delay: 0.1,
            }
          );
        };
        img.onerror = () => {
          console.error("Failed to load image:", img.src);
          setIsImageLoading(false);
        };
      }

      gsap.fromTo(
        lightboxThumbnailElementsRefs.current,
        { y: 20, autoAlpha: 0, scale: 0.8 },
        {
          y: 0,
          autoAlpha: 1,
          scale: 1,
          duration: 0.3,
          stagger: 0.05,
          ease: "power2.out",
          delay: 0.2,
        }
      );

      gsap.to(lightboxRef.current, {
        autoAlpha: 1,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          updateThumbnailsHighlight(currentImageIndex);
        },
      });
    } else if (isLightboxMounted) {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsLightboxMounted(false);
          document.body.style.overflow = "auto";
          document.body.classList.remove("hide-cursor");
          setCustomCursorVisible(false);

          lightboxImagesRefs.current.forEach((imgEl) => {
            gsap.set(imgEl, { autoAlpha: 0, x: "0%", zIndex: 1, scale: 1 });
          });
        },
      });

      if (lightboxThumbnailElementsRefs.current.length > 0) {
        tl.to(
          lightboxThumbnailElementsRefs.current,
          {
            y: 20,
            autoAlpha: 0,
            scale: 0.8,
            duration: 0.3,
            stagger: 0.03,
            ease: "power2.in",
          },
          0
        );
      }

      if (lightboxImagesRefs.current[currentImageIndex]) {
        tl.to(
          lightboxImagesRefs.current[currentImageIndex],
          { scale: 0.8, autoAlpha: 0, duration: 0.3, ease: "power2.in" },
          "<0.1"
        );
      }

      if (lightboxRef.current) {
        tl.to(
          lightboxRef.current,
          { autoAlpha: 0, duration: 0.4, ease: "power2.in" },
          "<0.1"
        );
      }
    }
  }, [lightboxOpen, isLightboxMounted]);

  const openLightbox = useCallback((index) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
    setIsImageLoading(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const directionFromCurrent = useCallback(
    (currentIndex, targetIndex, totalCount) => {
      const diff = targetIndex - currentIndex;
      const absDiff = Math.abs(diff);

      if (absDiff > totalCount / 2) {
        if (diff > 0) {
          return "-100%";
        } else {
          return "100%";
        }
      } else {
        if (diff > 0) {
          return "100%";
        } else {
          return "-100%";
        }
      }
    },
    []
  );

  const navigationInProgress = useRef(false);

  const navigateLightbox = useCallback(
    (direction, specificIndex = null) => {
      if (navigationInProgress.current) return;

      const totalCount = WorkSpaceData.length;
      let newIndex = currentImageIndex;

      if (specificIndex !== null) {
        if (specificIndex === currentImageIndex) return;
        newIndex = specificIndex;
      } else if (direction === "next") {
        newIndex = (currentImageIndex + 1) % totalCount;
      } else if (direction === "prev") {
        newIndex = (currentImageIndex - 1 + totalCount) % totalCount;
      }

      if (newIndex === currentImageIndex && specificIndex === null) {
        return;
      }

      navigationInProgress.current = true;
      setIsImageLoading(true);

      const oldImageEl = lightboxImagesRefs.current[currentImageIndex];
      const newImageEl = lightboxImagesRefs.current[newIndex];

      if (oldImageEl && newImageEl) {
        const startXNew = directionFromCurrent(
          currentImageIndex,
          newIndex,
          totalCount
        );
        const endXOld = startXNew === "100%" ? "-100%" : "100%";

        const img = new Image();
        img.src = WorkSpaceData[newIndex].image_bg;
        img.onload = () => {
          setIsImageLoading(false);

          gsap.set(newImageEl, { x: startXNew, autoAlpha: 1, zIndex: 10 });
          gsap.set(oldImageEl, { autoAlpha: 1, zIndex: 5 });

          gsap
            .timeline({
              onComplete: () => {
                gsap.set(oldImageEl, { autoAlpha: 0, x: "0%", zIndex: 1 });
                gsap.set(newImageEl, { autoAlpha: 1, x: "0%", zIndex: 10 });
                setCurrentImageIndex(newIndex);
                updateThumbnailsHighlight(newIndex);
                navigationInProgress.current = false;
              },
            })
            .to(
              oldImageEl,
              { x: endXOld, duration: 0.6, ease: "power2.inOut" },
              0
            )
            .to(
              newImageEl,
              { x: "0%", duration: 0.6, ease: "power2.inOut" },
              0
            );
        };
        img.onerror = () => {
          console.error("Failed to load image:", img.src);
          setIsImageLoading(false);
          navigationInProgress.current = false;
        };
      } else {
        setCurrentImageIndex(newIndex);
        updateThumbnailsHighlight(newIndex);
        setIsImageLoading(false);
        navigationInProgress.current = false;
      }
    },
    [currentImageIndex, directionFromCurrent, updateThumbnailsHighlight]
  );

  useLayoutEffect(() => {
    if (lightboxOpen) {
      updateThumbnailsHighlight(currentImageIndex);
    }
  }, [lightboxOpen, currentImageIndex, updateThumbnailsHighlight]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isLightboxMounted) return;

      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowRight") {
        navigateLightbox("next");
      } else if (event.key === "ArrowLeft") {
        navigateLightbox("prev");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxMounted, closeLightbox, navigateLightbox]);

  const handleMouseMove = useCallback(
    (e) => {
      if (
        !isLightboxMounted ||
        !lightboxRef.current ||
        !customCursorRef.current
      ) {
        setCustomCursorVisible(false);
        return;
      }

      const lightboxRect = lightboxRef.current.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const isWithinLightboxBounds =
        mouseX >= lightboxRect.left &&
        mouseX <= lightboxRect.right &&
        mouseY >= lightboxRect.top &&
        mouseY <= lightboxRect.bottom;

      if (!isWithinLightboxBounds) {
        setCustomCursorVisible(false);
        return;
      }

      setCustomCursorPosition({ x: mouseX, y: mouseY });
      setCustomCursorVisible(true);

      const contentRect = lightboxContentRef.current.getBoundingClientRect();
      const contentThreshold = contentRect.width * 0.2;
      const relativeMouseX = mouseX - contentRect.left;

      if (relativeMouseX < contentThreshold) {
        setCustomCursorType("left");
      } else if (relativeMouseX > contentRect.width - contentThreshold) {
        setCustomCursorType("right");
      } else {
        setCustomCursorType("default");
      }
    },
    [isLightboxMounted]
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (!isLightboxMounted || !lightboxRef.current || isImageLoading) return;

      const contentRect = lightboxContentRef.current.getBoundingClientRect();
      const mouseX = e.clientX;
      const relativeMouseX = mouseX - contentRect.left;

      const threshold = contentRect.width * 0.2;

      if (relativeMouseX < threshold) {
        navigateLightbox("prev");
      } else if (relativeMouseX > contentRect.width - threshold) {
        navigateLightbox("next");
      }
    },
    [isLightboxMounted, isImageLoading, navigateLightbox]
  );

  const handleMouseLeave = useCallback(() => {
    setCustomCursorVisible(false);
  }, []);

  useEffect(() => {
    if (isLightboxMounted) {
      window.addEventListener("mousemove", handleMouseMove);
      if (lightboxRef.current) {
        lightboxRef.current.addEventListener("mousedown", handleMouseDown);
        lightboxRef.current.addEventListener("mouseleave", handleMouseLeave);
      }
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      if (lightboxRef.current) {
        lightboxRef.current.removeEventListener("mousedown", handleMouseDown);
        lightboxRef.current.removeEventListener("mouseleave", handleMouseLeave);
      }
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (lightboxRef.current) {
        lightboxRef.current.removeEventListener("mousedown", handleMouseDown);
        lightboxRef.current.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [isLightboxMounted, handleMouseMove, handleMouseDown, handleMouseLeave]);

  useEffect(() => {
    if (customCursorRef.current) {
      if (customCursorVisible) {
        gsap.to(customCursorRef.current, { autoAlpha: 1, duration: 0.3 });
      } else {
        gsap.to(customCursorRef.current, { autoAlpha: 0, duration: 0.3 });
      }
    }
  }, [customCursorVisible]);

  return (
    <>
      <section className="wrokSpace_section" ref={sectionRef}>
        <div className="wrokSpace_section-inner site_flex flex_column site_gap">
          <div className="wrokSpace_section-top">
            <div className="site_container reveal-section">
              <span className="section_name reveal-text">WORKSPACE</span>
              <h2 className="reveal-text">Inside the Studio</h2>
              <p className="h2 light reveal-text">
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

      {isLightboxMounted && (
        <div
          className="lightbox-overlay"
          ref={lightboxRef}
          onClick={closeLightbox}
          style={{ opacity: 0, visibility: "hidden" }}
        >
          <div
            className="lightbox-content"
            ref={lightboxContentRef}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="lightbox-close" onClick={closeLightbox}>
              &times;
            </button>

            {isImageLoading && (
              <div className="lightbox-loader">
                <div className="spinner"></div>
              </div>
            )}

            {WorkSpaceData.map((data, index) => (
              <img
                key={index}
                ref={addLightboxImageRef}
                data-index={index}
                src={data.image_bg}
                alt={`Gallery Image ${index + 1}`}
                className="lightbox-image"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  transform: "translateX(0%)",
                  visibility: "hidden",
                  opacity: 0,
                  zIndex: 1,
                }}
              />
            ))}

            <div className="lightbox-thumbnails" ref={lightboxThumbnailsRef}>
              {WorkSpaceData.map((data, index) => (
                <div
                  key={index}
                  ref={addLightboxThumbnailRef}
                  data-index={index}
                  className={`lightbox-thumbnail ${
                    index === currentImageIndex ? "active" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateLightbox(null, index);
                  }}
                >
                  <img src={data.image_bg} alt={`Thumbnail ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {isLightboxMounted && (
        <div
          ref={customCursorRef}
          className={`custom-cursor ${customCursorType} ${
            customCursorVisible ? "active" : ""
          }`}
          style={{ left: customCursorPosition.x, top: customCursorPosition.y }}
        >
          {customCursorType === "left" && <span>&#10094;</span>}
          {customCursorType === "right" && <span>&#10095;</span>}
        </div>
      )}
    </>
  );
}

export default WorkSpace;
