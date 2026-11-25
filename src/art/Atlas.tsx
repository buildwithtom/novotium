import { useId } from 'react'

/** The local map is north-up. Compass angles are degrees clockwise on the screen. */
export function Compass({ angle = 0 }: { angle?: number }) {
  return (
    <svg
      className="atlas-compass"
      viewBox="0 0 100 100"
      width="76"
      height="76"
      role="img"
      aria-label="Compass"
    >
      <g transform={`rotate(${angle} 50 50)`}>
        <g fill="none" stroke="#44574e">
          <circle cx="50" cy="50" r="30" strokeWidth=".85" />
          <circle cx="50" cy="50" r="27.4" strokeWidth=".45" />
          {Array.from({ length: 48 }, (_, i) => (
            <path
              key={i}
              d={i % 6 === 0 ? 'M50 17.5v8' : i % 2 === 0 ? 'M50 20v3.3' : 'M50 20v1.8'}
              strokeWidth={i % 6 === 0 ? 1 : 0.65}
              transform={`rotate(${i * 7.5} 50 50)`}
            />
          ))}
        </g>
        <g strokeLinejoin="round" strokeWidth=".75">
          {[45, 135, 225, 315].map((rotation) => (
            <g key={rotation} transform={`rotate(${rotation} 50 50)`}>
              <path d="m50 32 3.2 17.4-3.2 1.2-3.2-1.2Z" fill="#d8d8b9" stroke="#667369" />
              <path d="M50 32v18.6l3.2-1.2Z" fill="#788777" />
            </g>
          ))}
          {[0, 90, 180, 270].map((rotation) => (
            <g key={rotation} transform={`rotate(${rotation} 50 50)`}>
              <path
                d="M50 19.4 56.1 50 50 54.8 43.9 50Z"
                fill={rotation === 0 ? '#c68267' : '#e2e0c9'}
                stroke={rotation === 0 ? '#904e3b' : '#485b50'}
              />
              <path d="M50 19.4V54.8L56.1 50Z" fill={rotation === 0 ? '#a25743' : '#56685b'} />
            </g>
          ))}
        </g>
        <circle cx="50" cy="50" r="3.8" fill="#e6d4ac" stroke="#485b50" strokeWidth="1" />
        <circle cx="50" cy="50" r="1.25" fill="#687667" />
        {(
          [
            ['N', 50, 13],
            ['E', 89, 54],
            ['S', 50, 92],
            ['W', 11, 54],
          ] as const
        ).map(([letter, x, y]) => (
          <text
            key={letter}
            x={x}
            y={y}
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontWeight="bold"
            fontSize={letter === 'N' ? 13.5 : 11.5}
            transform={`rotate(${-angle} ${x} ${y - 4})`}
            fill={letter === 'N' ? '#975540' : '#46594c'}
          >
            {letter}
          </text>
        ))}
      </g>
    </svg>
  )
}

