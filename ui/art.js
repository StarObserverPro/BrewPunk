// Reusable ink plates. Only paths and trusted palette values enter the SVG.
const ink = "#2e352b";
const paper = "#f5edda";
const steel = "#c8c8b4";
export function wort(srm = 6) {
  return srm < 5
    ? "#e6c46b"
    : srm < 10
      ? "#dca24b"
      : srm < 20
        ? "#b77339"
        : srm < 32
          ? "#79503a"
          : "#46372d";
}

function figure(x, y, reach = false) {
  return `<g transform="translate(${x} ${y})">
    <circle cy="-41" r="10" fill="${paper}"/><path d="M-9-46q10-12 18 0M0-31l-1 31m0-25 ${reach ? "l16-6 15-10" : "l-12 13-8-7"}M0-22l12 12 14-4M0 0l-3 21-12 21m15-42 7 23 8 19m-32 1h8m15 0h10"/>
  </g>`;
}
const table =
  '<path d="M106 189h208v8H106z" fill="#c6aa7d"/><path d="M120 197l-2 22m182-22 2 22"/>';
const shelf =
  '<path d="M268 81h74m-69 2v7m63-7v7M278 79V65h7v14m10 0V58h7v21m11 0V66h12v13"/>';
const window =
  '<path d="M37 68h58v49H37zm29 0v49m-29-25h58m-53 3 12-13m19 25 12-13"/>';
const floor =
  '<path d="M20 220q174-3 358 0m-352 5h43m257 1h42" stroke="#898773"/>';

function prep() {
  return `${figure(82, 177, true)}${table}
    <path d="M144 154l5-13h23l4 13 7 31q-19 7-44 0z" fill="#c9ad78"/><path d="M150 142l-6-10 12 3 5-5 9 4 7-1-7 8m-17 20 7 12m-2-5-6-1m8 4 3-7"/>
    <path d="M180 180l18-8 16 4-17 10z" fill="${paper}"/><path d="M191 179l8-3m-5 5 7-3"/>
    <path d="M215 181l3-12h24l4 13zM230 169v-9m-18-5q18 13 37 0z" fill="${steel}"/><circle cx="231" cy="175" r="3"/>
    <path d="M262 181q14-15 33 0z" fill="#ceaf72"/><g fill="#bd9858" stroke-width="1"><ellipse cx="268" cy="184" rx="3" ry="1.5"/><ellipse cx="278" cy="181" rx="2.7" ry="1.4"/><ellipse cx="285" cy="184" rx="2.8" ry="1.4"/></g>`;
}

function mash(c) {
  return `${figure(103, 177, true)}
    <path d="M151 146l49 19m-3-5 10 8" stroke="#866e4c" stroke-width="4"/>
    <path d="M159 152v36q0 9 31 9t31-9v-36" fill="#c9c7af"/><ellipse cx="190" cy="152" rx="31" ry="7" fill="${c}"/><path d="M158 161q-13-5-9 11l9 2m62-13q12-5 10 9l-10 4"/>
    <path d="M163 196h58v8h-58zm6 8-2 15m46-15 2 15"/><path d="M180 139c-8-9 6-12 0-21m13 20c-6-10 8-14 2-22m11 23c-4-7 6-9 4-15" stroke="#838b75" stroke-width="1.7"/>
    <path d="M220 182h17v5h9m-13-8h7"/><path d="M246 187v11" stroke="${c}" stroke-width="4"/>
    <path d="M230 198h37l-5 20h-27z" fill="${steel}"/><ellipse cx="249" cy="198" rx="18" ry="4" fill="${c}"/><path d="M231 199q-2-15 10-18" stroke-width="1.3"/>`;
}

