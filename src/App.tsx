import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Resources from './pages/Resources';
import Risks from './pages/Risks';
import Reports from './pages/Reports';
import Requirements from './pages/Requirements';
import Designs from './pages/Designs';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="resources" element={<Resources />} />
          <Route path="risks" element={<Risks />} />
          <Route path="reports" element={<Reports />} />
          <Route path="requirements" element={<Requirements />} />
          <Route path="designs" element={<Designs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
