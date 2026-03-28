import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Gallery from "./pages/Gallery";
import About from "./pages/About";
import News from "./pages/News";
import Contact from "./pages/Contact";
import Staff from "./pages/Staff";
import EvaluateePortal from "./pages/EvaluateePortal";
import Administrators from "./pages/Administrators";
import Students from "./pages/Students";
import Curriculum from "./pages/Curriculum";
import AcademicCalendar from "./pages/AcademicCalendar";
import Enrollment from "./pages/Enrollment";
import Events from "./pages/Events";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/news" element={<News />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/administrators" element={<Administrators />} />
          <Route path="/students" element={<Students />} />
          <Route path="/curriculum" element={<Curriculum />} />
          <Route path="/calendar" element={<AcademicCalendar />} />
          <Route path="/enrollment" element={<Enrollment />} />
          <Route path="/events" element={<Events />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/portal/evaluatee" element={<EvaluateePortal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

