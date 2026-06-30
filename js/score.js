

export function score(rank, percent, minPercent) {
  if (percent < minPercent) return 0;

  let maxPoints = 350 * Math.pow(0.97, rank - 1)

  if (percent == 100) {
    return Math.round(maxPoints);
  } else {
    let percentRation = (percent - minPercent) / (100 - minPercent;
    let pointsAtMin = maxPoints * 0.20;
    let finalPoints = ponintsAtMin + (maxPoints - pointsAtMin) * percentRatio;
    return Math.round(finalPoints);
  }
}
