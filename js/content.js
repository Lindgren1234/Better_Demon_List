import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = './data';

export async function fetchList() {
    const list = await fetch("_list.json").then((res) => res.json());

    const levels = await Promise.all(
        list.map(async (name) => {
            try {
                const res = await fetch(`./data/${name}.json`);
                if (!res.ok) {
                    throw new Error(res.statusText);
                }
                const data = await res.json();
                return [data, null];
            } catch (err) {
                return [null, name];
            }
        })
    );

    // KORREKT SORTERING: Packar upp nivån från [levelData, error]
    levels.sort((a, b) => {
        const levelA = a[0];
        const levelB = b[0];

        // Om en fil saknas eller är trasig, flytta den till botten av listan
        if (!levelA) return 1;
        if (!levelB) return -1;

        // Hämta GDDL-värdet (eller sätt till 0 om det saknas)
        const gddlA = typeof levelA.gddl === 'number' ? levelA.gddl : 0;
        const gddlB = typeof levelB.gddl === 'number' ? levelB.gddl : 0;

        // Sorterar från HÖGSTA till LÄGSTA GDDL-tier
        return gddlB - gddlA;
    });

    return levels;
}

export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        const editors = await editorsResults.json();
        return editors;
    } catch {
        return null;
    }
}

export async function fetchLeaderboard() {
    // 1. Säkerställ att fetchList inte kraschar hela scriptet
    let list = [];
    try {
        list = await fetchList() || [];
    } catch (e) {
        console.error("Fel vid hämtning av listan:", e);
        return [[], ["Kunde inte ladda banlistan (fetchList misslyckades)."]];
    }

    const scoreMap = {};
    const errs = [];
    
    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }

        // Säkerhetskopia ifall level-objektet är korrupt
        if (!level || !level.verifier) {
            errs.push(`Bana på plats ${rank + 1} saknar giltig data.`);
            return;
        }

        // Verification
        const verifier = Object.keys(scoreMap).find(
            (u) => u.toLowerCase() === level.verifier.toLowerCase(),
        ) || level.verifier;
        
        scoreMap[verifier] ??= {
            verified: [],
            completed: [],
            progressed: [],
        };
        
        const { verified } = scoreMap[verifier];
        
        // KORREKT ANROP: Skickar med level.gddl som fjärde parameter
        const vScore = score(rank + 1, 100, level.percentToQualify || 100, level.gddl) || 0;
        
        verified.push({
            rank: rank + 1,
            level: level.name || "Okänd bana",
            score: Number.isNaN(vScore) ? 0 : vScore,
            link: level.verification || "",
        });

        // Records (säkerställ att listan med records finns)
        const records = level.records || [];
        records.forEach((record) => {
            // Om ett enskilt record saknar användarnamn, hoppa över det så det inte låser sajten
            if (!record || !record.user) return;

            const user = Object.keys(scoreMap).find(
                (u) => u.toLowerCase() === record.user.toLowerCase(),
            ) || record.user;
            
            scoreMap[user] ??= {
                verified: [],
                completed: [],
                progressed: [],
            };
            
            const { completed, progressed } = scoreMap[user];
            const currentPercent = parseInt(record.percent, 10) || 0;
            const minPercent = parseInt(level.percentToQualify, 10) || 100;

            if (currentPercent === 100) {
                // KORREKT ANROP: Skickar med level.gddl här också
                const cScore = score(rank + 1, 100, minPercent, level.gddl) || 0;
                completed.push({
                    rank: rank + 1,
                    level: level.name || "Okänd bana",
                    score: Number.isNaN(cScore) ? 0 : cScore,
                    link: record.link || "",
                    date: record.date || "Inget datum"
                });
                return;
            }

            // KORREKT ANROP: Skickar med level.gddl här också
            const pScore = score(rank + 1, currentPercent, minPercent, level.gddl) || 0;
            progressed.push({
                rank: rank + 1,
                level: level.name || "Okänd bana",
                percent: currentPercent,
                score: Number.isNaN(pScore) ? 0 : pScore,
                link: record.link || "",
                date: record.date || "Inget datum"
            });
        });
    });

    // Wrap in extra Object containing the user and total score
    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;
        
        // Räkna ihop poäng och tvinga dem att vara giltiga siffror (nummer)
        const total = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => {
                const s = parseFloat(cur.score);
                return prev + (Number.isNaN(s) ? 0 : s);
            }, 0);

        return {
            user,
            total: round(total) || 0,
            ...scores,
        };
    });

    // Sortera efter totalpoäng
    try {
        res.sort((a, b) => (b.total || 0) - (a.total || 0));
    } catch (sortError) {
        console.error("Sorteringen misslyckades:", sortError);
    }

    return [res, errs];
}
