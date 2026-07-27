export function score(rank, percent, minpercent, gddl) {
    // Om gddl saknas, är 0, eller inte är ett nummer – sätt det till 1 så det inte kraschar!
    const tier = (gddl && typeof gddl === 'number' && gddl >= 1) ? gddl : 1;

    // ... resten av din kod ...
/**
 * Beräknar poäng baserat på rank, procent och GDDL-svårighetsgrad
 * @param {number} rank Position på listan
 * @param {number} percent Procent avklarat
 * @param {number} minpercent Minimum procent för poäng
 * @param {number} gddl GDDL-tier (1-39)
 * @returns {number}
 */
export function score(rank, percent, minpercent, gddl) {
    // Säkra att gddl finns och är ett nummer, annars sätt till 1 som fallback
    const tier = gddl && gddl >= 1 && gddl <= 39 ? gddl : 1;

    // Om nivån är utanför listan
    if (rank > 100) {
        return 0;
    }
    
    // Om spelaren inte har 100% och ranken är utanför godkänd procentgräns
    if (rank > 75 && percent < 100) {
        return 0;
    }

    let baseScore = 0;

    if (percent === 100) {
        // Linjär basskalning från plats 1 (350p) till plats 100 (10p)
        baseScore = 350 - ((rank - 1) * (350 - 10) / (100 - 1));
    } else if (rank <= 50 && percent >= minpercent) {
        // Plats 1-50 ger poäng vid minpercent (börjar på 70p)
        let maxPercentScore = 350 - ((rank - 1) * (350 - 10) / (100 - 1));
        let baseProgressScore = 70; 
        
        baseScore = baseProgressScore + ((percent - minpercent) / (100 - minpercent)) * (maxPercentScore - baseProgressScore);
    } else {
        return 0;
    }

    // Multiplicera baspoängen med GDDL upphöjt till 2 (gddl^2)
    let finalScore = baseScore * Math.pow(tier, 2);

    return Math.max(round(finalScore), 0);
}
