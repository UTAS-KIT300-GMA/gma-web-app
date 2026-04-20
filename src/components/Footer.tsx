import "../styles/shared/footer.css";

/**
 * Footer component for the landing page, potentially used across the entire application. 
 * Provides company information and quick links for users.
 * @returns 
 */
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-top">
          <div className="footer-text">
            <h3>GMA Connect</h3>
            <p>Connecting partners and admins through a unified platform.</p>
          </div>

          <div className="footer-text">
            <h3>Contact Us</h3>
            <p>Email: contact@guessmyaccent.com.au</p>
          </div>

          <div className="footer-links">
            <h3>Follow Us</h3>
            <a
              href="https://www.facebook.com/profile.php?id=61576709905072"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </a>
            <a
              href="https://www.instagram.com/guessmyaccent/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
            <a
              href="https://www.linkedin.com/company/guess-my-accent"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            <a
              href="https://www.youtube.com/@gmaaus"
              target="_blank"
              rel="noopener noreferrer"
            >
              YouTube
            </a>
            <a
              href="https://linktr.ee/guessmyaccent"
              target="_blank"
              rel="noopener noreferrer"
            >
              Linktree
            </a>
            <a
              href="https://strava.app.link/IHF7snxafUb"
              target="_blank"
              rel="noopener noreferrer"
            >
              Strava
            </a>
          </div>

          <div className="footer-links">
            <h3>Quick Links</h3>
            <a href="/login?view=partner">Partner Login</a>
            <a href="/login?view=admin">Admin Login</a>
            <a href="/register?view=partner">Become a Partner</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © 2019 - 2025 Guess My Accent | Based in Hobart, Tasmania |
            Celebrating Multicultural Voices | ABN 31 686 890 559 | All rights
            reserved
          </span>
        </div>
      </div>
    </footer>
  );
}
