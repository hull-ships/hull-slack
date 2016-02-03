module.exports = function(str) {
  return str
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b[A-Z][a-z]+\b/g, function(word) {
      return word.toLowerCase()
    })
    .replace(/^[a-z]/g, function(first) {
      return first.toUpperCase()
    })
    .replace('Platforms/','')
}