function ferment(c) {
  return `${figure(117, 177, true)}
    <path d="M165 202h98v7h-98zm10 7v10m78-10v10" fill="#c6aa7d"/>
    <path d="M197 136v-12h29v12q27 10 27 29v30q0 8-12 8h-59q-10 0-10-8v-30q0-18 25-29z" fill="#d9e1d2"/>
    <path d="M178 162q12-4 23 0t22 0 24 0v30q0 5-6 5h-59q-4 0-4-5z" fill="${c}" stroke="none"/>
    <path d="M181 161q7-7 15-2t14 0 16 0 17 0" stroke="#f4e7bd" stroke-width="3"/>
    <path d="M184 168v17" stroke="#f7efdb" stroke-width="2"/><path d="M247 187h14v5h-8m-2-8h7" fill="${steel}"/>
    <path d="M196 123h31v7h-31z" fill="#8b7456"/>
    <path d="M207 122v-14h-5v-9q0-4 4-4h3q4 0 4 4v5h5v-9q0-4 4-4h3q4 0 4 4v11q0 4-5 4h-8v12" fill="#dce6d9"/>
    <path d="M205 105h6m9-5h6" stroke="#819b8b"/><circle cx="225" cy="84" r="2" stroke-width="1.4"/>`;
}

// Each ingredient is recognisable on the board before any wording is read.
const toppings = {
  coffee:
    '<g fill="#79533b"><ellipse cx="-10" cy="0" rx="8" ry="5" transform="rotate(-27 -10 0)"/><ellipse cx="7" cy="-3" rx="7" ry="5" transform="rotate(30 7 -3)"/><ellipse cx="10" cy="8" rx="6" ry="4"/></g><path d="M-16 2q7 0 10-4M2-5q5 4 10 4m-7 9 8-1" stroke="#d8bc8e" stroke-width="1.4"/>',
  cocoa:
    '<path d="M-19 1q1-13 22-12l14 7-7 8q-19 10-29-3z" fill="#ac7548"/><path d="M-15 0q12-8 29-4m-28 7q14 2 27-4m4-4 6-5" stroke="#715639" stroke-width="1.5"/><path d="M14 9l5-4 4 5-5 3z" fill="#624a38"/>',
  cherry:
    '<path d="M-10 1q3-13 16-15M9 3Q5-5 6-14m-1 0q8-6 15-1-8 6-15 1z" fill="#83916d"/><circle cx="-11" cy="5" r="7" fill="#aa5146"/><circle cx="9" cy="7" r="8" fill="#9c4740"/><path d="M-15 3l2-2M5 5l2-1" stroke="#ecd5aa" stroke-width="1.5"/>',
  chili:
    '<path d="M-18 7q18 1 22-12 4-6 10-2t3 8Q6 15-18 7z" fill="#bd6347"/><path d="M8-5q5-3 10 2m-4-4q5-4 4-9" stroke="#60734c"/><path d="M0 6q6 0 12-5" stroke="#e5aa80" stroke-width="1.5"/>',
  coconut:
    '<path d="M-20-2q6 22 24 14 11-6 13-18z" fill="#876246"/><ellipse cx="-2" cy="-4" rx="19" ry="7" fill="#efe6cc" transform="rotate(-9 -2 -4)"/><path d="M-11-3q9-4 18-2m8 10 9 3-7 6-8-4z" fill="#e6d7b7" stroke-width="1.5"/>',
  pretzel:
    '<path d="M-15 7C-27-5-14-16-3-5L12 9C21 16 28 0 18-6 9-15 2-3-3 4l-8 9M-13 10l21 1" stroke="#664d34" stroke-width="8"/><path d="M-15 7C-27-5-14-16-3-5L12 9C21 16 28 0 18-6 9-15 2-3-3 4l-8 9M-13 10l21 1" stroke="#c18d54" stroke-width="4.6"/><path d="M-17-5l1 1m22 9 1 1m10-11 1 1" stroke="#f3ecd7" stroke-width="2"/>',
};
function adjunctScene(c, item) {
  return `${figure(82, 174, true)}${table}
    <path d="M145 180l8-19h82l11 19z" fill="#c3a479"/>
    <g transform="translate(195 159)">${toppings[item] ?? '<path d="M-20 5l28-8 8 2-7 4-27 5z" fill="#d8d1ba"/>'}</g>
    <path d="M254 158v22q0 6 19 6t19-6v-22z" fill="${steel}"/><ellipse cx="273" cy="158" rx="19" ry="5" fill="${c}"/>
    <path d="M285 147l9-18" stroke="#8e7452" stroke-width="3"/>`;
}

