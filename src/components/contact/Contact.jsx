import { useEffect, useRef } from "react";
import contactData from "../../data/contactData.json";
import "./contact.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useImageDistortion } from '../../utils/Shaders'; 

gsap.registerPlugin(ScrollTrigger);

function Contact() {
  // You can keep your existing GSAP logic here if it's working for other elements.
  // For the image distortion, the hook handles its own animation.

  return (
    <section className="contact_section">
      <div className="site_container">
        <div className="contact_section-inner site_flex flex_column site_gap">
          <div className="contact_section-top">
            <div className="site_container">
              <span className="section_name">CONTACT</span>
              <h2>Work With Us</h2>
            </div>
          </div>
          <div className="contact_section-bottom slide_in-view__container">
            <div className="contact_cards-container">
              <div className="contact_cards site_flex site_gap">
                {contactData.map((contact) => {
                  // IMPORTANT: Call the hook inside the map for each item
                  // This ensures each card gets its own independent Three.js instance
                  const [imageContainerRef, imageElementRef] = useImageDistortion(contact.cardImage);

                  return (
                    <div className="contact_card" key={contact.id}>
                      <div className="contact_card-inner">
                        <div
                          className="contact_card-top"
                          ref={imageContainerRef} // Attach the container ref here
                          style={{
                            width: '100%', // Crucial for container dimensions
                            height: '380px', // Set an explicit height for the container, adjust as needed
                            overflow: 'hidden', // Hides anything outside the container's bounds
                            position: 'relative', // Necessary for absolute positioning of image and canvas
                            cursor: 'pointer', // Indicates interactivity
                            // Add any other desired styling for the container here
                          }}
                        >
                          <img
                            src={contact.cardImage}
                            alt={contact.cardImage}
                            decoding="async"
                            className="contact_image"
                            ref={imageElementRef} // Attach the image element ref here
                            style={{
                              width: '100%', // Image fills its container
                              height: '100%', // Image fills its container
                              objectFit: 'cover', // Ensures image covers the area without distortion
                              opacity: 0, // CRITICAL: Makes the original image invisible
                                        // Three.js renders to a canvas on top of this.
                              position: 'absolute', // Takes image out of document flow
                              top: 0,
                              left: 0,
                              // Ensure no other CSS overrides these crucial styles
                            }}
                          />
                        </div>
                        <div className="contact_card-bottom">
                          <div className="contact_card-bottom--inner site_flex flex_column">
                            <p className="card-text--brand">{contact.cardLable}</p>
                            <h4 className="card-text--title">{contact.cardTitle}</h4>
                            <div className="card_link" dangerouslySetInnerHTML={{ __html: contact.cardLinkText }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;