import '../style/App.css';

const Footer = ({ children }) => {
  return (
    <div>
      <main>
        {children}
      </main>
      <footer className="auth-footer">
        <p>&copy; {new Date().getFullYear()} StudySync. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Footer;