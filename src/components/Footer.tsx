import "../styles/shared/footer.css";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-top">
          <div className="footer-left">
            <h3>GMA Connect</h3>
            <p>Connecting partners and admins through a unified platform.</p>
          </div>

          <div className="footer-links">
            <h3>Quick Links</h3>
            <a href="/login?role=partner">Partner Login</a>
            <a href="/login?role=admin">Admin Login</a>
            <a href="/register?role=partner">Become a Partner</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} GMA. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
