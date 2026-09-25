export function ProjectArt({
  art,
  variant = 0,
  className = "",
}: {
  art: "software" | "coffee";
  variant?: number;
  className?: string;
}) {
  return (
    <div
      className={
        "judex-art judex-art-" +
        art +
        (variant ? " judex-art-alternate" : "") +
        " " +
        className
      }
      aria-hidden="true"
    >
      {art === "coffee" ? (
        <>
          <div className="judex-art-small">WILD / COFFEE</div>
          <div className="judex-coffee-orbit" />
          <div className="judex-coffee-bag">
            <span>野間</span>
            <i />
            <small>
              WILD
              <br />
              COFFEE
            </small>
            <b>01 / A SLOW MORNING</b>
          </div>
          <div className="judex-coffee-cup">
            <span>W.</span>
          </div>
          <div className="judex-art-foot">A LITTLE WILD, EVERY DAY.</div>
        </>
      ) : art === "software" ? (
        <>
          <div className="judex-art-small">LEAF / BUILD TOGETHER</div>
          <div className="judex-software-window">
            <div className="judex-folio-dots">
              <i />
              <i />
              <i />
            </div>
            <strong>
              Small team.
              <br />
              Shared progress<span>_</span>
            </strong>
            <div className="judex-software-board">
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="judex-art-foot">PLAN. BUILD. REVIEW.</div>
        </>
      ) : art === "folio" ? (
        <>
          <div className="judex-art-small">STILL / SELECTED WORKS</div>
          <div className="judex-folio-window">
            <div className="judex-folio-dots">
              <i />
              <i />
              <i />
            </div>
            <strong>
              Make room
              <br />
              for ideas<span>.</span>
            </strong>
            <div className="judex-folio-shape" />
          </div>
          <div className="judex-art-foot">LESS, BUT MORE YOU.</div>
        </>
      ) : (
        <>
          <div className="judex-art-small">WANDER / CITY NOTEBOOK</div>
          <div className="judex-map-grid" />
          <span className="judex-map-title">
            Take
            <br />
            the long
            <br />
            <i>way.</i>
          </span>
          <svg className="judex-map-route" viewBox="0 0 300 200">
            <path
              d="M35 170L80 120L170 130L155 75L250 25"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="5 5"
            />
            <circle cx="35" cy="170" r="8" fill="currentColor" />
            <circle cx="250" cy="25" r="8" fill="currentColor" />
          </svg>
          <div className="judex-art-foot">NOT ALL WHO WANDER ARE LOST.</div>
        </>
      )}
    </div>
  );
}
