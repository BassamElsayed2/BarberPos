import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-blue-100 mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center">
          <p className="text-sm text-gray-600 text-center" dir="rtl">
            تصميم وبرمجه Ens
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
