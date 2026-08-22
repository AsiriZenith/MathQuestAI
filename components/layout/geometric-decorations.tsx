export function GeometricDecorations() {
  const dots = Array.from({ length: 42 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-300/18 border-[3px] border-amber-300/25" />
      <div className="absolute top-6 right-20 w-14 h-14 rounded-full bg-amber-400/15" />
      <div className="absolute top-20 -left-32 w-96 h-96 rounded-full border-[2px] border-indigo-300/28" />
      <div
        className="absolute top-28 right-[34%] w-5 h-5 bg-amber-400/30"
        style={{ transform: "rotate(45deg)" }}
      />
      <div className="absolute top-[52%] left-16 w-9 h-9 rounded-full bg-rose-400/22" />
      <div
        className="absolute bottom-24 left-6 w-28 h-28 bg-violet-400/10 border-2 border-violet-300/22 rounded-sm"
        style={{ transform: "rotate(17deg)" }}
      />
      <div className="absolute bottom-52 right-24 w-6 h-6 rounded-full bg-emerald-400/28" />
      <div className="absolute bottom-16 left-[44%] w-4 h-4 rounded-full bg-indigo-400/20" />
      <div
        className="absolute bottom-20 right-8 grid gap-[10px]"
        style={{ gridTemplateColumns: "repeat(7, 6px)", gridTemplateRows: "repeat(6, 6px)" }}
      >
        {dots.map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-300/38" />
        ))}
      </div>
    </div>
  );
}
