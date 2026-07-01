export function MapsButton({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex items-center gap-2.5 rounded-xl bg-[var(--maps)] px-5 py-2.5 font-semibold text-white shadow-[var(--shadow-md)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--maps-ink)] hover:shadow-[var(--shadow-lg)]"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        className="transition-transform duration-200 group-hover:scale-110"
        aria-hidden="true"
      >
        <path
          d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"
          fill="#fff"
          fillOpacity="0.18"
          stroke="#fff"
          strokeWidth="1.6"
        />
        <circle cx="12" cy="10" r="2.6" fill="#fff" />
      </svg>
      Open in Google Maps
      <span className="text-white/70 transition-transform duration-200 group-hover:translate-x-0.5">
        ↗
      </span>
    </a>
  );
}
