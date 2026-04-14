import { useEffect } from 'react'
import './App.css'
import { Routes, Route, useLocation } from "react-router-dom";
import { useAuthStore } from './store/authStore';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SocketManager from './components/SocketManager';

import Login from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import RequestDetail from './pages/RequestDetail';
import Tutors from './pages/Tutors'
import PostRequest from './pages/PostRequest'
import Appointments from './pages/Appointments'
import Sessions from './pages/Sessions';
import Credits from './pages/Credits'
import VideoCall from './pages/VideoCall';
import PersonalizedSession from './pages/PersonalizedSession'
import Landing from './pages/Landing';

function App() {
  const { checkAuth, user, loading } = useAuthStore(); // ✅ get loading state
  const { pathname } = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const fullscreen = [`/session/${pathname.split("/")[2]}/call`, "/login"];
  const isFullscreen = fullscreen.includes(pathname) || pathname.endsWith("/call");

  // ✅ Don't render routes until we know if user is logged in
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SocketManager />
      <Navbar />
      <div className="flex">
        {user && !isFullscreen && <Sidebar />}
        <main className={`flex-1 min-h-[calc(100vh-53px)] bg-gray-50 ${
          user && !isFullscreen ? "ml-56" : ""
        }`}>
          <Routes>
            <Route path="/" element={user ? <Dashboard /> : <Landing />} />
            <Route path="/login" element={<Login />} />
            {user && (
              <>
                <Route path="/request/:id" element={<RequestDetail />} />
                <Route path="/tutors" element={<Tutors />} />
                <Route path="/post-request" element={<PostRequest />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/credits" element={<Credits />} />
                <Route path="/session/:id/call" element={<VideoCall />} />
                <Route path="/session/:id" element={<PersonalizedSession />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </>
  );
}

export default App;