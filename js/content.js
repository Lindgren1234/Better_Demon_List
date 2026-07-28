import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = './data';

// Hämtar den osorterade rådatan från dina JSON-filer
export async function fetchListRaw() {
    const list = await fetch("_list.json").then((res) => res.json());
    return await Promise.all(
        list.map(async (name) => {
            try {
                const res = await fetch(`./data/${name}.json`);
                if (!res.ok) throw new Error(res.statusText);
                const data = await res.json();
                return [data, null];
            } catch (err) {
                return [null, name];
            }
        })
    );
}

// Sorterad lista för din vanliga huvudsida baserad på GDDL
export async function fetchList() {
    const levels = await fetchListRaw();

    // Sortering efter GDDL TIER (Från högsta till lägsta)
    levels.sort((a, b) => {
        // Packa upp nivån från [levelData, error] strukturen
        const levelA = a[0];
        const levelB = b[0];

        // Om en fil saknas eller är trasig, flytta den till botten av listan
        if (!levelA) return 1;
        if (!levelB) return -1;

        const gddlA = typeof levelA.gddl === 'number' ? levelA.gddl : 0;
        const gddlB = typeof levelB.gddl === 'number' ? levelB.gddl : 0;

        return gddlB - gddlA;
    });

    return levels;
}

export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        return await editorsResults.json();
    } catch {
        return null;
    }
}

export async function fetchLeaderboard() {
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

        if (!level || !level.verifier) {
            errs.push(`Bana på plats ${rank + 1} saknar giltig data.`);
            return;
        }

        const verifier = Object.keys(scoreMap).find(
            (u) => u.toLowerCase() === level.verifier.toLowerCase(),
        ) || level.verifier;
        
        scoreMap[verifier] ??= { verified: [], completed: [], progressed: [] };
        const { verified } = scoreMap[verifier];
        
        const vScore = score(rank + 1, 100, level.percentToQualify || 100, level.gddl) || 0;
        
        verified.push({
            rank: rank + 1,
            level: level.name || "Okänd bana",
            score: Number.isNaN(vScore) ? 0 : vScore,
            link: level.verification || "",
        });

        const records = level.records || [];
        records.forEach((record) => {
            if (!record || !record.user) return;

            const user = Object.keys(scoreMap).find(
                (u) => u.toLowerCase() === record.user.toLowerCase(),
                ) || record.user;
            
            scoreMap[user] ??= { verified: [], completed: [], progressed: [] };
            const { completed, progressed } = scoreMap[user];
            const currentPercent = parseInt(record.percent, 10) || 0;
            const minPercent = parseInt(level.percentToQualify, 10) || 100;

            if (currentPercent === 100) {
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

    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;
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

    try {
        res.sort((a, b) => (b.total || 0) - (a.total || 0));
    } catch (sortError) {
        console.error("Sorteringen misslyckades:", sortError);
    }

    return [res, errs];
}
