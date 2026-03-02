/**
 * เกณฑ์คะแนนกลาง — ใช้ทั้ง evaluation, certificate, report
 */
const PASS_SCORE = 70;

const SCORE_BUCKETS = [
  { range: '>=80', min: 80, max: Infinity },
  { range: '70-79', min: 70, max: 79.999 },
  { range: '60-69', min: 60, max: 69.999 },
  { range: '50-59', min: 50, max: 59.999 },
  { range: '<50',   min: -Infinity, max: 49.999 },
];

function scoreToBucket(score) {
  const bucket = SCORE_BUCKETS.find(b => score >= b.min && score <= b.max);
  return bucket ? bucket.range : '<50';
}

module.exports = { PASS_SCORE, SCORE_BUCKETS, scoreToBucket };
