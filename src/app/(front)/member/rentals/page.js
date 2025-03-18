"use client";

import React from "react";
import Sidebar from "../components/sidebar";
import RentalDetails from "../components/rental-details";
import "../styles/member.scss";

export default function RentalsPage() {
  return (
    <div className="member-content container">
      <Sidebar />
      <div className="main-content">
        <RentalDetails />
      </div>
    </div>
  );
}
