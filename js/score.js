export function score(rank, percent, minpercent, gddl) {
    // Säkra att gddl är ett giltigt nummer, annars sätt till 0
    const tier = gddl && typeof gddl === 'number' ? gddl : 0;

    // Om nivån är utanför listan eller krav inte uppfylls, ge 0 poäng
    if (rank > 100) return 0;
    if (rank > 75 && percent < 100) return 0;
    if (rank <= 50 && percent < minpercent) return 0;

    // Poängen är enbart GDDL Tier upphöjt till 2
    let finalScore = Math.pow(tier, 2);

    return Math.max(round(finalScore), 0);
}
