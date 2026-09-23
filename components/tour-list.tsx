// The back print's tour list as real text: the joke has to read at any screen size, and a photo of a
// 12" print never will. Rows are copied from the artwork verbatim (design file, back table).
// Framed like the print: a double rule, and the shirt's own bottom ornament as the closer.
const TOUR = [
  ['1918', 'German Empire', '“All we fought for has been accomplished”'],
  ['1945', 'Axis Powers', '“Total and complete victory”'],
  ['1953', 'Korea', '“An honorable armistice”'],
  ['1973', 'Vietnam', '“Peace with honor”'],
  ['1991', 'Iraq', '“We’ve kicked the Vietnam syndrome”'],
  ['2003', 'Iraq', '“Mission accomplished”'],
  ['2021', 'Afghanistan', '“An extraordinary success”'],
  ['2026', 'Iran', '“We’ve already won, but not enough”'],
  ['2026', 'Iran', '“In the first hour it was over”'],
  ['2026', 'Iran', '“Oh, I think we won”'],
  ['2026', 'Iran', '“Because this war has been won”'],
  ['2026', 'Iran', '“Total & complete victory. 100%.”'],
] as const;

export function TourList() {
  return (
    <section className="mt-20" aria-labelledby="tour-heading">
      <div className="rounded-sm border-4 border-double border-zinc-300/70 px-5 py-8 sm:px-10 sm:py-10">
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
            Printed on the back
          </p>
          <h2
            id="tour-heading"
            className="mt-3 font-display text-3xl text-zinc-50 sm:text-4xl"
          >
            The Tour
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-400 text-pretty">
            Every date on the run, with what was said at the time.
          </p>
        </div>

        <ol className="mt-8 divide-y divide-zinc-800/70">
          {TOUR.map(([year, opponent, quote], index) => (
            <li
              key={index}
              className="grid grid-cols-[3.25rem_1fr_auto] items-baseline gap-x-4 gap-y-1 py-3.5 sm:grid-cols-[3.5rem_11rem_2.5rem_1fr]"
            >
              <span className="font-mono text-sm tabular-nums text-zinc-500">
                {year}
              </span>
              <span className="text-sm font-medium uppercase tracking-wide text-zinc-100">
                {opponent}
              </span>
              <span
                aria-label="Win"
                className="font-display text-lg text-zinc-50 sm:text-center"
              >
                W
              </span>
              <span className="col-span-3 text-sm uppercase tracking-wide text-zinc-300 sm:col-span-1">
                {quote}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* The shirt's bottom ornament, exported from the artwork. Decorative. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG; next/image won't optimize it */}
      <img
        src="/ornament.svg"
        alt=""
        aria-hidden
        width={261}
        height={56}
        className="mx-auto -mt-px h-auto w-40 opacity-90 sm:w-52"
      />
    </section>
  );
}