function MapTree({ x, y, size, pine }: { x: number; y: number; size: number; pine?: boolean }) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${size})`}
      stroke="#677d5b"
      strokeWidth=".65"
      strokeLinejoin="round"
    >
      {pine ? (
        <>
          <path d="M0 .2v2" fill="none" />
          <path d="M0-6.2-2.5-2.3h1.1L-3.6.6Q0 2.1 3.5.6L1.4-2.3h1Z" fill="#839973" />
        </>
      ) : (
        <>
          <path d="M0 1v2.5" fill="none" />
          <path
            d="M-2.4.6Q-5-.7-3.1-3q-.2-2.2 2.1-2.3Q.6-7.2 2.1-5q2.3.1 2.1 2.4Q5.6-.2 2.8.9.2 2.2-2.4.6Z"
            fill="#99ab83"
          />
          <path d="m-.9-1.4.9 1 .9-1.4" fill="none" />
        </>
      )}
    </g>
  )
}

const groves = [
  [12, 20],
  [17, 15],
  [21, 21],
  [28, 13],
  [9, 37],
  [17, 44],
  [23, 38],
  [12, 56],
  [17, 65],
  [29, 78],
  [23, 82],
  [38, 85],
  [47, 82],
  [61, 11],
  [66, 14],
  [72, 10],
  [92, 9],
  [98, 13],
  [119, 10],
  [127, 15],
  [137, 12],
  [141, 18],
  [145, 26],
  [143, 39],
  [140, 48],
  [146, 55],
  [137, 69],
  [130, 75],
  [99, 83],
  [91, 81],
  [77, 84],
  [67, 81],
  [155, 92],
  [161, 87],
  [170, 86],
  [52, 45],
  [56, 40],
  [106, 43],
  [109, 38],
]

function Roof({ x, y, tint, turn }: { x: number; y: number; tint: string; turn: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn})`} strokeLinejoin="round">
      <path d="m-9-6 16.3-.3.4 12.9-16.5.2Z" fill="#c1b995" opacity=".8" transform="translate(1 1)" />
      <path d="m-7.3-4.5 14.3-.3.4 10.2-14.6.4Z" fill="#e8d5aa" stroke="#938c70" strokeWidth=".6" />
      <path d="M-8.1-5.3 7.5-5.6 8 3.6-7.9 4.1Z" fill={tint} stroke="#736e57" strokeWidth=".8" />
      <path
        d="m-8.1-5.3 4.3 4.6 7.8-.2L7.5-5.6M-3.8-.7l-4.1 4.8M4-.9l4 4.5"
        fill="none"
        stroke="#74684e"
        strokeWidth=".7"
      />
      <path d="M-6.5-4h12L4-2.5h-9Z" fill="#f4e4bd" opacity=".28" />
      <path d="M3.5-5.3h2v2.8h-2z" fill="#e2cca8" stroke="#85785f" strokeWidth=".4" />
    </g>
  )
}

