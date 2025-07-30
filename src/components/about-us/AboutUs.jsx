import { useEffect } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./AboutUs.css";

function TextAnimtion() {

    const revealText = document.querySelectorAll(".reveal-text");

    if (revealText.length === 0) {
      console.warn("No elements with class 'reveal-text' found.");
      return;
    }

    gsap.registerPlugin(ScrollTrigger, SplitText);

    // Wait for fonts to load
    document.fonts.ready.then(() => {
      revealText.forEach((reveal) => {
        // Create SplitText instance for the current reveal element
        const split = new SplitText(reveal, { type: "words" });
        const words = split.words; // Array of word elements
        const revealSection = reveal.closest(".about-reveal-section");

        if (words.length === 0) {
          console.warn("No words found in SplitText for element:", reveal);
          return;
        }

        gsap.fromTo(
          words,
          { opacity: 0, scale: 0.5 },
          {
            opacity: 1,
            scale: 1,
            ease: "power2.out",
            stagger: 0.05,
            scrollTrigger: {
              trigger: revealSection,
              start: "top 50%",
              // end: "+=" + revealSection.offsetHeight * 3.5,
              end: "bottom 50%",
              markers:true,
              toggleActions: "play reverse play reverse",
            },
          }
        );
      });
    });

}

function AboutUs() {

  useEffect(() => {
TextAnimtion();
  }, []);
  return (
    <section className="about_us_section about-reveal-section">
      <div className="site_container">
        <p className="tagline reveal-text ">ABOUT </p>
        <div className="about_us_main_content">
          <div className="about_us_content-top">
            <h1 className="reveal-text">Not here to win awards.</h1>
            <h2 className="light reveal-text">
              We’re here to build real stuff that works, looks great, and makes
              sense.
            </h2>
          </div>
          <div className="about_us_content_bottom reveal-text">
            <h2>
              <span className="text_underline ">Design</span>,
              <span className="text_underline">code</span>,
              <span className="text_underline">motion</span>, and
              <span className="text_underline">branding</span>
              <span className="light_text">
                — handled by a crew who actually gives a damn.
              </span>
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}
export default AboutUs;
