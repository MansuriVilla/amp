import ampLogo from "/assets/images/amp-footer-logo.svg";
import linkIcon from "/assets/images/anchor-ico.svg";
import socialHandls from "/assets/images/social-handels.svg";

import "./footer.css";

function Footer() {
  return (
    <footer id="site_footer">
      <div className="site_container">
        <div className="site_flex space_between footer_main">
          <div className="footer_left">
            <div className="footer_left-inner site_flex flex_column">
              <div className="footer_logo">
                <a href="">
                  <img src={ampLogo} alt="AMP Media Logo" decoding="async" />
                </a>
              </div>
              <div className="footer_email">
                <h3>Talk to us</h3>
                <a href="mailto:info@theampmedia.com">
                  <span className="anchor_hover">info@theampmedia.com</span>
                  <span>
                    <img
                      className="icon-default"
                      src={linkIcon}
                      alt="Email Link Icon"
                    />
                    <img
                      className="icon-hover"
                      src={linkIcon}
                      alt="Email Link Icon"
                    />
                  </span>
                </a>
              </div>
              <p className="copyright_text">
                © 2025 AMPV Media Pvt. Ltd. All rights reserved.
              </p>
            </div>
          </div>
          <div className="footer_right">
            <div className="footer_right-inner">
              <div className="socical-media">
                <img src={socialHandls} alt="" />
              </div>
              <div className="footer_right-top">
                <h2>
                  <span className="gray">Not Big on Social.</span> Big on Real.
                </h2>
              </div>
              <div className="footer_right-bottom site_flex flex_column site_gap">
                <p>
                  We’re a little too shy (or just too busy building cool things)
                  to post every day.
                </p>
                <p>
                  But if you’re curious about what we do or how we work — come
                  by, grab a coffee, and chat with the team.
                </p>
                <p>
                  No filters. No fluff. Just honest conversations and good
                  vibes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