export function DistrictMap({ x = 0, z = 0, homePlot }: { x?: number; z?: number; homePlot?: string }) {
  const grid = useId()
  const river =
    'M129-6Q128 7 140 13T153 35Q148 48 155 59T145 77Q130 77 122 88T94 96Q79 87 66 94T38 98Q24 92 14 99L-7 107'
  const mainRoad =
    'M7 47Q31 45 47 48T80 47Q89 44 100 47T129 48Q140 47 154 51M81-6Q87 14 85 30T84 47Q78 60 82 73L85 91'
  const localPath =
    'M21 34Q30 42 42 37L47 46M80 37l6-6M126 36l-2 11M40 50l3 10M83 54l-1 5M116 50l5 11M35 73q21 8 33 2t31 0q15 5 30-3'
  const px = Math.max(5, Math.min(171, 84 + x * 3.85))
  const py = Math.max(5, Math.min(101, 48 + z * 2.8))
  return (
    <svg
      className="atlas-district-map"
      viewBox="0 0 176 106"
      width="176"
      height="106"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Map of Willowmere and your position"
    >
      <defs>
        <pattern id={grid} width="17" height="17" patternUnits="userSpaceOnUse">
          <path d="M0 17V0h17" fill="none" stroke="#7b8665" strokeWidth=".45" opacity=".34" />
          <path d="m3 6 1.1-.25m8 7 1.4-.3" stroke="#8f9a75" strokeWidth=".7" opacity=".65" />
        </pattern>
      </defs>
      <rect width="176" height="106" fill="#dbe0bc" />
      <path
        d="M-5 12Q18 4 37 10t38-2Q95-.5 119 7l18-7H-5Zm0 40q16-7 29-3t22 17Q32 62 20 74T-5 81Zm56-15q11-17 20-13t7 17q-9 12-25 4Zm63-26q13-9 23 4t4 27q-2 15-16 14 10-19-2-30Zm-86 79q11-15 27-10t32-2q13-6 22 7t25 9l-92 13Z"
        fill="#bdcca4"
      />
      <g fill="none" stroke="#9daa85" strokeWidth=".65" opacity=".72">
        <path d="M-5 17q18-9 40-3t44-3q19-8 39-1M-8 20q21-10 40-3t46-3M-4 82q15-1 23-12t26-6m-48 22q13-1 24-11t25-7M127 8q20 8 17 34M130 5q20 8 17 36M14 94q24-7 43-4t35-2M12 91q26-7 44-4t35-2" />
      </g>
      <g fill="#e4dfba" stroke="#a9af88" strokeWidth=".8">
        {[44, 84, 123].flatMap((cx, j) =>
          [28, 65].map((cy, k) => (
            <rect
              key={`${j}-${k}`}
              x={cx - 13}
              y={cy - 10}
              width="26"
              height="20"
              rx="2.2"
              transform={`rotate(${[3, -3, 1][j]} ${cx} ${cy})`}
            />
          )),
        )}
      </g>
      <path d={river} fill="none" stroke="#a6bba2" strokeWidth="15.5" />
      <path d={river} fill="none" stroke="#82a9ac" strokeWidth="12.2" />
      <path d={river} fill="none" stroke="#a9c6bf" strokeWidth="9.5" />
      <path
        d="m141 14 4 3m5 8 2 3m0 10-1 4m3 19 1 3m-12 12-4 1m-15 10-4 4m-18 4-5-.7m-38 .8-5 1"
        fill="none"
        stroke="#d1ddd0"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <rect width="176" height="106" fill={`url(#${grid})`} />
      <path d={mainRoad} fill="none" stroke="#b3ab89" strokeWidth="5" />
      <path d={mainRoad} fill="none" stroke="#efe7c9" strokeWidth="3.5" />
      <path d={localPath} fill="none" stroke="#baa989" strokeWidth="3.1" />
      <path d={localPath} fill="none" stroke="#eee2be" strokeWidth="2.1" />
      <g transform="translate(153 51) rotate(12)">
        <path d="M-6-2.9H7v5.8H-6Z" fill="#c8ad80" stroke="#8c785a" strokeWidth=".8" />
        <path d="M-4-2v4m2-4v4m2-4v4m2-4v4m2-4v4" stroke="#a78c67" strokeWidth=".7" />
      </g>
      {groves.map(([tx, ty], i) => (
        <MapTree key={i} x={tx} y={ty} size={0.71 + (i % 3) * 0.16} pine={i % 5 < 2} />
      ))}
      <Roof x={44} y={28} tint="#c69a78" turn={6} />
      <Roof x={84} y={28} tint="#94a697" turn={-3} />
      <Roof x={123} y={28} tint="#b4a16e" turn={4} />
      <Roof x={84} y={65} tint="#8da3a0" turn={-5} />
      {(
        [
          ['B1', 44],
          ['B3', 123],
        ] as const
      ).map(([id, cx]) =>
        homePlot === id ? (
          <Roof key={id} x={cx} y={65} tint="#bd927c" turn={3} />
        ) : (
          <g key={id} stroke="#9aab80" strokeWidth="1" transform={`translate(${cx} 64) rotate(-3)`}>
            <path d="M-7-3H7m-14 3H7M-7 3H7" strokeDasharray="2.4 1.2" />
          </g>
        ),
      )}
      <circle cx={px} cy={py} r="5" fill="#6a7860" opacity=".2" />
      <circle cx={px} cy={py} r="3.25" fill="#a7563d" stroke="#f7f2da" strokeWidth="1.6" />
    </svg>
  )
}

