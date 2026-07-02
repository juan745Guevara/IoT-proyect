import SensorBubble from "./SensorBubble.jsx";
import ActuadorBubble from "./ActuadorBubble.jsx";
import { GREENHOUSE_HOTSPOTS, getConnectorGeometry } from "./greenhouseHotspots.js";

function renderBubble(spot, sensores, actuadores) {
  if (spot.kind === "sensor") {
    return (
      <SensorBubble
        key={spot.id}
        label={spot.label}
        valor={sensores?.[spot.key]}
        unidad={spot.unidad}
        variant={spot.variant}
        icon={spot.icon}
      />
    );
  }

  return (
    <ActuadorBubble
      key={spot.id}
      label={spot.label}
      estado={actuadores?.[spot.key]}
      icon={spot.icon}
      variant={spot.actVariant}
    />
  );
}

export default function GreenhouseView({ sensores, actuadores }) {
  return (
    <div className="gh-panel">
      <div className="gh-stage">
        <div className="gh-visual">
          <img
            src="/greenhouse.jpg"
            alt="Invernadero inteligente con plantas, ventilación y riego"
            className="gh-img"
            onError={(e) => {
              if (!e.target.dataset.fallback) {
                e.target.dataset.fallback = "1";
                e.target.src = "/greenhouse.png";
                return;
              }
              e.target.style.display = "none";
            }}
          />

          <svg
            className="gh-svg"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {GREENHOUSE_HOTSPOTS.map((spot) => {
              const { path, anchor } = getConnectorGeometry(spot);
              return (
                <g key={`link-${spot.id}`} className="gh-link">
                  <path
                    d={path}
                    fill="none"
                    stroke={spot.color}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.72"
                    className="gh-connector-line"
                  />
                  <circle cx={anchor.x} cy={anchor.y} r="0.55" fill={spot.color} opacity="0.85" />
                </g>
              );
            })}
          </svg>

          <div className="gh-bubbles" aria-label="Sensores y actuadores">
            {GREENHOUSE_HOTSPOTS.map((spot) => (
              <div
                key={spot.id}
                className={`gh-bubble-slot gh-bubble-slot--${spot.side}`}
                style={{
                  left: `${spot.bubble.x}%`,
                  top: `${spot.bubble.y}%`,
                }}
              >
                {renderBubble(spot, sensores, actuadores)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
