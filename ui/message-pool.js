import { beerName, delivery } from "./flow.js";
import { nightFeed } from "./live-feed.js";

const stockSize = 8;
const nightlyDraw = 5;

function shuffle(items) {
  const deck = items.slice();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function needsStock(state) {
  const service = state.service;
  // Finish an already-playing evening from an older save in its original order.
  if (!service || service.closed || (!service.draw && service.cursor > 1)) return false;
  return state.taps.slice(0, 3).some(t => t && !service.draw?.batches.includes(t.number));
}

export async function stockRoom(state, writeVoices) {
  const service = state.service;
  const draw = service.draw || { batches: [], lines: [] };
  const taps = state.taps.slice(0, 3).filter(t => t && !draw.batches.includes(t.number));
  const prepared = await Promise.all(taps.map(async tap => {
    const { batch, night } = delivery(tap);
    const pool = (tap.messagePool || []).slice();
    const posts = night.posts.filter(p => p.session === tap.night).slice(0, Math.max(0, stockSize - pool.length));
    const cached = new Map((tap.voices?.[tap.night] || []).map(p => [p.id, p]));
    const missing = posts.filter(p => !cached.has(p.id));
    const fresh = missing.length ? await writeVoices(batch, missing) : [];
    for (const row of fresh || []) cached.set(row.id, row);
    const line = (id, name, text, kind) => ({id:tap.number + "/" + id, slot:tap.slot, beer:beerName(tap.d), name, text, kind});
    for (const post of posts) {
      const voice = cached.get(post.id);
      const card = [line(post.id, post.name, voice?.text || post.text, "post")];
      if (post.reply) card.push(line(post.id + "-reply", post.reply.name,
        "回复 " + post.name + " · " + (voice?.replyText || post.reply.text), "reply"));
      pool.push(card);
    }
    const cards = shuffle(pool).slice(0, nightlyDraw);
    for (const event of nightFeed(night, tap.night).filter(e => e.kind === "action")) {
      cards.push([line(event.id, event.name, event.text, event.kind)]);
    }
    return { tap, pool, cards };
  }));
  if (state.service !== service || service.closed) return;
  const cards = [];
  for (const {tap, pool, cards: selected} of prepared) {
    if (state.taps[tap.slot] !== tap) continue;
    tap.messagePool = pool;
    draw.batches.push(tap.number);
    cards.push(...selected);
  }
  draw.lines.push(...shuffle(cards).flat());
  service.draw = draw;
}

export function retireShown(state, lines) {
  const read = new Set(lines.slice(0, state.service.cursor).map(e => e.id));
  for (const tap of state.taps.slice(0, 3)) {
    if (tap?.messagePool) tap.messagePool = tap.messagePool
      .map(card => card.filter(line => !read.has(line.id))).filter(card => card.length);
  }
}
