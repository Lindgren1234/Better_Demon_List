/**
 * Calculate the score awarded when having a certain percentage on a list level
 * @param {Number} rank Position on the list
 * @param {Number} percent Percentage of completion
 * @param {Number} minPercent Minimum percentage required
 * @returns {Number}
 */
export function score(rank, percent, minPercent) {
    if (rank > 150) {
        return 0;
    }
    if (rank > 50 && percent < 100) {
        return 0;
    }

    // Beräkna baspoäng utifrån placering och progression
    let score = (-95.6214 * Math.pow(rank - 1, 0.2761) + 350) *
        ((percent - (minPercent - 1)) / (100 - (minPercent - 1)));

    score = Math.max(0, score);

    // FIXAT: Ger avdrag och avrundar poängen NEDÅT (Floor) om spelaren inte har 100%
    if (percent != 100) {
        return Math.floor(score - score / 3);
    }

    // FIXAT: Avrundar poängen NEDÅT (Floor) för 100% completion
    return Math.max(Math.floor(score), 0);
}
