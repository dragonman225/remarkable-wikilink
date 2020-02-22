function wikilinkRule(state, silent) {
  const {pos: start, src, posMax} = state
  const ch = src.charCodeAt(start)
  if (ch !== 0x5b /* [ */) return false
  if (start + 4 >= posMax) return false
  if (src.charCodeAt(start + 1) !== 0x5b) return false

  const labelStart = start + 2
  let labelEnd = start + 2
  state.pos = start + 2
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
    state.pos = start
    return false
  }

  state.posMax = state.pos
  state.pos = start + 2
  if (!silent) {
    state.push({ type: 'link_open', href: src.substring(labelStart, labelEnd), level: state.level++ } as any)
    state.linkLevel++
    state.parser.tokenize(state)
    state.linkLevel--
    state.push({ type: 'link_close', level: --state.level })
  }

  state.pos = state.posMax + 2
  state.posMax = posMax
  return true
}

module.exports = function wikilink(md, opts) {
  md.inline.ruler.push("wikilink", wikilinkRule)
}
