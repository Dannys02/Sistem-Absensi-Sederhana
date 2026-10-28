import { Menu, User } from "lucide-react";

export default function NavbarAdmin({ user, toggleSidebar }) {
  return (
    <header className="fixed z-[888] top-0 inset-x-0 left-0 lg:left-64 h-16 bg-white border-b border-[#4F7942]/20 px-8 flex items-center justify-between shadow-xs">
      <div>
        <h1 className="hidden md:block text-lg font-bold text-[#4F7942]">
          Admin Dashboard
        </h1>

        <button
          className="block md:hidden"
          onClick={(e) => {
            e.stopPropagation();
            toggleSidebar();
          }}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800 leading-tight">
            {user?.name || "Uknown"}
          </p>
          <p className="text-xs text-[#4F7942] font-medium capitalize">
            {user?.role || "Uknown"}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#4F7942]/10 border border-[#4F7942]/30 text-[#4F7942] flex items-center justify-center shrink-0 shadow-xs">
          <User className="w-5 h-5" />
        </div>
      </div>
    </header>
  );
}