function packing(c, pack) {
  const objects =
    pack === "bottle"
      ? [147, 181, 215, 249]
          .map(
            (x) =>
              `<g transform="translate(${x} 188)"><path d="M-8 0v-26l5-10v-13h7v13l5 10V0z" fill="${c}"/><path d="M-4-47h9m-11 22v17" stroke-width="1.4"/><path d="M-4-50h9" stroke-width="3"/></g>`,
          )
          .join("")
      : pack === "can"
        ? [141, 178, 215, 252]
            .map(
              (x) =>
                `<g transform="translate(${x} 187)"><rect x="-9" y="-34" width="22" height="34" rx="4" fill="${steel}"/><ellipse cx="2" cy="-33" rx="10" ry="3" fill="${paper}"/><path d="M0-33h5m-10 6v19" stroke-width="1.2"/><path d="M-8-10h20" stroke="${c}" stroke-width="6"/></g>`,
            )
            .join("")
        : `<path d="M156 149q0-8 30-8t30 8v31q0 8-30 8t-30-8z" fill="${steel}"/><ellipse cx="186" cy="149" rx="30" ry="7"/><path d="M157 156q25 7 57 0m-57 18q26 7 57 0m-30-32v-8h9v8m2-7h26q16 0 16 14v11"/><rect x="241" y="153" width="19" height="35" rx="7" fill="#a7b49a"/><path d="M245 152v-6h10v6m-5-5v-5"/>`;
  return figure(80, 177, true) + table + objects;
}
const cup = (x, y, c) =>
  `<g transform="translate(${x} ${y})"><path d="M0 0h20l-2 27H3z" fill="${c}"/><path d="M1 3q4-6 8-2t10 0" stroke="#f7f0da"/></g>`;

export function sketch(stage, srm = 7, adjunct = "", pack = "keg") {
  const c = wort(srm);
  const plates = {
    recipe: ["配方本、谷物与台秤", prep],
    mash: ["锅边糖化，麦汁流入接液桶", () => mash(c)],
    ferment: ["发酵瓶、泡沫与气锁", () => ferment(c)],
    adjunct: ["增味砧板与敞口小锅", () => adjunctScene(c, adjunct)],
    pack: ["分装台", () => packing(c, pack)],
    taste: [
      "倒出的第一杯",
      () =>
        `${figure(103, 175, true)}<path d="M148 194h126m-111 0v26m98-26v26"/>${cup(196, 166, c)}<path d="M204 151q-4-9 2-15m7 16q7-9 6-14" stroke="#83917d"/>`,
    ],
    tap: [
      "六个龙头的小酒馆",
      () =>
        `<path d="M80 155h237v11H80zm15 12v52m204-52v52" fill="#c5a777"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${111 + i * 34} 147v-22q0-8 10-7v12m-1-14v-10"/>`).join("")}${cup(202, 128, c)}${figure(57, 175, true)}${figure(339, 177)}`,
    ],
  };
  const [label, draw] = plates[stage] ?? plates.recipe;
  return `<svg viewBox="0 0 400 245" role="img" aria-label="${label}"><defs><pattern id="grain" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".55" fill="#b7ab89"/></pattern></defs><rect width="400" height="245" fill="#ece6d2"/><rect width="400" height="245" fill="url(#grain)"/><g fill="none" stroke="${ink}" stroke-width="2.45" stroke-linecap="round" stroke-linejoin="round">${floor}<g stroke="#8c927c" stroke-width="1.5">${window}${shelf}</g>${draw()}</g></svg>`;
}
