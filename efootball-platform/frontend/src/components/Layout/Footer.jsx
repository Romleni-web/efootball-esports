import React from 'react';
import { Trophy } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Trophy className="text-blue-500" />
            <span className="text-white font-bold">eFootball Pro</span>
          </div>
          
          <div className="text-gray-400 text-sm">
            © 2024 eFootball Pro. All rights reserved.
          </div>

          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm">Terms</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}