import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useImageDistortion } from "../../utils/Shaders";
import "./contact.css";
import contactData from "../../data/contactData.json";

gsap.registerPlugin(ScrollTrigger);

function Contact() {
  return (
    <section className="contact_section reveal-section">
      <div className="site_container">
        <div className="contact_section-inner site_flex flex_column site_gap">
          <div className="contact_section-top">
            <div className="site_container">
              <span className="section_name reveal-text">CONTACT</span>
              <h2 className="reveal-text">Work With Us</h2>
            </div>
          </div>
          <div className="contact_section-bottom slide_in-view__container">
            <div className="contact_cards-container">
              <div className="contact_cards site_flex site_gap">
                {contactData.map((contact) => {
                  const [imageContainerRef, imageElementRef] =
                    useImageDistortion(contact.cardImage);

                  return (
                    <div className="contact_card" key={contact.id}>
                      <div className="contact_card-inner">
                        <div
                          className="contact_card-top"
                          ref={imageContainerRef}
                          style={{
                            width: "100%",
                            height: "clamp(250px, 20vw, 380px)",
                            overflow: "hidden",
                            position: "relative",
                            cursor: "pointer",
                          }}
                        >
                          <img
                            src={contact.cardImage}
                            alt={contact.cardImage}
                            decoding="async"
                            className="contact_image"
                            ref={imageElementRef}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              opacity: 0,
                              position: "absolute",
                              top: 0,
                              left: 0,
                            }}
                          />
                        </div>
                        <div className="contact_card-bottom">
                          <div className="contact_card-bottom--inner site_flex flex_column">
                            <p className="card-text--brand">
                              {contact.cardLable}
                            </p>
                            <h4 className="card-text--title">
                              {contact.cardTitle}
                            </h4>
                            <div
                              className="card_link"
                              dangerouslySetInnerHTML={{
                                __html: contact.cardLinkText,
                              }}
                            ></div>
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
