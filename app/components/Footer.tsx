import React from "react";
import { Instagram, Phone, Facebook } from "lucide-react";
import Logo from "./logo";

export default function Footer() {
  return (
    <footer className="bg-[#151515] text-white pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex flex-col items-center w-fit gap-5">
              <Logo color="white" size={62} />
              <span className="uppercase tracking-[0.2em] mt-0.5 font-medium text-sm">
                CLOTHING STORE
              </span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Crafting modern essentials with a focus on quality,
              sustainability, and timeless design.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/ia.storee?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" className="hover:text-white/60 transition-colors">
                <Instagram size={18} />
              </a>
              <a href="https://www.facebook.com/profile.php?id=100037757805801" className="hover:text-white/60 transition-colors">
                <Facebook size={18} />
              </a>
              <a href="https://wa.me/213540601048?" className="hover:text-white/60 transition-colors">
                <Phone size={18} />
              </a>
            </div>
          </div>
          {/* Links */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.2em] font-bold mb-8">
              Shop
            </h4>
            <ul className="space-y-4 text-sm text-white/40">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  All Collections
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  New Arrivals
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Suits & Tailoring
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Accessories
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.2em] font-bold mb-8">
              Support
            </h4>
            <ul className="space-y-4 text-sm text-white/40">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Shipping & Returns
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Size Guide
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.2em] font-bold mb-8">
              Newsletter
            </h4>
            <p className="text-white/40 text-sm mb-6">
              Subscribe to receive updates and exclusive offers.
            </p>
            <form className="relative">
              <input
                type="email"
                placeholder="Email address"
                className="w-full bg-transparent border-b border-white/20 py-2 text-sm focus:outline-none focus:border-white transition-colors"
              />
              <button
                type="submit"
                className="absolute right-0 bottom-2 text-[10px] uppercase font-bold tracking-widest"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-[10px] text-white/20 uppercase tracking-widest">
            © 2026 IA Store. All rights reserved.
          </p>
          <div className="flex space-x-8 text-[10px] text-white/20 uppercase tracking-widest">
            <span>Paris</span>
            <span>London</span>
            <span>New York</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