export function Postmark() {
  const top = useId()
  const bottom = useId()
  return (
    <svg className="atlas-postmark" viewBox="0 0 100 100" width="96" height="96" aria-hidden="true">
      <defs>
        <path id={top} d="M16 49a34 34 0 0 1 68 0" />
        <path id={bottom} d="M13.8 53a37.2 37.2 0 0 0 72.4 0" />
      </defs>
      <g transform="rotate(-11 50 50)" fill="none" stroke="currentColor">
        <circle cx="50" cy="50" r="46" strokeWidth="1.3" strokeDasharray="165 2 41 1 35 2 23 1 21 1" />
        <circle cx="50" cy="50" r="43.5" strokeWidth=".6" strokeDasharray="104 1 41 2 125" />
        <path d="M22 42a29.5 29.5 0 0 1 56 0M22 58a29.5 29.5 0 0 0 56 0" strokeWidth=".7" />
        <g
          fill="currentColor"
          stroke="none"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontWeight="bold"
        >
          <text fontSize="9.4" letterSpacing="2">
            <textPath href={`#${top}`} startOffset="50%">
              NOVOTIUM
            </textPath>
          </text>
          <text fontSize="7.5" letterSpacing="1.65">
            <textPath href={`#${bottom}`} startOffset="50%">
              CITIZENSHIP
            </textPath>
          </text>
        </g>
        <path
          d="m13 47 1 2.3 2.4 1-2.4 1-1 2.3-1-2.3-2.3-1 2.3-1Zm74 0 1 2.3 2.3 1-2.3 1-1 2.3-1-2.3-2.4-1 2.4-1Z"
          fill="currentColor"
          stroke="none"
        />
        <g strokeLinecap="round" strokeLinejoin="round">
          <circle cx="61.5" cy="37.5" r="4" strokeWidth="1" />
          <path d="m61.5 30 0 1.7m7.5 5.8-1.7 0m-.5-5.1-1.1 1.1m-9.1-1.1 1.1 1.1" strokeWidth=".8" />
          <path
            d="M24 60.5q6-3.7 11-2.5M59 59q9-1.9 16 1.7M25 63q11 1.9 27-.1t21 .1m-43 2.9q12 .7 18-.3m6.9-.5q6.2-.6 10.6.1"
            strokeWidth=".85"
          />
          <path
            d="M27 57v-4h-3l3.8-6.2h-2l3.8-6.3 3.4 6.3h-1.7l3.5 6.2h-3.7v4.2M67 58v-4h-3.3L67 49h-1.6l3-5.2 3 5.2h-1.5l3 5h-3v4"
            strokeWidth="1"
          />
          <path
            d="M33 49.7 43 39l14.7.7 7.6 10-13.3.2-9-8.7-8.8 9.9zM35.9 49.4v10.3l15.1 1V49.5m0 11.2 12.2-1.4v-9.5"
            strokeWidth="1.3"
          />
          <path
            d="M54.5 39.8v-5.1h3.6v5.9m-4-6.1h4.6M40 59.6V52h4.9v7.9m8.9-7.7 5.8-.5v3.8l-5.8.6zM56.7 52v3.7m-2.8-1.9 5.6-.5M48.7 43l6.6 6m-1.8-6.3 5.1 5.8m-2.2-6.3 4.5 5.4"
            strokeWidth=".85"
          />
          <path d="M40.7 47.3q1.3-3.1 3.1-.4l.2 1.5-3.3-.1Z" strokeWidth=".85" />
        </g>
      </g>
    </svg>
  )
}

export function BrandMark() {
  return (
    <svg
      className="atlas-brand-mark"
      width="26"
      height="32"
      viewBox="0 0 27 34"
      aria-hidden="true"
      fill="none"
    >
      <g stroke="#d0ad70" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M4.6 30.8C11.2 23.4 15.2 14.7 19.8 4.7M9.1 24.1l2.6 5m1.7-13.3-1.6-4.1"
          strokeWidth="1.45"
        />
        <path
          d="M8.5 25c-4.3-.2-5.4-3.6-5.5-7.4 3.3 1.6 5.7 3.6 5.5 7.4Zm2.6-4.7c-4.6-1-4.8-4.3-4.6-8.1 3.2 1.8 5.2 4.2 4.6 8.1Zm3.4-5.3c-3.4-2-3.9-5.8-3-9.4 3 2.7 4.2 5.1 3 9.4Zm3.2-6.2c-1-3.2.6-5.6 3.3-8 .5 3.4-.2 5.8-3.3 8ZM9.7 23c4.3-3.2 6.9-3 10.1-2.8-2 3.2-5.6 5.2-10.1 2.8Zm3.6-6.3c3.3-3.5 6.5-4 9.6-3.5-2.2 3.6-5.1 4.8-9.6 3.5Zm3.4-6.2c2.5-3.6 5.6-4.3 8.4-4.7-1.3 3.3-4.2 5.7-8.4 4.7Z"
          fill="#cda96b"
          strokeWidth=".6"
        />
      </g>
    </svg>
  )
}
