"use client";

import React from 'react';
import { Heart } from 'lucide-react';

export default function DonationButton() {
  return (
    <a 
      // --- PASTE YOUR RAZORPAY LINK HERE ---
      href="https://rzp.io/rzp/Kamarjahan" 
      // ------------------------------------
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-full font-bold shadow-lg transition-all hover:scale-105"
    >
      <Heart fill="white" size={20} />
      Buy Me a Biriyani
    </a>
  );
}