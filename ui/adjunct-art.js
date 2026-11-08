// One close-up for every ingredient. Only the two closed palettes enter the markup.
const tones = {
  light: { fill: "#e9ce84", label: "浅色" },
  dark: { fill: "#584337", label: "深色" },
  neutral: { fill: "#aaa28e", label: "素色" },
};
const stages = {
  boil: {
    label: "煮沸锅",
    detail:
      '<path d="M263 72q-7-7 1-15t1-14m14 28q-5-5 0-12t-1-13" stroke="#848675"/><path d="M220 90h-6q-10 3-2 11h10m85-11h7q10 3 3 11h-10"/>',
    surface: "#a66e40",
  },
  pitch: {
    label: "接种时的发酵桶",
    detail:
      '<path d="M246 84q18-3 36 0" stroke="#dbc48d"/><path d="M300 68l4-21 5 1-4 21z" fill="#e2d7ba"/><path d="M303 62l3-11" stroke="#996c46"/>',
    surface: "#b98954",
  },
  active: {
    label: "泡沫活跃的发酵桶",
    detail:
      '<path d="M230 86q-2-6 4-7 0-7 7-5 4-7 10-2 6-4 9 1 7-4 11 2 7-4 10 2 9-4 11 3 9-1 9 6-31 8-71 0z" fill="#e8d7ad"/><path d="M239 80l3-1m13-3 3 1m16 2 3 1" stroke="#ab9872"/>',
    surface: "#ab7c4b",
  },
  conditioning: {
    label: "熟成时的贮酒桶",
    detail:
      '<ellipse cx="279" cy="60" rx="25" ry="5" transform="rotate(-28 279 60)" fill="#ccc9af"/><path d="M276 55q0-5 6-4" /><path d="M246 84q18-2 35 0" stroke="#d9c29b"/>',
    surface: "#a97b4f",
  },
};

export function materialArt(tone = "neutral", stage = "pitch") {
  const material = Object.hasOwn(tones, tone) ? tones[tone] : tones.neutral;
  const vessel = Object.hasOwn(stages, stage) ? stages[stage] : stages.pitch;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 156" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="一只手从纸袋倒出${material.label}原料，落入${vessel.label}">
    <g stroke="#433f33" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <g data-layer="table">
        <path d="M0 0h400v156H0z" fill="#f3ecd9" stroke="none"/><path d="M0 116l400-4v44H0z" fill="#d9c49d" stroke="none"/>
        <path d="M9 140l55-1m247 2 57-2M38 148l21-1m242 2 22-1" stroke="#ac9774"/>
        <path d="M85 122l19-14 98 1 10 11-18 13-101-3z" fill="#b29569"/><path d="M92 126l101 3 14-10m-79-1 11-4m7 9 14-7m1 6 13-5" stroke="#836e50"/>
      </g>
      <g data-layer="vessel-back">
        <path d="M219 85q44-10 89 0l-6 44q-36 10-77 0z" fill="#b7bbb0"/>
        <path d="M232 96l2 26m55-25-2 28" stroke="#e2dfcd"/>
        <ellipse cx="264" cy="85" rx="45" ry="9" fill="#ddd8bd"/>
        <ellipse cx="264" cy="85" rx="41" ry="6" fill="${vessel.surface}"/>${vessel.detail}
      </g>
      <g data-layer="arm">
        <path d="M58 20q17-9 34 4l22 17 48-7 6 16-61 19q-10 4-18-3L60 43z" fill="#73837a"/>
        <path d="M153 34l8-2 8 19-8 3z" fill="#c1bb9f"/>
        <path d="M164 34l13-5 18 4 6 7-7 7-16-2-12 5z" fill="#cda581"/>
      </g>
      <g data-layer="bag">
        <path d="M173 50l16-26 37 15 15 28-11 9-43-9z" fill="#d8bd87"/>
        <path d="M174 50l14 5 33 14m-33-14 1-26m0 26 4 11m16-25 10 10" stroke="#a1845b"/>
        <path d="M226 67q6-5 14-3l3 5-12 6z" fill="${material.fill}"/>
      </g>
      <g data-layer="material" fill="${material.fill}">
        <path d="M239 73l4 1 1 3-4-1zm6 7 3 1-1 3-3-2z"/>
        <path d="M133 117l5-3 6 2-1 2zm14 1 3-2 4 1-1 2z"/>
      </g>
      <g data-layer="foreground">
        <path d="M220 63l12 5 10-5-1 3-10 7-12-8z" fill="#e3c998"/>
        <path d="M178 30q6-3 12 1l8 6q2 4-3 4l-9-5-7 1q-5-2-1-7z" fill="#d6b392"/>
        <path d="M219 85q43 15 89 0l-1 5q-42 14-87 0z" fill="#c5c6b3"/>
      </g>
    </g></svg>`;
}
