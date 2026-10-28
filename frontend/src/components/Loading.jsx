export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl">
        <div className="w-10 h-10 border-4 border-[#4F7942] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-500">
          Memuat halaman...
        </p>
      </div>
    </div>
  );
}
