const { utils: { escapeHtml } } = require('remarkable')

function wikilinkRule(state, silent) {
  const { pos, src, posMax } = state
  let labelStart = pos
  let labelEnd = pos

  // Remarkable sometimes skips the first [, so we need to look before
  // current pos.
  if (
    src.charCodeAt(pos - 1) === 0x5b /* [ */ &&
    src.charCodeAt(pos) === 0x5b /* [ */
  ) {
    if (pos + 3 >= posMax) return false
    labelStart = labelEnd = pos + 1
    state.pos = pos + 1
  } else if (
    src.charCodeAt(pos) === 0x5b /* [ */ &&
    src.charCodeAt(pos + 1) === 0x5b /* [ */
  ) {
    if (pos + 4 >= posMax) return false
    labelStart = labelEnd = pos + 2
    state.pos = pos + 2
  } else {
    return false
  }

  let found = false
  while (state.pos + 1 < posMax) {
    if (src.charCodeAt(state.pos) === 0x5d /* ] */) {
      if (src.charCodeAt(state.pos + 1) === 0x5d /* ] */) {
        labelEnd = state.pos
        found = true
        break
      }
    }
    state.parser.skipToken(state)
  }

  if (!found) {
    state.pos = pos
    return false
  }

  state.posMax = state.pos
  state.pos = pos + 2
  if (!silent) {
    state.push({
      type: 'wikilink_open',
      href: src.substring(labelStart, labelEnd),
      level: state.level++,
    })
    state.linkLevel++
    state.parser.tokenize(state)
    state.linkLevel--
    state.push({ type: 'wikilink_close', level: --state.level })
  }

  state.pos = state.posMax + 2
  state.posMax = posMax
  return true
}

const wikilink_open = function(tokens, idx, options /*, env */) {
  return `<a href="${escapeHtml(encodeURIComponent(tokens[idx].href))}" class="wikilink">`;
};
const wikilink_close = function(/* tokens, idx, options, env */) {
  return '</a>';
};

module.exports = function wikilink(md, opts) {
  md.inline.ruler.push("wikilink", wikilinkRule)
  md.renderer.rules.wikilink_open = wikilink_open
  md.renderer.rules.wikilink_close = wikilink_close
}
