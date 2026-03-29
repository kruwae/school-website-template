import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import schoolLogo from '@/assets/school-logo.svg';

const navLinks = [
  { name: 'หน้าแรก', href: '/' },
  { name: 'เกี่ยวกับเรา', href: '/about' },
  { name: 'ผู้บริหาร', href: '/administrators' },
  { name: 'บุคลากร', href: '/staff' },
  { name: 'นักเรียน', href: '/students' },
  { name: 'หลักสูตร', href: '/curriculum' },
  { name: 'แกลเลอรี่', href: '/gallery' },
  { name: 'ปฏิทิน', href: '/calendar' },
  { name: 'ข่าวสาร', href: '/news' },
  { name: 'ติดต่อ', href: '/contact' },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const { settings } = useSchoolSettings();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || !isHomePage
        ? 'bg-card/95 backdrop-blur-md shadow-lg'
        : 'bg-transparent'
        }`}
    >
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/95 shadow-md ring-2 ring-primary/20 flex items-center justify-center overflow-hidden">
              <img src={schoolLogo} alt="โลโก้โรงเรียน" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className={`text-lg font-bold transition-colors ${scrolled || !isHomePage ? 'text-primary' : 'text-card'}`}>
                {settings.school_name}
              </h1>
              <p className={`text-xs transition-colors ${scrolled || !isHomePage ? 'text-muted-foreground' : 'text-card/80'}`}>
                {settings.school_tagline}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-accent/20 ${location.pathname === link.href
                  ? 'bg-primary text-primary-foreground shadow-md font-bold'
                  : scrolled || !isHomePage
                    ? 'text-foreground hover:text-primary'
                    : 'text-card hover:text-accent'
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <Link to="/enrollment">
              <Button className="bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-all">
                สมัครเรียน
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${scrolled || !isHomePage ? 'text-foreground' : 'text-card'
              }`}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Navigation */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] pb-4' : 'max-h-0'
            }`}
        >
          <div className="bg-card rounded-xl shadow-lg p-4 mt-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg font-medium transition-colors ${location.pathname === link.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-secondary'
                  }`}
              >
                {link.name}
              </Link>
            ))}
            <Link to="/enrollment" onClick={() => setIsOpen(false)}>
              <Button className="w-full mt-4 bg-accent text-accent-foreground font-semibold hover:bg-accent/90">
                สมัครเรียน
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
