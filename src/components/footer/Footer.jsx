import ampLogo from "/amp-footer-logo.svg";
import linkIcon from "/anchor-ico.svg";
import "./footer.css";

function Footer() {
  return (
    <>
      <footer id="site_footer">
        <div className="site_container">
          <div className="site_flex">
            <div className="footer_left">
              <div className="footer_left-inner site_flex flex_column ">
                <img src={ampLogo} alt="Amp Media Logo" />
                <div className="footer_email">
                  <p>Talk to us</p>
                  <a href="mailto:info@theampmedia.com" >
               
                    <span class="anchor_hover"> info@theampmedia.com </span>
                    <span>
                      <img src={linkIcon} alt="Link Icon" />
                    </span>
                  </a>
                </div>
                <p>© 2025 AMPV Media Pvt. Ltd. All rights earned, not given.</p>
              </div>
            </div>
            <div className="footer_right">
                
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
export default Footer;
