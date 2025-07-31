import "./AboutUs.css";

function AboutUs() {
  return (
    <section className="about_us_section reveal-section">
      <div className="site_container">
        <p className="tagline reveal-text ">ABOUT </p>
        <div className="about_us_main_content">
          <div className="about_us_content-top">
            <h1 className="reveal-text">Not here to win awards.</h1>
            <h2 className="light reveal-text">
              We’re here to build real stuff that works, looks great, and makes
              sense.
            </h2>


            <span className="asas"></span>
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
