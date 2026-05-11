"use client";

import React from "react";

export default function FieldsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Field Boundaries</h2>
        <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
          <div className="text-5xl mb-6">📍</div>
          <h3 className="text-xl font-black text-gray-900 mb-2">Manage Your Fields</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            View and edit the digital boundaries of all your registered fields in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
