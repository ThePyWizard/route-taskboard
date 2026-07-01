// The locked TravelAnimator export settings every employee must follow so the
// raw exports are consistent for the Remotion pipeline. Keep in sync with the
// mapsoftheworldroutes brand defaults.
const SPEC = [
  ["Map style", "Terrain"],
  ["Projection", "Mercator"],
  ["Quality", "HD"],
  ["Route line", "Red, AUTO width"],
  ["Label", "Chat-style label on"],
  ["Orientation", "Vertical 9:16"],
];

export function ExportSpec() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
      <h3 className="font-semibold">TravelAnimator export settings</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Use exactly these settings so the footage matches the brand template.
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {SPEC.map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-[var(--border)] pb-2">
            <dt className="text-[var(--muted)]">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-[var(--muted)]">
        Plot the route using the Google Maps link, set the vehicle model for the
        trip type, then export the animation and upload the resulting .mp4 below.
      </p>
    </div>
  );
}
