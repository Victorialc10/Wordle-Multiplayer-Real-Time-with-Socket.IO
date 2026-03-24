const fs = require("fs");
const wordListPath = require("word-list").default;

const words = fs
  .readFileSync(wordListPath, "utf8")
  .split("\n")
  .map((w) => w.trim().toUpperCase());

function getWordsByLength(length) {
  return words.filter((w) => w.length === length);
}

module.exports = { words, getWordsByLength };
