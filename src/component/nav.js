// src/components/Navbar.js
import React from "react";
import { NavLink } from "react-router-dom";
import "./nav.css";

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg app-navbar navbar-dark">
      <div className="container-xl px-2 px-sm-3">
        <NavLink className="navbar-brand app-brand fw-bold" to="/">
          <span className="brand-emoji">🎓</span>
          <span className="brand-text">Sistem Absensi</span>
        </NavLink>

        <button
          className="navbar-toggler app-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-1">
            <li className="nav-item">
              <NavLink
                to="/Tambah-Member"
                className={({ isActive }) =>
                  "nav-link app-nav-link " + (isActive ? "active" : "")
                }
              >
                Daftar Member
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  "nav-link app-nav-link " + (isActive ? "active" :  "")
                }
              >
                Absensi Hari Ini
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/log-absen"
                className={({ isActive }) =>
                  "nav-link app-nav-link " + (isActive ? "active" : "")
                }
              >
                Log Absensi
              </NavLink>
            </li>
            {/* ✅ Menu Scan QR - Untuk user melakukan absensi */}
            <li className="nav-item">
              <NavLink
                to="/scan"
                className={({ isActive }) =>
                  "nav-link app-nav-link " + (isActive ? "active" : "")
                }
              >
                <span className="me-1">📷</span>
                Scan QR
              </NavLink>
            </li>
            {/* ✅ Menu Admin QR - Untuk admin generate QR */}
            {/* <li className="nav-item">
              <NavLink
                to="/barcode"
                className={({ isActive }) =>
                  "nav-link app-nav-link " + (isActive ? "active" : "")
                }
              >
                <span className="me-1">⚙️</span>
                Admin QR
              </NavLink>
            </li> */}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;