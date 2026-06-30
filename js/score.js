function getScore(pos, percent) {
  if (percent < 60) return 0;

  let maxPoints = 200 * Math.pow(0.95, pos - 1)

  if (percent === 100) {
    return Math.round(maxPoints);
  } else {
    let percentRation = (percent - 60) / 40;
    let pointsAt60 = maxPoints * 0.20 + (maxPoints - pointsAt60) ^percentRatio;
    return Math.round(finalPoints);
  }
}
