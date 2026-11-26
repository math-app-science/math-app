// --- グラフ（SVG）を動的に生成する共通ヘルパー関数 ---
function createFunctionGraphSVG(funcType, a, x1, x2) {
    const width = 240, height = 240;
    
    let minX = -6, maxX = 6;
    if (x1 !== undefined && x2 !== undefined) {
        let margin = Math.max(Math.abs(x1), Math.abs(x2), 3);
        minX = -margin - 1;
        maxX = margin + 1;
    }

    let minY = -6, maxY = 6;
    if (funcType === "quadratic") {
        let maxAbsX = Math.max(Math.abs(minX), Math.abs(maxX));
        let topY = a > 0 ? 0 : a * maxAbsX * maxAbsX;
        let bottomY = a > 0 ? a * maxAbsX * maxAbsX : 0;
        minY = Math.min(-6, topY - 2);
        maxY = Math.max(6, bottomY + 2);
    } else if (funcType === "linear") {
        let y1 = a * minX, y2 = a * maxX;
        minY = Math.min(-6, Math.min(y1, y2) - 2);
        maxY = Math.max(6, Math.max(y1, y2) + 2);
    } else if (funcType === "inverse") {
        let y1 = a / minX, y2 = a / maxX;
        minY = Math.min(-6, Math.min(y1, y2, -6) - 2);
        maxY = Math.max(6, Math.max(y1, y2, 6) + 2);
    } else if (funcType === "secant") {
        // 放物線と直線の交点用グラフのスケール調整
        let maxAbsX = Math.max(Math.abs(x1), Math.abs(x2), 4);
        minX = -maxAbsX - 1;
        maxX = maxAbsX + 1;
        minY = Math.min(-6, a * maxAbsX * maxAbsX - 3);
        maxY = Math.max(6, a * maxAbsX * maxAbsX + 3);
    }

    const scaleX = (width - 40) / (maxX - minX);
    const scaleY = (height - 40) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);

    const cx = width / 2 - (minX + maxX) / 2 * scale;
    const cy = height / 2 + (minY + maxY) / 2 * scale;

    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background:#fff; border:1px solid #cbd5e1; border-radius:4px; display:block; margin: 10px auto;">`;
    
    svg += `<defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444"></path>
        </marker>
        <marker id="arrow-start" viewBox="0 0 10 10" refX="4" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 10 1 L 0 5 L 10 9 z" fill="#ef4444"></path>
        </marker>
    </defs>`;

    for (let i = Math.floor(minX); i <= Math.ceil(maxX); i++) {
        let px = cx + i * scale;
        if (px >= 0 && px <= width) svg += `<line x1="${px}" y1="0" x2="${px}" y2="${height}" stroke="#f1f5f9" stroke-width="1" />`;
    }
    for (let j = Math.floor(minY); j <= Math.ceil(maxY); j++) {
        let py = cy - j * scale;
        if (py >= 0 && py <= height) svg += `<line x1="0" y1="${py}" x2="${width}" y2="${py}" stroke="#f1f5f9" stroke-width="1" />`;
    }

    svg += `<line x1="0" y1="${cy}" x2="${width}" y2="${cy}" stroke="#64748b" stroke-width="1.5" />`;
    svg += `<line x1="${cx}" y1="0" x2="${cx}" y2="${height}" stroke="#64748b" stroke-width="1.5" />`;
    svg += `<text x="${width - 15}" y="${cy - 5}" font-size="12" fill="#64748b">x</text>`;
    svg += `<text x="${cx + 5}" y="15" font-size="12" fill="#64748b">y</text>`;

    // P, Q 点や変域の描画ロジックを共通化するヘルパー
    const renderRangeAndPoints = (calcY) => {
        if (x1 === undefined || x2 === undefined) return;
        let rangePath = "";
        let step = x1 <= x2 ? 0.05 : -0.05;
        for (let px_val = x1; (step > 0 ? px_val <= x2 : px_val >= x2); px_val += step) {
            if (funcType === "inverse" && Math.abs(px_val) < 0.05) continue;
            let py_val = calcY(px_val);
            if (py_val < minY - 2 || py_val > maxY + 2) continue;
            let sx = cx + px_val * scale;
            let sy = cy - py_val * scale;
            rangePath += rangePath === "" ? `M ${sx} ${sy} ` : `L ${sx} ${sy} `;
        }
        if (rangePath && funcType !== "secant") {
            svg += `<path d="${rangePath}" fill="none" stroke="#ef4444" stroke-width="2.5" marker-start="url(#arrow-start)" marker-end="url(#arrow)" />`;
        }

        [x1, x2].forEach((xVal, idx) => {
            if (funcType === "inverse" && Math.abs(xVal) < 0.05) return;
            let yVal = calcY(xVal);
            let sx = cx + xVal * scale;
            let sy = cy - yVal * scale;
            let label = idx === 0 ? "A" : "B";
            svg += `<circle cx="${sx}" cy="${sy}" r="4" fill="#2563eb" />`;
            svg += `<text x="${sx + 6}" y="${sy - 6}" font-size="11" fill="#2563eb" font-weight="bold">${label}</text>`;
        });
    };

    if (funcType === "quadratic") {
        let pathData = "";
        for (let px_val = minX - 1; px_val <= maxX + 1; px_val += 0.1) {
            let py_val = a * px_val * px_val;
            let sx = cx + px_val * scale;
            let sy = cy - py_val * scale;
            pathData += (px_val === minX - 1) ? `M ${sx} ${sy} ` : `L ${sx} ${sy} `;
        }
        svg += `<path d="${pathData}" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="5" />`;
        renderRangeAndPoints(px => a * px * px);

    } else if (funcType === "linear") {
        let sx1 = cx + minX * scale, sy1 = cy - (a * minX) * scale;
        let sx2 = cx + maxX * scale, sy2 = cy - (a * maxX) * scale;
        svg += `<line x1="${sx1}" y1="${sy1}" x2="${sx2}" y2="${sy2}" stroke="#2563eb" stroke-width="2" stroke-dasharray="5" />`;
        renderRangeAndPoints(px => a * px);

    } else if (funcType === "inverse") {
        const drawBranch = (fromX, toX) => {
            let pathData = "", started = false;
            for (let px_val = fromX; px_val <= toX; px_val += 0.05) {
                if (Math.abs(px_val) < 0.05) continue;
                let py_val = a / px_val;
                if (py_val < minY - 2 || py_val > maxY + 2) continue;
                let sx = cx + px_val * scale, sy = cy - py_val * scale;
                pathData += (!started) ? `M ${sx} ${sy} ` : `L ${sx} ${sy} `;
                started = true;
            }
            return pathData;
        };

        let pathLeft = drawBranch(minX - 1, -0.05);
        if (pathLeft) svg += `<path d="${pathLeft}" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="5" />`;
        let pathRight = drawBranch(0.05, maxX + 1);
        if (pathRight) svg += `<path d="${pathRight}" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="5" />`;

        renderRangeAndPoints(px => a / px);

    } else if (funcType === "secant") {
        // 放物線の描画
        let pathData = "";
        for (let px_val = minX - 1; px_val <= maxX + 1; px_val += 0.1) {
            let py_val = a * px_val * px_val;
            let sx = cx + px_val * scale;
            let sy = cy - py_val * scale;
            pathData += (px_val === minX - 1) ? `M ${sx} ${sy} ` : `L ${sx} ${sy} `;
        }
        svg += `<path d="${pathData}" fill="none" stroke="#2563eb" stroke-width="2" />`;

        // 直線ABの描画（傾き m, 切片 n）
        const m = arguments[4];
        const n = arguments[5];
        let sx1 = cx + minX * scale, sy1 = cy - (m * minX + n) * scale;
        let sx2 = cx + maxX * scale, sy2 = cy - (m * maxX + n) * scale;
        svg += `<line x1="${sx1}" y1="${sy1}" x2="${sx2}" y2="${sy2}" stroke="#ef4444" stroke-width="2" />`;

        // 点A, Bの描画
        renderRangeAndPoints(px => a * px * px);
    }

    return svg + `</svg>`;
}

const formulaData = {
    "数式": {
        "因数分解": {
            level: " 基礎",
            formula: "【因数分解の手順と方針】<br>" +
                     "① まずは共通因数でくくる。<br>" +
                     "② 4乗の式は 2乗の差の公式 \\(a^2 - b^2 = (a+b)(a-b)\\) を複数回利用する。<br>" +
                     "③ 複二次式（\\(x^4, x^2\\) のみ）は \\(x^2 = A\\) と置いて2次式として処理する。<br>" +
                     "④ 項を並び替えたり一部分をカタマリと見なしたりして（置き換え・平方完成など）因数分解を継続する。<br>" +
                     "⑤ 最低次の文字について降べきの順に整理する。",
            generateRandom: function() {
                const patterns = [
                    function() {
                        const a = Math.floor(Math.random() * 4) + 1;
                        const b = Math.floor(Math.random() * 4) + 1;
                        return {
                            problem: `次の式を因数分解しなさい：<br>\\( x^2 + ${a + b}x + ${a * b} \\)`,
                            explanation: `【解説】<br>かけて \\(${a * b}\\)、足して \\(${a + b}\\) になる2つの数 \\(${a}\\) と \\(${b}\\) を見つけます。<br>\\(= (x + ${a})(x + ${b})\\)`
                        };
                    },
                    function() {
                        const a = Math.random() < 0.5 ? 2 : 3, a2 = a * a, a4 = a2 * a2;
                        return {
                            problem: `次の式を因数分解しなさい：<br>\\( x^4 - ${a4} \\)`,
                            explanation: `【解説】<br>\\(a^2 - b^2 = (a+b)(a-b)\\) の公式を2回適用します。<br>\\(= (x^2 + ${a2})(x^2 - ${a2}) = (x^2 + ${a2})(x + ${a})(x - ${a})\\)`
                        };
                    },
                    function() {
                        return {
                            problem: "次の式を因数分解しなさい：<br>\\( x^4 - 5x^2 + 4 \\)",
                            explanation: "【解説】<br>\\( x^2 = A \\) と置くと、\\( A^2 - 5A + 4 = (A - 1)(A - 4) \\) となります。<br>\\( A = x^2 \\) を戻して、さらに因数分解します。<br>\\(= (x^2 - 1)(x^2 - 4) = (x + 1)(x - 1)(x + 2)(x - 2)\\)"
                        };
                    },
                    function() {
                        return {
                            problem: "次の式を因数分解しなさい：<br>\\( x^2 - y^2 - x - y \\)",
                            explanation: "【解説】<br>前半の \\( x^2 - y^2 \\) を因数分解し、共通因数を見出します。<br>\\(= (x + y)(x - y) - (x + y)\\)<br>共通因数 \\( (x + y) \\) でくくります。<br>\\(= (x + y)(x - y - 1)\\)"
                        };
                    },
                    function() {
                        return {
                            problem: "次の式を因数分解しなさい：<br>\\( a^2 - b^2 + 2b - 1 \\)",
                            explanation: "【解説】<br>後ろの \\( -b^2 + 2b - 1 \\) を \\( -(b^2 - 2b + 1) = -(b - 1)^2 \\) と変形します。<br>\\(= a^2 - (b - 1)^2\\)<br>2乗の差の公式 \\( X^2 - Y^2 = (X + Y)(X - Y) \\) を使います。<br>\\(= (a + (b - 1))(a - (b - 1)) = (a + b - 1)(a - b + 1)\\)"
                        };
                    }
                ];
                return patterns[Math.floor(Math.random() * patterns.length)]();
            },
            problem: "次の式を因数分解しなさい：<br>\\( x^2 - xy - 2xz - yz - 3z^2 \\)",
            explanation: "【解説】<br>次数が最も低い文字 \\( y \\) について整理します。<br>" +
                         "\\(= x^2 - 2xz - 3z^2 - xy - yz \\)<br>" +
                         "\\(= (x - 3z)(x + z) - y(x + z) \\)<br>" +
                         "\\(= (x + z)(x - 3z - y) \\)"
        },
        "展開の公式（特殊）": {
            level: "難関私立",
            formula: "【知っておくと速い展開の公式】<br>" +
                     "① \\( (a+b)^2 + (a-b)^2 = 2a^2 + 2b^2 \\)<br>" +
                     "② \\( (a+b)^2 - (a-b)^2 = 4ab \\)<br>" +
                     "③ \\( (a-b)^2 - (a+b)^2 = -4ab \\)",
            generateRandom: function() {
                const a = Math.floor(Math.random() * 5) + 2;
                const b = Math.floor(Math.random() * 4) + 1;
                return {
                    problem: `次の計算をしなさい：<br>\\( \\left(\\sqrt{${a}} + \\sqrt{${b}}\\right)^2 + \\left(\\sqrt{${a}} - \\sqrt{${b}}\\right)^2 \\)`,
                    explanation: `【解説】<br>1. 公式 \\( (a+b)^2 + (a-b)^2 = 2a^2 + 2b^2 \\) を適用します。<br>2. \\(= 2(\\sqrt{${a}})^2 + 2(\\sqrt{${b}})^2\\)<br>3. \\(= 2(${a}) + 2(${b})\\)<br>4. \\(= ${2*a} + ${2*b} = ${2*a + 2*b}\\)`
                };
            },
            problem: "次の計算をしなさい：<br>\\( \\left(\\sqrt{6} + \\sqrt{5}\\right)^2 + \\left(\\sqrt{6} - \\sqrt{5}\\right)^2 \\)",
            explanation: "【解説】<br>1. 公式 \\( (a+b)^2 + (a-b)^2 = 2a^2 + 2b^2 \\) を適用します。<br>" +
                         "2. \\(= 2(\\sqrt{6})^2 + 2(\\sqrt{5})^2\\)<br>" +
                         "3. \\(= 2(6) + 2(5) = 12 + 10 = 22 \\)"
        },
        "平方根の計算規則": {
            level: " 基礎",
            formula: "【平方根の基本】<br>" +
                     "・ \\( a \\) の平方根：2乗すると \\( a \\) になる数<br>" +
                     "・ 大小比較：ルートがあるものとないものは、すべて2乗して比較する。<br>" +
                     "・ 整数部分と小数部分：数 \\( a \\) が \\( n < a < n+1 \\) のとき、整数部分は \\( n \\)、小数部分は \\( a - n \\)。<br><br>" +
                     "【平方根の計算規則】<br>" +
                     "① \\(\\sqrt{a} \\times \\sqrt{b} = \\sqrt{ab} \\)<br>" +
                     "② \\(\\frac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\frac{a}{b}} \\)<br>" +
                     "③ 分母の有理化：\\(\\frac{a}{\\sqrt{b}} = \\frac{a\\sqrt{b}}{b} \\)<br>" +
                     "④ 加減は同類項として係数をまとめる。",
            generateRandom: function() {
                const list = [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 21, 22, 23, 24];
                const n = list[Math.floor(Math.random() * list.length)];
                let lowerInt = 1;
                while ((lowerInt + 1) * (lowerInt + 1) <= n) lowerInt++;
                const upperInt = lowerInt + 1;
                return {
                    problem: `次の \\(\\sqrt{${n}} \\) の整数部分と小数部分を求めなさい。`,
                    explanation: `【解説】<br>1. \\( ${lowerInt}^2 = ${lowerInt*lowerInt} \\)、\\( ${upperInt}^2 = ${upperInt*upperInt} \\) です。<br>2. したがって、\\( ${lowerInt} < \\sqrt{${n}} < ${upperInt} \\) が成り立ちます。<br>3. よって、整数部分は \\( ${lowerInt} \\)、小数部分は \\( \\sqrt{${n}} - ${lowerInt} \\) となります。`
                };
            },
            problem: "次の \\(\\sqrt{15} \\) の整数部分と小数部分を求めなさい。",
            explanation: "【解説】<br>1. \\( 3^2 = 9 \\)、\\( 4^2 = 16 \\) です。<br>" +
                         "2. したがって、\\( 3 < \\sqrt{15} < 4 \\) が成り立ちます。<br>" +
                         "3. よって、整数部分は \\( 3 \\)、小数部分は \\( \\sqrt{15} - 3 \\) となります。"
        },
        
        "平方根の有理化": {
            level: "★★ 難関私立",
            formula: "【分母が2項・3項式の場合の有理化】<br>" +
                     "・ 2項式：和と差の積の公式 \\( (a+b)(a-b) = a^2 - b^2 \\) を利用する。<br>" +
                     "・ 3項式：まず1つのカタマリとみなし、公式を2回利用して順番に有理化する。",
            generateRandom: function() {
                const gcd = (x, y) => (y === 0 ? x : gcd(y, x % y));
                const isThreeTerms = Math.random() < 0.3;
                
                if (isThreeTerms) {
                    const threeTermPatterns = [
                        {
                            problem: "\\frac{1}{1 + \\sqrt{2} + \\sqrt{3}}",
                            explanation: "【解説】<br>1. 分母の \\(1 + \\sqrt{2}\\) をひとつのカタマリとみなします。<br>" +
                                         "2. 分子・分母に \\((1 + \\sqrt{2}) - \\sqrt{3}\\) を掛けます。<br>" +
                                         "　\\(= \\frac{(1 + \\sqrt{2}) - \\sqrt{3}}{((1 + \\sqrt{2}) + \\sqrt{3})((1 + \\sqrt{2}) - \\sqrt{3})}\\)<br>" +
                                         "3. 分母を計算します。<br>" +
                                         "　\\(= \\frac{1 + \\sqrt{2} - \\sqrt{3}}{(1 + \\sqrt{2})^2 - 3} = \\frac{1 + \\sqrt{2} - \\sqrt{3}}{1 + 2\\sqrt{2} + 2 - 3} = \\frac{1 + \\sqrt{2} - \\sqrt{3}}{2\\sqrt{2}}\\)<br>" +
                                         "4. さらに分母・分子に \\(\\sqrt{2}\\) を掛けて有理化します。<br>" +
                                         "　\\(= \\frac{\\sqrt{2}(1 + \\sqrt{2} - \\sqrt{3})}{2 \\times 2} = \\frac{\\sqrt{2} + 2 - \\sqrt{6}}{4} = \\frac{2 + \\sqrt{2} - \\sqrt{6}}{4}\\)"
                        },
                        {
                            problem: "\\frac{2}{1 + \\sqrt{2} + \\sqrt{3}}",
                            explanation: "【解説】<br>1. 分母の \\(1 + \\sqrt{2}\\) をひとつのカタマリとみなします。<br>" +
                                         "2. 分子・分母に \\((1 + \\sqrt{2}) - \\sqrt{3}\\) を掛けます。<br>" +
                                         "　\\(= \\frac{2((1 + \\sqrt{2}) - \\sqrt{3})}{((1 + \\sqrt{2}) + \\sqrt{3})((1 + \\sqrt{2}) - \\sqrt{3})} = \\frac{2(1 + \\sqrt{2} - \\sqrt{3})}{2\\sqrt{2}} = \\frac{1 + \\sqrt{2} - \\sqrt{3}}{\\sqrt{2}}\\)<br>" +
                                         "3. 分母・分子に \\(\\sqrt{2}\\) を掛けて有理化します。<br>" +
                                         "　\\(= \\frac{\\sqrt{2}(1 + \\sqrt{2} - \\sqrt{3})}{2} = \\frac{\\sqrt{2} + 2 - \\sqrt{6}}{2} = \\frac{2 + \\sqrt{2} - \\sqrt{6}}{2}\\)"
                        },
                        {
                            problem: "\\frac{1}{\\sqrt{2} + \\sqrt{3} + \\sqrt{5}}",
                            explanation: "【解説】<br>1. 分母の \\(\\sqrt{2} + \\sqrt{3}\\) をひとつのカタマリとみなします。<br>" +
                                         "2. 分子・分母に \\((\\sqrt{2} + \\sqrt{3}) - \\sqrt{5}\\) を掛けます。<br>" +
                                         "　\\(= \\frac{(\\sqrt{2} + \\sqrt{3}) - \\sqrt{5}}{(\\sqrt{2} + \\sqrt{3})^2 - 5} = \\frac{\\sqrt{2} + \\sqrt{3} - \\sqrt{5}}{2 + 2\\sqrt{6} + 3 - 5} = \\frac{\\sqrt{2} + \\sqrt{3} - \\sqrt{5}}{2\\sqrt{6}}\\)<br>" +
                                         "3. さらに分母・分子に \\(\\sqrt{6}\\) を掛けて有理化します。<br>" +
                                         "　\\(= \\frac{\\sqrt{6}(\\sqrt{2} + \\sqrt{3} - \\sqrt{5})}{12} = \\frac{2\\sqrt{3} + 3\\sqrt{2} - \\sqrt{30}}{12}\\)"
                        },
                        {
                            problem: "\\frac{\\sqrt{6}}{\\sqrt{2} + \\sqrt{3} + \\sqrt{5}}",
                            explanation: "【解説】<br>1. 分母の \\(\\sqrt{2} + \\sqrt{3}\\) をひとつのカタマリとみなします。<br>" +
                                         "2. 分子・分母に \\((\\sqrt{2} + \\sqrt{3}) - \\sqrt{5}\\) を掛けます。<br>" +
                                         "　\\(= \\frac{\\sqrt{6}((\\sqrt{2} + \\sqrt{3}) - \\sqrt{5})}{2\\sqrt{6}} = \\frac{\\sqrt{2} + \\sqrt{3} - \\sqrt{5}}{2}\\)"
                        },
                        {
                            problem: "\\frac{1}{1 - \\sqrt{2} + \\sqrt{3}}",
                            explanation: "【解説】<br>1. 分母の \\(1 - \\sqrt{2}\\) をひとつのカタマリとみなします。<br>" +
                                         "2. 分子・分母に \\((1 - \\sqrt{2}) - \\sqrt{3}\\) を掛けます。<br>" +
                                         "　\\(= \\frac{(1 - \\sqrt{2}) - \\sqrt{3}}{(1 - \\sqrt{2})^2 - 3} = \\frac{1 - \\sqrt{2} - \\sqrt{3}}{-2\\sqrt{2}}\\)<br>" +
                                         "3. 分母・分子に \\(\\sqrt{2}\\) を掛けてマイナスを整理します。<br>" +
                                         "　\\(= \\frac{\\sqrt{2}(\\sqrt{2} - 1 + \\sqrt{3})}{4} = \\frac{2 - \\sqrt{2} + \\sqrt{6}}{4}\\)"
                        },
                        {
                            problem: "\\frac{1}{1 + \\sqrt{2} - \\sqrt{3}}",
                            explanation: "【解説】<br>1. 分母の \\(1 + \\sqrt{2}\\) をひとつのカタマリとみなします。<br>" +
                                         "2. 分子・分母に \\((1 + \\sqrt{2}) + \\sqrt{3}\\) を掛けます。<br>" +
                                         "　\\(= \\frac{(1 + \\sqrt{2}) + \\sqrt{3}}{(1 + \\sqrt{2})^2 - 3} = \\frac{1 + \\sqrt{2} + \\sqrt{3}}{2\\sqrt{2}}\\)<br>" +
                                         "3. さらに分母・分子に \\(\\sqrt{2}\\) を掛けて有理化します。<br>" +
                                         "　\\(= \\frac{\\sqrt{2}(1 + \\sqrt{2} + \\sqrt{3})}{4} = \\frac{2 + \\sqrt{2} + \\sqrt{6}}{4}\\)"
                        },
                        {
                            problem: "\\frac{2}{1 + \\sqrt{2} - \\sqrt{3}}",
                            explanation: "【解説】<br>1. 分母の \\(1 + \\sqrt{2}\\) をひとつのカタマリとみなします。<br>" +
                                         "2. 分子・分母に \\((1 + \\sqrt{2}) + \\sqrt{3}\\) を掛けます。<br>" +
                                         "　\\(= \\frac{2((1 + \\sqrt{2}) + \\sqrt{3})}{2\\sqrt{2}} = \\frac{1 + \\sqrt{2} + \\sqrt{3}}{\\sqrt{2}}\\)<br>" +
                                         "3. さらに分母・分子に \\(\\sqrt{2}\\) を掛けて有理化します。<br>" +
                                         "　\\(= \\frac{\\sqrt{2}(1 + \\sqrt{2} + \\sqrt{3})}{2} = \\frac{2 + \\sqrt{2} + \\sqrt{6}}{2}\\)"
                        },
                        {
                            problem: "\\frac{1}{\\sqrt{3} + \\sqrt{5} - \\sqrt{2}}",
                            explanation: "【解説】<br>1. 分母の \\(\\sqrt{3} + \\sqrt{5}\\) をひとつのカタマリとみなします。<br>" +
                                         "2. 分子・分母に \\((\\sqrt{3} + \\sqrt{5}) + \\sqrt{2}\\) を掛けます。<br>" +
                                         "　\\(= \\frac{(\\sqrt{3} + \\sqrt{5}) + \\sqrt{2}}{(\\sqrt{3} + \\sqrt{5})^2 - 2} = \\frac{\\sqrt{2} + \\sqrt{3} + \\sqrt{5}}{6 + 2\\sqrt{15}}\\)<br>" +
                                         "3. さらに分母・分子に \\(6 - 2\\sqrt{15}\\) を掛けて有理化します。<br>" +
                                         "　\\(= \\frac{-3\\sqrt{2} + 2\\sqrt{3} + \\sqrt{30}}{12}\\)"
                        },
                        {
                            problem: "\\frac{1}{2 + \\sqrt{2} + \\sqrt{6}}",
                            explanation: "【解説】<br>1. 分母の \\(2 + \\sqrt{2}\\) をひとつのカタマリとみなします。<br>" +
                                         "2. 分子・分母に \\((2 + \\sqrt{2}) - \\sqrt{6}\\) を掛けます。<br>" +
                                         "　\\(= \\frac{2 + \\sqrt{2} - \\sqrt{6}}{(2 + \\sqrt{2})^2 - 6} = \\frac{2 + \\sqrt{2} - \\sqrt{6}}{4\\sqrt{2}}\\)<br>" +
                                         "3. 分母・分子に \\(\\sqrt{2}\\) を掛けて有理化します。<br>" +
                                         "　\\(= \\frac{1 + \\sqrt{2} - \\sqrt{3}}{4}\\)"
                        },
                        {
                            problem: "\\frac{4}{2 + \\sqrt{2} + \\sqrt{6}}",
                            explanation: "【解説】<br>1. 分母の \\(2 + \\sqrt{2}\\) をひとつのカタマリとみなします。<br>" +
                                         "2. 分子・分母に \\((2 + \\sqrt{2}) - \\sqrt{6}\\) を掛けます。<br>" +
                                         "　\\(= \\frac{4((2 + \\sqrt{2}) - \\sqrt{6})}{4\\sqrt{2}} = \\frac{2 + \\sqrt{2} - \\sqrt{6}}{\\sqrt{2}}\\)<br>" +
                                         "3. 分母・分子に \\(\\sqrt{2}\\) を掛けて有理化します。<br>" +
                                         "　\\(= 1 + \\sqrt{2} - \\sqrt{3}\\)"
                        }
                    ];
                    const selectedPattern = threeTermPatterns[Math.floor(Math.random() * threeTermPatterns.length)];
                    return {
                        level: "難関私立",
                        problem: `次の分数の分母を有理化しなさい：<br>\\( ${selectedPattern.problem} \\)`,
                        explanation: selectedPattern.explanation
                    };
                } else {
                    const nonSquares = [
                        { val: 2, base: 2, simplified: "\\sqrt{2}", canSimplify: false },
                        { val: 3, base: 3, simplified: "\\sqrt{3}", canSimplify: false },
                        { val: 5, base: 5, simplified: "\\sqrt{5}", canSimplify: false },
                        { val: 6, base: 6, simplified: "\\sqrt{6}", canSimplify: false },
                        { val: 7, base: 7, simplified: "\\sqrt{7}", canSimplify: false },
                        { val: 8, base: 2, orig: "\\sqrt{8}", simplified: "2\\sqrt{2}", canSimplify: true },
                        { val: 12, base: 3, orig: "\\sqrt{12}", simplified: "2\\sqrt{3}", canSimplify: true }
                    ];
                    
                    let itemA, itemB;
                    do {
                        itemA = nonSquares[Math.floor(Math.random() * nonSquares.length)];
                        itemB = nonSquares[Math.floor(Math.random() * nonSquares.length)];
                    } while (itemA.val === itemB.val || itemA.base === itemB.base || itemA.val <= itemB.val);

                    const sign = Math.random() < 0.5 ? "+" : "-";
                    const opSign = sign === "+" ? "-" : "+";
                    const k = Math.floor(Math.random() * 3) + 1;
                    const denom = itemA.val - itemB.val;

                    let probAStr = itemA.canSimplify ? itemA.orig : itemA.simplified;
                    let probBStr = itemB.canSimplify ? itemB.orig : itemB.simplified;

                    let explanationText = "【解説】<br>";
                    let stepNum = 1;
                    if (itemA.canSimplify || itemB.canSimplify) {
                        let simplifyParts = [];
                        if (itemA.canSimplify) simplifyParts.push(`\\(${itemA.orig} = ${itemA.simplified}\\)`);
                        if (itemB.canSimplify) simplifyParts.push(`\\(${itemB.orig} = ${itemB.simplified}\\)`);
                        explanationText += `${stepNum}. まず、根号を簡単にします（${simplifyParts.join("、")}）。<br>　\\(\\frac{${k}}{${itemA.simplified} ${sign} ${itemB.simplified}}\\)<br>`;
                        stepNum++;
                    }

                    let step1 = k === 1 ? `\\frac{${itemA.simplified} ${opSign} ${itemB.simplified}}{(${itemA.simplified} ${sign} ${itemB.simplified})(${itemA.simplified} ${opSign} ${itemB.simplified})}` : `\\frac{${k}(${itemA.simplified} ${opSign} ${itemB.simplified})}{(${itemA.simplified} ${sign} ${itemB.simplified})(${itemA.simplified} ${opSign} ${itemB.simplified})}`;
                    let step2 = k === 1 ? `\\frac{${itemA.simplified} ${opSign} ${itemB.simplified}}{${denom}}` : `\\frac{${k}(${itemA.simplified} ${opSign} ${itemB.simplified})}{${denom}}`;
                    
                    explanationText += `${stepNum}. 分母・分子に \\( ${itemA.simplified} ${opSign} ${itemB.simplified} \\) をかけます。<br>　\\(= ${step1} \\)<br>`;
                    stepNum++;
                    explanationText += `${stepNum}. 分母の公式 \\((a+b)(a-b) = a^2 - b^2\\) を計算します。<br>　\\(= ${step2} \\)`;
                    
                    const parseTerm = (item, kVal) => ({
                        coeff: item.canSimplify ? 2 * kVal : kVal,
                        radical: item.canSimplify ? item.simplified.replace("2", "") : item.simplified
                    });
                    
                    let termAInfo = parseTerm(itemA, k);
                    let termBInfo = parseTerm(itemB, k);
                    let strA = `${termAInfo.coeff === 1 ? "" : termAInfo.coeff}${termAInfo.radical}`;
                    let strB = `${termBInfo.coeff === 1 ? "" : termBInfo.coeff}${termBInfo.radical}`;
                    let expandedNumerator = `${strA} ${opSign} ${strB}`;

                    if (k > 1) {
                        stepNum++;
                        explanationText += `<br>${stepNum}. 分子に分配法則を適用して括弧を外します。<br>　\\(= \\frac{${expandedNumerator}}{${denom}}\\)`;
                    }

                    let common = gcd(gcd(termAInfo.coeff, termBInfo.coeff), denom);
                    let redCoeffA = termAInfo.coeff / common, redCoeffB = termBInfo.coeff / common, redDenom = denom / common;
                    let redStrA = `${redCoeffA === 1 ? "" : redCoeffA}${termAInfo.radical}`;
                    let redStrB = `${redCoeffB === 1 ? "" : redCoeffB}${termBInfo.radical}`;
                    let finalNumeratorStr = `${redStrA} ${opSign} ${redStrB}`;
                    let finalExpr = redDenom === 1 ? finalNumeratorStr : `\\frac{${finalNumeratorStr}}{${redDenom}}`;

                    if (common > 1) {
                        stepNum++;
                        explanationText += `<br>${stepNum}. 分母と分子を \\(${common}\\) で約分します。<br>　\\(= ${finalExpr} \\)`;
                    } else if (redDenom === 1) {
                        stepNum++;
                        explanationText += `<br>${stepNum}. 分母が \\(1\\) になるため、整理します。<br>　\\(= ${finalExpr} \\)`;
                    }

                    return {
                        level: "難関私立",
                        problem: `次の分数の分母を有理化しなさい：<br>\\( \\frac{${k}}{${probAStr} ${sign} ${probBStr}} \\)`,
                        explanation: explanationText
                    };
                }
            },
            problem: "次の分数の分母を有理化しなさい：<br>\\(\\frac{2}{\\sqrt{7} + \\sqrt{3}} \\)",
            explanation: "【解説】<br>1. 分母・分子に \\(\\sqrt{7} - \\sqrt{3} \\) をかけます。<br>" +
                         "2. 分母の \\((\\sqrt{7} + \\sqrt{3})(\\sqrt{7} - \\sqrt{3})\\) を計算します（\\(7 - 3 = 4\\)）。<br>" +
                         "3. \\(= \\frac{2(\\sqrt{7} - \\sqrt{3})}{4} \\)<br>" +
                         "4. 分母と分子を \\(2\\) で約分します。<br>" +
                         "5. \\(= \\frac{\\sqrt{7} - \\sqrt{3}}{2} \\)"
        },
        "平方根を含む連立方程式": {
            level: "難関私立",
            formula: "【平方根を含む連立方程式の基本方針】<br>" +
                     "・ \\(x\\) と \\(y\\) の両方に \\(\\sqrt{}\\) が含まれる連立方程式は、**適切な倍数をかけて係数をそろえ、加減法を2回行う**のが基本。<br>" +
                     "・ \\(x\\) を消去する手順と \\(y\\) を消去する手順をそれぞれ行えるように、共通の \\(\\sqrt{}\\) を作り出す工夫をする。",
            generateRandom: function() {
                const roots = [2, 3, 5, 6, 7];
                let idx1 = Math.floor(Math.random() * roots.length), idx2;
                do { idx2 = Math.floor(Math.random() * roots.length); } while (idx2 === idx1);

                const r1 = roots[idx1], r2 = roots[idx2];
                const product = r1 * r2, sum = r1 + r2;

                return {
                    problem: `次の連立方程式を解きなさい：<br>\\( \\begin{cases} \\sqrt{${r1}}x + \\sqrt{${r2}}y = 2\\sqrt{${product}} \\\\ \\sqrt{${r2}}x + \\sqrt{${r1}}y = ${sum} \\end{cases} \\)`,
                    explanation: "【解説】<br>" +
                                 "<strong>① \\(x\\) を消去する場合：</strong><br>" +
                                 `1. 上の式に \\(\\sqrt{${r2}}\\) 、下の式に \\(\\sqrt{${r1}}\\) をそれぞれかけます。<br>` +
                                 `2. 引き算を行って \\(x\\) を消去すると、\\(y = \\sqrt{${r1}}\\) が求まります。<br>` +
                                 "<strong>② \\(y\\) を消去する場合：</strong><br>" +
                                 `3. 上の式に \\(\\sqrt{${r1}}\\) 、下の式に \\(\\sqrt{${r2}}\\) をそれぞれかけます。<br>` +
                                 `4. 引き算を行って \\(y\\) を消去すると、\\(x = \\sqrt{${r2}}\\) が求まります。<br>` +
                                 `5. したがって、解は \\( \\mathbf{x = \\sqrt{${r2}}, y = \\sqrt{${r1}}} \\) です。`
                };
            },
            problem: "次の連立方程式を解きなさい：<br>\\(\\begin{cases} \\sqrt{2}x + \\sqrt{3}y = 5 \\\\ \\sqrt{3}x + \\sqrt{2}y = 2\\sqrt{6} \\end{cases} \\)",
            explanation: "【解説】<br>" +
                         "1. 上の式に \\(\\sqrt{3}\\)、下の式に \\(\\sqrt{2}\\) をかけて \\(x\\) の係数をそろえます。<br>" +
                         "　\\(\\sqrt{6}x + 3y = 5\\sqrt{3}\\) … ①<br>" +
                         "　\\(\\sqrt{6}x + 2y = 4\\sqrt{3}\\) … ②<br>" +
                         "2. ① - ② より、\\(y = \\sqrt{3} \\) と求まります。<br>" +
                         "3. これを元の式に代入して \\(x\\) を求めます。<br>" +
                         "　\\(\\sqrt{2}x + 3 = 5 \\implies \\sqrt{2}x = 2 \\implies x = \\sqrt{2}\\)<br>" +
                         "4. したがって、解は \\(\\mathbf{x = \\sqrt{2}, y = \\sqrt{3}} \\) です。"
        },
        "分母に文字を含む連立方程式": {
            level: "★★ 難関私立",
            formula: "【分母に文字を含む連立方程式の方針】<br>" +
                     "分母に文字の入った連立方程式などは、分数をまるごと \\(A\\) や \\(B\\) で置き換える。<br>" +
                     "1. \\(\\frac{1}{x+y} = A\\)、\\(\\frac{1}{x-y} = B\\) とおく。<br>" +
                     "2. \\(A, B\\) についての連立方程式を解き、それぞれの値を求める。<br>" +
                     "3. 求まった値から \\(x+y\\)、\\(x-y\\) の値を導き、さらに \\(x, y\\) の連立方程式として解く。",
            generateRandom: function() {
                const patterns = [
                    {
                        eq1: "\\frac{1}{x+y} + \\frac{1}{x-y} = \\frac{4}{3}",
                        eq2: "\\frac{2}{x+y} - \\frac{1}{x-y} = -\\frac{1}{3}",
                        expl: "1. \\(\\frac{1}{x+y} = A\\)、\\(\\frac{1}{x-y} = B\\) と置きます。<br>　\\(\\begin{cases} A + B = \\frac{4}{3} \\\\ 2A - B = -\\frac{1}{3} \\end{cases}\\)<br>2. 両者を足し合わせると \\(3A = 1 \\implies A = \\frac{1}{3}\\) となり、代入して \\(B = 1\\) を得ます。<br>3. \\(\\frac{1}{x+y} = \\frac{1}{3}\\)、\\(\\frac{1}{x-y} = 1\\) より、<br>　\\(\\begin{cases} x+y = 3 \\\\ x-y = 1 \\end{cases}\\)<br>4. これを解いて、\\(\\mathbf{x = 2, y = 1}\\) と求まります。"
                    },
                    {
                        eq1: "\\frac{2}{x+y} + \\frac{1}{x-y} = \\frac{7}{6}",
                        eq2: "\\frac{1}{x+y} + \\frac{3}{x-y} = \\frac{11}{6}",
                        expl: "1. \\(\\frac{1}{x+y} = A\\)、\\(\\frac{1}{x-y} = B\\) と置きます。<br>　\\(\\begin{cases} 2A + B = \\frac{7}{6} \\\\ A + 3B = \\frac{11}{6} \\end{cases}\\)<br>2. 連立方程式を解いて \\(A = \\frac{1}{4}\\)、\\(B = \\frac{1}{2}\\) を得ます。<br>3. \\(\\frac{1}{x+y} = \\frac{1}{4}\\)、\\(\\frac{1}{x-y} = \\frac{1}{2}\\) より、<br>　\\(\\begin{cases} x+y = 4 \\\\ x-y = 2 \\end{cases}\\)<br>4. これを解いて、\\(\\mathbf{x = 3, y = 1}\\) と求まります。"
                    },
                    {
                        eq1: "\\frac{3}{x+y} + \\frac{2}{x-y} = 2",
                        eq2: "\\frac{1}{x+y} - \\frac{1}{x-y} = -\\frac{1}{2}",
                        expl: "1. \\(\\frac{1}{x+y} = A\\)、\\(\\frac{1}{x-y} = B\\) と置きます。<br>　\\(\\begin{cases} 3A + 2B = 2 \\\\ A - B = -\\frac{1}{2} \\end{cases}\\)<br>2. 連立方程式を解いて \\(A = \\frac{1}{5}\\)、\\(B = \\frac{1}{2}\\) を得ます。<br>3. \\(\\frac{1}{x+y} = \\frac{1}{5}\\)、\\(\\frac{1}{x-y} = \\frac{1}{2}\\) より、<br>　\\(\\begin{cases} x+y = 5 \\\\ x-y = 2 \\end{cases}\\)<br>4. これを解いて、\\(\\mathbf{x = \\frac{7}{2}, y = \\frac{3}{2}}\\) と求まります。"
                    }
                ];
                const selected = patterns[Math.floor(Math.random() * patterns.length)];
                return {
                    problem: `次の連立方程式を解きなさい：<br>\\( \\begin{cases} ${selected.eq1} \\\\ ${selected.eq2} \\end{cases} \\)`,
                    explanation: `【解説】<br>${selected.expl}`
                };
            },
            problem: "次の連立方程式を解きなさい：<br>\\(\\begin{cases} \\frac{1}{x+y} + \\frac{1}{x-y} = \\frac{4}{3} \\\\ \\frac{2}{x+y} - \\frac{1}{x-y} = -\\frac{1}{3} \\end{cases} \\)",
            explanation: "【解説】<br>1. \\(\\frac{1}{x+y} = A\\)、\\(\\frac{1}{x-y} = B\\) と置きます。<br>" +
                         "　\\(\\begin{cases} A + B = \\frac{4}{3} \\\\ 2A - B = -\\frac{1}{3} \\end{cases}\\)<br>" +
                         "2. 両者を足すと \\(3A = 1 \\implies A = \\frac{1}{3}\\)。これを代入して \\(B = 1\\) を得ます。<br>" +
                         "3. \\(\\frac{1}{x+y} = \\frac{1}{3}\\)、\\(\\frac{1}{x-y} = 1\\) より、<br>" +
                         "　\\(\\begin{cases} x+y = 3 \\\\ x-y = 1 \\end{cases}\\)<br>" +
                         "4. これを解いて、\\(\\mathbf{x = 2, y = 1}\\) と求まります。"
        },
        "対称式": {
            level: "公立",
            formula: "【対称式と基本対称式】<br>" +
                     "・ \\( x, y \\) を入れ替えても同じになる式を対称式という。<br>" +
                     "・ すべての対称式は、基本対称式（ \\( x+y \\) と \\( xy \\) ）の組み合わせで表せる。<br>" +
                     "・ 求値問題は、変形してから代入するのが原則。<br>" +
                     "　(1) \\( x^2 + y^2 = (x+y)^2 - 2xy \\)<br>" +
                     "　(2) \\( x^2 - xy + y^2 = (x+y)^2 - 3xy \\)<br>" +
                     "　(3) \\(x^3 + y^3 = (x+y)^3 - 3xy(x+y) \\)<br>" +
                     "　(4) \\(x^2y + xy^2 = xy(x+y) \\)",
            generateRandom: function() {
                const patterns = [
                    {
                        problem: " \\(x = \\frac{\\sqrt{7}-\\sqrt{3}}{2}, y = \\frac{\\sqrt{7}+\\sqrt{3}}{2} \\) のとき、\\( x^2 - xy + y^2 \\) の値を求めなさい。",
                        explanation: "【解説】<br>1. まず基本対称式を求めます。<br>　\\(x + y = \\sqrt{7} \\)、\\( xy = 1 \\)<br>2. 式を変形します。<br>　\\( x^2 - xy + y^2 = (x+y)^2 - 3xy \\)<br>3. 代入して計算します。<br>　\\(= (\\sqrt{7})^2 - 3(1) = 7 - 3 = 4 \\)"
                    },
                    {
                        problem: " \\(x = \\sqrt{3} + \\sqrt{2}, y = \\sqrt{3} - \\sqrt{2} \\) のとき、\\( x^2 + y^2 \\) の値を求めなさい。",
                        explanation: "【解説】<br>1. まず基本対称式を求めます。<br>　\\(x + y = 2\\sqrt{3} \\)、\\( xy = 1 \\)<br>2. 式を変形します。<br>　\\( x^2 + y^2 = (x+y)^2 - 2xy \\)<br>3. 代入して計算します。<br>　\\(= (2\\sqrt{3})^2 - 2(1) = 12 - 2 = 10 \\)"
                    },
                    {
                        problem: " \\(x = \\frac{\\sqrt{5}-1}{2}, y = \\frac{\\sqrt{5}+1}{2} \\) のとき、\\( x^2 + y^2 \\) の値を求めなさい。",
                        explanation: "【解説】<br>1. まず基本対称式を求めます。<br>　\\(x + y = \\sqrt{5} \\)、\\( xy = 1 \\)<br>2. 式を変形します。<br>　\\( x^2 + y^2 = (x+y)^2 - 2xy \\)<br>3. 代入して計算します。<br>　\\(= (\\sqrt{5})^2 - 2(1) = 5 - 2 = 3 \\)"
                    },
                    {
                        problem: " \\(x = \\sqrt{3} + \\sqrt{2}, y = \\sqrt{3} - \\sqrt{2} \\) のとき、\\( x^3 + y^3 \\) の値を求めなさい。",
                        explanation: "【解説】<br>1. まず基本対称式を求めます。<br>　\\(x + y = 2\\sqrt{3} \\)、\\( xy = 1 \\)<br>2. 式を変形します。<br>　\\(x^3 + y^3 = (x+y)^3 - 3xy(x+y) \\)<br>3. 代入して計算します。<br>　\\(= (2\\sqrt{3})^3 - 3(1)(2\\sqrt{3}) = 24\\sqrt{3} - 6\\sqrt{3} = 18\\sqrt{3} \\)"
                    },
                    {
                        problem: " \\(x = 2 + \\sqrt{3}, y = 2 - \\sqrt{3} \\) のとき、\\( x^2y + xy^2 \\) の値を求めなさい。",
                        explanation: "【解説】<br>1. まず基本対称式を求めます。<br>　\\( x + y = 4 \\)、\\( xy = 1 \\)<br>2. 共通因数でくくって変形します。<br>　\\(x^2y + xy^2 = xy(x+y) \\)<br>3. 代入して計算します。<br>　\\(= 1 \\times 4 = 4 \\)"
                    }
                ];
                return patterns[Math.floor(Math.random() * patterns.length)];
            },
            problem: " \\(x = \\frac{\\sqrt{7}-\\sqrt{3}}{2}, y = \\frac{\\sqrt{7}+\\sqrt{3}}{2} \\) のとき、\\( x^2 - xy + y^2 \\) の値を求めなさい。",
            explanation: "【解説】<br>1. まず基本対称式を求めます。<br>" +
                         "　\\(x + y = \\sqrt{7} \\)、\\( xy = 1 \\)<br>" +
                         "2. 式を変形します。<br>" +
                         "　\\( x^2 - xy + y^2 = (x+y)^2 - 3xy \\)<br>" +
                         "3. 代入して計算します。<br>" +
                         "　\\(= (\\sqrt{7})^2 - 3(1) = 7 - 3 = 4 \\)"
        },
        "２次方程式の計算法": {
            level: "基礎",
            formula: "【2次方程式の解き方4選】<br>" +
                     "① \\( (文字式)^2 = (数字) \\) の形に持ち込む<br>" +
                     "② 平方完成を利用する<br>" +
                     "③ 解の公式を使う：\\(x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\)<br>" +
                     "④ 因数分解を利用する",
            generateRandom: function() {
                const a = Math.floor(Math.random() * 3) + 1;
                const b = Math.floor(Math.random() * 6) + 1;
                const c = -(Math.floor(Math.random() * 4) + 1);
                const D = b*b - 4*a*c;
                const aStr = a === 1 ? "" : a;
                return {
                    problem: `2次方程式 \\( ${aStr}x^2 + ${b}x ${c < 0 ? "- " + Math.abs(c) : "+ " + c} = 0 \\) を解きなさい。`,
                    explanation: `【解説】<br>1. \\( a=${a}, b=${b}, c=${c} \\) を確認します。<br>2. 解の公式に代入します。<br>　\\(x = \frac{-${b} \\pm \\sqrt{${b}^2 - 4 \\times ${a} \\times (${c})}}{2 \\times ${a}}\\<br>3. 計算して整理します。<br>　\\(= \\frac{-${b} \\pm \\sqrt{${D}}}{${2*a}} \\)`
                };
            },
            problem: "2次方程式 \\( 4x^2 + 5x - 3 = 0 \\) を解きなさい。",
            explanation: "【解説】<br>1. \\( a=4, b=5, c=-3 \\) を確認します。<br>" +
                         "2. 解の公式に代入します。<br>" +
                         "　\\(x = \\frac{-5 \\pm \\sqrt{5^2 - 4 \\times 4 \\times (-3)}}{2 \\times 4}\\)<br>" +
                         "3. 中を計算します。<br>" +
                         "　\\(= \\frac{-5 \\pm \\sqrt{25 + 48}}{8} = \\frac{-5 \\pm \\sqrt{73}}{8} \\)"
        },
        "２次方程式の解と係数の関係": {
            level: "難関私立",
            formula: "【解と係数の関係】<br>" +
                     "2次方程式 \\( ax^2 + bx + c = 0 \\) の2つの解を \\(\\alpha, \\beta \\) とするとき、<br>" +
                     "・ \\(\\alpha + \\beta = -\\frac{b}{a} \\)<br>" +
                     "・ \\(\\alpha\\beta = \\frac{c}{a} \\)",
            generateRandom: function() {
                const sum = -(Math.floor(Math.random() * 4) + 1);
                const prod = Math.floor(Math.random() * 5) - 2;
                return {
                    problem: `2次方程式 \\( x^2 ${sum >= 0 ? "+ " + sum : "- " + Math.abs(sum)}x ${prod >= 0 ? "+ " + prod : "- " + Math.abs(prod)} = 0 \\) の２つの解を \\(\\alpha, \\beta \\) とするとき、\\( \\alpha^2 + \\beta^2 \\) の値を求めなさい。`,
                    explanation: `【解説】<br>1. 解と係数の関係より、\\( \\alpha + \\beta = ${-sum} \\)、\\(\\alpha\\beta = ${prod} \\) です。<br>2. 式を変形します。<br>　\\( \\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2 - 2\\alpha\\beta \\)<br>3. 代入して計算します。<br>　\\(= (${-sum})^2 - 2(${prod}) = ${(-sum)*(-sum) - 2*prod} \\)`
                };
            },
            problem: "2次方程式 \\( 2x^2 + 2x - 3 = 0 \\) の2つの解を \\(\\alpha, \\beta \\) とするとき、\\( \\alpha^2 + \\beta^2 \\) の値を求めなさい。",
            explanation: "【解説】<br>1. 解と係数の関係より、\\( \\alpha + \\beta = -1 \\)、\\(\\alpha\\beta = -\\frac{3}{2} \\) です。<br>" +
                         "2. 式を変形します。<br>" +
                         "　\\(\\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2 - 2\\alpha\\beta \\)<br>" +
                         "3. 代入して計算します。<br>" +
                         "　\\(= (-1)^2 - 2\\left(-\\frac{3}{2}\\right) = 1 + 3 = 4 \\)"
        },
        "次数下げ": {
            level: " 難関私立",
            formula: "【次数下げの手法】<br>" +
                     "平方根の求値や高次方程式の解の代入において、高次の式に \\(x^2 = \\dots\\) を順次代入して次数を下げながら計算する手法。<br>" +
                     "1. 条件式から \\(\\sqrt{ } \\) を片方に移行して両辺を2乗し、2次式 \\(x^2 = ax + b\\) を作る。<br>" +
                     "2. 高次の式に対して順次代入を行い、1次式まで次数を落とす。<br>" +
                     "3. 最後に元の \\(x\\) の値を代入して数値を求める。",
            generateRandom: function() {
                const a = Math.floor(Math.random() * 3) + 1;
                const roots = [2, 3, 5, 6, 7];
                const b = roots[Math.floor(Math.random() * roots.length)];
                const isPlus = Math.random() < 0.5;
                const signStr = isPlus ? "+" : "-";
                
                const c2 = 2 * a, c3 = b - a * a; 
                const k = Math.floor(Math.random() * 3) - 1;
                const m = Math.floor(Math.random() * 5) - 2; 
                const n = Math.floor(Math.random() * 10) - 5; 

                const A2 = k - c2;
                const A1 = -(c2 * k + c3) + m;
                const A0 = -c3 * k + n;

                let terms = ["x^3"];
                if (A2 !== 0) {
                    let t2 = Math.abs(A2) === 1 ? "" : Math.abs(A2);
                    terms.push(`${A2 > 0 ? "+ " + t2 : "- " + t2}x^2`);
                }
                if (A1 !== 0) {
                    let t1 = Math.abs(A1) === 1 ? "" : Math.abs(A1);
                    terms.push(`${A1 > 0 ? "+ " + t1 : "- " + t1}x`);
                }
                if (A0 !== 0) {
                    terms.push(`${A0 > 0 ? "+ " + A0 : "- " + Math.abs(A0)}`);
                }
                const polyStr = terms.join(" ");

                const c2_str = c2 === 1 ? "x" : `${c2}x`;
                const x2_sub_str = `${c2_str} ${c3 === 0 ? "" : (c3 > 0 ? "+ " + c3 : "- " + Math.abs(c3))}`.trim();

                let baseVal = m * a + n, rootCoeff = m * (isPlus ? 1 : -1);

                let explanationText = "【解説】<br>" +
                    `1. \\( x - ${a} = ${signStr}\\sqrt{${b}} \\) と変形し、両辺を2乗します。<br>` +
                    `　\\( (x - ${a})^2 = (${signStr}\\sqrt{${b}})^2 \\)<br>` +
                    `　\\( x^2 ${-2*a >= 0 ? "+ " + (-2*a) : "- " + Math.abs(-2*a)}x ${a*a - b >= 0 ? "+ " + (a*a - b) : "- " + Math.abs(a*a - b)} = 0 \\implies x^2 = ${x2_sub_str} \\)<br>` +
                    "2. 与式に \\( x^2 \\) を代入して次数を下げます。<br>" +
                    `　\\( ${polyStr} \\)<br>` +
                    `　\\(= x(x^2) + (${A2})x^2 + (${A1})x + (${A0}) \\)<br>` +
                    `　\\(= x(${x2_sub_str}) + (${A2})(${x2_sub_str}) + (${A1})x + (${A0}) \\)<br>`;

                let m_part = m === 0 ? "" : `${m === 1 ? "" : (m === -1 ? "-" : m)}x`;
                let n_part = n === 0 ? (m === 0 ? "0" : "") : `${n > 0 ? "+ " + n : "- " + Math.abs(n)}`;
                let remainder_str = `${m_part} ${n_part}`.trim();
                if (remainder_str.startsWith("+")) remainder_str = remainder_str.substring(1).trim();
                if (remainder_str === "") remainder_str = "0";

                let ansStr = "";
                if (rootCoeff === 0) {
                    ansStr = `${baseVal}`;
                } else {
                    let rc = Math.abs(rootCoeff), rcStr = rc === 1 ? "" : rc;
                    let signOp = rootCoeff > 0 ? "+" : "-";
                    ansStr = baseVal === 0 ? `${rootCoeff < 0 ? "-" : ""}${rcStr}\\sqrt{${b}}` : `${baseVal} ${signOp} ${rcStr}\\sqrt{${b}}`;
                }

                explanationText += `　次数を下げて整理すると、余りは \\( ${remainder_str} \\) になります。<br>` +
                                   `3. 最後に \\( x = ${a} ${signStr} \\sqrt{${b}} \\) を代入して計算します。<br>` +
                                   `　\\(= ${ansStr} \\)`;

                return {
                    problem: `\\( x = ${a} ${signStr} \\sqrt{${b}} \\) のとき、 \\( ${polyStr} \\) の値を求めなさい。`,
                    explanation: explanationText
                };
            },
            problem: "\\(x = -3 + \\sqrt{6} \\) のとき、 \\( x^4 + 7x^3 + 9x^2 + 2x - 2 \\) の値を求めなさい。",
            explanation: "【解説】<br>1. \\(x + 3 = \\sqrt{6} \\) と変形し、両辺を2乗します。<br>" +
                         "　\\( x^2 + 6x + 3 = 0 \\implies x^2 = -6x - 3 \\)<br>" +
                         "2. 与式に順次 \\( x^2 = -6x - 3 \\) を代入して次数を下げていきます。<br>" +
                         "　\\( x^2(-6x-3) + 7x(-6x-3) + 9(-6x-3) + 2x - 2 \\)<br>" +
                         "　\\(= -6x^3 - 33x^2 - 11x - 29 \\)<br>" +
                         "3. 再び代入を繰り返します。<br>" +
                         "　\\(= -11x - 38 \\)<br>" +
                         "4. 最後に \\(x = -3 + \\sqrt{6} \\) を代入します。<br>" +
                         "　\\(= -5 - 11\\sqrt{6} \\)"
        },
                "比例式の応用": {
            level: "難関私立",
            formula: "【比例式の基本方針】<br>" +
                     "① \\(\\frac{x}{a} = \\frac{y}{b} = \\frac{z}{c}\\) のとき、\\(x : y : z = a : b : c\\)<br>" +
                     "② \\(\\frac{x}{a} = \\frac{y}{b} = \\frac{z}{c} = k\\) とおくことで、\\(x = ak,\\ y = bk,\\ z = ck\\) と表し代入に持ち込むことができる。",
            generateRandom: function() {
                const patterns = [
                    function() {
                        const a = 5, b = 6, c = 7, sumAbc = a + b + c;
                        return {
                            problem: `\\(x, y, z\\) はいずれも \\(0\\) ではない。\\(\\frac{x+y}{${a}} = \\frac{y+z}{${b}} = \\frac{z+x}{${c}}\\) のとき、\\(\\frac{x^2 + y^2 + z^2}{xy + yz + zx}\\) の値を求めなさい。`,
                            explanation: `【解説】<br>` +
                                         `1. \\(\\frac{x+y}{${a}} = \\frac{y+z}{${b}} = \\frac{z+x}{${c}} = k\\) とすると、<br>` +
                                         `　\\(x+y = ${a}k\\)、\\(y+z = ${b}k\\)、\\(z+x = ${c}k\\) と変形できます。<br>` +
                                         `2. これらの両辺をすべて足し合わせると、<br>` +
                                         `　\\(2x + 2y + 2z = ${sumAbc}k \\implies x + y + z = ${sumAbc / 2}k\\) となります。<br>` +
                                         `3. それぞれの文字を \\(k\\) で表すと、<br>` +
                                         `　\\(z = (${sumAbc / 2} - ${a})k = 4k\\)<br>` +
                                         `　\\(x = (${sumAbc / 2} - ${b})k = 3k\\)<br>` +
                                         `　\\(y = (${sumAbc / 2} - ${c})k = 2k\\) となります。<br>` +
                                         `4. よって与式に代入すると、<br>` +
                                         `　\\(\\frac{(3k)^2 + (2k)^2 + (4k)^2}{(3k)(2k) + (2k)(4k) + (4k)(3k)} = \\frac{9k^2 + 4k^2 + 16k^2}{6k^2 + 8k^2 + 12k^2} = \\frac{29k^2}{26k^2} = \\frac{29}{26}\\)`
                        };
                    },
                    function() {
                        const p = Math.floor(Math.random() * 2) + 2;
                        const q = Math.floor(Math.random() * 2) + 3;
                        return {
                            problem: `\\(x, y, z\\) が \\(\\frac{x}{${p}} = \\frac{y}{${q}} = \\frac{z}{${p+q}}\\) を満たすとき、\\(\\frac{x^2 + y^2}{z^2}\\) の値を求めなさい。`,
                            explanation: `【解説】<br>` +
                                         `1. \\(\\frac{x}{${p}} = \\frac{y}{${q}} = \\frac{z}{${p+q}} = k\\) とおきます。<br>` +
                                         `2. \\(x = ${p}k\\)、\\(y = ${q}k\\)、\\(z = ${p+q}k\\) と表せます。<br>` +
                                         `3. 与式に代入して計算します。<br>` +
                                         `　\\(\\frac{(${p}k)^2 + (${q}k)^2}{(${p+q}k)^2} = \\frac{(${p*p} + ${q*q})k^2}{${(p+q)*(p+q)}k^2} = \\frac{${p*p + q*q}}{${(p+q)*(p+q)}}\\)`
                        };
                    },
                    function() {
                        const p = 2, q = 3, r = 4;
                        return {
                            problem: `\\(x, y, z\\) はいずれも \\(0\\) ではない。\\(\\frac{x}{${p}} = \\frac{y}{${q}} = \\frac{z}{${r}}\\) のとき、\\(\\frac{2x + y - z}{x + y + z}\\) の値を求めなさい。`,
                            explanation: `【解説】<br>` +
                                         `1. \\(\\frac{x}{${p}} = \\frac{y}{${q}} = \\frac{z}{${r}} = k\\) とおくとな、\\(x = ${p}k\\)、\\(y = ${q}k\\)、\\(z = ${r}k\\) と表せます。<br>` +
                                         `2. 与式に代入して計算します。<br>` +
                                         `　\\(\\frac{2(${p}k) + ${q}k - ${r}k}{${p}k + ${q}k + ${r}k} = \\frac{${2*p + q - r}k}{${p + q + r}k} = \\frac{${2*p + q - r}}{${p + q + r}} = \\frac{5}{9}\\)`
                        };
                    },
                    function() {
                        return {
                            problem: `\\(x, y, z\\) は \\(0\\) でなく、\\(x + y + z \\neq 0\\) とする。\\(\\frac{y+z}{2} = \\frac{z+x}{3} = \\frac{x+y}{4}\\) のとき、\\(\\frac{x}{y}\\) の値を求めなさい。`,
                            explanation: `【解説】<br>` +
                                         `1. \\(\\frac{y+z}{2} = \\frac{z+x}{3} = \\frac{x+y}{4} = k\\) とおくとな、<br>` +
                                         `　\\(y+z = 2k\\)、\\(z+x = 3k\\)、\\(x+y = 4k\\)<br>` +
                                         `2. すべて足し合わせると \\(2(x+y+z) = 9k \\implies x+y+z = \\frac{9}{2}k\\)<br>` +
                                         `3. それぞれの文字を \\(k\\) で表すと、<br>` +
                                         `　\\(x = \\frac{9}{2}k - 2k = \\frac{5}{2}k\\)<br>` +
                                         `　\\(y = \\frac{9}{2}k - 3k = \\frac{3}{2}k\\)<br>` +
                                         `　\\(z = \\frac{9}{2}k - 4k = \\frac{1}{2}k\\)<br>` +
                                         `4. よって \\(\\frac{x}{y} = \\frac{\\frac{5}{2}k}{\\frac{3}{2}k} = \\frac{5}{3}\\)`
                        };
                    }
                ];
                return patterns[Math.floor(Math.random() * patterns.length)]();
            },
            problem: "\\(x, y, z\\) はいずれも \\(0\\) ではない。\\(\\frac{x+y}{5} = \\frac{y+z}{6} = \\frac{z+x}{7}\\) のとき、\\(\\frac{x^2 + y^2 + z^2}{xy + yz + zx}\\) の値を求めなさい。",
            explanation: "【解説】<br>1. \\(\\frac{x+y}{5} = \\frac{y+z}{6} = \\frac{z+x}{7} = k\\) とすると、\\(x+y=5k\\)、\\(y+z=6k\\)、\\(z+x=7k\\) と変形できます。<br>" +
                         "2. 両辺をすべて足し合わせると \\(2x+2y+2z=18k \\implies x+y+z=9k\\) となります。<br>" +
                         "3. それぞれの値を求めると、\\(z=4k\\)、\\(x=3k\\)、\\(y=2k\\) となります。<br>" +
                         "4. よって与式に代入すると、<br>" +
                         "　\\(\\frac{x^2 + y^2 + z^2}{xy + yz + zx} = \\frac{(3k)^2 + (2k)^2 + (4k)^2}{(3k)(2k) + (2k)(4k) + (4k)(3k)} = \\frac{29k^2}{26k^2} = \\frac{29}{26}\\)"
        },
        "部分分数分解": {
            level: "難関私立",
            formula: "【部分分数分解の公式】<br>" +
                     "① \\(\\frac{1}{A \\times B} = \\frac{1}{B - A} \\left( \\frac{1}{A} - \\frac{1}{B} \\right) \\)<br>" +
                     "② \\(\\frac{1}{A \\times B \\times C} = \\frac{1}{C - A} \\left( \\frac{1}{A \\times B} - \\frac{1}{B \\times C} \\right) \\)",
            generateRandom: function() {
                return {
                    problem: "次の計算をしなさい：<br>\\(\\frac{1}{1 \\times 3} + \\frac{1}{3 \\times 5} + \\dots + \\frac{1}{7 \\times 9} \\)",
                    explanation: "【解説】<br>1. 部分分数分解公式を用います。<br>　\\(= \\frac{1}{2}\\left(1 - \\frac{1}{3}\\right) + \\frac{1}{2}\\left(\\frac{1}{3} - \\frac{1}{5}\\right) + \\dots + \\frac{1}{2}\\left(\\frac{1}{7} - \\frac{1}{9}\\right)\\)<br>2. 途中が相殺されることを利用して計算します。<br>　\\(= \\frac{1}{2} \\left( 1 - \\frac{1}{9} \\right) = \\frac{4}{9} \\)"
                };
            },
            problem: "次の計算をしなさい：<br>\\(\\frac{1}{1 \\times 3} + \\frac{1}{3 \\times 5} + \\frac{1}{5 \\times 7} + \\dots + \\frac{1}{97 \\times 99} \\)",
            explanation: "【解説】<br>1. 部分分数分解公式を用いて各項を変形します。<br>" +
                         "　\\(= \\frac{1}{2} \\left( 1 - \\frac{1}{93} \\right) \\dots \\)"
        }
    },
    "関数": {
        "変域": {
            level: "公立",
            formula: "変域 <br>" +
                     "変域の問題では，必ずグラフをかくこと。<br>" +
                     "定義域…x の変域　　値域…y の変域",
            generateRandom: function() {
                const patterns = [
                    function() {
                        const aChoices = [0.5, 1, 2, 3, 1/3];
                        const a = aChoices[Math.floor(Math.random() * aChoices.length)];
                        const x1 = -(Math.floor(Math.random() * 3) + 2);
                        const x2 = Math.floor(Math.random() * 3) + 2;
                        const maxAbsX = Math.max(Math.abs(x1), x2);
                        const maxYVal = Math.round(a * maxAbsX * maxAbsX * 10) / 10;
                        const graphSvg = createFunctionGraphSVG("quadratic", a, x1, x2);
                        
                        return {
                            problem: `与えられた関数 \\(y = ax^2\\) において，\\(${x1} \\leqq x \\leqq ${x2}\\) における \\(y\\) の変域は \\(0 \\leqq y \\leqq ${maxYVal}\\) であった。\\(a\\) の値を求めなさい。` + graphSvg,
                            explanation: `【解説】<br>` +
                                         `1. <strong>変域の問題では必ずグラフをかく</strong>ことが基本です。<br>` +
                                         `2. \\(x\\) の変域が \\(${x1} \\leqq x \\leqq ${x2}\\) で、\\(y\\) の変域が \\(0\\) を含む \\(0 \\leqq y \\leqq ${maxYVal}\\) であることから、グラフは上に開く放物線（\\(a > 0\\)）であり、\\(x = 0\\) のときに最小値 \\(0\\) をとることがわかります。<br>` +
                                         `3. \\(x\\) の絶対値が大きい方の端のとき、最大値 \\(y = ${maxYVal}\\) をとります。<br>` +
                                         `4. \\(y = ax^2\\) に代入して \\(a\\) を求めます。<br>` +
                                         `　\\(${maxYVal} = a \\times (${maxAbsX})^2 \\implies ${maxAbsX * maxAbsX}a = ${maxYVal} \\implies a = ${a === 0.5 ? "\\frac{1}{2}" : (a === 1/3 ? "\\frac{1}{3}" : a)}\\)`
                        };
                    },
                    function() {
                        const aChoices = [-0.5, -1, -2, -3];
                        const a = aChoices[Math.floor(Math.random() * aChoices.length)];
                        const x1 = -(Math.floor(Math.random() * 2) + 2);
                        const x2 = Math.floor(Math.random() * 2) + 2;
                        const maxAbsX = Math.max(Math.abs(x1), x2);
                        const minYVal = Math.round(a * maxAbsX * maxAbsX);
                        const graphSvg = createFunctionGraphSVG("quadratic", a, x1, x2);
                        
                        return {
                            problem: `関数 \\(y = ax^2\\) について，\\(${x1} \\leqq x \\leqq ${x2}\\) のときの \\(y\\) の変域は \\(${minYVal} \\leqq y \\leqq 0\\) である。\\(a\\) の値を求めなさい。` + graphSvg,
                            explanation: `【解説】<br>` +
                                         `1. <strong>変域の問題では必ずグラフをかく</strong>こと。<br>` +
                                         `2. \\(y\\) の変域が \\(${minYVal} \\leqq y \\leqq 0\\) であるため、グラフは下に開く放物線（\\(a < 0\\)）であり、\\(x = 0\\) のときに最大値 \\(0\\) をとります。<br>` +
                                         `3. \\(x\\) の絶対値が大きい方の端のとき、最小値 \\(y = ${minYVal}\\) をとります。<br>` +
                                         `4. \\(y = ax^2\\) に代入して \\(a\\) を求めます。<br>` +
                                         `　\\(${minYVal} = a \\times (${maxAbsX})^2 \\implies ${maxAbsX * maxAbsX}a = ${minYVal} \\implies a = ${a}\\)`
                        };
                    },
                    function() {
                        const a = Math.floor(Math.random() * 2) + 1;
                        const x1 = Math.floor(Math.random() * 2) + 1;
                        const x2 = x1 + Math.floor(Math.random() * 2) + 1;
                        const y1 = a * x1 * x1, y2 = a * x2 * x2;
                        const graphSvg = createFunctionGraphSVG("quadratic", a, x1, x2);

                        return {
                            problem: `関数 \\(y = ${a === 1 ? "" : a}x^2\\) において、\\(${x1} \\leqq x \\leqq ${x2}\\) のときの \\(y\\) の変域を求めなさい。` + graphSvg,
                            explanation: `【解説】<br>` +
                                         `1. <strong>変域の問題では必ずグラフをかく</strong>。<br>` +
                                         `2. \\(x\\) の変域 \\(${x1} \\leqq x \\leqq ${x2}\\) は \\(0\\) を含まず、ともに正の範囲にあります。<br>` +
                                         `3. \\(x = ${x1}\\) のとき最小値 \\(${y1}\\)、\\(x = ${x2}\\) のとき最大値 \\(${y2}\\) をとります。<br>` +
                                         `4. したがって、求める \\(y\\) の変域は \\(\\mathbf{${y1} \\leqq y \\leqq ${y2}}\\) です。`
                        };
                    },
                    function() {
                        const kChoices = [4, 6, 8, 12, -4, -6, -8, -12];
                        const k = kChoices[Math.floor(Math.random() * kChoices.length)];
                        let x1, x2;
                        if (Math.random() < 0.5) {
                            x1 = Math.floor(Math.random() * 2) + 1;
                            x2 = x1 + Math.floor(Math.random() * 2) + 2;
                        } else {
                            x2 = -(Math.floor(Math.random() * 2) + 1);
                            x1 = x2 - (Math.floor(Math.random() * 2) + 2);
                        }
                        const y1 = Math.round((k / x1) * 10) / 10;
                        const y2 = Math.round((k / x2) * 10) / 10;
                        const minY = Math.min(y1, y2);
                        const maxY = Math.max(y1, y2);
                        const graphSvg = createFunctionGraphSVG("inverse", k, x1, x2);

                        let kStr = k;
                        return {
                            problem: `関数 \\(y = \\frac{${kStr}}{x}\\) について、\\(${x1} \\leqq x \\leqq ${x2}\\) のときの \\(y\\) の変域を求めなさい。` + graphSvg,
                            explanation: `【解説】<br>` +
                                         `1. <strong>変域の問題では必ずグラフをかく</strong>ことが基本です。<br>` +
                                         `2. 反比例のグラフは双曲線になります。\\(x\\) の変域 \\(${x1} \\leqq x \\leqq ${x2}\\) における \\(y\\) の値の両端を計算します。<br>` +
                                         `　\\(x = ${x1}\\) のとき \\(y = \\frac{${kStr}}{${x1}} = ${y1}\\)<br>` +
                                         `　\\(x = ${x2}\\) のとき \\(y = \\frac{${kStr}}{${x2}} = ${y2}\\)<br>` +
                                         `3. グラフの形状から、この区間内での \\(y\\) の値の最小値と最大値を求めると、<br>` +
                                         `　求める \\(y\\) の変域は \\(\\mathbf{${minY} \\leqq y \\leqq ${maxY}}\\) となります。`
                        };
                    },
                    function() {
                        const a = (Math.floor(Math.random() * 4) + 1) * (Math.random() < 0.5 ? 1 : -1);
                        const b = Math.floor(Math.random() * 7) - 3;
                        const x1 = Math.floor(Math.random() * 5) - 3;
                        const x2 = x1 + Math.floor(Math.random() * 3) + 1;
                        const y1 = a * x1 + b;
                        const y2 = a * x2 + b;
                        const minY = Math.min(y1, y2);
                        const maxY = Math.max(y1, y2);
                        const graphSvg = createFunctionGraphSVG("linear", a, x1, x2);
                        const aStr = a === 1 ? "" : (a === -1 ? "-" : a);
                        const bStr = b === 0 ? "" : (b > 0 ? "+ " + b : "- " + Math.abs(b));

                        return {
                            problem: `一次関数 \\(y = ${aStr}x ${bStr}\\) について、\\(${x1} \\leqq x \\leqq ${x2}\\) のときの \\(y\\) の変域を求めなさい。` + graphSvg,
                            explanation: `【解説】<br>` +
                                         `1. <strong>変域の問題では必ずグラフをかく</strong>こと。<br>` +
                                         `2. 一次関数は直線なので、\\(x\\) の変域の両端（ \\(x = ${x1}\\)、\\(x = ${x2}\\) ）のときに対称的に最大・最小をとります。<br>` +
                                         `　\\(x = ${x1}\\) のとき \\(y = ${a}(${x1}) ${b >= 0 ? "+ " + b : "- " + Math.abs(b)} = ${y1}\\)<br>` +
                                         `　\\(x = ${x2}\\) のとき \\(y = ${a}(${x2}) ${b >= 0 ? "+ " + b : "- " + Math.abs(b)} = ${y2}\\)<br>` +
                                         `3. したがって、求める \\(y\\) の変域は \\(\\mathbf{${minY} \\leqq y \\leqq ${maxY}}\\) です。`
                        };
                    },
                    function() {
                        const a = Math.floor(Math.random() * 3) + 1;
                        const x1 = 1, x2 = 4;
                        const yMin = Math.floor(Math.random() * 5) - 2;
                        const yMax = yMin + a * (x2 - x1);
                        const b = yMin - a * x1;
                        const graphSvg = createFunctionGraphSVG("linear", a, x1, x2);
                        const aStr = a === 1 ? "" : a;

                        return {
                            problem: `一次関数 \\(y = ax + b\\) において、\\(${x1} \\leqq x \\leqq ${x2}\\) のときの \\(y\\) の変域が \\(${yMin} \\leqq y \\leqq ${yMax}\\) である。 \\(a, b\\) の値を求めなさい。` + graphSvg,
                            explanation: `【解説】<br>` +
                                         `1. \\(a > 0\\) のとき、\\(x\\) が最小のときに \\(y\\) も最小、\\(x\\) が最大のときに \\(y\\) も最大となります。<br>` +
                                         `2. よって、\\(x = ${x1}\\) のとき \\(y = ${yMin}\\)、\\(x = ${x2}\\) のとき \\(y = ${yMax}\\) となる1次関数の式を求めます。<br>` +
                                         `3. 変化の割合（傾き \\(a\\)）は、\\(a = \\frac{${yMax} - (${yMin})}{${x2} - (${x1})} = ${a}\\)<br>` +
                                         `4. \\(y = ${aStr}x + b\\) に \\((${x1}, ${y1})\\) を代入すると、\\(${yMin} = ${a} \\times ${x1} + b \\implies b = ${b}\\)<br>` +
                                         `5. したがって、\\(\\mathbf{a = ${a}, b = ${b}}\\) となります。`
                        };
                    },
                    function() {
                        const absA = Math.floor(Math.random() * 2) + 2; 
                        const xMin = -2, xMax = 3;
                        const yLow = -6, yHigh = yLow + absA * (xMax - xMin);
                        const graphSvg = createFunctionGraphSVG("linear", absA, xMin, xMax);

                        return {
                            problem: `一次関数 \\(y = ax + b\\) において、\\(${xMin} \\leqq x \\leqq ${xMax}\\) のときの \\(y\\) の変域が \\(${yLow} \\leqq y \\leqq ${yHigh}\\) である。このような \\(a, b\\) の組をすべて求めなさい。` + graphSvg,
                            explanation: `【解説】<br>` +
                                         `1. <strong>傾き \\(a\\) の正負（増加・減少）が問題文の条件から指定されていない</strong>ため、2つの場合（\\(a > 0\\) の場合と \\(a < 0\\) の場合）に分けて考える必要があります。<br>` +
                                         `2. <strong>① \\(a > 0\\) の場合：</strong><br>` +
                                         `　\\(x = ${xMin}\\) のとき \\(y = ${yLow}\\)、\\(x = ${xMax}\\) のとき \\(y = ${yHigh}\\) となります。<br>` +
                                         `　これを解くと、\\(a = ${absA}, b = ${yLow + absA * Math.abs(xMin)}\\)<br>` +
                                         `3. <strong>② \\(a < 0\\) の場合：</strong><br>` +
                                         `　\\(x = ${xMin}\\) のとき \\(y = ${yHigh}\\)、\\(x = ${xMax}\\) のとき \\(y = ${yLow}\\) となります。<br>` +
                                         `　これを解くと、\\(a = -${absA}, b = ${yHigh - absA * Math.abs(xMin)}\\)<br>` +
                                         `4. したがって、答えは \\(\\mathbf{a = ${absA}, b = ${yLow + absA * Math.abs(xMin)}} \\) および \\( \\mathbf{a = -${absA}, b = ${yHigh - absA * Math.abs(xMin)}}\\) の2通りになります。`
                        };
                    }
                ];
                return patterns[Math.floor(Math.random() * patterns.length)]();
            },
            problem: "与えられた関数 \\(y = ax^2\\) において，\\(-3 \\leqq x \\leqq 4\\) における \\(y\\) の変域は \\(0 \\leqq y \\leqq 8\\) であった。\\(a\\) の値を求めなさい。" + createFunctionGraphSVG("quadratic", 0.5, -3, 4),
            explanation: "【解説】<br>" +
                         "1. <strong>変域の問題では必ずグラフをかく</strong>こと。<br>" +
                         "2. 定義域（\\(x\\) の変域）と値域（\\(y\\) の変域）の関係を確認します。<br>" +
                         "3. \\(x = 4\\) のとき \\(y = 8\\) となるので、\\(8 = a \\times 4^2 \\implies 16a = 8 \\implies a = \\frac{1}{2}\\) です。"
        },
        
        "変化の割合": {
            level: "公立",
            formula: "【変化の割合の基本】<br>" +
                     "・<strong>変化の割合</strong> = \\(\\frac{yの増加量}{xの増加量} = \\frac{y_2 - y_1}{x_2 - x_1}\\)<br>" +
                     "・<strong>1次関数 \\(y = ax + b\\)</strong>：区間にかかわらず、変化の割合は常に一定で傾き \\(a\\) に等しい。<br>" +
                     "・<strong>反比例 \\(y = \\frac{a}{x}\\)</strong>：変化の割合は一定ではなく、\\(\\frac{y_2 - y_1}{x_2 - x_1}\\) の定義通りに計算して求める。<br>" +
                     "・<strong>2次関数 \\(y = ax^2\\)</strong>：\\(x\\) が \\(p\\) から \\(q\\) まで変化するときの変化の割合は \\(a(p + q)\\)",
            generateRandom: function() {
                const patterns = [
                    function() {
                        const a = Math.floor(Math.random() * 2) + 1;
                        const x1 = -(Math.floor(Math.random() * 3) + 2);
                        const x2 = Math.floor(Math.random() * 3) + 1;
                        const m = a * (x1 + x2), n = Math.floor(Math.random() * 10) - 5;
                        const mStr = m === 1 ? "" : (m === -1 ? "-" : m);
                        const nStr = n === 0 ? "" : (n > 0 ? "+ " + n : "- " + Math.abs(n));
                        const graphSvg = createFunctionGraphSVG("quadratic", a, x1, x2);

                        return {
                            problem: `\\(x\\) が \\(${x1}\\) から \\(${x2}\\) まで変化するとき、\\(y = ${a === 1 ? "" : a}x^2\\) と \\(y = ${mStr}x ${nStr}\\) の変化の割合が一致した。\\(a\\) の値を求めなさい。` + graphSvg,
                            explanation: `【解説】<br>` +
                                         `1. \\(y = ${a === 1 ? "" : a}x^2\\) における変化の割合は、\\(a(p + q)\\) より、<br>　\\(${a}((${x1}) + (${x2})) = ${a * (x1 + x2)}\\<br>` +
                                         `2. 1次関数 \\(y = ${mStr}x ${nStr}\\) の変化の割合は常に傾きと等しいため \\(${m}\\) です。<br>` +
                                         `3. 変化の割合が一致することから、<br>　\\(${a * (x1 + x2)}a = ${m} \\implies a = ${a}\\)`
                        };
                    },
                    function() {
                        const a = Math.floor(Math.random() * 2) + 2;
                        const p = Math.floor(Math.random() * 3) + 1;
                        const q = p + (Math.floor(Math.random() * 2) + 1);
                        const yp = a * p * p, yq = a * q * q;
                        const ansRate = a * (p + q);
                        const graphSvg = createFunctionGraphSVG("quadratic", a, p, q);

                        return {
                            problem: `関数 \\(y = ${a}x^2\\) について、\\(x\\) が \\(${p}\\) から \\(${q}\\) まで変化するときの変化の割合を求めなさい。` + graphSvg,
                            explanation: `【解説】<br>` +
                                         `1. \\(x = ${p}\\) のとき \\(y = ${a} \\times ${p}^2 = ${yp}\\)、\\(x = ${q}\\) のとき \\(y = ${a} \\times ${q}^2 = ${yq}\\) です。<br>` +
                                         `2. 変化の割合の公式 \\(\\frac{yの増加量}{xの増加量}\\) に代入します。<br>` +
                                         `　\\(\\frac{${yq} - ${yp}}{${q} - ${p}} = \\frac{${yq - yp}}{${q - p}} = ${ansRate}\\)<br>` +
                                         `（※ \\(y = ax^2\\) の変化の割合の公式 \\(a(p + q)\\) を使うと \\(${a} \\times (${p} + ${q}) = ${ansRate}\\) と一発で求まります）`
                        };
                    },
                    function() {
                        const a = Math.floor(Math.random() * 5) - 2 || 3;
                        const b = Math.floor(Math.random() * 10) - 5;
                        const x1 = Math.floor(Math.random() * 3);
                        const x2 = x1 + Math.floor(Math.random() * 3) + 1;
                        const aStr = a === 1 ? "" : (a === -1 ? "-" : a);
                        const bStr = b === 0 ? "" : (b > 0 ? "+ " + b : "- " + Math.abs(b));
                        const graphSvg = createFunctionGraphSVG("linear", a, x1, x2);

                        return {
                            problem: `1次関数 \\(y = ${aStr}x ${bStr}\\) について、\\(x\\) が \\(${x1}\\) から \\(${x2}\\) まで変化するときの変化の割合を求めなさい。` + graphSvg,
                            explanation: `【解説】<br>` +
                                         `1. 1次関数 \\(y = ax + b\\) の変化の割合は、区間にかかわらず<strong>常に一定で傾き \\(a\\)</strong>に等しくなります。<br>` +
                                         `2. したがって、この関数の変化の割合は \\(\\mathbf{${a}}\\) です。`
                        };
                    },
                    function() {
                        const k = 12;
                        const pairs = [{ p: 2, q: 6 }, { p: 3, q: 4 }, { p: 1, q: 4 }, { p: 2, q: 4 }];
                        const pair = pairs[Math.floor(Math.random() * pairs.length)];
                        const p = pair.p, q = pair.q;
                        const yp = k / p, yq = k / q;
                        const ans = (yq - yp) / (q - p);
                        const graphSvg = createFunctionGraphSVG("inverse", k, p, q);

                        return {
                            problem: `反比例 \\(y = \\frac{${k}}{x}\\) について、\\(x\\) が \\(${p}\\) から \\(${q}\\) まで変化するときの変化の割合を求めなさい。` + graphSvg,
                            explanation: `【解説】<br>` +
                                         `1. \\(x = ${p}\\) のとき \\(y = \\frac{${k}}{${p}} = ${yp}\\)、\\(x = ${q}\\) のとき \\(y = \\frac{${k}}{${q}} = ${yq}\\) です。<br>` +
                                         `2. 変化の割合の公式 \\(\\frac{yの増加量}{xの増加量}\\) に代入して計算します。<br>` +
                                         `　\\(\\frac{${yq} - ${yp}}{${q} - ${p}} = \\frac{${yq - yp}}{${q - p}} = \\mathbf{${ans}}\\) `
                        };
                    }
                ];
                return patterns[Math.floor(Math.random() * patterns.length)]();
            },
            problem: "\\(x\\) が \\(-3\\) から \\(1\\) まで变化するとき、 \\(y = ax^2\\) と \\(y = 6x - 4\\) の変化の割合が一致した。\\(a\\) の値を求めなさい。",
            explanation: "【解説】<br>" +
                         "1. \\(y = ax^2\\) における変化の割合は \\(a(p + q)\\) より、\\(a((-3) + 1) = -2a\\) です。<br>" +
                         "2. 1次関数 \\(y = 6x - 4\\) の変化の割合は常に傾きと等しいため \\(6\\) です。<br>" +
                         "3. 変化の割合が一致することから、\\(-2a = 6 \\implies a = -3\\) と求まります。"
        },
          "一次関数の式決定": {
            level: "基礎",
            formula: "【一次関数の式決定の基本方針】<br>" +
                     "・基本形：\\( y = ax + b \\) （\\(a\\) は傾き、\\(b\\) は切片）<br>" +
                     "・点 \\((p, q)\\) を通る直線の公式：\\( y = m(x - p) + q \\)<br>" +
                     "・2点を通る直線：変化の割合（傾き）を求めた後、どちらかの座標を代入して \\(b\\) を求める。<br>" +
                     "・平行な直線：**傾きが同じ**になる。<br>" +
                     "・垂直な直線：傾きの積が \\(-1\\)（つまり、傾きが**逆数の符号違い**になる）。",
            generateRandom: function() {
                const patterns = [
                    function() {
                        const a = Math.floor(Math.random() * 5) - 2 || 2; 
                        const p = Math.floor(Math.random() * 7) - 3;      
                        const q = Math.floor(Math.random() * 10) - 5;     
                        const b = q - a * p;
                        const aStr = a === 1 ? "" : (a === -1 ? "-" : a);
                        return {
                            problem: `点 \\((${p}, ${q})\\) を通り、傾きが \\(${a}\\) の直線の方程式を求めなさい。`,
                            explanation: `【解説】<br>` +
                                         `1. 求める直線の式を \\( y = ${aStr}x + b \\) とおきます。<br>` +
                                         `2. \\( x = ${p}, y = ${q} \\) を代入して \\( b \\) を求めます。<br>` +
                                         `　\\(${q} = ${a} \\times (${p}) + b \\implies b = ${b}\\)<br>` +
                                         `3. したがって、求める直線の方程式は \\( y = ${aStr}x ${b >= 0 ? "+ " + b : "- " + Math.abs(b)} \\) です。`
                        };
                    },
                    function() {
                        const b = Math.floor(Math.random() * 10) - 5;     
                        const p = Math.floor(Math.random() * 6) - 3 || 1; 
                        const q_val = Math.floor(Math.random() * 10) - 5;
                        const a = (q_val - b) / p;
                        const aStr = a === 1 ? "" : (a === -1 ? "-" : a);
                        return {
                            problem: `切片が \\(${b}\\) で、点 \\((${p}, ${q_val})\\) を通る直線の方程式を求めなさい。`,
                            explanation: `【解説】<br>` +
                                         `1. 求める直線の式を \\( y = ax + ${b} \\) とおきます。<br>` +
                                         `2. \\( x = ${p}, y = ${q_val} \\) を代入して \\( a \\) を求めます。<br>` +
                                         `　\\(${q_val} = a \\times ${p} + ${b} \\implies ${p}a = ${q_val - b} \\implies a = ${a}\\)<br>` +
                                         `3. したがって、求める直線の方程式は \\( y = ${aStr}x ${b >= 0 ? "+ " + b : "- " + Math.abs(b)} \\) です。`
                        };
                    },
                    function() {
                        const x1 = Math.floor(Math.random() * 5) - 2;
                        const y1 = Math.floor(Math.random() * 10) - 5;
                        let x2;
                        do { x2 = Math.floor(Math.random() * 5) - 2; } while (x2 === x1);
                        const y2 = Math.floor(Math.random() * 10) - 5;
                        const a = (y2 - y1) / (x2 - x1);
                        const b = y1 - a * x1;
                        const aStr = a === 1 ? "" : (a === -1 ? "-" : a);
                        return {
                            problem: `2点 \\((${x1}, ${y1})\\)、\\((${x2}, ${y2})\\) を通る直線の方程式を求めなさい。`,
                            explanation: `【解説】<br>` +
                                         `1. 変化の割合（傾き \\(a\\)）を求めます。<br>` +
                                         `　\\(a = \\frac{${y2} - (${y1})}{${x2} - (${x1})} = \\frac{${y2 - y1}}{${x2 - x1}} = ${a}\\)<br>` +
                                         `2. \\( y = ${aStr}x + b \\) に \\( (${x1}, ${y1}) \\) を代入して \\( b \\) を求めます。<br>` +
                                         `　\\(${y1} = ${a} \\times (${x1}) + b \\implies b = ${b}\\)<br>` +
                                         `3. したがって、求める直線の方程式は \\( y = ${aStr}x ${b >= 0 ? "+ " + b : "- " + Math.abs(b)} \\) です。`
                        };
                    },
                    function() {
                        const baseA = Math.floor(Math.random() * 5) - 2 || 2;
                        const baseB = Math.floor(Math.random() * 10) - 5;
                        const p = Math.floor(Math.random() * 7) - 3;
                        const q = Math.floor(Math.random() * 10) - 5;
                        const newB = q - baseA * p;
                        const baseAStr = baseA === 1 ? "" : (baseA === -1 ? "-" : baseA);
                        return {
                            problem: `直線 \\( y = ${baseAStr}x ${baseB >= 0 ? "+ " + baseB : "- " + Math.abs(baseB)} \\) に平行で、点 \\((${p}, ${q})\\) を通る直線の方程式を求めなさい。`,
                            explanation: `【解説】<br>` +
                                         `1. 平行な直線は<strong>傾きが等しい</strong>ので、求める直線の傾きも \\(${baseA}\\) です。<br>` +
                                         `2. \\( y = ${baseAStr}x + b \\) に \\( x = ${p}, y = ${q} \\) を代入します。<br>` +
                                         `　\\(${q} = ${baseA} \\times (${p}) + b \\implies b = ${newB}\\)<br>` +
                                         `3. したがって、求める直線の方程式は \\( y = ${baseAStr}x ${newB >= 0 ? "+ " + newB : "- " + Math.abs(newB)} \\) です。`
                        };
                    },
                    function() {
                        const baseA = Math.random() < 0.5 ? 2 : -2;
                        const perpA = -1 / baseA; 
                        const baseB = Math.floor(Math.random() * 6) - 3;
                        const p = (Math.floor(Math.random() * 3) - 1) * 2; 
                        const q = Math.floor(Math.random() * 10) - 5;
                        const newB = q - perpA * p;
                        const baseAStr = baseA === 1 ? "" : (baseA === -1 ? "-" : baseA);
                        const perpAStr = perpA === 0.5 ? "\\frac{1}{2}" : (perpA === -0.5 ? "-\\frac{1}{2}" : (perpA === 1 ? "" : (perpA === -1 ? "-" : perpA)));

                        return {
                            problem: `直線 \\( y = ${baseAStr}x ${baseB >= 0 ? "+ " + baseB : "- " + Math.abs(baseB)} \\) に垂直で、点 \\((${p}, ${q})\\) を通る直線の方程式を求めなさい。`,
                            explanation: `【解説】<br>` +
                                         `1. 垂直な直線の傾きの積は \\(-1\\) なので、求める直線の傾きは \\( -\\frac{1}{${baseA}} = ${perpAStr} \\) です。<br>` +
                                         `2. \\( y = ${perpAStr}x + b \\) に \\( x = ${p}, y = ${q} \\) を代入します。<br>` +
                                         `　\\(${q} = ${perpAStr} \\times (${p}) + b \\implies b = ${newB}\\)<br>` +
                                         `3. したがって、求める直線の方程式は \\( y = ${perpAStr}x ${newB >= 0 ? "+ " + newB : "- " + Math.abs(newB)} \\) です。`
                        };
                    }
                ];
                return patterns[Math.floor(Math.random() * patterns.length)]();
            },
            problem: "点 \\((1, 3)\\) を通り、傾きが \\(2\\) の直線の方程式を求めなさい。",
            explanation: "【解説】<br>1. \\( y = 2x + b \\) と置きます。<br>2. \\( x=1, y=3 \\) を代入します。<br>　\\( 3 = 2(1) + b \\implies b = 1 \\)<br>3. したがって \\( y = 2x + 1 \\) です。"
        },
        "放物線に交わる直線": {
            level: "公立",
            formula: "放物線と直線の公式 <br>" +
                     "放物線 \\(y = ax^2\\) が直線と \\(2\\) 点 \\(A(p, \\ ), B(q, \\ )\\) に交わるとき，<br>" +
                     "直線の傾き \\(= a(p + q)\\)、切片 \\(= -apq\\)",
            generateRandom: function() {
                const aChoices = [1/2, 1, 2];
                const a = aChoices[Math.floor(Math.random() * aChoices.length)];
                // p と q をランダムに決定（異なる値）
                let p = Math.floor(Math.random() * 5) - 3; // -3 から 1
                let q = p + Math.floor(Math.random() * 4) + 1; // 必ず p < q にする
                if (Math.random() < 0.5) {
                    // 負の範囲を混ぜる調整
                    p = -(Math.floor(Math.random() * 3) + 1);
                    q = Math.floor(Math.random() * 3) + 1;
                }
                
                const m = a * (p + q);
                const n = -a * p * q;
                const yp = a * p * p;
                const yq = a * q * q;

                const aStr = a === 0.5 ? "\\frac{1}{2}" : (a === 1 ? "" : a);
                const graphSvg = createFunctionGraphSVG("secant", a, p, q, m, n);

                const mStr = m === 1 ? "" : (m === -1 ? "-" : m);
                const nStr = n === 0 ? "" : (n > 0 ? "+ " + n : "- " + Math.abs(n));

                return {
                    problem: `放物線 \\(y = ${aStr}x^2\\) 上の \\(2\\) 点 \\(A、B\\) で直線が交わっており、\\(x\\) 座標はそれぞれ \\(${p}\\) と \\(${q}\\) である。直線ABの式を求めなさい。` + graphSvg,
                    explanation: `【解説】<br>` +
                                 `1. 点Aの \\(x\\) 座標は \\(${p}\\)、点Bの \\(x\\) 座標は \\(${q}\\) です。<br>` +
                                 `2. \\(y = ${aStr}x^2\\) に代入してそれぞれの \\(y\\) 座標を求めます。<br>` +
                                 `　点A \\((${p}, ${yp})\\)、点B \\((${q}, ${yq})\\)<br>` +
                                 `3. 公式（または2点を通る直線の式）より、直線の傾きと切片を求めます。<br>` +
                                 `　傾き \\(= a(p + q) = ${a} \\times (${p} + ${q}) = ${m}\\)<br>` +
                                 `　切片 \\(= -apq = -${a} \\times (${p}) \\times (${q}) = ${n}\\)<br>` +
                                 `4. したがって、直線ABの式は \\(\\mathbf{y = ${mStr}x ${nStr}}\\) となります。`
                };
            },
            problem: "y＝x²上の２点A、Bで直線が交わっておりx座標はそれぞれ−2と4である。直線ABの式を求めなさい。" + createFunctionGraphSVG("secant", 1, -2, 4, 2, 8),
            explanation: "【解説】<br>" +
                         "1. 点Aの \\(x\\) 座標は \\(-2\\)、点Bの \\(x\\) 座標は \\(4\\) です。<br>" +
                         "2. それぞれの \\(y\\) 座標は、点A \\((-2, 4)\\)、点B \\((4, 16)\\) となります。<br>" +
                         "3. 公式より、直線の傾きは \\(1 \\times ((-2) + 4) = 2\\)、切片は \\(-1 \\times (-2) \\times 4 = 8\\) です。<br>" +
                         "4. したがって、直線ABの式は \\(\\mathbf{y = 2x + 8}\\) となります。"
        },
           "放物線に交わる 2 つの平行線": {
        level: "難関私立",
        formula: "放物線に平行な 2 つの直線が交わるとき，放物線に交わる直線の傾きの公式から，両方の傾きを求めると，<br>直線①：a(p+q)，直線②：a(r+s)<br>①と②の傾きが等しいので，<br>a(p+q) = a(r+s) より p+q = r+s<br>よって，x 座標どうしの和が等しくなる。",
        generateRandom: function() {
            // 係数 a をランダムに決定（下に凸: 1, 2 ／ 上に凸: -1, -2）
            const aOptions = [1, 2, -1, -2];
            const a = aOptions[Math.floor(Math.random() * aOptions.length)];

            // P, Q の x 座標を決定（絶対値が一致しないようにする）
            let xP, xQ;
            do {
                xP = -(Math.floor(Math.random() * 3) + 1); // -1, -2, -3 のいずれか
                xQ = Math.floor(Math.random() * 3) + 1;     // 1, 2, 3 のいずれか
            } while (Math.abs(xP) === Math.abs(xQ));

            const yP = a * xP * xP; 
            const yQ = a * xQ * xQ; 

            // 直線 l の傾き m = a(p + q)
            const m = a * (xP + xQ);
            // 直線 l の切片 n1 (点 P を通る)
            const n1 = yP - m * xP;

            // 直線 m の交点 R, S (p + q = r + s を満たし、絶対値が一致しないようにする)
            let xR, xS;
            do {
                xR = -(Math.floor(Math.random() * 3) + 3); // -3, -4, -5 のいずれか
                xS = (xP + xQ) - xR; 
            } while (Math.abs(xR) === Math.abs(xS) || xR === xP || xR === xQ);

            const yR = a * xR * xR;
            const yS = a * xS * xS;
            // 直線 m の切片 n2 (点 R を通る) -> 点 A の y 座標
            const n2 = yR - m * xR;

            // --- 全ての点とグラフが確実に見切れないよう範囲を動的に計算 ---
            const allX = [xP, xQ, xR, xS, 0];
            const allY = [yP, yQ, yR, yS, n1, n2, 0];
            
            const minX = Math.min(...allX);
            const maxX = Math.max(...allX);
            const minY = Math.min(...allY);
            const maxY = Math.max(...allY);

            // 余白（マージン）を持たせる
            const xMin = minX - 2;
            const xMax = maxX + 2;
            const yMin = Math.min(-5, minY - 5);
            const yMax = Math.max(10, maxY + 5);

            const width = 320;
            const height = 320;

            function toSvgX(x) {
                return ((x - xMin) / (xMax - xMin)) * width;
            }
            function toSvgY(y) {
                return height - ((y - yMin) / (yMax - yMin)) * height;
            }

            let svg = `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="background:#fff; border:1px solid #ccc; border-radius:4px; max-width:320px; display:block; margin:0 auto;">`;

            // グリッド線・軸
            svg += `<line x1="${toSvgX(0)}" y1="0" x2="${toSvgX(0)}" y2="${height}" stroke="#ccc" stroke-width="1" />`;
            svg += `<line x1="0" y1="${toSvgY(0)}" x2="${width}" y2="${toSvgY(0)}" stroke="#ccc" stroke-width="1" />`;

            // 放物線の描画
            let parabolaPath = "";
            for (let px = xMin; px <= xMax; px += 0.05) {
                let py = a * px * px;
                let sx = toSvgX(px);
                let sy = toSvgY(py);
                parabolaPath += (parabolaPath === "" ? "M " : "L ") + `${sx} ${sy} `;
            }
            svg += `<path d="${parabolaPath}" fill="none" stroke="#2563eb" stroke-width="2" />`;

            // 直線 l の描画
            svg += `<line x1="${toSvgX(xMin)}" y1="${toSvgY(m * xMin + n1)}" x2="${toSvgX(xMax)}" y2="${toSvgY(m * xMax + n1)}" stroke="#dc2626" stroke-width="1.5" />`;

            // 直線 m の描画
            svg += `<line x1="${toSvgX(xMin)}" y1="${toSvgY(m * xMin + n2)}" x2="${toSvgX(xMax)}" y2="${toSvgY(m * xMax + n2)}" stroke="#16a34a" stroke-width="1.5" />`;

            const P = { x: xP, y: yP };
            const Q = { x: xQ, y: yQ };
            const R = { x: xR, y: yR };
            const S = { x: xS, y: yS };
            const A = { x: 0, y: n2 }; 

            const points = [
                { name: "P", ...P },
                { name: "Q", ...Q },
                { name: "R", ...R },
                { name: "S", ...S },
                { name: "A", ...A }
            ];

            points.forEach(pt => {
                svg += `<circle cx="${toSvgX(pt.x)}" cy="${toSvgY(pt.y)}" r="4" fill="#000" />`;
                svg += `<text x="${toSvgX(pt.x) + 6}" y="${toSvgY(pt.y) - 6}" font-size="13" font-weight="bold" fill="#000">${pt.name}</text>`;
            });

            svg += `</svg>`;

            const aDisplay = a === 1 ? '' : (a === -1 ? '-' : a);

            const problemText = `
                放物線 y = ${aDisplay}x<sup>2</sup> と交わる平行な 2 直線 l, m がある。<br>
                放物線と直線 l の交点を x 座標の小さい方から P, Q とし、放物線と直線 m の交点を x 座標の小さい方から R, S とする。<br>
                また、直線 m と y 軸との交点を A とする。<br>
                いま、P(${xP}, ${yP}), Q(${xQ}, ${yQ}) であり、R の x 座標が ${xR} であるとき、点 A の y 座標を求めなさい。
                <div style="text-align:center; margin-top:10px;">${svg}</div>
            `;

            const explanationText = `
                【解説】<br>
                1. 直線 l の傾きを求めます。<br>
                放物線 y = ${aDisplay}x<sup>2</sup> と直線の交点の x 座標を p, q とすると、直線の傾きは ${a}(p + q) で表されます。<br>
                p = ${xP}, q = ${xQ} より、直線 l の傾きは ${a} × (${xP} + (${xQ})) = ${m} です。<br><br>
                2. 直線 m についても平行（傾きが等しい）なので、x 座標の和は等しくなります。<br>
                p + q = r + s より、${xP} + ${xQ} = ${xR} + s から ${(xP + xQ)} = ${xR} + s となり、s = ${xS} となります。<br><br>
                3. 直線 m の式を求めます。<br>
                傾きが ${m} で点 R(${xR}, ${yR}) を通るため、<br>
                y = ${m}x + n<sub>2</sub> に代入すると ${yR} = ${m} × (${xR}) + n<sub>2</sub> より n<sub>2</sub> = ${n2} となります。<br>
                点 A は直線 m と y 軸の交点なので、その y 座標は ${n2} です。<br><br>
                【答え】 ${n2}
            `;

            return {
                problem: problemText,
                explanation: explanationText
            };
        }
    },
    "放物線と y 座標の比": {
        level: "難関私立",
        formula: "放物線上にある 2 点の y 座標の比を表せば，x 軸上の原点と挟む部分の長さの比も求められる。<br>y 座標の比が a : b なら x 軸上の原点からの長さの比 = √a : √b",
        generateRandom: function() {
            // 放物線の係数 a の候補（1/4, 1/2, 1, 2, 3, 4）からランダムに選択
            const a_options = [
                { val: 0.25, num: 1, den: 4, str: "1/4" },
                { val: 0.5,  num: 1, den: 2, str: "1/2" },
                { val: 1,    num: 1, den: 1, str: "1" },
                { val: 2,    num: 2, den: 1, str: "2" },
                { val: 3,    num: 3, den: 1, str: "3" },
                { val: 4,    num: 4, den: 1, str: "4" }
            ];
            const chosenA = a_options[Math.floor(Math.random() * a_options.length)];
            const a = chosenA.val;

            // B, C の x 座標のペア（緩やかな傾きから、傾きが急なパターンまで網羅）
            // ※ a=1/4 のときも y 座標が整数になるよう偶数を中心に設定
            let pairs = [
                { xB: -2, xC: 4 },
                { xB: -4, xC: 2 },
                { xB: -2, xC: 6 },
                { xB: -6, xC: 2 },
                { xB: -4, xC: 6 },
                { xB: -6, xC: 4 },
                // 傾きが急になるペア（左右の原点からの距離の差が大きい）
                { xB: -2, xC: 8 },
                { xB: -8, xC: 2 },
                { xB: -2, xC: 10 },
                { xB: -10, xC: 2 },
                // 奇数を含む標準ペア
                { xB: -3, xC: 5 },
                { xB: -5, xC: 3 },
                { xB: -3, xC: 7 },
                { xB: -7, xC: 3 }
            ];

            // 1/4や1/2のときは、分母の制約に合うペアを少し絞る（偶数xB, xC）
            let filteredPairs = pairs;
            if (chosenA.den === 4) {
                filteredPairs = pairs.filter(p => p.xB % 2 === 0 && p.xC % 2 === 0);
            }

            const chosenPair = filteredPairs[Math.floor(Math.random() * filteredPairs.length)];
            const xB = chosenPair.xB;
            const xC = chosenPair.xC;

            const yB = a * xB * xB;
            const yC = a * xC * xC;

            // 2点 B(xB, yB), C(xC, yC) を通る直線の式 y = m * x + n を求める
            const m = (yC - yB) / (xC - xB);
            const n = yB - m * xB;

            // 直線と x 軸の交点 A の x 座標 (-n / m) を厳密な分数として計算
            let xA_num = -n;
            let xA_den = m;
            if (xA_den < 0) {
                xA_num = -xA_num;
                xA_den = -xA_den;
            }
            function gcd(x, y) {
                return y === 0 ? x : gcd(y, x % y);
            }
            const gA = gcd(Math.abs(xA_num), Math.abs(xA_den));
            xA_num /= gA;
            xA_den /= gA;

            const xA_val = xA_num / xA_den;
            
            // 綺麗に縦に並ぶ分数用のHTML生成関数
            function formatFraction(num, den) {
                if (den === 1) return `${num}`;
                let displayNum = num;
                let isNegative = false;
                if (num < 0) {
                    isNegative = true;
                    displayNum = Math.abs(num);
                }
                const fracHtml = `<span style="display: inline-block; vertical-align: middle; text-align: center; font-size: 0.9em; margin: 0 2px;"><span style="display: block; border-bottom: 1px solid #000; padding-bottom: 1px;">${displayNum}</span><span style="display: block; padding-top: 1px;">${den}</span></span>`;
                return isNegative ? `-${fracHtml}` : fracHtml;
            }

            const xA_str = formatFraction(xA_num, xA_den);

            // 問題文用の AB : BC の比を計算（分母を揃えて整数比にする）
            const scale = xA_den;
            const intAB = Math.abs(xA_num - xB * scale);
            const intBC = Math.abs(xB * scale - xC * scale);
            const gRatio = gcd(intAB, intBC);
            const ratioAB = intAB / gRatio;
            const ratioBC = intBC / gRatio;

            // 1. BP と CQ の比（y 座標の比 = yB : yC）
            let bpY = yB * chosenA.den;
            let cqY = yC * chosenA.den;
            const gY = gcd(Math.abs(bpY), Math.abs(cqY));
            const ratioBP = bpY / gY;
            const ratioCQ = cqY / gY;

            // 2. OP と OQ の長さの比
            const opLen = Math.abs(xB);
            const oqLen = Math.abs(xC);
            const gO = gcd(opLen, oqLen);
            const ratioOP = opLen / gO;
            const ratioOQ = oqLen / gO;

            // 3. AP : OP : OQ の連比を計算
            const r3_1 = intAB;
            const r3_2 = Math.abs(xB) * scale;
            const r3_3 = Math.abs(xC) * scale;
            const g3 = gcd(gcd(r3_1, r3_2), r3_3);
            const rAP = r3_1 / g3;
            const rOP = r3_2 / g3;
            const rOQ = r3_3 / g3;

            // --- グラフの描画範囲を動的に計算して見切れを完全に防止（急な傾きにも完全対応） ---
            const xMin = Math.min(xA_val, xB, 0) - 6;
            const xMax = Math.max(xC, xA_val, 0) + 6;
            
            const yMin = Math.min(-6, yB, yC, m * xMin + n, m * xMax + n, 0) - 5;
            const yMax = Math.max(25, yB, yC, m * xMin + n, m * xMax + n, a * xMin * xMin, a * xMax * xMax) + 8;

            const width = 320;
            const height = 320;

            function toSvgX(x) {
                return ((x - xMin) / (xMax - xMin)) * width;
            }
            function toSvgY(y) {
                return height - ((y - yMin) / (yMax - yMin)) * height;
            }

            let svg = `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="background:#fff; border:1px solid #ccc; border-radius:4px; max-width:320px; display:block; margin:0 auto;">`;

            // 軸の描画
            svg += `<line x1="${toSvgX(0)}" y1="0" x2="${toSvgX(0)}" y2="${height}" stroke="#ccc" stroke-width="1" />`;
            svg += `<line x1="0" y1="${toSvgY(0)}" x2="${width}" y2="${toSvgY(0)}" stroke="#ccc" stroke-width="1" />`;

            // 放物線の描画 (y = ax²)
            let parabolaPath = "";
            for (let px = xMin; px <= xMax; px += 0.05) {
                let py = a * px * px;
                let sx = toSvgX(px);
                let sy = toSvgY(py);
                parabolaPath += (parabolaPath === "" ? "M " : "L ") + `${sx} ${sy} `;
            }
            svg += `<path d="${parabolaPath}" fill="none" stroke="#2563eb" stroke-width="2" />`;

            // 直線の描画 (y = mx + n)
            svg += `<line x1="${toSvgX(xMin)}" y1="${toSvgY(m * xMin + n)}" x2="${toSvgX(xMax)}" y2="${toSvgY(m * xMax + n)}" stroke="#dc2626" stroke-width="1.5" />`;

            // 垂線 P(xB, 0), Q(xC, 0) の描画
            svg += `<line x1="${toSvgX(xB)}" y1="${toSvgY(0)}" x2="${toSvgX(xB)}" y2="${toSvgY(yB)}" stroke="#666" stroke-dasharray="3,3" stroke-width="1" />`;
            svg += `<line x1="${toSvgX(xC)}" y1="${toSvgY(0)}" x2="${toSvgX(xC)}" y2="${toSvgY(yC)}" stroke="#666" stroke-dasharray="3,3" stroke-width="1" />`;

            // 点 A, B, C, P, Q のプロット
            const points = [
                { name: "A", x: xA_val, y: 0 },
                { name: "B", x: xB, y: yB },
                { name: "C", x: xC, y: yC },
                { name: "P", x: xB, y: 0 },
                { name: "Q", x: xC, y: 0 }
            ];

            points.forEach(pt => {
                svg += `<circle cx="${toSvgX(pt.x)}" cy="${toSvgY(pt.y)}" r="3" fill="#000" />`;
                let offsetH = pt.name === "P" || pt.name === "Q" ? -10 : 6;
                let offsetV = pt.name === "P" || pt.name === "Q" ? 12 : -6;
                svg += `<text x="${toSvgX(pt.x) + offsetH}" y="${toSvgY(pt.y) + offsetV}" font-size="12" font-weight="bold" fill="#000">${pt.name}</text>`;
            });

            svg += `</svg>`;

            const aDisplay = chosenA.str === "1" ? '' : (chosenA.den > 1 ? formatFraction(chosenA.num, chosenA.den) : chosenA.str);

            const problemText = `
                放物線 y = ${aDisplay}x<sup>2</sup> と直線が 2 点 B, C で交わっている。<br>
                直線と x 軸の交点を A とする。2 点 B, C から x 軸に向けた垂線の足をそれぞれ P, Q とする。<br>
                AB : BC = ${ratioAB} : ${ratioBC}、点 A の x 座標が ${xA_str} のとき、B と C の x 座標を求めなさい。
                <div style="text-align:center; margin-top:10px;">${svg}</div>
            `;

            const explanationText = `
                【解説】<br>
                1. まず、点 B, C の y 座標の比（BP : CQ）を求めます。<br>
                BP : CQ は相似を利用して ${ratioBP} : ${ratioCQ} となります。<br>
                ここから公式（原点からの長さの比 = √y座標の比）を使うと、原点 O からの長さの比は OP : OQ = ${ratioOP} : ${ratioOQ} と求められます。<br><br>
                2. 次に、三角形の相似や線分の比を利用して、AP : OP : OQ の連比を求めます。<br>
                問題文の AB : BC = ${ratioAB} : ${ratioBC} の情報と組み合わせることで、具体的な連比は <br>
                AP : OP : OQ = ${rAP} : ${rOP} : ${rOQ} となります。<br><br>
                3. 点 A の x 座標が ${xA_str} であることを基準にして比例配分し、B と C の x 座標を求めます。<br><br>
                【答え】 B の x 座標：${xB}、C の x 座標：${xC}
            `;

            return {
                problem: problemText,
                explanation: explanationText
            };
        }
    },
        "斜めの線分の長さを求める": {
            level: "公立",
            formula: "座標平面では，座標軸に対して，「平行」や「垂直」をどこでも作ることができるので，斜めの線分の長さを求める問題では斜めの線分を斜辺とする直角三角形を作り、2点の座標から三平方の定理で求める。<br>また3 辺の比は，斜辺の傾きに注目し，三平方の定理を利用することで求められる。よって，あとは x 座標の差がわかれば，斜めの線分の長さを求められる。",
            generateRandom: function() {
                // 綺麗な比になる組み合わせ (横の比 q, 縦の比 p, 平方根の中身 sq)
                const basePatterns = [
                    { p: 2, q: 3, sq: 13, ratioStr: "3 : 2 : \\sqrt{13}" },
                    { p: 3, q: 4, sq: 25, ratioStr: "4 : 3 : 5" },
                    { p: 4, q: 3, sq: 25, ratioStr: "3 : 4 : 5" },
                    { p: 1, q: 2, sq: 5,  ratioStr: "2 : 1 : \\sqrt{5}" },
                    { p: 1, q: 1, sq: 2,  ratioStr: "1 : 1 : \\sqrt{2}" }
                ];
                const pat = basePatterns[Math.floor(Math.random() * basePatterns.length)];
                
                // 傾きをランダムで「正」または「負」にする
                const sign = Math.random() < 0.5 ? 1 : -1;
                const p = pat.p * sign;
                
                const mText = (sign === -1 ? "-" : "") + (pat.p === 1 && pat.q === 1 ? "1" : `\\frac{${pat.p}}{${pat.q}}`);

                const k = 1;
                const dx = pat.q * k;
                const dy = p * k;

                // 座標のランダム配置（第1〜第4象限）
                const xA = Math.floor(Math.random() * 7) - 4; // -4 〜 2
                const xB = xA + dx;
                const yA = Math.floor(Math.random() * 7) - 3; // -3 〜 3
                const yB = yA + dy;

                const slope = dy / dx;

                // --- 平方根を必ず「√」の形で美しく表現する処理 ---
                let lengthStr = "";
                const rawVal = dx * Math.sqrt(pat.sq) / pat.q;
                
                if (Number.isInteger(rawVal)) {
                    lengthStr = rawVal.toString();
                } else {
                    const coeff = dx / pat.q;
                    lengthStr = (coeff === 1 ? "" : coeff) + `\\sqrt{${pat.sq}}`;
                }

                // --- グラフ（SVG）の動的生成 ---
                const svgW = 220, svgH = 220;
                
                const minX = Math.min(xA, xB, 0) - 2;
                const maxX = Math.max(xA, xB, 0) + 2;
                const minY = Math.min(yA, yB, 0) - 2;
                const maxY = Math.max(yA, yB, 0) + 2;
                
                const toSvgX = (x) => 30 + (x - minX) / (maxX - minX) * 160;
                const toSvgY = (y) => 190 - (y - minY) / (maxY - minY) * 160;

                const axSvg = toSvgX(xA), aySvg = toSvgY(yA);
                const bxSvg = toSvgX(xB), bySvg = toSvgY(yB);

                const lineX1 = minX;
                const lineY1 = slope * (minX - xA) + yA;
                const lineX2 = maxX;
                const lineY2 = slope * (maxX - xA) + yA;

                let svgGraph = `<svg width="${svgW}" height="${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto;">`;
                
                const originX = toSvgX(0);
                const originY = toSvgY(0);
                svgGraph += `<line x1="20" y1="${originY}" x2="200" y2="${originY}" stroke="#555" stroke-width="1.2" />`; // x軸
                svgGraph += `<line x1="${originX}" y1="20" x2="${originX}" y2="200" stroke="#555" stroke-width="1.2" />`; // y軸
                svgGraph += `<text x="205" y="${originY + 4}" font-size="11" fill="#333">x</text>`;
                svgGraph += `<text x="${originX + 4}" y="15" font-size="11" fill="#333">y</text>`;
                svgGraph += `<text x="${originX - 12}" y="${originY + 12}" font-size="10" fill="#333">0</text>`;

                // 直線AB（全体）
                svgGraph += `<line x1="${toSvgX(lineX1)}" y1="${toSvgY(lineY1)}" x2="${toSvgX(lineX2)}" y2="${toSvgY(lineY2)}" stroke="#337ab7" stroke-width="1.5" />`;

                // 線分ABの強調
                svgGraph += `<line x1="${axSvg}" y1="${aySvg}" x2="${bxSvg}" y2="${bySvg}" stroke="#d9534f" stroke-width="2.5" />`;

                // 点A, Bのプロットとラベル
                svgGraph += `<circle cx="${axSvg}" cy="${aySvg}" r="4" fill="#d9534f" />`;
                svgGraph += `<text x="${axSvg - 14}" y="${aySvg + 4}" font-size="11" font-weight="bold" fill="#d9534f">A</text>`;
                svgGraph += `<circle cx="${bxSvg}" cy="${bySvg}" r="4" fill="#d9534f" />`;
                svgGraph += `<text x="${bxSvg + 6}" y="${bySvg - 4}" font-size="11" font-weight="bold" fill="#d9534f">B</text>`;
                svgGraph += `</svg>`;

                return {
                    problem: `2 点 \\(A(${xA}, ${yA})\\)、\\(B(${xB}, ${yB})\\) があります。直線 \\(AB\\) の傾きが \\(${mText}\\) のとき、線分 \\(AB\\) の長さを求めなさい。<br>` +
                             svgGraph,
                    explanation: `【解説】<br>` +
                                 `1. 直線の傾きの絶対値に注目すると、直角三角形の（横：縦：斜め）の比は \\(${pat.ratioStr}\\) になります。<br>` +
                                 `2. 点 \\(A\\) から点 \\(B\\) までの \\(x\\) 座標の差（横の長さ）は、<br>` +
                                 `　\\(${xB} - (${xA}) = ${dx}\\)<br>` +
                                 `3. したがって、線分 \\(AB\\) の長さは、\\(x\\) 座標の差に「\\(\\frac{\\text{斜めの比}}{\\text{横の比}}\\)」をかけて求めます。<br>` +
                                 `　\\(${dx} \\times \\frac{\\sqrt{${pat.sq}}}{${pat.q}} = \\mathbf{${lengthStr}}\\) と求められます。`
                };
            },
            problem: "\\(x\\) 座標はそれぞれ 2、8 の 2 点 \\(A\\)、\\(B\\) があります。直線 \\(AB\\) の傾きが \\(\\frac{2}{3}\\) のとき、線分 \\(AB\\) の長さを求めなさい。",
            explanation: "【解説】<br>1. 傾きが \\(\\frac{2}{3}\\) より、直角三角形の比（横：縦：斜め）は \\(3 : 2 : \\sqrt{13}\\) です。<br>2. \\(x\\) 座標の差は \\(8 - 2 = 6\\) です。<br>3. \\(x\\) 座標の差 \\(6\\) に斜めの比を横の比で割ったもの（\\(\\frac{\\sqrt{13}}{3}\\)）をかけて、\\(6 \\times \\frac{\\sqrt{13}}{3} = 2\\sqrt{13}\\) と求められます。"
        },
        "直線と点の距離": {
            level: "難関私立",
            formula: "点Aから直線に下ろした 垂線の長さを求めたい 時、点Aを通り y 軸に平行な線を引く。<br>" +
                     "直線の傾きがわかると，直角三角形の 3 辺の比が求められる。 直線によってできる直角三角形BCPと，△APH は相似になる。AP の長さを求めることができるので，垂線の長さが求められる。<br>" +
                     // --- 公式欄用の例グラフ (SVG: 固定の基本例) ---
                     (() => {
                         const svgW = 200, svgH = 200;
                         const ox = 50, oy = 155, scale = 22;
                         const tx = (x) => ox + x * scale;
                         const ty = (y) => oy - y * scale;
                         
                         const B = {x: 0, y: 3}, A = {x: 3, y: 2}, P = {x: 3, y: 4.5}, H = {x: 2, y: 4}, C = {x: 3, y: 3};
                         
                         let s = `<svg width="${svgW}" height="${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 6px auto;">`;
                         s += `<line x1="20" y1="${oy}" x2="190" y2="${oy}" stroke="#555" stroke-width="1.2" />`;
                         s += `<line x1="${ox}" y1="20" x2="${ox}" y2="180" stroke="#555" stroke-width="1.2" />`;
                         s += `<text x="193" y="${oy + 12}" font-size="10" fill="#333">x</text>`;
                         s += `<text x="${ox + 6}" y="25" font-size="10" fill="#333">y</text>`;
                         s += `<text x="${ox - 10}" y="${oy + 12}" font-size="9" fill="#333">0</text>`;
                         
                         s += `<line x1="${tx(-1)}" y1="${ty(2.5)}" x2="${tx(5)}" y2="${ty(5.5)}" stroke="#337ab7" stroke-width="1.5" />`;
                         s += `<line x1="${tx(B.x)}" y1="${ty(B.y)}" x2="${tx(C.x)}" y2="${ty(C.y)}" stroke="#666" stroke-dasharray="3,3" stroke-width="1.2" />`;
                         s += `<line x1="${tx(C.x)}" y1="${ty(C.y)}" x2="${tx(P.x)}" y2="${ty(P.y)}" stroke="#666" stroke-dasharray="3,3" stroke-width="1.2" />`;
                         s += `<line x1="${tx(A.x)}" y1="${ty(A.y)}" x2="${tx(P.x)}" y2="${ty(P.y)}" stroke="#d9534f" stroke-width="2.5" />`;
                         s += `<line x1="${tx(P.x)}" y1="${ty(P.y)}" x2="${tx(H.x)}" y2="${ty(H.y)}" stroke="#d9534f" stroke-width="2.5" />`;
                         s += `<line x1="${tx(H.x)}" y1="${ty(H.y)}" x2="${tx(A.x)}" y2="${ty(A.y)}" stroke="#d9534f" stroke-width="2.5" />`;
                         
                         s += `<circle cx="${tx(A.x)}" cy="${ty(A.y)}" r="3.5" fill="#d9534f" /><text x="${tx(A.x) + 5}" y="${ty(A.y) + 4}" font-size="10" fill="#d9534f" font-weight="bold">A</text>`;
                         s += `<circle cx="${tx(B.x)}" cy="${ty(B.y)}" r="3.5" fill="#337ab7" /><text x="${tx(B.x) - 15}" y="${ty(B.y) + 3}" font-size="10" fill="#337ab7" font-weight="bold">B</text>`;
                         s += `<circle cx="${tx(P.x)}" cy="${ty(P.y)}" r="3.5" fill="#337ab7" /><text x="${tx(P.x) + 5}" y="${ty(P.y) - 4}" font-size="10" fill="#337ab7" font-weight="bold">P</text>`;
                         s += `<circle cx="${tx(H.x)}" cy="${ty(H.y)}" r="3.5" fill="#d9534f" /><text x="${tx(H.x) - 16}" y="${ty(H.y) - 4}" font-size="10" fill="#d9534f" font-weight="bold">H</text>`;
                         s += `</svg>`;
                         return s;
                     })(),
            generateRandom: function() {
                // 第1〜第4象限に散らばる、解説の数値をすべて分数で表現したランダムパターン
                const pats = [
                    { m: 0.5,  mText: "\\frac{1}{2}",  n: 3,  xA: 3,  yA: 2,   yVal: 4.5, yPText: "\\frac{9}{2}", ap: "\\frac{5}{2}", ratio: "1 : 2 : \\sqrt{5}", formulaCalc: "\\frac{5}{2} \\times \\frac{2}{\\sqrt{5}}", ans: "\\sqrt{5}" },
                    { m: 2,    mText: "2",           n: 1,  xA: 2,  yA: -3,  yVal: 5,   yPText: "5",          ap: "8",           ratio: "2 : 1 : \\sqrt{5}", formulaCalc: "8 \\times \\frac{1}{\\sqrt{5}}", ans: "\\frac{8\\sqrt{5}}{5}" },
                    { m: -0.5, mText: "-\\frac{1}{2}", n: 4,  xA: -2, yA: 1,   yVal: 5,   yPText: "5",          ap: "4",           ratio: "1 : 2 : \\sqrt{5}", formulaCalc: "4 \\times \\frac{2}{\\sqrt{5}}", ans: "\\frac{8\\sqrt{5}}{5}" },
                    { m: 1.5,  mText: "\\frac{3}{2}",  n: 2,  xA: -2, yA: -3,  yVal: -1,  yPText: "-1",         ap: "2",           ratio: "3 : 2 : \\sqrt{13}", formulaCalc: "2 \\times \\frac{2}{\\sqrt{13}}", ans: "\\frac{4\\sqrt{13}}{13}" },
                    { m: -2,   mText: "-2",          n: 5,  xA: 1,  yA: -1,  yVal: 3,   yPText: "3",          ap: "4",           ratio: "2 : 1 : \\sqrt{5}", formulaCalc: "4 \\times \\frac{1}{\\sqrt{5}}", ans: "\\frac{4\\sqrt{5}}{5}" }
                ];
                const pat = pats[Math.floor(Math.random() * pats.length)];
                
                const B = {x: 0, y: pat.n}, A = {x: pat.xA, y: pat.yA};
                const P = {x: pat.xA, y: pat.yVal};
                
                const denom = 1 + pat.m * pat.m;
                const hx = (pat.xA + pat.m * pat.yA - pat.m * pat.n) / denom;
                const hy = pat.m * hx + pat.n;
                const H = {x: hx, y: hy};
                const C = {x: pat.xA, y: pat.n};

                // --- グラフが絶対に見切れないよう、座標範囲からスケールと原点を動的計算 ---
                const allX = [0, A.x, H.x];
                const allY = [pat.n, A.y, P.y, H.y];
                const minX = Math.min(...allX) - 2;
                const maxX = Math.max(...allX) + 2;
                const minY = Math.min(...allY) - 2;
                const maxY = Math.max(...allY) + 2;

                const svgW = 200, svgH = 200;
                const scaleX = 150 / (maxX - minX || 1);
                const scaleY = 150 / (maxY - minY || 1);
                const scale = Math.min(scaleX, scaleY);

                const ox = 20 + (-minX) * scale;
                const oy = 180 - (-minY) * scale;

                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg width="${svgW}" height="${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto;">`;
                
                // 軸の描画
                svgGraph += `<line x1="15" y1="${oy}" x2="185" y2="${oy}" stroke="#555" stroke-width="1.2" />`;
                svgGraph += `<line x1="${ox}" y1="15" x2="${ox}" y2="185" stroke="#555" stroke-width="1.2" />`;
                svgGraph += `<text x="188" y="${oy + 4}" font-size="9" fill="#333">x</text>`;
                svgGraph += `<text x="${ox + 4}" y="12" font-size="9" fill="#333">y</text>`;
                svgGraph += `<text x="${ox - 10}" y="${oy + 10}" font-size="8" fill="#333">0</text>`;

                // 直線
                svgGraph += `<line x1="${tx(minX - 1)}" y1="${ty(pat.m * (minX - 1) + pat.n)}" x2="${tx(maxX + 1)}" y2="${ty(pat.m * (maxX + 1) + pat.n)}" stroke="#337ab7" stroke-width="1.5" />`;
                
                // 三角形BCP（破線）
                svgGraph += `<line x1="${tx(B.x)}" y1="${ty(B.y)}" x2="${tx(C.x)}" y2="${ty(C.y)}" stroke="#666" stroke-dasharray="3,3" stroke-width="1.2" />`;
                svgGraph += `<line x1="${tx(C.x)}" y1="${ty(C.y)}" x2="${tx(P.x)}" y2="${ty(P.y)}" stroke="#666" stroke-dasharray="3,3" stroke-width="1.2" />`;
                
                // 三角形APH（太線）
                svgGraph += `<line x1="${tx(A.x)}" y1="${ty(A.y)}" x2="${tx(P.x)}" y2="${ty(P.y)}" stroke="#d9534f" stroke-width="2.5" />`;
                svgGraph += `<line x1="${tx(P.x)}" y1="${ty(P.y)}" x2="${tx(H.x)}" y2="${ty(H.y)}" stroke="#d9534f" stroke-width="2.5" />`;
                svgGraph += `<line x1="${tx(H.x)}" y1="${ty(H.y)}" x2="${tx(A.x)}" y2="${ty(A.y)}" stroke="#d9534f" stroke-width="2.5" />`;
                
                // 点
                svgGraph += `<circle cx="${tx(A.x)}" cy="${ty(A.y)}" r="3.5" fill="#d9534f" /><text x="${tx(A.x) + 5}" y="${ty(A.y) + 4}" font-size="10" fill="#d9534f" font-weight="bold">A</text>`;
                svgGraph += `<circle cx="${tx(B.x)}" cy="${ty(B.y)}" r="3.5" fill="#337ab7" /><text x="${tx(B.x) - 14}" y="${ty(B.y) + 3}" font-size="10" fill="#337ab7" font-weight="bold">B</text>`;
                svgGraph += `<circle cx="${tx(P.x)}" cy="${ty(P.y)}" r="3.5" fill="#337ab7" /><text x="${tx(P.x) + 5}" y="${ty(P.y) - 4}" font-size="10" fill="#337ab7" font-weight="bold">P</text>`;
                svgGraph += `<circle cx="${tx(H.x)}" cy="${ty(H.y)}" r="3.5" fill="#d9534f" /><text x="${tx(H.x) - 16}" y="${ty(H.y) - 4}" font-size="10" fill="#d9534f" font-weight="bold">H</text>`;
                svgGraph += `</svg>`;

                return {
                    problem: `点 \\(A(${pat.xA}, ${pat.yA})\\) から直線 \\(y = ${pat.mText}x + ${pat.n}\\) まで引いた垂線の長さを求めなさい。<br>` + svgGraph,
                    explanation: `【解説】<br>` +
                                 `1. 直線の傾きが \\(${pat.mText}\\) なので、三角形の三辺比（縦 : 横 : 斜辺）は \\(${pat.ratio}\\) です。<br>` +
                                 `2. 点 \\(A(${pat.xA}, ${pat.yA})\\) を通り \\(y\\) 軸に平行な線を引き、直線 \\(y = ${pat.mText}x + ${pat.n}\\) との交点 \\(P\\) の座標を求めると、\\(P(${pat.xA}, ${pat.yPText})\\) となります。<br>` +
                                 `3. 線分 \\(AP\\) の長さを求めると、\\(${pat.ap}\\) になります。<br>` +
                                 `4. 垂線の長さを求める式は \\(${pat.formulaCalc} = \\mathbf{${pat.ans}}\\) と求められます。`
                };
            },
            problem: "点 \\(A(3, 2)\\) から直線 \\(y = \\frac{1}{2}x + 3\\) まで引いた垂線の長さを求めなさい。",
            explanation: "【解説】<br>1. 直線の傾きが \\(\\frac{1}{2}\\) なので、三角形の三辺比（縦 : 横 : 斜辺）は \\(1 : 2 : \\sqrt{5}\\) です。<br>2. 点 \\(A\\) から \\(y\\) 軸に平行な線を引いて直線との交点 \\(P\\) の座標を求めると、\\(P(3, \\frac{9}{2})\\) となります。<br>3. 線分 \\(AP\\) の長さを求めると、\\(\\frac{5}{2}\\) になります。<br>4. 垂線の長さを求める式は \\(\\frac{5}{2} \\times \\frac{2}{\\sqrt{5}} = \\mathbf{\\sqrt{5}}\\) と求められます。"
        },
        "中点の座標": {
            level: "公立",
            formula: "2点 \\((a, b)\\) と \\((c, d)\\) の中点は、それぞれの \\(x\\) 座標、\\(y\\) 座標を足して 2 で割ることで求めることができる。<br>" +
                     "中点の \\(x\\) 座標は \\(\\frac{a + c}{2}\\)、\\(y\\) 座標は \\(\\frac{b + d}{2}\\) となり、座標は \\(\\left(\\frac{a + c}{2}, \\frac{b + d}{2}\\right)\\) で表される。",
            generateRandom: function() {
                // ランダムなパターン（整数および分数で綺麗に表せる組み合わせ）
                const pats = [
                    { x1: -2, y1: 3, x2: 4, y2: -1, xSum: "(-2) + 4", xRes: "1", ySum: "3 + (-1)", yRes: "1", ans: "(1, 1)" },
                    { x1: -3, y1: 2, x2: 5, y2: 6,  xSum: "(-3) + 5", xRes: "1", ySum: "2 + 6", yRes: "4", ans: "(1, 4)" },
                    { x1: 1,  y1: -2, x2: 4, y2: 5,  xSum: "1 + 4", xRes: "\\frac{5}{2}", ySum: "(-2) + 5", yRes: "\\frac{3}{2}", ans: "\\left(\\frac{5}{2}, \\frac{3}{2}\\right)" },
                    { x1: -4, y1: -3, x2: 2, y2: 1,  xSum: "(-4) + 2", xRes: "-1", ySum: "(-3) + 1", yRes: "-1", ans: "(-1, -1)" },
                    { x1: -1, y1: 5,  x2: 3, y2: -2, xSum: "(-1) + 3", xRes: "1", ySum: "5 + (-2)", yRes: "\\frac{3}{2}", ans: "\\left(1, \\frac{3}{2}\\right)" }
                ];
                const pat = pats[Math.floor(Math.random() * pats.length)];
                
                const A = {x: pat.x1, y: pat.y1}, B = {x: pat.x2, y: pat.y2};
                const mxVal = (pat.x1 + pat.x2) / 2;
                const myVal = (pat.y1 + pat.y2) / 2;

                // --- グラフが絶対に見切れないよう、座標範囲からスケールと原点を動的計算 ---
                const allX = [A.x, B.x, mxVal];
                const allY = [A.y, B.y, myVal];
                const minX = Math.min(...allX) - 2;
                const maxX = Math.max(...allX) + 2;
                const minY = Math.min(...allY) - 2;
                const maxY = Math.max(...allY) + 2;

                const svgW = 200, svgH = 200;
                const scaleX = 150 / (maxX - minX || 1);
                const scaleY = 150 / (maxY - minY || 1);
                const scale = Math.min(scaleX, scaleY);

                const ox = 20 + (-minX) * scale;
                const oy = 180 - (-minY) * scale;

                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg width="${svgW}" height="${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto;">`;
                
                // 軸の描画
                svgGraph += `<line x1="15" y1="${oy}" x2="185" y2="${oy}" stroke="#555" stroke-width="1.2" />`;
                svgGraph += `<line x1="${ox}" y1="15" x2="${ox}" y2="185" stroke="#555" stroke-width="1.2" />`;
                svgGraph += `<text x="188" y="${oy + 4}" font-size="9" fill="#333">x</text>`;
                svgGraph += `<text x="${ox + 4}" y="12" font-size="9" fill="#333">y</text>`;
                svgGraph += `<text x="${ox - 10}" y="${oy + 10}" font-size="8" fill="#333">0</text>`;

                // 線分AB
                svgGraph += `<line x1="${tx(A.x)}" y1="${ty(A.y)}" x2="${tx(B.x)}" y2="${ty(B.y)}" stroke="#337ab7" stroke-width="1.5" />`;
                
                // 点A, B, M
                svgGraph += `<circle cx="${tx(A.x)}" cy="${ty(A.y)}" r="3.5" fill="#d9534f" /><text x="${tx(A.x) - 14}" y="${ty(A.y) + 4}" font-size="10" fill="#d9534f" font-weight="bold">A</text>`;
                svgGraph += `<circle cx="${tx(B.x)}" cy="${ty(B.y)}" r="3.5" fill="#d9534f" /><text x="${tx(B.x) + 5}" y="${ty(B.y) + 4}" font-size="10" fill="#d9534f" font-weight="bold">B</text>`;
                svgGraph += `<circle cx="${tx(mxVal)}" cy="${ty(myVal)}" r="3.5" fill="#f0ad4e" /><text x="${tx(mxVal) + 5}" y="${ty(myVal) - 5}" font-size="10" fill="#d9534f" font-weight="bold">M</text>`;
                svgGraph += `</svg>`;

                return {
                    problem: `2点 \\(A(${pat.x1}, ${pat.y1})\\), \\(B(${pat.x2}, ${pat.y2})\\) を結ぶ線分の中点の座標を求めなさい。<br>` + svgGraph,
                    explanation: `【解説】<br>` +
                                 `1. 中点の公式 \\(\\left(\\frac{x_1 + x_2}{2}, \\frac{y_1 + y_2}{2}\\right)\\) にそれぞれの座標を代入します。<br>` +
                                 `2. \\(x\\) 座標は \\(\\frac{${pat.xSum}}{2} = ${pat.xRes}\\) です。<br>` +
                                 `3. \\(y\\) 座標は \\(\\frac{${pat.ySum}}{2} = ${pat.yRes}\\) です。<br>` +
                                 `4. したがって、中点の座標は \\(\\mathbf{${pat.ans}}\\) と求められます。`
                };
            },
            problem: "2点 \\(A(-2, 3)\\), \\(B(4, -1)\\) を結ぶ線分の中点の座標を求めなさい。",
            explanation: "【解説】<br>1. 中点の公式 \\(\\left(\\frac{x_1 + x_2}{2}, \\frac{y_1 + y_2}{2}\\right)\\) にそれぞれの座標を代入します。<br>2. \\(x\\) 座標は \\(\\frac{-2 + 4}{2} = 1\\) です。<br>3. \\(y\\) 座標は \\(\\frac{3 + (-1)}{2} = 1\\) です。<br>4. したがって、中点の座標は \\(\\mathbf{(1, 1)}\\) と求められます。"
        },
        "グラフ上の内分点": {
            level: "難関私立",
            formula: "2点 \\((a, b)\\) と \\((c, d)\\) を結ぶ線分を \\(m : n\\) に内分する点の座標は、<br>" +
                     "\\(\\left(\\frac{an + cm}{m + n}, \\frac{bn + dm}{m + n}\\right)\\) で表すことができる。<br>" +
                     "分子はクロスのかけ算の和（\\(a\\) に \\(n\\) をかけ、\\(c\\) に \\(m\\) をかける）、分母は比の和 \\((m + n)\\) で覚えると覚えやすい。<br>" +
                     "※ <span style=\"color: #c0392b; font-weight: bold;\">x軸に垂線を下ろして横に比にした方が簡単かも</span>",
            generateRandom: function() {
                // 最大公約数を求めるヘルパー
                const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);

                let x1, y1, x2, y2, m, n;
                do {
                    x1 = Math.floor(Math.random() * 11) - 5; // -5 から 5
                    y1 = Math.floor(Math.random() * 11) - 5;
                    x2 = Math.floor(Math.random() * 11) - 5;
                    y2 = Math.floor(Math.random() * 11) - 5;
                    
                    m = Math.floor(Math.random() * 4) + 1; // 1 から 4
                    n = Math.floor(Math.random() * 4) + 1; // 1 から 4

                    // 条件：AとBのx座標やy座標の絶対値がそれぞれ一致しない、かつ x1 !== x2, y1 !== y2, m !== n (1:1回避)、最も簡単な整数比
                } while (
                    Math.abs(x1) === Math.abs(x2) || 
                    Math.abs(y1) === Math.abs(y2) || 
                    x1 === x2 || 
                    y1 === y2 || 
                    m === n || 
                    gcd(m, n) !== 1
                );

                // 常に左側をA、右側をBにする
                let A = {x: x1, y: y1};
                let B = {x: x2, y: y2};
                if (A.x > B.x) {
                    const temp = A;
                    A = B;
                    B = temp;
                }

                // 内分点 C の計算 (ABを m:n に内分する点)
                const cx = (n * A.x + m * B.x) / (m + n);
                const cy = (n * A.y + m * B.y) / (m + n);
                const C = {x: cx, y: cy};

                // ACの中点、BCの中点を計算（点は表示しない、比の表示用）
                const midAC = {x: (A.x + C.x) / 2, y: (A.y + C.y) / 2};
                const midBC = {x: (C.x + B.x) / 2, y: (C.y + B.y) / 2};

                // 既約分数化の関数
                const toFrac = (num, den) => {
                    const g = Math.abs(gcd(num, den));
                    let nNum = num / g, nDen = den / g;
                    if (nDen < 0) { nNum *= -1; nDen *= -1; }
                    if (nDen === 1) return `${nNum}`;
                    return `\\frac{${nNum}}{${nDen}}`;
                };

                const resX = toFrac(n * A.x + m * B.x, m + n);
                const resY = toFrac(n * A.y + m * B.y, m + n);
                const ansStr = (resX.includes('\\frac') || resY.includes('\\frac')) ? `\\left(${resX}, ${resY}\\right)` : `(${resX}, ${resY})`;

                // 別解用のパーツ計算
                const a_line_num = B.y - A.y;
                const a_line_den = B.x - A.x;
                const slopeStr = toFrac(a_line_num, a_line_den);
                
                const b_num = A.y * a_line_den - a_line_num * A.x;
                const b_den = a_line_den;
                const interceptStr = toFrac(b_num, b_den);
                const lineEq = `y = ${slopeStr === "1" ? "" : slopeStr === "-1" ? "-" : slopeStr}x ${b_num >= 0 ? "+ " + interceptStr : "- " + interceptStr.replace("-", "")}`;

                // --- グラフが絶対に見切れないよう、座標範囲からスケールと原点を動的計算 ---
                const allX = [A.x, B.x, C.x];
                const allY = [A.y, B.y, C.y];
                const minX = Math.min(...allX) - 2;
                const maxX = Math.max(...allX) + 2;
                const minY = Math.min(...allY) - 2;
                const maxY = Math.max(...allY) + 2;

                const svgW = 200, svgH = 200;
                const scaleX = 150 / (maxX - minX || 1);
                const scaleY = 150 / (maxY - minY || 1);
                const scale = Math.min(scaleX, scaleY);

                const ox = 20 + (-minX) * scale;
                const oy = 180 - (-minY) * scale;

                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg width="${svgW}" height="${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto;">`;
                
                // 軸の描画
                svgGraph += `<line x1="15" y1="${oy}" x2="185" y2="${oy}" stroke="#555" stroke-width="1.2" />`;
                svgGraph += `<line x1="${ox}" y1="15" x2="${ox}" y2="185" stroke="#555" stroke-width="1.2" />`;
                svgGraph += `<text x="188" y="${oy + 4}" font-size="9" fill="#333">x</text>`;
                svgGraph += `<text x="${ox + 4}" y="12" font-size="9" fill="#333">y</text>`;
                svgGraph += `<text x="${ox - 10}" y="${oy + 10}" font-size="8" fill="#333">0</text>`;

                // 線分AB
                svgGraph += `<line x1="${tx(A.x)}" y1="${ty(A.y)}" x2="${tx(B.x)}" y2="${ty(B.y)}" stroke="#337ab7" stroke-width="1.5" />`;
                
                // 点A, B, Cの描画
                svgGraph += `<circle cx="${tx(A.x)}" cy="${ty(A.y)}" r="3.5" fill="#d9534f" /><text x="${tx(A.x) - 14}" y="${ty(A.y) + 4}" font-size="10" fill="#d9534f" font-weight="bold">A</text>`;
                svgGraph += `<circle cx="${tx(B.x)}" cy="${ty(B.y)}" r="3.5" fill="#d9534f" /><text x="${tx(B.x) + 5}" y="${ty(B.y) + 4}" font-size="10" fill="#d9534f" font-weight="bold">B</text>`;
                svgGraph += `<circle cx="${tx(C.x)}" cy="${ty(C.y)}" r="3.5" fill="#f0ad4e" /><text x="${tx(C.x) + 5}" y="${ty(C.y) - 5}" font-size="10" fill="#f0ad4e" font-weight="bold">C</text>`;

                // 丸付き数字の割り当て
                const circledNums = ["", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
                const circM = circledNums[m] || `(${m})`;
                const circN = circledNums[n] || `(${n})`;

                svgGraph += `<text x="${tx(midAC.x) - 6}" y="${ty(midAC.y) - 6}" font-size="11" fill="#333" font-weight="bold">${circM}</text>`;
                svgGraph += `<text x="${tx(midBC.x) - 6}" y="${ty(midBC.y) - 6}" font-size="11" fill="#333" font-weight="bold">${circN}</text>`;

                svgGraph += `</svg>`;

                return {
                    problem: `点 \\(A(${A.x}, ${A.y})\\) と点 \\(B(${B.x}, ${B.y})\\) を結ぶ線分 \\(AB\\) を \\(${m} : ${n}\\) に内分する点 \\(C\\) の座標を求めなさい。<br>` + svgGraph,
                    explanation: `【解説】<br>` +
                                 `<strong>【解法1：公式を使う方法】</strong><br>` +
                                 `1. 内分点の公式 \\(\\left(\\frac{nX_1 + mX_2}{m + n}, \\frac{nY_1 + mY_2}{m + n}\\right)\\) に値を代入します。<br>` +
                                 `2. \\(x\\) 座標は \\(\\frac{${n} \\times (${A.x}) + ${m} \\times (${B.x})}{${m} + ${n}} = ${resX}\\) です。<br>` +
                                 `3. \\(y\\) 座標は \\(\\frac{${n} \\times (${A.y}) + ${m} \\times (${B.y})}{${m} + ${n}} = ${resY}\\) です。<br>` +
                                 `4. したがって、点 \\(C\\) の座標は \\(\\mathbf{${ansStr}}\\) と求められます。<br><br>` +
                                 `<strong>【解法2：別解（x軸に垂線を下ろす方法）】</strong><br>` +
                                 `1. 点 \\(A\\)、\\(B\\)、\\(C\\) から \\(x\\) 軸に垂線を下ろし、\\(x\\) 軸上の横の長さを考えます。<br>` +
                                 `2. \\(x\\) 軸上の比も問題文の比 \\(${m} : ${n}\\)（丸付き数字で \\(${circM} : ${circN}\\)）と一致することから、\\(A\\) から \\(C\\) までの横の距離の比が \\(${m}\\)、\\(C\\) から \\(B\\) までの横の距離の比が \\(${n}\\) となるため、この比を利用して \\(C\\) の \\(x\\) 座標を \\(${resX}\\) と求めることができます。<br>` +
                                 `3. 点 \\(A(${A.x}, ${A.y})\\) と点 \\(B(${B.x}, ${B.y})\\) の座標から直線 \\(AB\\) の式を求めると、\\(${lineEq}\\) となります。<br>` +
                                 `4. 求めた直線 \\(AB\\) の式に \\(C\\) の \\(x\\) 座標（\\(${resX}\\)）を代入すると、\\(y\\) 座標が \\(${resY}\\) と求まり、座標は \\(\\mathbf{${ansStr}}\\) となります。`
                };
            },
            problem: "点 \\(A(-9, 10)\\) と点 \\(B(3, 6)\\) を結ぶ線分 \\(AB\\) を \\(5:3\\) に分ける点 \\(C\\) の座標を求めなさい。",
            explanation: "【解説】<br>1. 内分点の公式に値を代入します。<br>2. \\(x\\) 座標は \\(\\frac{3 \\times (-9) + 5 \\times 3}{5 + 3} = -\\frac{9}{2}\\) です。<br>3. \\(y\\) 座標は \\(\\frac{3 \\times 10 + 5 \\times 6}{5 + 3} = 15\\) です。<br>4. したがって、点 \\(C\\) の座標は \\(\\mathbf{\\left(-\\frac{9}{2}, 15\\right)}\\) と求められます。"
        },
        "グラフ上のナナメの△の面積": {
            level: "公立",
            formula: "グラフ上のナナメの△の面積は、たてはば×よこはば×\\(\\frac{1}{2}\\)で求めることができる。<br>" +
                     // 公式欄用のグラフ
                     `<svg width="220" height="200" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto;">` +
                     `<defs>` +
                     `  <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">` +
                     `    <path d="M 0 0 L 10 5 L 0 10 z" fill="#e67e22"/>` +
                     `  </marker>` +
                     `  <marker id="arrow-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">` +
                     `    <path d="M 0 0 L 10 5 L 0 10 z" fill="#27ae60"/>` +
                     `  </marker>` +
                     `</defs>` +
                     // 三角形ABC
                     `<polygon points="55,60 100,150 145,105" fill="rgba(51, 122, 183, 0.15)" stroke="#337ab7" stroke-width="1.5" />` +
                     // 点A, B, C
                     `<circle cx="55" cy="60" r="3.5" fill="#d9534f" /><text x="40" y="63" font-size="10" fill="#d9534f" font-weight="bold">A</text>` +
                     `<circle cx="100" cy="150" r="3.5" fill="#d9534f" /><text x="108" y="155" font-size="10" fill="#d9534f" font-weight="bold">B</text>` +
                     `<circle cx="145" cy="105" r="3.5" fill="#d9534f" /><text x="152" y="105" font-size="10" fill="#d9534f" font-weight="bold">C</text>` +
                     // よこはば
                     `<line x1="55" y1="105" x2="145" y2="105" stroke="#e67e22" stroke-width="1.2" stroke-dasharray="3,3" marker-start="url(#arrow)" marker-end="url(#arrow)" />` +
                     `<text x="62" y="100" font-size="9" fill="#e67e22" font-weight="bold">よこはば</text>` +
                     // たてはば
                     `<line x1="100" y1="82.5" x2="100" y2="150" stroke="#27ae60" stroke-width="1.2" stroke-dasharray="3,3" marker-start="url(#arrow-green)" marker-end="url(#arrow-green)" />` +
                     `<text x="106" y="120" font-size="9" fill="#27ae60" font-weight="bold">たてはば</text>` +
                     `</svg>`,
            generateRandom: function() {
                // 放物線の係数 a をランダム（上に凸・下に凸を含む）
                const aValues = [0.5, 1, 2, -0.5, -1, -2];
                const a = aValues[Math.floor(Math.random() * aValues.length)];

                // x座標を3つランダムに選ぶ
                let xs = [];
                while (xs.length < 3) {
                    let rx = Math.floor(Math.random() * 9) - 4; // -4 から 4
                    if (!xs.includes(rx) && rx !== 0) xs.push(rx);
                }
                xs.sort((p, q) => p - q); // 昇順にソート (x1 < x2 < x3)

                const x1 = xs[0], x2 = xs[1], x3 = xs[2];
                const y1 = a * x1 * x1;
                const y2 = a * x2 * x2;
                const y3 = a * x3 * x3;

                const toFrac = (num, den) => {
                    const gcd = (p, q) => q === 0 ? p : gcd(q, p % q);
                    const g = Math.abs(gcd(num, den));
                    let nNum = num / g, nDen = den / g;
                    if (nDen < 0) { nNum *= -1; nDen *= -1; }
                    if (nDen === 1) return `${nNum}`;
                    return `\\frac{${nNum}}{${nDen}}`;
                };

                // マイナスを分数の前に綺麗に出し、分母が1のときは省略するカスタム分数変換
                const formatFracClean = (num, den) => {
                    const gcd = (p, q) => q === 0 ? p : gcd(q, p % q);
                    const g = Math.abs(gcd(num, den));
                    let nNum = num / g, nDen = den / g;
                    if (nDen === 0) return "0";
                    let isNeg = false;
                    if (nNum < 0) { isNeg = !isNeg; nNum = Math.abs(nNum); }
                    if (nDen < 0) { isNeg = !isNeg; nDen = Math.abs(nDen); }
                    
                    let body = "";
                    if (nDen === 1) {
                        body = `${nNum}`;
                    } else {
                        body = `\\frac{${nNum}}{${nDen}}`;
                    }
                    if (isNeg && body !== "0") {
                        if (nDen === 1) {
                            return `-${nNum}`;
                        } else {
                            return `-\\frac{${nNum}}{${nDen}}`;
                        }
                    }
                    return body;
                };

                const formatFracVal = (val) => {
                    const num = Math.round(val * 2);
                    const den = 2;
                    return formatFracClean(num, den);
                };

                // 放物線と交わる直線の公式を用いた係数計算
                const m_val = a * (x1 + x3);
                const k_val = -a * x1 * x3;

                // 傾き m の文字列表現（1や-1の省略、マイナスを前に出す、分母1の省略対応）
                let m_expr = "";
                if (m_val === 1) m_expr = "";
                else if (m_val === -1) m_expr = "-";
                else {
                    m_expr = formatFracVal(m_val);
                }

                // 切片 k の文字列表現（0の場合は完全に省略）
                let k_expr = "";
                if (k_val !== 0) {
                    const k_abs_str = formatFracVal(Math.abs(k_val));
                    if (k_val > 0) {
                        k_expr = ` + ${k_abs_str}`;
                    } else {
                        k_expr = ` - ${k_abs_str}`;
                    }
                }

                // 直線の式に B の x 座標を代入したときの y 値
                const subY_val = m_val * x2 + k_val;
                const subY_expr = formatFracVal(subY_val);

                // 厳密な数値計算用
                const m_num = y3 - y1;
                const m_den = x3 - x1;
                const k_num = y1 * m_den - m_num * x1;
                const k_den = m_den;

                const lineY_num = m_num * x2 * k_den + k_num * m_den;
                const lineY_den = m_den * k_den;

                const tate_num = Math.abs(lineY_num - y2 * lineY_den);
                const tate_den = lineY_den;

                const yoko = x3 - x1;

                const area_num = yoko * tate_num;
                const area_den = 2 * tate_den;
                const ansArea = toFrac(area_num, area_den);

                // --- 問題用グラフの安定化（y軸を中央に配置、原点を通る放物線） ---
                const svgW = 200, svgH = 200;
                
                const maxAbsX = Math.max(Math.abs(x1), Math.abs(x3)) + 1.0;
                const rangeX = maxAbsX;
                
                const allY = [y1, y2, y3, 0];
                let minY = Math.min(...allY) - 1.0;
                let maxY = Math.max(...allY) + 1.0;

                const plotW = 150;
                const plotH = 150;
                const scaleX = plotW / (2 * rangeX);
                const scaleY = plotH / (maxY - minY || 1);
                const scale = Math.min(scaleX, scaleY);

                const ox = 100;
                const oy = 25 + maxY * scale;

                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg width="${svgW}" height="${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto;">`;
                
                const axisMinX = 15, axisMaxX = 185;
                const axisMinY = 15, axisMaxY = 185;
                const clampedOy = Math.max(axisMinY, Math.min(axisMaxY, oy));

                svgGraph += `<line x1="${axisMinX}" y1="${clampedOy}" x2="${axisMaxX}" y2="${clampedOy}" stroke="#555" stroke-width="1.2" />`;
                svgGraph += `<line x1="${ox}" y1="${axisMinY}" x2="${ox}" y2="${axisMaxY}" stroke="#555" stroke-width="1.2" />`;
                svgGraph += `<text x="${axisMaxX + 3}" y="${clampedOy + 4}" font-size="9" fill="#333">x</text>`;
                svgGraph += `<text x="${ox + 4}" y="${axisMinY - 2}" font-size="9" fill="#333">y</text>`;
                svgGraph += `<text x="${ox - 10}" y="${clampedOy + 10}" font-size="8" fill="#333">0</text>`;

                let pathD = "";
                for (let px = -rangeX; px <= rangeX; px += 0.1) {
                    let py = a * px * px;
                    pathD += `${pathD === "" ? "M" : "L"} ${tx(px)} ${ty(py)} `;
                }
                svgGraph += `<path d="${pathD}" fill="none" stroke="#2c3e50" stroke-width="1.2" />`;

                svgGraph += `<polygon points="${tx(x1)},${ty(y1)} ${tx(x2)},${ty(y2)} ${tx(x3)},${ty(y3)}" fill="rgba(51, 122, 183, 0.15)" stroke="#337ab7" stroke-width="1.5" />`;

                svgGraph += `<circle cx="${tx(x1)}" cy="${ty(y1)}" r="3" fill="#d9534f" /><text x="${tx(x1) - 12}" y="${ty(y1) + 4}" font-size="9" fill="#d9534f" font-weight="bold">A</text>`;
                svgGraph += `<circle cx="${tx(x2)}" cy="${ty(y2)}" r="3" fill="#d9534f" /><text x="${tx(x2) + 5}" y="${ty(y2) - 5}" font-size="9" fill="#d9534f" font-weight="bold">B</text>`;
                svgGraph += `<circle cx="${tx(x3)}" cy="${ty(y3)}" r="3" fill="#d9534f" /><text x="${tx(x3) + 5}" y="${ty(y3) + 4}" font-size="9" fill="#d9534f" font-weight="bold">C</text>`;

                svgGraph += `</svg>`;

                let aStr = "";
                if (a === 1) aStr = "";
                else if (a === -1) aStr = "-";
                else aStr = formatFracVal(a);

                return {
                    problem: `\\(y = ${aStr}x^2\\) の放物線上に点 \\(A\\)、\\(B\\)、\\(C\\) がある。\\(x\\) 座標はそれぞれ \\(${x1}\\)、\\(${x2}\\)、\\(${x3}\\) である。<br>` +
                             `\\(\\triangle ABC\\) の面積を求めなさい。<br>` + svgGraph,
                    explanation: `【解説】<br>` +
                                 `1. グラフ上のナナメの三角形の面積は、公式「<strong>たてはば × よこはば × \\(\\frac{1}{2}\\)</strong>」を使ってすばやく求めることができます。<br>` +
                                 `2. <strong>よこはば</strong>は、最も左の点 \\(A(${x1})\\) と最も右の点 \\(C(${x3})\\) の \\(x\\) 座標の差です。<br>` +
                                 `   \\(\\text{よこはば} = ${x3} - (${x1}) = ${yoko}\\)<br>` +
                                 `3. <strong>たてはば</strong>を求めるため、点 \\(A\\) と点 \\(C\\) を結ぶ直線の式を求めます。<br>` +
                                 `   放物線と交わる直線の公式（傾き \\(a(x_1 + x_3)\\)、切片 \\(-ax_1x_3\\)）より、直線ACの式は<br>` +
                                 `   \\(y = ${m_expr}x${k_expr}\\) と表されます。<br>` +
                                 `4. この直線の式に点 \\(B\\) の \\(x\\) 座標 \\(${x2}\\) を代入すると、直線上の \\(y\\) 座標は \\(${subY_expr}\\) と求められます。<br>` +
                                 `   ここから点 \\(B\\) の \\(y\\) 座標との差をとることで、たてはば \\(${toFrac(tate_num, tate_den)}\\) が求められます。<br>` +
                                 `5. したがって、面積は \\(${yoko} \\times ${toFrac(tate_num, tate_den)} \\times \\frac{1}{2} = \\mathbf{${ansArea}}\\) となります。`
                };
            },
            problem: "...",
            explanation: "..."
        },
        "三角形の面積を等積変形で求める": {
            level: "公立",
            formula: "グラフ上の三角形の面積は、等積変形を利用して縦幅を \\(y\\) 軸上で求めると簡単に計算できる。<br>" +
                     "【手順 1】点 B から直線 AC に平行な線をひき、放物線との交点を D、\\(y\\) 軸との交点を E とする。また, 直線 AC と \\(y\\) 軸の交点を F とする。<br>" +
                     "【手順 2】等積変形し、\\(\\triangle ABC = \\triangle ACE\\)。たてはばは EF、よこはばは点 A と B の \\(x\\) 座標の差などで求める。<br>" +
                     "＊A，B，C の \\(x\\) 座標が全て数字であるときに特に威力を発揮する。<br>" +
                     // 【公式欄用SVG】ΔABCは半透明の灰色、ΔACEは青の実線と青の半透明で塗り潰し、点Fを追加
                     (() => {
                         const svgW = 220, svgH = 220;
                         const ox = 110, oy = 190, scale = 14;
                         const f = (x) => x * x; // y = x^2
                         
                         const xa = -3, xb = 1, xc = 2;
                         const ya = f(xa), yb = f(xb), yc = f(xc);
                         const xd = -2, yd = f(xd); // 点Dの座標 (-2, 4)
                         const ye = 2;              // 点Eのy座標 (0, 2)
                         const yf = 6;              // 点Fのy座標 (0, 6) ※直線AC: y = -x + 6 の切片
                         
                         const tx = (x) => ox + x * scale;
                         const ty = (y) => oy - y * scale;
                         
                         let pathD = "";
                         for (let px = -4.2; px <= 4.2; px += 0.1) {
                             let py = f(px);
                             pathD += `${pathD === "" ? "M" : "L"} ${tx(px)} ${ty(py)} `;
                         }
                         
                         // 直線ACの平行線（点B(1, 1)を通る傾き -1 の直線: y = -x + 2）
                         const m = -1;
                         const k_parallel = yb - m * xb;
                         const xStart = -4.2, xEnd = 4.2;
                         const parallelLineD = `M ${tx(xStart)} ${ty(m * xStart + k_parallel)} L ${tx(xEnd)} ${ty(m * xEnd + k_parallel)}`;
                         
                         return `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 220px;">` +
                                `<style>` +
                                `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                                `  .svg-bold { font-weight: bold; }` +
                                `</style>` +
                                // 軸
                                `<line x1="20" y1="${oy}" x2="200" y2="${oy}" stroke="#000" stroke-width="1"/>` +
                                `<line x1="${ox}" y1="20" x2="${ox}" y2="210" stroke="#000" stroke-width="1"/>` +
                                `<polygon points="195,${oy-3} 200,${oy} 195,${oy+3}" fill="#000"/>` +
                                `<polygon points="${ox},17 ${ox-3},20 ${ox+3},20" fill="#000"/>` +
                                `<text x="203" y="${oy+3}" class="svg-text" font-style="italic">x</text>` +
                                `<text x="${ox-12}" y="25" class="svg-text" font-style="italic">y</text>` +
                                `<text x="${ox+4}" y="${oy+12}" class="svg-text">O</text>` +
                                // 放物線
                                `<path d="${pathD}" fill="none" stroke="#000" stroke-width="1.2"/>` +
                                // 点Bを通るACの平行線（破線）
                                `<path d="${parallelLineD}" fill="none" stroke="#e67e22" stroke-width="1" stroke-dasharray="3,3"/>` +
                                // ΔABC (半透明の灰色)
                                `<polygon points="${tx(xa)},${ty(ya)} ${tx(xb)},${ty(yb)} ${tx(xc)},${ty(yc)}" fill="rgba(128, 128, 128, 0.3)" stroke="#000" stroke-width="1.5"/>` +
                                // ΔACE (青の半透明塗りつぶし ＆ 青の実線)
                                `<polygon points="${tx(xa)},${ty(ya)} ${tx(xc)},${ty(yc)} ${ox},${ty(ye)}" fill="rgba(51, 122, 183, 0.25)" stroke="#337ab7" stroke-width="1.5"/>` +
                                // 点とラベル (O, A, B, C, D, E, F)
                                `<circle cx="${ox}" cy="${oy}" r="2.5" fill="#000"/>` +
                                `<circle cx="${tx(xa)}" cy="${ty(ya)}" r="2.5" fill="#000"/><text x="${tx(xa)-14}" y="${ty(ya)+4}" class="svg-text svg-bold">A</text>` +
                                `<circle cx="${tx(xb)}" cy="${ty(yb)}" r="2.5" fill="#000"/><text x="${tx(xb)+6}" y="${ty(yb)+12}" class="svg-text svg-bold">B</text>` +
                                `<circle cx="${tx(xc)}" cy="${ty(yc)}" r="2.5" fill="#000"/><text x="${tx(xc)+6}" y="${ty(yc)+4}" class="svg-text svg-bold">C</text>` +
                                `<circle cx="${tx(xd)}" cy="${ty(yd)}" r="2.5" fill="#27ae60"/><text x="${tx(xd)-14}" y="${ty(yd)+4}" class="svg-text svg-bold" fill="#27ae60">D</text>` +
                                `<circle cx="${ox}" cy="${ty(ye)}" r="2.5" fill="#27ae60"/><text x="${ox+6}" y="${ty(ye)+3}" class="svg-text svg-bold" fill="#27ae60">E</text>` +
                                `<circle cx="${ox}" cy="${ty(yf)}" r="2.5" fill="#c0392b"/><text x="${ox+6}" y="${ty(yf)+3}" class="svg-text svg-bold" fill="#c0392b">F</text>` +
                                `</svg>`;
                     })(),
            generateRandom: function() {
                const aValues = [0.5, 1, 2, -0.5, -1, -2];
                const a = aValues[Math.floor(Math.random() * aValues.length)];

                // Aのx座標は負、Cのx座標は正に固定
                const x1 = -(Math.floor(Math.random() * 3) + 1); // -3, -2, -1 のいずれか
                const x3 = Math.floor(Math.random() * 3) + 1;   // 1, 2, 3 のいずれか

                // Bのx座標はAとCの間からランダム（A, Cと重複しないように）
                let possibleB = [];
                for (let rx = x1 + 1; rx < x3; rx++) {
                    if (rx !== 0) possibleB.push(rx);
                }
                // もし挟める整数がなければA, Cの外側から選ぶか調整
                if (possibleB.length === 0) {
                    possibleB = [x1 - 1, x3 + 1];
                }
                const x2 = possibleB[Math.floor(Math.random() * possibleB.length)];

                const y1 = a * x1 * x1;
                const y2 = a * x2 * x2;
                const y3 = a * x3 * x3;

                const formatFracClean = (num, den) => {
                    const gcd = (p, q) => q === 0 ? p : gcd(q, p % q);
                    const g = Math.abs(gcd(num, den));
                    let nNum = num / g, nDen = den / g;
                    if (nDen === 0) return "0";
                    let isNeg = false;
                    if (nNum < 0) { isNeg = !isNeg; nNum = Math.abs(nNum); }
                    if (nDen < 0) { isNeg = !isNeg; nDen = Math.abs(nDen); }
                    
                    let body = "";
                    if (nDen === 1) {
                        body = `${nNum}`;
                    } else {
                        body = `\\frac{${nNum}}{${nDen}}`;
                    }
                    if (isNeg && body !== "0") {
                        if (nDen === 1) {
                            return `-${nNum}`;
                        } else {
                            return `-\\frac{${nNum}}{${nDen}}`;
                        }
                    }
                    return body;
                };

                const formatFracVal = (val) => {
                    const num = Math.round(val * 2);
                    const den = 2;
                    return formatFracClean(num, den);
                };

                const m_ac = a * (x1 + x3);
                const k_b = y2 - m_ac * x2;
                const e_y = k_b;
                const e_y_expr = formatFracVal(e_y);

                const k_ac = -a * x1 * x3;
                const f_y = k_ac; 
                const f_y_expr = formatFracVal(f_y);

                const ef_val = Math.abs(e_y - f_y);
                const ef_expr = formatFracVal(ef_val);

                const yoko_abc = Math.abs(x2 - x1); // 横幅の計算（適宜調整）
                // ※元の面積計算ロジック（x2 - x1など）に合わせる
                const yoko_calc = x2 - x1;
                const actual_area_val = Math.abs(yoko_calc) * ef_val * 0.5;
                const ansArea = formatFracVal(actual_area_val);

                // --- 問題用グラフ描画 ---
                const svgW = 200, svgH = 200;
                const maxAbsX = Math.max(Math.abs(x1), Math.abs(x3), Math.abs(x2)) + 1.0;
                const rangeX = maxAbsX;
                
                const allY = [y1, y2, y3, 0, e_y, f_y];
                let minY = Math.min(...allY) - 1.0;
                let maxY = Math.max(...allY) + 1.0;

                const plotW = 150;
                const plotH = 150;
                const scaleX = plotW / (2 * rangeX);
                const scaleY = plotH / (maxY - minY || 1);
                const scale = Math.min(scaleX, scaleY);

                const ox = 100;
                const oy = 25 + maxY * scale;

                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg width="${svgW}" height="${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto;">`;
                
                const axisMinX = 15, axisMaxX = 185;
                const axisMinY = 15, axisMaxY = 185;
                const clampedOy = Math.max(axisMinY, Math.min(axisMaxY, oy));

                svgGraph += `<line x1="${axisMinX}" y1="${clampedOy}" x2="${axisMaxX}" y2="${clampedOy}" stroke="#555" stroke-width="1.2" />`;
                svgGraph += `<line x1="${ox}" y1="${axisMinY}" x2="${ox}" y2="${axisMaxY}" stroke="#555" stroke-width="1.2" />`;
                svgGraph += `<text x="${axisMaxX + 3}" y="${clampedOy + 4}" font-size="9" fill="#333">x</text>`;
                svgGraph += `<text x="${ox + 4}" y="${axisMinY - 2}" font-size="9" fill="#333">y</text>`;
                svgGraph += `<text x="${ox - 10}" y="${clampedOy + 10}" font-size="8" fill="#333">0</text>`;

                let pathD = "";
                for (let px = -rangeX; px <= rangeX; px += 0.1) {
                    let py = a * px * px;
                    pathD += `${pathD === "" ? "M" : "L"} ${tx(px)} ${ty(py)} `;
                }
                svgGraph += `<path d="${pathD}" fill="none" stroke="#2c3e50" stroke-width="1.2" />`;

                let lineParaD = `M ${tx(-rangeX)} ${ty(m_ac * (-rangeX) + k_b)} L ${tx(rangeX)} ${ty(m_ac * rangeX + k_b)}`;
                svgGraph += `<path d="${lineParaD}" fill="none" stroke="#e67e22" stroke-width="1" stroke-dasharray="3,3" />`;

                svgGraph += `<polygon points="${tx(x1)},${ty(y1)} ${tx(x2)},${ty(y2)} ${tx(x3)},${ty(y3)}" fill="rgba(51, 122, 183, 0.15)" stroke="#337ab7" stroke-width="1.5" />`;

                svgGraph += `<circle cx="${tx(x1)}" cy="${ty(y1)}" r="3" fill="#d9534f" /><text x="${tx(x1) - 12}" y="${ty(y1) + 4}" font-size="9" fill="#d9534f" font-weight="bold">A</text>`;
                svgGraph += `<circle cx="${tx(x2)}" cy="${ty(y2)}" r="3" fill="#d9534f" /><text x="${tx(x2) + 5}" y="${ty(y2) - 5}" font-size="9" fill="#d9534f" font-weight="bold">B</text>`;
                svgGraph += `<circle cx="${tx(x3)}" cy="${ty(y3)}" r="3" fill="#d9534f" /><text x="${tx(x3) + 5}" y="${ty(y3) + 4}" font-size="9" fill="#d9534f" font-weight="bold">C</text>`;
                svgGraph += `<circle cx="${ox}" cy="${ty(e_y)}" r="3" fill="#27ae60" /><text x="${ox + 5}" y="${ty(e_y) + 3}" font-size="9" fill="#27ae60" font-weight="bold">E</text>`;

                svgGraph += `</svg>`;

                let aStr = "";
                if (a === 1) aStr = "";
                else if (a === -1) aStr = "-";
                else aStr = formatFracVal(a);

                return {
                    problem: `\\(y = ${aStr}x^2\\) の放物線上に点 \\(A\\)、\\(B\\)、\\(C\\) がある。\\(x\\) 座標はそれぞれ \\(${x1}\\)、\\(${x2}\\)、\\(${x3}\\) である。<br>` +
                             `図のように点 \\(B\\) から直線 \\(AC\\) に平行な線を引き、放物線との交点を \\(D\\)、\\(y\\) 軸との交点を \\(E\\) とする。また、直線 \\(AC\\) と \\(y\\) 軸の交点を \\(F\\) とする。<br>` +
                             `\\(\\triangle ABC\\) の面積を求めなさい。<br>` + svgGraph,
                    explanation: `【解説】<br>` +
                                 `1. <strong>手順 1</strong>：点 \\(B\\) を通り直線 \\(AC\\) に平行な線をひき、放物線との交点を \\(D\\)、\\(y\\) 軸との交点を \\(E\\) とします。また、直線 \\(AC\\) と \\(y\\) 軸の交点を \\(F\\) とします。<br>` +
                                 `   放物線と直線の公式から直線 \\(AC\\) の傾きは \\(${formatFracVal(m_ac)}\\)、切片（点 \\(F\\) の \\(y\\) 座標）は \\(${f_y_expr}\\) となります。<br>` +
                                 `   これに平行で点 \\(B\\) を通る直線の切片（\\(y\\) 軸との交点 \\(E\\)）を求めると、\\(y\\) 座標は \\(${e_y_expr}\\) となります。<br>` +
                                 `2. <strong>手順 2</strong>：等積変形を利用して、\\(\\triangle ABC = \\triangle ACE\\) に変形します。<br>` +
                                 `   これにより、三角形の高さにかかる \\(y\\) 軸上の幅 \\(EF\\) は \\(${ef_expr}\\) と求められます。<br>` +
                                 `   よこはばは点 \\(A\\) と点 \\(B\\) の \\(x\\) 座標の差などから求められます。<br>` +
                                 `3. したがって、面積は \\(\\mathbf{${ansArea}}\\) となります。`
                };
            },
            problem: "...",
            explanation: "..."
        },
        "等積変形を利用した座標の決定": {
            level: "公立",
            formula: "\\(\\triangle ABO = \\triangle ABP\\) となる点 \\(P\\) を放物線上にとる問題の解法。<br>" +
                     "【手順 1】直線 \\(AB\\) に平行な線を、原点 \\(O\\) や \\(y\\) 軸上の点 \\(O'\\) を通るように引く。<br>" +
                     "【手順 2】引いた平行線と放物線の交点（ \\(P_1, P_2, P_3\\) など）をすべて求め、座標を決定する。<br>" +
                     "＊共通の底辺 \\(AB\\) に対し、高さが等しくなる性質（平行線と面積）を利用する。<br>" +
                     // 【公式欄用SVG】
                     (() => {
                         const svgW = 220, svgH = 210;
                         const ox = 110, oy = 160, scale = 8.5;
                         const f = (x) => x * x;
                         
                         const xa = -2, xb = 3;
                         const ya = f(xa), yb = f(xb);
                         
                         const xp1 = xa + xb;
                         const yp1 = f(xp1);
                         
                         const tx = (x) => ox + x * scale;
                         const ty = (y) => oy - y * scale;
                         
                         let pathD = "";
                         for (let px = -6; px <= 6; px += 0.1) {
                             let py = f(px);
                             pathD += `${pathD === "" ? "M" : "L"} ${tx(px)} ${ty(py)} `;
                         }
                         
                         const m_ab = (yb - ya) / (xb - xa);
                         const n_ab = ya - m_ab * xa; 
                         const y_op2 = 2 * n_ab;
                         
                         const disc = m_ab * m_ab + 4 * y_op2;
                         const xp2 = (m_ab - Math.sqrt(disc)) / 2;
                         const xp3 = (m_ab + Math.sqrt(disc)) / 2;
                         const yp2 = f(xp2);
                         const yp3 = f(xp3);
                         
                         const xStart = -6, xEnd = 6;
                         const parallelLineD = `M ${tx(xStart)} ${ty(m_ab * xStart)} L ${tx(xEnd)} ${ty(m_ab * xEnd)}`;
                         const parallelLine2D = `M ${tx(xStart)} ${ty(m_ab * xStart + y_op2)} L ${tx(xEnd)} ${ty(m_ab * xEnd + y_op2)}`;
                         
                         return `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 220px;">` +
                                `<style>` +
                                `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                                `  .svg-bold { font-weight: bold; }` +
                                `</style>` +
                                `<line x1="20" y1="${oy}" x2="200" y2="${oy}" stroke="#000" stroke-width="1"/>` +
                                `<line x1="${ox}" y1="15" x2="${ox}" y2="195" stroke="#000" stroke-width="1"/>` +
                                `<polygon points="${ox},${oy} ${tx(xa)},${ty(ya)} ${tx(xb)},${ty(yb)}" fill="rgba(128, 128, 128, 0.25)" stroke="#888" stroke-width="1"/>` +
                                `<polygon points="${tx(xp1)},${ty(yp1)} ${tx(xa)},${ty(ya)} ${tx(xb)},${ty(yb)}" fill="rgba(51, 122, 183, 0.25)" stroke="#337ab7" stroke-width="1"/>` +
                                `<polygon points="${tx(xp2)},${ty(yp2)} ${tx(xa)},${ty(ya)} ${tx(xb)},${ty(yb)}" fill="rgba(217, 83, 79, 0.25)" stroke="#d9534f" stroke-width="1"/>` +
                                `<polygon points="${tx(xp3)},${ty(yp3)} ${tx(xa)},${ty(ya)} ${tx(xb)},${ty(yb)}" fill="rgba(46, 204, 113, 0.25)" stroke="#27ae60" stroke-width="1"/>` +
                                `<polygon points="${tx(0)},${ty(y_op2)} ${tx(xa)},${ty(ya)} ${tx(xb)},${ty(yb)}" fill="none" stroke="#000" stroke-width="1" stroke-dasharray="2,2"/>` +
                                `<path d="${pathD}" fill="none" stroke="#000" stroke-width="1.2"/>` +
                                `<path d="${parallelLineD}" fill="none" stroke="#e67e22" stroke-width="1" stroke-dasharray="3,3"/>` +
                                `<path d="${parallelLine2D}" fill="none" stroke="#27ae60" stroke-width="1" stroke-dasharray="3,3"/>` +
                                `<circle cx="${ox}" cy="${oy}" r="2.5" fill="#000"/><text x="${ox+4}" y="${oy+12}" class="svg-text svg-bold">O</text>` +
                                `<circle cx="${tx(0)}" cy="${ty(y_op2)}" r="2.5" fill="#27ae60"/><text x="${ox+5}" y="${ty(y_op2)+3}" class="svg-text svg-bold" fill="#27ae60">O´</text>` +
                                `<circle cx="${tx(xa)}" cy="${ty(ya)}" r="2.5" fill="#000"/><text x="${tx(xa)-12}" y="${ty(ya)+4}" class="svg-text svg-bold">A</text>` +
                                `<circle cx="${tx(xb)}" cy="${ty(yb)}" r="2.5" fill="#000"/><text x="${tx(xb)+6}" y="${ty(yb)+4}" class="svg-text svg-bold">B</text>` +
                                `<circle cx="${tx(xp1)}" cy="${ty(yp1)}" r="2.5" fill="#27ae60"/><text x="${tx(xp1)+6}" y="${ty(yp1)+4}" class="svg-text svg-bold" fill="#27ae60">P₁</text>` +
                                `<circle cx="${tx(xp2)}" cy="${ty(yp2)}" r="2.5" fill="#e67e22"/><text x="${tx(xp2)-14}" y="${ty(yp2)+10}" class="svg-text svg-bold" fill="#d35400">P₂</text>` +
                                `<circle cx="${tx(xp3)}" cy="${ty(yp3)}" r="2.5" fill="#e67e22"/><text x="${tx(xp3)+6}" y="${ty(yp3)+10}" class="svg-text svg-bold" fill="#d35400">P₃</text>` +
                                `</svg>`;
                     })(),
            generateRandom: function() {
                const aValues = [0.5, 1, 2, -0.5, -1, -2];
                const a = aValues[Math.floor(Math.random() * aValues.length)];

                let xa = -(Math.floor(Math.random() * 2) + 2); // -3 または -2
                let xb = Math.floor(Math.random() * 2) + 1;   // 1 または 2
                if (Math.abs(xa) === Math.abs(xb)) {
                    xb += 1;
                }

                const ya = a * xa * xa;
                const yb = a * xb * xb;

                const m_ab = a * (xa + xb);
                const xp1 = xa + xb;
                const yp1 = a * xp1 * xp1;

                const n_ab = ya - m_ab * xa;
                const y_op2 = 2 * n_ab;

                const disc = m_ab * m_ab + 4 * y_op2;
                const xp2 = (m_ab - Math.sqrt(disc)) / 2;
                const xp3 = (m_ab + Math.sqrt(disc)) / 2;
                const yp2 = a * xp2 * xp2;
                const yp3 = a * xp3 * xp3;

                const formatFracClean = (num, den) => {
                    const gcd = (p, q) => q === 0 ? p : gcd(q, p % q);
                    const g = Math.abs(gcd(num, den));
                    let nNum = num / g, nDen = den / g;
                    if (nDen === 0) return "0";
                    let isNeg = false;
                    if (nNum < 0) { isNeg = !isNeg; nNum = Math.abs(nNum); }
                    if (nDen < 0) { isNeg = !isNeg; nDen = Math.abs(nDen); }
                    
                    if (nDen === 1) return (isNeg ? `-${nNum}` : `${nNum}`);
                    return (isNeg ? `-\\frac{${nNum}}{${nDen}}` : `\\frac{${nNum}}{${nDen}}`);
                };

                const formatFracVal = (val) => {
                    const num = Math.round(val * 10);
                    const den = 10;
                    return formatFracClean(num, den);
                };

                const formatCoeff = (val) => {
                    const frac = formatFracVal(val);
                    if (frac === "1") return "";
                    if (frac === "-1") return "-";
                    return frac;
                };

                // --- 問題用グラフ描画 ---
                const svgW = 220, svgH = 210;
                const maxAbsX = Math.max(Math.abs(xa), Math.abs(xb), Math.abs(xp1), Math.abs(xp2), Math.abs(xp3)) + 1.8;
                const rangeX = maxAbsX;
                
                const allY = [ya, yb, 0, yp1, yp2, yp3];
                let minY = Math.min(...allY);
                let maxY = Math.max(...allY);

                const plotW = 160;
                const plotH = 150;
                const scaleX = plotW / (2 * rangeX);
                
                let ySpan = maxY - minY;
                if (ySpan < 5) ySpan = 7;
                const scaleY = plotH / ySpan;
                const scale = Math.min(scaleX, scaleY);

                const ox = 110;
                const oy = a > 0 ? 170 : 45;

                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 220px;">`;
                
                const axisMinX = 20, axisMaxX = 200;
                const axisMinY = 15, axisMaxY = 195;
                const clampedOy = Math.max(axisMinY, Math.min(axisMaxY, oy));

                svgGraph += `<line x1="${axisMinX}" y1="${clampedOy}" x2="${axisMaxX}" y2="${clampedOy}" stroke="#555" stroke-width="1.2" />`;
                svgGraph += `<line x1="${ox}" y1="${axisMinY}" x2="${ox}" y2="${axisMaxY}" stroke="#555" stroke-width="1.2" />`;
                svgGraph += `<text x="${axisMaxX + 3}" y="${clampedOy + 4}" font-size="9" fill="#333">x</text>`;
                svgGraph += `<text x="${ox + 4}" y="${axisMinY - 2}" font-size="9" fill="#333">y</text>`;
                svgGraph += `<text x="${ox - 10}" y="${clampedOy + 10}" font-size="8" fill="#333">0</text>`;

                svgGraph += `<polygon points="${ox},${clampedOy} ${tx(xa)},${ty(ya)} ${tx(xb)},${ty(yb)}" fill="rgba(128, 128, 128, 0.25)" stroke="#888" stroke-width="1" />`;

                let pathD = "";
                for (let px = -rangeX; px <= rangeX; px += 0.1) {
                    let py = a * px * px;
                    pathD += `${pathD === "" ? "M" : "L"} ${tx(px)} ${ty(py)} `;
                }
                svgGraph += `<path d="${pathD}" fill="none" stroke="#2c3e50" stroke-width="1.2" />`;

                svgGraph += `<circle cx="${ox}" cy="${clampedOy}" r="2.5" fill="#000" /><text x="${ox + 4}" y="${clampedOy - 4}" font-size="9" fill="#000" font-weight="bold">O</text>`;
                svgGraph += `<circle cx="${tx(xa)}" cy="${ty(ya)}" r="3" fill="#d9534f" /><text x="${tx(xa) - 12}" y="${ty(ya) + 4}" font-size="9" fill="#d9534f" font-weight="bold">A</text>`;
                svgGraph += `<circle cx="${tx(xb)}" cy="${ty(yb)}" r="3" fill="#d9534f" /><text x="${tx(xb) + 5}" y="${ty(yb) + 4}" font-size="9" fill="#d9534f" font-weight="bold">B</text>`;

                svgGraph += `</svg>`;

                let aStr = formatCoeff(a);
                let xaStr = formatFracVal(xa);
                let yaStr = formatFracVal(ya);
                let xbStr = formatFracVal(xb);
                let ybStr = formatFracVal(yb);

                let p1Coord = `(${formatFracVal(xp1)}, ${formatFracVal(yp1)})`;
                let p2Coord = `(${formatFracVal(xp2)}, ${formatFracVal(yp2)})`;
                let p3Coord = `(${formatFracVal(xp3)}, ${formatFracVal(yp3)})`;

                let mabStr = formatCoeff(m_ab);
                let mabFullStr = formatFracVal(m_ab);
                let yOp2Str = formatFracVal(y_op2);

                return {
                    problem: `\\(y = ${aStr}x^2\\) の放物線上にある点 \\(A(${xaStr}, ${yaStr})\\)、\\(B(${xbStr}, ${ybStr})\\) について、<br>` +
                             `\\(\\triangle ABO = \\triangle ABP\\) となる放物線上の点 \\(P\\) の座標をすべて求めなさい。<br>` + svgGraph,
                    explanation: `【解説】<br>` +
                                 `1. <strong>手順 1（原点を通る場合）</strong>：原点 \\(O\\) を通り直線 \\(AB\\) に平行な直線と放物線の交点 \\(P_1\\) を求めます。<br>` +
                                 `   傾きは \\(${mabFullStr}\\)、交点の \\(x\\) 座標は \\(${formatFracVal(xp1)}\\) となり、点 \\(P_1\\) は \\(${p1Coord}\\) です。<br>` +
                                 `2. <strong>手順 2（軸上の点を通る場合）</strong>：直線 \\(AB\\) と \\(y\\) 軸の交点を \\(O'\\) とし、\\(O'\\) を通り直線 \\(AB\\) に平行な直線 \\(y = ${mabStr}x + ${yOp2Str}\\) を引きます。<br>` +
                                 `3. この平行線と放物線の交点 \\(P_2, P_3\\) を求めると、 \\(P_2(${formatFracVal(xp2)}, ${formatFracVal(yp2)})\\)、\\(P_3(${formatFracVal(xp3)}, ${formatFracVal(yp3)})\\) となります。<br>` +
                                 `   したがって、求める点 \\(P\\) の座標は \\(\\mathbf{${p1Coord}, ${p2Coord}, ${p3Coord}}\\) です。`
                };
            },
            problem: "...",
            explanation: "..."
        },
         "等積変形を利用した座標の決定": {
            level: "公立",
            formula: "\\(\\triangle ABO = \\triangle ABP\\) となる点 \\(P\\) を放物線上にとる問題の解法。<br>" +
                     "【手順 1】直線 \\(AB\\) に平行な線を、原点 \\(O\\) を通るように引く。<br>" +
                     "【手順 2】\\(\\triangle ABO\\) のたてはばの 2 倍を切片にもつ平行線を引く。<br>" +
                     "【手順 3】引いた平行線と放物線の交点 \\(P_1, P_2, P_3\\) をすべて求め、座標を決定する。<br>" +
                     "＊共通の底辺 \\(AB\\) に対し、高さが等しくなる性質（平行線と面積）を利用する。<br>" +
                     // 【公式欄用SVG】（すべての要素を復元した完全版）
                     (() => {
                         const svgW = 220, svgH = 210;
                         const ox = 110, oy = 160, scale = 8.5;
                         const f = (x) => x * x;
                         
                         const xa = -2, xb = 3;
                         const ya = f(xa), yb = f(xb);
                         
                         const xp1 = xa + xb;
                         const yp1 = f(xp1);
                         
                         const tx = (x) => ox + x * scale;
                         const ty = (y) => oy - y * scale;
                         
                         let pathD = "";
                         for (let px = -6; px <= 6; px += 0.1) {
                             let py = f(px);
                             pathD += `${pathD === "" ? "M" : "L"} ${tx(px)} ${ty(py)} `;
                         }
                         
                         const m_ab = (yb - ya) / (xb - xa);
                         const n_ab = ya - m_ab * xa; 
                         const y_op2 = 2 * n_ab; // たてはばの 2 倍を切片
                         
                         const disc = m_ab * m_ab + 4 * y_op2;
                         const xp2 = (m_ab - Math.sqrt(disc)) / 2;
                         const xp3 = (m_ab + Math.sqrt(disc)) / 2;
                         const yp2 = f(xp2);
                         const yp3 = f(xp3);
                         
                         const xStart = -6, xEnd = 6;
                         const parallelLineD = `M ${tx(xStart)} ${ty(m_ab * xStart)} L ${tx(xEnd)} ${ty(m_ab * xEnd)}`;
                         const parallelLine2D = `M ${tx(xStart)} ${ty(m_ab * xStart + y_op2)} L ${tx(xEnd)} ${ty(m_ab * xEnd + y_op2)}`;
                         
                         return `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 220px;">` +
                                `<style>` +
                                `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                                `  .svg-bold { font-weight: bold; }` +
                                `</style>` +
                                `<line x1="20" y1="${oy}" x2="200" y2="${oy}" stroke="#000" stroke-width="1"/>` +
                                `<line x1="${ox}" y1="15" x2="${ox}" y2="195" stroke="#000" stroke-width="1"/>` +
                                `<polygon points="${ox},${oy} ${tx(xa)},${ty(ya)} ${tx(xb)},${ty(yb)}" fill="rgba(128, 128, 128, 0.25)" stroke="#888" stroke-width="1"/>` +
                                `<polygon points="${tx(xp1)},${ty(yp1)} ${tx(xa)},${ty(ya)} ${tx(xb)},${ty(yb)}" fill="rgba(51, 122, 183, 0.25)" stroke="#337ab7" stroke-width="1"/>` +
                                `<polygon points="${tx(xp2)},${ty(yp2)} ${tx(xa)},${ty(ya)} ${tx(xb)},${ty(yb)}" fill="rgba(217, 83, 79, 0.25)" stroke="#d9534f" stroke-width="1"/>` +
                                `<polygon points="${tx(xp3)},${ty(yp3)} ${tx(xa)},${ty(ya)} ${tx(xb)},${ty(yb)}" fill="rgba(46, 204, 113, 0.25)" stroke="#27ae60" stroke-width="1"/>` +
                                `<polygon points="${tx(0)},${ty(y_op2)} ${tx(xa)},${ty(ya)} ${tx(xb)},${ty(yb)}" fill="none" stroke="#000" stroke-width="1" stroke-dasharray="2,2"/>` +
                                `<path d="${pathD}" fill="none" stroke="#000" stroke-width="1.2"/>` +
                                `<path d="${parallelLineD}" fill="none" stroke="#e67e22" stroke-width="1" stroke-dasharray="3,3"/>` +
                                `<path d="${parallelLine2D}" fill="none" stroke="#27ae60" stroke-width="1" stroke-dasharray="3,3"/>` +
                                `<circle cx="${ox}" cy="${oy}" r="2.5" fill="#000"/><text x="${ox+4}" y="${oy+12}" class="svg-text svg-bold">O</text>` +
                                `<circle cx="${tx(0)}" cy="${ty(y_op2)}" r="2.5" fill="#27ae60"/><text x="${ox+5}" y="${ty(y_op2)+3}" class="svg-text svg-bold" fill="#27ae60">O´</text>` +
                                `<circle cx="${tx(xa)}" cy="${ty(ya)}" r="2.5" fill="#000"/><text x="${tx(xa)-12}" y="${ty(ya)+4}" class="svg-text svg-bold">A</text>` +
                                `<circle cx="${tx(xb)}" cy="${ty(yb)}" r="2.5" fill="#000"/><text x="${tx(xb)+6}" y="${ty(yb)+4}" class="svg-text svg-bold">B</text>` +
                                `<circle cx="${tx(xp1)}" cy="${ty(yp1)}" r="2.5" fill="#27ae60"/><text x="${tx(xp1)+6}" y="${ty(yp1)+4}" class="svg-text svg-bold" fill="#27ae60">P₁</text>` +
                                `<circle cx="${tx(xp2)}" cy="${ty(yp2)}" r="2.5" fill="#e67e22"/><text x="${tx(xp2)-14}" y="${ty(yp2)+10}" class="svg-text svg-bold" fill="#d35400">P₂</text>` +
                                `<circle cx="${tx(xp3)}" cy="${ty(yp3)}" r="2.5" fill="#e67e22"/><text x="${tx(xp3)+6}" y="${ty(yp3)+10}" class="svg-text svg-bold" fill="#d35400">P₃</text>` +
                                `</svg>`;
                     })(),
            generateRandom: function() {
                const aValues = [0.5, 1, 2, -0.5, -1, -2];
                const a = aValues[Math.floor(Math.random() * aValues.length)];

                let xa = -(Math.floor(Math.random() * 2) + 2); 
                let xb = Math.floor(Math.random() * 2) + 1;   
                if (Math.abs(xa) === Math.abs(xb)) {
                    xb += 1;
                }

                const ya = a * xa * xa;
                const yb = a * xb * xb;

                const m_ab = a * (xa + xb); // 直線ABの傾き
                const n_ab = ya - m_ab * xa; // 直線ABの切片（たてはばの基準）

                // P1: 原点Oを通る直線 y = m_ab * x と放物線の交点
                const xp1 = xa + xb;
                const yp1 = a * xp1 * xp1;

                // P2, P3: ΔABOのたてはばの2倍を切片とした平行線 y = m_ab * x + 2 * n_ab と放物線の交点
                const target_c = 2 * n_ab;
                const discriminant = m_ab * m_ab + 4 * a * target_c;
                const xp2 = (m_ab - Math.sqrt(discriminant)) / (2 * a);
                const xp3 = (m_ab + Math.sqrt(discriminant)) / (2 * a);
                const yp2 = a * xp2 * xp2;
                const yp3 = a * xp3 * xp3;

                const formatFracClean = (num, den) => {
                    const gcd = (p, q) => q === 0 ? p : gcd(q, p % q);
                    const g = Math.abs(gcd(num, den));
                    let nNum = num / g, nDen = den / g;
                    if (nDen === 0) return "0";
                    let isNeg = false;
                    if (nNum < 0) { isNeg = !isNeg; nNum = Math.abs(nNum); }
                    if (nDen < 0) { isNeg = !isNeg; nDen = Math.abs(nDen); }
                    
                    if (nDen === 1) return (isNeg ? `-${nNum}` : `${nNum}`);
                    return (isNeg ? `-\\frac{${nNum}}{${nDen}}` : `\\frac{${nNum}}{${nDen}}`);
                };

                const formatFracVal = (val) => {
                    const num = Math.round(val * 10);
                    const den = 10;
                    return formatFracClean(num, den);
                };

                const formatCoeff = (val) => {
                    const frac = formatFracVal(val);
                    if (frac === "1") return "";
                    if (frac === "-1") return "-";
                    return frac;
                };

                // --- 問題用グラフ描画 ---
                const svgW = 220, svgH = 210;
                const maxAbsX = Math.max(Math.abs(xa), Math.abs(xb), Math.abs(xp1), Math.abs(xp2), Math.abs(xp3)) + 1.8;
                const rangeX = maxAbsX;
                
                const allY = [ya, yb, 0, yp1, yp2, yp3];
                let minY = Math.min(...allY);
                let maxY = Math.max(...allY);

                const plotW = 160;
                const plotH = 150;
                const scaleX = plotW / (2 * rangeX);
                
                let ySpan = maxY - minY;
                if (ySpan < 5) ySpan = 7;
                const scaleY = plotH / ySpan;
                const scale = Math.min(scaleX, scaleY);

                const ox = 110;
                const oy = a > 0 ? 170 : 45;

                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 220px;">`;
                
                const axisMinX = 20, axisMaxX = 200;
                const axisMinY = 15, axisMaxY = 195;
                const clampedOy = Math.max(axisMinY, Math.min(axisMaxY, oy));

                svgGraph += `<line x1="${axisMinX}" y1="${clampedOy}" x2="${axisMaxX}" y2="${clampedOy}" stroke="#555" stroke-width="1.2" />`;
                svgGraph += `<line x1="${ox}" y1="${axisMinY}" x2="${ox}" y2="${axisMaxY}" stroke="#555" stroke-width="1.2" />`;
                svgGraph += `<text x="${axisMaxX + 3}" y="${clampedOy + 4}" font-size="9" fill="#333">x</text>`;
                svgGraph += `<text x="${ox + 4}" y="${axisMinY - 2}" font-size="9" fill="#333">y</text>`;
                svgGraph += `<text x="${ox - 10}" y="${clampedOy + 10}" font-size="8" fill="#333">0</text>`;

                svgGraph += `<polygon points="${ox},${clampedOy} ${tx(xa)},${ty(ya)} ${tx(xb)},${ty(yb)}" fill="rgba(128, 128, 128, 0.25)" stroke="#888" stroke-width="1" />`;

                let pathD = "";
                for (let px = -rangeX; px <= rangeX; px += 0.1) {
                    let py = a * px * px;
                    pathD += `${pathD === "" ? "M" : "L"} ${tx(px)} ${ty(py)} `;
                }
                svgGraph += `<path d="${pathD}" fill="none" stroke="#2c3e50" stroke-width="1.2" />`;

                svgGraph += `<circle cx="${ox}" cy="${clampedOy}" r="2.5" fill="#000" /><text x="${ox + 4}" y="${clampedOy - 4}" font-size="9" fill="#000" font-weight="bold">O</text>`;
                svgGraph += `<circle cx="${tx(xa)}" cy="${ty(ya)}" r="3" fill="#d9534f" /><text x="${tx(xa) - 12}" y="${ty(ya) + 4}" font-size="9" fill="#d9534f" font-weight="bold">A</text>`;
                svgGraph += `<circle cx="${tx(xb)}" cy="${ty(yb)}" r="3" fill="#d9534f" /><text x="${tx(xb) + 5}" y="${ty(yb) + 4}" font-size="9" fill="#d9534f" font-weight="bold">B</text>`;

                svgGraph += `</svg>`;

                let aStr = formatCoeff(a);
                let xaStr = formatFracVal(xa);
                let yaStr = formatFracVal(ya);
                let xbStr = formatFracVal(xb);
                let ybStr = formatFracVal(yb);

                let p1Coord = `(${formatFracVal(xp1)}, ${formatFracVal(yp1)})`;
                let p2Coord = `(${formatFracVal(xp2)}, ${formatFracVal(yp2)})`;
                let p3Coord = `(${formatFracVal(xp3)}, ${formatFracVal(yp3)})`;

                let mabStr = formatCoeff(m_ab);
                let mabFullStr = formatFracVal(m_ab);
                let targetCStr = formatFracVal(target_c);
                let nAbStr = formatFracVal(n_ab);

                return {
                    problem: `\\(y = ${aStr}x^2\\) の放物線上にある点 \\(A(${xaStr}, ${yaStr})\\)、\\(B(${xbStr}, ${ybStr})\\) について、<br>` +
                             `\\(\\triangle ABO = \\triangle ABP\\) となる放物線上の点 \\(P\\) の座標をすべて求めなさい。<br>` + svgGraph,
                    explanation: `【解説】<br>` +
                                 `1. <strong>手順 1（原点を通る場合）</strong>：直線 \\(AB\\) の切片は \\(${nAbStr}\\) （\\(\\triangle ABO\\) のたてはばの基準）です。<br>` +
                                 `   原点 \\(O\\) を通り直線 \\(AB\\) に平行な直線 \\(y = ${mabFullStr}x\\) と放物線の交点 \\(P_1\\) は \\(${p1Coord}\\) です。<br>` +
                                 `2. <strong>手順 2（たてはばの 2 倍を切片にもつ場合）</strong>：たてはばの 2 倍の切片 \\(${targetCStr}\\) をもつ平行線 \\(y = ${mabStr}x + ${targetCStr}\\) を引きます。<br>` +
                                 `3. この直線と放物線の交点 \\(P_2, P_3\\) を \\(ax^2 - (${mabFullStr})x - (${targetCStr}) = 0\\) を解いて求めると、\\(P_2(${formatFracVal(xp2)}, ${formatFracVal(yp2)})\\)、\\(P_3(${formatFracVal(xp3)}, ${formatFracVal(yp3)})\\) となります。<br>` +
                                 `   したがって、求める点 \\(P\\) の座標は \\(\\mathbf{${p1Coord}, ${p2Coord}, ${p3Coord}}\\) です。`
                };
            },
            problem: "...",
            explanation: "..."
        },
                "面積○倍の△の座標決定": {
            level: "難関私立",
            formula: "\\(y\\) 軸上に \\(\\triangle ABO\\) のたてはば（直線 \\(AB\\) の切片）からの距離を基準として \\(\\bigcirc\\) 倍した点 \\(C, D\\) をとる。<br>" +
                     "そこから等積変形を用いて、点 \\(P\\) が<strong>放物線上</strong>にある場合や、<strong>\\(x\\) 軸上</strong>にある場合の座標を求める。<br>" +
                     "＊反対側（上下など）にも条件を満たす点が存在する場合があるので注意しよう！<br>" +
                     // 【公式欄用SVG】
                     (() => {
                         const svgW = 240, svgH = 220;
                         const ox = 120, oy = 160, scale = 11;
                         const f = (x) => x * x;
                         
                         const xa = -2, xb = 3;
                         const ya = f(xa), yb = f(xb);
                         
                         const tx = (x) => ox + x * scale;
                         const ty = (y) => oy - y * scale;
                         
                         let pathD = "";
                         for (let px = -5; px <= 5; px += 0.1) {
                             let py = f(px);
                             pathD += `${pathD === "" ? "M" : "L"} ${tx(px)} ${ty(py)} `;
                         }
                         
                         const m_ab = (yb - ya) / (xb - xa);
                         const n_ab = ya - m_ab * xa; // 直線ABの切片
                         
                         // 切片からの距離の 1/3 倍を基準にする
                         const dist = Math.abs(n_ab) * (1 / 3);
                         const y_c = n_ab - dist;   // 下側の点C
                         const y_d = n_ab + dist;   // 上側の点D
                         
                         // Cを通る平行線と放物線 y = x^2 の交点の x 座標を計算 (P1, P2)
                         const discC = m_ab * m_ab + 4 * y_c;
                         let xp1 = 0, xp2 = 0;
                         if (discC >= 0) {
                             xp1 = (m_ab - Math.sqrt(discC)) / 2;
                             xp2 = (m_ab + Math.sqrt(discC)) / 2;
                         }

                         // Dを通る平行線と放物線 y = x^2 の交点の x 座標を計算 (P3, P4)
                         const discD = m_ab * m_ab + 4 * y_d;
                         let xp3 = 0, xp4 = 0;
                         if (discD >= 0) {
                             xp3 = (m_ab - Math.sqrt(discD)) / 2;
                             xp4 = (m_ab + Math.sqrt(discD)) / 2;
                         }

                         // 各平行線とx軸（y = 0）との交点 P5, P6 の x 座標を計算
                         const xp5 = -y_c / m_ab;
                         const xp6 = -y_d / m_ab;
                         
                         // Dを通る平行線が P3, P4 から P6 までしっかり伸びるように範囲を動的決定
                         const dMinX = Math.min(xp3, xp4, xp6) - 0.5;
                         const dMaxX = Math.max(xp3, xp4, xp6) + 0.5;

                         const xStart = -5, xEnd = 5;
                         const parallelLineC = `M ${tx(xStart)} ${ty(m_ab * xStart + y_c)} L ${tx(xEnd)} ${ty(m_ab * xEnd + y_c)}`;
                         const parallelLineD = `M ${tx(dMinX)} ${ty(m_ab * dMinX + y_d)} L ${tx(dMaxX)} ${ty(m_ab * dMaxX + y_d)}`;
                         
                         return `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 240px;">` +
                                `<style>` +
                                `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                                `  .svg-bold { font-weight: bold; }` +
                                `</style>` +
                                `<line x1="20" y1="${oy}" x2="${svgW - 20}" y2="${oy}" stroke="#555" stroke-width="1.2"/>` +
                                `<line x1="${ox}" y1="15" x2="${ox}" y2="${svgH - 20}" stroke="#555" stroke-width="1.2"/>` +
                                
                                // ΔABO (薄い灰色)
                                `<polygon points="${ox},${oy} ${tx(xa)},${ty(ya)} ${tx(xb)},${ty(yb)}" fill="rgba(128, 128, 128, 0.2)" stroke="#888" stroke-width="1"/>` +
                                
                                // 平行線
                                `<path d="${parallelLineC}" fill="none" stroke="#e67e22" stroke-width="1" stroke-dasharray="3,3"/>` +
                                `<path d="${parallelLineD}" fill="none" stroke="#2980b9" stroke-width="1" stroke-dasharray="3,3"/>` +
                                
                                // 放物線
                                `<path d="${pathD}" fill="none" stroke="#2c3e50" stroke-width="1.2"/>` +
                                
                                // 点とラベル
                                `<circle cx="${ox}" cy="${oy}" r="2.5" fill="#000"/><text x="${ox+4}" y="${oy+12}" class="svg-text svg-bold">O</text>` +
                                `<circle cx="${ox}" cy="${ty(n_ab)}" r="2" fill="#888"/><text x="${ox+6}" y="${ty(n_ab)+3}" class="svg-text" fill="#666">切片</text>` +
                                `<circle cx="${ox}" cy="${ty(y_c)}" r="3" fill="#e67e22"/><text x="${ox+6}" y="${ty(y_c)+3}" class="svg-text svg-bold" fill="#e67e22">C</text>` +
                                `<circle cx="${ox}" cy="${ty(y_d)}" r="3" fill="#2980b9"/><text x="${ox+6}" y="${ty(y_d)+3}" class="svg-text svg-bold" fill="#2980b9">D</text>` +
                                `<circle cx="${tx(xa)}" cy="${ty(ya)}" r="3" fill="#d9534f"/><text x="${tx(xa)-12}" y="${ty(ya)+4}" class="svg-text svg-bold" fill="#d9534f">A</text>` +
                                `<circle cx="${tx(xb)}" cy="${ty(yb)}" r="3" fill="#d9534f"/><text x="${tx(xb)+6}" y="${ty(yb)+4}" class="svg-text svg-bold" fill="#d9534f">B</text>` +
                                
                                // 交点 P1, P2 (Cの平行線と放物線)
                                `<circle cx="${tx(xp1)}" cy="${ty(f(xp1))}" r="2.5" fill="#e67e22"/><text x="${tx(xp1)-14}" y="${ty(f(xp1))-4}" class="svg-text svg-bold" fill="#e67e22">P₁</text>` +
                                `<circle cx="${tx(xp2)}" cy="${ty(f(xp2))}" r="2.5" fill="#e67e22"/><text x="${tx(xp2)+6}" y="${ty(f(xp2))-4}" class="svg-text svg-bold" fill="#e67e22">P₂</text>` +
                                
                                // 交点 P3, P4 (Dの平行線と放物線)
                                `<circle cx="${tx(xp3)}" cy="${ty(f(xp3))}" r="2.5" fill="#2980b9"/><text x="${tx(xp3)-16}" y="${ty(f(xp3))-4}" class="svg-text svg-bold" fill="#2980b9">P₃</text>` +
                                `<circle cx="${tx(xp4)}" cy="${ty(f(xp4))}" r="2.5" fill="#2980b9"/><text x="${tx(xp4)+6}" y="${ty(f(xp4))-4}" class="svg-text svg-bold" fill="#2980b9">P₄</text>` +

                                // 交点 P5, P6 (平行線とx軸)
                                `<circle cx="${tx(xp5)}" cy="${oy}" r="2.5" fill="#e67e22"/><text x="${tx(xp5)-4}" y="${oy+12}" class="svg-text svg-bold" fill="#e67e22">P₅</text>` +
                                `<circle cx="${tx(xp6)}" cy="${oy}" r="2.5" fill="#2980b9"/><text x="${tx(xp6)-4}" y="${oy+12}" class="svg-text svg-bold" fill="#2980b9">P₆</text>` +
                                
                                `</svg>`;
                     })(),
            generateRandom: function() {
                const aValues = [1, 2, 0.5];
                const a = aValues[Math.floor(Math.random() * aValues.length)];

                let xa = -(Math.floor(Math.random() * 2) + 2); 
                let xb = Math.floor(Math.random() * 2) + 2;   
                if (Math.abs(xa) === Math.abs(xb)) {
                    xb = xb + 1;
                }
                
                const ya = a * xa * xa;
                const yb = a * xb * xb;

                const kList = [
                    {n: 1, d: 3},
                    {n: 2, d: 3},
                    {n: 1, d: 2},
                    {n: 3, d: 4}
                ];
                const chosenK = kList[Math.floor(Math.random() * kList.length)];
                const kn = chosenK.n, kd = chosenK.d;

                // ランダムに「放物線上」か「x軸上」かを決定
                const patternType = Math.random() < 0.5 ? "parabola" : "xaxis";

                const formatFracClean = (num, den) => {
                    const gcd = (p, q) => q === 0 ? p : gcd(q, p % q);
                    const g = Math.abs(gcd(num, den));
                    let nNum = num / g, nDen = den / g;
                    if (nDen === 0) return "0";
                    let isNeg = false;
                    if (nNum < 0) { isNeg = !isNeg; nNum = Math.abs(nNum); }
                    if (nDen < 0) { isNeg = !isNeg; nDen = Math.abs(nDen); }
                    
                    if (nDen === 1) return (isNeg ? `-${nNum}` : `${nNum}`);
                    return (isNeg ? `-\\frac{${nNum}}{${nDen}}` : `\\frac{${nNum}}{${nDen}}`);
                };

                const formatFracVal = (val) => {
                    const num = Math.round(val * 10);
                    const den = 10;
                    return formatFracClean(num, den);
                };

                const formatCoeff = (val) => {
                    const frac = formatFracVal(val);
                    if (frac === "1") return "";
                    if (frac === "-1") return "-";
                    return frac;
                };

                // --- グラフの見切れ防止対策 ---
                const svgW = 260, svgH = 240;
                const ox = 130, oy = 170;
                const scale = 7.5; 
                const maxAbsX = Math.max(Math.abs(xa), Math.abs(xb), 6) + 2;
                const rangeX = maxAbsX;

                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 260px;">`;
                
                const axisMinX = 15, axisMaxX = svgW - 15;
                const axisMinY = 15, axisMaxY = svgH - 20;
                const clampedOy = Math.max(axisMinY, Math.min(axisMaxY, oy));

                svgGraph += `<line x1="${axisMinX}" y1="${clampedOy}" x2="${axisMaxX}" y2="${clampedOy}" stroke="#555" stroke-width="1.2" />`;
                svgGraph += `<line x1="${ox}" y1="${axisMinY}" x2="${ox}" y2="${axisMaxY}" stroke="#555" stroke-width="1.2" />`;
                svgGraph += `<text x="${axisMaxX - 8}" y="${clampedOy + 12}" font-size="9" fill="#333">x</text>`;
                svgGraph += `<text x="${ox + 5}" y="${axisMinY + 8}" font-size="9" fill="#333">y</text>`;
                svgGraph += `<text x="${ox - 10}" y="${clampedOy + 12}" font-size="8" fill="#333">0</text>`;

                svgGraph += `<polygon points="${ox},${clampedOy} ${tx(xa)},${ty(ya)} ${tx(xb)},${ty(yb)}" fill="rgba(128, 128, 128, 0.25)" stroke="#888" stroke-width="1" />`;

                let pathD = "";
                for (let px = -rangeX; px <= rangeX; px += 0.1) {
                    let py = a * px * px;
                    pathD += `${pathD === "" ? "M" : "L"} ${tx(px)} ${ty(py)} `;
                }
                svgGraph += `<path d="${pathD}" fill="none" stroke="#2c3e50" stroke-width="1.2" />`;

                svgGraph += `<circle cx="${ox}" cy="${clampedOy}" r="2.5" fill="#000" /><text x="${ox + 4}" y="${clampedOy - 4}" font-size="9" fill="#000" font-weight="bold">O</text>`;
                svgGraph += `<circle cx="${tx(xa)}" cy="${ty(ya)}" r="3" fill="#d9534f" /><text x="${tx(xa) - 12}" y="${ty(ya) + 4}" font-size="9" fill="#d9534f" font-weight="bold">A</text>`;
                svgGraph += `<circle cx="${tx(xb)}" cy="${ty(yb)}" r="3" fill="#d9534f" /><text x="${tx(xb) + 5}" y="${ty(yb) + 4}" font-size="9" fill="#d9534f" font-weight="bold">B</text>`;

                svgGraph += `</svg>`;

                let aStr = formatCoeff(a);
                let xaStr = formatFracVal(xa);
                let yaStr = formatFracVal(ya);
                let xbStr = formatFracVal(xb);
                let ybStr = formatFracVal(yb);

                let kStr = (kd === 1) ? `${kn}` : `\\frac{${kn}}{${kd}}`;

                // 直線ABの式 (y = mx + n) を計算
                const m_ab = (yb - ya) / (xb - xa);
                const n_ab = ya - m_ab * xa;
                const m_ab_str = formatFracVal(m_ab);
                const n_ab_str = formatFracVal(n_ab);

                // 切片からの距離（たてはばの k倍）を計算
                const dist = Math.abs(n_ab) * (kn / kd);
                const y_c = n_ab - dist;
                const y_d = n_ab + dist;
                
                const y_c_str = formatFracVal(y_c);
                const y_d_str = formatFracVal(y_d);

                let problemText = "";
                let ansStr = "";

                if (patternType === "parabola") {
                    const discC = m_ab * m_ab + 4 * y_c;
                    const discD = m_ab * m_ab + 4 * y_d;
                    const xp1 = discC >= 0 ? (m_ab - Math.sqrt(discC)) / 2 : null;
                    const xp2 = discC >= 0 ? (m_ab + Math.sqrt(discC)) / 2 : null;
                    const xp3 = discD >= 0 ? (m_ab - Math.sqrt(discD)) / 2 : null;
                    const xp4 = discD >= 0 ? (m_ab + Math.sqrt(discD)) / 2 : null;
                    
                    const rawXps = [xp1, xp2, xp3, xp4];
                    const uniqueXps = [];
                    rawXps.forEach(x => {
                        if (x !== null) {
                            uniqueXps.push(formatFracVal(x));
                        }
                    });
                    const ansList = Array.from(new Set(uniqueXps));
                    ansStr = ansList.join(", ");

                    problemText = `\\(y = ${aStr}x^2\\) の放物線上にある点 \\(A(${xaStr}, ${yaStr})\\)、\\(B(${xbStr}, ${ybStr})\\) がある。<br>` +
                                  `直線 \\(AB\\) の切片からの距離の \\(${kStr}\\) 倍をたてはばとして上下にとった点を通る、直線 \\(AB\\) に平行な直線と放物線との交点 \\(P\\) の \\(x\\) 座標をすべて求めなさい。<br>` + svgGraph;
                } else {
                    const xp5 = -y_c / m_ab;
                    const xp6 = -y_d / m_ab;
                    const ans1Str = formatFracVal(xp5);
                    const ans2Str = formatFracVal(xp6);
                    ansStr = (ans1Str === ans2Str) ? ans1Str : `${ans1Str}, ${ans2Str}`;

                    problemText = `\\(y = ${aStr}x^2\\) の放物線上にある点 \\(A(${xaStr}, ${yaStr})\\)、\\(B(${xbStr}, ${ybStr})\\) がある。<br>` +
                                  `直線 \\(AB\\) の切片からの距離の \\(${kStr}\\) 倍をたてはばとして上下にとった点を通る、直線 \\(AB\\) に平行な直線と \\(x\\) 軸との交点 \\(P\\) の \\(x\\) 座標をすべて求めなさい。<br>` + svgGraph;
                }

                return {
                    problem: problemText,
                    explanation: `【解説】<br>` +
                                 `1. <strong>直線ABの式を求める</strong>：点 \\(A\\)、\\(B\\) の座標から、直線 \\(AB\\) の式は \\(y = ${m_ab_str}x + ${n_ab_str}\\)（切片は \\(${n_ab_str}\\)）となります。<br>` +
                                 `2. <strong>点C、Dの座標を求める</strong>：切片 \\(${n_ab_str}\\) からの距離の \\(${kStr}\\) 倍（\\(${n_ab_str} \\times ${kStr}\\)）を基準として、上下に離した位置に点 \\(C\\)（\\(y = ${y_c_str}\\)）、点 \\(D\\)（\\(y = ${y_d_str}\\)）をとります。<br>` +
                                 `3. <strong>平行線の式</strong>：それぞれの点を通る直線 \\(AB\\) の平行線の式は、\\(y = ${m_ab_str}x + ${y_c_str}\\) および \\(y = ${m_ab_str}x + ${y_d_str}\\) となります。<br>` +
                                 `4. <strong>座標の決定</strong>：各平行線と条件（${patternType === "parabola" ? "放物線" : "\\(x\\) 軸"}）との交点を求めて、求める点 \\(P\\) の \\(x\\) 座標は \\(\\mathbf{x = ${ansStr}}\\) となります。`
                };
            }
        },

        "対面等積の座標決定": {
            level: "公立",
            formula: "\\(\\triangle ABP = \\triangle CDP\\) ならば、それぞれに \\(\\triangle BCP\\) を加えることで \\(\\triangle ACB = \\triangle DBC\\) となる。<br>" +
                     "たてはばが等しくなるので平行線となる。<br>" +
                     "つまり、AD // BC<br>" +
                     // 【公式欄用SVG（静的グラフ：カラー）】
                     (() => {
                         const svgW = 240, svgH = 220;
                         const ox = 120, oy = 150, scale = 6.5;
                         const f = (x) => 0.25 * x * x;
                         
                         const tx = (x) => ox + x * scale;
                         const ty = (y) => oy - y * scale;
                         
                         let pathD = "";
                         for (let px = -9; px <= 9; px += 0.1) {
                             let py = f(px);
                             pathD += `${pathD === "" ? "M" : "L"} ${tx(px)} ${ty(py)} `;
                         }
                         
                         const xa = -7, xb = -3, xc = 2, xd = 6;
                         const ya = f(xa), yb = f(xb), yc = f(xc), yd = f(xd);
                         
                         const mAC = (yc - ya) / (xc - xa);
                         const mBD = (yd - yb) / (xd - xb);
                         const xp = (yb - ya + mAC * xa - mBD * xb) / (mAC - mBD);
                         const yp = ya + mAC * (xp - xa);
                         
                         return `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 240px;">` +
                                `<style>` +
                                `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                                `  .svg-bold { font-weight: bold; }` +
                                `</style>` +
                                `<line x1="20" y1="${oy}" x2="${svgW - 20}" y2="${oy}" stroke="#555" stroke-width="1.2"/>` +
                                `<line x1="${ox}" y1="15" x2="${ox}" y2="${svgH - 20}" stroke="#555" stroke-width="1.2"/>` +
                                // 放物線
                                `<path d="${pathD}" fill="none" stroke="#2c3e50" stroke-width="1.2"/>` +
                                // 直線ADと直線BCを破線で追加
                                `<line x1="${tx(xa)}" y1="${ty(ya)}" x2="${tx(xd)}" y2="${ty(yd)}" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>` +
                                `<line x1="${tx(xb)}" y1="${ty(yb)}" x2="${tx(xc)}" y2="${ty(yc)}" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>` +
                                // 三角形ABPの辺（赤の実線）
                                `<line x1="${tx(xa)}" y1="${ty(ya)}" x2="${tx(xb)}" y2="${ty(yb)}" stroke="#d9534f" stroke-width="1.2"/>` +
                                `<line x1="${tx(xb)}" y1="${ty(yb)}" x2="${tx(xp)}" y2="${ty(yp)}" stroke="#d9534f" stroke-width="1.2"/>` +
                                `<line x1="${tx(xp)}" y1="${ty(yp)}" x2="${tx(xa)}" y2="${ty(ya)}" stroke="#d9534f" stroke-width="1.2"/>` +
                                // 三角形CDPの辺（青の実線）
                                `<line x1="${tx(xc)}" y1="${ty(yc)}" x2="${tx(xd)}" y2="${ty(yd)}" stroke="#2980b9" stroke-width="1.2"/>` +
                                `<line x1="${tx(xd)}" y1="${ty(yd)}" x2="${tx(xp)}" y2="${ty(yp)}" stroke="#2980b9" stroke-width="1.2"/>` +
                                `<line x1="${tx(xp)}" y1="${ty(yp)}" x2="${tx(xc)}" y2="${ty(yc)}" stroke="#2980b9" stroke-width="1.2"/>` +
                                // 点とラベル
                                `<circle cx="${ox}" cy="${oy}" r="2.5" fill="#000"/><text x="${ox+4}" y="${oy+12}" class="svg-text svg-bold">O</text>` +
                                `<circle cx="${tx(xa)}" cy="${ty(ya)}" r="3" fill="#d9534f"/><text x="${tx(xa)-12}" y="${ty(ya)+4}" class="svg-text svg-bold" fill="#d9534f">A</text>` +
                                `<circle cx="${tx(xb)}" cy="${ty(yb)}" r="3" fill="#d9534f"/><text x="${tx(xb)-12}" y="${ty(yb)+4}" class="svg-text svg-bold" fill="#d9534f">B</text>` +
                                `<circle cx="${tx(xc)}" cy="${ty(yc)}" r="3" fill="#2980b9"/><text x="${tx(xc)+6}" y="${ty(yc)+4}" class="svg-text svg-bold" fill="#2980b9">C</text>` +
                                `<circle cx="${tx(xd)}" cy="${ty(yd)}" r="3" fill="#2980b9"/><text x="${tx(xd)+6}" y="${ty(yd)+4}" class="svg-text svg-bold" fill="#2980b9">D</text>` +
                                `<circle cx="${tx(xp)}" cy="${ty(yp)}" r="2.5" fill="#27ae60"/><text x="${tx(xp)+4}" y="${ty(yp)-4}" class="svg-text svg-bold" fill="#27ae60">P</text>` +
                                `</svg>`;
                     })(),
            generateRandom: function() {
                const a = 0.5;
                
                const xaChoices = [-6, -4];
                const xbChoices = [2, 3];
                const xdChoices = [5, 7];
                
                const xa = xaChoices[Math.floor(Math.random() * xaChoices.length)];
                const xb = xbChoices[Math.floor(Math.random() * xbChoices.length)];
                const xd = xdChoices[Math.floor(Math.random() * xdChoices.length)];
                
                const ya = a * xa * xa;
                const yb = a * xb * xb;
                const actualYd = a * xd * xd;

                const formatFracClean = (num, den) => {
                    const gcd = (p, q) => q === 0 ? p : gcd(q, p % q);
                    const g = Math.abs(gcd(num, den));
                    let nNum = num / g, nDen = den / g;
                    if (nDen === 0) return "0";
                    let isNeg = false;
                    if (nNum < 0) { isNeg = !isNeg; nNum = Math.abs(nNum); }
                    if (nDen < 0) { isNeg = !isNeg; nDen = Math.abs(nDen); }
                    
                    if (nDen === 1) return (isNeg ? `-${nNum}` : `${nNum}`);
                    return (isNeg ? `-\\frac{${nNum}}{${nDen}}` : `\\frac{${nNum}}{${nDen}}`);
                };

                const formatFracVal = (val) => {
                    const num = Math.round(val * 10);
                    const den = 10;
                    return formatFracClean(num, den);
                };

                const formatCoeff = (val) => {
                    const frac = formatFracVal(val);
                    if (frac === "1") return "";
                    if (frac === "-1") return "-";
                    return frac;
                };

                const m_bd = (actualYd - yb) / (xd - xb);
                const yc = ya - m_bd * xa;

                const mAD = (actualYd - ya) / (xd - xa);
                const bAD = ya - mAD * xa;
                const mBC = (yc - yb) / (0 - xb);
                const bBC = yc;
                const xp = (bBC - bAD) / (mAD - mBC);
                const yp = mAD * xp + bAD;

                // グラフ生成（問題用：モノクロ版・点Cなどの見切れを防ぐため高さを400に拡張）
                const svgW = 340, svgH = 400;
                const ox = 170, oy = 310;
                const scale = 4.5;
                const maxAbsX = Math.max(Math.abs(xa), Math.abs(xd), 6) + 3;
                const rangeX = maxAbsX;

                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 340px;">` +
                               `<style>` +
                               `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                               `  .svg-bold { font-weight: bold; }` +
                               `</style>`;
                
                const axisMinX = 20, axisMaxX = svgW - 20;
                const axisMinY = 20, axisMaxY = svgH - 25;
                const clampedOy = Math.max(axisMinY, Math.min(axisMaxY, oy));

                svgGraph += `<line x1="${axisMinX}" y1="${clampedOy}" x2="${axisMaxX}" y2="${clampedOy}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<line x1="${ox}" y1="${axisMinY}" x2="${ox}" y2="${axisMaxY}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<text x="${axisMaxX - 10}" y="${clampedOy + 12}" font-size="9" fill="#000">x</text>`;
                svgGraph += `<text x="${ox + 5}" y="${axisMinY + 8}" font-size="9" fill="#000">y</text>`;
                svgGraph += `<text x="${ox - 10}" y="${clampedOy + 12}" font-size="8" fill="#000">0</text>`;

                let pathD = "";
                for (let px = -rangeX; px <= rangeX; px += 0.1) {
                    let py = a * px * px;
                    pathD += `${pathD === "" ? "M" : "L"} ${tx(px)} ${ty(py)} `;
                }
                svgGraph += `<path d="${pathD}" fill="none" stroke="#000" stroke-width="1.2" />`;

                // 直線ADと直線BCを破線で追加
                svgGraph += `<line x1="${tx(xa)}" y1="${ty(ya)}" x2="${tx(xd)}" y2="${ty(actualYd)}" stroke="#555" stroke-width="1" stroke-dasharray="3,3"/>`;
                svgGraph += `<line x1="${tx(xb)}" y1="${ty(yb)}" x2="${tx(0)}" y2="${ty(yc)}" stroke="#555" stroke-width="1" stroke-dasharray="3,3"/>`;

                // 三角形ABPの辺（実線）
                svgGraph += `<line x1="${tx(xa)}" y1="${ty(ya)}" x2="${tx(xb)}" y2="${ty(yb)}" stroke="#000" stroke-width="1.2"/>`;
                svgGraph += `<line x1="${tx(xb)}" y1="${ty(yb)}" x2="${tx(xp)}" y2="${ty(yp)}" stroke="#000" stroke-width="1.2"/>`;
                svgGraph += `<line x1="${tx(xp)}" y1="${ty(yp)}" x2="${tx(xa)}" y2="${ty(ya)}" stroke="#000" stroke-width="1.2"/>`;

                // 三角形CDPの辺（実線）
                svgGraph += `<line x1="${tx(0)}" y1="${ty(yc)}" x2="${tx(xd)}" y2="${ty(actualYd)}" stroke="#000" stroke-width="1.2"/>`;
                svgGraph += `<line x1="${tx(xd)}" y1="${ty(actualYd)}" x2="${tx(xp)}" y2="${ty(yp)}" stroke="#000" stroke-width="1.2"/>`;
                svgGraph += `<line x1="${tx(xp)}" y1="${ty(yp)}" x2="${tx(0)}" y2="${ty(yc)}" stroke="#000" stroke-width="1.2"/>`;

                // 点とラベル
                svgGraph += `<circle cx="${ox}" cy="${clampedOy}" r="2" fill="#000" /><text x="${ox + 4}" y="${clampedOy - 4}" font-size="9" fill="#000" font-weight="bold">O</text>`;
                svgGraph += `<circle cx="${tx(xa)}" cy="${ty(ya)}" r="2.5" fill="#000" /><text x="${tx(xa) - 14}" y="${ty(ya) + 4}" class="svg-text svg-bold">A</text>`;
                svgGraph += `<circle cx="${tx(xb)}" cy="${ty(yb)}" r="2.5" fill="#000" /><text x="${tx(xb) + 6}" y="${ty(yb) + 4}" class="svg-text svg-bold">B</text>`;
                svgGraph += `<circle cx="${tx(xd)}" cy="${ty(actualYd)}" r="2.5" fill="#000" /><text x="${tx(xd) + 6}" y="${ty(actualYd) + 4}" class="svg-text svg-bold">D</text>`;
                svgGraph += `<circle cx="${tx(0)}" cy="${ty(yc)}" r="2.5" fill="#000" /><text x="${tx(0) + 6}" y="${ty(yc) + 4}" class="svg-text svg-bold">C</text>`;
                svgGraph += `<circle cx="${tx(xp)}" cy="${ty(yp)}" r="2" fill="#000" /><text x="${tx(xp) + 6}" y="${ty(yp) - 4}" class="svg-text svg-bold">P</text>`;

                svgGraph += `</svg>`;

                const aStr = formatCoeff(a);
                const xaStr = formatFracVal(xa);
                const yaStr = formatFracVal(ya);
                const xbStr = formatFracVal(xb);
                const ybStr = formatFracVal(yb);
                const xdStr = formatFracVal(xd);
                const ydStr = formatFracVal(actualYd);
                const m_bd_str = formatFracVal(m_bd);
                const yc_str = formatFracVal(yc);

                const problemText = `\\(y = ${aStr}x^2\\) の放物線上にある点 \\(A(${xaStr}, ${yaStr})\\)、\\(B(${xbStr}, ${ybStr})\\)、\\(D(${xdStr}, ${ydStr})\\) がある（それぞれの \\(x\\) 座標の絶対値は一致しない）。<br>` +
                                    "\\(y\\) 軸上に点 \\(C\\) をとり、線分 \\(AD\\) と \\(BC\\) の交点を \\(P\\) とする。<br>" +
                                    "\\(\\triangle ABP = \\triangle CDP\\) のとき、点 \\(C\\) の \\(y\\) 座標を求めなさい。<br>" + svgGraph;

                return {
                    problem: problemText,
                    explanation: `【解説】<br>` +
                                 `1. <strong>対面等積より AC // BD</strong>：\\(\\triangle ABP = \\triangle CDP\\) より、対面等積の性質から AC // BD が成り立ちます。<br>` +
                                 `2. <strong>直線 \\(BD\\) の傾きを求める</strong>：点 \\(B(${xbStr}, ${ybStr})\\)、\\(D(${xdStr}, ${ydStr})\\) より、直線 \\(BD\\) の傾きは \\(${m_bd_str}\\) となります。<br>` +
                                 `3. <strong>平行線を引く</strong>：点 \\(A\\) を通り \\(BD\\) と平行な直線（直線 \\(AC\\)）を引きます。この直線の傾きも \\(${m_bd_str}\\) です。<br>` +
                                 `4. <strong>点 \\(C\\) の座標を求める</strong>：点 \\(A(${xaStr}, ${yaStr})\\) を通り、傾きが \\(${m_bd_str}\\) の直線の \\(y\\) 切片を計算すると、点 \\(C\\) の \\(y\\) 座標は \\(\\mathbf{y = ${yc_str}}\\) となります。`
                };
            }
        },
             "部分等積を用いた図形の変形": {
            level: "公立",
            formula: "座標平面上に四角形OABCと\\(\\triangle COD\\)があり、O、A、Dは一直線上にある。<br>" +
                     "\\(四角形 OABC = \\triangle COD\\) のとき、重なっていない部分や共通の部分に着目する。<br>" +
                     "線分ABと線分CDの交点をPとする。\\(\\triangle BCP = \\triangle ADP\\) なので \\(AC \\parallel BD\\) となる。<br>" +
                     // 【公式欄用SVG】
                     (() => {
                         const svgW = 260, svgH = 220;
                         const ox = 40, oy = 180, scale = 22;
                         
                         const ax = 3, ay = 1.5;
                         const dx = 6, dy = 3;
                         const cx = 2, cy = 5;
                         const bx = 5, by = 6.5;
                         const px = 4, py = 4;
                         
                         const tx = (x) => ox + x * scale;
                         const ty = (y) => oy - y * scale;
                         
                         return `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 260px;">` +
                                `<style>` +
                                `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                                `  .svg-bold { font-weight: bold; }` +
                                `</style>` +
                                `<line x1="20" y1="${oy}" x2="${svgW - 20}" y2="${oy}" stroke="#555" stroke-width="1.2"/>` +
                                `<line x1="${ox}" y1="15" x2="${ox}" y2="${svgH - 20}" stroke="#555" stroke-width="1.2"/>` +
                                `<line x1="${tx(0)}" y1="${ty(0)}" x2="${tx(7)}" y2="${ty(3.5)}" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>` +
                                `<line x1="${tx(cx)}" y1="${ty(cy)}" x2="${tx(ax)}" y2="${ty(ay)}" stroke="#e74c3c" stroke-width="1" stroke-dasharray="3,3"/>` +
                                `<line x1="${tx(dx)}" y1="${ty(dy)}" x2="${tx(bx)}" y2="${ty(by)}" stroke="#e74c3c" stroke-width="1" stroke-dasharray="3,3"/>` +
                                // 四角形OABC（半透明の青色）
                                `<polygon points="${tx(0)},${ty(0)} ${tx(ax)},${ty(ay)} ${tx(bx)},${ty(by)} ${tx(cx)},${ty(cy)}" fill="rgba(41, 128, 185, 0.2)" stroke="#2980b9" stroke-width="1.2"/>` +
                                // △COD（半透明の赤色）
                                `<polygon points="${tx(cx)},${ty(cy)} ${tx(0)},${ty(0)} ${tx(dx)},${ty(dy)}" fill="rgba(217, 83, 79, 0.2)" stroke="#d9534f" stroke-width="1.2"/>` +
                                // △BCP（半透明のオレンジ色）
                                `<polygon points="${tx(bx)},${ty(by)} ${tx(cx)},${ty(cy)} ${tx(px)},${ty(py)}" fill="rgba(230, 126, 34, 0.3)" stroke="#e67e22" stroke-width="1.2"/>` +
                                // △ADP（半透明の緑色）
                                `<polygon points="${tx(ax)},${ty(ay)} ${tx(dx)},${ty(dy)} ${tx(px)},${ty(py)}" fill="rgba(46, 204, 113, 0.3)" stroke="#2ecc71" stroke-width="1.2"/>` +
                                `<line x1="${tx(ax)}" y1="${ty(ay)}" x2="${tx(bx)}" y2="${ty(by)}" stroke="#2980b9" stroke-width="1.2"/>` +
                                `<line x1="${tx(cx)}" y1="${ty(cy)}" x2="${tx(dx)}" y2="${ty(dy)}" stroke="#d9534f" stroke-width="1.2"/>` +
                                `<circle cx="${tx(0)}" cy="${ty(0)}" r="2.5" fill="#000"/><text x="${tx(0)-12}" y="${ty(0)+12}" class="svg-text svg-bold">O</text>` +
                                `<circle cx="${tx(ax)}" cy="${ty(ay)}" r="2.5" fill="#000"/><text x="${tx(ax)+4}" y="${ty(ay)-6}" class="svg-text svg-bold">A</text>` +
                                `<circle cx="${tx(bx)}" cy="${ty(by)}" r="2.5" fill="#000"/><text x="${tx(bx)+4}" y="${ty(by)+4}" class="svg-text svg-bold">B</text>` +
                                `<circle cx="${tx(cx)}" cy="${ty(cy)}" r="2.5" fill="#000"/><text x="${tx(cx)-12}" y="${tx(cx)+4}" class="svg-text svg-bold">C</text>` +
                                `<circle cx="${tx(dx)}" cy="${ty(dy)}" r="2.5" fill="#000"/><text x="${tx(dx)+6}" y="${ty(dy)-4}" class="svg-text svg-bold">D</text>` +
                                `<circle cx="${tx(px)}" cy="${ty(py)}" r="2.5" fill="#27ae60"/><text x="${tx(px)+6}" y="${ty(py)-4}" class="svg-text svg-bold" fill="#27ae60">P</text>` +
                                `</svg>`;
                     })(),
            generateRandom: function() {
                const mOA = Math.floor(Math.random() * 2) + 1; // 1 または 2
                
                // 条件を満たす座標の自動生成
                const cx = 1;
                const bx = cx + Math.floor(Math.random() * 2) + 1; // 2 または 3
                const ax = bx + Math.floor(Math.random() * 2) + 1; // bx + 1 または bx + 2
                
                const ay = mOA * ax;
                const cy = ay + 1;
                const by = cy + 1;

                const pX = Math.floor(Math.random() * (ax - 1)) + 1;
                const ansX = pX;

                const formatFracClean = (num, den) => {
                    const gcd = (p, q) => q === 0 ? p : gcd(q, p % q);
                    const g = Math.abs(gcd(num, den));
                    let nNum = num / g, nDen = den / g;
                    if (nDen === 0) return "0";
                    let isNeg = false;
                    if (nNum < 0) { isNeg = !isNeg; nNum = Math.abs(nNum); }
                    if (nDen < 0) { isNeg = !isNeg; nDen = Math.abs(nDen); }
                    if (nDen === 1) return (isNeg ? `-${nNum}` : `${nNum}`);
                    return (isNeg ? `-\\frac{${nNum}}{${nDen}}` : `\\frac{${nNum}}{${nDen}}`);
                };

                const formatFracVal = (val) => {
                    const num = Math.round(val * 10);
                    const den = 10;
                    return formatFracClean(num, den);
                };

                // 平行線の式を動的に計算（符号を美しく整理）
                const mAC_num = cy - ay;
                const mAC_den = cx - ax;
                const gcd = (p, q) => q === 0 ? p : gcd(q, p % q);
                const g_m = Math.abs(gcd(mAC_num, mAC_den));
                let smNum = mAC_num / g_m;
                let smDen = mAC_den / g_m;

                // 分母がマイナスの場合は分子側に持たせる
                if (smDen < 0) {
                    smNum = -smNum;
                    smDen = -smDen;
                }

                let slopeText = "";
                if (smDen === 1) {
                    slopeText = smNum === 1 ? "" : (smNum === -1 ? "-" : `${smNum}`);
                } else {
                    slopeText = smNum < 0 ? `-\\frac{${Math.abs(smNum)}}{${smDen}}` : `\\frac{${smNum}}{${smDen}}`;
                }

                const b_num = by * smDen - smNum * bx;
                const b_den = smDen;
                const g_b = Math.abs(gcd(b_num, b_den));
                let sbNum = b_num / g_b;
                let sbDen = b_den / g_b;

                if (sbDen < 0) {
                    sbNum = -sbNum;
                    sbDen = -sbDen;
                }

                let interceptText = "";
                if (sbNum !== 0) {
                    let absNum = Math.abs(sbNum);
                    let fracStr = sbDen === 1 ? `${absNum}` : `\\frac{${absNum}}{${sbDen}}`;
                    interceptText = sbNum > 0 ? ` + ${fracStr}` : ` - ${fracStr}`;
                }
                const parallelLineEquation = `y = ${slopeText}x${interceptText}`;

                const svgW = 300, svgH = 320;
                const ox = 60, oy = 280;
                const scale = 20;

                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 300px;">` +
                               `<style>` +
                               `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                               `  .svg-bold { font-weight: bold; }` +
                               `</style>`;
                
                const axisMinX = 20, axisMaxX = svgW - 20;
                const axisMinY = 20, axisMaxY = svgH - 20;

                svgGraph += `<line x1="${axisMinX}" y1="${oy}" x2="${axisMaxX}" y2="${oy}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<line x1="${ox}" y1="${axisMinY}" x2="${ox}" y2="${axisMaxY}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<text x="${axisMaxX - 10}" y="${oy + 14}" font-size="9" fill="#000">x</text>`;
                svgGraph += `<text x="${ox + 6}" y="${axisMinY + 8}" font-size="9" fill="#000">y</text>`;
                svgGraph += `<text x="${ox - 10}" y="${oy + 12}" font-size="8" fill="#000">0</text>`;

                const xMax = Math.max(ax, by) + 2;
                svgGraph += `<line x1="${ox}" y1="${oy}" x2="${tx(xMax)}" y2="${ty(mOA * xMax)}" stroke="#000" stroke-width="1.2"/>`;
                svgGraph += `<polygon points="${ox},${oy} ${tx(ax)},${ty(ay)} ${tx(bx)},${ty(by)} ${tx(cx)},${ty(cy)}" fill="none" stroke="#000" stroke-width="1.2"/>`;
                
                svgGraph += `<circle cx="${ox}" cy="${oy}" r="2" fill="#000"/><text x="${ox - 10}" y="${oy + 12}" class="svg-text svg-bold">O</text>`;
                svgGraph += `<circle cx="${tx(ax)}" cy="${ty(ay)}" r="2.5" fill="#000"/><text x="${tx(ax) + 5}" y="${ty(ay) - 5}" class="svg-text svg-bold">A</text>`;
                svgGraph += `<circle cx="${tx(bx)}" cy="${ty(by)}" r="2.5" fill="#000"/><text x="${tx(bx) + 5}" y="${ty(by) - 5}" class="svg-text svg-bold">B</text>`;
                svgGraph += `<circle cx="${tx(cx)}" cy="${ty(cy)}" r="2.5" fill="#000"/><text x="${tx(cx) - 12}" y="${ty(cy) + 4}" class="svg-text svg-bold">C</text>`;

                svgGraph += `</svg>`;

                const ansStr = formatFracVal(ansX);

                const problemText = `座標平面上に直線 \\(y = ${mOA}x\\) （直線 \\(OA\\)）がある。<br>` +
                                    `点 \\(A(${ax}, ${ay})\\)、\\(B(${bx}, ${by})\\)、\\(C(${cx}, ${cy})\\) とする。<br>` +
                                    `図のように、四角形 \\(OABC\\) があるとき、直線 \\(OA\\) 上に \\(四角形 OABC = \\triangle COP\\) となる点 \\(P\\) をとる。<br>` +
                                    `このとき、点 \\(P\\) の \\(x\\) 座標を求めなさい。ただし、点 \\(P\\) の \\(x\\) 座標は正の数とする。<br>` + svgGraph;

                return {
                    problem: problemText,
                    explanation: `【解説】<br>` +
                                 `1. <strong>ACの傾きを求める</strong>：点 \\(A(${ax}, ${ay})\\)、\\(C(${cx}, ${cy})\\) の座標から、直線 \\(AC\\) の傾きを求めます。<br>` +
                                 `2. <strong>Bを通るACとの平行線の式</strong>：点 \\(B(${bx}, ${by})\\) を通り \\(AC\\) と平行な直線の式は \\(${parallelLineEquation}\\) となります。<br>` +
                                 `3. <strong>交点Pの座標を求める</strong>：その平行線と直線 \\(OA\\) （\\(y = ${mOA}x\\)）との交点として点 \\(P\\) の座標を求めます。<br>` +
                                 `4. <strong>答え</strong>：計算を行うと、点 \\(P\\) の \\(x\\) 座標は <strong>\\(${ansStr}\\)</strong> となります。`
                };
            }
        },
        "部分等積を用いた図形の変形": {
            level: "公立",
            formula: "座標平面上に四角形OABCと\\(\\triangle COD\\)があり、O、A、Dは一直線上にある。<br>" +
                     "\\(四角形 OABC = \\triangle COD\\) のとき、重なっていない部分や共通の部分に着目する。<br>" +
                     "線分ABと線分CDの交点をPとする。\\(\\triangle BCP = \\triangle ADP\\) なので \\(AC \\parallel BD\\) となる。<br>" +
                     // 【公式欄用SVG】
                     (() => {
                         const svgW = 260, svgH = 220;
                         const ox = 40, oy = 180, scale = 22;
                         
                         const ax = 3, ay = 1.5;
                         const dx = 6, dy = 3;
                         const cx = 2, cy = 5;
                         const bx = 5, by = 6.5;
                         const px = 4, py = 4;
                         
                         const tx = (x) => ox + x * scale;
                         const ty = (y) => oy - y * scale;
                         
                         return `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 260px;">` +
                                `<style>` +
                                `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                                `  .svg-bold { font-weight: bold; }` +
                                `</style>` +
                                `<line x1="20" y1="${oy}" x2="${svgW - 20}" y2="${oy}" stroke="#555" stroke-width="1.2"/>` +
                                `<line x1="${ox}" y1="15" x2="${ox}" y2="${svgH - 20}" stroke="#555" stroke-width="1.2"/>` +
                                `<line x1="${tx(0)}" y1="${ty(0)}" x2="${tx(7)}" y2="${ty(3.5)}" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>` +
                                `<line x1="${tx(cx)}" y1="${ty(cy)}" x2="${tx(ax)}" y2="${ty(ay)}" stroke="#e74c3c" stroke-width="1" stroke-dasharray="3,3"/>` +
                                `<line x1="${tx(dx)}" y1="${ty(dy)}" x2="${tx(bx)}" y2="${ty(by)}" stroke="#e74c3c" stroke-width="1" stroke-dasharray="3,3"/>` +
                                // 四角形OABC（半透明の青色）
                                `<polygon points="${tx(0)},${ty(0)} ${tx(ax)},${ty(ay)} ${tx(bx)},${ty(by)} ${tx(cx)},${ty(cy)}" fill="rgba(41, 128, 185, 0.2)" stroke="#2980b9" stroke-width="1.2"/>` +
                                // △COD（半透明の赤色）
                                `<polygon points="${tx(cx)},${ty(cy)} ${tx(0)},${ty(0)} ${tx(dx)},${ty(dy)}" fill="rgba(217, 83, 79, 0.2)" stroke="#d9534f" stroke-width="1.2"/>` +
                                // △BCP（半透明のオレンジ色）
                                `<polygon points="${tx(bx)},${ty(by)} ${tx(cx)},${ty(cy)} ${tx(px)},${ty(py)}" fill="rgba(230, 126, 34, 0.3)" stroke="#e67e22" stroke-width="1.2"/>` +
                                // △ADP（半透明の緑色）
                                `<polygon points="${tx(ax)},${ty(ay)} ${tx(dx)},${ty(dy)} ${tx(px)},${ty(py)}" fill="rgba(46, 204, 113, 0.3)" stroke="#2ecc71" stroke-width="1.2"/>` +
                                `<line x1="${tx(ax)}" y1="${ty(ay)}" x2="${tx(bx)}" y2="${ty(by)}" stroke="#2980b9" stroke-width="1.2"/>` +
                                `<line x1="${tx(cx)}" y1="${ty(cy)}" x2="${tx(dx)}" y2="${ty(dy)}" stroke="#d9534f" stroke-width="1.2"/>` +
                                `<circle cx="${tx(0)}" cy="${ty(0)}" r="2.5" fill="#000"/><text x="${tx(0)-12}" y="${ty(0)+12}" class="svg-text svg-bold">O</text>` +
                                `<circle cx="${tx(ax)}" cy="${ty(ay)}" r="2.5" fill="#000"/><text x="${tx(ax)+4}" y="${ty(ay)-6}" class="svg-text svg-bold">A</text>` +
                                `<circle cx="${tx(bx)}" cy="${ty(by)}" r="2.5" fill="#000"/><text x="${tx(bx)+4}" y="${ty(by)+4}" class="svg-text svg-bold">B</text>` +
                                `<circle cx="${tx(cx)}" cy="${ty(cy)}" r="2.5" fill="#000"/><text x="${tx(cx)-12}" y="${tx(cx)+4}" class="svg-text svg-bold">C</text>` +
                                `<circle cx="${tx(dx)}" cy="${ty(dy)}" r="2.5" fill="#000"/><text x="${tx(dx)+6}" y="${ty(dy)-4}" class="svg-text svg-bold">D</text>` +
                                `<circle cx="${tx(px)}" cy="${ty(py)}" r="2.5" fill="#27ae60"/><text x="${tx(px)+6}" y="${ty(py)-4}" class="svg-text svg-bold" fill="#27ae60">P</text>` +
                                `</svg>`;
                     })(),
            generateRandom: function() {
                let mOA, cx, bx, ax, ay, cy, by, smNum, smDen, sbNum, sbDen, ansNum, ansDen;
                let valid = false;

                // 条件を満たす座標・交点を自動生成（Pのx座標がAのx座標より大きくなる組み合わせを探す）
                while (!valid) {
                    mOA = Math.floor(Math.random() * 2) + 1; // 1 または 2
                    cx = 1;
                    bx = cx + Math.floor(Math.random() * 2) + 1; // 2 または 3
                    ax = bx + Math.floor(Math.random() * 2) + 2; // 4 ~ 6
                    
                    ay = mOA * ax;
                    cy = ay + Math.floor(Math.random() * 2) + 1;
                    by = cy + Math.floor(Math.random() * 2) + 1;

                    const mAC_num = cy - ay;
                    const mAC_den = cx - ax;
                    const gcd = (p, q) => q === 0 ? p : gcd(q, p % q);
                    const g_m = Math.abs(gcd(mAC_num, mAC_den));
                    smNum = mAC_num / g_m;
                    smDen = mAC_den / g_m;

                    if (smDen < 0) {
                        smNum = -smNum;
                        smDen = -smDen;
                    }

                    const b_num = by * smDen - smNum * bx;
                    const b_den = smDen;
                    const g_b = Math.abs(gcd(b_num, b_den));
                    sbNum = b_num / g_b;
                    sbDen = b_den / g_b;

                    if (sbDen < 0) {
                        sbNum = -sbNum;
                        sbDen = -sbDen;
                    }

                    // 交点Pのx座標を分数として計算 (mOA * x = smNum/smDen * x + sbNum/sbDen)
                    // (mOA * smDen - smNum) * x = sbNum (分母が1の場合を考慮)
                    const pDen = mOA * smDen - smNum;
                    const pNum = sbNum * smDen; // 共通の分母で調整
                    
                    // 実際には x = sbNum / (mOA - smNum/smDen) = (sbNum * smDen) / (mOA * smDen - smNum)
                    const denFinal = mOA * smDen - smNum;
                    const numFinal = sbNum; // 上記の式変形による

                    if (denFinal !== 0) {
                        const valX = numFinal / denFinal;
                        // Pのx座標がAのx座標より大きいかチェック
                        if (valX > ax) {
                            ansNum = numFinal;
                            ansDen = denFinal;
                            valid = true;
                        }
                    }
                }

                const formatFracClean = (num, den) => {
                    const gcd = (p, q) => q === 0 ? p : gcd(q, p % q);
                    const g = Math.abs(gcd(num, den));
                    let nNum = num / g, nDen = den / g;
                    if (nDen === 0) return "0";
                    let isNeg = false;
                    if (nNum < 0) { isNeg = !isNeg; nNum = Math.abs(nNum); }
                    if (nDen < 0) { isNeg = !isNeg; nDen = Math.abs(nDen); }
                    if (nDen === 1) return (isNeg ? `-${nNum}` : `${nNum}`);
                    return (isNeg ? `-\\frac{${nNum}}{${nDen}}` : `\\frac{${nNum}}{${nDen}}`);
                };

                let slopeText = "";
                if (smDen === 1) {
                    slopeText = smNum === 1 ? "" : (smNum === -1 ? "-" : `${smNum}`);
                } else {
                    slopeText = smNum < 0 ? `-\\frac{${Math.abs(smNum)}}{${smDen}}` : `\\frac{${smNum}}{${smDen}}`;
                }

                let interceptText = "";
                if (sbNum !== 0) {
                    let absNum = Math.abs(sbNum);
                    let fracStr = sbDen === 1 ? `${absNum}` : `\\frac{${absNum}}{${sbDen}}`;
                    interceptText = sbNum > 0 ? ` + ${fracStr}` : ` - ${fracStr}`;
                }
                const parallelLineEquation = `y = ${slopeText}x${interceptText}`;

                const svgW = 300, svgH = 320;
                const ox = 60, oy = 280;
                const scale = 20;

                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 300px;">` +
                               `<style>` +
                               `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                               `  .svg-bold { font-weight: bold; }` +
                               `</style>`;
                
                const axisMinX = 20, axisMaxX = svgW - 20;
                const axisMinY = 20, axisMaxY = svgH - 20;

                svgGraph += `<line x1="${axisMinX}" y1="${oy}" x2="${axisMaxX}" y2="${oy}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<line x1="${ox}" y1="${axisMinY}" x2="${ox}" y2="${axisMaxY}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<text x="${axisMaxX - 10}" y="${oy + 14}" font-size="9" fill="#000">x</text>`;
                svgGraph += `<text x="${ox + 6}" y="${axisMinY + 8}" font-size="9" fill="#000">y</text>`;
                svgGraph += `<text x="${ox - 10}" y="${oy + 12}" font-size="8" fill="#000">0</text>`;

                const xMax = Math.max(ax, by) + 3;
                svgGraph += `<line x1="${ox}" y1="${oy}" x2="${tx(xMax)}" y2="${ty(mOA * xMax)}" stroke="#000" stroke-width="1.2"/>`;
                svgGraph += `<polygon points="${ox},${oy} ${tx(ax)},${ty(ay)} ${tx(bx)},${ty(by)} ${tx(cx)},${ty(cy)}" fill="none" stroke="#000" stroke-width="1.2"/>`;
                
                svgGraph += `<circle cx="${ox}" cy="${oy}" r="2" fill="#000"/><text x="${ox - 10}" y="${oy + 12}" class="svg-text svg-bold">O</text>`;
                svgGraph += `<circle cx="${tx(ax)}" cy="${ty(ay)}" r="2.5" fill="#000"/><text x="${tx(ax) + 5}" y="${ty(ay) - 5}" class="svg-text svg-bold">A</text>`;
                svgGraph += `<circle cx="${tx(bx)}" cy="${ty(by)}" r="2.5" fill="#000"/><text x="${tx(bx) + 5}" y="${ty(by) - 5}" class="svg-text svg-bold">B</text>`;
                svgGraph += `<circle cx="${tx(cx)}" cy="${ty(cy)}" r="2.5" fill="#000"/><text x="${tx(cx) - 12}" y="${ty(cy) + 4}" class="svg-text svg-bold">C</text>`;

                svgGraph += `</svg>`;

                const ansStr = formatFracClean(ansNum, ansDen);

                const problemText = `座標平面上に直線 \\(y = ${mOA}x\\) （直線 \\(OA\\)）がある。<br>` +
                                    `点 \\(A(${ax}, ${ay})\\)、\\(B(${bx}, ${by})\\)、\\(C(${cx}, ${cy})\\) とする。<br>` +
                                    `図のように、四角形 \\(OABC\\) があるとき、直線 \\(OA\\) 上に \\(四角形 OABC = \\triangle COP\\) となる点 \\(P\\) をとる。<br>` +
                                    `このとき、点 \\(P\\) の \\(x\\) 座標を求めなさい。ただし、点 \\(P\\) の \\(x\\) 座標は点 \\(A\\) の \\(x\\) 座標より大きいとする。<br>` + svgGraph;

                return {
                    problem: problemText,
                    explanation: `【解説】<br>` +
                                 `1. <strong>ACの傾きを求める</strong>：点 \\(A(${ax}, ${ay})\\)、\\(C(${cx}, ${cy})\\) の座標から、直線 \\(AC\\) の傾きを求めます。<br>` +
                                 `2. <strong>Bを通るACとの平行線の式</strong>：点 \\(B(${bx}, ${by})\\) を通り \\(AC\\) と平行な直線の式は \\(${parallelLineEquation}\\) となります。<br>` +
                                 `3. <strong>交点Pの座標を求める</strong>：その平行線と直線 \\(OA\\) （\\(y = ${mOA}x\\)）との交点として点 \\(P\\) の座標を求めます。<br>` +
                                 `4. <strong>答え</strong>：計算を行うと、点 \\(P\\) の \\(x\\) 座標は <strong>\\(${ansStr}\\)</strong> となります。`
                };
            }
        },
        "三角形の面積の二等分線": {
            level: "公立",
            formula: "<strong>【三角形の面積を二等分する直線の式】</strong><br>" +
                     "三角形の面積を二等分する直線は、その直線が通る2点の座標から求めることができます。パターンは大きく2つに分かれます。<br><br>" +
                     "<strong>1. 面積を二等分する直線が三角形の頂点を通る場合</strong><br>" +
                     "&nbsp;&nbsp;⇒ <strong>反対側の辺の中点</strong>を通る直線となります。<br><br>" +
                     "<strong>2. 頂点を通らない場合</strong><br>" +
                     "&nbsp;&nbsp;⇒ 面積比や面積から逆算して、直線がもう1点どこを通るかを求めます。<br>" +
                     "&nbsp;&nbsp;① 分かっている点が載っている線分とは関係のない頂点と結ぶ。<br>" +
                     "&nbsp;&nbsp;② その線分で分けた三角形のうち、大きな図形（四角形など）をさらに分割・調整して全体の面積を二等分する点の座標を見つけます。<br>" +
                     "<strong>【別解の考え方】</strong><br>" +
                     "全体の三角形の面積を求め、二等分された後の目標面積を算出してから、直線が通る座標を逆算します。",
            generateRandom: function() {
                // 上への凸（a < 0）か下への凸（a > 0）をランダムに選択
                const isPositive = Math.random() < 0.5;
                const a = isPositive ? (Math.random() < 0.5 ? 0.5 : 1) : (Math.random() < 0.5 ? -0.5 : -1);
                
                // 点A, Bのx座標
                const xA = -2;
                const xB = 4;
                
                const yA = a * xA * xA;
                const yB = a * xB * xB;

                // (1) 直線ABの式: y = m x + b
                const m = a * (xA + xB);
                const b = -a * xA * xB;

                // 係数1を綺麗に省略するフォーマッター
                const formatLinearEquation = (slope, intercept) => {
                    let sStr = "";
                    if (slope === 1) sStr = "x";
                    else if (slope === -1) sStr = "-x";
                    else if (slope === 0) sStr = "";
                    else sStr = `${slope}x`;

                    let iStr = "";
                    if (intercept > 0) iStr = ` + ${intercept}`;
                    else if (intercept < 0) iStr = ` - ${Math.abs(intercept)}`;

                    if (sStr === "") return intercept === 0 ? "0" : `${intercept}`;
                    return `y = ${sStr}${iStr}`;
                };

                const lineABEquation = formatLinearEquation(m, b);

                // 面積の計算
                const widthAB = xB - xA;
                const heightAB = Math.abs(b);
                const areaVal = 0.5 * heightAB * widthAB;

                // (3) 面積を二等分する直線が通る頂点をランダムに選択 (A, B, O のいずれか)
                const vertices = ['A', 'B', 'O'];
                const selectedVertex = vertices[Math.floor(Math.random() * vertices.length)];

                let line3Equation = "";
                let vertexName = "";
                let explanation3 = "";

                if (selectedVertex === 'A') {
                    vertexName = "A";
                    const midX = xB / 2;
                    const midY = yB / 2;
                    const m3 = (midY - yA) / (midX - xA);
                    const b3 = yA - m3 * xA;
                    line3Equation = formatLinearEquation(m3, b3);
                    explanation3 = `頂点 \\(A\\) から反対側の辺 \\(OB\\) の中点 \\(M(${midX}, ${midY})\\) を通る直線となります。`;
                } else if (selectedVertex === 'B') {
                    vertexName = "B";
                    const midX = xA / 2;
                    const midY = yA / 2;
                    const m3 = (midY - yB) / (midX - xB);
                    const b3 = yB - m3 * xB;
                    line3Equation = formatLinearEquation(m3, b3);
                    explanation3 = `頂点 \\(B\\) から反対側の辺 \\(OA\\) の中点 \\(M(${midX}, ${midY})\\) を通る直線となります。`;
                } else {
                    vertexName = "O";
                    const midX = (xA + xB) / 2;
                    const midY = (yA + yB) / 2;
                    const m3 = midY / midX;
                    line3Equation = formatLinearEquation(m3, 0);
                    explanation3 = `原点 \\(O\\) から反対側の辺 \\(AB\\) の中点 \\(M(${midX}, ${midY})\\) を通る直線となります（切片は \\(0\\)）。`;
                }

                // (4) 点Cを通る面積二等分線の計算
                const slope4 = m / 2;
                const int4 = b;
                const line4Equation = formatLinearEquation(slope4, int4);

                // SVGグラフの生成
                const svgW = 320, svgH = 320;
                const ox = 160, oy = 160;
                const scale = 8;

                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 320px;">` +
                               `<style>` +
                               `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                               `  .svg-bold { font-weight: bold; }` +
                               `</style>`;
                
                // 軸
                svgGraph += `<line x1="20" y1="${oy}" x2="${svgW - 20}" y2="${oy}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<line x1="${ox}" y1="20" x2="${ox}" y2="${svgH - 20}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<text x="${svgW - 15}" y="${oy + 14}" font-size="9" fill="#000">x</text>`;
                svgGraph += `<text x="${ox + 6}" y="25" font-size="9" fill="#000">y</text>`;
                svgGraph += `<text x="${ox - 10}" y="${oy + 12}" font-size="8" fill="#000">0</text>`;

                // 放物線の描画
                let pathD = "";
                for (let px = -5; px <= 5; px += 0.2) {
                    let py = a * px * px;
                    let cmd = (px === -5) ? "M" : "L";
                    pathD += `${cmd} ${tx(px)} ${ty(py)} `;
                }
                svgGraph += `<path d="${pathD}" fill="none" stroke="#2980b9" stroke-width="1.5"/>`;

                // 三角形ABOの塗りつぶし
                svgGraph += `<polygon points="${ox},${oy} ${tx(xA)},${ty(yA)} ${tx(xB)},${ty(yB)}" fill="rgba(41, 128, 185, 0.15)" stroke="#e74c3c" stroke-width="1.2"/>`;

                // 直線AB
                svgGraph += `<line x1="${tx(xA - 2)}" y1="${ty(m * (xA - 2) + b)}" x2="${tx(xB + 2)}" y2="${ty(m * (xB + 2) + b)}" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>`;

                // 点の描画
                svgGraph += `<circle cx="${tx(xA)}" cy="${ty(yA)}" r="3" fill="#000"/><text x="${tx(xA) - 12}" y="${ty(yA) - 5}" class="svg-text svg-bold">A</text>`;
                svgGraph += `<circle cx="${tx(xB)}" cy="${ty(yB)}" r="3" fill="#000"/><text x="${tx(xB) + 5}" y="${ty(yB) - 5}" class="svg-text svg-bold">B</text>`;
                svgGraph += `<circle cx="${ox}" cy="${oy}" r="3" fill="#000"/><text x="${ox - 12}" y="${oy + 12}" class="svg-text svg-bold">O</text>`;
                
                // y切片C
                svgGraph += `<circle cx="${ox}" cy="${ty(b)}" r="2.5" fill="#e67e22"/><text x="${ox + 6}" y="${ty(b) + 3}" class="svg-text svg-bold" fill="#e67e22">C</text>`;

                svgGraph += `</svg>`;

                // aの表示用文字列
                let aStr = "";
                if (a === 1) aStr = "";
                else if (a === -1) aStr = "-";
                else if (a === 0.5) aStr = "\\frac{1}{2}";
                else if (a === -0.5) aStr = "-\\frac{1}{2}";
                else aStr = `${a}`;

                const problemText = `座標平面上にファンクション \\(y = ${aStr}x^2\\) のグラフがあり、グラフ上に2点 \\(A(${xA}, ${yA})\\)、\\(B(${xB}, ${yB})\\) がある。次の問いに答えなさい。<br>` +
                                    `(1) 直線 \\(AB\\) の式を求めなさい。<br>` +
                                    `(2) \\(\\triangle ABO\\) の面積を求めなさい。<br>` +
                                    `(3) 頂点 \\(${vertexName}\\) を通って \\(\\triangle ABO\\) の面積を二等分する直線の式を求めなさい。<br>` +
                                    `(4) 直線 \\(AB\\) と \\(y\\) 軸の交点を \\(C\\) とする。点 \\(C\\) を通って \\(\\triangle ABO\\) の面積を二等分する直線の式を求めなさい。<br>` + svgGraph;

                return {
                    problem: problemText,
                    explanation: `【解説】<br>` +
                                 `(1) <strong>直線ABの式</strong>：放物線と交わる直線の公式 \\(m = a(x_1 + x_2)\\)、\\(b = -ax_1x_2\\) を用いて傾きと切片の値を表すと、求める式は <strong>\\(${lineABEquation}\\)</strong> となります。<br><br>` +
                                 `(2) <strong>\\(\\triangle ABO\\) の面積</strong>：\\(y\\) 軸を底辺とみるときの縦幅 \\(|${b}|\\) と、\\(x\\) 方向の横幅 \\(${xB} - (${xA}) = ${widthAB}\\) の値をそれぞれ表すことで、面積は \\(\\frac{1}{2} \\times ${heightAB} \\times ${widthAB} = \\) <strong>\\(${areaVal}\\)</strong> となります。<br><br>` +
                                 `(3) <strong>頂点${vertexName}を通る二等分線</strong>：${explanation3} したがって、求める式は <strong>\\(${line3Equation}\\)</strong> となります。<br><br>` +
                                 `(4) <strong>点Cを通る二等分線</strong>：<br>` +
                                 `・\\(C\\) は線分 \\(AB\\) 上にあるので \\(OC\\) を結びます。<br>` +
                                 `・\\(C\\) を通り \\(\\triangle ABO\\) の面積を二等分する直線と \\(\\triangle ABO\\) の辺との交点を \\(D\\) とします。<br>` +
                                 `・面積二等分より \\(\\triangle ACD : \\triangle ABO = 1 : 2\\) なので、等角三角形の公式より \\(BC \\times BD : BA \\times BO = 1 : 2\\) が成り立ちます。<br>` +
                                 `・\\(AC : BC\\) の比から \\(BD : BO\\) が分かり、そこから \\(OD : DB\\) の比が求まります。<br>` +
                                 `・\\(OD : DB\\) から点 \\(D\\) の座標を求め、2点 \\(C, D\\) を通る直線の式を計算すると、求める式は <strong>\\(${line4Equation}\\)</strong> となります。`
                };
            }
        },
               "グラフ上の平行四辺形・ナナメの正方形": {
            level: "公立",
            formula: "<strong>【グラフ上の平行四辺形・ナナメの正方形】</strong><br>" +
                     "・グラフ上に平行四辺形やナナメの正方形がある時、上下や左右に合同な直角三角形（反対向きのものを含む）を描くことで、座標を求めることができます。<br>" +
                     "・平行四辺形や正方形の面積を2等分するときは、<strong>対角線の交点＝中点＝点対称の中心を通る直線</strong>を引きます。<br>" +
                     `<svg viewBox="0 0 200 140" style="background: #fff; border: 1px solid #ddd; border-radius: 4px; display: block; margin: 8px auto; width: 100%; max-width: 180px;">` +
                     `  <line x1="20" y1="120" x2="180" y2="120" stroke="#333" stroke-width="1" />` +
                     `  <line x1="40" y1="20" x2="40" y2="130" stroke="#333" stroke-width="1" />` +
                     `  <!-- 補助の直角三角形（下側の青、上側の青、左側の赤、ABを斜辺として右下に直角がある右側の赤） -->` +
                     `  <polygon points="40,120 120,120 120,80" fill="rgba(52, 152, 219, 0.15)" stroke="#3498db" stroke-width="1" stroke-dasharray="2,2"/>` +
                     `  <polygon points="60,40 140,40 60,80" fill="rgba(52, 152, 219, 0.15)" stroke="#3498db" stroke-width="1" stroke-dasharray="2,2"/>` +
                     `  <polygon points="40,120 40,80 60,80" fill="rgba(231, 76, 60, 0.15)" stroke="#e74c3c" stroke-width="1" stroke-dasharray="2,2"/>` +
                     `  <polygon points="120,80 140,40 140,80" fill="rgba(231, 76, 60, 0.15)" stroke="#e74c3c" stroke-width="1" stroke-dasharray="2,2"/>` +
                     `  <!-- 平行四辺形OABC -->` +
                     `  <polygon points="40,120 120,80 140,40 60,80" fill="rgba(46, 204, 113, 0.2)" stroke="#27ae60" stroke-width="1.5"/>` +
                     `  <text x="30" y="130" font-size="9" font-weight="bold">O</text>` +
                     `  <text x="125" y="75" font-size="9" font-weight="bold">A</text>` +
                     `  <text x="145" y="38" font-size="9" font-weight="bold">B</text>` +
                     `  <text x="45" y="78" font-size="9" font-weight="bold">C</text>` +
                     `</svg>` +
                     "<strong>【解法の手順】</strong><br>" +
                     "1. <strong>座標の決定</strong>：上下・左右の直角三角形の横幅・縦幅が等しいことを利用する。<br>" +
                     "2. <strong>面積二等分線</strong>：対角線の交点（中点＝点対称の中心）を求めて直線を通す。",
            generateRandom: function() {
                // 有理数（分数）を正確に扱うためのヘルパー関数群
                const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
                const createFrac = (n, d = 1) => {
                    if (d < 0) { n = -n; d = -d; }
                    const g = gcd(Math.abs(n), d);
                    return { n: n / g, d: d / g };
                };
                const addFrac = (f1, f2) => createFrac(f1.n * f2.d + f2.n * f1.d, f1.d * f2.d);
                const subFrac = (f1, f2) => createFrac(f1.n * f2.d - f2.n * f1.d, f1.d * f2.d);
                const mulFrac = (f1, f2) => createFrac(f1.n * f2.n, f1.d * f2.d);
                const divFrac = (f1, f2) => createFrac(f1.n * f2.d, f1.d * f2.n);
                
                const toLaTeX = (f) => {
                    if (f.d === 1) return `${f.n}`;
                    if (f.n < 0) return `-\\frac{${Math.abs(f.n)}}{${f.d}}`;
                    return `\\frac{${f.n}}{${f.d}}`;
                };
                const toNumber = (f) => f.n / f.d;

                // パターン選択: 0 = 平行四辺形型, 1 = ナナメの正方形型
                const isSquare = Math.random() < 0.5;

                let xA, yA, xC, yC, xB, yB;
                let shapeName = "";

                if (!isSquare) {
                    shapeName = "平行四辺形";
                    const axValues = [2, 3, 4];
                    const ayValues = [1, 2];
                    const ax = axValues[Math.floor(Math.random() * axValues.length)];
                    const ay = ayValues[Math.floor(Math.random() * ayValues.length)];
                    xA = createFrac(ax);
                    yA = createFrac(ay);

                    const cxValues = [1, 2];
                    const cyValues = [3, 4, 5];
                    const cx = cxValues[Math.floor(Math.random() * cxValues.length)];
                    const cy = cyValues[Math.floor(Math.random() * cyValues.length)];
                    xC = createFrac(cx);
                    yC = createFrac(cy);

                    xB = addFrac(xA, xC);
                    yB = addFrac(yA, yC);
                } else {
                    shapeName = "正方形";
                    const baseVals = [[2, 1], [3, 1], [3, 2]];
                    const pair = baseVals[Math.floor(Math.random() * baseVals.length)];
                    const p = pair[0];
                    const q = pair[1];

                    xA = createFrac(p);
                    yA = createFrac(q);
                    xC = createFrac(-q);
                    yC = createFrac(p);

                    xB = addFrac(xA, xC);
                    yB = addFrac(yA, yC);
                }

                const midX = divFrac(xB, createFrac(2));
                const midY = divFrac(yB, createFrac(2));

                // 点Pを x軸上または y軸上にランダムに配置
                let pXVal, pYVal;
                const isOnXAxis = Math.random() < 0.5;
                if (isOnXAxis) {
                    pXVal = Math.floor(Math.random() * 4) + 1;
                    pYVal = 0;
                } else {
                    pXVal = 0;
                    pYVal = Math.floor(Math.random() * 4) + 1;
                }

                const pXFrac = createFrac(pXVal);
                const pYFrac = createFrac(pYVal);
                const mLine = divFrac(subFrac(midY, pYFrac), subFrac(midX, pXFrac));
                const bLine = subFrac(midY, mulFrac(mLine, midX));

                const formatLinearEquation = (slopeF, intF) => {
                    let sStr = "";
                    if (slopeF.n === 1 && slopeF.d === 1) sStr = "x";
                    else if (slopeF.n === -1 && slopeF.d === 1) sStr = "-x";
                    else if (slopeF.n === 0) sStr = "";
                    else sStr = `${toLaTeX(slopeF)}x`;

                    let iStr = "";
                    if (intF.n > 0) iStr = ` + ${toLaTeX(intF)}`;
                    else if (intF.n < 0) iStr = ` - ${toLaTeX(createFrac(-intF.n, intF.d))}`;

                    if (sStr === "") return intF.n === 0 ? "0" : `${toLaTeX(intF)}`;
                    return `y = ${sStr}${iStr}`;
                };

                const lineEquation = formatLinearEquation(mLine, bLine);

                // SVGグラフの生成
                const svgW = 320, svgH = 320;
                const ox = 80, oy = 260;
                const scale = 25;

                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 320px;">` +
                               `<style>` +
                               `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                               `  .svg-bold { font-weight: bold; }` +
                               `</style>`;
                
                svgGraph += `<line x1="20" y1="${oy}" x2="${svgW - 20}" y2="${oy}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<line x1="${ox}" y1="20" x2="${ox}" y2="${svgH - 20}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<text x="${svgW - 15}" y="${oy + 14}" font-size="9" fill="#000">x</text>`;
                svgGraph += `<text x="${ox + 6}" y="25" font-size="9" fill="#000">y</text>`;
                svgGraph += `<text x="${ox - 10}" y="${oy + 12}" font-size="8" fill="#000">0</text>`;

                const axNum = toNumber(xA), ayNum = toNumber(yA);
                const cxNum = toNumber(xC), cyNum = toNumber(yC);
                const bxNum = toNumber(xB), byNum = toNumber(yB);

                // 四角形 OABC の本体
                svgGraph += `<polygon points="${tx(0)},${ty(0)} ${tx(axNum)},${ty(ayNum)} ${tx(bxNum)},${ty(byNum)} ${tx(cxNum)},${ty(cyNum)}" fill="rgba(46, 204, 113, 0.2)" stroke="#27ae60" stroke-width="1.5"/>`;

                // 対角線OB
                svgGraph += `<line x1="${tx(0)}" y1="${ty(0)}" x2="${tx(bxNum)}" y2="${ty(byNum)}" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>`;

                // 点の描画
                svgGraph += `<circle cx="${tx(0)}" cy="${ty(0)}" r="3" fill="#000"/><text x="${ox - 12}" y="${oy + 12}" class="svg-text svg-bold">O</text>`;
                svgGraph += `<circle cx="${tx(axNum)}" cy="${ty(ayNum)}" r="3" fill="#000"/><text x="${tx(axNum) + 5}" y="${ty(ayNum) - 5}" class="svg-text svg-bold">A(${toLaTeX(xA)}, ${toLaTeX(yA)})</text>`;
                svgGraph += `<circle cx="${tx(bxNum)}" cy="${ty(byNum)}" r="3" fill="#000"/><text x="${tx(bxNum) + 5}" y="${ty(byNum) - 5}" class="svg-text svg-bold">B</text>`;
                svgGraph += `<circle cx="${tx(cxNum)}" cy="${ty(cyNum)}" r="3" fill="#000"/><text x="${tx(cxNum) - 15}" y="${ty(cyNum) - 5}" class="svg-text svg-bold">C(${toLaTeX(xC)}, ${toLaTeX(yC)})</text>`;
                
                // 点P
                svgGraph += `<circle cx="${tx(pXVal)}" cy="${ty(pYVal)}" r="3" fill="#e67e22"/><text x="${tx(pXVal) + 6}" y="${ty(pYVal) + 3}" class="svg-text svg-bold" fill="#e67e22">P(${pXVal}, ${pYVal})</text>`;

                svgGraph += `</svg>`;

                const problemText = `座標平面上に点 \\(A(${toLaTeX(xA)}, ${toLaTeX(yA)})\\)、\\(C(${toLaTeX(xC)}, ${toLaTeX(yC)})\\) と四角形 \\(OABC\\) がある。 \\(OABC\\) が${shapeName}であるとき、次の問いに答えなさい。<br>` +
                                    `(1) 点 \\(B\\) の座標を求めなさい。<br>` +
                                    `(2) \\(x\\) 軸上（または \\(y\\) 軸上）の点 \\(P(${pXVal}, ${pYVal})\\) を通って${shapeName} \\(OABC\\) の面積を 2 等分する直線の式を求めなさい。<br>` + svgGraph;

                return {
                    problem: problemText,
                    explanation: `【解説】<br>` +
                                 `(1) <strong>点Bの座標</strong>：<br>` +
                                 `・点 \\(A\\) から点 \\(B\\) までの \\(x\\) 座標・\\(y\\) 座標の増減は、原点 \\(O\\) から点 \\(C\\) までの増減と等しいため、点 \\(B\\) の座標は \\((${toLaTeX(xB)}, ${toLaTeX(yB)})\\) となります。<br><br>` +
                                 `(2) <strong>面積を 2 等分する直線の式</strong>：<br>` +
                                 `・${shapeName}の面積を 2 等分する直線は、<strong>対角線の交点＝中点＝点対称の中心</strong>を通ります。<br>` +
                                 `・対角線 \\(OB\\) の中点 \\(M\\) の座標は \\((${toLaTeX(midX)}, ${toLaTeX(midY)})\\) と求められます。<br>` +
                                 `・したがって、点 \\(P(${pXVal}, ${pYVal})\\) と中点 \\(M\\) の 2 点を通る直線となるため、求める式は <strong>\\(${lineEquation}\\)</strong> となります。`
                };
            }
        },
        "部分等積を用いた図形の変形": {
            level: "公立",
            formula: "座標平面上に四角形OABCと\\(\\triangle COD\\)があり、O、A、Dは一直線上にある。<br>" +
                     "\\(四角形 OABC = \\triangle COD\\) のとき、重なっていない部分や共通の部分に着目する。<br>" +
                     "線分ABと線分CDの交点をPとする。\\(\\triangle BCP = \\triangle ADP\\) なので \\(AC \\parallel BD\\) となる。<br>" +
                     // 【公式欄用SVG】
                     (() => {
                         const svgW = 260, svgH = 220;
                         const ox = 40, oy = 180, scale = 22;
                         
                         const ax = 3, ay = 1.5;
                         const dx = 6, dy = 3;
                         const cx = 2, cy = 5;
                         const bx = 5, by = 6.5;
                         const px = 4, py = 4;
                         
                         const tx = (x) => ox + x * scale;
                         const ty = (y) => oy - y * scale;
                         
                         return `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 260px;">` +
                                `<style>` +
                                `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                                `  .svg-bold { font-weight: bold; }` +
                                `</style>` +
                                `<line x1="20" y1="${oy}" x2="${svgW - 20}" y2="${oy}" stroke="#555" stroke-width="1.2"/>` +
                                `<line x1="${ox}" y1="15" x2="${ox}" y2="${svgH - 20}" stroke="#555" stroke-width="1.2"/>` +
                                `<line x1="${tx(0)}" y1="${ty(0)}" x2="${tx(7)}" y2="${ty(3.5)}" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>` +
                                `<line x1="${tx(cx)}" y1="${ty(cy)}" x2="${tx(ax)}" y2="${ty(ay)}" stroke="#e74c3c" stroke-width="1" stroke-dasharray="3,3"/>` +
                                `<line x1="${tx(dx)}" y1="${ty(dy)}" x2="${tx(bx)}" y2="${ty(by)}" stroke="#e74c3c" stroke-width="1" stroke-dasharray="3,3"/>` +
                                // 四角形OABC（半透明の青色）
                                `<polygon points="${tx(0)},${ty(0)} ${tx(ax)},${ty(ay)} ${tx(bx)},${ty(by)} ${tx(cx)},${ty(cy)}" fill="rgba(41, 128, 185, 0.2)" stroke="#2980b9" stroke-width="1.2"/>` +
                                // △COD（半透明の赤色）
                                `<polygon points="${tx(cx)},${ty(cy)} ${tx(0)},${ty(0)} ${tx(dx)},${ty(dy)}" fill="rgba(217, 83, 79, 0.2)" stroke="#d9534f" stroke-width="1.2"/>` +
                                // △BCP（半透明のオレンジ色）
                                `<polygon points="${tx(bx)},${ty(by)} ${tx(cx)},${ty(cy)} ${tx(px)},${ty(py)}" fill="rgba(230, 126, 34, 0.3)" stroke="#e67e22" stroke-width="1.2"/>` +
                                // △ADP（半透明の緑色）
                                `<polygon points="${tx(ax)},${ty(ay)} ${tx(dx)},${ty(dy)} ${tx(px)},${ty(py)}" fill="rgba(46, 204, 113, 0.3)" stroke="#2ecc71" stroke-width="1.2"/>` +
                                `<line x1="${tx(ax)}" y1="${ty(ay)}" x2="${tx(bx)}" y2="${ty(by)}" stroke="#2980b9" stroke-width="1.2"/>` +
                                `<line x1="${tx(cx)}" y1="${ty(cy)}" x2="${tx(dx)}" y2="${ty(dy)}" stroke="#d9534f" stroke-width="1.2"/>` +
                                `<circle cx="${tx(0)}" cy="${ty(0)}" r="2.5" fill="#000"/><text x="${tx(0)-12}" y="${ty(0)+12}" class="svg-text svg-bold">O</text>` +
                                `<circle cx="${tx(ax)}" cy="${ty(ay)}" r="2.5" fill="#000"/><text x="${tx(ax)+4}" y="${ty(ay)-6}" class="svg-text svg-bold">A</text>` +
                                `<circle cx="${tx(bx)}" cy="${ty(by)}" r="2.5" fill="#000"/><text x="${tx(bx)+4}" y="${ty(by)+4}" class="svg-text svg-bold">B</text>` +
                                `<circle cx="${tx(cx)}" cy="${ty(cy)}" r="2.5" fill="#000"/><text x="${tx(cx)-12}" y="${tx(cx)+4}" class="svg-text svg-bold">C</text>` +
                                `<circle cx="${tx(dx)}" cy="${ty(dy)}" r="2.5" fill="#000"/><text x="${tx(dx)+6}" y="${ty(dy)-4}" class="svg-text svg-bold">D</text>` +
                                `<circle cx="${tx(px)}" cy="${ty(py)}" r="2.5" fill="#27ae60"/><text x="${tx(px)+6}" y="${ty(py)-4}" class="svg-text svg-bold" fill="#27ae60">P</text>` +
                                `</svg>`;
                     })(),
            generateRandom: function() {
                const mOA = Math.floor(Math.random() * 2) + 1; // 1 または 2
                
                // 条件を満たす座標の自動生成
                const cx = 1;
                const bx = cx + Math.floor(Math.random() * 2) + 1; // 2 または 3
                const ax = bx + Math.floor(Math.random() * 2) + 1; // bx + 1 または bx + 2
                
                const ay = mOA * ax;
                const cy = ay + 1;
                const by = cy + 1;

                const pX = Math.floor(Math.random() * (ax - 1)) + 1;
                const ansX = pX;
                const ansY = mOA * ansX;

                const formatFracClean = (num, den) => {
                    const gcd = (p, q) => q === 0 ? p : gcd(q, p % q);
                    const g = Math.abs(gcd(num, den));
                    let nNum = num / g, nDen = den / g;
                    if (nDen === 0) return "0";
                    let isNeg = false;
                    if (nNum < 0) { isNeg = !isNeg; nNum = Math.abs(nNum); }
                    if (nDen < 0) { isNeg = !isNeg; nDen = Math.abs(nDen); }
                    if (nDen === 1) return (isNeg ? `-${nNum}` : `${nNum}`);
                    return (isNeg ? `-\\frac{${nNum}}{${nDen}}` : `\\frac{${nNum}}{${nDen}}`);
                };

                const formatFracVal = (val) => {
                    const num = Math.round(val * 10);
                    const den = 10;
                    return formatFracClean(num, den);
                };

                // 平行線の式を動的に計算
                const mAC_num = cy - ay;
                const mAC_den = cx - ax;
                const gcd = (p, q) => q === 0 ? p : gcd(q, p % q);
                const g_m = Math.abs(gcd(mAC_num, mAC_den));
                const smNum = mAC_num / g_m;
                const smDen = mAC_den / g_m;

                let slopeText = "";
                if (smDen === 1) {
                    slopeText = smNum === 1 ? "" : (smNum === -1 ? "-" : `${smNum}`);
                } else {
                    slopeText = smNum < 0 ? `-\\frac{${Math.abs(smNum)}}{${smDen}}` : `\\frac{${smNum}}{${smDen}}`;
                }

                const b_num = by * smDen - smNum * bx;
                const b_den = smDen;
                const g_b = Math.abs(gcd(b_num, b_den));
                const sbNum = b_num / g_b;
                const sbDen = b_den / g_b;

                let interceptText = "";
                if (sbNum !== 0) {
                    let absNum = Math.abs(sbNum);
                    let fracStr = sbDen === 1 ? `${absNum}` : `\\frac{${absNum}}{${sbDen}}`;
                    interceptText = sbNum > 0 ? ` + ${fracStr}` : ` - ${fracStr}`;
                }
                const parallelLineEquation = `y = ${slopeText}x${interceptText}`;

                const svgW = 300, svgH = 320;
                const ox = 60, oy = 280;
                const scale = 20;

                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 300px;">` +
                               `<style>` +
                               `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                               `  .svg-bold { font-weight: bold; }` +
                               `</style>`;
                
                const axisMinX = 20, axisMaxX = svgW - 20;
                const axisMinY = 20, axisMaxY = svgH - 20;

                svgGraph += `<line x1="${axisMinX}" y1="${oy}" x2="${axisMaxX}" y2="${oy}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<line x1="${ox}" y1="${axisMinY}" x2="${ox}" y2="${axisMaxY}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<text x="${axisMaxX - 10}" y="${oy + 14}" font-size="9" fill="#000">x</text>`;
                svgGraph += `<text x="${ox + 6}" y="${axisMinY + 8}" font-size="9" fill="#000">y</text>`;
                svgGraph += `<text x="${ox - 10}" y="${oy + 12}" font-size="8" fill="#000">0</text>`;

                const xMax = Math.max(ax, by) + 2;
                // 直線OAを描画
                svgGraph += `<line x1="${ox}" y1="${oy}" x2="${tx(xMax)}" y2="${ty(mOA * xMax)}" stroke="#000" stroke-width="1.2"/>`;
                
                // 四角形OABCの描画（色なし、枠線のみ）
                svgGraph += `<polygon points="${ox},${oy} ${tx(ax)},${ty(ay)} ${tx(bx)},${ty(by)} ${tx(cx)},${ty(cy)}" fill="none" stroke="#000" stroke-width="1.2"/>`;
                
                // 点とラベルの追加（O, A, B, C のみ）
                svgGraph += `<circle cx="${ox}" cy="${oy}" r="2" fill="#000"/><text x="${ox - 10}" y="${oy + 12}" class="svg-text svg-bold">O</text>`;
                svgGraph += `<circle cx="${tx(ax)}" cy="${ty(ay)}" r="2.5" fill="#000"/><text x="${tx(ax) + 5}" y="${ty(ay) - 5}" class="svg-text svg-bold">A</text>`;
                svgGraph += `<circle cx="${tx(bx)}" cy="${ty(by)}" r="2.5" fill="#000"/><text x="${tx(bx) + 5}" y="${ty(by) - 5}" class="svg-text svg-bold">B</text>`;
                svgGraph += `<circle cx="${tx(cx)}" cy="${ty(cy)}" r="2.5" fill="#000"/><text x="${tx(cx) - 12}" y="${ty(cy) + 4}" class="svg-text svg-bold">C</text>`;

                svgGraph += `</svg>`;

                const ansStr = formatFracVal(ansX);

                const problemText = `座標平面上に直線 \\(y = ${mOA}x\\) （直線 \\(OA\\)）がある。<br>` +
                                    `点 \\(A(${ax}, ${ay})\\)、\\(B(${bx}, ${by})\\)、\\(C(${cx}, ${cy})\\) とする。<br>` +
                                    `図のように、四角形 \\(OABC\\) があるとき、直線 \\(OA\\) 上に \\(四角形 OABC = \\triangle COP\\) となる点 \\(P\\) をとる。<br>` +
                                    `このとき、点 \\(P\\) の \\(x\\) 座標を求めなさい。ただし、点 \\(P\\) の \\(x\\) 座標は正の数とする。<br>` + svgGraph;

                return {
                    problem: problemText,
                    explanation: `【解説】<br>` +
                                 `1. <strong>ACの傾きを求める</strong>：点 \\(A(${ax}, ${ay})\\)、\\(C(${cx}, ${cy})\\) の座標から、直線 \\(AC\\) の傾きを求めます。<br>` +
                                 `2. <strong>Bを通るACとの平行線の式</strong>：点 \\(B(${bx}, ${by})\\) を通り \\(AC\\) と平行な直線の式は \\(${parallelLineEquation}\\) となります。<br>` +
                                 `3. <strong>交点Pの座標を求める</strong>：その平行線と直線 \\(OA\\) （\\(y = ${mOA}x\\)）との交点として点 \\(P\\) の座標を求めます。<br>` +
                                 `4. <strong>答え</strong>：計算を行うと、点 \\(P\\) の \\(x\\) 座標は <strong>\\(${ansStr}\\)</strong> となります。`
                };
            }
        },
        "折れ線の最短距離(軸上の動点)": {
            level: "公立",
            formula: "<strong>【折れ線の最短距離】</strong><br>" +
                     "・折れ線の最短距離を求める時は，どちらかの点を動点のある軸を対称の軸として対称移動させる。<br>" +
                     `<svg viewBox="0 0 200 170" style="background: #fff; border: 1px solid #ddd; border-radius: 4px; display: block; margin: 8px auto; width: 100%; max-width: 180px;">` +
                     `  <!-- x軸・y軸・原点O -->` +
                     `  <line x1="20" y1="110" x2="180" y2="110" stroke="#333" stroke-width="1.2" />` +
                     `  <text x="175" y="122" font-size="9" fill="#000">x</text>` +
                     `  <line x1="60" y1="20" x2="60" y2="160" stroke="#333" stroke-width="1.2" />` +
                     `  <text x="48" y="28" font-size="9" fill="#000">y</text>` +
                     `  <text x="48" y="122" font-size="9" fill="#000">O</text>` +
                     `  <!-- 対称移動の補助線 (AとA') -->` +
                     `  <line x1="80" y1="50" x2="80" y2="150" stroke="#95a5a6" stroke-width="1" stroke-dasharray="2,2"/>` +
                     `  <!-- A'とBを結ぶ緑色の線分 (最短距離の直線) -->` +
                     `  <line x1="80" y1="150" x2="140" y2="70" stroke="#2ecc71" stroke-width="1.5"/>` +
                     `  <!-- 折れ線 AP + PB のイメージ（実線） -->` +
                     `  <line x1="80" y1="50" x2="117.5" y2="110" stroke="#3498db" stroke-width="1.5"/>` +
                     `  <line x1="117.5" y1="110" x2="140" y2="70" stroke="#3498db" stroke-width="1.5"/>` +
                     `  <!-- 点A, B, A', P -->` +
                     `  <circle cx="80" cy="50" r="3" fill="#e74c3c"/>` +
                     `  <text x="85" y="48" font-size="8" font-weight="bold" fill="#e74c3c">A</text>` +
                     `  <circle cx="140" cy="70" r="3" fill="#3498db"/>` +
                     `  <text x="145" y="68" font-size="8" font-weight="bold" fill="#3498db">B</text>` +
                     `  <circle cx="80" cy="150" r="3" fill="#95a5a6" stroke="#e74c3c" stroke-width="1"/>` +
                     `  <text x="85" y="158" font-size="8" fill="#7f8c8d">A'</text>` +
                     `  <circle cx="117.5" cy="110" r="3" fill="#2ecc71"/>` +
                     `  <text x="122" y="122" font-size="8" font-weight="bold" fill="#2ecc71">P</text>` +
                     `</svg>` +
                     "<strong>【解法の手順】</strong><br>" +
                     "1. <strong>対称移動</strong>：動点がある軸（\\(x\\) 軸や \\(y\\) 軸）を折り目として、片方の点（例: A）を反対側に折り返し、対称点（A'）をとる。<br>" +
                     "2. <strong>直線の利用</strong>：対称点 A' ともう一つの点 B を直線で結ぶ。<br>" +
                     "3. <strong>最短距離・座標の計算</strong>：直線 A'B と軸との交点が P となり、最短距離や交点座標を求める。",
            generateRandom: function() {
                // 有理数（分数）を正確に扱うためのヘルパー関数
                const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
                const createFrac = (n, d = 1) => {
                    if (d < 0) { n = -n; d = -d; }
                    const g = gcd(Math.abs(n), d);
                    return { n: n / g, d: d / g };
                };
                const toLaTeX = (f) => {
                    if (f.d === 1) return `${f.n}`;
                    if (f.n < 0) return `-\\frac{${Math.abs(f.n)}}{${f.d}}`;
                    return `\\frac{${f.n}}{${f.d}}`;
                };

                // ルートを簡単にする関数（例: 45 -> 3\sqrt{5}）
                const simplifySqrt = (val) => {
                    let outside = 1;
                    let inside = val;
                    for (let i = 2; i * i <= inside; i++) {
                        while (inside % (i * i) === 0) {
                            outside *= i;
                            inside /= (i * i);
                        }
                    }
                    if (inside === 1) return `${outside}`;
                    if (outside === 1) return `\\sqrt{${inside}}`;
                    return `${outside}\\sqrt{${inside}}`;
                };

                const formatLinearEquation = (slopeF, intF) => {
                    let sStr = "";
                    if (slopeF.n === 1 && slopeF.d === 1) sStr = "x";
                    else if (slopeF.n === -1 && slopeF.d === 1) sStr = "-x";
                    else if (slopeF.n === 0) sStr = "";
                    else sStr = `${toLaTeX(slopeF)}x`;

                    let iStr = "";
                    if (intF.n > 0) iStr = ` + ${toLaTeX(intF)}`;
                    else if (intF.n < 0) iStr = ` - ${toLaTeX(createFrac(-intF.n, intF.d))}`;

                    if (sStr === "") return intF.n === 0 ? "0" : `${toLaTeX(intF)}`;
                    return `y = ${sStr}${iStr}`;
                };

                // 動く軸の種類をランダムに選択: "xaxis" (x軸), "yaxis" (y軸)
                const axisType = Math.random() < 0.5 ? "xaxis" : "yaxis";
                const axisName = axisType === "xaxis" ? "x軸" : "y軸";

                let xA, yA, xB, yB;
                let validScenarios = [];

                if (axisType === "xaxis") {
                    validScenarios = [
                        { xA: 1, yA: 2, xB: 4, yB: 3, dx: 3, dy: 5, sumSq: 34 },
                        { xA: 2, yA: 1, xB: 5, yB: 4, dx: 3, dy: 5, sumSq: 34 },
                        { xA: 1, yA: 3, xB: 4, yB: 3, dx: 3, dy: 6, sumSq: 45 },
                        { xA: 2, yA: 2, xB: 5, yB: 6, dx: 3, dy: 8, sumSq: 73 }
                    ];
                } else {
                    validScenarios = [
                        { xA: 2, yA: 1, xB: 4, yB: 4, dx: 6, dy: 3, sumSq: 45 },
                        { xA: 3, yA: 2, xB: 5, yB: 5, dx: 8, dy: 3, sumSq: 73 },
                        { xA: 1, yA: 1, xB: 3, yB: 4, dx: 4, dy: 3, sumSq: 25 },
                        { xA: 2, yA: 2, xB: 4, yB: 5, dx: 6, dy: 3, sumSq: 45 }
                    ];
                }

                const s = validScenarios[Math.floor(Math.random() * validScenarios.length)];
                xA = s.xA; yA = s.yA; xB = s.xB; yB = s.yB;
                const distStr = simplifySqrt(s.sumSq);

                // SVGグラフの生成
                const svgW = 320, svgH = 320;
                const ox = 60, oy = 260;
                const scale = 25;

                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 320px;">` +
                               `<style>` +
                               `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                               `  .svg-bold { font-weight: bold; }` +
                               `</style>`;
                
                svgGraph += `<line x1="20" y1="${oy}" x2="${svgW - 20}" y2="${oy}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<line x1="${ox}" y1="20" x2="${ox}" y2="${svgH - 20}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<text x="${svgW - 15}" y="${oy + 14}" font-size="9" fill="#000">x</text>`;
                svgGraph += `<text x="${ox + 6}" y="25" font-size="9" fill="#000">y</text>`;
                svgGraph += `<text x="${ox - 12}" y="${oy + 12}" font-size="8" fill="#000">0</text>`;

                svgGraph += `<circle cx="${tx(xA)}" cy="${ty(yA)}" r="3.5" fill="#e74c3c"/>`;
                svgGraph += `<text x="${tx(xA) + 6}" y="${ty(yA) - 6}" class="svg-text svg-bold" fill="#e74c3c">A(${xA}, ${yA})</text>`;

                svgGraph += `<circle cx="${tx(xB)}" cy="${ty(yB)}" r="3.5" fill="#3498db"/>`;
                svgGraph += `<text x="${tx(xB) + 6}" y="${ty(yB) - 6}" class="svg-text svg-bold" fill="#3498db">B(${xB}, ${yB})</text>`;

                svgGraph += `</svg>`;

                let problemText = `座標平面上に点 \\(A(${xA}, ${yA})\\)、\\(B(${xB}, ${yB})\\) がある。点 \\(P\\) が ${axisName}上を動くとき、次の問いに答えなさい。<br>` +
                                  `(1) \\(AP + PB\\) の最短距離を求めなさい。<br>` +
                                  `(2) \\(AP + PB\\) が最小になるときの点 \\(P\\) の座標を求めなさい。<br>` + svgGraph;

                let explanationText = `【解説】<br>`;

                if (axisType === "xaxis") {
                    const xAp = xA, yAp = -yA;
                    // 直線 A'B の式: 2点 (xA, -yA) と (xB, yB) を通る直線
                    const slopeNum = yB - yAp;
                    const slopeDen = xB - xAp;
                    const m = createFrac(slopeNum, slopeDen);
                    const b = createFrac(yB * m.d - m.n * xB, m.d); // Bを通る条件から切片を計算
                    const lineEq = formatLinearEquation(m, b);
                    // y = 0 のときの x を計算 (mx + b = 0 => x = -b / m)
                    const pxFrac = createFrac(-b.n * m.d, b.d * m.n);

                    explanationText += `1. <strong>対称移動の利用</strong>：<br>` +
                                       `・点 \\(A(${xA}, ${yA})\\) を \\(x\\) 軸について対称移動した点 \\(A'(${xAp}, ${yAp})\\) をとります。<br>` +
                                       `2. <strong>(1) 最短距離の求め方</strong>：<br>` +
                                       `・最短距離は2点 \\(A'(${xAp}, ${yAp})\\)、\\(B(${xB}, ${yB})\\) を結ぶ直線 \\(A'B\\) の長さになります。<br>` +
                                       `・三平方の定理より、\\(\\sqrt{(${s.dx})^2 + (${s.dy})^2} = \\sqrt{${s.sumSq}} = ${distStr}\\) と求められます。<br>` +
                                       `・答え：<strong>\\(${distStr}\\)</strong><br>` +
                                       `3. <strong>(2) 点Pの座標の求め方</strong>：<br>` +
                                       `・2点 \\(A'\\)、\\(B\\) を通る直線の式は <strong>\\(${lineEq}\\)</strong> です。<br>` +
                                       `・この直線と \\(x\\) 軸（\\(y = 0\\)）との交点を求めると、点 \\(P\\) の座標は <strong>\\((${toLaTeX(pxFrac)}, 0)\\)</strong> となります。`;
                } else {
                    const xBp = -xB, yBp = yB;
                    // 直線 AB' の式: 2点 (xA, yA) と (-xB, yB) を通る直線
                    const slopeNum = yBp - yA;
                    const slopeDen = xBp - xA;
                    const m = createFrac(slopeNum, slopeDen);
                    const b = createFrac(yA * m.d - m.n * xA, m.d);
                    const lineEq = formatLinearEquation(m, b);
                    const pyFrac = b; // x = 0 のときの y は y切片 b そのもの

                    explanationText += `1. <strong>対称移動の利用</strong>：<br>` +
                                       `・点 \\(B(${xB}, ${yB})\\) を \\(y\\) 軸について対称移動した点 \\(B'(${xBp}, ${yBp})\\) をとります。<br>` +
                                       `2. <strong>(1) 最短距離の求め方</strong>：<br>` +
                                       `・最短距離は2点 \\(A(${xA}, ${yA})\\)、\\(B'(${xBp}, ${yBp})\\) を結ぶ直線 \\(AB'\\) の長さになります。<br>` +
                                       `・三平方の定理より、\\(\\sqrt{(${s.dx})^2 + (${s.dy})^2} = \\sqrt{${s.sumSq}} = ${distStr}\\) と求められます。<br>` +
                                       `・答え：<strong>\\(${distStr}\\)</strong><br>` +
                                       `3. <strong>(2) 点Pの座標の求め方</strong>：<br>` +
                                       `・2点 \\(A\\)、\\(B'\\) を通る直線の式は <strong>\\(${lineEq}\\)</strong> です。<br>` +
                                       `・この直線の \\(y\\) 切片が点 \\(P\\) の \\(y\\) 座標になるため、点 \\(P\\) の座標は <strong>\\((0, ${toLaTeX(pyFrac)})\\)</strong> となります。`;
                }

                return {
                    problem: problemText,
                    explanation: explanationText
                };
            }
        },
           "折れ線の最短距離(軸ではない動点)": {
            level: "公立",
            formula: "<strong>【折れ線の最短距離（軸ではない直線上の動点）】</strong><br>" +
                     "・動点が \\(x\\) 軸や \\(y\\) 軸上ではなく、直線 \\(y = x\\) などの上を動く場合も、片方の点をその直線について対称移動させて考える。<br>" +
                     "・軸上ではない点の対称移動は原点と垂線を結んだ直角三角形を対称移動させよう。<br>" +
                     `<svg viewBox="0 0 200 200" style="background: #fff; border: 1px solid #ddd; border-radius: 4px; display: block; margin: 8px auto; width: 100%; max-width: 180px;">` +
                     `  <!-- 座標設定: O(60, 150), 1目盛=18px -->` +
                     `  <!-- B(1,5), (0,5), (0,0) を頂点にもつ直角三角形（薄い青） -->` +
                     `  <polygon points="78,60 60,60 60,150" fill="rgba(52, 152, 219, 0.15)" stroke="#3498db" stroke-width="1" stroke-dasharray="2,2"/>` +
                     `  <!-- B'(5,1), (5,0), (0,0) を頂点にもつ直角三角形（薄い赤） -->` +
                     `  <polygon points="150,132 150,150 60,150" fill="rgba(231, 76, 60, 0.15)" stroke="#e74c3c" stroke-width="1" stroke-dasharray="2,2"/>` +
                     `  <!-- x軸・y軸・原点O -->` +
                     `  <line x1="15" y1="150" x2="185" y2="150" stroke="#333" stroke-width="1.2" />` +
                     `  <text x="180" y="162" font-size="9" fill="#000">x</text>` +
                     `  <line x1="60" y1="15" x2="60" y2="185" stroke="#333" stroke-width="1.2" />` +
                     `  <text x="48" y="22" font-size="9" fill="#000">y</text>` +
                     `  <text x="48" y="162" font-size="9" fill="#000">O</text>` +
                     `  <!-- 直線y=x -->` +
                     `  <line x1="24" y1="186" x2="186" y2="24" stroke="#999" stroke-width="1" stroke-dasharray="2,2" />` +
                     `  <text x="170" y="24" font-size="8" fill="#666">y=x</text>` +
                     `  <!-- 補助線：B(1,5)とB'(5,1)を結ぶ線分（対称軸y=xに垂直） -->` +
                     `  <line x1="78" y1="60" x2="150" y2="132" stroke="#7f8c8d" stroke-width="1" stroke-dasharray="2,2"/>` +
                     `  <!-- 補助線：直線 AB'（破線） -->` +
                     `  <line x1="42" y1="96" x2="150" y2="132" stroke="#e74c3c" stroke-width="1.2" stroke-dasharray="3,3"/>` +
                     `  <!-- 折れ線 AP + PB（実線）: P(2, 2) => (96, 114) -->` +
                     `  <line x1="42" y1="96" x2="96" y2="114" stroke="#2ecc71" stroke-width="1.5"/>` +
                     `  <line x1="96" y1="114" x2="78" y2="60" stroke="#2ecc71" stroke-width="1.5"/>` +
                     `  <!-- 点 A(-1,3) => (42, 96) -->` +
                     `  <circle cx="42" cy="96" r="3" fill="#e74c3c"/>` +
                     `  <text x="22" y="94" font-size="8" font-weight="bold" fill="#e74c3c">A(-1,3)</text>` +
                     `  <!-- 点 B(1,5) => (78, 60) -->` +
                     `  <circle cx="78" cy="60" r="3" fill="#3498db"/>` +
                     `  <text x="78" y="52" font-size="8" font-weight="bold" fill="#3498db">B(1,5)</text>` +
                     `  <!-- 点 B'(5,1) => (150, 132) -->` +
                     `  <circle cx="150" cy="132" r="3" fill="#95a5a6" stroke="#e74c3c" stroke-width="1"/>` +
                     `  <text x="154" y="142" font-size="8" fill="#7f8c8d">B'(5,1)</text>` +
                     `  <!-- 交点 P(2,2) => (96, 114) -->` +
                     `  <circle cx="96" cy="114" r="3" fill="#2ecc71"/>` +
                     `  <text x="100" y="122" font-size="8" font-weight="bold" fill="#2ecc71">P</text>` +
                     `</svg>` +
                     "<strong>【解法の手順】</strong><br>" +
                     "1. <strong>対称移動</strong>：動点がある直線（\\(y = x\\) など）を軸にして、片方の点（例: B）を反対側に対称移動させる（点 \\(B'\\) をとる）。<br>" +
                     "2. <strong>直線の利用</strong>：対称点 \\(B'\\) ともう一つの点 \\(A\\) を直線で結ぶ。<br>" +
                     "3. <strong>最短距離・座標の計算</strong>：直線 \\(AB'\\) と直線 \\(y = x\\) との交点が \\(P\\) となり、最短距離や交点座標を求める。",
            generateRandom: function() {
                // 有理数（分数）を正確に扱うためのヘルパー関数
                const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
                const createFrac = (n, d = 1) => {
                    if (d < 0) { n = -n; d = -d; }
                    const g = gcd(Math.abs(n), d);
                    return { n: n / g, d: d / g };
                };
                const toLaTeX = (f) => {
                    if (f.d === 1) return `${f.n}`;
                    if (f.n < 0) return `-\\frac{${Math.abs(f.n)}}{${f.d}}`;
                    return `\\frac{${f.n}}{${f.d}}`;
                };

                const simplifySqrt = (val) => {
                    let outside = 1;
                    let inside = val;
                    for (let i = 2; i * i <= inside; i++) {
                        while (inside % (i * i) === 0) {
                            outside *= i;
                            inside /= (i * i);
                        }
                    }
                    if (inside === 1) return `${outside}`;
                    if (outside === 1) return `\\sqrt{${inside}}`;
                    return `${outside}\\sqrt{${inside}}`;
                };

                const formatLinearEquation = (slopeF, intF) => {
                    let sStr = "";
                    if (slopeF.n === 1 && slopeF.d === 1) sStr = "x";
                    else if (slopeF.n === -1 && slopeF.d === 1) sStr = "-x";
                    else if (slopeF.n === 0) sStr = "";
                    else sStr = `${toLaTeX(slopeF)}x`;

                    let iStr = "";
                    if (intF.n > 0) iStr = ` + ${toLaTeX(intF)}`;
                    else if (intF.n < 0) iStr = ` - ${toLaTeX(createFrac(-intF.n, intF.d))}`;

                    if (sStr === "") return intF.n === 0 ? "0" : `${toLaTeX(intF)}`;
                    return `y = ${sStr}${iStr}`;
                };

                // シナリオのバリエーション
                const scenarios = [
                    { xA: -1, yA: 3, xB: 1, yB: 5, xBp: 5, yBp: 1, dx: 6, dy: 2, sumSq: 40, px: createFrac(2, 1), py: createFrac(2, 1) },
                    { xA: -2, yA: 2, xB: 2, yB: 6, xBp: 6, yBp: 2, dx: 8, dy: 0, sumSq: 64, px: createFrac(4, 1), py: createFrac(4, 1) },
                    { xA: -1, yA: 4, xB: 2, yB: 5, xBp: 5, yBp: 2, dx: 6, dy: 2, sumSq: 40, px: createFrac(7, 2), py: createFrac(7, 2) }
                ];
                const s = scenarios[Math.floor(Math.random() * scenarios.length)];
                const xA = s.xA, yA = s.yA, xB = s.xB, yB = s.yB;
                const xBp = s.xBp, yBp = s.yBp;
                const distStr = simplifySqrt(s.sumSq);

                // 直線 AB' の式を計算: 2点 (xA, yA) と (xBp, yBp)
                const slopeNum = yBp - yA;
                const slopeDen = xBp - xA;
                const m = createFrac(slopeNum, slopeDen);
                const b = createFrac(yA * m.d - m.n * xA, m.d);
                const lineEq = formatLinearEquation(m, b);

                // SVGグラフの生成
                const svgW = 320, svgH = 320;
                const ox = 120, oy = 200;
                const scale = 25;

                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 320px;">` +
                               `<style>` +
                               `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                               `  .svg-bold { font-weight: bold; }` +
                               `</style>`;
                
                svgGraph += `<line x1="20" y1="${oy}" x2="${svgW - 20}" y2="${oy}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<line x1="${ox}" y1="20" x2="${ox}" y2="${svgH - 20}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<text x="${svgW - 15}" y="${oy + 14}" font-size="9" fill="#000">x</text>`;
                svgGraph += `<text x="${ox + 6}" y="25" font-size="9" fill="#000">y</text>`;
                svgGraph += `<text x="${ox - 12}" y="${oy + 12}" font-size="8" fill="#000">0</text>`;

                // 直線 y = x
                svgGraph += `<line x1="${tx(-4)}" y1="${ty(-4)}" x2="${tx(6)}" y2="${ty(6)}" stroke="#999" stroke-width="1" stroke-dasharray="3,3" />`;

                svgGraph += `<circle cx="${tx(xA)}" cy="${ty(yA)}" r="3.5" fill="#e74c3c"/>`;
                svgGraph += `<text x="${tx(xA) + 6}" y="${ty(yA) - 6}" class="svg-text svg-bold" fill="#e74c3c">A(${xA}, ${yA})</text>`;

                svgGraph += `<circle cx="${tx(xB)}" cy="${ty(yB)}" r="3.5" fill="#3498db"/>`;
                svgGraph += `<text x="${tx(xB) + 6}" y="${ty(yB) - 6}" class="svg-text svg-bold" fill="#3498db">B(${xB}, ${yB})</text>`;

                svgGraph += `</svg>`;

                let problemText = `座標平面上に点 \\(A(${xA}, ${yA})\\)、\\(B(${xB}, ${yB})\\) がある。点 \\(P\\) が直線 \\(y = x\\) 上を動くとき、次の問いに答えなさい。<br>` +
                                  `(1) \\(AP + PB\\) の最短距離を求めなさい。<br>` +
                                  `(2) \\(AP + PB\\) が最小になるときの点 \\(P\\) の座標を求めなさい。<br>` + svgGraph;

                let explanationText = `【解説】<br>` +
                                      `1. <strong>対称移動の利用</strong>：<br>` +
                                      `・点 \\(B(${xB}, ${yB})\\) を直線 \\(y = x\\) について対称移動した点 \\(B'(${xBp}, ${yBp})\\) をとります。<br>` +
                                      `2. <strong>(1) 最短距離の求め方</strong>：<br>` +
                                      `・最短距離は2点 \\(A(${xA}, ${yA})\\)、\\(B'(${xBp}, ${yBp})\\) を結ぶ直線 \\(AB'\\) の長さになります。<br>` +
                                      `・三平方の定理より、\\(\\sqrt{(${s.dx})^2 + (${s.dy})^2} = \\sqrt{${s.sumSq}} = ${distStr}\\) と求められます。<br>` +
                                      `・答え：<strong>\\(${distStr}\\)</strong><br>` +
                                      `3. <strong>(2) 点Pの座標の求め方</strong>：<br>` +
                                      `・2点 \\(A\\)、\\(B'\\) を通る直線の式は <strong>\\(${lineEq}\\)</strong> です。<br>` +
                                      `・この直線と直線 \\(y = x\\) との交点を連立して求めると、点 \\(P\\) の座標は <strong>\\((${toLaTeX(s.px)}, ${toLaTeX(s.py)})\\)</strong> となります。`;

                return {
                    problem: problemText,
                    explanation: explanationText
                };
            }
        },
         "グラフ上の回転体(軸上)": {
            level: "公立",
            formula: "<strong>【グラフ上の回転体】</strong><br>" +
                     "・グラフ上の回転体は軸上の長さを高さとする。<br>" +
                     `<svg viewBox="0 0 200 200" style="background: #fff; border: 1px solid #ddd; border-radius: 4px; display: block; margin: 8px auto; width: 100%; max-width: 180px;">` +
                     `  <!-- 3D風回転体の立体表現（上下の円錐の組み合わせ） -->` +
                     `  <!-- 上側の円錐（CからBを通る回転体） -->` +
                     `  <path d="M 100,82.5 L 55,48.75 A 45,15 0 0,1 145,48.75 Z" fill="rgba(52, 152, 219, 0.2)" stroke="#3498db" stroke-width="1"/>` +
                     `  <!-- 下側の円錐（OからC、半径が点Bを通るように補正） -->` +
                     `  <path d="M 100,150 L 55,48.75 A 45,15 0 0,0 145,48.75 Z" fill="rgba(46, 204, 113, 0.2)" stroke="#2ecc71" stroke-width="1"/>` +
                     `  <!-- 点Bを通る切り口の楕円 -->` +
                     `  <ellipse cx="100" cy="48.75" rx="45" ry="15" fill="none" stroke="#e74c3c" stroke-width="1.2" stroke-dasharray="2,2"/>` +
                     `  <!-- x軸・y軸・原点O -->` +
                     `  <line x1="20" y1="150" x2="180" y2="150" stroke="#333" stroke-width="1.2" />` +
                     `  <text x="175" y="162" font-size="9" fill="#000">x</text>` +
                     `  <line x1="100" y1="15" x2="100" y2="180" stroke="#333" stroke-width="1.2" />` +
                     `  <text x="88" y="25" font-size="9" fill="#000">y</text>` +
                     `  <text x="88" y="162" font-size="8" fill="#000">O(0,0)</text>` +
                     `  <!-- 直線AB: A(-2,4)=>(70,105), B(3,9)=>(145,48.75), C(0,6)=>(100,82.5) -->` +
                     `  <line x1="70" y1="105" x2="145" y2="48.75" stroke="#9b59b6" stroke-width="1.5"/>` +
                     `  <!-- 点A, B, C -->` +
                     `  <circle cx="70" cy="105" r="3" fill="#e74c3c"/>` +
                     `  <text x="35" y="107" font-size="8" font-weight="bold" fill="#e74c3c">A(-2,4)</text>` +
                     `  <circle cx="145" cy="48.75" r="3" fill="#3498db"/>` +
                     `  <text x="150" y="46" font-size="8" font-weight="bold" fill="#3498db">B(3,9)</text>` +
                     `  <circle cx="100" cy="82.5" r="3" fill="#2ecc71"/>` +
                     `  <text x="105" y="80" font-size="8" font-weight="bold" fill="#2ecc71">C(0,6)</text>` +
                     `</svg>` +
                     "<strong>【解法の手順】</strong><br>" +
                     "1. <strong>交点Cの求め方</strong>：放物線上の2点 \\(A\\)、\\(B\\) を通る直線の式を求め、\\(y\\) 軸との交点 \\(C\\)（\\(y\\) 切片）を求める。<br>" +
                     "2. <strong>回転体の体積</strong>：線分 \\(OC\\) の長さを高さとして捉え、点 \\(B\\) の \\(x\\) 座標を半径とする円錐の組み合わせとして体積を計算する。",
            generateRandom: function() {
                // 放物線の比例定数 a、点A・Bの座標、交点Cのy座標、体積のバリエーション
                const scenarios = [
                    { 
                        a: "1", aNum: 1, xA: -2, yA: 4, xB: 3, yB: 9, 
                        cY: 6, 
                        volText: "18\\pi", 
                        calcSteps: "\\frac{1}{3} \\times \\pi \\times 3^2 \\times 6 = 18\\pi"
                    },
                    { 
                        a: "1", aNum: 1, xA: -3, yA: 9, xB: 2, yB: 4, 
                        cY: 6, 
                        volText: "8\\pi", 
                        calcSteps: "\\frac{1}{3} \\times \\pi \\times 2^2 \\times 6 = 8\\pi"
                    },
                    { 
                        a: "\\frac{1}{2}", aNum: 0.5, xA: -2, yA: 2, xB: 4, yB: 8, 
                        cY: 4, 
                        volText: "\\frac{64}{3}\\pi", 
                        calcSteps: "\\frac{1}{3} \\times \\pi \\times 4^2 \\times 4 = \\frac{64}{3}\\pi"
                    },
                    { 
                        a: "\\frac{1}{2}", aNum: 0.5, xA: -4, yA: 8, xB: 2, yB: 2, 
                        cY: 4, 
                        volText: "\\frac{16}{3}\\pi", 
                        calcSteps: "\\frac{1}{3} \\times \\pi \\times 2^2 \\times 4 = \\frac{16}{3}\\pi"
                    },
                    { 
                        a: "2", aNum: 2, xA: -1, yA: 2, xB: 2, yB: 8, 
                        cY: 4, 
                        volText: "\\frac{32}{3}\\pi", 
                        calcSteps: "\\frac{1}{3} \\times \\pi \\times 2^2 \\times 4 = \\frac{32}{3}\\pi"
                    }
                ];
                const s = scenarios[Math.floor(Math.random() * scenarios.length)];

                // SVGグラフの描画パラメータ
                const svgW = 320, svgH = 320;
                const ox = 160, oy = 250;
                const scale = 18;

                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 320px;">` +
                               `<style>` +
                               `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                               `  .svg-bold { font-weight: bold; }` +
                               `</style>`;
                
                // 軸の描画
                svgGraph += `<line x1="20" y1="${oy}" x2="${svgW - 20}" y2="${oy}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<line x1="${ox}" y1="20" x2="${ox}" y2="${svgH - 20}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<text x="${svgW - 15}" y="${oy + 14}" font-size="9" fill="#000">x</text>`;
                svgGraph += `<text x="${ox + 6}" y="25" font-size="9" fill="#000">y</text>`;
                svgGraph += `<text x="${ox - 16}" y="${oy + 12}" font-size="8" fill="#000">O(0,0)</text>`;

                // 正確な放物線 y = a*x^2 のプロット
                let pathD = "";
                for (let px = -6; px <= 6; px += 0.1) {
                    let py = s.aNum * px * px;
                    if (py <= 12) {
                        pathD += (pathD === "" ? "M " : "L ") + `${tx(px)},${ty(py)} `;
                    }
                }
                svgGraph += `<path d="${pathD}" fill="none" stroke="#e67e22" stroke-width="1.5"/>`;

                // 直線AB
                svgGraph += `<line x1="${tx(s.xA)}" y1="${ty(s.yA)}" x2="${tx(s.xB)}" y2="${ty(s.yB)}" stroke="#9b59b6" stroke-width="1.5"/>`;

                // 点A, B
                svgGraph += `<circle cx="${tx(s.xA)}" cy="${ty(s.yA)}" r="3.5" fill="#e74c3c"/>`;
                svgGraph += `<text x="${tx(s.xA) - 30}" y="${ty(s.yA) + 4}" class="svg-text svg-bold" fill="#e74c3c">A(${s.xA}, ${s.yA})</text>`;

                svgGraph += `<circle cx="${tx(s.xB)}" cy="${ty(s.yB)}" r="3.5" fill="#3498db"/>`;
                svgGraph += `<text x="${tx(s.xB) + 6}" y="${ty(s.yB) - 4}" class="svg-text svg-bold" fill="#3498db">B(${s.xB}, ${s.yB})</text>`;

                svgGraph += `</svg>`;

                // 式の文字列作成（a=1の時は y = x^2）
                let eqStr = s.a === "1" ? "y = x^2" : `y = ${s.a}x^2`;

                let problemText = `放物線 \\(${eqStr}\\) 上に2点 \\(A(${s.xA}, ${s.yA})\\)、\\(B(${s.xB}, ${s.yB})\\) がある。直線 \\(AB\\) と \\(y\\) 軸との交点を \\(C\\) とするとき、三角形 \\(OBC\\) を \\(y\\) 軸を軸に1回転させてできる立体の体積を求めなさい。<br>` + svgGraph;

                let explanationText = `【解説】<br>` +
                                      `1. <strong>直線ABの式と交点Cの座標</strong>：<br>` +
                                      `・2点 \\(A(${s.xA}, ${s.yA})\\)、\\(B(${s.xB}, ${s.yB})\\) を通る直線の式を求めると、\\(y\\) 軸との交点 \\(C\\) の座標は \\((0, ${s.cY})\\) となります。<br>` +
                                      `2. <strong>回転体の体積の計算</strong>：<br>` +
                                      `・三角形 \\(OBC\\) を \\(y\\) 軸を中心に回転させると、回転軸上の線分 \\(OC = ${s.cY}\\) を高さとし、点 \\(B\\) の \\(x\\) 座標の絶対値 \\(${Math.abs(s.xB)}\\) を底面の半径とする円錐ができます。<br>` +
                                      `・体積 \\(V\\) を求める計算式は以下のようになります：<br>` +
                                      `\\[ V = ${s.calcSteps} \\]<br>` +
                                      `・したがって、体積は <strong>\\(${s.volText}\\)</strong> となります。`;

                return {
                    problem: problemText,
                    explanation: explanationText
                };
            }
        },
        "グラフ上の回転体(ナナメ)": {
            level: "公立",
            formula: "<strong>【グラフ上の回転体（ナナメの軸）】</strong><br>" +
                     "・グラフ上のナナメの回転体は、回転の軸（直線 \\(AB\\)）と半径が垂直であることを利用しよう。<br>" +
                     "・半径 \\(r\\) は、<strong>原点 \\(O\\) から直線 \\(AB\\) に下ろした垂線の長さ（線分 \\(OH\\)）</strong>となります。<br>" +
                     "・回転体は、\\(H\\) を底面の中心、\\(OH\\) を半径とし、\\(A, B\\) を頂点とする<strong>2つの円錐を合わせた形</strong>になります。<br>" +
                     `<svg viewBox="0 0 200 180" style="background: #fff; border: 1px solid #ddd; border-radius: 4px; display: block; margin: 8px auto; width: 100%; max-width: 180px;">` +
                     `  <!-- 回転体の立体イメージ（円錐の側面） -->` +
                     `  <polygon points="60,80 68,36 180,20" fill="rgba(155, 89, 182, 0.1)" stroke="none"/>` +
                     `  <polygon points="60,80 100,100 180,20" fill="rgba(46, 204, 113, 0.15)" stroke="none"/>` +
                     `  <!-- 回転軌道（楕円） -->` +
                     `  <ellipse cx="84" cy="68" rx="12" ry="34" fill="none" stroke="#e74c3c" stroke-width="1.2" stroke-dasharray="2,2" transform="rotate(-26.5, 84, 68)"/>` +
                     `  <!-- 回転による反対側の点 O' -->` +
                     `  <circle cx="68" cy="36" r="2.5" fill="#aaa"/>` +
                     `  <text x="56" y="32" font-size="8" fill="#aaa">O'</text>` +
                     `  <line x1="84" y1="68" x2="68" y2="36" stroke="#aaa" stroke-width="1" stroke-dasharray="2,2"/>` +
                     `  <!-- 直線AB（回転軸） -->` +
                     `  <line x1="40" y1="90" x2="200" y2="10" stroke="#9b59b6" stroke-width="1.5"/>` +
                     `  <!-- 三角形OABの辺 -->` +
                     `  <line x1="60" y1="80" x2="100" y2="100" stroke="#2ecc71" stroke-width="1.2"/>` +
                     `  <line x1="180" y1="20" x2="100" y2="100" stroke="#2ecc71" stroke-width="1.2"/>` +
                     `  <!-- 垂直な半径OH -->` +
                     `  <line x1="100" y1="100" x2="84" y2="68" stroke="#e74c3c" stroke-width="1.5"/>` +
                     `  <circle cx="84" cy="68" r="3" fill="#e74c3c"/>` +
                     `  <text x="90" y="65" font-size="8" fill="#e74c3c" font-weight="bold">H</text>` +
                     `  <!-- 点O, A, B -->` +
                     `  <circle cx="100" cy="100" r="3" fill="#333"/>` +
                     `  <text x="105" y="112" font-size="9" fill="#000" font-weight="bold">O</text>` +
                     `  <circle cx="60" cy="80" r="3" fill="#e74c3c"/>` +
                     `  <text x="45" y="82" font-size="8" fill="#e74c3c" font-weight="bold">A</text>` +
                     `  <circle cx="180" cy="20" r="3" fill="#3498db"/>` +
                     `  <text x="160" y="15" font-size="8" fill="#3498db" font-weight="bold">B</text>` +
                     `</svg>`,
            generateRandom: function() {
                const scenarios = [
                    // --- 整数・基本のシナリオ ---
                    {
                        eqDisplay: "y = x^2",
                        xA: -1, yA: 1, xB: 2, yB: 4, aNum: 1,
                        lineEq: "y = x + 2", cY: 2, dx: 3, dy: 3,
                        abLenTeX: "3\\sqrt{2}", areaTeX: "3", radiusTeX: "\\sqrt{2}", volTeX: "2\\sqrt{2}\\pi",
                        abSlope: "1", perpSlope: "-1", ohEq: "y = -x", hCoord: "(-1, 1)"
                    },
                    {
                        eqDisplay: "y = x^2",
                        xA: -2, yA: 4, xB: 1, yB: 1, aNum: 1,
                        lineEq: "y = -x + 2", cY: 2, dx: 3, dy: -3,
                        abLenTeX: "3\\sqrt{2}", areaTeX: "3", radiusTeX: "\\sqrt{2}", volTeX: "2\\sqrt{2}\\pi",
                        abSlope: "-1", perpSlope: "1", ohEq: "y = x", hCoord: "(1, 1)"
                    },
                    {
                        eqDisplay: "y = x^2",
                        xA: -2, yA: 4, xB: 3, yB: 9, aNum: 1,
                        lineEq: "y = x + 6", cY: 6, dx: 5, dy: 5,
                        abLenTeX: "5\\sqrt{2}", areaTeX: "15", radiusTeX: "3\\sqrt{2}", volTeX: "30\\sqrt{2}\\pi",
                        abSlope: "1", perpSlope: "-1", ohEq: "y = -x", hCoord: "(-3, 3)"
                    },
                    {
                        eqDisplay: "y = 2x^2",
                        xA: -1, yA: 2, xB: 2, yB: 8, aNum: 2,
                        lineEq: "y = 2x + 4", cY: 4, dx: 3, dy: 6,
                        abLenTeX: "3\\sqrt{5}", areaTeX: "6", radiusTeX: "\\frac{4\\sqrt{5}}{5}", volTeX: "\\frac{16\\sqrt{5}}{5}\\pi",
                        abSlope: "2", perpSlope: "-\\frac{1}{2}", ohEq: "y = -\\frac{1}{2}x", hCoord: "\\left(-\\frac{8}{5}, \\frac{4}{5}\\right)"
                    },

                    // --- 分数・小数のシナリオ（正） ---
                    {
                        eqDisplay: "y = \\frac{1}{2}x^2",
                        xA: -2, yA: 2, xB: 4, yB: 8, aNum: 0.5,
                        lineEq: "y = x + 4", cY: 4, dx: 6, dy: 6,
                        abLenTeX: "6\\sqrt{2}", areaTeX: "12", radiusTeX: "2\\sqrt{2}", volTeX: "16\\sqrt{2}\\pi",
                        abSlope: "1", perpSlope: "-1", ohEq: "y = -x", hCoord: "(-2, 2)"
                    },
                    {
                        eqDisplay: "y = \\frac{1}{4}x^2",
                        xA: -2, yA: 1, xB: 4, yB: 4, aNum: 0.25,
                        lineEq: "y = \\frac{1}{2}x + 2", cY: 2, dx: 6, dy: 3,
                        abLenTeX: "3\\sqrt{5}", areaTeX: "6", radiusTeX: "\\frac{4\\sqrt{5}}{5}", volTeX: "\\frac{16\\sqrt{5}}{5}\\pi",
                        abSlope: "\\frac{1}{2}", perpSlope: "-2", ohEq: "y = -2x", hCoord: "\\left(-\\frac{8}{5}, \\frac{16}{5}\\right)"
                    },
                    {
                        eqDisplay: "y = \\frac{1}{3}x^2",
                        xA: -3, yA: 3, xB: 6, yB: 12, aNum: 1/3,
                        lineEq: "y = x + 6", cY: 6, dx: 9, dy: 9,
                        abLenTeX: "9\\sqrt{2}", areaTeX: "27", radiusTeX: "3\\sqrt{2}", volTeX: "54\\sqrt{2}\\pi",
                        abSlope: "1", perpSlope: "-1", ohEq: "y = -x", hCoord: "(-3, 3)"
                    },
                    {
                        eqDisplay: "y = \\frac{2}{3}x^2",
                        xA: -3, yA: 6, xB: 3, yB: 6, aNum: 2/3,
                        lineEq: "y = 6", cY: 6, dx: 6, dy: 0,
                        abLenTeX: "6", areaTeX: "9", radiusTeX: "3", volTeX: "18\\pi",
                        abSlope: "0", perpSlope: "\\text{undefined}", ohEq: "x = 0", hCoord: "(0, 6)"
                    },
                    {
                        eqDisplay: "y = \\frac{3}{4}x^2",
                        xA: -2, yA: 3, xB: 4, yB: 12, aNum: 0.75,
                        lineEq: "y = \\frac{3}{2}x + 6", cY: 6, dx: 6, dy: 9,
                        abLenTeX: "3\\sqrt{13}", areaTeX: "18", radiusTeX: "\\frac{12\\sqrt{13}}{13}", volTeX: "\\frac{144\\sqrt{13}}{39}\\pi",
                        abSlope: "\\frac{3}{2}", perpSlope: "-\\frac{2}{3}", ohEq: "y = -\\frac{2}{3}x", hCoord: "\\left(-\\frac{36}{13}, \\frac{24}{13}\\right)"
                    },

                    // --- 負の数（上に凸：a < 0）のシナリオ（新しく −1/4, −1/3, −2/3, −3/4 を追加） ---
                    {
                        eqDisplay: "y = -x^2",
                        xA: -2, yA: -4, xB: 1, yB: -1, aNum: -1,
                        lineEq: "y = x - 2", cY: -2, dx: 3, dy: 3,
                        abLenTeX: "3\\sqrt{2}", areaTeX: "3", radiusTeX: "\\sqrt{2}", volTeX: "2\\sqrt{2}\\pi",
                        abSlope: "1", perpSlope: "-1", ohEq: "y = -x", hCoord: "(1, -1)"
                    },
                    {
                        eqDisplay: "y = -\\frac{1}{2}x^2",
                        xA: -4, yA: -8, xB: 2, yB: -2, aNum: -0.5,
                        lineEq: "y = x - 4", cY: -4, dx: 6, dy: 6,
                        abLenTeX: "6\\sqrt{2}", areaTeX: "12", radiusTeX: "2\\sqrt{2}", volTeX: "16\\sqrt{2}\\pi",
                        abSlope: "1", perpSlope: "-1", ohEq: "y = -x", hCoord: "(2, -2)"
                    },
                    {
                        eqDisplay: "y = -\\frac{1}{4}x^2",
                        xA: -4, yA: -4, xB: 2, yB: -1, aNum: -0.25,
                        lineEq: "y = \\frac{1}{2}x - 2", cY: -2, dx: 6, dy: 3,
                        abLenTeX: "3\\sqrt{5}", areaTeX: "6", radiusTeX: "\\frac{4\\sqrt{5}}{5}", volTeX: "\\frac{16\\sqrt{5}}{5}\\pi",
                        abSlope: "\\frac{1}{2}", perpSlope: "-2", ohEq: "y = -2x", hCoord: "\\left(\\frac{8}{5}, -\\frac{16}{5}\\right)"
                    },
                    {
                        eqDisplay: "y = -\\frac{1}{3}x^2",
                        xA: -3, yA: -3, xB: 6, yB: -12, aNum: -1/3,
                        lineEq: "y = -x - 6", cY: -6, dx: 9, dy: -9,
                        abLenTeX: "9\\sqrt{2}", areaTeX: "27", radiusTeX: "3\\sqrt{2}", volTeX: "54\\sqrt{2}\\pi",
                        abSlope: "-1", perpSlope: "1", ohEq: "y = x", hCoord: "(3, -3)"
                    },
                    {
                        eqDisplay: "y = -\\frac{2}{3}x^2",
                        xA: -3, yA: -6, xB: 3, yB: -6, aNum: -2/3,
                        lineEq: "y = -6", cY: -6, dx: 6, dy: 0,
                        abLenTeX: "6", areaTeX: "9", radiusTeX: "3", volTeX: "18\\pi",
                        abSlope: "0", perpSlope: "\\text{undefined}", ohEq: "x = 0", hCoord: "(0, -6)"
                    },
                    {
                        eqDisplay: "y = -\\frac{3}{4}x^2",
                        xA: -4, yA: -12, xB: 2, yB: -3, aNum: -0.75,
                        lineEq: "y = -\\frac{3}{2}x - 6", cY: -6, dx: 6, dy: 9,
                        abLenTeX: "3\\sqrt{13}", areaTeX: "18", radiusTeX: "\\frac{12\\sqrt{13}}{13}", volTeX: "\\frac{144\\sqrt{13}}{39}\\pi",
                        abSlope: "-\\frac{3}{2}", perpSlope: "\\frac{2}{3}", ohEq: "y = \\frac{2}{3}x", hCoord: "\\left(\\frac{36}{13}, -\\frac{24}{13}\\right)"
                    }
                ];
                const s = scenarios[Math.floor(Math.random() * scenarios.length)];

                const svgW = 320, svgH = 320;
                const ox = 160, oy = 160;
                const scale = 20;

                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 320px;">` +
                               `<style>` +
                               `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                               `  .svg-bold { font-weight: bold; }` +
                               `</style>`;
                
                // 座標軸
                svgGraph += `<line x1="20" y1="${oy}" x2="${svgW - 20}" y2="${oy}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<line x1="${ox}" y1="20" x2="${ox}" y2="${svgH - 20}" stroke="#333" stroke-width="1.2" />`;
                svgGraph += `<text x="${svgW - 15}" y="${oy + 14}" font-size="10" fill="#000">x</text>`;
                svgGraph += `<text x="${ox + 6}" y="25" font-size="10" fill="#000">y</text>`;
                svgGraph += `<text x="${ox - 18}" y="${oy + 15}" font-size="9" fill="#000">O(0,0)</text>`;

                // 放物線
                let pathD = "";
                let xMin = -7, xMax = 7;
                for (let px = xMin; px <= xMax; px += 0.1) {
                    let py = s.aNum * px * px;
                    if (Math.abs(py) <= 7) {
                        pathD += (pathD === "" ? "M " : "L ") + `${tx(px)},${ty(py)} `;
                    }
                }
                svgGraph += `<path d="${pathD}" fill="none" stroke="#e67e22" stroke-width="1.6"/>`;

                // 三角形OABの塗りつぶし
                svgGraph += `<polygon points="${tx(0)},${ty(0)} ${tx(s.xA)},${ty(s.yA)} ${tx(s.xB)},${ty(s.yB)}" fill="rgba(46, 204, 113, 0.2)" stroke="#2ecc71" stroke-width="1.2"/>`;

                // 点A, B
                svgGraph += `<circle cx="${tx(s.xA)}" cy="${ty(s.yA)}" r="3.5" fill="#e74c3c"/>`;
                svgGraph += `<text x="${tx(s.xA) - 28}" y="${ty(s.yA) + 4}" class="svg-text svg-bold" fill="#e74c3c">A(${s.xA}, ${s.yA})</text>`;

                svgGraph += `<circle cx="${tx(s.xB)}" cy="${ty(s.yB)}" r="3.5" fill="#3498db"/>`;
                svgGraph += `<text x="${tx(s.xB) + 6}" y="${ty(s.yB) - 6}" class="svg-text svg-bold" fill="#3498db">B(${s.xB}, ${s.yB})</text>`;

                svgGraph += `</svg>`;

                let problemText = `放物線 \\(${s.eqDisplay}\\) 上に2点 \\(A(${s.xA}, ${s.yA})\\)、\\(B(${s.xB}, ${s.yB})\\) がある。原点 \\(O\\) と点 \\(A\\)、\\(B\\) を結んでできる三角形 \\(OAB\\) について、次の問いに答えなさい。<br>` +
                                  `(1) 直線 \\(AB\\) の式を求めなさい。<br>` +
                                  `(2) 線分 \\(AB\\) の長さを求めなさい。<br>` +
                                  `(3) 三角形 \\(OAB\\) の面積を求めなさい。<br>` +
                                  `(4) 三角形 \\(OAB\\) を直線 \\(AB\\) を軸に1回転させてできる立体の体積を求めなさい。<br>` + svgGraph;

                let explanationText = `【解説】<br>` +
                                      `1. <strong>(1) 直線ABの式</strong>：<br>` +
                                      `・2点 \\(A(${s.xA}, ${s.yA})\\)、\\(B(${s.xB}, ${s.yB})\\) を通る直線の式を求めると、<strong>\\(${s.lineEq}\\)</strong> となります。<br><br>` +
                                      `2. <strong>(2) ABの長さ</strong>：<br>` +
                                      `・\\(x\\) の増加量は \\(${s.dx}\\)、\\(y\\) の増加量は \\(${s.dy}\\) です。<br>` +
                                      `・三平方の定理より、\\(AB = \\mathbf{${s.abLenTeX}}\\) となります。<br><br>` +
                                      `3. <strong>(3) 三角形OABの面積</strong>：<br>` +
                                      `・直線 \\(AB\\) の \\(y\\) 切片を利用して求めると、面積は <strong>\\(${s.areaTeX}\\)</strong> となります。<br><br>` +
                                      `4. <strong>(4) 回転体の体積（半径 \\(r\\) の求め方）</strong>：<br>` +
                                      `・回転の半径 \\(r\\) は、原点 \\(O\\) から直線 \\(AB\\) に下ろした垂線の長さ（線分 \\(OH\\)）となります。<br>` +
                                      `  - <strong>【アプローチ1：面積からの逆算】</strong> 面積公式 \\(\\frac{1}{2} \\times AB \\times r = \\text{面積}\\) より、\\(r = ${s.radiusTeX}\\) と求められます。<br>` +
                                      `  - <strong>【アプローチ2：相似・比の利用】</strong> 直角三角形の相似比を利用して \\(r\\) を求めます。<br>` +
                                      `  - <strong>【アプローチ3：垂線Hの座標から求める方法】</strong><br>` +
                                      `    - 原点 \\(O\\) から \\(AB\\) に下ろした垂線の足を \\(H\\) とします。<br>` +
                                      `    - 直線 \\(AB\\) の傾きは <strong>\\(${s.abSlope}\\)</strong> なので、これと垂直な直線 \\(OH\\) の傾きは <strong>\\(${s.perpSlope}\\)</strong> になります。原点 \\(O\\) を通るため、直線 \\(OH\\) の式は <strong>\\(${s.ohEq}\\)</strong> となります。<br>` +
                                      `    - 直線 \\(AB\\) の式と直線 \\(OH\\) の式の連立方程式を解くと、交点 \\(H\\) の座標は <strong>\\(${s.hCoord}\\)</strong> と求まります。<br>` +
                                      `    - 求めた \\(H\\) の座標から三平方の定理（距離の公式）を利用して \\(OH = ${s.radiusTeX}\\) を求めます。<br>` +
                                      `・求めた半径 \\(r = ${s.radiusTeX}\\) を用いて体積 \\(V\\) を計算すると、体積は <strong>\\(${s.volTeX}\\)</strong> となります。`;

                return {
                    problem: problemText,
                    explanation: explanationText
                };
            }
        },
"軸をまたぐ回転体": {
    level: "難関私立",
    formula: "<strong>【軸をまたぐ回転体（y軸回転）】</strong><br>" +
             "・軸をまたぐ図形の回転体は、<strong>片側（y軸の反対側）を対称移動して一方に寄せてから回転</strong>させましょう。<br>" +
             "・見取り図を書くと図がごちゃごちゃして複雑になるため、見取り図は書かずに平面上で整理するのがおすすめです。<br>" +
             "・体積は組み合わせで求めます。各領域の座標（交点・切片）を正確に求め、計算します。<br>" +
             "・求める体積の式：\\(V = V_{\\triangle OBC} + V_{\\triangle OA'C} - V_{\\triangle OCD}\\)<br>" +
             `<svg viewBox="0 0 240 220" style="background: #fff; border: 1px solid #ddd; border-radius: 4px; display: block; margin: 8px auto; width: 100%; max-width: 220px;">` +
             `  <!-- 座標軸 -->` +
             `  <line x1="20" y1="180" x2="220" y2="180" stroke="#333" stroke-width="1.2" />` +
             `  <line x1="100" y1="20" x2="100" y2="200" stroke="#333" stroke-width="1.2" />` +
             `  <text x="210" y="195" font-size="9">x</text>` +
             `  <text x="105" y="28" font-size="9">y</text>` +
             `  <text x="88" y="193" font-size="8">O</text>` +
             `  <!-- 三角形 OAB -->` +
             `  <polygon points="60,140 100,180 180,20" fill="rgba(52, 152, 219, 0.15)" stroke="#3498db" stroke-width="1.5"/>` +
             `  <!-- 三角形 A'CO を薄く赤く塗る -->` +
             `  <polygon points="140,140 100,100 100,180" fill="rgba(231, 76, 60, 0.2)" stroke="#e74c3c" stroke-width="1" stroke-dasharray="2,2"/>` +
             `  <!-- 三角形 COD を薄く緑色で塗る -->` +
             `  <polygon points="100,100 100,180 126.7,126.7" fill="rgba(46, 204, 113, 0.25)" stroke="#2ecc71" stroke-width="1"/>` +
             `  <!-- 点A, B, C(y軸上の交点), A', D -->` +
             `  <circle cx="60" cy="140" r="3" fill="#e74c3c"/>` +
             `  <text x="22" y="143" font-size="8" fill="#e74c3c" font-weight="bold">A(-2,2)</text>` +
             `  <circle cx="180" cy="20" r="3" fill="#3498db"/>` +
             `  <text x="185" y="22" font-size="8" fill="#3498db" font-weight="bold">B(4,8)</text>` +
             `  <circle cx="100" cy="100" r="3" fill="#2ecc71"/>` +
             `  <text x="82" y="100" font-size="8" fill="#2ecc71" font-weight="bold">C(0,4)</text>` +
             `  <circle cx="140" cy="140" r="2.5" fill="#e74c3c"/>` +
             `  <text x="145" y="142" font-size="8" fill="#e74c3c">A'</text>` +
             `  <circle cx="126.7" cy="126.7" r="2.5" fill="#27ae60"/>` +
             `  <text x="132" y="125" font-size="8" fill="#27ae60" font-weight="bold">D(4/3, 8/3)</text>` +
             `</svg>`,
    generateRandom: function() {
        const scenarios = [
            {
                xA: -2, yA: 2, xB: 4, yB: 8,
                lineEq: "y = x + 4", cY: 4,
                vol1TeX: "\\frac{128}{3}\\pi",
                vol2TeX: "\\frac{16}{3}\\pi",
                vol3TeX: "\\frac{64}{27}\\pi",
                volSubCalcTeX: "\\frac{128}{3}\\pi + \\frac{16}{3}\\pi - \\frac{64}{27}\\pi",
                volTeX: "\\frac{1232}{27}\\pi",
                bigConeR: 4, bigConeH: 8,
                smallConeR: 2, smallConeH: 4,
                dCoordTeX: "\\left(\\frac{4}{3}, \\frac{8}{3}\\right)",
                cutoffCalc: "\\frac{1}{3} \\pi \\times \\left(\\frac{4}{3}\\right)^2 \\times 4 = \\frac{64}{27}\\pi"
            },
            {
                xA: -1, yA: 1, xB: 2, yB: 4,
                lineEq: "y = x + 2", cY: 2,
                vol1TeX: "\\frac{16}{3}\\pi",
                vol2TeX: "\\frac{2}{3}\\pi",
                vol3TeX: "\\frac{8}{27}\\pi",
                volSubCalcTeX: "\\frac{16}{3}\\pi + \\frac{2}{3}\\pi - \\frac{8}{27}\\pi",
                volTeX: "\\frac{154}{27}\\pi",
                bigConeR: 2, bigConeH: 4,
                smallConeR: 1, smallConeH: 2,
                dCoordTeX: "\\left(\\frac{2}{3}, \\frac{4}{3}\\right)",
                cutoffCalc: "\\frac{1}{3} \\pi \\times \\left(\\frac{2}{3}\\right)^2 \\times 2 = \\frac{8}{27}\\pi"
            },
            {
                xA: -4, yA: 8, xB: 2, yB: 2,
                lineEq: "y = -x + 4", cY: 4,
                vol1TeX: "\\frac{128}{3}\\pi",
                vol2TeX: "\\frac{16}{3}\\pi",
                vol3TeX: "\\frac{64}{27}\\pi",
                volSubCalcTeX: "\\frac{128}{3}\\pi + \\frac{16}{3}\\pi - \\frac{64}{27}\\pi",
                volTeX: "\\frac{1232}{27}\\pi",
                bigConeR: 4, bigConeH: 8,
                smallConeR: 2, smallConeH: 4,
                dCoordTeX: "\\left(\\frac{4}{3}, \\frac{8}{3}\\right)",
                cutoffCalc: "\\frac{1}{3} \\pi \\times \\left(\\frac{4}{3}\\right)^2 \\times 4 = \\frac{64}{27}\\pi"
            },
            {
                xA: -3, yA: 3, xB: 6, yB: 12,
                lineEq: "y = x + 6", cY: 6,
                vol1TeX: "144\\pi",
                vol2TeX: "18\\pi",
                vol3TeX: "8\\pi",
                volSubCalcTeX: "144\\pi + 18\\pi - 8\\pi",
                volTeX: "154\\pi",
                bigConeR: 6, bigConeH: 12,
                smallConeR: 3, smallConeH: 6,
                dCoordTeX: "(2, 4)",
                cutoffCalc: "\\frac{1}{3} \\pi \\times 2^2 \\times 6 = 8\\pi"
            },
            {
                xA: -2, yA: 1, xB: 4, yB: 4,
                lineEq: "y = \\frac{1}{2}x + 2", cY: 2,
                vol1TeX: "\\frac{64}{3}\\pi",
                vol2TeX: "\\frac{8}{3}\\pi",
                vol3TeX: "\\frac{32}{27}\\pi",
                volSubCalcTeX: "\\frac{64}{3}\\pi + \\frac{8}{3}\\pi - \\frac{32}{27}\\pi",
                volTeX: "\\frac{616}{27}\\pi",
                bigConeR: 4, bigConeH: 4,
                smallConeR: 2, smallConeH: 2,
                dCoordTeX: "\\left(\\frac{4}{3}, \\frac{4}{3}\\right)",
                cutoffCalc: "\\frac{1}{3} \\pi \\times \\left(\\frac{4}{3}\\right)^2 \\times 2 = \\frac{32}{27}\\pi"
            }
        ];
        const s = scenarios[Math.floor(Math.random() * scenarios.length)];

        const svgW = 340, svgH = 340;
        const ox = 170, oy = 260;
        const scale = 22;

        const tx = (x) => ox + x * scale;
        const ty = (y) => oy - y * scale;

        let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 340px;">` +
                       `<style>` +
                       `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                       `  .svg-bold { font-weight: bold; }` +
                       `</style>`;
        
        // 座標軸
        svgGraph += `<line x1="20" y1="${oy}" x2="${svgW - 20}" y2="${oy}" stroke="#333" stroke-width="1.2" />`;
        svgGraph += `<line x1="${ox}" y1="20" x2="${ox}" y2="${svgH - 20}" stroke="#333" stroke-width="1.2" />`;
        svgGraph += `<text x="${svgW - 15}" y="${oy + 14}" font-size="10" fill="#000">x</text>`;
        svgGraph += `<text x="${ox + 6}" y="25" font-size="10" fill="#000">y</text>`;
        svgGraph += `<text x="${ox - 18}" y="${oy + 15}" font-size="9" fill="#000">O(0,0)</text>`;

        // 三角形OAB
        svgGraph += `<polygon points="${tx(0)},${ty(0)} ${tx(s.xA)},${ty(s.yA)} ${tx(s.xB)},${ty(s.yB)}" fill="rgba(52, 152, 219, 0.2)" stroke="#3498db" stroke-width="1.2"/>`;

        // 点A, B
        svgGraph += `<circle cx="${tx(s.xA)}" cy="${ty(s.yA)}" r="3.5" fill="#e74c3c"/>`;
        svgGraph += `<text x="${tx(s.xA) - 30}" y="${ty(s.yA) + 4}" class="svg-text svg-bold" fill="#e74c3c">A(${s.xA}, ${s.yA})</text>`;

        svgGraph += `<circle cx="${tx(s.xB)}" cy="${ty(s.yB)}" r="3.5" fill="#3498db"/>`;
        svgGraph += `<text x="${tx(s.xB) + 8}" y="${ty(s.yB) - 6}" class="svg-text svg-bold" fill="#3498db">B(${s.xB}, ${s.yB})</text>`;

        // y切片 C (座標値なし、点名Cのみ)
        svgGraph += `<circle cx="${tx(0)}" cy="${ty(s.cY)}" r="3" fill="#2ecc71"/>`;
        svgGraph += `<text x="${tx(0) + 6}" y="${ty(s.cY) + 4}" class="svg-text svg-bold" fill="#2ecc71">C</text>`;

        svgGraph += `</svg>`;

        let problemText = `直線と座標軸で囲まれた図形について考える。2点 \\(A(${s.xA}, ${s.yA})\\), \\(B(${s.xB}, ${s.yB})\\) を通る直線と \\(y\\) 軸との交点を \\(C\\) とする。三角形 \\(OAB\\) を \\(y\\) 軸を軸として1回転させてできる立体の体積を求めなさい。<br>` + svgGraph;

        let explanationText = `【解説】<br>` +
                              `1. <strong>y軸交点Cの導出</strong>：<br>` +
                              `・直線 \\(AB\\) の式を求めると \\(${s.lineEq}\\) となり、\\(y\\) 軸との交点 \\(C\\) の座標は \\(C(0, ${s.cY})\\) （高さ \\(OC = ${s.cY}\\)）と求められます。<br><br>` +
                              `2. <strong>軸をまたぐ図形の回転手法と点Dの導出</strong>：<br>` +
                              `・\\(y\\) 軸の左側にある \\(\\triangle OAC\\) を \\(y\\) 軸に関して線対称に折り返し、\\(y\\) 軸の右側に寄せます（折り返した点を \\(A'(${Math.abs(s.xA)}, ${s.yA})\\) とします）。<br>` +
                              `・直線 \\(A'B\\) と直線 \\(OC\\)（\\(y\\) 軸）の交点を \\(D\\) とすると、連立方程式を解いて点 \\(D\\) の座標は \\(${s.dCoordTeX}\\) と求められます。<br>` +
                              `・これにより、求める体積は<strong>「\\(\\triangle OBC\\) の回転体」と「\\(\\triangle OA'C\\) の回転体の和」から「重なっている部分（\\(\\triangle OCD\\)）の回転体を引いたもの」</strong>になります。<br>` +
                              `・式で表すと、\\(V = V_{\\triangle OBC} + V_{\\triangle OA'C} - V_{\\triangle OCD}\\) となります。<br><br>` +
                              `3. <strong>それぞれの回転体の体積の計算</strong>：<br>` +
                              `・\\(\\triangle OBC\\) の回転体：<br>` +
                              `  \\(V_{\\triangle OBC} = \\frac{1}{3} \\pi \\times ${s.bigConeR}^2 \\times ${s.bigConeH} = ${s.vol1TeX}\\)<br>` +
                              `・\\(\\triangle OA'C\\) の回転体：<br>` +
                              `  \\(V_{\\triangle OA'C} = \\frac{1}{3} \\pi \\times ${s.smallConeR}^2 \\times ${s.smallConeH} = ${s.vol2TeX}\\)<br>` +
                              `・\\(\\triangle OCD\\) の回転体（重なり部分）：<br>` +
                              `  半径を点 \\(D\\) の \\(x\\) 座標、高さを \\(OC\\)（\\(${s.cY}\\)）として、<br>` +
                              `  \\(V_{\\triangle OCD} = ${s.cutoffCalc}\\)<br><br>` +
                              `4. <strong>全体の体積の計算</strong>：<br>` +
                              `・\\(V = V_{\\triangle OBC} + V_{\\triangle OA'C} - V_{\\triangle OCD}\\)<br>` +
                              `  \\(V = ${s.volSubCalcTeX} = \\mathbf{${s.volTeX}}\\)<br><br>` +
                              `※ 見取り図を描くと直線が複雑に交差して混乱しやすいため、このように「y軸の一方に図形をまとめて和・差で求める」テクニックを押さえておきましょう！`;

        return {
            problem: problemText,
            explanation: explanationText
        };
    }
},
"線分の点を中心に平面回転": {
    category: "関数",
    level: "難関私立",
    formula: "<strong>【線分の点を中心に平面回転】</strong><br>" +
             "・原点 \\(O\\) を中心とし、線分 \\(AB\\) を回転させるとき、通過する領域は<strong>中心から「最短距離」と「最長距離」をそれぞれ半径とする同心円で挟まれたドーナツ型</strong>になります。<br>" +
             "・<strong>最短距離 \\(OH\\)</strong>：原点 \\(O\\) から線分（または直線）に下ろした垂線の長さ。<br>" +
             "・<strong>最長距離</strong>：原点 \\(O\\) から最も遠い端点までの距離。<br>" +
             "・<strong>通過面積</strong>：\\(S = (\\text{最長距離の二乗} - \\text{最短距離の二乗}) \\times \\pi\\)<br>" +
             `<svg viewBox="0 0 240 240" style="background: #fff; border: 1px solid #ddd; border-radius: 4px; display: block; margin: 8px auto; width: 100%; max-width: 240px;">` +
             `  <!-- 座標軸 -->` +
             `  <line x1="20" y1="120" x2="220" y2="120" stroke="#333" stroke-width="1.2" />` +
             `  <line x1="120" y1="20" x2="120" y2="220" stroke="#333" stroke-width="1.2" />` +
             `  <text x="210" y="135" font-size="9">x</text>` +
             `  <text x="125" y="28" font-size="9">y</text>` +
             `  <text x="108" y="133" font-size="8">O</text>` +
             `  <!-- ドーナツ型領域 -->` +
             `  <path d="M 120 50 A 70 70 0 1 0 120 190 A 70 70 0 1 0 120 50 Z M 120 78 A 42 42 0 1 0 120 162 A 42 42 0 1 0 120 78 Z" fill="rgba(54, 162, 235, 0.25)" fill-rule="evenodd" />` +
             `  <!-- 外側の円 (半径 OB) -->` +
             `  <circle cx="120" cy="120" r="70" fill="none" stroke="#36a2eb" stroke-width="1.2" stroke-dasharray="3,3" />` +
             `  <!-- 内側の円 (半径 OH) -->` +
             `  <circle cx="120" cy="120" r="42" fill="none" stroke="#2ecc71" stroke-width="1.2" stroke-dasharray="3,3" />` +
             `  <!-- 線分 AB -->` +
             `  <line x1="106" y1="78" x2="176" y2="78" stroke="#333" stroke-width="2" />` +
             `  <!-- 垂線 OH -->` +
             `  <line x1="120" y1="120" x2="120" y2="78" stroke="#2ecc71" stroke-width="1.5" stroke-dasharray="2,2" />` +
             `  <!-- 線分 OB -->` +
             `  <line x1="120" y1="120" x2="176" y2="78" stroke="#36a2eb" stroke-width="1.5" stroke-dasharray="2,2" />` +
             `  <!-- 垂直マーク -->` +
             `  <path d="M 120 84 L 126 84 L 126 78" fill="none" stroke="#333" stroke-width="1" />` +
             `  <!-- 各点プロット -->` +
             `  <circle cx="106" cy="78" r="3" fill="#e74c3c" />` +
             `  <text x="75" y="74" font-size="8" fill="#e74c3c" font-weight="bold">A(-1,3)</text>` +
             `  <circle cx="176" cy="78" r="3" fill="#36a2eb" />` +
             `  <text x="180" y="74" font-size="8" fill="#36a2eb" font-weight="bold">B(4,3)</text>` +
             `  <circle cx="120" cy="78" r="3" fill="#2ecc71" />` +
             `  <text x="123" y="72" font-size="8" fill="#2ecc71" font-weight="bold">H(0,3)</text>` +
             `</svg>`,
    generateRandom: function() {
        // 平方根を最も簡単な形にするヘルパー関数
        function simplifySqrt(n) {
            if (n <= 0) return { tex: "0", coef: 0, inner: 0 };
            let coef = 1, inner = n;
            for (let i = 2; i * i <= inner; i++) {
                while (inner % (i * i) === 0) {
                    coef *= i;
                    inner /= (i * i);
                }
            }
            if (inner === 1) return { tex: `${coef}`, coef, inner: 1 };
            if (coef === 1) return { tex: `\\sqrt{${inner}}`, coef: 1, inner };
            return { tex: `${coef}\\sqrt{${inner}}`, coef, inner };
        }

        const isNegativeSlope = Math.random() < 0.5;
        let a, b, xA, yA, xB, yB;

        if (isNegativeSlope) {
            const slopes = [1, 2, 3, 4];
            a = slopes[Math.floor(Math.random() * slopes.length)];
            const intercepts = [6, 8, 10, 12, 16, 20, 24];
            b = intercepts[Math.floor(Math.random() * intercepts.length)];
            xA = 0; yA = b; xB = b / a; yB = 0;
        } else {
            const slopes = [1, 2, 3, 4];
            a = slopes[Math.floor(Math.random() * slopes.length)];
            const negatives = [-6, -8, -10, -12, -16, -20];
            b = negatives[Math.floor(Math.random() * negatives.length)];
            xA = 0; yA = b; xB = -b / a; yB = 0;
        }

        const oa2 = yA * yA;
        const ob2 = xB * xB;
        
        let maxR2, maxPointText;
        if (oa2 >= ob2) {
            maxR2 = oa2;
            maxPointText = `A(0, ${yA})`;
        } else {
            maxR2 = ob2;
            maxPointText = `B(${xB}, 0)`;
        }

        const abValSq = oa2 + ob2;
        const abSimp = simplifySqrt(abValSq);

        const prodOAOB = Math.abs(yA) * Math.abs(xB);
        const numOh2 = oa2 * ob2;
        const denOh2 = abValSq;

        const gcd = (x, y) => (y === 0) ? x : gcd(y, x % y);

        // OHの長さを計算（最も簡単な形に整形）
        let ohLengthStr = "";
        const numCoeff = prodOAOB;
        const denCoeff = abSimp.coef * abSimp.inner;
        const gOh = gcd(numCoeff, denCoeff);
        const simpNumC = numCoeff / gOh;
        const simpDenC = denCoeff / gOh;

        if (abSimp.inner === 1) {
            const gNorm = gcd(prodOAOB, abValSq);
            ohLengthStr = (abValSq / gNorm === 1) ? `${prodOAOB / gNorm}` : `\\frac{${prodOAOB / gNorm}}{${abValSq / gNorm}}`;
        } else {
            let numPart = simpNumC === 1 ? "" : `${simpNumC}`;
            let denPart = simpDenC === 1 ? "" : `${simpDenC}`;
            if (denPart === "") {
                ohLengthStr = `${numPart}\\sqrt{${abSimp.inner}}`.trim();
                if (numPart === "") ohLengthStr = `\\sqrt{${abSimp.inner}}`;
            } else {
                ohLengthStr = `\\frac{${numPart}\\sqrt{${abSimp.inner}}}{${denPart}}`;
            }
        }

        const gOh2 = gcd(numOh2, denOh2);
        const simpOh2Num = numOh2 / gOh2;
        const simpOh2Den = denOh2 / gOh2;
        let oh2FracStr = simpOh2Den === 1 ? `${simpOh2Num}` : `\\frac{${simpOh2Num}}{${simpOh2Den}}`;

        let lineEqStr = isNegativeSlope ? `y = ${a === 1 ? '-' : '-' + a}x + ${b}` : `y = ${a === 1 ? '' : a}x ${b}`;

        // 面積計算
        const topVal = maxR2 * denOh2 - numOh2;
        const gArea = gcd(Math.abs(topVal), denOh2);
        const simpTop = topVal / gArea;
        const simpDen = denOh2 / gArea;
        const areaTeX = simpDen === 1 ? `${simpTop}\\pi` : `\\frac{${simpTop}}{${simpDen}}\\pi`;

        // 動的スケーリング計算（見切れ防止）
        const minX = Math.min(0, xB) - 3;
        const maxX = Math.max(0, xB) + 3;
        const minY = Math.min(0, yA) - 3;
        const maxY = Math.max(0, yA) + 3;

        const svgW = 300, svgH = 300;
        const padding = 45;
        const drawW = svgW - padding * 2;
        const drawH = svgH - padding * 2;

        const scaleX = drawW / (maxX - minX);
        const scaleY = drawH / (maxY - minY);
        const scale = Math.min(scaleX, scaleY);

        const ox = padding - minX * scale;
        const oy = svgH - padding + minY * scale;

        const tx = (x) => ox + x * scale;
        const ty = (y) => oy - y * scale;

        let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 300px;">` +
                       `<style>` +
                       `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                       `  .svg-bold { font-weight: bold; }` +
                       `</style>`;
        
        // 座標軸
        svgGraph += `<line x1="20" y1="${oy}" x2="${svgW - 20}" y2="${oy}" stroke="#333" stroke-width="1.2" />`;
        svgGraph += `<line x1="${ox}" y1="20" x2="${ox}" y2="${svgH - 20}" stroke="#333" stroke-width="1.2" />`;
        svgGraph += `<text x="${svgW - 15}" y="${oy + 14}" class="svg-text">x</text>`;
        svgGraph += `<text x="${ox + 6}" y="25" class="svg-text">y</text>`;
        svgGraph += `<text x="${ox - 15}" y="${oy + 14}" class="svg-text">O</text>`;

        // 直線 AB
        svgGraph += `<line x1="${tx(xA)}" y1="${ty(yA)}" x2="${tx(xB)}" y2="${ty(yB)}" stroke="#3498db" stroke-width="2" />`;

        // 点A, B
        svgGraph += `<circle cx="${tx(xA)}" cy="${ty(yA)}" r="3.5" fill="#e74c3c"/>`;
        svgGraph += `<text x="${tx(xA) + 6}" y="${ty(yA) + 4}" class="svg-text svg-bold" fill="#e74c3c">A(0, ${yA})</text>`;

        svgGraph += `<circle cx="${tx(xB)}" cy="${ty(yB)}" r="3.5" fill="#36a2eb"/>`;
        svgGraph += `<text x="${tx(xB) - 15}" y="${ty(yB) + 15}" class="svg-text svg-bold" fill="#36a2eb">B(${xB}, 0)</text>`;

        svgGraph += `</svg>`;

        let problemText = `直線 \\(${lineEqStr}\\) が \\(y\\) 軸、\\(x\\) 軸と交わる点をそれぞれ \\(A\\)、\\(B\\) とする。線分 \\(AB\\) を原点 \\(O\\) を中心として平面上で回転させたときに、線分 \\(AB\\) が通過してできる部分の面積を求めなさい。<br>` + svgGraph;

        let explanationText = `【解説】<br>` +
                              `1. <strong>交点A, Bの座標</strong>：<br>` +
                              `・\\(y\\) 軸との交点：\\(x = 0\\) を代入して \\(A(0, ${yA})\\) （\\(OA = ${Math.abs(yA)}\\)）<br>` +
                              `・\\(x\\) 軸との交点：\\(y = 0\\) を代入して \\(B(${xB}, 0)\\) （\\(OB = ${Math.abs(xB)}\\)）<br><br>` +
                              `2. <strong>回転体の構造（ドーナツ型）の把握</strong>：<br>` +
                              `・線分 \\(AB\\) を原点 \\(O\\) のまわりに1回転させると、原点からの<strong>「最長距離」を半径とする円</strong>の内側に、<strong>「最短距離」を半径とする円</strong>の穴があいた**ドーナツ型の図形**（円環）が形成されます。<br><br>` +
                              `3. <strong>最長距離（外半径）の計算</strong>：<br>` +
                              `・原点 \\(O(0,0)\\) から最も遠い線分 \\(AB\\) 上の点は端点 \\(${maxPointText}\\) です。<br>` +
                              `・外半径の2乗：\\(R^2 = ${maxR2}\\)<br><br>` +
                              `4. <strong>相似を用いた最短距離（内半径 \\(OH\\)）の求め方</strong>：<br>` +
                              `・直角三角形 \\(OAB\\) において、三平方の定理より斜辺 \\(AB = \\sqrt{OA^2 + OB^2} = \\sqrt{${oa2} + ${ob2}} = \\mathbf{${abSimp.tex}}\\) です。<br>` +
                              `・原点 \\(O\\) から直線 \\(AB\\) に下ろした垂線の足を \\(H\\) とすると、直角三角形の相似（または面積 \\(\\frac{1}{2} \\times OA \\times OB = \\frac{1}{2} \\times AB \\times OH\\) ）より、<br>` +
                              `  \\(OH = \\frac{OA \\times OB}{AB} = \\frac{${Math.abs(yA)} \\times ${Math.abs(xB)}}{${abSimp.tex}}\\) が成り立ちます。<br>` +
                              `・したがって、\\(OH = \\mathbf{${ohLengthStr}}\\) と求められます。<br>` +
                              `・内半径の2乗：\\(r^2 = OH^2 = ${oh2FracStr}\\)<br><br>` +
                              `5. <strong>通過面積の計算</strong>：<br>` +
                              `・通過面積 \\(S = (R^2 - r^2) \\times \\pi\\)<br>` +
                              `・\\(S = \\left(${maxR2} - ${oh2FracStr}\\right) \\pi = \\mathbf{${areaTeX}}\\<br><br>` +
                              `※ ポイント：直線を回転させた領域の面積は「最も遠い端点までの円の面積」から「原点からの垂線の長さ \\(OH\\) の円の面積」を引くことで求められます！`;

        return {
            problem: problemText,
            explanation: explanationText
        };
    }
},
"直線の傾きと特別角": {
    category: "関数",
    level: "難関私立",
    formula: "<strong>【直線の傾きと特別角】</strong><br>" +
             "・\\(x\\) 軸と直線のつくる角度が<strong>特別角（30°、45°、60°）</strong>になる時、直線の傾き（変化の割合）は直角三角形の比から一瞬で求められます。<br>" +
             "・<strong>30°のとき</strong>：比 \\(1 : 2 : \\sqrt{3}\\) より、傾きは \\(\\frac{1}{\\sqrt{3}} = \\frac{\\sqrt{3}}{3}\\)<br>" +
             "・<strong>45°のとき</strong>：比 \\(1 : 1 : \\sqrt{2}\\) より、傾きは \\(1\\)<br>" +
             "・<strong>60°のとき</strong>：比 \\(1 : 2 : \\sqrt{3}\\) より、傾きは \\(\\sqrt{3}\\)<br>" +
             "・逆に、直線の傾きから \\(x\\) 軸とのなす角（特別角）を逆算するテクニックも難関校では必須です。",
    generateRandom: function() {
        const scenarios = [
            {
                parabolaEq: "y = \\sqrt{3}x^2",
                parabolaCoef: 1.732,
                angleOA: 60,
                slopeOA: "\\sqrt{3}",
                slopeOANum: 1.732,
                xBTeX: "-\\frac{4}{3}",
                xBVal: -4/3,
                aCoord: "(1, \\sqrt{3})",
                bCoord: "\\left(-\\frac{4}{3}, \\frac{16\\sqrt{3}}{9}\\right)",
                lineABEq: "y = -\\frac{\\sqrt{3}}{3}x + \\frac{4\\sqrt{3}}{9}",
                angleOAB: "90°",
                abLengthCalc: "\\sqrt{\\left(1 - \\left(-\\frac{4}{3}\\right)\\right)^2 + \\left(\\sqrt{3} - \\frac{16\\sqrt{3}}{9}\\right)^2} = \\sqrt{\\left(\\frac{7}{3}\\right)^2 + \\left(-\\frac{7\\sqrt{3}}{9}\\right)^2} = \\sqrt{\\frac{49}{9} + \\frac{147}{81}} = \\sqrt{\\frac{588}{81}} = \\frac{14\\sqrt{3}}{9}",
                abLength: "\\frac{14\\sqrt{3}}{9}"
            },
            {
                parabolaEq: "y = \\frac{\\sqrt{3}}{3}x^2",
                parabolaCoef: 0.577,
                angleOA: 30,
                slopeOA: "\\frac{\\sqrt{3}}{3}",
                slopeOANum: 0.577,
                xBTeX: "-3",
                xBVal: -3,
                aCoord: "\\left(1, \\frac{\\sqrt{3}}{3}\\right)",
                bCoord: "(-3, \\sqrt{3})",
                lineABEq: "y = \\frac{\\sqrt{3}}{6}x + \\frac{\\sqrt{3}}{2}",
                angleOAB: "90°",
                abLengthCalc: "\\sqrt{\\left(1 - (-3)\\right)^2 + \\left(\\frac{\\sqrt{3}}{3} - \\sqrt{3}\\right)^2} = \\sqrt{4^2 + \\left(-\\frac{2\\sqrt{3}}{3}\\right)^2} = \\sqrt{16 + \\frac{12}{9}} = \\sqrt{\\frac{156}{9}} = \\frac{2\\sqrt{39}}{3}",
                abLength: "\\frac{2\\sqrt{39}}{3}"
            },
            {
                parabolaEq: "y = x^2",
                parabolaCoef: 1,
                angleOA: 45,
                slopeOA: "1",
                slopeOANum: 1,
                xBTeX: "-2",
                xBVal: -2,
                aCoord: "(1, 1)",
                bCoord: "(-2, 4)",
                lineABEq: "y = -x + 2",
                angleOAB: "90°",
                abLengthCalc: "\\sqrt{\\left(1 - (-2)\\right)^2 + (1 - 4)^2} = \\sqrt{3^2 + (-3)^2} = \\sqrt{9 + 9} = 3\\sqrt{2}",
                abLength: "3\\sqrt{2}"
            }
        ];

        const s = scenarios[Math.floor(Math.random() * scenarios.length)];

        // --- 動的スケーリング計算（グラフの見切れ防止） ---
        const svgW = 300, svgH = 300;
        const padding = 40;
        const drawW = svgW - padding * 2;
        const drawH = svgH - padding * 2;

        const minX = Math.min(s.xBVal, -2) - 1;
        const maxX = 2;
        const minY = -1;
        const maxY = Math.max(Math.abs(s.xBVal * s.xBVal * s.parabolaCoef), 5) + 2;

        const scaleX = drawW / (maxX - minX);
        const scaleY = drawH / (maxY - minY);
        const scale = Math.min(scaleX, scaleY);

        const ox = padding - minX * scale;
        const oy = svgH - padding + minY * scale;

        const tx = (x) => ox + x * scale;
        const ty = (y) => oy - y * scale;

        let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 300px;">` +
                       `<style>` +
                       `  .svg-text { font-family: sans-serif; font-size: 10px; fill: #000; }` +
                       `  .svg-bold { font-weight: bold; }` +
                       `</style>`;
        
        // 座標軸
        svgGraph += `<line x1="20" y1="${oy}" x2="${svgW - 20}" y2="${oy}" stroke="#333" stroke-width="1.2" />`;
        svgGraph += `<line x1="${ox}" y1="20" x2="${ox}" y2="${svgH - 20}" stroke="#333" stroke-width="1.2" />`;
        svgGraph += `<text x="${svgW - 15}" y="${oy + 14}" class="svg-text">x</text>`;
        svgGraph += `<text x="${ox + 6}" y="25" class="svg-text">y</text>`;
        svgGraph += `<text x="${ox - 15}" y="${oy + 14}" class="svg-text">O</text>`;

        // 放物線の描画
        let parabolaPath = "";
        const numPoints = 40;
        for (let i = 0; i <= numPoints; i++) {
            let px = minX + (maxX - minX) * (i / numPoints);
            let py = s.parabolaCoef * px * px;
            let sx = tx(px);
            let sy = ty(py);
            if (i === 0) parabolaPath += `M ${sx} ${sy} `;
            else parabolaPath += `L ${sx} ${sy} `;
        }
        svgGraph += `<path d="${parabolaPath}" fill="none" stroke="#2ecc71" stroke-width="1.5" />`;

        // 直線 OA (実線)
        svgGraph += `<line x1="${tx(minX)}" y1="${ty(minX * s.slopeOANum)}" x2="${tx(maxX)}" y2="${ty(maxX * s.slopeOANum)}" stroke="#3498db" stroke-width="1.5" />`;

        // 角度の表示（原点の右下）
        svgGraph += `<text x="${ox + 12}" y="${oy + 14}" class="svg-text svg-bold" fill="#3498db">${s.angleOA}°</text>`;

        // 直線 AB の追加
        let xA = 1;
        let yA = s.slopeOANum * xA;
        let xB = s.xBVal;
        let yB = s.parabolaCoef * xB * xB;
        let slopeAB = (yB - yA) / (xB - xA);
        let interceptAB = yA - slopeAB * xA;
        let abLineY1 = slopeAB * minX + interceptAB;
        let abLineY2 = slopeAB * maxX + interceptAB;
        svgGraph += `<line x1="${tx(minX)}" y1="${ty(abLineY1)}" x2="${tx(maxX)}" y2="${ty(abLineY2)}" stroke="#e74c3c" stroke-width="1.5" />`;

        // 点A, Bのプロット
        svgGraph += `<circle cx="${tx(1)}" cy="${ty(yA)}" r="3.5" fill="#e74c3c"/>`;
        svgGraph += `<text x="${tx(1) + 6}" y="${ty(yA) - 4}" class="svg-text svg-bold" fill="#e74c3c">A</text>`;

        svgGraph += `<circle cx="${tx(s.xBVal)}" cy="${ty(yB)}" r="3.5" fill="#e74c3c"/>`;
        svgGraph += `<text x="${tx(s.xBVal) - 15}" y="${ty(yB) + 15}" class="svg-text svg-bold" fill="#e74c3c">B</text>`;

        svgGraph += `</svg>`;

        let problemText = `放物線 \\(${s.parabolaEq}\\) は直線と2点 \\(A\\)、\\(B\\) で交わっている。\\(B\\) の \\(x\\) 座標は \\(${s.xBTeX}\\) であり、原点 \\(O\\) と \\(A\\) を結ぶ直線 \\(OA\\) と \\(x\\) 軸が作る角度は \\(${s.angleOA}°\\) であった。<br>` +
                          `(1) 点 \\(A\\) の座標を求めなさい。<br>` +
                          `(2) \\(\\angle OAB\\) の大きさを求めなさい。<br>` +
                          `(3) 線分 \\(AB\\) の長さを求めなさい。<br>` + svgGraph;

        let explanationText = `【解説】<br>` +
                              `1. <strong>(1) 点Aの座標の求め方</strong>：<br>` +
                              `・直線 \\(OA\\) は原点を通る直線であり、\\(x\\) 軸とのなす角が \\(${s.angleOA}°\\) なので、特別角の比より、その傾きは \\(${s.slopeOA}\\) です。<br>` +
                              `・したがって、直線 \\(OA\\) の式は \\(y = ${s.slopeOA}x\\) と求められます。<br>` +
                              `・これを放物線 \\(y = ${s.parabolaEq}\\) と連立させると、交点 \\(A\\) の \\(x\\) 座標（ \\(x > 0\\) ）は \\(\\mathbf{1}\\) と求まります。<br>` +
                              `・\\(y\\) 座標に代入して、点 \\(A\\) の座標は \\(\\mathbf{${s.aCoord}}\\) となります。<br><br>` +
                              `2. <strong>(2) \\(\\angle OAB\\) の大きさと点Bの \\(x\\) 座標</strong>：<br>` +
                              `・点 \\(B\\) の \\(x\\) 座標は \\(${s.xBTeX}\\) であり、これは放物線と直線の交点の \\(x\\) 座標（方程式の解）を求めることで得られます。<br>` +
                              `・放物線の式に \\(x = ${s.xBTeX}\\) を代入して、点 \\(B\\) の座標は \\(\\mathbf{${s.bCoord}}\\) と求められます。<br>` +
                              `・直線 \\(OA\\) と直線 \\(AB\\) の傾きの関係（垂直条件 \\(a_1 \\times a_2 = -1\\) など）を確認すると、2直線は垂直に交わっていることが分かります。<br>` +
                              `・したがって、\\(\\angle OAB\\) の大きさは \\(\\mathbf{${s.angleOAB}}\\) となります。<br><br>` +
                              `3. <strong>(3) 線分ABの長さの求め方</strong>：<br>` +
                              `・点 \\(A\\) と点 \\(B\\) の座標の差を用いて、三平方の定理より距離を計算します。<br>` +
                              `・\\(AB = ${s.abLengthCalc}\\)<br>` +
                              `・したがって、線分 \\(AB\\) の長さは \\(\\mathbf{${s.abLength}}\\) となります。<br><br>` +
                              `※ ポイント：特別角（30°、45°、60°）から傾きを瞬時に導き出すテクニックと、直線の垂直関係を見抜く力をセットで押さえておきましょう！`;

        return {
            problem: problemText,
            explanation: explanationText
        };
    }
},
"図形の最終手段": {
    category: "関数",
    level: "公立",
    formula: "<strong>【図形の最終手段（座標・関数化テクニック）】</strong><br>" +
             "・平面図形において、直角や基準となる点を<strong>原点 \\((0, 0)\\)</strong>としてとらえてグラフ化します。<br>" +
             "・長さの情報からそれぞれの頂点の座標を正確に設定し、直線の式を求めて<strong>連立方程式で交点座標を算出</strong>したり、座標から<strong>三平方の定理で長さ</strong>を求めたりします。<br>" +
             "・非常に強力でどんな図形問題でも確実に解ける万能な方法ですが、<strong>計算が複雑になりとんでもない数字や分数が出てくることがあるため、幾何的な解法が見つからないときの最終手段</strong>として取っておきましょう。",
    generateRandom: function() {
        // --- 4方向（右・上・左・下）の全シナリオプール ---
        const scenarios = [
            // 1. 右方向への延長
            function() {
                const s = 2, n = 3;
                const ex = 4, fx = 1;
                const gx = 2/5, gy = 6/5;
                const gxText = "\\frac{2}{5}", gyText = "\\frac{6}{5}";
                const lineAE = "y = -\\frac{1}{3}x + \\frac{4}{3}";
                const lineDF = "y = -2x + 2";
                const calcStep = "CG = \\sqrt{\\left(\\frac{2}{5}\\right)^2 + \\left(\\frac{6}{5}\\right)^2} = \\sqrt{\\frac{4}{25} + \\frac{36}{25}} = \\sqrt{\\frac{40}{25}} = \\frac{2\\sqrt{10}}{5}";

                const cx = 0, cy = 0;
                const bx = -s, by = 0;
                const ax = -s, ay = s;
                const dx = 0, dy = s;
                const ey = 0, fy = 0;

                const allX = [cx, bx, ax, dx, ex, fx, gx];
                const allY = [cy, by, ay, dy, ey, fy, gy];
                const minX = Math.min(...allX), maxX = Math.max(...allX);
                const minY = Math.min(...allY), maxY = Math.max(...allY);

                const svgW = 320, svgH = 240;
                const scale = Math.min((svgW - 80) / (maxX - minX || 1), (svgH - 80) / (maxY - minY || 1));
                const ox = svgW / 2 - ((minX + maxX) / 2) * scale;
                const oy = svgH / 2 + ((minY + maxY) / 2) * scale;
                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 320px;">` +
                               `<style>.svg-text { font-family: sans-serif; font-size: 10px; fill: #000; } .svg-bold { font-weight: bold; }</style>`;
                svgGraph += `<polygon points="${tx(ax)},${ty(ay)} ${tx(bx)},${ty(by)} ${tx(cx)},${ty(cy)} ${tx(dx)},${ty(dy)}" fill="#eef2f7" stroke="#333" stroke-width="1.5" />`;
                svgGraph += `<line x1="${tx(bx)}" y1="${ty(by)}" x2="${tx(ex)}" y2="${ty(ey)}" stroke="#333" stroke-width="1.5" />`;
                svgGraph += `<line x1="${tx(ax)}" y1="${ty(ay)}" x2="${tx(ex)}" y2="${ty(ey)}" stroke="#3498db" stroke-width="1.5" />`;
                svgGraph += `<line x1="${tx(dx)}" y1="${ty(dy)}" x2="${tx(fx)}" y2="${ty(fy)}" stroke="#e74c3c" stroke-width="1.5" />`;
                svgGraph += `<line x1="${tx(cx)}" y1="${ty(cy)}" x2="${tx(gx)}" y2="${ty(gy)}" stroke="#27ae60" stroke-width="2" />`;

                const pts = [
                    { name: "C", x: cx, y: cy, dx: 6, dy: 14, color: "#333" },
                    { name: "B", x: bx, y: by, dx: -16, dy: 14, color: "#333" },
                    { name: "A", x: ax, y: ay, dx: -16, dy: -6, color: "#333" },
                    { name: "D", x: dx, y: dy, dx: 6, dy: -6, color: "#333" },
                    { name: "E", x: ex, y: ey, dx: 6, dy: 14, color: "#333" },
                    { name: "F", x: fx, y: fy, dx: -4, dy: 14, color: "#333" },
                    { name: "G", x: gx, y: gy, dx: 6, dy: -4, color: "#e74c3c" }
                ];
                pts.forEach(pt => {
                    svgGraph += `<circle cx="${tx(pt.x)}" cy="${ty(pt.y)}" r="3.5" fill="${pt.color}"/>`;
                    svgGraph += `<text x="${tx(pt.x) + pt.dx}" y="${ty(pt.y) + pt.dy}" class="svg-text svg-bold" fill="${pt.color}">${pt.name}</text>`;
                });
                svgGraph += `</svg>`;

                let problemText = `正方形 \\(ABCD\\) がある。（左上が \\(A\\)、左下が \\(B\\)、右下が \\(C\\)、右上が \\(D\\) で、1辺の長さは \\(${s}\\)）<br>` +
                                  `\\(BC\\) の延長線上に \\(C\\) の方向（右側）へ \\(BE = ${n}BC\\) となる点 \\(E\\) をとる。<br>` +
                                  `\\(BE\\) の中点を \\(F\\) とし、\\(AE\\) と \\(DF\\) の交点を \\(G\\) とするとき、線分 \\(CG\\) の長さを求めなさい。<br>` + svgGraph;

                let explanationText = `【解説（図形の最終手段：座標・関数化）】<br>` +
                                      `1. <strong>座標の設定</strong><br>` +
                                      `・右下の頂点 \\(C\\) を原点 \\((0, 0)\\) とします。各頂点は \\(C(0,0)\\), \\(B(-${s},0)\\), \\(A(-${s},${s})\\), \\(D(0,${s})\\)。点 \\(E(${ex},0)\\)、\\(F(${fx},0)\\) となります。<br><br>` +
                                      `2. <strong>直線の式と交点 G の算出</strong><br>` +
                                      `・直線 \\(AE\\) の式：\\(${lineAE}\\)<br>` +
                                      `・直線 \\(DF\\) の式：\\(${lineDF}\\)<br>` +
                                      `・連立して解くと、交点 \\(G\\) の座標は \\(\\left(${gxText}, ${gyText}\\right)\\) となります。<br><br>` +
                                      `3. <strong>三平方の定理で CG の長さを求める</strong><br>` +
                                      `  \\(${calcStep}\\)`;

                return { problem: problemText, explanation: explanationText };
            },

            // 2. 上方向への延長
            function() {
                const s = 2;
                const ex = 0, ey = 6;
                const fx = 0, fy = 4;
                const gx = -1, gy = 3;
                const gxText = "-1", gyText = "3";
                const lineAE = "y = 3x + 6";
                const lineDF = "y = x + 4";
                const calcStep = "CG = \\sqrt{(-1)^2 + 3^2} = \\sqrt{10}";

                const cx = 0, cy = 0;
                const bx = -s, by = 0;
                const ax = -s, ay = s;
                const dx = 0, dy = s;

                const allX = [cx, bx, ax, dx, ex, fx, gx];
                const allY = [cy, by, ay, dy, ey, fy, gy];
                const minX = Math.min(...allX), maxX = Math.max(...allX);
                const minY = Math.min(...allY), maxY = Math.max(...allY);

                const svgW = 320, svgH = 240;
                const scale = Math.min((svgW - 80) / (maxX - minX || 1), (svgH - 80) / (maxY - minY || 1));
                const ox = svgW / 2 - ((minX + maxX) / 2) * scale;
                const oy = svgH / 2 + ((minY + maxY) / 2) * scale;
                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 320px;">` +
                               `<style>.svg-text { font-family: sans-serif; font-size: 10px; fill: #000; } .svg-bold { font-weight: bold; }</style>`;
                svgGraph += `<polygon points="${tx(ax)},${ty(ay)} ${tx(bx)},${ty(by)} ${tx(cx)},${ty(cy)} ${tx(dx)},${ty(dy)}" fill="#eef2f7" stroke="#333" stroke-width="1.5" />`;
                svgGraph += `<line x1="${tx(dx)}" y1="${ty(dy)}" x2="${tx(ex)}" y2="${ty(ey)}" stroke="#333" stroke-width="1.5" />`;
                svgGraph += `<line x1="${tx(bx)}" y1="${ty(by)}" x2="${tx(ex)}" y2="${ty(ey)}" stroke="#3498db" stroke-width="1.5" />`;
                svgGraph += `<line x1="${tx(ax)}" y1="${ty(ay)}" x2="${tx(fx)}" y2="${ty(fy)}" stroke="#e74c3c" stroke-width="1.5" />`;
                svgGraph += `<line x1="${tx(cx)}" y1="${ty(cy)}" x2="${tx(gx)}" y2="${ty(gy)}" stroke="#27ae60" stroke-width="2" />`;

                const pts = [
                    { name: "C", x: cx, y: cy, dx: 6, dy: 14, color: "#333" },
                    { name: "B", x: bx, y: by, dx: -16, dy: 14, color: "#333" },
                    { name: "A", x: ax, y: ay, dx: -16, dy: -6, color: "#333" },
                    { name: "D", x: dx, y: dy, dx: 6, dy: -6, color: "#333" },
                    { name: "E", x: ex, y: ey, dx: 6, dy: 4, color: "#333" },
                    { name: "F", x: fx, y: fy, dx: 6, dy: 4, color: "#333" },
                    { name: "G", x: gx, y: gy, dx: -16, dy: 4, color: "#e74c3c" }
                ];
                pts.forEach(pt => {
                    svgGraph += `<circle cx="${tx(pt.x)}" cy="${ty(pt.y)}" r="3.5" fill="${pt.color}"/>`;
                    svgGraph += `<text x="${tx(pt.x) + pt.dx}" y="${ty(pt.y) + pt.dy}" class="svg-text svg-bold" fill="${pt.color}">${pt.name}</text>`;
                });
                svgGraph += `</svg>`;

                let problemText = `正方形 \\(ABCD\\) がある。（左上が \\(A\\)、左下が \\(B\\)、右下が \\(C\\)、右上が \\(D\\) で、1辺の長さは \\(${s}\\)）<br>` +
                                  `\\(CD\\) の延長線上に \\(D\\) の方向（上側）へ \\(DE = 2CD\\) となる点 \\(E\\) をとる。<br>` +
                                  `\\(DE\\) の中点を \\(F\\) とし、\\(BE\\) と \\(AF\\) の交点を \\(G\\) とするとき、線分 \\(CG\\) の長さを求めなさい。<br>` + svgGraph;

                let explanationText = `【解説（図形の最終手段：座標・関数化）】<br>` +
                                      `1. <strong>座標の設定</strong><br>` +
                                      `・右下の頂点 \\(C\\) を原点 \\((0, 0)\\) とします。各頂点は \\(C(0,0)\\), \\(B(-2,0)\\), \\(A(-2,2)\\), \\(D(0,2)\\)。点 \\(E(0,6)\\)、中点 \\(F(0,4)\\)。<br><br>` +
                                      `2. <strong>直線の式と交点 G の算出</strong><br>` +
                                      `・直線 \\(BE\\) の式：\\(${lineAE}\\)<br>` +
                                      `・直線 \\(AF\\) の式：\\(${lineDF}\\)<br>` +
                                      `・連立して解くと、交点 \\(G\\) の座標は \\((${gxText}, ${gyText})\\) となります。<br><br>` +
                                      `3. <strong>三平方の定理で CG の長さを求める</strong><br>` +
                                      `  \\(${calcStep}\\)`;

                return { problem: problemText, explanation: explanationText };
            },

            // 3. 左方向への延長
            function() {
                const s = 2;
                const ex = -6, ey = 0;
                const fx = -4, fy = 0;
                const gx = -3, gy = 1;
                const gxText = "-3", gyText = "1";
                const lineAE = "y = \\frac{1}{3}x + 2";
                const lineDF = "y = x + 4";
                const calcStep = "CG = \\sqrt{(-3)^2 + 1^2} = \\sqrt{10}";

                const cx = 0, cy = 0;
                const bx = -s, by = 0;
                const ax = -s, ay = s;
                const dx = 0, dy = s;

                const allX = [cx, bx, ax, dx, ex, fx, gx];
                const allY = [cy, by, ay, dy, ey, fy, gy];
                const minX = Math.min(...allX), maxX = Math.max(...allX);
                const minY = Math.min(...allY), maxY = Math.max(...allY);

                const svgW = 320, svgH = 240;
                const scale = Math.min((svgW - 80) / (maxX - minX || 1), (svgH - 80) / (maxY - minY || 1));
                const ox = svgW / 2 - ((minX + maxX) / 2) * scale;
                const oy = svgH / 2 + ((minY + maxY) / 2) * scale;
                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 320px;">` +
                               `<style>.svg-text { font-family: sans-serif; font-size: 10px; fill: #000; } .svg-bold { font-weight: bold; }</style>`;
                svgGraph += `<polygon points="${tx(ax)},${ty(ay)} ${tx(bx)},${ty(by)} ${tx(cx)},${ty(cy)} ${tx(dx)},${ty(dy)}" fill="#eef2f7" stroke="#333" stroke-width="1.5" />`;
                svgGraph += `<line x1="${tx(bx)}" y1="${ty(by)}" x2="${tx(ex)}" y2="${ty(ey)}" stroke="#333" stroke-width="1.5" />`;
                svgGraph += `<line x1="${tx(dx)}" y1="${ty(dy)}" x2="${tx(ex)}" y2="${ty(ey)}" stroke="#3498db" stroke-width="1.5" />`;
                svgGraph += `<line x1="${tx(ax)}" y1="${ty(ay)}" x2="${tx(fx)}" y2="${ty(fy)}" stroke="#e74c3c" stroke-width="1.5" />`;
                svgGraph += `<line x1="${tx(cx)}" y1="${ty(cy)}" x2="${tx(gx)}" y2="${ty(gy)}" stroke="#27ae60" stroke-width="2" />`;

                const pts = [
                    { name: "C", x: cx, y: cy, dx: 6, dy: 14, color: "#333" },
                    { name: "B", x: bx, y: by, dx: -16, dy: 14, color: "#333" },
                    { name: "A", x: ax, y: ay, dx: -16, dy: -6, color: "#333" },
                    { name: "D", x: dx, y: dy, dx: 6, dy: -6, color: "#333" },
                    { name: "E", x: ex, y: ey, dx: -16, dy: 14, color: "#333" },
                    { name: "F", x: fx, y: fy, dx: -4, dy: 14, color: "#333" },
                    { name: "G", x: gx, y: gy, dx: 6, dy: -4, color: "#e74c3c" }
                ];
                pts.forEach(pt => {
                    svgGraph += `<circle cx="${tx(pt.x)}" cy="${ty(pt.y)}" r="3.5" fill="${pt.color}"/>`;
                    svgGraph += `<text x="${tx(pt.x) + pt.dx}" y="${ty(pt.y) + pt.dy}" class="svg-text svg-bold" fill="${pt.color}">${pt.name}</text>`;
                });
                svgGraph += `</svg>`;

                let problemText = `正方形 \\(ABCD\\) がある。（左上が \\(A\\)、左下が \\(B\\)、右下が \\(C\\)、右上が \\(D\\) で、1辺の長さは \\(${s}\\)）<br>` +
                                  `\\(BC\\) の延長線上に \\(B\\) の方向（左側）へ \\(BE = 2BC\\) となる点 \\(E\\) をとる。<br>` +
                                  `\\(BE\\) の中点を \\(F\\) とし、\\(DE\\) と \\(AF\\) の交点を \\(G\\) とするとき、線分 \\(CG\\) の長さを求めなさい。<br>` + svgGraph;

                let explanationText = `【解説（図形の最終手段：座標・関数化）】<br>` +
                                      `1. <strong>座標の設定</strong><br>` +
                                      `・右下の頂点 \\(C\\) を原点 \\((0, 0)\\) とします。各頂点は \\(C(0,0)\\), \\(B(-2,0)\\), \\(A(-2,2)\\), \\(D(0,2)\\)。点 \\(E(-6,0)\\)、中点 \\(F(-4,0)\\)。<br><br>` +
                                      `2. <strong>直線の式と交点 G の算出</strong><br>` +
                                      `・直線 \\(DE\\) の式：\\(${lineAE}\\)<br>` +
                                      `・直線 \\(AF\\) の式：\\(${lineDF}\\)<br>` +
                                      `・連立して解くと、交点 \\(G\\) の座標は \\((${gxText}, ${gyText})\\) となります。<br><br>` +
                                      `3. <strong>三平方の定理で CG の長さを求める</strong><br>` +
                                      `  \\(${calcStep}\\)`;

                return { problem: problemText, explanation: explanationText };
            },

            // 4. 下方向への延長
            function() {
                const s = 2;
                const ex = 0, ey = -4;
                const fx = 0, fy = -2;
                const gx = -1, gy = -1;
                const gxText = "-1", gyText = "-1";
                const lineAE = "y = -3x - 4";
                const lineDF = "y = -x - 2";
                const calcStep = "CG = \\sqrt{(-1)^2 + (-1)^2} = \\sqrt{2}";

                const cx = 0, cy = 0;
                const bx = -s, by = 0;
                const ax = -s, ay = s;
                const dx = 0, dy = s;

                const allX = [cx, bx, ax, dx, ex, fx, gx];
                const allY = [cy, by, ay, dy, ey, fy, gy];
                const minX = Math.min(...allX), maxX = Math.max(...allX);
                const minY = Math.min(...allY), maxY = Math.max(...allY);

                const svgW = 320, svgH = 260;
                const scale = Math.min((svgW - 80) / (maxX - minX || 1), (svgH - 80) / (maxY - minY || 1));
                const ox = svgW / 2 - ((minX + maxX) / 2) * scale;
                const oy = svgH / 2 + ((minY + maxY) / 2) * scale;
                const tx = (x) => ox + x * scale;
                const ty = (y) => oy - y * scale;

                let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 320px;">` +
                               `<style>.svg-text { font-family: sans-serif; font-size: 10px; fill: #000; } .svg-bold { font-weight: bold; }</style>`;
                svgGraph += `<polygon points="${tx(ax)},${ty(ay)} ${tx(bx)},${ty(by)} ${tx(cx)},${ty(cy)} ${tx(dx)},${ty(dy)}" fill="#eef2f7" stroke="#333" stroke-width="1.5" />`;
                svgGraph += `<line x1="${tx(cx)}" y1="${ty(cy)}" x2="${tx(ex)}" y2="${ty(ey)}" stroke="#333" stroke-width="1.5" />`;
                svgGraph += `<line x1="${tx(ax)}" y1="${ty(ay)}" x2="${tx(ex)}" y2="${ty(ey)}" stroke="#3498db" stroke-width="1.5" />`;
                svgGraph += `<line x1="${tx(bx)}" y1="${ty(by)}" x2="${tx(fx)}" y2="${ty(fy)}" stroke="#e74c3c" stroke-width="1.5" />`;
                svgGraph += `<line x1="${tx(cx)}" y1="${ty(cy)}" x2="${tx(gx)}" y2="${ty(gy)}" stroke="#27ae60" stroke-width="2" />`;

                const pts = [
                    { name: "C", x: cx, y: cy, dx: 6, dy: -6, color: "#333" },
                    { name: "B", x: bx, y: by, dx: -16, dy: 14, color: "#333" },
                    { name: "A", x: ax, y: ay, dx: -16, dy: -6, color: "#333" },
                    { name: "D", x: dx, y: dy, dx: 6, dy: -6, color: "#333" },
                    { name: "E", x: ex, y: ey, dx: 6, dy: 14, color: "#333" },
                    { name: "F", x: fx, y: fy, dx: 6, dy: 14, color: "#333" },
                    { name: "G", x: gx, y: gy, dx: 6, dy: -4, color: "#e74c3c" }
                ];
                pts.forEach(pt => {
                    svgGraph += `<circle cx="${tx(pt.x)}" cy="${ty(pt.y)}" r="3.5" fill="${pt.color}"/>`;
                    svgGraph += `<text x="${tx(pt.x) + pt.dx}" y="${ty(pt.y) + pt.dy}" class="svg-text svg-bold" fill="${pt.color}">${pt.name}</text>`;
                });
                svgGraph += `</svg>`;

                let problemText = `正方形 \\(ABCD\\) がある。（左上が \\(A\\)、左下が \\(B\\)、右下が \\(C\\)、右上が \\(D\\) で、1辺の長さは \\(${s}\\)）<br>` +
                                  `\\(CD\\) の延長線上に \\(C\\) の方向（下側）へ \\(CE = 2CD\\) となる点 \\(E\\) をとる。<br>` +
                                  `\\(CE\\) の中点を \\(F\\) とし、\\(AE\\) と \\(BF\\) の交点を \\(G\\) とするとき、線分 \\(CG\\) の長さを求めなさい。<br>` + svgGraph;

                let explanationText = `【解説（図形の最終手段：座標・関数化）】<br>` +
                                      `1. <strong>座標の設定</strong><br>` +
                                      `・右下の頂点 \\(C\\) を原点 \\((0, 0)\\) とします。各頂点は \\(C(0,0)\\), \\(B(-2,0)\\), \\(A(-2,2)\\), \\(D(0,2)\\)。点 \\(E(0,-4)\\)、中点 \\(F(0,-2)\\)。<br><br>` +
                                      `2. <strong>直線の式と交点 G の算出</strong><br>` +
                                      `・直線 \\(AE\\) の式：\\(${lineAE}\\)<br>` +
                                      `・直線 \\(BF\\) の式：\\(${lineDF}\\)<br>` +
                                      `・連立して解くと、交点 \\(G\\) の座標は \\((${gxText}, ${gyText})\\) となります。<br><br>` +
                                      `3. <strong>三平方の定理で CG の長さを求める</strong><br>` +
                                      `  \\(${calcStep}\\)`;

                return { problem: problemText, explanation: explanationText };
            }
        ];

        // ランダムにいずれかの方向のシナリオを選択して実行
        const selectedScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        return selectedScenario();
    }
}


    },
     
    "平面図形": {
       "多角形の対角線": {
    category: "平面図形",
    level: "基礎",
    formula: "<strong>【多角形の対角線】</strong><br>" +
             "・\\(n\\) 角形の対角線の本数は \\(\\frac{n(n-3)}{2}\\) 本<br><br>" +
             "<strong>【証明・考え方】</strong><br>" +
             "・\\(n\\) 角形の、ある頂点 \\(A\\) から対角線を引くとき、隣の頂点 \\(2\\) つと頂点 \\(A\\) 自身には引くことができないので、\\(1\\) つの頂点からは \\((n - 3)\\) 本の対角線が引けます。<br>" +
             "・\\(n\\) 個のすべての頂点から \\((n - 3)\\) 本ずつの対角線を引くと、全部で \\(n(n - 3)\\) 本となります。<br>" +
             "・しかし、この計算では \\(1\\) 本の対角線 \\(AB\\) について、「頂点 \\(A\\) から引いたもの」と「頂点 \\(B\\) から引いたもの」の \\(2\\) 回ずつ重複して数えていることになるため、全体を \\(2\\) で割って \\(\\frac{n(n - 3)}{2}\\) 本となります。",
    generateRandom: function() {
        // 数値を漢数字に変換するヘルパー関数
        const toKanjiNumber = (num) => {
            const digits = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
            if (num < 10) return digits[num];
            if (num === 10) return "十";
            if (num < 20) return "十" + digits[num % 10];
            const tens = Math.floor(num / 10);
            const ones = num % 10;
            return (tens > 1 ? digits[tens] : "") + "十" + (ones > 0 ? digits[ones] : "");
        };

        // パターン選択（0: n角形の対角線の総数を求める, 1: 対角線の本数から何角形か求める, 2: 1つの頂点から引ける本数から総数を求める）
        const pattern = Math.floor(Math.random() * 3);

        let problemText = "";
        let explanationText = "";

        if (pattern === 0) {
            // パターン0: 正n角形などの対角線の総数を求める
            const nList = [8, 10, 12, 14, 15, 18, 20];
            const n = nList[Math.floor(Math.random() * nList.length)];
            const totalDiag = (n * (n - 3)) / 2;
            const kanjiName = `${toKanjiNumber(n)}角形`;

            problemText = `${kanjiName}の対角線の総数を求めなさい。`;
            explanationText = `【解説】<br>` +
                              `1. <strong>対角線の総数を求める公式</strong> \\(\\frac{n(n-3)}{2}\\) を使います。<br>` +
                              `2. <strong>\\(n = ${n}\\) を公式に代入して計算します。</strong><br>` +
                              `　\\(\\frac{${n} \\times (${n} - 3)}{2} = \\frac{${n} \\times ${n - 3}}{2} = \\frac{${n * (n - 3)}}{2} = \\mathbf{${totalDiag}\\text{本}}\\) です。`;

        } else if (pattern === 1) {
            // パターン1: 対角線の本数から何角形か求める
            const nList = [7, 8, 9, 10, 12];
            const n = nList[Math.floor(Math.random() * nList.length)];
            const totalDiag = (n * (n - 3)) / 2;
            const kanjiName = `${toKanjiNumber(n)}角形`;

            problemText = `対角線の本数が \\(${totalDiag}\\) 本である多角形は何角形か求めなさい。`;
            explanationText = `【解説】<br>` +
                              `1. <strong>多角形の辺の数を \\(n\\) とすると、対角線の本数は \\(\\frac{n(n-3)}{2}\\) と表せます。</strong><br>` +
                              `2. <strong>方程式を立てて解きます。</strong><br>` +
                              `　\\(\\frac{n(n-3)}{2} = ${totalDiag}\\)<br>` +
                              `　\\(n(n-3) = ${totalDiag * 2}\\)<br>` +
                              `3. <strong>差が \\(3\\) で、かけ算すると \\(${totalDiag * 2}\\) になる整数の組み合わせを探します。</strong><br>` +
                              `　\\(${n} \\times (${n} - 3) = ${n} \\times ${n - 3} = ${totalDiag * 2}\\) より、\\(n = ${n}\\) となります。<br>` +
                              `したがって、求める図形は \\(\\mathbf{${kanjiName}}\\) です。`;

        } else {
            // パターン2: 1つの頂点から引ける対角線の本数から総数を求める
            const nList = [8, 10, 12, 14, 15];
            const n = nList[Math.floor(Math.random() * nList.length)];
            const fromOne = n - 3;
            const totalDiag = (n * (n - 3)) / 2;
            const kanjiName = `${toKanjiNumber(n)}角形`;

            problemText = `ある多角形の \\(1\\) つの頂点から引ける対角線の本数は \\(${fromOne}\\) 本である。この多角形の対角線の総数を求めなさい。`;
            explanationText = `【解説】<br>` +
                              `1. <strong>\\(1\\) つの頂点から引ける対角線の本数は \\(n - 3\\) 本なので、\\(n - 3 = ${fromOne}\\) より \\(n = ${n}\\)（${kanjiName}）とわかります。</strong><br>` +
                              `2. <strong>対角線の総数の公式 \\(\\frac{n(n-3)}{2}\\) に代入して計算します。</strong><br>` +
                              `　\\(\\frac{${n} \\times (${n} - 3)}{2} = \\frac{${n} \\times ${fromOne}}{2} = \\frac{${n * fromOne}}{2} = \\mathbf{${totalDiag}\\text{本}}\\) です。`;
        }

        return {
            problem: problemText,
            explanation: explanationText
        };
    }
},


"角度計算の基本": {
    category: "平面図形",
    level: "基礎",
    formula: "<strong>【角度計算の基本・重要な形】</strong><br>" +
             "複雑な図形の角度計算ではスリッパ型（外角の定理）や二等辺三角形が使われることが多いです。<br>" +
             "二等辺三角形を発見するために、等しい長さに印をつけましょう。<br><br>" +
             "<strong>⭐︎覚えるべき重要な形⭐︎</strong><br>" +
             "・<strong>スリッパ型（外角の定理）</strong>：鋭角三角形 \\(ABC\\) の線分 \\(BC\\) を \\(C\\) の方向に延長した点を \\(D\\) とするとき、\\(\\angle A = a^\\circ\\)、\\(\\angle B = b^\\circ\\)、\\(\\angle ACD = c^\\circ\\) とすると、\\(a + b = c\\) が成り立ちます。<br>" +
             '<div style="text-align:center; margin: 4px 0;">' +
             '<svg viewBox="0 0 130 70" style="background:#fff; border:1px solid #ddd; border-radius:4px; width:130px; height:70px; display:inline-block;">' +
             '<polygon points="25,55 75,55 45,18" fill="#eef2f7" stroke="#333" stroke-width="1.5"/>' +
             '<line x1="75" y1="55" x2="110" y2="55" stroke="#333" stroke-width="1.5"/>' +
             '<text x="43" y="14" font-size="9" font-weight="bold">A</text>' +
             '<text x="17" y="62" font-size="9" font-weight="bold">B</text>' +
             '<text x="73" y="62" font-size="9" font-weight="bold">C</text>' +
             '<text x="112" y="62" font-size="9" font-weight="bold">D</text>' +
             '<text x="43" y="31" font-size="8" font-weight="bold">a°</text>' +
             '<text x="34" y="51" font-size="8" font-weight="bold">b°</text>' +
             '<text x="82" y="49" font-size="8" font-weight="bold" fill="#e74c3c">c°</text>' +
             '</svg></div>' +
             "・<strong>ガ型</strong>：\\(a + b = c + d\\)<br>" +
             '<div style="text-align:center; margin: 4px 0;">' +
             '<svg viewBox="0 0 130 70" style="background:#fff; border:1px solid #ddd; border-radius:4px; width:130px; height:70px; display:inline-block;">' +
             '<polygon points="12,8 25,52 65,35" fill="#eef2f7" stroke="#333" stroke-width="1.5"/>' +
             '<polygon points="118,8 105,52 65,35" fill="#eef2f7" stroke="#333" stroke-width="1.5"/>' +
             '<text x="20" y="22" font-size="9" font-weight="bold">a</text>' +
             '<text x="28" y="45" font-size="9" font-weight="bold">b</text>' +
             '<text x="105" y="22" font-size="9" font-weight="bold">c</text>' +
             '<text x="94" y="45" font-size="9" font-weight="bold" fill="#e74c3c">d</text>' +
             '</svg></div>' +
             "・<strong>ブーメラン型（キツネ型）</strong>：\\(a + b + c = d\\)<br>" +
             '<div style="text-align:center; margin: 4px 0;">' +
             '<svg viewBox="0 0 140 90" style="background:#fff; border:1px solid #ddd; border-radius:4px; width:140px; height:90px; display:inline-block;">' +
             '<polygon points="70,10 20,70 70,48 120,70" fill="#eef2f7" stroke="#333" stroke-width="1.5"/>' +
             '<text x="70" y="25" font-size="8" font-weight="bold" text-anchor="middle">a</text>' +
             '<text x="35" y="58" font-size="8" font-weight="bold">b</text>' +
             '<text x="95" y="58" font-size="8" font-weight="bold">c</text>' +
             '<text x="70" y="58" font-size="8" font-weight="bold" fill="#e74c3c" text-anchor="middle">d</text>' +
             '</svg></div>',
    generateRandom: function() {
        const pattern = Math.floor(Math.random() * 3);

        let problemText = "";
        let explanationText = "";
        const noticePrefix = "<strong>あえて、図形に角度は書きません。図形を自分で書いて、角度を書きましょう。</strong><br><br>";

        // 点を指定した中心まわりに deg 度回転させるヘルパー関数
        const rotatePoint = (p, cx, cy, deg) => {
            const rad = deg * Math.PI / 180;
            const cos = Math.cos(rad), sin = Math.sin(rad);
            return {
                x: cx + (p.x - cx) * cos - (p.y - cy) * sin,
                y: cy + (p.x - cx) * sin + (p.y - cy) * cos
            };
        };

        // 重心から外側に向かう方向にラベルを配置するヘルパー関数
        const getOuterLabelPos = (p, cx, cy, offset = 18) => {
            const dx = p.x - cx;
            const dy = p.y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) return { x: p.x, y: p.y - offset };
            return {
                x: p.x + (dx / dist) * offset,
                y: p.y + (dy / dist) * offset
            };
        };

        // 動的viewBoxを計算するヘルパー関数
        const createDynamicSvg = (pointsArr, labelsArr) => {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            pointsArr.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            });
            labelsArr.forEach(l => {
                if (l.x - 15 < minX) minX = l.x - 15;
                if (l.x + 15 > maxX) maxX = l.x + 15;
                if (l.y - 15 < minY) minY = l.y - 15;
                if (l.y + 15 > maxY) maxY = l.y + 15;
            });

            const padding = 30;
            const vx = minX - padding;
            const vy = minY - padding;
            const vw = (maxX - minX) + padding * 2;
            const vh = (maxY - minY) + padding * 2;

            let svg = `<svg viewBox="${vx} ${vy} ${vw} ${vh}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 260px;">` +
                      `<style>.svg-text { font-family: sans-serif; font-size: 12px; fill: #000; font-weight: bold; }</style>`;
            return { svg };
        };

        const rotDeg = Math.floor(Math.random() * 360);

        if (pattern === 0) {
            // パターン0: スリッパ型
            const a = Math.floor(Math.random() * 41) + 25;
            const b = Math.floor(Math.random() * 41) + 25;
            const c = a + b;

            let pB = { x: 45, y: 110 };
            let pC = { x: 145, y: 110 };
            let pD = { x: 210, y: 110 };
            
            const radA = a * Math.PI / 180;
            const radB = b * Math.PI / 180;
            const radC = (180 - a - b) * Math.PI / 180;

            const lenAC = 100 * Math.sin(radB) / Math.sin(radA);
            let pA = {
                x: pC.x - lenAC * Math.cos(radC),
                y: pC.y - lenAC * Math.sin(radC)
            };

            const cx = (pB.x + pC.x + pA.x) / 3;
            const cy = (pB.y + pA.y) / 2;

            pA = rotatePoint(pA, cx, cy, rotDeg);
            pB = rotatePoint(pB, cx, cy, rotDeg);
            pC = rotatePoint(pC, cx, cy, rotDeg);
            pD = rotatePoint(pD, cx, cy, rotDeg);

            const vecCD = { x: pD.x - pC.x, y: pD.y - pC.y };
            const lenCD = Math.sqrt(vecCD.x * vecCD.x + vecCD.y * vecCD.y);
            if (lenCD > 0) {
                pD.x = pC.x + (vecCD.x / lenCD) * 65;
                pD.y = pC.y + (vecCD.y / lenCD) * 65;
            }

            const shapeCx = (pA.x + pB.x + pC.x) / 3;
            const shapeCy = (pA.y + pB.y + pC.y) / 3;

            const posA = getOuterLabelPos(pA, shapeCx, shapeCy, 16);
            const posB = getOuterLabelPos(pB, shapeCx, shapeCy, 16);
            const posC = getOuterLabelPos(pC, shapeCx, shapeCy, 16);
            const posD = { x: pD.x + (pD.x - pC.x) * 0.3, y: pD.y + (pD.y - pC.y) * 0.3 };

            const { svg } = createDynamicSvg([pA, pB, pC, pD], [posA, posB, posC, posD]);

            let svgGraph = svg +
                           `<polygon points="${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y}" fill="#eef2f7" stroke="#333" stroke-width="2" />` +
                           `<line x1="${pC.x}" y1="${pC.y}" x2="${pD.x}" y2="${pD.y}" stroke="#333" stroke-width="2" />` +
                           `<text x="${posA.x}" y="${posA.y}" class="svg-text" text-anchor="middle">A</text>` +
                           `<text x="${posB.x}" y="${posB.y}" class="svg-text" text-anchor="middle">B</text>` +
                           `<text x="${posC.x}" y="${posC.y}" class="svg-text" text-anchor="middle">C</text>` +
                           `<text x="${posD.x}" y="${posD.y}" class="svg-text" text-anchor="middle">D</text>` +
                           `</svg>`;

            problemText = noticePrefix +
                          `鋭角三角形 \\(ABC\\) の線分 \\(BC\\) を \\(C\\) の方向に延長した点を \\(D\\) とする。<br>` +
                          `\\(\\angle BAC = ${a}^\\circ\\)、\\(\\angle ABC = ${b}^\\circ\\) のとき、外角 \\(\\angle ACD\\) の大きさを求めなさい。<br>` + svgGraph;
            explanationText = `【解説】<br>` +
                              `1. <strong>スリッパ型（外角の定理）</strong>より、三角形の外角はそれと隣り合わない2つの内角の和に等しくなります。<br>` +
                              `2. <strong>\\(\\angle ACD = \\angle BAC + \\angle ABC\\) にあてはめます。</strong><br>` +
                              `　\\(\\angle ACD = ${a} + ${b} = \\mathbf{${c}^\\circ}\\) です。`;

        } else if (pattern === 1) {
            // パターン1: ガ型
            const a = Math.floor(Math.random() * 41) + 20;
            const b = Math.floor(Math.random() * 41) + 20;
            const c = Math.floor(Math.random() * 41) + 20;
            const d = (a + b) - c < 20 ? 20 : (a + b) - c;

            const baseE = { x: 120, y: 70 };
            
            const theta1 = -18 * Math.PI / 180;
            const theta2 =  35 * Math.PI / 180;

            const distA = 60 + a * 0.5;
            const distC = 60 + c * 0.5;
            const distB = 55 + b * 0.5;
            const distD = 55 + d * 0.5;

            let pA = { x: baseE.x + distA * Math.cos(theta1 + Math.PI), y: baseE.y + distA * Math.sin(theta1 + Math.PI) };
            let pC = { x: baseE.x + distC * Math.cos(theta1), y: baseE.y + distC * Math.sin(theta1) };
            let pB = { x: baseE.x + distB * Math.cos(theta2 + Math.PI), y: baseE.y + distB * Math.sin(theta2 + Math.PI) };
            let pD = { x: baseE.x + distD * Math.cos(theta2), y: baseE.y + distD * Math.sin(theta2) };

            const cx = baseE.x, cy = baseE.y;
            pA = rotatePoint(pA, cx, cy, rotDeg);
            pC = rotatePoint(pC, cx, cy, rotDeg);
            pB = rotatePoint(pB, cx, cy, rotDeg);
            pD = rotatePoint(pD, cx, cy, rotDeg);
            const pE = rotatePoint(baseE, cx, cy, rotDeg);

            const posA = getOuterLabelPos(pA, pE.x, pE.y, 16);
            const posB = getOuterLabelPos(pB, pE.x, pE.y, 16);
            const posE = { x: pE.x, y: pE.y - 12 };
            const posC = getOuterLabelPos(pC, pE.x, pE.y, 16);
            const posD = getOuterLabelPos(pD, pE.x, pE.y, 16);

            const { svg } = createDynamicSvg([pA, pB, pC, pD, pE], [posA, posB, posC, posD, posE]);

            let svgGraph = svg +
                           `<polygon points="${pA.x},${pA.y} ${pB.x},${pB.y} ${pE.x},${pE.y}" fill="#eef2f7" stroke="#333" stroke-width="2" />` +
                           `<polygon points="${pC.x},${pC.y} ${pD.x},${pD.y} ${pE.x},${pE.y}" fill="#eef2f7" stroke="#333" stroke-width="2" />` +
                           `<text x="${posA.x}" y="${posA.y}" class="svg-text" text-anchor="middle">A</text>` +
                           `<text x="${posB.x}" y="${posB.y}" class="svg-text" text-anchor="middle">B</text>` +
                           `<text x="${posE.x}" y="${posE.y}" class="svg-text" text-anchor="middle">E</text>` +
                           `<text x="${posC.x}" y="${posC.y}" class="svg-text" text-anchor="middle">C</text>` +
                           `<text x="${posD.x}" y="${posD.y}" class="svg-text" text-anchor="middle">D</text>` +
                           `</svg>`;

            problemText = noticePrefix +
                          `線分 \\(AC\\) と線分 \\(BD\\) が交点 \\(E\\) で交わる図形において、\\(\\angle BAE = ${a}^\\circ\\)、\\(\\angle ABE = ${b}^\\circ\\)、\\(\\angle CDE = ${c}^\\circ\\) のとき、\\(\\angle DCE\\) の大きさを求めなさい。<br>` + svgGraph;
            explanationText = `【解説】<br>` +
                              `1. <strong>対頂角と内角の関係</strong>（\\(\\angle BAE + \\angle ABE = \\angle CDE + \\angle DCE\\)）を使います。<br>` +
                              `2. <strong>方程式を立てて求めます。</strong><br>` +
                              `　\\(${a} + ${b} = ${c} + \\angle DCE\\)<br>` +
                              `　\\(${a + b} = ${c} + \\angle DCE\\)<br>` +
                              `　\\(\\angle DCE = ${a + b} - ${c} = \\mathbf{${d}^\\circ}\\) です。`;

        } else {
            // パターン2: ブーメラン型
            const a = Math.floor(Math.random() * 31) + 20;
            const b = Math.floor(Math.random() * 31) + 20;
            const c = Math.floor(Math.random() * 31) + 20;
            const d = a + b + c;

            let pB = { x: 120, y: 15 };
            let pA = { x: 35, y: 120 };
            let pC = { x: 205, y: 120 };

            const dHeightRatio = Math.max(0.35, Math.min(0.7, 0.8 - (d / 200)));
            const midX = (pA.x + pC.x) / 2;
            
            let pD = {
                x: midX + (Math.random() - 0.5) * 20,
                y: pB.y + (pA.y - pB.y) * dHeightRatio
            };

            const cx = 120, cy = 70;
            pA = rotatePoint(pA, cx, cy, rotDeg);
            pB = rotatePoint(pB, cx, cy, rotDeg);
            pC = rotatePoint(pC, cx, cy, rotDeg);
            pD = rotatePoint(pD, cx, cy, rotDeg);

            const shapeCx = (pA.x + pB.x + pC.x + pD.x) / 4;
            const shapeCy = (pA.y + pB.y + pC.y + pD.y) / 4;

            const posB = getOuterLabelPos(pB, shapeCx, shapeCy, 16);
            const posA = getOuterLabelPos(pA, shapeCx, shapeCy, 16);
            const posC = getOuterLabelPos(pC, shapeCx, shapeCy, 16);
            const posD = getOuterLabelPos(pD, shapeCx, shapeCy, -18);

            const { svg } = createDynamicSvg([pA, pB, pC, pD], [posA, posB, posC, posD]);

            let svgGraph = svg +
                           `<polygon points="${pB.x},${pB.y} ${pA.x},${pA.y} ${pD.x},${pD.y} ${pC.x},${pC.y}" fill="#eef2f7" stroke="#333" stroke-width="2" />` +
                           `<text x="${posB.x}" y="${posB.y}" class="svg-text" text-anchor="middle">B</text>` +
                           `<text x="${posA.x}" y="${posA.y}" class="svg-text" text-anchor="middle">A</text>` +
                           `<text x="${posC.x}" y="${posC.y}" class="svg-text" text-anchor="middle">C</text>` +
                           `<text x="${posD.x}" y="${posD.y}" class="svg-text" text-anchor="middle">D</text>` +
                           `</svg>`;

            problemText = noticePrefix +
                          `四角形 \\(ABCD\\) において、\\(\\angle DAB = ${a}^\\circ\\)、\\(\\angle ABC = ${b}^\\circ\\)、\\(\\angle BCD = ${c}^\\circ\\) のとき、\\(\\angle ADC\\) の大きさを求めなさい。<br>` + svgGraph;
            explanationText = `【解説】<br>` +
                              `1. <strong>へこんだ四角形の角の性質</strong>（\\(\\angle DAB + \\angle ABC + \\angle BCD = \\angle ADC\\)）を使います。<br>` +
                              `2. <strong>3つの角を足し合わせます。</strong><br>` +
                              `　\\(\\angle ADC = ${a} + ${b} + ${c} = \\mathbf{${d}^\\circ}\\) です。`;
        }

        return {
            problem: problemText,
            explanation: explanationText
        };
    }
},
"多角形の内角・外角の和": {
    category: "平面図形",
    level: "基礎",
    formula: "<strong>【多角形の内角・外角の和】</strong><br>" +
             "・\\(n\\) 角形の内角の和は \\(180^\\circ \\times (n - 2)\\)<br>" +
             "・どんな \\(n\\) 角形でも、外角の和は常に \\(360^\\circ\\)<br>" +
             "・正 \\(n\\) 角形の \\(1\\) つの外角は \\(\\frac{360^\\circ}{n}\\)、\\(1\\) つの内角は \\(180^\\circ - (1\\)つ\\(の\\)外角\)",
    generateRandom: function() {
        // 数値を漢数字に変換するヘルパー関数
        const toKanjiNumber = (num) => {
            const digits = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
            if (num < 10) return digits[num];
            if (num === 10) return "十";
            if (num < 20) return "十" + digits[num % 10];
            const tens = Math.floor(num / 10);
            const ones = num % 10;
            return (tens > 1 ? digits[tens] : "") + "十" + (ones > 0 ? digits[ones] : "");
        };

        // パターン選択（0: 正多角形の内角の和, 1: 外角から正n角形を求める, 2: 内角と外角の比から正n角形を求める, 3: 正ではない多角形の内角を求める）
        const pattern = Math.floor(Math.random() * 4);

        let problemText = "";
        let explanationText = "";

        if (pattern === 0) {
            // パターン0: 正二十角形など、正n角形の内角の和
            const nList = [10, 12, 15, 18, 20];
            const n = nList[Math.floor(Math.random() * nList.length)];
            const sumAngle = 180 * (n - 2);
            const kanjiName = `正${toKanjiNumber(n)}角形`;

            problemText = `${kanjiName}の内角の和を求めなさい。`;
            explanationText = `【解説】<br>` +
                              `1. <strong>多角形の内角の和の公式</strong> \\(180^\\circ \\times (n - 2)\\) を使います。<br>` +
                              `2. <strong>\\(n = ${n}\\) を公式に代入して計算します。</strong><br>` +
                              `　\\(180^\\circ \\times (${n} - 2) = 180^\\circ \\times ${n - 2} = \\mathbf{${sumAngle}^\\circ}\\) です。`;

        } else if (pattern === 1) {
            // パターン1: 1つの外角の大きさから正n角形を求める
            const exteriorAngles = [24, 30, 36, 40, 45];
            const ext = exteriorAngles[Math.floor(Math.random() * exteriorAngles.length)];
            const n = 360 / ext;
            const kanjiName = `正${toKanjiNumber(n)}角形`;

            problemText = `1 つの外角の大きさが \\(${ext}^\\circ\\) になる正多角形がある。正何角形かを求めなさい。`;
            explanationText = `【解説】<br>` +
                              `1. <strong>外角の和は常に \\(360^\\circ\\) です。</strong><br>` +
                              `2. <strong>\\(1\\) つの外角の大きさから辺の数 \\(n\\) を求めます。</strong><br>` +
                              `　\\(360^\\circ \\div ${ext}^\\circ = ${n}\\)<br>` +
                              `3. したがって、求める図形は \\(\\mathbf{${kanjiName}}\\) です。`;

        } else if (pattern === 2) {
            // パターン2: 1つの内角が外角の〇倍である正多角形
            const mults = [3, 4, 5, 7];
            const m = mults[Math.floor(Math.random() * mults.length)];
            const ext = 180 / (m + 1);
            const n = 2 * (m + 1);
            const kanjiName = `正${toKanjiNumber(n)}角形`;

            problemText = `1 つの内角の大きさが 1 つの外角の大きさの \\(${m}\\) 倍である正多角形を求めなさい。`;
            explanationText = `【解説】<br>` +
                              `1. <strong>外角の大きさを \\(x^\\circ\\) とすると、内角の大きさは \\(${m}x^\\circ\\) と表せます。</strong><br>` +
                              `2. <strong>内角と外角の和は \\(180^\\circ\\) なので、方程式を立てます。</strong><br>` +
                              `　\\(${m}x + x = 180^\\circ \\implies ${m+1}x = 180^\\circ \\implies x = ${ext}^\\circ\\)（外角）<br>` +
                              `3. <strong>外角の和 \\(360^\\circ\\) を \\(1\\) つの外角で割って辺の数 \\(n\\) を求めます。</strong><br>` +
                              `　\\(360^\\circ \\div ${ext}^\\circ = ${n}\\)<br>` +
                              `したがって、求める図形は \\(\\mathbf{${kanjiName}}\\) です。`;

        } else {
            // パターン3: 正ではない多角形（四角形や五角形の内角の未知の角を求める）
            const type = Math.random() < 0.5 ? "quad" : "penta";
            if (type === "quad") {
                const a = Math.floor(Math.random() * 30) + 60;
                const b = Math.floor(Math.random() * 30) + 70;
                const c = Math.floor(Math.random() * 30) + 80;
                const d = 360 - (a + b + c);

                problemText = `四角形の4つの内角のうち、3つの角の大きさがそれぞれ \\(${a}^\\circ\\)、\\(${b}^\\circ\\)、\\(${c}^\\circ\\) であるとき、残りの角の大きさを求めなさい。`;
                explanationText = `【解説】<br>` +
                                  `1. <strong>四角形の内角の和は \\(180^\\circ \\times (4 - 2) = 360^\\circ\\) です。</strong><br>` +
                                  `2. <strong>わかっている内角を足して \\(360^\\circ\\) から引きます。</strong><br>` +
                                  `　\\(360^\\circ - (${a}^\\circ + ${b}^\\circ + ${c}^\\circ)\\)<br>` +
                                  `　\\(= 360^\\circ - ${a+b+c}^\\circ = \\mathbf{${d}^\\circ}\\) です。`;
            } else {
                const angles = [95, 100, 110, 115, 120];
                const targetIdx = Math.floor(Math.random() * 5);
                const unknownAns = angles[targetIdx];
                let knownSum = 0;
                const knownAngles = angles.filter((val, idx) => {
                    if (idx === targetIdx) return false;
                    knownSum += val;
                    return true;
                });

                const formattedKnownAngles = knownAngles.map(v => `\\(${v}^\\circ\\)`).join("、");

                problemText = `五角形の5つの内角のうち、4つの角の大きさがそれぞれ ${formattedKnownAngles} であるとき、残りの角の大きさを求めなさい。`;
                explanationText = `【解説】<br>` +
                                  `1. <strong>五角形の内角の和は \\(180^\\circ \\times (5 - 2) = 540^\\circ\\) です。</strong><br>` +
                                  `2. <strong>すべての内角の和から、わかっている内角の合計を引きます。</strong><br>` +
                                  `　\\(540^\\circ - (${knownAngles.map(v => `${v}^\\circ`).join(" + ")})\\)<br>` +
                                  `　\\(= 540^\\circ - ${knownSum}^\\circ = \\mathbf{${unknownAns}^\\circ}\\) です。`;
            }
        }

        return {
            problem: problemText,
            explanation: explanationText
        };
    }
},

"三枚相似": {
    category: "平面図形",
    level: "公立",
    formula: "<strong>【直角三角形の3枚の相似】</strong><br>" +
             "直角三角形の直角の頂点から斜辺に垂線を下ろすと、3つの三角形（小・中・大）がすべて相似になります。<br>" +
             "対応関係が分かりにくくなるので、<strong>角度の印（丸やバツ）をつけるのがオススメ！</strong><br><br>" +
             '<div style="text-align:center; margin: 6px 0;">' +
             '<svg viewBox="0 0 320 190" style="background:#fff; border:1px solid #ddd; border-radius:4px; width:260px; height:150px; display:inline-block;">' +
             // 三角形 ABC (頂点Aが上、斜辺BCが水平)
             '<polygon points="130,30 40,150 280,150" fill="#eef2f7" stroke="#333" stroke-width="1.5"/>' +
             // 垂線 AH
             '<line x1="130" y1="30" x2="130" y2="150" stroke="#333" stroke-width="1.5" stroke-dasharray="3,3"/>' +
             // Aの直角マーク
             '<polyline points="121,41 130,50 139,40" fill="none" stroke="#333" stroke-width="1"/>' +
             // Hの直角マーク (BH側)
             '<rect x="121" y="141" width="9" height="9" fill="none" stroke="#333" stroke-width="1"/>' +
             // 角度マーク (○ と ×)
             '<text x="65" y="140" font-size="11" fill="#e74c3c" font-weight="bold">○</text>' + 
             '<text x="245" y="140" font-size="11" fill="#2980b9" font-weight="bold">×</text>' + 
             '<text x="110" y="58" font-size="11" fill="#2980b9" font-weight="bold">×</text>' + 
             '<text x="142" y="58" font-size="11" fill="#e74c3c" font-weight="bold">○</text>' + 
             // 頂点・線分ラベル
             '<text x="130" y="20" font-size="11" font-weight="bold" text-anchor="middle">A</text>' +
             '<text x="32" y="162" font-size="11" font-weight="bold">B</text>' +
             '<text x="286" y="162" font-size="11" font-weight="bold">C</text>' +
             '<text x="130" y="168" font-size="11" font-weight="bold" text-anchor="middle">H</text>' +
             '<text x="78" y="85" font-size="10" font-weight="bold">a</text>' +
             '<text x="205" y="85" font-size="10" font-weight="bold">b</text>' +
             '<text x="136" y="95" font-size="10" font-weight="bold" fill="#e74c3c">h</text>' +
             '<text x="85" y="163" font-size="10" font-weight="bold" text-anchor="middle">x</text>' +
             '<text x="205" y="163" font-size="10" font-weight="bold" text-anchor="middle">y</text>' +
             '<text x="160" y="182" font-size="11" font-weight="bold" fill="#333" text-anchor="middle">c (斜辺)</text>' +
             '</svg></div>' +
             "<strong>⭐︎覚えるべき重要関係式⭐︎</strong><br>" +
             "① ab = ch （面積の利用）<br>" +
             "② h² = xy （相似比より x：h ＝ h：y）<br>" +
             "③ a² : b² = x : y （相似比²の面積比 ＝ 高さの等しい△の底辺比）",
    generateRandom: function() {
        const subPattern = Math.floor(Math.random() * 6); // 0〜5の6パターン
        
        let problemText = "";
        let explanationText = "";
        let xVal = 9, yVal = 16; // デフォルト比率用

        if (subPattern === 0) {
            // パターン0: h^2 = xy であえてルートが残る数値も含めるランダム
            const pairs = [
                { x: 2, y: 8, hStr: "4", hVal: 4 },
                { x: 3, y: 12, hStr: "6", hVal: 6 },
                { x: 2, y: 5, hStr: "\\sqrt{10}", hVal: Math.sqrt(10) },
                { x: 3, y: 5, hStr: "\\sqrt{15}", hVal: Math.sqrt(15) },
                { x: 4, y: 9, hStr: "6", hVal: 6 },
                { x: 5, y: 10, hStr: "5\\sqrt{2}", hVal: 5*Math.sqrt(2) }
            ];
            const d = pairs[Math.floor(Math.random() * pairs.length)];
            xVal = d.x; yVal = d.y;

            problemText = "直角三角形 \\(ABC\\) （\\(\\angle BAC = 90^\\circ\\)）の頂点 \\(A\\) から斜辺 \\(BC\\) に垂線 \\(AH\\) を下ろす。<br>" +
                          "\\(BH = " + d.x + "\\)、\\(CH = " + d.y + "\\) のとき、線分 \\(AH\\) の長さを求めなさい。";

            explanationText = "【解説】<br>" +
                              "1. <strong>\\(h^2 = xy\\)</strong> の関係（\\(x : h = h : y\\)）を使います。<br>" +
                              "2. 対応する辺の比の式を立てます：<br>" +
                              "　\\(BH : AH = AH : CH\\)<br>" +
                              "3. 長さを代入して式を解きます：<br>" +
                              "　\\(" + d.x + " : AH = AH : " + d.y + "\\)<br>" +
                              "　\\(AH^2 = " + d.x + " \\times " + d.y + " = " + (d.x * d.y) + "\\)<br>" +
                              "4. \\(AH > 0\\) より、\\(AH = \\mathbf{" + d.hStr + "}\\) です。";
        } else if (subPattern === 1) {
            // パターン1: a^2 = cx を使うランダム
            const xList = [2, 3, 4, 5];
            const yList = [6, 8, 9, 12];
            const x = xList[Math.floor(Math.random() * xList.length)];
            const y = yList[Math.floor(Math.random() * yList.length)];
            const c = x + y;
            xVal = x; yVal = y;
            
            const prod = c * x;
            // 簡易的なルート簡約判定
            let aStr = "";
            if (prod === 16) aStr = "4";
            else if (prod === 20) aStr = "2\\sqrt{5}";
            else if (prod === 24) aStr = "2\\sqrt{6}";
            else if (prod === 27) aStr = "3\\sqrt{3}";
            else if (prod === 32) aStr = "4\\sqrt{2}";
            else if (prod === 36) aStr = "6";
            else if (prod === 40) aStr = "2\\sqrt{10}";
            else if (prod === 45) aStr = "3\\sqrt{5}";
            else if (prod === 48) aStr = "4\\sqrt{3}";
            else if (prod === 54) aStr = "3\\sqrt{6}";
            else if (prod === 64) aStr = "8";
            else aStr = "\\sqrt{" + prod + "}";

            problemText = "直角三角形 \\(ABC\\) （\\(\\angle BAC = 90^\\circ\\)）の頂点 \\(A\\) から斜辺 \\(BC\\) に垂線 \\(AH\\) を下ろす。<br>" +
                          "\\(BH = " + x + "\\)、\\(CH = " + y + "\\) のとき、線分 \\(AB\\) （\\(a\\)）の長さを求めなさい。";

            explanationText = "【解説】<br>" +
                              "1. 全体の斜辺 \\(BC = BH + CH = " + x + " + " + y + " = " + c + "\\) です。<br>" +
                              "2. <strong>\\(a^2 = cx\\)</strong> の関係（\\(BC : AB = AB : BH\\)）を使います。<br>" +
                              "3. 対応する辺の比の式を立てます：<br>" +
                              "　\\(BC : AB = AB : BH\\)<br>" +
                              "4. 長さを代入して式を解きます：<br>" +
                              "　\\(" + c + " : AB = AB : " + x + "\\)<br>" +
                              "　\\(AB^2 = " + c + " \\times " + x + " = " + prod + "\\)<br>" +
                              "5. \\(AB > 0\\) より、\\(AB = \\mathbf{" + aStr + "}\\) です。";
        } else if (subPattern === 2) {
            // パターン2: b^2 = cy を使うランダム
            const xList = [2, 3, 4, 5];
            const yList = [6, 8, 9, 12];
            const x = xList[Math.floor(Math.random() * xList.length)];
            const y = yList[Math.floor(Math.random() * yList.length)];
            const c = x + y;
            xVal = x; yVal = y;

            const prod = c * y;
            let bStr = "";
            if (prod === 36) bStr = "6";
            else if (prod === 40) bStr = "2\\sqrt{10}";
            else if (prod === 45) bStr = "3\\sqrt{5}";
            else if (prod === 48) bStr = "4\\sqrt{3}";
            else if (prod === 54) bStr = "3\\sqrt{6}";
            else if (prod === 64) bStr = "8";
            else if (prod === 72) bStr = "6\\sqrt{2}";
            else if (prod === 80) bStr = "4\\sqrt{5}";
            else if (prod === 96) bStr = "4\\sqrt{6}";
            else if (prod === 100) bStr = "10";
            else if (prod === 108) bStr = "6\\sqrt{3}";
            else if (prod === 144) bStr = "12";
            else bStr = "\\sqrt{" + prod + "}";

            problemText = "直角三角形 \\(ABC\\) （\\(\\angle BAC = 90^\\circ\\)）の頂点 \\(A\\) から斜辺 \\(BC\\) に垂線 \\(AH\\) を下ろす。<br>" +
                          "\\(BH = " + x + "\\)、\\(CH = " + y + "\\) のとき、線分 \\(AC\\) （\\(b\\)）の長さを求めなさい。";

            explanationText = "【解説】<br>" +
                              "1. 全体の斜辺 \\(BC = BH + CH = " + x + " + " + y + " = " + c + "\\) です。<br>" +
                              "2. <strong>\\(b^2 = cy\\)</strong> の関係（\\(BC : AC = AC : CH\\)）を使います。<br>" +
                              "3. 対応する辺の比の式を立てます：<br>" +
                              "　\\(BC : AC = AC : CH\\)<br>" +
                              "4. 長さを代入して式を解きます：<br>" +
                              "　\\(" + c + " : AC = AC : " + y + "\\)<br>" +
                              "　\\(AC^2 = " + c + " \\times " + y + " = " + prod + "\\)<br>" +
                              "5. \\(AC > 0\\) より、\\(AC = \\mathbf{" + bStr + "}\\) です。";
        } else if (subPattern === 3) {
            // パターン3: 面積比 (BH : CH)
            const xList = [2, 3, 4, 5, 7];
            const yList = [3, 4, 5, 8, 9];
            const x = xList[Math.floor(Math.random() * xList.length)];
            const y = yList[Math.floor(Math.random() * yList.length)];
            xVal = x; yVal = y;

            problemText = "直角三角形 \\(ABC\\) （\\(\\angle BAC = 90^\\circ\\)）の頂点 \\(A\\) から斜辺 \\(BC\\) に垂線 \\(AH\\) を下ろす。<br>" +
                          "\\(BH = " + x + "\\)、\\(CH = " + y + "\\) のとき、三角形 \\(ABH\\) と三角形 \\(ACH\\) の面積比 \\(\\triangle ABH : \\triangle ACH\\) をもっとも簡単な整数の比で求めなさい。";

            explanationText = "【解説】<br>" +
                              "1. 2つの三角形 \\(\\triangle ABH\\) と \\(\\triangle ACH\\) は、頂点 \\(A\\) から引いた垂線 \\(AH\\) を共通の高さとする、底辺が \\(BH\\)、\\(CH\\) の三角形です。<br>" +
                              "2. <strong>高さの等しい三角形の面積比は、底辺の比に等しくなります。</strong><br>" +
                              "3. したがって、面積比は \\(BH : CH\\) となり、<br>" +
                              "　\\(\\triangle ABH : \\triangle ACH = \\mathbf{" + x + " : " + y + "}\\) です。";
        } else if (subPattern === 4) {
            // パターン4: 辺の比から面積比
            const pairs = [
                { a: 2, b: 3, a2: 4, b2: 9 },
                { a: 3, b: 4, a2: 9, b2: 16 },
                { a: 1, b: 2, a2: 1, b2: 4 },
                { a: 3, b: 5, a2: 9, b2: 25 }
            ];
            const p = pairs[Math.floor(Math.random() * pairs.length)];
            xVal = p.a2; yVal = p.b2;

            problemText = "直角三角形 \\(ABC\\) （\\(\\angle BAC = 90^\\circ\\)）において、\\(AB : AC = " + p.a + " : " + p.b + "\\) である。頂点 \\(A\\) から斜辺 \\(BC\\) に垂線 \\(AH\\) を下ろすとき、三角形 \\(ABH\\) と三角形 \\(ACH\\) の面積比 \\(\\triangle ABH : \\triangle ACH\\) をもっとも簡単な整数の比で求めなさい。";

            explanationText = "【解説】<br>" +
                              "1. 三角形 \\(ABH\\) と三角形 \\(ACH\\) の相似比は、対応する辺の比 \\(AB : AC = " + p.a + " : " + p.b + "\\) です。<br>" +
                              "2. <strong>相似な図形の面積比は、相似比の2乗に等しくなります。</strong><br>" +
                              "3. したがって、面積比は \\(AB^2 : AC^2 = " + p.a + "^2 : " + p.b + "^2 = \\mathbf{" + p.a2 + " : " + p.b2 + "}\\) となります。";
        } else {
            // パターン5: ab = ch (面積の利用)
            const hList = [4, 6, 8, 10];
            const h = hList[Math.floor(Math.random() * hList.length)];
            const a = h + 2, b = h + 4; // ざっくりとした数値設定
            xVal = 9; yVal = 16;

            problemText = "直角三角形 \\(ABC\\) （\\(\\angle BAC = 90^\\circ\\)）において、\\(AB = " + (h*5/3).toFixed(0) + "\\)、\\(AC = " + (h*5/4).toFixed(0) + "\\) のとき、面積の利用等を用いて計算を工夫してみましょう。";
            
            explanationText = "【解説】<br>" +
                              "1. 三角形 \\(ABC\\) の面積を \\(2\\) 通りの底辺と高さの組み合わせで表します。<br>" +
                              "2. 公式 <strong>\\(ab = ch\\)</strong> を利用して各長さを求めます。";
        }

        // 長さに応じて動的にHの位置（X座標）を計算するロジック
        const totalW = 240; 
        const startX = 40;
        const hX = startX + totalW * (xVal / (xVal + yVal));
        const aX = hX;
        const aY = 35;
        const bX = startX, bY = 155;
        const cX = startX + totalW, cY = 155;

        const problemSvg = '<div style="text-align:center; margin: 8px 0;">' +
                           '<svg viewBox="0 0 320 190" style="background:#fff; border:1px solid #ddd; border-radius:4px; width:260px; height:150px; display:inline-block;">' +
                           '<polygon points="' + aX + ',' + aY + ' ' + bX + ',' + bY + ' ' + cX + ',' + cY + '" fill="#eef2f7" stroke="#333" stroke-width="1.5"/>' +
                           '<line x1="' + aX + '" y1="' + aY + '" x2="' + hX + '" y2="' + cY + '" stroke="#333" stroke-width="1.5" stroke-dasharray="3,3"/>' +
                           '<polyline points="' + (aX-7) + ',' + (aY+9) + ' ' + aX + ',' + (aY+16) + ' ' + (aX+7) + ',' + (aY+9) + '" fill="none" stroke="#333" stroke-width="1"/>' +
                           '<rect x="' + (hX-4) + '" y="' + (cY-9) + '" width="9" height="9" fill="none" stroke="#333" stroke-width="1"/>' +
                           '<text x="' + aX + '" y="' + (aY-8) + '" font-size="11" font-weight="bold" text-anchor="middle">A</text>' +
                           '<text x="' + (bX-8) + '" y="' + (bY+16) + '" font-size="11" font-weight="bold" text-anchor="middle">B</text>' +
                           '<text x="' + (cX+8) + '" y="' + (cY+16) + '" font-size="11" font-weight="bold" text-anchor="middle">C</text>' +
                           '<text x="' + hX + '" y="' + (cY+18) + '" font-size="11" font-weight="bold" text-anchor="middle">H</text>' +
                           '</svg></div>';

        return {
            problem: problemText + "<br>" + problemSvg,
            explanation: explanationText
        };
    }
},
"正五角形と黄金比": {
    category: "平面図形",
    level: "難関私立",
    formula: "<strong>【正五角形と黄金比】</strong><br>" +
             "正五角形内に対角線を結んだとき、その内部に出てくる角度は \\(36^\\circ\\)、\\(72^\\circ\\)、\\(108^\\circ\\) しか出てきません。<br>" +
             "\\(36^\\circ\\) と \\(72^\\circ\\) で構成された二等辺三角形は、短辺：長辺の比が \\(2 : 1+\\sqrt{5}\\)（黄金比）となります。<br><br>" +
             '<div style="text-align:center; margin: 6px 0;">' +
             '<svg viewBox="0 0 240 230" style="background:#fff; border:1px solid #ddd; border-radius:4px; width:200px; height:190px; display:inline-block;">' +
             // 正五角形
             '<polygon points="120,25 205,87 173,193 67,193 35,87" fill="#eef2f7" stroke="#333" stroke-width="1.5"/>' +
             // 対角線 AC, AD, BE
             '<line x1="120" y1="25" x2="173" y2="193" stroke="#e74c3c" stroke-width="1.2"/>' +
             '<line x1="120" y1="25" x2="67" y2="193" stroke="#e74c3c" stroke-width="1.2"/>' +
             '<line x1="205" y1="87" x2="35" y2="87" stroke="#2980b9" stroke-width="1.2"/>' +
             // 交点 F
             '<circle cx="139" cy="87" r="3" fill="#333"/>' +
             // ラベル
             '<text x="120" y="17" font-size="11" font-weight="bold" text-anchor="middle">A</text>' +
             '<text x="214" y="87" font-size="11" font-weight="bold">B</text>' +
             '<text x="178" y="208" font-size="11" font-weight="bold">C</text>' +
             '<text x="53" y="208" font-size="11" font-weight="bold">D</text>' +
             '<text x="20" y="87" font-size="11" font-weight="bold">E</text>' +
             '<text x="145" y="79" font-size="11" font-weight="bold" fill="#c0392b">F</text>' +
             '</svg></div>' +
             "<strong>【証明のポイント】</strong><br>" +
             "等しい角度を利用して \\(\\triangle ABC \\sim \\triangle AFB\\) を示します。<br>" +
             "正五角形の1辺を \\(2\\)、\\(AC = x\\) とすると、\\(CF = CB = 2\\) より \\(AF = x - 2\\)。<br>" +
             "相似比より \\(2 : (x - 2) = x : 2 \\implies x^2 - 2x - 4 = 0\\)。<br>" +
             "これを解くと \\(x = 1 \\pm \\sqrt{5}\\)。\\(x > 0\\) より \\(x = 1 + \\sqrt{5}\\) となります。",
    generateRandom: function() {
        const bcValues = [2, 4, 6];
        const bc = bcValues[Math.floor(Math.random() * bcValues.length)];
        
        const k = bc / 2;
        let ansStr = "";
        if (k === 1) {
            ansStr = "1 + \\sqrt{5}";
        } else {
            ansStr = k + " + " + k + "\\sqrt{5}";
        }

        const problemText = "\\(AB = AC\\)、\\(AD = BD = BC\\) である三角形 \\(ABC\\) がある。<br>" +
                          "\\(BC = " + bc + "\\) のとき、\\(AB\\) の長さを求めなさい。";

        const explanationText = "【解説】<br>" +
                              "1. <strong>図形の性質と相似関係</strong>：<br>" +
                              "　\\(AD = BD = BC\\) より、\\(\\triangle BCD\\) および \\(\\triangle ABD\\) の辺の長さを整理すると、<br>" +
                              "　\\(\\triangle ABC \\sim \\triangle BCD\\) （頂角 \\(36^\\circ\\)、底角 \\(72^\\circ\\) の二等辺三角形）となります。<br>" +
                              "2. <strong>各線分の長さの設定</strong>：<br>" +
                              "　\\(AB = AC = x\\) とおきます。<br>" +
                              "　\\(CD = AC - AD = x - " + bc + "\\) と表せます（\\(AD = BC = " + bc + "\\)）。<br>" +
                              "3. <strong>相似比の利用</strong>：<br>" +
                              "　\\(AB : BC = BC : CD\\)<br>" +
                              "　\\(x : " + bc + " = " + bc + " : (x - " + bc + ")\\)<br>" +
                              "　\\(x(x - " + bc + ") = " + (bc * bc) + "\\)<br>" +
                              "　\\(x^2 - " + bc + "x - " + (bc * bc) + " = 0\\)<br>" +
                              "4. <strong>二次方程式を解く</strong>：<br>" +
                              "　解の公式より \\(x = \\mathbf{" + ansStr + "}\\) （\\(x > 0\\)）となります。";

        const problemSvg = '<div style="text-align:center; margin: 8px 0;">' +
                           '<svg viewBox="0 0 240 210" style="background:#fff; border:1px solid #ddd; border-radius:4px; width:200px; height:175px; display:inline-block;">' +
                           '<polygon points="120,26 70,180 170,180" fill="#eef2f7" stroke="#333" stroke-width="1.5"/>' +
                           '<line x1="70" y1="180" x2="151" y2="121" stroke="#e74c3c" stroke-width="1.5"/>' +
                           '<text x="120" y="18" font-size="11" font-weight="bold" text-anchor="middle">A</text>' +
                           '<text x="58" y="192" font-size="11" font-weight="bold">B</text>' +
                           '<text x="178" y="192" font-size="11" font-weight="bold">C</text>' +
                           '<text x="160" y="120" font-size="11" font-weight="bold" fill="#c0392b">D</text>' +
                           '</svg></div>';

        return {
            problem: problemText + "<br>" + problemSvg,
            explanation: explanationText
        };
    }
},
        "比合わせと連比": {
            category: "平面図形",
            level: "公式",
            formula: "<strong>a：b：c</strong> のように 3 つ以上の項がある場合の比を<strong>連比</strong>という。<br>" +
                     "平行線の問題において連比を求めることも多い。同じ線分が2種類の比で表される時、合計をそろえることで比をそろえる<strong>比合わせ</strong>ができる。<br><br>" +
                     "<strong>※1つの図形の中に書き込むとごちゃごちゃするので一度、線分を抜き出そう！</strong>",
            generateRandom: function() {
                // ユークリッドの互除法（最大公約数・最小公倍数・約分用）
                function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
                function lcm(a, b) { return (a * b) / gcd(a, b); }
                function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
                function simplifyPair(a, b) { const g = gcd(a, b); return [a / g, b / g]; }
                function simplifyTriple(a, b, c) { const g = gcd(gcd(a, b), c); return [a / g, b / g, c / g]; }

                // 線分交点の厳密計算（SVG描画用）
                function getIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
                    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
                    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
                    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
                }

                // 0: 異なる頂点から引く場合, 1: 同じ頂点から引く場合
                const subType = Math.floor(Math.random() * 2);
                
                // 1〜5の整数からランダムな比を生成（約分して既約比にする）
                const [m1, n1] = simplifyPair(randInt(1, 5), randInt(1, 5));
                const [m2, n2] = simplifyPair(randInt(1, 5), randInt(1, 5));
                
                // 平行四辺形の基準座標: A(50,30), B(170,30), C(200,110), D(80,110)
                const A = { x: 50, y: 30 }, B = { x: 170, y: 30 }, C = { x: 200, y: 110 }, D = { x: 80, y: 110 };

                let problemText = "";
                let explanationText = "";
                let problemSvg = "";
                
                if (subType === 0) {
                    const diag = Math.random() < 0.5 ? 'BD' : 'AC';
                    
                    if (diag === 'BD') {
                        // 対角線 BD: EはBCを m1:n1 に分ける、FはADを m2:n2 に分ける
                        const tE = m1 / (m1 + n1);
                        const E = { x: B.x + tE * (C.x - B.x), y: B.y + tE * (C.y - B.y) };
                        const tF = m2 / (m2 + n2);
                        const F = { x: A.x + tF * (D.x - A.x), y: A.y + tF * (D.y - A.y) };

                        // AEとBDの交点P, CFとBDの交点Q
                        const P = getIntersect(A.x, A.y, E.x, E.y, B.x, B.y, D.x, D.y);
                        const Q = getIntersect(C.x, C.y, F.x, F.y, B.x, B.y, D.x, D.y);

                        // BP : PD = m1 : (m1 + n1) -> 合計 S1 = 2*m1 + n1
                        // BQ : QD = (m2 + n2) : n2 -> 合計 S2 = m2 + 2*n2
                        const bp1 = m1, pd1 = m1 + n1, S1 = bp1 + pd1;
                        const bq2 = m2 + n2, qd2 = n2, S2 = bq2 + qd2;
                        const L = lcm(S1, S2);
                        const mult1 = L / S1, mult2 = L / S2;

                        const bp = bp1 * mult1;
                        const bq = bq2 * mult2;
                        const qd = qd2 * mult2;
                        const pq = bq - bp;
                        const [ans1, ans2, ans3] = simplifyTriple(bp, pq, qd);

                        problemText = "右の図の平行四辺形 \\(ABCD\\) において、点 \\(E\\) は辺 \\(BC\\) を \\(" + m1 + ":" + n1 + "\\) に分ける点、点 \\(F\\) は辺 \\(AD\\) を \\(" + m2 + ":" + n2 + "\\) に分ける点である。<br>" +
                                      "対角線 \\(BD\\) と線分 \\(AE\\) の交点を \\(P\\)、線分 \\(CF\\) との交点を \\(Q\\) とするとき、比 \\(BP : PQ : QD\\) を最も簡単な整数の比で求めなさい。";
                        
                        explanationText = "【解説】<br>" +
                                          "1. <strong>相似を利用して対角線の分割比を求める</strong>：<br>" +
                                          "　・\\(\\triangle BPE \\sim \\triangle DPA\\) より \\(BP : PD = BE : AD = " + bp1 + " : " + pd1 + "\\)（合計 \\(" + S1 + "\\)）<br>" +
                                          "　・\\(\\triangle DQF \\sim \\triangle BQC\\) より \\(BQ : QD = BC : DF = " + bq2 + " : " + qd2 + "\\)（合計 \\(" + S2 + "\\)）<br>" +
                                          "2. <strong>比合わせ（最小公倍数 \\(" + L + "\\) でそろえる）</strong>：<br>" +
                                          "　・\\(BP : PD = " + bp + " : " + (pd1 * mult1) + "\\)<br>" +
                                          "　・\\(BQ : QD = " + bq + " : " + qd + "\\)<br>" +
                                          "3. よって \\(BP : PQ : QD = " + bp + " : (" + bq + " - " + bp + ") : " + qd + " = \\mathbf{" + ans1 + " : " + ans2 + " : " + ans3 + "}\\) となります。";
                                          
                        problemSvg = '<div style="text-align:center; margin: 8px 0;">' +
                                     '<svg viewBox="0 0 220 140" style="background:#fff; border:1px solid #ddd; border-radius:4px; width:190px; height:120px; display:inline-block;">' +
                                     '<polygon points="50,30 170,30 200,110 80,110" fill="#eef2f7" stroke="#333" stroke-width="1.5"/>' +
                                     '<line x1="170" y1="30" x2="80" y2="110" stroke="#333" stroke-width="1.2" stroke-dasharray="3,3"/>' +
                                     '<line x1="' + A.x + '" y1="' + A.y + '" x2="' + E.x + '" y2="' + E.y + '" stroke="#2980b9" stroke-width="1.3"/>' +
                                     '<line x1="' + C.x + '" y1="' + C.y + '" x2="' + F.x + '" y2="' + F.y + '" stroke="#e74c3c" stroke-width="1.3"/>' +
                                     '<circle cx="' + P.x + '" cy="' + P.y + '" r="2.2" fill="#333"/>' +
                                     '<circle cx="' + Q.x + '" cy="' + Q.y + '" r="2.2" fill="#333"/>' +
                                     '<text x="40" y="25" font-size="10" font-weight="bold">A</text>' +
                                     '<text x="175" y="25" font-size="10" font-weight="bold">B</text>' +
                                     '<text x="208" y="120" font-size="10" font-weight="bold">C</text>' +
                                     '<text x="70" y="120" font-size="10" font-weight="bold">D</text>' +
                                     '<text x="' + (E.x + 6) + '" y="' + (E.y + 3) + '" font-size="10" font-weight="bold" fill="#2980b9">E</text>' +
                                     '<text x="' + (F.x - 12) + '" y="' + (F.y + 3) + '" font-size="10" font-weight="bold" fill="#e74c3c">F</text>' +
                                     '<text x="' + (P.x - 4) + '" y="' + (P.y - 6) + '" font-size="9" font-weight="bold">P</text>' +
                                     '<text x="' + (Q.x + 4) + '" y="' + (Q.y + 10) + '" font-size="9" font-weight="bold">Q</text>' +
                                     '</svg></div>';
                    } else {
                        // 対角線 AC: FはABを m1:n1 に分ける、EはCDを m2:n2 に分ける（A側がP、C側がQ）
                        const tF = m1 / (m1 + n1);
                        const F = { x: A.x + tF * (B.x - A.x), y: A.y + tF * (B.y - A.y) };
                        const tE = m2 / (m2 + n2);
                        const E = { x: C.x + tE * (D.x - C.x), y: C.y + tE * (D.y - C.y) };

                        // DFとACの交点P, BEとACの交点Q
                        const P = getIntersect(D.x, D.y, F.x, F.y, A.x, A.y, C.x, C.y);
                        const Q = getIntersect(B.x, B.y, E.x, E.y, A.x, A.y, C.x, C.y);

                        // AP : PC = m1 : (m1 + n1) -> 合計 S1 = 2*m1 + n1
                        // AQ : QC = (m2 + n2) : m2 -> 合計 S2 = 2*m2 + n2
                        const ap1 = m1, pc1 = m1 + n1, S1 = ap1 + pc1;
                        const aq2 = m2 + n2, qc2 = m2, S2 = aq2 + qc2;
                        const L = lcm(S1, S2);
                        const mult1 = L / S1, mult2 = L / S2;

                        const ap = ap1 * mult1;
                        const aq = aq2 * mult2;
                        const qc = qc2 * mult2;
                        const pq = aq - ap;
                        const [ans1, ans2, ans3] = simplifyTriple(ap, pq, qc);

                        problemText = "右の図の平行四辺形 \\(ABCD\\) において、点 \\(F\\) は辺 \\(AB\\) を \\(" + m1 + ":" + n1 + "\\) に分ける点、点 \\(E\\) は辺 \\(CD\\) を \\(" + m2 + ":" + n2 + "\\) に分ける点である。<br>" +
                                      "対角線 \\(AC\\) と線分 \\(DF\\) の交点を \\(P\\)、線分 \\(BE\\) との交点を \\(Q\\) とするとき、比 \\(AP : PQ : QC\\) を最も簡単な整数の比で求めなさい。";
                        
                        explanationText = "【解説】<br>" +
                                          "1. <strong>相似を利用して対角線の分割比を求める</strong>：<br>" +
                                          "　・\\(\\triangle APF \\sim \\triangle CPD\\) より \\(AP : PC = AF : CD = " + ap1 + " : " + pc1 + "\\)（合計 \\(" + S1 + "\\)）<br>" +
                                          "　・\\(\\triangle CQE \\sim \\triangle AQB\\) より \\(AQ : QC = AB : CE = " + aq2 + " : " + qc2 + "\\)（合計 \\(" + S2 + "\\)）<br>" +
                                          "2. <strong>比合わせ（最小公倍数 \\(" + L + "\\) でそろえる）</strong>：<br>" +
                                          "　・\\(AP : PC = " + ap + " : " + (pc1 * mult1) + "\\)<br>" +
                                          "　・\\(AQ : QC = " + aq + " : " + qc + "\\)<br>" +
                                          "3. よって \\(AP : PQ : QC = " + ap + " : (" + aq + " - " + ap + ") : " + qc + " = \\mathbf{" + ans1 + " : " + ans2 + " : " + ans3 + "}\\) となります。";
                                          
                        problemSvg = '<div style="text-align:center; margin: 8px 0;">' +
                                     '<svg viewBox="0 0 220 140" style="background:#fff; border:1px solid #ddd; border-radius:4px; width:190px; height:120px; display:inline-block;">' +
                                     '<polygon points="50,30 170,30 200,110 80,110" fill="#eef2f7" stroke="#333" stroke-width="1.5"/>' +
                                     '<line x1="50" y1="30" x2="200" y2="110" stroke="#333" stroke-width="1.2" stroke-dasharray="3,3"/>' +
                                     '<line x1="' + D.x + '" y1="' + D.y + '" x2="' + F.x + '" y2="' + F.y + '" stroke="#e74c3c" stroke-width="1.3"/>' +
                                     '<line x1="' + B.x + '" y1="' + B.y + '" x2="' + E.x + '" y2="' + E.y + '" stroke="#2980b9" stroke-width="1.3"/>' +
                                     '<circle cx="' + P.x + '" cy="' + P.y + '" r="2.2" fill="#333"/>' +
                                     '<circle cx="' + Q.x + '" cy="' + Q.y + '" r="2.2" fill="#333"/>' +
                                     '<text x="40" y="25" font-size="10" font-weight="bold">A</text>' +
                                     '<text x="175" y="25" font-size="10" font-weight="bold">B</text>' +
                                     '<text x="208" y="120" font-size="10" font-weight="bold">C</text>' +
                                     '<text x="70" y="120" font-size="10" font-weight="bold">D</text>' +
                                     '<text x="' + (F.x - 3) + '" y="' + (F.y - 6) + '" font-size="10" font-weight="bold" fill="#e74c3c">F</text>' +
                                     '<text x="' + (E.x - 3) + '" y="' + (E.y + 12) + '" font-size="10" font-weight="bold" fill="#2980b9">E</text>' +
                                     '<text x="' + (P.x - 10) + '" y="' + (P.y + 5) + '" font-size="9" font-weight="bold">P</text>' +
                                     '<text x="' + (Q.x + 5) + '" y="' + (Q.y - 3) + '" font-size="9" font-weight="bold">Q</text>' +
                                     '</svg></div>';
                    }
                } else {
                    // 同じ頂点 A(50,30) から2本引く場合（対角線 BD）
                    // EはBCを m1:n1 に分ける、FはCDを m2:n2 に分ける
                    const tE = m1 / (m1 + n1);
                    const E = { x: B.x + tE * (C.x - B.x), y: B.y + tE * (C.y - B.y) };
                    const tF = m2 / (m2 + n2);
                    const F = { x: C.x + tF * (D.x - C.x), y: C.y + tF * (D.y - C.y) };

                    // AEとBDの交点P, AFとBDの交点Q
                    const P = getIntersect(A.x, A.y, E.x, E.y, B.x, B.y, D.x, D.y);
                    const Q = getIntersect(A.x, A.y, F.x, F.y, B.x, B.y, D.x, D.y);

                    // BP : PD = m1 : (m1 + n1) -> 合計 S1 = 2*m1 + n1
                    // BQ : QD = (m2 + n2) : n2 -> 合計 S2 = m2 + 2*n2
                    const bp1 = m1, pd1 = m1 + n1, S1 = bp1 + pd1;
                    const bq2 = m2 + n2, qd2 = n2, S2 = bq2 + qd2;
                    const L = lcm(S1, S2);
                    const mult1 = L / S1, mult2 = L / S2;

                    const bp = bp1 * mult1;
                    const bq = bq2 * mult2;
                    const qd = qd2 * mult2;
                    const pq = bq - bp;
                    const [ans1, ans2, ans3] = simplifyTriple(bp, pq, qd);
                    
                    problemText = "右の図の平行四辺形 \\(ABCD\\) において、対角線 \\(BD\\) をひく。点 \\(E\\) は辺 \\(BC\\) を \\(" + m1 + ":" + n1 + "\\) に分ける点、点 \\(F\\) は辺 \\(CD\\) を \\(" + m2 + ":" + n2 + "\\) に分ける点である。<br>" +
                                  "頂点 \\(A\\) から点 \\(E\\)、点 \\(F\\) にそれぞれ直線を引き、対角線 \\(BD\\) との交点をそれぞれ \\(P, Q\\) とするとき、比 \\(BP : PQ : QD\\) を最も簡単な整数の比で求めなさい。";
                    
                    explanationText = "【解説】<br>" +
                                      "1. <strong>同じ頂点からの線分と相似</strong>：<br>" +
                                      "　・\\(\\triangle BPE \\sim \\triangle DPA\\) より \\(BP : PD = BE : AD = " + bp1 + " : " + pd1 + "\\)（合計 \\(" + S1 + "\\)）<br>" +
                                      "　・\\(\\triangle DQF \\sim \\triangle BQA\\) より \\(BQ : QD = AB : DF = " + bq2 + " : " + qd2 + "\\)（合計 \\(" + S2 + "\\)）<br>" +
                                      "2. <strong>比合わせ（最小公倍数 \\(" + L + "\\) でそろえる）</strong>：<br>" +
                                      "　・\\(BP : PD = " + bp + " : " + (pd1 * mult1) + "\\)<br>" +
                                      "　・\\(BQ : QD = " + bq + " : " + qd + "\\)<br>" +
                                      "3. よって \\(BP : PQ : QD = " + bp + " : (" + bq + " - " + bp + ") : " + qd + " = \\mathbf{" + ans1 + " : " + ans2 + " : " + ans3 + "}\\) となります。";
                                      
                    problemSvg = '<div style="text-align:center; margin: 8px 0;">' +
                                 '<svg viewBox="0 0 220 140" style="background:#fff; border:1px solid #ddd; border-radius:4px; width:190px; height:120px; display:inline-block;">' +
                                 '<polygon points="50,30 170,30 200,110 80,110" fill="#eef2f7" stroke="#333" stroke-width="1.5"/>' +
                                 '<line x1="170" y1="30" x2="80" y2="110" stroke="#333" stroke-width="1.2" stroke-dasharray="3,3"/>' +
                                 '<line x1="' + A.x + '" y1="' + A.y + '" x2="' + E.x + '" y2="' + E.y + '" stroke="#2980b9" stroke-width="1.3"/>' +
                                 '<line x1="' + A.x + '" y1="' + A.y + '" x2="' + F.x + '" y2="' + F.y + '" stroke="#e74c3c" stroke-width="1.3"/>' +
                                 '<circle cx="' + P.x + '" cy="' + P.y + '" r="2.2" fill="#333"/>' +
                                 '<circle cx="' + Q.x + '" cy="' + Q.y + '" r="2.2" fill="#333"/>' +
                                 '<text x="40" y="25" font-size="10" font-weight="bold">A</text>' +
                                 '<text x="175" y="25" font-size="10" font-weight="bold">B</text>' +
                                 '<text x="208" y="120" font-size="10" font-weight="bold">C</text>' +
                                 '<text x="70" y="120" font-size="10" font-weight="bold">D</text>' +
                                 '<text x="' + (E.x + 6) + '" y="' + (E.y + 3) + '" font-size="10" font-weight="bold" fill="#2980b9">E</text>' +
                                 '<text x="' + (F.x - 3) + '" y="' + (F.y + 12) + '" font-size="10" font-weight="bold" fill="#e74c3c">F</text>' +
                                 '<text x="' + (P.x + 4) + '" y="' + (P.y + 10) + '" font-size="9" font-weight="bold">P</text>' +
                                 '<text x="' + (Q.x + 4) + '" y="' + (Q.y + 10) + '" font-size="9" font-weight="bold">Q</text>' +
                                 '</svg></div>';
                }

                return {
                    problem: problemText + "<br>" + problemSvg,
                    explanation: explanationText
                };
            }
        },
"カックン折れ線90°": {
    level: "難関私立",
    formula: `
        <div><strong>カックン折れ線90°</strong>：直線に向かって90°が刺さっている時に垂線を下すと相似ができる。特に正方形や長方形の折り返しの時に発生することが多い。</div>
    `,
    selfCheck: [
        '折り返しの合同から、等しい辺（AE＝A\'E、AD＝A\'D\' など）と移動した90°の角（∠DEF、∠EA\'D\' など）を正確に把握できているか？',
        '直線上に90°が刺さっている箇所（カックン折れ線90°）を見つけて、補角・余角の関係から相似な直角三角形（△EBF ∽ △DCE や △EBA\' ∽ △A\'CG ∽ △D\'FG）を取り出せているか？',
        '相似な三角形どうしで「対応する辺の順番」をそろえて比例式を立て、三平方の定理や差の計算と組み合わせて求めたい線分までたどり着けているか？'
    ],
    generateRandom: function () {
        const fracHtml = (num, den) =>
            `<span style="display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; line-height: 1.05; margin: 0 2px; font-size: 0.9em;"><span style="padding: 0 2px;">${num}</span><span style="border-top: 1px solid currentColor; width: 100%; text-align: center; padding: 1px 2px 0;">${den}</span></span>`;

        const gcd = (a, b) => {
            a = Math.abs(a); b = Math.abs(b);
            while (b) { const t = b; b = a % b; a = t; }
            return a || 1;
        };

        const formatFrac = (num, den) => {
            const g = gcd(num, den);
            const n = num / g;
            const d = den / g;
            return {
                n,
                d,
                html: d === 1 ? `${n}` : `${fracHtml(`${n}`, `${d}`)}`
            };
        };

        const pattern = Math.floor(Math.random() * 2);

        // ============================================================
        // パターン 0：長方形 ABCD の折り返し（点 A を辺 BC 上の E へ）
        // ============================================================
        if (pattern === 0) {
            const cases = [
                { ab: 6,  ad: 10, ec: 8 },  // BE = 2, EF = 10/3
                { ab: 8,  ad: 10, ec: 6 },  // BE = 4, EF = 5
                { ab: 12, ad: 13, ec: 5 },  // BE = 8, EF = 13/3
                { ab: 9,  ad: 15, ec: 12 }, // BE = 3, EF = 5
                { ab: 8,  ad: 17, ec: 15 }  // BE = 2, EF = 17/4
            ];
            const c = cases[Math.floor(Math.random() * cases.length)];
            const { ab, ad, ec } = c;

            const be = ad - ec;
            const efInfo = formatFrac(ab * ab + be * be, 2 * ab);

            const scale = Math.min(180 / ad, 115 / ab);
            const xLeft = 65;
            const yTop = 36;
            const wSvg = Number((ad * scale).toFixed(2));
            const hSvg = Number((ab * scale).toFixed(2));
            const xRight = Number((xLeft + wSvg).toFixed(2));
            const yBot = Number((yTop + hSvg).toFixed(2));

            const A = { x: xLeft, y: yTop };
            const D = { x: xRight, y: yTop };
            const B = { x: xLeft, y: yBot };
            const C = { x: xRight, y: yBot };

            const E = { x: Number((xLeft + be * scale).toFixed(2)), y: yBot };
            const efPx = Number(((efInfo.n / efInfo.d) * scale).toFixed(2));
            const F = { x: xLeft, y: Number((yTop + efPx).toFixed(2)) };

            const svgHtml = `
                <div style="margin: 10px 0 8px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
                    <svg viewBox="35 12 235 170" style="width: 100%; max-width: 290px; height: auto;">
                        <polyline points="${F.x},${F.y} ${A.x},${A.y} ${D.x},${D.y}" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,3"/>
                        <polyline points="${F.x},${F.y} ${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}" fill="none" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
                        <line x1="${D.x}" y1="${D.y}" x2="${F.x}" y2="${F.y}" stroke="#d97706" stroke-width="1.8"/>
                        <line x1="${F.x}" y1="${F.y}" x2="${E.x}" y2="${E.y}" stroke="#2563eb" stroke-width="2.2"/>
                        <line x1="${D.x}" y1="${D.y}" x2="${E.x}" y2="${E.y}" stroke="#2563eb" stroke-width="1.8"/>
                        <circle cx="${A.x}" cy="${A.y}" r="2.2" fill="#64748b"/>
                        <circle cx="${E.x}" cy="${E.y}" r="3" fill="#2563eb"/>
                        <circle cx="${F.x}" cy="${F.y}" r="3" fill="#d97706"/>
                        <text x="${(A.x - 10).toFixed(2)}" y="${(A.y - 6).toFixed(2)}" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">A</text>
                        <text x="${(D.x + 10).toFixed(2)}" y="${(D.y - 6).toFixed(2)}" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">D</text>
                        <text x="${(B.x - 10).toFixed(2)}" y="${(B.y + 8).toFixed(2)}" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">B</text>
                        <text x="${(C.x + 10).toFixed(2)}" y="${(C.y + 8).toFixed(2)}" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">C</text>
                        <text x="${(F.x - 11).toFixed(2)}" y="${F.y}" font-size="11.5" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#b45309">F</text>
                        <text x="${E.x}" y="${(E.y + 12).toFixed(2)}" font-size="11.5" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#1d4ed8">E</text>
                    </svg>
                </div>
            `;

            return {
                problem: `
                    <div>
                        長方形 ABCD において、点 A を辺 BC 上の点 E に重なるように折り返した。そのときの折り目は辺 AB 上の点 F と頂点 D を結んだ線分 DF である。<br>
                        AB = ${ab} cm、AD = ${ad} cm のとき、線分 EF の長さを求めなさい。
                    </div>
                    ${svgHtml}
                `,
                answer: `${efInfo.html} cm`,
                explanation: `
                    折り返しの性質より、△DEF ≡ △DAF なので、DE = AD = ${ad} cm、EF = AF、∠DEF = ∠DAF = 90° である。<br>
                    直角三角形 DCE（∠C = 90°）で DC = AB = ${ab} cm、DE = ${ad} cm なので、三平方の定理より<br>
                    EC = √(${ad}<sup>2</sup> − ${ab}<sup>2</sup>) = ${ec} cm<br>
                    よって、BE = BC − EC = ${ad} − ${ec} = ${be} cm となる。<br><br>

                    <strong>【解法1：三平方の定理】</strong><br>
                    EF = x cm とすると AF = x cm なので、BF = AB − AF = (${ab} − x) cm となる。<br>
                    直角三角形 EBF（∠B = 90°）で三平方の定理より<br>
                    (${ab} − x)<sup>2</sup> + ${be}<sup>2</sup> = x<sup>2</sup><br>
                    これを解くと、x = <strong>${efInfo.html} cm</strong><br><br>

                    <strong>【解法2：相似（カックン折れ線90°）】</strong><br>
                    直線 BC 上の点 E に ∠DEF = 90° が刺さっているため、∠FEB + ∠DEC = 90° である。<br>
                    また、△DCE で ∠EDC + ∠DEC = 90° なので、∠FEB = ∠EDC となり、2組の角がそれぞれ等しいから <strong>△EBF ∽ △DCE</strong> である。<br>
                    対応する辺の比より、BE : CD = EF : DE なので、<br>
                    ${be} : ${ab} = EF : ${ad}<br>
                    ${ab} × EF = ${be} × ${ad} &nbsp;⇒&nbsp; EF = <strong>${efInfo.html} cm</strong>
                `
            };
        }

        // ============================================================
        // パターン 1：正方形 ABCD を折り返し線 EF で折る（点 A が辺 BC 上の A' に移る）
        // ============================================================
        const sqCases = [
            { side: 8,  ba: 4, eb: 3,  ea: 5  }, // 3:4:5 の直角三角形
            { side: 16, ba: 8, eb: 6,  ea: 10 }, // 6:8:10
            { side: 9,  ba: 3, eb: 4,  ea: 5  }, // 4:3:5
            { side: 18, ba: 6, eb: 8,  ea: 10 }, // 8:6:10
            { side: 25, ba: 5, eb: 12, ea: 13 }  // 12:5:13
        ];

        const sc = sqCases[Math.floor(Math.random() * sqCases.length)];
        const { side, ba, eb, ea } = sc;

        // A'C = side - ba
        const aPrimeC = side - ba;
        // (1) △EBA' ∽ △A'CG より EB : A'C = BA' : CG => CG = (A'C * BA') / EB
        const cgInfo = formatFrac(aPrimeC * ba, eb);

        // (2) D'F の計算
        // △EBA' ∽ △A'CG より EB : A'C = EA' : A'G => A'G = (A'C * EA') / EB
        const aPrimeGInfo = formatFrac(aPrimeC * ea, eb);
        // D'G = A'D' - A'G = side - A'G
        const dPrimeGInfo = formatFrac(side * aPrimeGInfo.d - aPrimeGInfo.n, aPrimeGInfo.d);
        // △D'FG ∽ △A'CG ∽ △EBA' より D'F : D'G = EB : BA' => D'F = D'G * (eb / ba)
        const dPrimeFInfo = formatFrac(dPrimeGInfo.n * eb, dPrimeGInfo.d * ba);

        // SVG座標計算
        const scale = 124 / side;
        const xL = 70;
        const yT = 32;
        const sPx = Number((side * scale).toFixed(2));
        const xR = Number((xL + sPx).toFixed(2));
        const yB = Number((yT + sPx).toFixed(2));

        const A = { x: xL, y: yT };
        const B = { x: xL, y: yB };
        const C = { x: xR, y: yB };
        const D = { x: xR, y: yT };

        const E = { x: xL, y: Number((yB - eb * scale).toFixed(2)) };
        const dfVal = dPrimeFInfo.n / dPrimeFInfo.d;
        const F = { x: xR, y: Number((yT + dfVal * scale).toFixed(2)) };
        const Ap = { x: Number((xL + ba * scale).toFixed(2)), y: yB };
        const G = { x: xR, y: Number((yB - (cgInfo.n / cgInfo.d) * scale).toFixed(2)) };

        // 折り返し後の点 D' の座標（A' から G を通る半直線上に長さ side だけ進んだ点）
        const vx = G.x - Ap.x;
        const vy = G.y - Ap.y;
        const vLen = Math.hypot(vx, vy) || 1;
        const Dp = {
            x: Number((Ap.x + (vx / vLen) * sPx).toFixed(2)),
            y: Number((Ap.y + (vy / vLen) * sPx).toFixed(2))
        };

        const svgHtml = `
            <div style="margin: 10px 0 8px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
                <svg viewBox="35 8 255 182" style="width: 100%; max-width: 310px; height: auto;">
                    <polyline points="${E.x},${E.y} ${A.x},${A.y} ${D.x},${D.y} ${F.x},${F.y}" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,3"/>
                    <polyline points="${E.x},${E.y} ${B.x},${B.y} ${C.x},${C.y} ${F.x},${F.y}" fill="none" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
                    <line x1="${E.x}" y1="${E.y}" x2="${F.x}" y2="${F.y}" stroke="#d97706" stroke-width="1.8"/>
                    <polyline points="${E.x},${E.y} ${Ap.x},${Ap.y} ${Dp.x},${Dp.y} ${F.x},${F.y}" fill="none" stroke="#2563eb" stroke-width="2" stroke-linejoin="round"/>
                    <circle cx="${A.x}" cy="${A.y}" r="2.2" fill="#64748b"/>
                    <circle cx="${D.x}" cy="${D.y}" r="2.2" fill="#64748b"/>
                    <circle cx="${E.x}" cy="${E.y}" r="2.8" fill="#d97706"/>
                    <circle cx="${F.x}" cy="${F.y}" r="2.8" fill="#d97706"/>
                    <circle cx="${Ap.x}" cy="${Ap.y}" r="3" fill="#2563eb"/>
                    <circle cx="${Dp.x}" cy="${Dp.y}" r="3" fill="#2563eb"/>
                    <circle cx="${G.x}" cy="${G.y}" r="3" fill="#16a34a"/>
                    <text x="${(A.x - 10).toFixed(2)}" y="${(A.y - 6).toFixed(2)}" font-size="11.5" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">A</text>
                    <text x="${(B.x - 10).toFixed(2)}" y="${(B.y + 8).toFixed(2)}" font-size="11.5" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">B</text>
                    <text x="${(C.x + 10).toFixed(2)}" y="${(C.y + 8).toFixed(2)}" font-size="11.5" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">C</text>
                    <text x="${(D.x + 10).toFixed(2)}" y="${(D.y - 6).toFixed(2)}" font-size="11.5" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">D</text>
                    <text x="${(E.x - 11).toFixed(2)}" y="${E.y}" font-size="11.5" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#b45309">E</text>
                    <text x="${(F.x + 11).toFixed(2)}" y="${F.y}" font-size="11.5" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#b45309">F</text>
                    <text x="${Ap.x}" y="${(Ap.y + 12).toFixed(2)}" font-size="11.5" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#1d4ed8">A'</text>
                    <text x="${(Dp.x + 11).toFixed(2)}" y="${(Dp.y - 6).toFixed(2)}" font-size="11.5" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#1d4ed8">D'</text>
                    <text x="${(G.x + 11).toFixed(2)}" y="${G.y}" font-size="11.5" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#15803d">G</text>
                </svg>
            </div>
        `;

        return {
            problem: `
                <div>
                    1辺が ${side} cm の正方形 ABCD において、辺 AB 上に点 E、辺 CD 上に点 F がある。<br>
                    線分 EF を折り目として四角形 AEFD を折り返したところ、頂点 A が辺 BC 上の点 A' に重なり（頂点 D の移動先を D' とする）、BA' = ${ba} cm となった。<br>
                    折り返した後の辺 A'D' と辺 CD の交点を G とするとき、次の長さを求めなさい。
                </div>
                ${svgHtml}
                <div style="margin-top: 4px;">
                    (1) 線分 CG の長さ<br>
                    (2) 線分 D'F の長さ
                </div>
            `,
            answer: `(1) ${cgInfo.html} cm<br>(2) ${dPrimeFInfo.html} cm`,
            explanation: `
                <strong>(1)</strong><br>
                折り返した後の点 A' について、EB = x cm とおくと AE = (${side} − x) cm なので、EA' = AE = (${side} − x) cm となる。<br>
                直角三角形 EBA'（∠B = 90°）で三平方の定理より<br>
                x<sup>2</sup> + ${ba}<sup>2</sup> = (${side} − x)<sup>2</sup> &nbsp;⇒&nbsp; x = ${eb}<br>
                よって、EB = ${eb} cm、EA' = ${ea} cm、A'C = BC − BA' = ${side} − ${ba} = ${aPrimeC} cm である。<br><br>
                直線 BC 上の点 A' に折り返された直角（∠EA'D' = ∠A = 90°）が刺さっているため（カックン折れ線90°）、∠BA'E + ∠CA'G = 90° となる。<br>
                また、△EBA' で ∠BEA' + ∠BA'E = 90° なので ∠BEA' = ∠CA'G となり、2組の角がそれぞれ等しいから <strong>△EBA' ∽ △A'CG</strong> である。<br>
                対応する辺の比より、EB : A'C = BA' : CG なので、<br>
                ${eb} : ${aPrimeC} = ${ba} : CG &nbsp;⇒&nbsp; CG = <strong>${cgInfo.html} cm</strong><br><br>

                <strong>(2)</strong><br>
                同じく △EBA' ∽ △A'CG の対応する辺の比より、EB : A'C = EA' : A'G なので、<br>
                ${eb} : ${aPrimeC} = ${ea} : A'G &nbsp;⇒&nbsp; A'G = ${aPrimeGInfo.html} cm<br>
                よって、D'G = A'D' − A'G = ${side} − ${aPrimeGInfo.html} = ${dPrimeGInfo.html} cm となる。<br><br>
                さらに、△D'FG と △A'CG において、∠D' = ∠C = 90°、対頂角より ∠D'GF = ∠A'GC なので、<strong>△D'FG ∽ △A'CG ∽ △EBA'</strong> である。<br>
                対応する辺の比より、D'F : D'G = EB : BA' なので、<br>
                D'F : ${dPrimeGInfo.html} = ${eb} : ${ba} &nbsp;⇒&nbsp; D'F = <strong>${dPrimeFInfo.html} cm</strong>
            `
        };
    }
},
"カックン折れ線60°": {
    level: "難関私立",
    formula: `
        <div><strong>カックン折れ線60°</strong>：直線に向かって60°が刺さっている時に、両側の角の和が120°になることから相似ができる。特に正三角形の辺上に60°が接するときに発生することが多い。</div>
    `,
    selfCheck: [
        '正三角形の内角（∠B = ∠C = 60°）と直線上の角（180°）から、∠ADB + ∠EDC = 120° および ∠ADB + ∠BAD = 120° を導けているか？',
        '2組の角がそれぞれ等しいことから、対応する頂点の順番をそろえて △ABD ∽ △DCE を作れているか？',
        '相似比からまず CE を求め、AE を聞かれた場合は AC − CE の引き算まで正確に計算できているか？'
    ],
    generateRandom: function () {
        const fracHtml = (num, den) =>
            `<span style="display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; line-height: 1.05; margin: 0 2px; font-size: 0.9em;"><span style="padding: 0 2px;">${num}</span><span style="border-top: 1px solid currentColor; width: 100%; text-align: center; padding: 1px 2px 0;">${den}</span></span>`;

        const gcd = (a, b) => {
            a = Math.abs(a); b = Math.abs(b);
            while (b) { const t = b; b = a % b; a = t; }
            return a || 1;
        };

        const formatFrac = (num, den) => {
            const g = gcd(num, den);
            const n = num / g;
            const d = den / g;
            return {
                n,
                d,
                html: d === 1 ? `${n}` : `${fracHtml(`${n}`, `${d}`)}`
            };
        };

        // 正三角形 ABC の1辺 side、辺 BC 上の点 D について BD = bd
        // CD = side - bd、△ABD ∽ △DCE より AB : DC = BD : CE  =>  CE = (BD * CD) / side
        // E が辺 AC 上に収まる条件：CE < side（常に成立）
        const cases = [
            { side: 6,  bd: 2 }, // CD = 4, CE = 8/6 = 4/3, AE = 14/3
            { side: 6,  bd: 3 }, // CD = 3, CE = 9/6 = 3/2, AE = 9/2
            { side: 8,  bd: 2 }, // CD = 6, CE = 12/8 = 3/2, AE = 13/2
            { side: 8,  bd: 4 }, // CD = 4, CE = 16/8 = 2,   AE = 6
            { side: 9,  bd: 3 }, // CD = 6, CE = 18/9 = 2,   AE = 7
            { side: 9,  bd: 6 }, // CD = 3, CE = 18/9 = 2,   AE = 7
            { side: 10, bd: 4 }, // CD = 6, CE = 24/10 = 12/5, AE = 38/5
            { side: 12, bd: 3 }, // CD = 9, CE = 27/12 = 9/4,  AE = 39/4
            { side: 12, bd: 4 }, // CD = 8, CE = 32/12 = 8/3,  AE = 28/3
            { side: 12, bd: 8 }  // CD = 4, CE = 32/12 = 8/3,  AE = 28/3
        ];
        const c = cases[Math.floor(Math.random() * cases.length)];
        const { side, bd } = c;

        const cd = side - bd;
        const ceInfo = formatFrac(bd * cd, side);
        const aeInfo = formatFrac(side * ceInfo.d - ceInfo.n, ceInfo.d);

        // 出題ターゲットをランダム選択（0: CEのみ, 1: AEのみ, 2: (1)CE (2)AE の2問構成）
        const askMode = Math.floor(Math.random() * 3);

        // SVG描画：正三角形 ABC、辺 BC 上の D、辺 AC 上の E、折れ線 AD - DE と ∠ADE = 60° の円弧
        const sidePx = 164;
        const hPx = sidePx * (Math.sqrt(3) / 2);
        const cxMid = 150;
        const yBot = 176;
        const yTop = Number((yBot - hPx).toFixed(2));

        const A = { x: cxMid, y: yTop };
        const B = { x: Number((cxMid - sidePx / 2).toFixed(2)), y: yBot };
        const C = { x: Number((cxMid + sidePx / 2).toFixed(2)), y: yBot };

        const tBd = bd / side;
        const D = {
            x: Number((B.x + (C.x - B.x) * tBd).toFixed(2)),
            y: yBot
        };

        const ceVal = ceInfo.n / ceInfo.d;
        const tCe = ceVal / side;
        const E = {
            x: Number((C.x + (A.x - C.x) * tCe).toFixed(2)),
            y: Number((C.y + (A.y - C.y) * tCe).toFixed(2))
        };

        // ∠ADE = 60° の円弧パス計算
        const arcR = 16;
        const angDA = Math.atan2(A.y - D.y, A.x - D.x);
        const angDE = Math.atan2(E.y - D.y, E.x - D.x);
        const arcStart = {
            x: Number((D.x + arcR * Math.cos(angDA)).toFixed(2)),
            y: Number((D.y + arcR * Math.sin(angDA)).toFixed(2))
        };
        const arcEnd = {
            x: Number((D.x + arcR * Math.cos(angDE)).toFixed(2)),
            y: Number((D.y + arcR * Math.sin(angDE)).toFixed(2))
        };
        const angMid = (angDA + angDE) / 2;
        const label60 = {
            x: Number((D.x + (arcR + 12) * Math.cos(angMid)).toFixed(2)),
            y: Number((D.y + (arcR + 12) * Math.sin(angMid)).toFixed(2))
        };

        const svgHtml = `
            <div style="margin: 10px 0 8px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
                <svg viewBox="35 12 230 186" style="width: 100%; max-width: 285px; height: auto;">
                    <polygon points="${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}" fill="#f8fafc" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
                    <polyline points="${A.x},${A.y} ${D.x},${D.y} ${E.x},${E.y}" fill="none" stroke="#2563eb" stroke-width="2.1" stroke-linejoin="round"/>
                    <path d="M ${arcStart.x} ${arcStart.y} A ${arcR} ${arcR} 0 0 1 ${arcEnd.x} ${arcEnd.y}" fill="none" stroke="#d97706" stroke-width="1.5"/>
                    <circle cx="${D.x}" cy="${D.y}" r="3" fill="#2563eb"/>
                    <circle cx="${E.x}" cy="${E.y}" r="3" fill="#2563eb"/>
                    <text x="${A.x}" y="${(A.y - 10).toFixed(2)}" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">A</text>
                    <text x="${(B.x - 10).toFixed(2)}" y="${(B.y + 8).toFixed(2)}" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">B</text>
                    <text x="${(C.x + 10).toFixed(2)}" y="${(C.y + 8).toFixed(2)}" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">C</text>
                    <text x="${D.x}" y="${(D.y + 12).toFixed(2)}" font-size="11.5" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#1d4ed8">D</text>
                    <text x="${(E.x + 11).toFixed(2)}" y="${(E.y - 4).toFixed(2)}" font-size="11.5" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#1d4ed8">E</text>
                    <text x="${label60.x}" y="${label60.y}" font-size="10" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#b45309">60°</text>
                </svg>
            </div>
        `;

        const simExplanation = `
            正三角形 ABC の1辺の長さは ${side} cm なので、AB = BC = AC = ${side} cm、∠B = ∠C = 60° である。<br>
            また、CD = BC − BD = ${side} − ${bd} = ${cd} cm となる。<br><br>
            直線 BC 上の点 D に ∠ADE = 60° が刺さっているため（カックン折れ線60°）、<br>
            ∠ADB + ∠EDC = 180° − 60° = 120° である。<br>
            また、△ABD の内角の和より ∠ADB + ∠BAD = 180° − 60° = 120° なので、<strong>∠BAD = ∠EDC</strong> となる。<br>
            よって、2組の角がそれぞれ等しいから <strong>△ABD ∽ △DCE</strong> である。<br><br>
            対応する辺の比より、AB : DC = BD : CE なので、<br>
            ${side} : ${cd} = ${bd} : CE<br>
            ${side} × CE = ${cd} × ${bd} &nbsp;⇒&nbsp; CE = <strong>${ceInfo.html} cm</strong>
        `;

        if (askMode === 0) {
            return {
                problem: `
                    <div>
                        1辺が ${side} cm の正三角形 ABC において、辺 BC 上に点 D、辺 AC 上に点 E を、∠ADE = 60° となるようにとった。<br>
                        BD = ${bd} cm のとき、線分 CE の長さを求めなさい。
                    </div>
                    ${svgHtml}
                `,
                answer: `${ceInfo.html} cm`,
                explanation: simExplanation
            };
        }

        if (askMode === 1) {
            return {
                problem: `
                    <div>
                        1辺が ${side} cm の正三角形 ABC において、辺 BC 上に点 D、辺 AC 上に点 E を、∠ADE = 60° となるようにとった。<br>
                        BD = ${bd} cm のとき、線分 AE の長さを求めなさい。
                    </div>
                    ${svgHtml}
                `,
                answer: `${aeInfo.html} cm`,
                explanation: `
                    ${simExplanation}<br><br>
                    したがって、線分 AE の長さは<br>
                    AE = AC − CE = ${side} − ${ceInfo.html} = <strong>${aeInfo.html} cm</strong>
                `
            };
        }

        return {
            problem: `
                <div>
                    1辺が ${side} cm の正三角形 ABC において、辺 BC 上に点 D、辺 AC 上に点 E を、∠ADE = 60° となるようにとった。<br>
                    BD = ${bd} cm のとき、次の長さを求めなさい。
                </div>
                ${svgHtml}
                <div style="margin-top: 4px;">
                    (1) 線分 CE の長さ<br>
                    (2) 線分 AE の長さ
                </div>
            `,
            answer: `(1) ${ceInfo.html} cm<br>(2) ${aeInfo.html} cm`,
            explanation: `
                <strong>(1)</strong><br>
                ${simExplanation}<br><br>
                <strong>(2)</strong><br>
                AC = ${side} cm なので、<br>
                AE = AC − CE = ${side} − ${ceInfo.html} = <strong>${aeInfo.html} cm</strong>
            `
        };
    }
},

        "相似を作る": {
            category: "平面図形",
            level: "公立",
            formula: "平行線内の対角線ではない中途半端な線分比を求める問題などで困った時は<strong>相似を作ろう</strong>。<br><br>" +
                     "① <strong>外に延長してチョウチョ型</strong>を作る<br>" +
                     "② <strong>内側に平行線を引いてピラミッド型 or チョウチョ型</strong>を作る<br><br>" +
                     "<strong>※相似を作るために補助線を引くこと！とりあえず引くのではなく、目的をもって引こう！</strong>",
            generateRandom: function() {
                function gcd(x, y) { return y === 0 ? x : gcd(y, x % y); }
                function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
                function simplifyPair(a, b) { const g = gcd(a, b); return [a / g, b / g]; }

                function getIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
                    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
                    if (Math.abs(denom) < 1e-9) return { x: 0, y: 0 };
                    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
                    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
                }

                function distance(p1, p2) {
                    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
                }

                const diag = Math.random() < 0.5 ? 'AC' : 'BD';
                const corner = Math.random() < 0.5 ? 0 : 1;
                
                let m1, n1, m2, n2, explPattern;
                let E, F, P, Q, ans1, ans2;
                let side1, side2, problemText, explanationText, problemSvg, explSvg;
                const A = { x: 60, y: 40 }, B = { x: 180, y: 40 }, C = { x: 210, y: 120 }, D = { x: 90, y: 120 };

                function calcDiagRatio(m_1, n_1, m_2, n_2) {
                    const num = m_1 * m_2;
                    const den = m_2 * (m_1 + n_1) + n_2 * m_1;
                    return simplifyPair(num, den);
                }

                for (let attempt = 0; attempt < 5; attempt++) {
                    [m1, n1] = simplifyPair(randInt(1, 4), randInt(1, 4));
                    [m2, n2] = simplifyPair(randInt(1, 4), randInt(1, 4));
                    explPattern = Math.random() < 0.5 ? 0 : 1;

                    if (diag === 'AC') {
                        if (corner === 0) {
                            const tE = m1 / (m1 + n1);
                            E = { x: A.x + tE * (D.x - A.x), y: A.y + tE * (D.y - A.y) };
                            const tF = m2 / (m2 + n2);
                            F = { x: A.x + tF * (B.x - A.x), y: A.y + tF * (B.y - A.y) };
                            P = getIntersect(E.x, E.y, F.x, F.y, A.x, A.y, C.x, C.y);
                            Q = getIntersect(E.x, E.y, F.x, F.y, C.x, C.y, B.x, B.y);
                        } else {
                            const tE = m1 / (m1 + n1);
                            E = { x: C.x + tE * (B.x - C.x), y: C.y + tE * (B.y - C.y) };
                            const tF = m2 / (m2 + n2);
                            F = { x: C.x + tF * (D.x - C.x), y: C.y + tF * (D.y - C.y) };
                            P = getIntersect(E.x, E.y, F.x, F.y, A.x, A.y, C.x, C.y);
                            Q = getIntersect(E.x, E.y, F.x, F.y, A.x, A.y, D.x, D.y);
                        }
                    } else {
                        if (corner === 0) {
                            const tE = m1 / (m1 + n1);
                            E = { x: B.x + tE * (A.x - B.x), y: B.y + tE * (A.y - B.y) };
                            const tF = m2 / (m2 + n2);
                            F = { x: B.x + tF * (C.x - B.x), y: B.y + tF * (C.y - B.y) };
                            P = getIntersect(E.x, E.y, F.x, F.y, B.x, B.y, D.x, D.y);
                            Q = getIntersect(E.x, E.y, F.x, F.y, A.x, A.y, D.x, D.y);
                        } else {
                            const tE = m1 / (m1 + n1);
                            E = { x: D.x + tE * (A.x - D.x), y: D.y + tE * (A.y - D.y) };
                            const tF = m2 / (m2 + n2);
                            F = { x: D.x + tF * (C.x - D.x), y: D.y + tF * (C.y - D.y) };
                            P = getIntersect(E.x, E.y, F.x, F.y, B.x, B.y, D.x, D.y);
                            Q = getIntersect(E.x, E.y, F.x, F.y, A.x, A.y, B.x, B.y);
                        }
                    }

                    const tooCloseToVertex = distance(Q, A) < 5 || distance(Q, B) < 5 || distance(Q, C) < 5 || distance(Q, D) < 5;
                    if (!tooCloseToVertex || attempt === 4) {
                        break;
                    }
                }

                // 共通の数値計算準備
                // 対辺の長さを 1（または (m1+n1)*m2）と基準化して整数比を作る
                const baseLen = (m1 + n1) * m2; // 平行四辺形の辺1・対辺の長さの基準値
                const seg1 = m1 * m2;            // 頂点からEまでの長さ (AE, CE, BE, DE)
                const extLen = n2 * m1;          // 延長してできた新しい線分の長さ (BQ, DQ)
                const totalOpp = baseLen + extLen; // 対辺＋延長部分の合計長さ (CQ, AQ)

                if (diag === 'AC') {
                    let extTarget;
                    if (corner === 0) {
                        side1 = "AD"; side2 = "AB";
                        [ans1, ans2] = calcDiagRatio(m1, n1, m2, n2);
                        extTarget = B;
                    } else {
                        side1 = "CB"; side2 = "CD";
                        const [rC, rA] = calcDiagRatio(m1, n1, m2, n2);
                        ans1 = rA; ans2 = rC;
                        extTarget = D;
                    }

                    problemText = "右の図の平行四辺形 \\(ABCD\\) において、点 \\(E\\) は辺 \\(" + side1 + "\\) を \\(" + m1 + ":" + n1 + "\\) に分ける点、点 \\(F\\) は辺 \\(" + side2 + "\\) を \\(" + m2 + ":" + n2 + "\\) に分ける点である。<br>" +
                                  "対角線 \\(AC\\) と線分 \\(EF\\) の交点を \\(P\\) とするとき、補助線を引いて相似を作り、比 \\(AP : PC\\) を最も簡単な整数の比で求めなさい。";

                    problemSvg = '<div style="text-align:center; margin: 8px 0;">' +
                                 '<svg viewBox="30 15 210 130" style="background:#fff; border:1px solid #ddd; border-radius:4px; width:210px; height:130px; display:inline-block;">' +
                                 '<polygon points="60,40 180,40 210,120 90,120" fill="#eef2f7" stroke="#333" stroke-width="1.5"/>' +
                                 '<line x1="60" y1="40" x2="210" y2="120" stroke="#333" stroke-width="1.2" stroke-dasharray="3,3"/>' +
                                 '<line x1="' + E.x + '" y1="' + E.y + '" x2="' + F.x + '" y2="' + F.y + '" stroke="#2980b9" stroke-width="1.5"/>' +
                                 '<circle cx="' + E.x + '" cy="' + E.y + '" r="2.2" fill="#2980b9"/>' +
                                 '<circle cx="' + F.x + '" cy="' + F.y + '" r="2.2" fill="#2980b9"/>' +
                                 '<circle cx="' + P.x + '" cy="' + P.y + '" r="2.5" fill="#e74c3c"/>' +
                                 '<text x="48" y="36" font-size="10" font-weight="bold">A</text>' +
                                 '<text x="184" y="36" font-size="10" font-weight="bold">B</text>' +
                                 '<text x="214" y="128" font-size="10" font-weight="bold">C</text>' +
                                 '<text x="78" y="128" font-size="10" font-weight="bold">D</text>' +
                                 '<text x="' + (E.x + (corner === 0 ? -12 : 6)) + '" y="' + (E.y + 4) + '" font-size="10" font-weight="bold" fill="#2980b9">E</text>' +
                                 '<text x="' + (F.x - 3) + '" y="' + (F.y + (corner === 0 ? -6 : 12)) + '" font-size="10" font-weight="bold" fill="#2980b9">F</text>' +
                                 '<text x="' + (P.x + 4) + '" y="' + (P.y - 5) + '" font-size="10" font-weight="bold" fill="#e74c3c">P</text>' +
                                 '</svg></div>';

                    if (explPattern === 0) {
                        const tri1 = corner === 0 ? "\\triangle AEF \\backsim \\triangle BQF" : "\\triangle CEF \\backsim \\triangle DQF";
                        const ratioSides1 = corner === 0 ? "AF : BF = " + m2 + " : " + n2 : "CF : DF = " + m2 + " : " + n2;
                        const segE = corner === 0 ? "AE" : "CE";
                        const segQ = corner === 0 ? "BQ" : "DQ";
                        const oppSide = corner === 0 ? "BC" : "AD";
                        const totalSeg = corner === 0 ? "CQ" : "AQ";
                        const tri2 = corner === 0 ? "\\triangle APE \\backsim \\triangle CPQ" : "\\triangle CPE \\backsim \\triangle APQ";
                        const orderNote = corner === 0
                            ? "AE : CQ = " + seg1 + " : " + totalOpp + " = " + ans1 + " : " + ans2
                            : "AQ : CE = " + totalOpp + " : " + seg1 + " = " + ans1 + " : " + ans2;

                        explanationText = "【解説（外に延長してチョウチョ型）】<br>" +
                                          "1. <strong>補助線を引いてチョウチョ型を作る</strong>：<br>" +
                                          "　線分 \\(EF\\) を \\(F\\) の方に延長し、辺 \\(" + oppSide + "\\) の延長線との交点を \\(Q\\) とします。<br>" +
                                          "2. <strong>新しくできた線分 \\(" + segQ + "\\) の長さを求める</strong>：<br>" +
                                          "　チョウチョ型 <strong>\\(" + tri1 + "\\)</strong> に注目すると、辺 \\(" + side2 + "\\) の比より相似比は <strong>\\(" + ratioSides1 + "\\)</strong> です。<br>" +
                                          "　辺 \\(" + side1 + "\\)（= \\(" + oppSide + "\\)）全体の長さを \\(" + (m1 + n1) + "\\) とおくと、\\(" + segE + " = " + m1 + "\\) なので、<br>" +
                                          "　\\(" + segE + " : " + segQ + " = " + m2 + " : " + n2 + "\\) より、新しくできた線分 <strong>\\(" + segQ + " = " + m1 + " \\times \\frac{" + n2 + "}{" + m2 + "} = \\frac{" + extLen + "}{" + m2 + "}\\)</strong> となります。<br>" +
                                          "　（分母を払って \\(" + oppSide + " = " + baseLen + "\\)、\\(" + segE + " = " + seg1 + "\\) とすると、<strong>\\(" + segQ + " = " + extLen + "\\)</strong>、合わせて <strong>\\(" + totalSeg + " = " + baseLen + " + " + extLen + " = " + totalOpp + "\\)</strong> です）<br>" +
                                          "3. <strong>対角線の比を求める</strong>：<br>" +
                                          "　次に、もう一つのチョウチョ型 <strong>\\(" + tri2 + "\\)</strong> に注目すると、対応する辺の比より<br>" +
                                          "　\\(AP : PC = " + orderNote + "\\) となります。";

                        const minX = Math.min(20, Q.x - 15);
                        const maxX = Math.max(240, Q.x + 20);
                        const minY = Math.min(10, Q.y - 15);
                        const maxY = Math.max(140, Q.y + 20);

                        explSvg = '<div style="text-align:center; margin: 6px 0;">' +
                                  '<svg viewBox="' + minX + ' ' + minY + ' ' + (maxX - minX) + ' ' + (maxY - minY) + '" style="background:#fff; border:1px solid #ddd; border-radius:4px; width:220px; height:140px; display:inline-block;">' +
                                  '<polygon points="60,40 180,40 210,120 90,120" fill="#f8fafc" stroke="#333" stroke-width="1.2"/>' +
                                  '<line x1="60" y1="40" x2="210" y2="120" stroke="#888" stroke-width="1.1" stroke-dasharray="3,2"/>' +
                                  '<line x1="' + E.x + '" y1="' + E.y + '" x2="' + F.x + '" y2="' + F.y + '" stroke="#2980b9" stroke-width="1.4"/>' +
                                  '<line x1="' + F.x + '" y1="' + F.y + '" x2="' + Q.x + '" y2="' + Q.y + '" stroke="#e74c3c" stroke-width="1.3" stroke-dasharray="3,2"/>' +
                                  '<line x1="' + extTarget.x + '" y1="' + extTarget.y + '" x2="' + Q.x + '" y2="' + Q.y + '" stroke="#e74c3c" stroke-width="1.3" stroke-dasharray="3,2"/>' +
                                  '<circle cx="' + Q.x + '" cy="' + Q.y + '" r="2.3" fill="#e74c3c"/>' +
                                  '<text x="48" y="36" font-size="9" font-weight="bold">A</text>' +
                                  '<text x="184" y="36" font-size="9" font-weight="bold">B</text>' +
                                  '<text x="214" y="128" font-size="9" font-weight="bold">C</text>' +
                                  '<text x="78" y="128" font-size="9" font-weight="bold">D</text>' +
                                  '<text x="' + (Q.x + 4) + '" y="' + (Q.y + 3) + '" font-size="9" font-weight="bold" fill="#e74c3c">Q</text>' +
                                  '</svg></div>';
                    } else {
                        const G = getIntersect(F.x, F.y, F.x + (D.x - A.x), F.y + (D.y - A.y), A.x, A.y, C.x, C.y);
                        const triPyr = corner === 0 ? "\\triangle AFG \\backsim \\triangle ABC" : "\\triangle CFG \\backsim \\triangle CDA";
                        const ratioPyr = corner === 0 ? "AF : AB = " + m2 + " : " + (m2 + n2) : "CF : CD = " + m2 + " : " + (m2 + n2);
                        const segE = corner === 0 ? "AE" : "CE";
                        const triBut = corner === 0 ? "\\triangle APE \\backsim \\triangle GPF" : "\\triangle CPE \\backsim \\triangle GPF";
                        const basePyrSide = corner === 0 ? "BC" : "AD";
                        const fgVal = m2 * (m1 + n1);
                        const aeVal = m1 * (m2 + n2);
                        const agVal = m2;
                        const gcVal = n2;
                        const innerPart = corner === 0 ? "AG" : "CG";
                        const outerPart = corner === 0 ? "GC" : "GA";
                        const pRatio = corner === 0
                            ? "AP : PG = " + aeVal + " : " + fgVal + " = " + ans1 + " : " + (n2 * m1)
                            : "CP : PG = " + aeVal + " : " + fgVal + " = " + ans2 + " : " + (n2 * m1);

                        explanationText = "【解説（内側に平行線を引く）】<br>" +
                                          "1. <strong>内側に平行線を引いてピラミッド型を作る</strong>：<br>" +
                                          "　点 \\(F\\) を通り、辺 \\(" + side1 + "\\) に平行な補助線を引き、対角線 \\(AC\\) との交点を \\(G\\) とします。<br>" +
                                          "2. <strong>新しくできた線分 \\(FG\\) と対角線の比を求める</strong>：<br>" +
                                          "　ピラミッド型 <strong>\\(" + triPyr + "\\)</strong> に注目すると、辺 \\(" + side2 + "\\) の比より相似比は <strong>\\(" + ratioPyr + "\\)</strong> です。<br>" +
                                          "　よって、対角線上の比は <strong>\\(" + innerPart + " : " + outerPart + " = " + agVal + " : " + gcVal + "\\)</strong> に分かれ、新しくできた線分 <strong>\\(FG\\)</strong> は辺 \\(" + basePyrSide + "\\) の \\(\\frac{" + m2 + "}{" + (m2 + n2) + "}\\) 倍になります。<br>" +
                                          "　平行四辺形の辺 \\(" + side1 + " = " + basePyrSide + "\\) の長さを \\(" + ((m1 + n1) * (m2 + n2)) + "\\) とおくと、\\(" + segE + " = " + aeVal + "\\)、<strong>\\(FG = " + fgVal + "\\)</strong> となります。<br>" +
                                          "3. <strong>チョウチョ型で最後の比を求める</strong>：<br>" +
                                          "　次に、内側のチョウチョ型 <strong>\\(" + triBut + "\\)</strong> に注目すると、相似比は <strong>\\(" + segE + " : FG = " + aeVal + " : " + fgVal + "\\)</strong> です。<br>" +
                                          "　これと \\(" + innerPart + " : " + outerPart + " = " + agVal + " : " + gcVal + "\\) を合わせることで、<strong>\\(AP : PC = " + ans1 + " : " + ans2 + "\\)</strong> と求められます。";

                        explSvg = '<div style="text-align:center; margin: 6px 0;">' +
                                  '<svg viewBox="30 15 210 130" style="background:#fff; border:1px solid #ddd; border-radius:4px; width:210px; height:130px; display:inline-block;">' +
                                  '<polygon points="60,40 180,40 210,120 90,120" fill="#f8fafc" stroke="#333" stroke-width="1.2"/>' +
                                  '<line x1="60" y1="40" x2="210" y2="120" stroke="#888" stroke-width="1.1" stroke-dasharray="3,2"/>' +
                                  '<line x1="' + E.x + '" y1="' + E.y + '" x2="' + F.x + '" y2="' + F.y + '" stroke="#2980b9" stroke-width="1.4"/>' +
                                  '<line x1="' + F.x + '" y1="' + F.y + '" x2="' + G.x + '" y2="' + G.y + '" stroke="#e74c3c" stroke-width="1.4" stroke-dasharray="3,2"/>' +
                                  '<circle cx="' + G.x + '" cy="' + G.y + '" r="2.2" fill="#e74c3c"/>' +
                                  '<text x="48" y="36" font-size="9" font-weight="bold">A</text>' +
                                  '<text x="184" y="36" font-size="9" font-weight="bold">B</text>' +
                                  '<text x="214" y="128" font-size="9" font-weight="bold">C</text>' +
                                  '<text x="78" y="128" font-size="9" font-weight="bold">D</text>' +
                                  '<text x="' + (G.x + (corner === 0 ? -10 : 5)) + '" y="' + (G.y + 10) + '" font-size="9" font-weight="bold" fill="#e74c3c">G</text>' +
                                  '</svg></div>';
                    }

                } else {
                    let extTarget;
                    if (corner === 0) {
                        side1 = "BA"; side2 = "BC";
                        [ans1, ans2] = calcDiagRatio(m1, n1, m2, n2);
                        extTarget = D;
                    } else {
                        side1 = "DA"; side2 = "DC";
                        const [rD, rB] = calcDiagRatio(m1, n1, m2, n2);
                        ans1 = rB; ans2 = rD;
                        extTarget = B;
                    }

                    problemText = "右の図の平行四辺形 \\(ABCD\\) において、点 \\(E\\) は辺 \\(" + side1 + "\\) を \\(" + m1 + ":" + n1 + "\\) に分ける点、点 \\(F\\) は辺 \\(" + side2 + "\\) を \\(" + m2 + ":" + n2 + "\\) に分ける点である。<br>" +
                                  "対角線 \\(BD\\) と線分 \\(EF\\) の交点を \\(P\\) とするとき、補助線を引いて相似を作り、比 \\(BP : PD\\) を最も簡単な整数の比で求めなさい。";

                    problemSvg = '<div style="text-align:center; margin: 8px 0;">' +
                                 '<svg viewBox="30 15 210 130" style="background:#fff; border:1px solid #ddd; border-radius:4px; width:210px; height:130px; display:inline-block;">' +
                                 '<polygon points="60,40 180,40 210,120 90,120" fill="#eef2f7" stroke="#333" stroke-width="1.5"/>' +
                                 '<line x1="180" y1="40" x2="90" y2="120" stroke="#333" stroke-width="1.2" stroke-dasharray="3,3"/>' +
                                 '<line x1="' + E.x + '" y1="' + E.y + '" x2="' + F.x + '" y2="' + F.y + '" stroke="#2980b9" stroke-width="1.5"/>' +
                                 '<circle cx="' + E.x + '" cy="' + E.y + '" r="2.2" fill="#2980b9"/>' +
                                 '<circle cx="' + F.x + '" cy="' + F.y + '" r="2.2" fill="#2980b9"/>' +
                                 '<circle cx="' + P.x + '" cy="' + P.y + '" r="2.5" fill="#e74c3c"/>' +
                                 '<text x="48" y="36" font-size="10" font-weight="bold">A</text>' +
                                 '<text x="184" y="36" font-size="10" font-weight="bold">B</text>' +
                                 '<text x="214" y="128" font-size="10" font-weight="bold">C</text>' +
                                 '<text x="78" y="128" font-size="10" font-weight="bold">D</text>' +
                                 '<text x="' + (E.x - 3) + '" y="' + (E.y + (corner === 0 ? -6 : 4)) + '" font-size="10" font-weight="bold" fill="#2980b9">E</text>' +
                                 '<text x="' + (F.x + 5) + '" y="' + (F.y + (corner === 0 ? 3 : 12)) + '" font-size="10" font-weight="bold" fill="#2980b9">F</text>' +
                                 '<text x="' + (P.x - 11) + '" y="' + (P.y + 10) + '" font-size="10" font-weight="bold" fill="#e74c3c">P</text>' +
                                 '</svg></div>';

                    if (explPattern === 0) {
                        const tri1 = corner === 0 ? "\\triangle BEF \\backsim \\triangle CQF" : "\\triangle DEF \\backsim \\triangle AQF";
                        // ※注意：BD対角線の場合、QはADの延長（corner=0）またはABの延長（corner=1）
                        const realTri1 = corner === 0 ? "\\triangle CEF \\backsim \\triangle DQF" : "\\triangle CEF \\backsim \\triangle BQF";
                        const ratioSides1 = corner === 0 ? "BF : CF = " + m2 + " : " + n2 : "DF : CF = " + m2 + " : " + n2;
                        const segE = corner === 0 ? "BE" : "DE";
                        const segQ = corner === 0 ? "DQ" : "BQ";
                        const oppSide = corner === 0 ? "AD" : "AB";
                        const totalSeg = corner === 0 ? "AQ" : "AQ";
                        const tri2 = corner === 0 ? "\\triangle BPE \\backsim \\triangle DPQ" : "\\triangle DPE \\backsim \\triangle BPQ";
                        const orderNote = corner === 0
                            ? "BE : DQ = " + seg1 + " : " + totalOpp + " = " + ans1 + " : " + ans2
                            : "BQ : DE = " + totalOpp + " : " + seg1 + " = " + ans1 + " : " + ans2;

                        explanationText = "【解説（外に延長してチョウチョ型）】<br>" +
                                          "1. <strong>補助線を引いてチョウチョ型を作る</strong>：<br>" +
                                          "　線分 \\(EF\\) を \\(F\\) の方に延長し、辺 \\(" + oppSide + "\\) の延長線との交点を \\(Q\\) とします。<br>" +
                                          "2. <strong>新しくできた線分 \\(" + segQ + "\\) の長さを求める</strong>：<br>" +
                                          "　チョウチョ型 <strong>\\(" + realTri1 + "\\)</strong> に注目すると、辺 \\(" + side2 + "\\) の比より相似比は <strong>\\(" + ratioSides1 + "\\)</strong> です。<br>" +
                                          "　辺 \\(" + side1 + "\\)（= \\(" + (corner === 0 ? "CD" : "BC") + "\\)）全体の長さを \\(" + (m1 + n1) + "\\) とおくと、\\(" + segE + " = " + m1 + "\\) なので、<br>" +
                                          "　\\(" + segE + " : " + segQ + " = " + m2 + " : " + n2 + "\\) より、新しくできた線分 <strong>\\(" + segQ + " = " + m1 + " \\times \\frac{" + n2 + "}{" + m2 + "} = \\frac{" + extLen + "}{" + m2 + "}\\)</strong> となります。<br>" +
                                          "　（分母を払って元の辺を \\(" + baseLen + "\\)、\\(" + segE + " = " + seg1 + "\\) とすると、<strong>\\(" + segQ + " = " + extLen + "\\)</strong>、合わせて <strong>\\(" + totalSeg + " = " + baseLen + " + " + extLen + " = " + totalOpp + "\\)</strong> です）<br>" +
                                          "3. <strong>対角線の比を求める</strong>：<br>" +
                                          "　次に、もう一つのチョウチョ型 <strong>\\(" + tri2 + "\\)</strong> に注目すると、対応する辺の比より<br>" +
                                          "　\\(BP : PD = " + orderNote + "\\) となります。";

                        const minX = Math.min(20, Q.x - 15);
                        const maxX = Math.max(240, Q.x + 20);
                        const minY = Math.min(10, Q.y - 15);
                        const maxY = Math.max(140, Q.y + 20);

                        explSvg = '<div style="text-align:center; margin: 6px 0;">' +
                                  '<svg viewBox="' + minX + ' ' + minY + ' ' + (maxX - minX) + ' ' + (maxY - minY) + '" style="background:#fff; border:1px solid #ddd; border-radius:4px; width:220px; height:140px; display:inline-block;">' +
                                  '<polygon points="60,40 180,40 210,120 90,120" fill="#f8fafc" stroke="#333" stroke-width="1.2"/>' +
                                  '<line x1="180" y1="40" x2="90" y2="120" stroke="#888" stroke-width="1.1" stroke-dasharray="3,2"/>' +
                                  '<line x1="' + E.x + '" y1="' + E.y + '" x2="' + F.x + '" y2="' + F.y + '" stroke="#2980b9" stroke-width="1.4"/>' +
                                  '<line x1="' + F.x + '" y1="' + F.y + '" x2="' + Q.x + '" y2="' + Q.y + '" stroke="#e74c3c" stroke-width="1.3" stroke-dasharray="3,2"/>' +
                                  '<line x1="' + extTarget.x + '" y1="' + extTarget.y + '" x2="' + Q.x + '" y2="' + Q.y + '" stroke="#e74c3c" stroke-width="1.3" stroke-dasharray="3,2"/>' +
                                  '<circle cx="' + Q.x + '" cy="' + Q.y + '" r="2.3" fill="#e74c3c"/>' +
                                  '<text x="48" y="36" font-size="9" font-weight="bold">A</text>' +
                                  '<text x="184" y="36" font-size="9" font-weight="bold">B</text>' +
                                  '<text x="214" y="128" font-size="9" font-weight="bold">C</text>' +
                                  '<text x="78" y="128" font-size="9" font-weight="bold">D</text>' +
                                  '<text x="' + (Q.x + 4) + '" y="' + (Q.y + 3) + '" font-size="9" font-weight="bold" fill="#e74c3c">Q</text>' +
                                  '</svg></div>';
                    } else {
                        const G = getIntersect(F.x, F.y, F.x + (A.x - B.x), F.y + (A.y - B.y), B.x, B.y, D.x, D.y);
                        const triPyr = corner === 0 ? "\\triangle BFG \\backsim \\triangle BCD" : "\\triangle DFG \\backsim \\triangle DCB";
                        const ratioPyr = corner === 0 ? "BF : BC = " + m2 + " : " + (m2 + n2) : "DF : DC = " + m2 + " : " + (m2 + n2);
                        const segE = corner === 0 ? "BE" : "DE";
                        const triBut = corner === 0 ? "\\triangle BPE \\backsim \\triangle GPF" : "\\triangle DPE \\backsim \\triangle GPF";
                        const basePyrSide = corner === 0 ? "CD" : "BC";
                        const fgVal = m2 * (m1 + n1);
                        const aeVal = m1 * (m2 + n2);
                        const bgVal = m2;
                        const gdVal = n2;
                        const innerPart = corner === 0 ? "BG" : "DG";
                        const outerPart = corner === 0 ? "GD" : "GB";

                        explanationText = "【解説（内側に平行線を引く）】<br>" +
                                          "1. <strong>内側に平行線を引いてピラミッド型を作る</strong>：<br>" +
                                          "　点 \\(F\\) を通り、辺 \\(" + side1 + "\\) に平行な補助線を引き、対角線 \\(BD\\) との交点を \\(G\\) とします。<br>" +
                                          "2. <strong>新しくできた線分 \\(FG\\) と対角線の比を求める</strong>：<br>" +
                                          "　ピラミッド型 <strong>\\(" + triPyr + "\\)</strong> に注目すると、辺 \\(" + side2 + "\\) の比より相似比は <strong>\\(" + ratioPyr + "\\)</strong> です。<br>" +
                                          "　よって、対角線上の比は <strong>\\(" + innerPart + " : " + outerPart + " = " + bgVal + " : " + gdVal + "\\)</strong> に分かれ、新しくできた線分 <strong>\\(FG\\)</strong> は辺 \\(" + basePyrSide + "\\) の \\(\\frac{" + m2 + "}{" + (m2 + n2) + "}\\) 倍になります。<br>" +
                                          "　平行四辺形の辺 \\(" + side1 + " = " + basePyrSide + "\\) の長さを \\(" + ((m1 + n1) * (m2 + n2)) + "\\) とおくと、\\(" + segE + " = " + aeVal + "\\)、<strong>\\(FG = " + fgVal + "\\)</strong> となります。<br>" +
                                          "3. <strong>チョウチョ型で最後の比を求める</strong>：<br>" +
                                          "　次に、内側のチョウチョ型 <strong>\\(" + triBut + "\\)</strong> に注目すると、相似比は <strong>\\(" + segE + " : FG = " + aeVal + " : " + fgVal + "\\)</strong> です。<br>" +
                                          "　これと \\(" + innerPart + " : " + outerPart + " = " + bgVal + " : " + gdVal + "\\) を合わせることで、<strong>\\(BP : PD = " + ans1 + " : " + ans2 + "\\)</strong> と求められます。";

                        explSvg = '<div style="text-align:center; margin: 6px 0;">' +
                                  '<svg viewBox="30 15 210 130" style="background:#fff; border:1px solid #ddd; border-radius:4px; width:210px; height:130px; display:inline-block;">' +
                                  '<polygon points="60,40 180,40 210,120 90,120" fill="#f8fafc" stroke="#333" stroke-width="1.2"/>' +
                                  '<line x1="180" y1="40" x2="90" y2="120" stroke="#888" stroke-width="1.1" stroke-dasharray="3,2"/>' +
                                  '<line x1="' + E.x + '" y1="' + E.y + '" x2="' + F.x + '" y2="' + F.y + '" stroke="#2980b9" stroke-width="1.4"/>' +
                                  '<line x1="' + F.x + '" y1="' + F.y + '" x2="' + G.x + '" y2="' + G.y + '" stroke="#e74c3c" stroke-width="1.4" stroke-dasharray="3,2"/>' +
                                  '<circle cx="' + G.x + '" cy="' + G.y + '" r="2.2" fill="#e74c3c"/>' +
                                  '<text x="48" y="36" font-size="9" font-weight="bold">A</text>' +
                                  '<text x="184" y="36" font-size="9" font-weight="bold">B</text>' +
                                  '<text x="214" y="128" font-size="9" font-weight="bold">C</text>' +
                                  '<text x="78" y="128" font-size="9" font-weight="bold">D</text>' +
                                  '<text x="' + (G.x + 5) + '" y="' + (G.y + 4) + '" font-size="9" font-weight="bold" fill="#e74c3c">G</text>' +
                                  '</svg></div>';
                    }
                }

                return {
                    problem: problemText + "<br>" + problemSvg,
                    explanation: explanationText + "<br><br><strong>【補助線のイメージ】</strong>" + explSvg
                };
            }
        },
        "相似比の求め方": {
    level: "難関私立",
    formula: `
        <div>相似比は対応する辺の長さや比から求めることが多いが、それ以外にも求める方法がある。</div>
        <div style="margin-top: 6px;">
            ① <strong>対応する辺の長さや比</strong><br>
            ② <strong>周りの長さなど複数の辺の和の比</strong>（相似な図形では、対応する複数の辺の和の比も相似比と等しくなる）<br>
            ③ <strong>面積比の平方根</strong>（相似比が $m : n$ のとき、面積比は $m^2 : n^2$ となるため、面積比 $S_1 : S_2$ の正の平方根 $\\sqrt{S_1} : \\sqrt{S_2}$ が相似比になる）
        </div>
    `,
    selfCheck: [
        '角の二等分線と DE // BC の錯角から、△DBI と △ECI が二等辺三角形（BD = DI、CE = EI）になることを見抜けているか？',
        '折れ線折り返しによって、△ADE の周りの長さ（AD + DE + EA）が 2辺の和 AB + AC と等しくなることに気づけているか？',
        '対応する1辺ずつの長さが分からなくても、△ADE と △ABC の周りの長さの比から相似比を求めて DE の長さを計算できているか？'
    ],
    generateRandom: function () {
        const fracHtml = (num, den) =>
            `<span style="display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; line-height: 1.05; margin: 0 2px; font-size: 0.9em;"><span style="padding: 0 2px;">${num}</span><span style="border-top: 1px solid currentColor; width: 100%; text-align: center; padding: 1px 2px 0;">${den}</span></span>`;

        const gcd = (x, y) => {
            x = Math.abs(x);
            y = Math.abs(y);
            while (y) {
                const t = y;
                y = x % y;
                x = t;
            }
            return x || 1;
        };

        const formatReducedFraction = (num, den) => {
            const g = gcd(num, den);
            const n = num / g;
            const d = den / g;
            if (d === 1) return `${n}`;
            return fracHtml(`${n}`, `${d}`);
        };

        // 不等辺三角形の3辺 (AB, AC, BC) の出題パターン
        const cases = [
            { ab: 7, ac: 8, bc: 9 },
            { ab: 6, ac: 8, bc: 7 },
            { ab: 8, ac: 10, bc: 9 },
            { ab: 9, ac: 11, bc: 10 },
            { ab: 7, ac: 9, bc: 8 },
            { ab: 10, ac: 12, bc: 11 }
        ];
        const { ab, ac, bc } = cases[Math.floor(Math.random() * cases.length)];

        const sumAbAc = ab + ac;
        const perimeterAbc = ab + ac + bc;
        const gRatio = gcd(sumAbAc, perimeterAbc);
        const simM = sumAbAc / gRatio;
        const simN = perimeterAbc / gRatio;
        const ratioStepStr = gRatio > 1
            ? `${sumAbAc} : ${perimeterAbc} = ${simM} : ${simN}`
            : `${sumAbAc} : ${perimeterAbc}`;

        const deNum = bc * simM;
        const deDen = simN;
        const deAnsHtml = formatReducedFraction(deNum, deDen);
        const deCalcHtml = `${bc} × ${fracHtml(`${simM}`, `${simN}`)} = <strong>${deAnsHtml}</strong>`;

        // 厳密SVG座標計算: B=(0,0), C=(bc,0), A=(axMath, ayMath)
        const cosB = (ab * ab + bc * bc - ac * ac) / (2 * ab * bc);
        const clampedCosB = Math.max(-0.9, Math.min(0.9, cosB));
        const sinB = Math.sqrt(Math.max(0.1, 1 - clampedCosB * clampedCosB));
        const axMath = ab * clampedCosB;
        const ayMath = ab * sinB;

        // 内心 I の座標（角B, 角Cの二等分線の交点）
        const ixMath = (bc * axMath + ac * 0 + ab * bc) / perimeterAbc;
        const iyMath = (bc * ayMath) / perimeterAbc;

        // DE // BC かつ I を通る線分と AB, AC の交点 D, E
        const tRatio = (ayMath - iyMath) / ayMath;
        const dxMath = axMath + (0 - axMath) * tRatio;
        const dyMath = iyMath;
        const exMath = axMath + (bc - axMath) * tRatio;
        const eyMath = iyMath;

        // 基準スケールでSVG座標へ変換
        const minMX = Math.min(0, axMath);
        const maxMX = Math.max(bc, axMath);
        const spanX = Math.max(1, maxMX - minMX);
        const spanY = Math.max(1, ayMath);
        const scale = Math.min(220 / spanX, 150 / spanY);

        const baseToSvg = (mx, my) => ({
            x: mx * scale,
            y: -my * scale
        });

        const rawA = baseToSvg(axMath, ayMath);
        const rawB = baseToSvg(0, 0);
        const rawC = baseToSvg(bc, 0);
        const rawI = baseToSvg(ixMath, iyMath);
        const rawD = baseToSvg(dxMath, dyMath);
        const rawE = baseToSvg(exMath, eyMath);

        // 三角形の重心を中心に 0°〜359°（1°単位）でランダム回転
        const rotDeg = Math.floor(Math.random() * 360);
        const rotRad = (rotDeg * Math.PI) / 180;
        const cosR = Math.cos(rotRad);
        const sinR = Math.sin(rotRad);
        const pivotX = (rawA.x + rawB.x + rawC.x) / 3;
        const pivotY = (rawA.y + rawB.y + rawC.y) / 3;

        const rotatePt = (pt) => {
            const dx = pt.x - pivotX;
            const dy = pt.y - pivotY;
            return {
                x: Number((pivotX + dx * cosR - dy * sinR).toFixed(2)),
                y: Number((pivotY + dx * sinR + dy * cosR).toFixed(2))
            };
        };

        const pA = rotatePt(rawA);
        const pB = rotatePt(rawB);
        const pC = rotatePt(rawC);
        const pI = rotatePt(rawI);
        const pD = rotatePt(rawD);
        const pE = rotatePt(rawE);

        // 平行マーク（DE と BC の中点に矢印記号）
        const drawParallelArrows = (p1, p2) => {
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2;
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            const nx = -uy;
            const ny = ux;
            const s = 4.2;
            const tipX = mx + ux * 2;
            const tipY = my + uy * 2;
            const p1x = (tipX - ux * s + nx * (s * 0.7)).toFixed(2);
            const p1y = (tipY - uy * s + ny * (s * 0.7)).toFixed(2);
            const p2x = (tipX - ux * s - nx * (s * 0.7)).toFixed(2);
            const p2y = (tipY - uy * s - ny * (s * 0.7)).toFixed(2);
            return `<polyline points="${p1x},${p1y} ${tipX.toFixed(2)},${tipY.toFixed(2)} ${p2x},${p2y}" fill="none" stroke="#0f172a" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`;
        };

        // 角の二等分線の等角マーク（・マーク / △マーク）
        const unitVec = (from, to) => {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const l = Math.hypot(dx, dy) || 1;
            return { x: dx / l, y: dy / l };
        };

        const uBA = unitVec(pB, pA);
        const uBI = unitVec(pB, pI);
        const uBC = unitVec(pB, pC);
        const bMark1 = {
            x: (pB.x + (uBA.x + uBI.x) * 11).toFixed(2),
            y: (pB.y + (uBA.y + uBI.y) * 11).toFixed(2)
        };
        const bMark2 = {
            x: (pB.x + (uBI.x + uBC.x) * 11).toFixed(2),
            y: (pB.y + (uBI.y + uBC.y) * 11).toFixed(2)
        };

        const uCA = unitVec(pC, pA);
        const uCI = unitVec(pC, pI);
        const uCB = unitVec(pC, pB);
        const cMark1 = {
            x: pC.x + (uCA.x + uCI.x) * 11,
            y: pC.y + (uCA.y + uCI.y) * 11
        };
        const cMark2 = {
            x: pC.x + (uCI.x + uCB.x) * 11,
            y: pC.y + (uCI.y + uCB.y) * 11
        };
        const triMark = (pt) => {
            const r = 2.3;
            return `<polygon points="${pt.x.toFixed(2)},${(pt.y - r).toFixed(2)} ${(pt.x - r * 0.87).toFixed(2)},${(pt.y + r * 0.6).toFixed(2)} ${(pt.x + r * 0.87).toFixed(2)},${(pt.y + r * 0.6).toFixed(2)}" fill="none" stroke="#0f172a" stroke-width="1.1"/>`;
        };

        // ラベルを回転後の図形の外側方向へ配置（文字自体は回転させず正立表示）
        const offsetOutward = (pt, refCenter, dist) => {
            const dx = pt.x - refCenter.x;
            const dy = pt.y - refCenter.y;
            const l = Math.hypot(dx, dy) || 1;
            return {
                x: Number((pt.x + (dx / l) * dist).toFixed(2)),
                y: Number((pt.y + (dy / l) * dist).toFixed(2))
            };
        };

        // 点 I のラベルは線分 DE から離れる方向（BC側）へオフセット
        const midDE = { x: (pD.x + pE.x) / 2, y: (pD.y + pE.y) / 2 };
        const nDE = unitVec(midDE, pA);
        const lblA = offsetOutward(pA, { x: pivotX, y: pivotY }, 14);
        const lblB = offsetOutward(pB, { x: pivotX, y: pivotY }, 14);
        const lblC = offsetOutward(pC, { x: pivotX, y: pivotY }, 14);
        const lblD = offsetOutward(pD, { x: pivotX, y: pivotY }, 13);
        const lblE = offsetOutward(pE, { x: pivotX, y: pivotY }, 13);
        const lblI = {
            x: Number((pI.x - nDE.x * 13).toFixed(2)),
            y: Number((pI.y - nDE.y * 13).toFixed(2))
        };

        // 回転後の全要素・ラベルを含む viewBox を動的に算出
        const allPts = [pA, pB, pC, pD, pE, pI, lblA, lblB, lblC, lblD, lblE, lblI];
        let minVX = Infinity, maxVX = -Infinity, minVY = Infinity, maxVY = -Infinity;
        allPts.forEach(pt => {
            if (pt.x < minVX) minVX = pt.x;
            if (pt.x > maxVX) maxVX = pt.x;
            if (pt.y < minVY) minVY = pt.y;
            if (pt.y > maxVY) maxVY = pt.y;
        });
        const pad = 16;
        const viewBox = `${Math.floor(minVX - pad)} ${Math.floor(minVY - pad)} ${Math.ceil(maxVX - minVX + pad * 2)} ${Math.ceil(maxVY - minVY + pad * 2)}`;

        const svgHtml = `
            <div style="margin: 10px 0 8px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
                <svg viewBox="${viewBox}" style="width: 100%; max-width: 310px; height: auto;">
                    <!-- 不等辺三角形 ABC -->
                    <polygon points="${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y}" fill="#f8fafc" fill-opacity="0.75" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>

                    <!-- 線分 DE -->
                    <line x1="${pD.x}" y1="${pD.y}" x2="${pE.x}" y2="${pE.y}" stroke="#2563eb" stroke-width="2"/>

                    <!-- 角B, 角C の二等分線 BI, CI -->
                    <line x1="${pB.x}" y1="${pB.y}" x2="${pI.x}" y2="${pI.y}" stroke="#dc2626" stroke-width="1.4" stroke-dasharray="4,3"/>
                    <line x1="${pC.x}" y1="${pC.y}" x2="${pI.x}" y2="${pI.y}" stroke="#dc2626" stroke-width="1.4" stroke-dasharray="4,3"/>

                    <!-- 平行マーク -->
                    ${drawParallelArrows(pD, pE)}
                    ${drawParallelArrows(pB, pC)}

                    <!-- 等角マーク -->
                    <circle cx="${bMark1.x}" cy="${bMark1.y}" r="1.9" fill="#0f172a"/>
                    <circle cx="${bMark2.x}" cy="${bMark2.y}" r="1.9" fill="#0f172a"/>
                    ${triMark(cMark1)}
                    ${triMark(cMark2)}

                    <!-- 点 D, E, I -->
                    <circle cx="${pD.x}" cy="${pD.y}" r="2.8" fill="#2563eb"/>
                    <circle cx="${pE.x}" cy="${pE.y}" r="2.8" fill="#2563eb"/>
                    <circle cx="${pI.x}" cy="${pI.y}" r="3" fill="#dc2626"/>

                    <!-- 頂点・点ラベル（正立表示） -->
                    <text x="${lblA.x}" y="${lblA.y}" font-size="13" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">A</text>
                    <text x="${lblB.x}" y="${lblB.y}" font-size="13" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">B</text>
                    <text x="${lblC.x}" y="${lblC.y}" font-size="13" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">C</text>
                    <text x="${lblD.x}" y="${lblD.y}" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#2563eb">D</text>
                    <text x="${lblE.x}" y="${lblE.y}" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#2563eb">E</text>
                    <text x="${lblI.x}" y="${lblI.y}" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#dc2626">I</text>
                </svg>
            </div>
        `;

        return {
            problem: `
                <div>
                    不等辺三角形 $\\mathrm{ABC}$ がある。$\\angle\\mathrm{B}$、$\\angle\\mathrm{C}$ の二等分線の交点を $\\mathrm{I}$ とし、点 $\\mathrm{I}$ を通り辺 $\\mathrm{BC}$ に平行な直線と辺 $\\mathrm{AB}$、$\\mathrm{AC}$ との交点をそれぞれ $\\mathrm{D}$、$\\mathrm{E}$ とする。<br>
                    $\\mathrm{AB} = ${ab}$、$\\mathrm{AC} = ${ac}$、$\\mathrm{BC} = ${bc}$、$\\mathrm{DE} // \\mathrm{BC}$ のとき、$\\mathrm{DE}$ の長さを求めなさい。
                </div>
                ${svgHtml}
            `,
            answer: `DE = ${deAnsHtml}`,
            explanation: `
                <strong>1. 二等辺三角形を見つける</strong><br>
                $\\mathrm{BI}$ は $\\angle\\mathrm{B}$ の二等分線なので $\\angle\\mathrm{DBI} = \\angle\\mathrm{IBC}$。<br>
                また、$\\mathrm{DE} // \\mathrm{BC}$ より平行線の錯角は等しいので $\\angle\\mathrm{DIB} = \\angle\\mathrm{IBC}$。<br>
                よって $\\angle\\mathrm{DBI} = \\angle\\mathrm{DIB}$ となり、2つの底角が等しいので $\\triangle\\mathrm{DBI}$ は $\\mathrm{DB} = \\mathrm{DI}$ の<strong>二等辺三角形</strong>である。<br>
                同様に、$\\mathrm{CI}$ は $\\angle\\mathrm{C}$ の二等分線であり、錯角より $\\angle\\mathrm{ECI} = \\angle\\mathrm{ICB} = \\angle\\mathrm{EIC}$ となるため、$\\triangle\\mathrm{ECI}$ も $\\mathrm{EC} = \\mathrm{EI}$ の<strong>二等辺三角形</strong>である。<br><br>

                <strong>2. $\\triangle\\mathrm{ADE}$ の周りの長さを求める</strong><br>
                $\\mathrm{DI} = \\mathrm{DB}$、$\\mathrm{EI} = \\mathrm{EC}$ を利用すると、$\\triangle\\mathrm{ADE}$ の周りの長さは<br>
                $\\mathrm{AD} + \\mathrm{DE} + \\mathrm{EA} = \\mathrm{AD} + (\\mathrm{DI} + \\mathrm{EI}) + \\mathrm{EA} = (\\mathrm{AD} + \\mathrm{DB}) + (\\mathrm{AE} + \\mathrm{EC}) = \\mathrm{AB} + \\mathrm{AC}$<br>
                よって、$\\triangle\\mathrm{ADE}$ の周りの長さは ${ab} + ${ac} = <strong>${sumAbAc}</strong>。<br><br>

                <strong>3. 周りの長さの比から相似比を求めて DE を出す</strong><br>
                $\\triangle\\mathrm{ABC}$ の周りの長さは ${ab} + ${ac} + ${bc} = <strong>${perimeterAbc}</strong>。<br>
                $\\mathrm{DE} // \\mathrm{BC}$ より $\\triangle\\mathrm{ADE} \\sim \\triangle\\mathrm{ABC}$ であり、相似比は周りの長さの比と等しいので、<br>
                $\\triangle\\mathrm{ADE}$ と $\\triangle\\mathrm{ABC}$ の相似比は ${ratioStepStr}。<br>
                対応する辺の比 $\\mathrm{DE} : \\mathrm{BC} = ${simM} : ${simN}$ より、<br>
                DE = ${deCalcHtml}
            `
        };
    }
},

        "台形の内分線": {
            category: "平面図形",
            level: "公立",
            formula: "台形の内部に上底・下底に平行な線を引いて2つの台形に分ける時、その線分を台形の内分線という。<br><br>" +
                     '<div style="text-align:center; margin: 8px 0;">' +
                     '<svg viewBox="0 0 240 190" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:220px; height:174px; display:inline-block;">' +
                     // 平行記号（矢印）
                     '<polyline points="116,52 121,55 116,58" fill="none" stroke="#64748b" stroke-width="1.2"/>' +
                     '<polyline points="116,89.5 121,92.5 116,95.5" fill="none" stroke="#2980b9" stroke-width="1.2"/>' +
                     '<polyline points="116,132 121,135 116,138" fill="none" stroke="#64748b" stroke-width="1.2"/>' +
                     // 台形ABCD
                     '<polygon points="80,55 160,55 195,135 45,135" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>' +
                     // 内分線EF
                     '<line x1="63.6" y1="92.5" x2="176.4" y2="92.5" stroke="#2980b9" stroke-width="1.6"/>' +
                     '<circle cx="63.6" cy="92.5" r="2.3" fill="#2980b9"/>' +
                     '<circle cx="176.4" cy="92.5" r="2.3" fill="#2980b9"/>' +
                     // 頂点・点のラベル
                     '<text x="68" y="51" font-size="11" font-weight="bold" fill="#1e293b">A</text>' +
                     '<text x="163" y="51" font-size="11" font-weight="bold" fill="#1e293b">D</text>' +
                     '<text x="33" y="143" font-size="11" font-weight="bold" fill="#1e293b">B</text>' +
                     '<text x="199" y="143" font-size="11" font-weight="bold" fill="#1e293b">C</text>' +
                     '<text x="50" y="96" font-size="11" font-weight="bold" fill="#2980b9">E</text>' +
                     '<text x="181" y="96" font-size="11" font-weight="bold" fill="#2980b9">F</text>' +
                     // 長さ a, b, x
                     '<text x="116" y="45" font-size="11" font-weight="bold" font-style="italic" fill="#1e293b">a</text>' +
                     '<text x="116" y="151" font-size="11" font-weight="bold" font-style="italic" fill="#1e293b">b</text>' +
                     '<text x="116" y="86" font-size="11" font-weight="bold" font-style="italic" fill="#2980b9">x</text>' +
                     // 比（左側のみ）
                     '<text x="53" y="76" font-size="11" font-weight="bold" fill="#e11d48">ⓜ</text>' +
                     '<text x="37" y="116" font-size="11" font-weight="bold" fill="#e11d48">ⓝ</text>' +
                     '</svg>' +
                     '</div>' +
                     "台形 \\(ABCD\\) の上底 \\(AD = a\\)、下底 \\(BC = b\\) とし、辺 \\(AB\\)、\\(CD\\) をそれぞれ \\(m : n\\) に分ける点を \\(E\\)、\\(F\\) とするとき、内分線の長さ \\(x\\) は次式で求められる。<br><br>" +
                     "\\(x = \\frac{an + bm}{m + n}\\)<br><br>" +
                     "<strong>※覚え方のコツ：</strong>「たすき掛け」の要領で、上底 \\(a\\) には反対側の比 \\(n\\) を、下底 \\(b\\) には反対側の比 \\(m\\) を掛け合わせて足し、比の合計 \\((m + n)\\) で割る！",
            generateRandom: function() {
                function gcd(x, y) { return y === 0 ? x : gcd(y, x % y); }
                function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
                function getCircled(n) {
                    const map = {1: '①', 2: '②', 3: '③', 4: '④', 5: '⑤'};
                    return map[n] || n;
                }

                const a = randInt(2, 5) * 2;
                const b = a + randInt(2, 4) * 2;
                const m = randInt(1, 3);
                const n = randInt(1, 3);
                const finalN = (m === n) ? n + 1 : n;

                const num = a * finalN + b * m;
                const den = m + finalN;
                const g = gcd(num, den);
                
                let ansText = "";
                if (den / g === 1) {
                    ansText = (num / g).toString();
                } else {
                    ansText = "\\frac{" + (num / g) + "}{" + (den / g) + "}";
                }

                const mCircled = getCircled(m);
                const nCircled = getCircled(finalN);

                const problemText = "右の図の台形 \\(ABCD\\) において、上底 \\(AD = " + a + "\\)、下底 \\(BC = " + b + "\\) である。<br>" +
                                    "辺 \\(AB\\) 上の点 \\(E\\)、辺 \\(CD\\) 上の点 \\(F\\) が \\(AE : EB = " + mCircled + " : " + nCircled + "\\) となるように引いた線分 \\(EF\\) の長さ \\(x\\) を求めなさい。";

                const maxBottomWidth = 140;
                const scale = maxBottomWidth / b;
                const widthAD = a * scale;
                const widthBC = b * scale;

                const yTop = 55;
                const yBottom = 135;
                const cx = 120;
                const cy = 95;

                const xA = cx - widthAD / 2;
                const xD = cx + widthAD / 2;
                const xB = cx - widthBC / 2;
                const xC = cx + widthBC / 2;

                const ratio = m / (m + finalN);
                const yE = yTop + ratio * (yBottom - yTop);
                const xE = xA + ratio * (xB - xA);
                const xF = xD + ratio * (xC - xD);

                const midAD_x = cx;
                const midAD_y = yTop;
                const midBC_x = cx;
                const midBC_y = yBottom;
                const midEF_x = (xE + xF) / 2;
                const midEF_y = yE;

                const xAE_mid = (xA + xE) / 2;
                const yAE_mid = (yTop + yE) / 2;
                const xEB_mid = (xE + xB) / 2;
                const yEB_mid = (yE + yBottom) / 2;

                const rotations = [0, 90, 180, 270];
                const rot = rotations[Math.floor(Math.random() * rotations.length)];

                function rotatePoint(px, py, angleDeg) {
                    const rad = angleDeg * Math.PI / 180;
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);
                    const dx = px - cx;
                    const dy = py - cy;
                    return {
                        x: cx + dx * cos - dy * sin,
                        y: cy + dx * sin + dy * cos
                    };
                }

                const pA = rotatePoint(xA, yTop, rot);
                const pD = rotatePoint(xD, yTop, rot);
                const pB = rotatePoint(xB, yBottom, rot);
                const pC = rotatePoint(xC, yBottom, rot);
                const pE = rotatePoint(xE, yE, rot);
                const pF = rotatePoint(xF, yE, rot);

                const pMidAD = rotatePoint(midAD_x, midAD_y, rot);
                const pMidBC = rotatePoint(midBC_x, midBC_y, rot);
                const pMidEF = rotatePoint(midEF_x, midEF_y, rot);
                const pAE = rotatePoint(xAE_mid, yAE_mid, rot);
                const pEB = rotatePoint(xEB_mid, yEB_mid, rot);

                function getLabelPos(pt, dist = 12) {
                    const dx = pt.x - cx;
                    const dy = pt.y - cy;
                    const len = Math.hypot(dx, dy) || 1;
                    return {
                        x: pt.x + (dx / len) * dist,
                        y: pt.y + (dy / len) * dist
                    };
                }

                const labA = getLabelPos(pA, 11);
                const labD = getLabelPos(pD, 11);
                const labB = getLabelPos(pB, 11);
                const labC = getLabelPos(pC, 11);
                const labE = getLabelPos(pE, 11);
                const labF = getLabelPos(pF, 11);
                const labA_len = getLabelPos(pMidAD, 12);
                const labB_len = getLabelPos(pMidBC, 12);
                const labX_len = getLabelPos(pMidEF, 10);
                const labM = getLabelPos(pAE, 13);
                const labN = getLabelPos(pEB, 13);

                const problemSvg = '<div style="text-align:center; margin: 8px 0;">' +
                                   '<svg viewBox="0 0 240 190" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:220px; height:174px; display:inline-block;">' +
                                   
                                   '<g transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')">' +
                                   '<polyline points="' + (midAD_x - 3) + ',' + (yTop - 3) + ' ' + (midAD_x + 2) + ',' + yTop + ' ' + (midAD_x - 3) + ',' + (yTop + 3) + '" fill="none" stroke="#64748b" stroke-width="1.2"/>' +
                                   '<polyline points="' + (midEF_x - 3) + ',' + (yE - 3) + ' ' + (midEF_x + 2) + ',' + yE + ' ' + (midEF_x - 3) + ',' + (yE + 3) + '" fill="none" stroke="#2980b9" stroke-width="1.2"/>' +
                                   '<polyline points="' + (midBC_x - 3) + ',' + (yBottom - 3) + ' ' + (midBC_x + 2) + ',' + yBottom + ' ' + (midBC_x - 3) + ',' + (yBottom + 3) + '" fill="none" stroke="#64748b" stroke-width="1.2"/>' +
                                   '<polygon points="' + xA + ',' + yTop + ' ' + xD + ',' + yTop + ' ' + xC + ',' + yBottom + ' ' + xB + ',' + yBottom + '" fill="#eef2f7" stroke="#334155" stroke-width="1.5"/>' +
                                   '<line x1="' + xE + '" y1="' + yE + '" x2="' + xF + '" y2="' + yE + '" stroke="#2980b9" stroke-width="1.6"/>' +
                                   '<circle cx="' + xE + '" cy="' + yE + '" r="2.3" fill="#2980b9"/>' +
                                   '<circle cx="' + xF + '" cy="' + yE + '" r="2.3" fill="#2980b9"/>' +
                                   '</g>' +

                                   '<text x="' + (labA.x - 4) + '" y="' + (labA.y + 3) + '" font-size="10" font-weight="bold" fill="#1e293b">A</text>' +
                                   '<text x="' + (labD.x - 4) + '" y="' + (labD.y + 3) + '" font-size="10" font-weight="bold" fill="#1e293b">D</text>' +
                                   '<text x="' + (labB.x - 4) + '" y="' + (labB.y + 3) + '" font-size="10" font-weight="bold" fill="#1e293b">B</text>' +
                                   '<text x="' + (labC.x - 4) + '" y="' + (labC.y + 3) + '" font-size="10" font-weight="bold" fill="#1e293b">C</text>' +
                                   '<text x="' + (labE.x - 5) + '" y="' + (labE.y + 4) + '" font-size="10" font-weight="bold" fill="#2980b9">E</text>' +
                                   '<text x="' + (labF.x - 4) + '" y="' + (labF.y + 4) + '" font-size="10" font-weight="bold" fill="#2980b9">F</text>' +
                                   '<text x="' + (labA_len.x - 4) + '" y="' + (labA_len.y + 3) + '" font-size="10" font-weight="bold" fill="#1e293b">' + a + '</text>' +
                                   '<text x="' + (labB_len.x - 4) + '" y="' + (labB_len.y + 3) + '" font-size="10" font-weight="bold" fill="#1e293b">' + b + '</text>' +
                                   '<text x="' + (labX_len.x - 4) + '" y="' + (labX_len.y + 3) + '" font-size="10" font-weight="bold" font-style="italic" fill="#2980b9">x</text>' +
                                   '<text x="' + (labM.x - 5) + '" y="' + (labM.y + 4) + '" font-size="10" font-weight="bold" fill="#e11d48">' + mCircled + '</text>' +
                                   '<text x="' + (labN.x - 5) + '" y="' + (labN.y + 4) + '" font-size="10" font-weight="bold" fill="#e11d48">' + nCircled + '</text>' +
                                   '</svg></div>';

                const explanationText = "【解説】<br>" +
                                        "1. <strong>公式の利用</strong>：<br>" +
                                        "　台形の内分線の長さ \\(x\\) は、上底 \\(a\\) と下底 \\(b\\) に、反対側の比 \\(n\\)、\\(m\\) をたすき掛けにして足し、比の和 \\((m + n)\\) で割ることで求められます。<br>" +
                                        "2. <strong>代入して計算</strong>：<br>" +
                                        "　\\(x = \\frac{an + bm}{m + n}\\)<br>" +
                                        "　\\(x = \\frac{" + a + " \\times " + finalN + " + " + b + " \\times " + m + "}{" + m + " + " + finalN + "}\\)<br>" +
                                        "　\\(x = \\frac{" + (a * finalN) + " + " + (b * m) + "}{" + (m + finalN) + "}\\)<br>" +
                                        "　\\(x = \\frac{" + num + "}{" + den + "} = \\mathbf{" + ansText + "}\\)";

                return {
                    problem: problemText + "<br>" + problemSvg,
                    explanation: explanationText
                };
            }
        }, 
        "三角形内の垂線": {
            category: "平面図形",
            level: "難関私立",
            formula: "三角形の内部や辺上に複数の垂線が下ろされている問題では、<strong>頂点から下ろした全体の高さを \\(h\\) とおき、相似比や平行線と線分の比を利用してそれぞれの垂線の長さを \\(h\\) の式で表す</strong>ことが基本。<br><br>" +
                     "左側の辺の比（\\(AD:AB\\)）や右側の辺の比（\\(AE:AC\\)）を利用して、それぞれの垂線が全体の高さ \\(h\\) に対して何倍になっているかを求め、比や和から長さを算出しよう！",
            generateRandom: function() {
                function gcd(x, y) { return y === 0 ? x : gcd(y, x % y); }
                function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
                function simplifyPair(a, b) {
                    const g = gcd(a, b);
                    return [a / g, b / g];
                }

                let m, n, ab, p, q, ac, leftCoeffNum, rightCoeffNum, commonDenom;
                
                // 比の数値をランダムに生成し、それぞれ最も簡単な整数比に約分する
                while (true) {
                    let rawM = randInt(1, 5);
                    let rawN = randInt(1, 5);
                    [m, n] = simplifyPair(rawM, rawN);
                    // 1:1 のように左右同じ比になるのを防ぐ、または m===n を避ける
                    if (m === n) continue;
                    ab = m + n;

                    let rawP = randInt(1, 5);
                    let rawQ = randInt(1, 5);
                    [p, q] = simplifyPair(rawP, rawQ);
                    if (p === q) continue;
                    ac = p + q;

                    leftCoeffNum = m * ac;
                    rightCoeffNum = p * ab;
                    commonDenom = ab * ac;

                    // 最終的な係数が一致しない場合にループを抜ける
                    if (leftCoeffNum !== rightCoeffNum) break;
                }

                const g = gcd(leftCoeffNum, rightCoeffNum);
                const ratioL = leftCoeffNum / g;
                const ratioR = rightCoeffNum / g;

                const targetSum = leftCoeffNum + rightCoeffNum;
                const mult = randInt(1, 6);
                const totalSum = targetSum * mult;
                const hVal = commonDenom * mult;
                const dhVal = leftCoeffNum * mult;
                const eiVal = rightCoeffNum * mult;

                const problemText = "不等辺三角形 \\(ABC\\) において、辺 \\(AB\\) 上に点 \\(D\\)、辺 \\(AC\\) 上に点 \\(E\\) がある。<br>" +
                                    "点 \\(D\\)、\\(E\\) から底辺 \\(BC\\) にそれぞれ垂線を下ろしたときの足を \\(H\\)、\\(I\\) とする。<br>" +
                                    "\\(AD : DB = " + m + " : " + n + "\\)、\\(AE : EC = " + p + " : " + q + "\\) であり、\\(DH + EI = " + totalSum + "\\) のとき、線分 \\(DH\\) および \\(EI\\) の長さをそれぞれ求めなさい。";

                const xA = 120, yA = 25;
                const xB = 40, yB = 135;
                const xC = 200, yC = 135;

                const tD = m / ab;
                const xD = xB + tD * (xA - xB);
                const yD = yB + tD * (yA - yB);

                const tE = p / ac;
                const xE = xC + tE * (xA - xC);
                const yE = yC + tE * (yA - yC);

                const xH = xD;
                const yH = 135;

                const xI = xE;
                const yI = 135;

                const problemSvg = '<div style="text-align:center; margin: 8px 0;">' +
                                   '<svg viewBox="0 0 240 160" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:220px; height:146px; display:inline-block;">' +
                                   '<polygon points="' + xA + ',' + yA + ' ' + xB + ',' + yB + ' ' + xC + ',' + yC + '" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>' +
                                   '<line x1="' + xD + '" y1="' + yD + '" x2="' + xH + '" y2="' + yH + '" stroke="#2980b9" stroke-width="1.5" stroke-dasharray="3,3"/>' +
                                   '<line x1="' + xE + '" y1="' + yE + '" x2="' + xI + '" y2="' + yI + '" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="3,3"/>' +
                                   '<rect x="' + (xH - 2) + '" y="' + (yH - 8) + '" width="8" height="8" fill="none" stroke="#334155" stroke-width="1"/>' +
                                   '<rect x="' + (xI - 6) + '" y="' + (yI - 8) + '" width="8" height="8" fill="none" stroke="#334155" stroke-width="1"/>' +
                                   '<text x="' + (xA - 4) + '" y="' + (yA - 8) + '" font-size="10" font-weight="bold" fill="#1e293b">A</text>' +
                                   '<text x="' + (xB - 12) + '" y="' + (yB + 14) + '" font-size="10" font-weight="bold" fill="#1e293b">B</text>' +
                                   '<text x="' + (xC + 6) + '" y="' + (yC + 14) + '" font-size="10" font-weight="bold" fill="#1e293b">C</text>' +
                                   '<text x="' + (xD - 12) + '" y="' + (yD + 2) + '" font-size="10" font-weight="bold" fill="#2980b9">D</text>' +
                                   '<text x="' + (xE + 6) + '" y="' + (yE + 2) + '" font-size="10" font-weight="bold" fill="#e11d48">E</text>' +
                                   '<text x="' + (xH - 4) + '" y="' + (yH + 14) + '" font-size="10" font-weight="bold" fill="#2980b9">H</text>' +
                                   '<text x="' + (xI - 4) + '" y="' + (yI + 14) + '" font-size="10" font-weight="bold" fill="#e11d48">I</text>' +
                                   '</svg></div>';

                const explanationText = "【解説】<br>" +
                                        "1. <strong>全体の高さを基準にする</strong>：<br>" +
                                        "　頂点 \\(A\\) から底辺 \\(BC\\) に下ろした垂線の足を \\(P\\) とし、高さ \\(AP\\) を \\(h\\) とおく。<br>" +
                                        "2. <strong>左右の比からそれぞれの垂線の長さを表す</strong>：<br>" +
                                        "　\\(AD : AB = " + m + " : " + ab + "\\) より、\\(DH = \\frac{" + m + "}{" + ab + "}h\\)<br>" +
                                        "　\\(AE : AC = " + p + " : " + ac + "\\) より、\\(EI = \\frac{" + p + "}{" + ac + "}h\\)<br>" +
                                        "3. <strong>\\(DH : EI\\) の比を求めて最も簡単な整数比にする</strong>：<br>" +
                                        "　\\(DH : EI = \\frac{" + m + "}{" + ab + "} : \\frac{" + p + "}{" + ac + "} = " + leftCoeffNum + " : " + rightCoeffNum + "\\)<br>" +
                                        "　これを最も簡単な整数の比に直すと、\\(DH : EI = \\mathbf{" + ratioL + " : " + ratioR + "}\\) となる。<br>" +
                                        "4. <strong>文字でおいて方程式を立てて解く</strong>：<br>" +
                                        "　\\(DH = " + ratioL + "x\\)、\\(EI = " + ratioR + "x\\) とおく（\\(x\\) は比例定数）。<br>" +
                                        "　\\(DH + EI = " + totalSum + "\\) より、<br>" +
                                        "　\\(" + ratioL + "x + " + ratioR + "x = " + totalSum + "\\)<br>" +
                                        "　\\(" + (ratioL + ratioR) + "x = " + totalSum + "\\) 　\\(\\to\\)　\\(x = " + (totalSum / (ratioL + ratioR)) + "\\)<br>" +
                                        "5. <strong>答えの算出</strong>：<br>" +
                                        "　\\(DH = " + ratioL + " \\times " + (totalSum / (ratioL + ratioR)) + " = \\mathbf{" + dhVal + "}\\)<br>" +
                                        "　\\(EI = " + ratioR + " \\times " + (totalSum / (ratioL + ratioR)) + " = \\mathbf{" + eiVal + "}\\)";

                return {
                    problem: problemText + "<br>" + problemSvg,
                    explanation: explanationText
                };
            }
        },
        "角の二等分線と線分比": {
            category: "平面図形",
            level: "基礎",
            formula: "次の図形のとき、\\(AB : AC = BD : CD\\)<br>" +
                     "\\(AB : BD = AC : CD\\) が成立する。<br><br>" +
                     '<div style="text-align:center; margin: 8px 0;">' +
                     '<svg viewBox="0 0 240 155" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:220px; height:142px; display:inline-block;">' +
                     '<polygon points="95,25 35,130 205,130" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>' +
                     '<line x1="95" y1="25" x2="110.3" y2="130" stroke="#2980b9" stroke-width="1.6"/>' +
                     '<circle cx="88.5" cy="48" r="2.2" fill="#2980b9"/>' +
                     '<circle cx="105" cy="46" r="2.2" fill="#2980b9"/>' +
                     '<text x="91" y="18" font-size="10" font-weight="bold" fill="#1e293b">A</text>' +
                     '<text x="23" y="138" font-size="10" font-weight="bold" fill="#1e293b">B</text>' +
                     '<text x="209" y="138" font-size="10" font-weight="bold" fill="#1e293b">C</text>' +
                     '<text x="106" y="143" font-size="10" font-weight="bold" fill="#2980b9">D</text>' +
                     '</svg>' +
                     '</div>' +
                     "<strong>(証明)</strong><br>" +
                     "\\(AD // EC\\) となるように，点 \\(E\\) をとる。<br>" +
                     "\\(AD // EC\\) より 平行線の錯角が等しいので \\(\\angle DAC = \\angle ACE\\) …①<br>" +
                     "平行線の同位角が等しいので \\(\\angle BAD = \\angle AEC\\) …②<br>" +
                     "仮定より \\(\\angle BAD = \\angle CAD\\) …③<br>" +
                     "①②③より \\(\\angle ACE = \\angle AEC\\)<br>" +
                     "よって 2 角が等しいので \\(\\triangle ACE\\) は二等辺三角形…④<br>" +
                     "\\(AD // EC\\) より \\(BA : AE = BD : DC\\)<br>" +
                     "④より \\(AB : AC = BD : CD\\)<br><br>" +
                     '<div style="text-align:center; margin: 8px 0;">' +
                     '<svg viewBox="0 0 240 220" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:220px; height:202px; display:inline-block;">' +
                     '<line x1="95" y1="110" x2="157.9" y2="11.5" stroke="#64748b" stroke-width="1.3" stroke-dasharray="3,3"/>' +
                     '<line x1="195" y1="195" x2="157.9" y2="11.5" stroke="#64748b" stroke-width="1.3" stroke-dasharray="3,3"/>' +
                     '<polyline points="99,150 103,154 105,149" fill="none" stroke="#2980b9" stroke-width="1.2"/>' +
                     '<polyline points="173,101 177,105 179,100" fill="none" stroke="#64748b" stroke-width="1.2"/>' +
                     '<polygon points="95,110 45,195 195,195" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>' +
                     '<line x1="95" y1="110" x2="109.4" y2="195" stroke="#2980b9" stroke-width="1.6"/>' +
                     '<circle cx="89" cy="132" r="2" fill="#2980b9"/>' +
                     '<circle cx="104" cy="130" r="2" fill="#2980b9"/>' +
                     '<circle cx="182" cy="176" r="2" fill="#e11d48"/>' +
                     '<circle cx="152" cy="31" r="2" fill="#e11d48"/>' +
                     '<text x="83" y="109" font-size="10" font-weight="bold" fill="#1e293b">A</text>' +
                     '<text x="33" y="203" font-size="10" font-weight="bold" fill="#1e293b">B</text>' +
                     '<text x="199" y="203" font-size="10" font-weight="bold" fill="#1e293b">C</text>' +
                     '<text x="105" y="208" font-size="10" font-weight="bold" fill="#2980b9">D</text>' +
                     '<text x="162" y="16" font-size="10" font-weight="bold" fill="#64748b">E</text>' +
                     '</svg>' +
                     '</div>',
            generateRandom: function() {
                function gcd(x, y) { return y === 0 ? x : gcd(y, x % y); }
                function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

                let ab, ac, bdVal, cdVal, g;
                while (true) {
                    ab = randInt(4, 12);
                    ac = randInt(4, 12);
                    if (ab === ac) continue;
                    g = gcd(ab, ac);
                    if (g > 1) break;
                }

                const ratioB = ab / g;
                const ratioC = ac / g;
                const mult = randInt(1, 3);
                bdVal = ratioB * mult;
                cdVal = ratioC * mult;

                const unknownType = randInt(1, 3);
                let problemText = "";
                let ansText = "";
                let eqStep = "";

                if (unknownType === 1) {
                    problemText = "右の図の三角形 \\(ABC\\) において、線分 \\(AD\\) は \\(\\angle BAC\\) の二等分線である。<br>" +
                                  "\\(AB = " + ab + "\\)、\\(AC = " + ac + "\\)、\\(BD = " + bdVal + "\\) のとき、線分 \\(CD\\) の長さを求めなさい。";
                    ansText = cdVal.toString();
                    eqStep = "　\\(" + ab + " : " + ac + " = " + bdVal + " : CD\\)<br>" +
                             "　\\(" + ratioB + " : " + ratioC + " = " + bdVal + " : CD\\)<br>" +
                             "　\\(" + ratioB + " \\times CD = " + (ratioC * bdVal) + "\\)<br>" +
                             "　\\(CD = \\mathbf{" + ansText + "}\\)";
                } else if (unknownType === 2) {
                    problemText = "右の図の三角形 \\(ABC\\) において、線分 \\(AD\\) は \\(\\angle BAC\\) の二等分線である。<br>" +
                                  "\\(AB = " + ab + "\\)、\\(AC = " + ac + "\\)、\\(CD = " + cdVal + "\\) のとき、線分 \\(BD\\) の長さを求めなさい。";
                    ansText = bdVal.toString();
                    eqStep = "　\\(" + ab + " : " + ac + " = BD : " + cdVal + "\\)<br>" +
                             "　\\(" + ratioB + " : " + ratioC + " = BD : " + cdVal + "\\)<br>" +
                             "　\\(" + ratioC + " \\times BD = " + (ratioB * cdVal) + "\\)<br>" +
                             "　\\(BD = \\mathbf{" + ansText + "}\\)";
                } else {
                    problemText = "右の図の三角形 \\(ABC\\) において、線分 \\(AD\\) は \\(\\angle BAC\\) の二等分線である。<br>" +
                                  "\\(AB = " + ab + "\\)、\\(BD = " + bdVal + "\\)、\\(CD = " + cdVal + "\\) のとき、線分 \\(AC\\) の長さを求めなさい。";
                    ansText = ac.toString();
                    eqStep = "　\\(" + ab + " : AC = " + bdVal + " : " + cdVal + "\\)<br>" +
                             "　\\(" + ab + " : AC = " + ratioB + " : " + ratioC + "\\)<br>" +
                             "　\\(" + ratioB + " \\times AC = " + (ab * ratioC) + "\\)<br>" +
                             "　\\(AC = \\mathbf{" + ansText + "}\\)";
                }

                // --- 正確な幾何学的座標計算 ---
                const xB = 55, yB = 130;
                const xC = 185, yC = 130;
                const baseBC = xC - xB; // 130

                // 辺AB, ACのピクセルスケール係数
                const scale = 13;
                const lenAB = ab * scale;
                const lenAC = ac * scale;

                // 余弦定理より頂点Aの座標を算出
                const cosB = (Math.pow(lenAB, 2) + Math.pow(baseBC, 2) - Math.pow(lenAC, 2)) / (2 * lenAB * baseBC);
                const clampedCosB = Math.max(-0.99, Math.min(0.99, cosB));
                const angleB = Math.acos(clampedCosB);

                const xA = xB + lenAB * Math.cos(angleB);
                const yA = yB - lenAB * Math.sin(angleB);

                // 角の二等分線定理より点Dの位置を決定 (BD : CD = ab : ac)
                const t = ab / (ab + ac);
                const xD = xB + t * baseBC;
                const yD = 130;

                // 等角マーク位置の計算
                const lenAB_actual = Math.hypot(xA - xB, yA - yB);
                const lenAC_actual = Math.hypot(xA - xC, yA - yC);
                const lenAD = Math.hypot(xD - xA, yD - yA);

                const uABx = (xB - xA) / lenAB_actual, uABy = (yB - yA) / lenAB_actual;
                const uACx = (xC - xA) / lenAC_actual, uACy = (yC - yA) / lenAC_actual;
                const uADx = (xD - xA) / lenAD, uADy = (yD - yA) / lenAD;

                const mark1X = xA + ((uABx + uADx) / 2) * 20;
                const mark1Y = yA + ((uABy + uADy) / 2) * 20;
                const mark2X = xA + ((uACx + uADx) / 2) * 20;
                const mark2Y = yA + ((uACy + uADy) / 2) * 20;

                // 1°単位のランダム回転角度（0°〜359°）
                const rot = Math.floor(Math.random() * 360);
                const cx = 120, cy = 80;

                function rotatePoint(px, py, angleDeg) {
                    const rad = angleDeg * Math.PI / 180;
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);
                    const dx = px - cx;
                    const dy = py - cy;
                    return {
                        x: cx + dx * cos - dy * sin,
                        y: cy + dx * sin + dy * cos
                    };
                }

                const pA = rotatePoint(xA, yA, rot);
                const pB = rotatePoint(xB, yB, rot);
                const pC = rotatePoint(xC, yC, rot);
                const pD = rotatePoint(xD, yD, rot);

                // 動的なビューボックス（viewBox）計算
                const pts = [pA, pB, pC, pD];
                const minX = Math.min(...pts.map(p => p.x));
                const maxX = Math.max(...pts.map(p => p.x));
                const minY = Math.min(...pts.map(p => p.y));
                const maxY = Math.max(...pts.map(p => p.y));

                const padding = 28;
                const vbX = minX - padding;
                const vbY = minY - padding;
                const vbW = (maxX - minX) + padding * 2;
                const vbH = (maxY - minY) + padding * 2;

                function getLabelPos(pt, dist = 14) {
                    const dx = pt.x - cx;
                    const dy = pt.y - cy;
                    const len = Math.hypot(dx, dy) || 1;
                    return {
                        x: pt.x + (dx / len) * dist,
                        y: pt.y + (dy / len) * dist
                    };
                }

                const labA = getLabelPos(pA, 14);
                const labB = getLabelPos(pB, 15);
                const labC = getLabelPos(pC, 15);
                const labD = getLabelPos(pD, 15);

                const problemSvg = '<div style="text-align:center; margin: 8px 0;">' +
                                   '<svg viewBox="' + vbX + ' ' + vbY + ' ' + vbW + ' ' + vbH + '" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:220px; height:146px; display:inline-block;">' +
                                   '<g transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')">' +
                                   '<polygon points="' + xA + ',' + yA + ' ' + xB + ',' + yB + ' ' + xC + ',' + yC + '" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>' +
                                   '<line x1="' + xA + '" y1="' + yA + '" x2="' + xD + '" y2="' + yD + '" stroke="#2980b9" stroke-width="1.6"/>' +
                                   '<circle cx="' + mark1X + '" cy="' + mark1Y + '" r="2.1" fill="#2980b9"/>' +
                                   '<circle cx="' + mark2X + '" cy="' + mark2Y + '" r="2.1" fill="#2980b9"/>' +
                                   '</g>' +
                                   '<text x="' + labA.x + '" y="' + labA.y + '" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle" dominant-baseline="central">A</text>' +
                                   '<text x="' + labB.x + '" y="' + labB.y + '" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle" dominant-baseline="central">B</text>' +
                                   '<text x="' + labC.x + '" y="' + labC.y + '" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle" dominant-baseline="central">C</text>' +
                                   '<text x="' + labD.x + '" y="' + labD.y + '" font-size="10" font-weight="bold" fill="#2980b9" text-anchor="middle" dominant-baseline="central">D</text>' +
                                   '</svg></div>';

                const explanationText = "【解説】<br>" +
                                        "1. <strong>角の二等分線と線分比の公式を使う</strong>：<br>" +
                                        "　三角形の角の二等分線の性質より、\\(AB : AC = BD : CD\\) が成り立ちます。<br>" +
                                        "2. <strong>値を代入して比例式を解く</strong>：<br>" +
                                        eqStep;

                return {
                    problem: problemText + "<br>" + problemSvg,
                    explanation: explanationText
                };
            }
        },
        "角の二等分線の長さ": {
            category: "平面図形",
            level: "難関私立",
            formula: "次の図形のとき、\\(AD = \\sqrt{AB \\times AC - BD \\times CD}\\) （\\(x = \\sqrt{ab - cd}\\)）が成立する。<br><br>" +
                     '<div style="text-align:center; margin: 8px 0;">' +
                     '<svg viewBox="0 0 240 155" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:220px; height:142px; display:inline-block;">' +
                     '<polygon points="95,25 35,130 205,130" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>' +
                     '<line x1="95" y1="25" x2="110.3" y2="130" stroke="#2980b9" stroke-width="1.6"/>' +
                     '<circle cx="88.5" cy="48" r="2.2" fill="#2980b9"/>' +
                     '<circle cx="105" cy="46" r="2.2" fill="#2980b9"/>' +
                     '<text x="91" y="18" font-size="10" font-weight="bold" fill="#1e293b">A</text>' +
                     '<text x="23" y="138" font-size="10" font-weight="bold" fill="#1e293b">B</text>' +
                     '<text x="209" y="138" font-size="10" font-weight="bold" fill="#1e293b">C</text>' +
                     '<text x="106" y="143" font-size="10" font-weight="bold" fill="#2980b9">D</text>' +
                     '</svg>' +
                     '</div>' +
                     "<strong>【導出・証明】</strong><br>" +
                     "円の知識を利用すると証明できる。導出法が問われる問題もある。<br>" +
                     "\\(\\triangle ABC\\) の外接円を書き，図のように \\(AD\\) を延長して，円との交点を \\(E\\) とする。<br>" +
                     "\\(\\triangle BAE \\sim \\triangle DAC\\) であるから， \\(a : x = (x+y) : b\\)<br>" +
                     "\\(\\to ab = x(x+y) \\to ab = x^2 + xy \\dots ①\\)<br>" +
                     "方べきの定理より \\(xy = cd \\dots ②\\)<br>" +
                     "②を①に代入<br>" +
                     "\\(\\to ab = x^2 + cd \\to x^2 = ab - cd\\) より， \\(x = \\sqrt{ab - cd}\\)<br><br>" +
                     '<div style="text-align:center; margin: 8px 0;">' +
                     '<svg viewBox="0 0 240 230" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:220px; height:210px; display:inline-block;">' +
                     '<circle cx="120" cy="115" r="78" fill="none" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="3,3"/>' +
                     '<polygon points="95.9,40.8 51.1,151.6 188.9,151.6" fill="#f8fafc" stroke="none"/>' +
                     '<polygon points="95.9,40.8 51.1,151.6 120,193.0" fill="rgba(239, 68, 68, 0.16)" stroke="none"/>' +
                     '<polygon points="95.9,40.8 108.9,151.6 188.9,151.6" fill="rgba(41, 128, 185, 0.18)" stroke="none"/>' +
                     '<polygon points="95.9,40.8 51.1,151.6 188.9,151.6" fill="none" stroke="#334155" stroke-width="1.5"/>' +
                     '<line x1="95.9" y1="40.8" x2="120" y2="193.0" stroke="#2980b9" stroke-width="1.6"/>' +
                     '<line x1="51.1" y1="151.6" x2="120" y2="193.0" stroke="#e11d48" stroke-width="1.2" stroke-dasharray="3,3"/>' +
                     '<line x1="188.9" y1="151.6" x2="120" y2="193.0" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3,3"/>' +
                     '<circle cx="95.9" cy="40.8" r="2.2" fill="#1e293b"/>' +
                     '<circle cx="51.1" cy="151.6" r="2.2" fill="#1e293b"/>' +
                     '<circle cx="188.9" cy="151.6" r="2.2" fill="#1e293b"/>' +
                     '<circle cx="120" cy="193.0" r="2.4" fill="#e11d48"/>' +
                     '<circle cx="92" cy="64" r="2" fill="#2980b9"/>' +
                     '<circle cx="106" cy="61" r="2" fill="#2980b9"/>' +
                     '<text x="90" y="31" font-size="10" font-weight="bold" fill="#1e293b">A</text>' +
                     '<text x="38" y="156" font-size="10" font-weight="bold" fill="#1e293b">B</text>' +
                     '<text x="195" y="156" font-size="10" font-weight="bold" fill="#1e293b">C</text>' +
                     '<text x="114" y="146" font-size="10" font-weight="bold" fill="#2980b9">D</text>' +
                     '<text x="117" y="206" font-size="10" font-weight="bold" fill="#e11d48">E</text>' +
                     '<text x="64" y="92" font-size="10" font-style="italic" font-weight="bold" fill="#334155">a</text>' +
                     '<text x="148" y="92" font-size="10" font-style="italic" font-weight="bold" fill="#334155">b</text>' +
                     '<text x="77" y="162" font-size="10" font-style="italic" font-weight="bold" fill="#334155">c</text>' +
                     '<text x="148" y="162" font-size="10" font-style="italic" font-weight="bold" fill="#334155">d</text>' +
                     '<text x="97" y="105" font-size="10" font-style="italic" font-weight="bold" fill="#2980b9">x</text>' +
                     '<text x="107" y="175" font-size="10" font-style="italic" font-weight="bold" fill="#2980b9">y</text>' +
                     '</svg></div>',
            generateRandom: function() {
                function gcd(x, y) { return y === 0 ? x : gcd(y, x % y); }
                function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

                // ルートの中を最も簡単な形にするヘルパー関数 (例: √48 -> 4√3)
                function simplifyRoot(n) {
                    if (Number.isInteger(Math.sqrt(n))) {
                        return Math.sqrt(n).toString();
                    }
                    let out = 1;
                    let inVal = n;
                    for (let i = 2; i * i <= inVal; i++) {
                        while (inVal % (i * i) === 0) {
                            out *= i;
                            inVal /= (i * i);
                        }
                    }
                    if (out === 1) {
                        return "\\sqrt{" + inVal + "}";
                    } else if (inVal === 1) {
                        return out.toString();
                    } else {
                        return out + "\\sqrt{" + inVal + "}";
                    }
                }

                let a, b, g, ratioB, ratioC, mult, bdVal, cdVal, bcVal;
                
                while (true) {
                    a = randInt(5, 10);
                    b = randInt(4, 9);
                    if (a === b) continue;

                    g = gcd(a, b);
                    ratioB = a / g;
                    ratioC = b / g;

                    mult = randInt(2, 4);
                    bdVal = ratioB * mult;
                    cdVal = ratioC * mult;
                    bcVal = bdVal + cdVal;

                    if (bcVal > Math.abs(a - b) + 1 && bcVal < (a + b) - 1) {
                        break;
                    }
                }

                const ab_val = a * b;
                const cd_val = bdVal * cdVal;
                const valInside = ab_val - cd_val;

                const targetType = randInt(0, 1);
                let q1Text = "";
                let q1Step = "";

                if (targetType === 0) {
                    q1Text = "(1) 線分 \\(BD\\) の長さを求めなさい。";
                    q1Step = "　\\(BD : CD = AB : AC = " + a + " : " + b + "\\)<br>" +
                             "　\\(BC = " + bcVal + "\\) より、\\(BD = " + bcVal + " \\times \\frac{" + a + "}{" + (a + b) + "} = \\mathbf{" + bdVal + "}\\)";
                } else {
                    q1Text = "(1) 線分 \\(CD\\) の長さを求めなさい。";
                    q1Step = "　\\(BD : CD = AB : AC = " + a + " : " + b + "\\)<br>" +
                             "　\\(BC = " + bcVal + "\\) より、\\(CD = " + bcVal + " \\times \\frac{" + b + "}{" + (a + b) + "} = \\mathbf{" + cdVal + "}\\)";
                }

                const ansAdStr = simplifyRoot(valInside);

                const problemText = "不等辺三角形 \\(ABC\\) において、\\(AB = " + a + "\\)、\\(AC = " + b + "\\)、\\(BC = " + bcVal + "\\) である。<br>" +
                                    "\\(\\angle BAC\\) の二等分線と \\(BC\\) との交点を \\(D\\) とする。<br>" +
                                    q1Text + "<br>" +
                                    "(2) 線分 \\(AD\\) の長さを求めなさい。";

                const baseBC = 140;
                const scale = baseBC / bcVal;
                const lenAB = a * scale;
                const lenAC = b * scale;

                const xB = 50, yB = 130;
                const xC = xB + baseBC, yC = 130;

                const cosB = (Math.pow(lenAB, 2) + Math.pow(baseBC, 2) - Math.pow(lenAC, 2)) / (2 * lenAB * baseBC);
                const clampedCosB = Math.max(-0.99, Math.min(0.99, cosB));
                const sinB = Math.sqrt(1 - clampedCosB * clampedCosB);

                const xA = xB + lenAB * clampedCosB;
                const yA = yB - lenAB * sinB;

                const t = a / (a + b);
                const xD = xB + t * baseBC;
                const yD = 130;

                const uABx = (xB - xA) / lenAB, uABy = (yB - yA) / lenAB;
                const uACx = (xC - xA) / lenAC, uACy = (yC - yA) / lenAC;
                const lenAD = Math.hypot(xD - xA, yD - yA);
                const uADx = (xD - xA) / lenAD, uADy = (yD - yA) / lenAD;

                const markDist = Math.min(20, lenAB * 0.25, lenAC * 0.25);

                const dir1x = uABx + uADx, dir1y = uABy + uADy;
                const norm1 = Math.hypot(dir1x, dir1y) || 1;
                const mark1X = xA + (dir1x / norm1) * markDist;
                const mark1Y = yA + (dir1y / norm1) * markDist;

                const dir2x = uACx + uADx, dir2y = uACy + uADy;
                const norm2 = Math.hypot(dir2x, dir2y) || 1;
                const mark2X = xA + (dir2x / norm2) * markDist;
                const mark2Y = yA + (dir2y / norm2) * markDist;

                const rot = Math.floor(Math.random() * 360);
                const cx = (xA + xB + xC) / 3;
                const cy = (yA + yB + yC) / 3;

                function rotatePoint(px, py, angleDeg) {
                    const rad = angleDeg * Math.PI / 180;
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);
                    const dx = px - cx;
                    const dy = py - cy;
                    return {
                        x: cx + dx * cos - dy * sin,
                        y: cy + dx * sin + dy * cos
                    };
                }

                const pA = rotatePoint(xA, yA, rot);
                const pB = rotatePoint(xB, yB, rot);
                const pC = rotatePoint(xC, yC, rot);
                const pD = rotatePoint(xD, yD, rot);

                const pts = [pA, pB, pC, pD];
                const minX = Math.min(...pts.map(p => p.x));
                const maxX = Math.max(...pts.map(p => p.x));
                const minY = Math.min(...pts.map(p => p.y));
                const maxY = Math.max(...pts.map(p => p.y));

                const padding = 28;
                const vbX = minX - padding;
                const vbY = minY - padding;
                const vbW = (maxX - minX) + padding * 2;
                const vbH = (maxY - minY) + padding * 2;

                function getLabelPos(pt, dist = 14) {
                    const dx = pt.x - cx;
                    const dy = pt.y - cy;
                    const len = Math.hypot(dx, dy) || 1;
                    return {
                        x: pt.x + (dx / len) * dist,
                        y: pt.y + (dy / len) * dist
                    };
                }

                const normVec = rotatePoint(cx, cy + 1, rot);
                const outNx = normVec.x - cx;
                const outNy = normVec.y - cy;

                const labA = getLabelPos(pA, 14);
                const labB = getLabelPos(pB, 14);
                const labC = getLabelPos(pC, 14);
                const labD = { x: pD.x + outNx * 14, y: pD.y + outNy * 14 };

                const problemSvg = '<div style="text-align:center; margin: 8px 0;">' +
                                   '<svg viewBox="' + vbX + ' ' + vbY + ' ' + vbW + ' ' + vbH + '" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:220px; height:146px; display:inline-block;">' +
                                   '<g transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')">' +
                                   '<polygon points="' + xA + ',' + yA + ' ' + xB + ',' + yB + ' ' + xC + ',' + yC + '" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>' +
                                   '<line x1="' + xA + '" y1="' + yA + '" x2="' + xD + '" y2="' + yD + '" stroke="#2980b9" stroke-width="1.6"/>' +
                                   '<circle cx="' + mark1X + '" cy="' + mark1Y + '" r="2.1" fill="#2980b9"/>' +
                                   '<circle cx="' + mark2X + '" cy="' + mark2Y + '" r="2.1" fill="#2980b9"/>' +
                                   '</g>' +
                                   '<text x="' + labA.x + '" y="' + labA.y + '" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle" dominant-baseline="central">A</text>' +
                                   '<text x="' + labB.x + '" y="' + labB.y + '" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle" dominant-baseline="central">B</text>' +
                                   '<text x="' + labC.x + '" y="' + labC.y + '" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle" dominant-baseline="central">C</text>' +
                                   '<text x="' + labD.x + '" y="' + labD.y + '" font-size="10" font-weight="bold" fill="#2980b9" text-anchor="middle" dominant-baseline="central">D</text>' +
                                   '</svg></div>';

                // 解説の途中のルート表記も簡約に対応
                let midSqrtShow = "\\sqrt{" + valInside + "}";
                // もし簡約結果に \sqrt が含まれていて、かつ元の値と違うなら途中式にも反映可能
                // ここでは分かりやすく標準の計算式を表示

                const explanationText = "【解説】<br>" +
                                        "1. <strong>(1) の求め方（角の二等分線と線分比）</strong>：<br>" +
                                        q1Step + "<br>" +
                                        "2. <strong>(2) の求め方（角の二等分線の長さ公式）</strong>：<br>" +
                                        "　公式 \\(AD = \\sqrt{AB \\times AC - BD \\times CD}\\) に代入する。<br>" +
                                        "　\\(AD = \\sqrt{" + a + " \\times " + b + " - " + bdVal + " \\times " + cdVal + "}\\)<br>" +
                                        "　\\(= \\sqrt{" + ab_val + " - " + cd_val + "}\\)<br>" +
                                        "　\\(= \\mathbf{" + ansAdStr + "}\\)";

                return {
                    problem: problemText + "<br>" + problemSvg,
                    explanation: explanationText
                };
            }
        },
        "角の二等分線と線分比": {
            category: "平面図形",
            level: "基礎",
            formula: "次の図形のとき、\\(AB : AC = BD : CD\\)<br>" +
                     "\\(AB : BD = AC : CD\\) が成立する。<br><br>" +
                     '<div style="text-align:center; margin: 8px 0;">' +
                     '<svg viewBox="0 0 240 155" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:220px; height:142px; display:inline-block;">' +
                     // 不等辺三角形ABC: A(95, 25), B(35, 130), C(205, 130)
                     '<polygon points="95,25 35,130 205,130" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>' +
                     // 角の二等分線 AD
                     '<line x1="95" y1="25" x2="110.3" y2="130" stroke="#2980b9" stroke-width="1.6"/>' +
                     // 等角マーク（黒丸）
                     '<circle cx="88.5" cy="48" r="2.2" fill="#2980b9"/>' +
                     '<circle cx="105" cy="46" r="2.2" fill="#2980b9"/>' +
                     // 頂点・点のラベル
                     '<text x="91" y="18" font-size="10" font-weight="bold" fill="#1e293b">A</text>' +
                     '<text x="23" y="138" font-size="10" font-weight="bold" fill="#1e293b">B</text>' +
                     '<text x="209" y="138" font-size="10" font-weight="bold" fill="#1e293b">C</text>' +
                     '<text x="106" y="143" font-size="10" font-weight="bold" fill="#2980b9">D</text>' +
                     '</svg>' +
                     '</div>' +
                     "<strong>(証明)</strong><br>" +
                     "\\(AD // EC\\) となるように，点 \\(E\\) をとる。<br>" +
                     "\\(AD // EC\\) より 平行線の錯角が等しいので \\(\\angle DAC = \\angle ACE\\) …①<br>" +
                     "平行線の同位角が等しいので \\(\\angle BAD = \\angle AEC\\) …②<br>" +
                     "仮定より \\(\\angle BAD = \\angle CAD\\) …③<br>" +
                     "①②③より \\(\\angle ACE = \\angle AEC\\)<br>" +
                     "よって 2 角が等しいので \\(\\triangle ACE\\) は二等辺三角形…④<br>" +
                     "\\(AD // EC\\) より \\(BA : AE = BD : DC\\)<br>" +
                     "④より \\(AB : AC = BD : CD\\)<br><br>" +
                     '<div style="text-align:center; margin: 8px 0;">' +
                     '<svg viewBox="0 0 240 220" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:220px; height:202px; display:inline-block;">' +
                     // 延長線（破線）
                     '<line x1="95" y1="110" x2="157.9" y2="11.5" stroke="#64748b" stroke-width="1.3" stroke-dasharray="3,3"/>' +
                     '<line x1="195" y1="195" x2="157.9" y2="11.5" stroke="#64748b" stroke-width="1.3" stroke-dasharray="3,3"/>' +
                     // 平行記号（矢印）
                     '<polyline points="99,150 103,154 105,149" fill="none" stroke="#2980b9" stroke-width="1.2"/>' +
                     '<polyline points="173,101 177,105 179,100" fill="none" stroke="#64748b" stroke-width="1.2"/>' +
                     // 三角形ABC
                     '<polygon points="95,110 45,195 195,195" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>' +
                     // 角の二等分線 AD
                     '<line x1="95" y1="110" x2="109.4" y2="195" stroke="#2980b9" stroke-width="1.6"/>' +
                     // 等角マーク
                     '<circle cx="89" cy="132" r="2" fill="#2980b9"/>' +
                     '<circle cx="104" cy="130" r="2" fill="#2980b9"/>' +
                     '<circle cx="182" cy="176" r="2" fill="#e11d48"/>' +
                     '<circle cx="152" cy="31" r="2" fill="#e11d48"/>' +
                     // 頂点・点のラベル
                     '<text x="83" y="109" font-size="10" font-weight="bold" fill="#1e293b">A</text>' +
                     '<text x="33" y="203" font-size="10" font-weight="bold" fill="#1e293b">B</text>' +
                     '<text x="199" y="203" font-size="10" font-weight="bold" fill="#1e293b">C</text>' +
                     '<text x="105" y="208" font-size="10" font-weight="bold" fill="#2980b9">D</text>' +
                     '<text x="162" y="16" font-size="10" font-weight="bold" fill="#64748b">E</text>' +
                     '</svg>' +
                     '</div>',
            generateRandom: function() {
                function gcd(x, y) { return y === 0 ? x : gcd(y, x % y); }
                function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

                let ab, ac, bdVal, cdVal, g;
                while (true) {
                    ab = randInt(4, 12);
                    ac = randInt(4, 12);
                    if (ab === ac) continue;
                    g = gcd(ab, ac);
                    if (g > 1) break;
                }

                const ratioB = ab / g;
                const ratioC = ac / g;
                const mult = randInt(1, 3);
                bdVal = ratioB * mult;
                cdVal = ratioC * mult;

                const unknownType = randInt(1, 3);
                let problemText = "";
                let ansText = "";
                let eqStep = "";

                if (unknownType === 1) {
                    problemText = "右の図の三角形 \\(ABC\\) において、線分 \\(AD\\) は \\(\\angle BAC\\) の二等分線である。<br>" +
                                  "\\(AB = " + ab + "\\)、\\(AC = " + ac + "\\)、\\(BD = " + bdVal + "\\) のとき、線分 \\(CD\\) の長さを求めなさい。";
                    ansText = cdVal.toString();
                    eqStep = "　\\(" + ab + " : " + ac + " = " + bdVal + " : CD\\)<br>" +
                             "　\\(" + ratioB + " : " + ratioC + " = " + bdVal + " : CD\\)<br>" +
                             "　\\(" + ratioB + " \\times CD = " + (ratioC * bdVal) + "\\)<br>" +
                             "　\\(CD = \\mathbf{" + ansText + "}\\)";
                } else if (unknownType === 2) {
                    problemText = "右の図の三角形 \\(ABC\\) において、線分 \\(AD\\) は \\(\\angle BAC\\) の二等分線である。<br>" +
                                  "\\(AB = " + ab + "\\)、\\(AC = " + ac + "\\)、\\(CD = " + cdVal + "\\) のとき、線分 \\(BD\\) の長さを求めなさい。";
                    ansText = bdVal.toString();
                    eqStep = "　\\(" + ab + " : " + ac + " = BD : " + cdVal + "\\)<br>" +
                             "　\\(" + ratioB + " : " + ratioC + " = BD : " + cdVal + "\\)<br>" +
                             "　\\(" + ratioC + " \\times BD = " + (ratioB * cdVal) + "\\)<br>" +
                             "　\\(BD = \\mathbf{" + ansText + "}\\)";
                } else {
                    problemText = "右の図の三角形 \\(ABC\\) において、線分 \\(AD\\) は \\(\\angle BAC\\) の二等分線である。<br>" +
                                  "\\(AB = " + ab + "\\)、\\(BD = " + bdVal + "\\)、\\(CD = " + cdVal + "\\) のとき、線分 \\(AC\\) の長さを求めなさい。";
                    ansText = ac.toString();
                    eqStep = "　\\(" + ab + " : AC = " + bdVal + " : " + cdVal + "\\)<br>" +
                             "　\\(" + ab + " : AC = " + ratioB + " : " + ratioC + "\\)<br>" +
                             "　\\(" + ratioB + " \\times AC = " + (ab * ratioC) + "\\)<br>" +
                             "　\\(AC = \\mathbf{" + ansText + "}\\)";
                }

                const xB = 40, yB = 135;
                const xC = 200, yC = 135;
                const xA = (ab < ac) ? 95 : 145;
                const yA = 25;

                const lenAB = Math.hypot(xA - xB, yA - yB);
                const lenAC = Math.hypot(xA - xC, yA - yC);
                const t = lenAB / (lenAB + lenAC);
                const xD = xB + t * (xC - xB);
                const yD = 135;

                const uABx = (xB - xA) / lenAB, uABy = (yB - yA) / lenAB;
                const uACx = (xC - xA) / lenAC, uACy = (yC - yA) / lenAC;
                const lenAD = Math.hypot(xD - xA, yD - yA);
                const uADx = (xD - xA) / lenAD, uADy = (yD - yA) / lenAD;

                const mark1X = xA + ((uABx + uADx) / 2) * 24;
                const mark1Y = yA + ((uABy + uADy) / 2) * 24;
                const mark2X = xA + ((uACx + uADx) / 2) * 24;
                const mark2Y = yA + ((uACy + uADy) / 2) * 24;

                // 1°単位のランダム回転角度（0°〜359°）
                const rot = Math.floor(Math.random() * 360);
                const cx = 120, cy = 80;

                function rotatePoint(px, py, angleDeg) {
                    const rad = angleDeg * Math.PI / 180;
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);
                    const dx = px - cx;
                    const dy = py - cy;
                    return {
                        x: cx + dx * cos - dy * sin,
                        y: cy + dx * sin + dy * cos
                    };
                }

                const pA = rotatePoint(xA, yA, rot);
                const pB = rotatePoint(xB, yB, rot);
                const pC = rotatePoint(xC, yC, rot);
                const pD = rotatePoint(xD, yD, rot);

                // 動的なビューボックス（viewBox）計算：全頂点の最小・最大座標からパディングを付与
                const pts = [pA, pB, pC, pD];
                const minX = Math.min(...pts.map(p => p.x));
                const maxX = Math.max(...pts.map(p => p.x));
                const minY = Math.min(...pts.map(p => p.y));
                const maxY = Math.max(...pts.map(p => p.y));

                const padding = 28;
                const vbX = minX - padding;
                const vbY = minY - padding;
                const vbW = (maxX - minX) + padding * 2;
                const vbH = (maxY - minY) + padding * 2;

                function getLabelPos(pt, dist = 14) {
                    const dx = pt.x - cx;
                    const dy = pt.y - cy;
                    const len = Math.hypot(dx, dy) || 1;
                    return {
                        x: pt.x + (dx / len) * dist,
                        y: pt.y + (dy / len) * dist
                    };
                }

                const labA = getLabelPos(pA, 14);
                const labB = getLabelPos(pB, 15);
                const labC = getLabelPos(pC, 15);
                const labD = getLabelPos(pD, 15);

                const problemSvg = '<div style="text-align:center; margin: 8px 0;">' +
                                   '<svg viewBox="' + vbX + ' ' + vbY + ' ' + vbW + ' ' + vbH + '" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:220px; height:146px; display:inline-block;">' +
                                   // 図形グループ（1°単位のランダム回転）
                                   '<g transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')">' +
                                   '<polygon points="' + xA + ',' + yA + ' ' + xB + ',' + yB + ' ' + xC + ',' + yC + '" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>' +
                                   '<line x1="' + xA + '" y1="' + yA + '" x2="' + xD + '" y2="' + yD + '" stroke="#2980b9" stroke-width="1.6"/>' +
                                   '<circle cx="' + mark1X + '" cy="' + mark1Y + '" r="2.1" fill="#2980b9"/>' +
                                   '<circle cx="' + mark2X + '" cy="' + mark2Y + '" r="2.1" fill="#2980b9"/>' +
                                   '</g>' +
                                   // ラベルグループ（常に正立）
                                   '<text x="' + labA.x + '" y="' + labA.y + '" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle" dominant-baseline="central">A</text>' +
                                   '<text x="' + labB.x + '" y="' + labB.y + '" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle" dominant-baseline="central">B</text>' +
                                   '<text x="' + labC.x + '" y="' + labC.y + '" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle" dominant-baseline="central">C</text>' +
                                   '<text x="' + labD.x + '" y="' + labD.y + '" font-size="10" font-weight="bold" fill="#2980b9" text-anchor="middle" dominant-baseline="central">D</text>' +
                                   '</svg></div>';

                const explanationText = "【解説】<br>" +
                                        "1. <strong>角の二等分線と線分比の公式を使う</strong>：<br>" +
                                        "　三角形の角の二等分線の性質より、\\(AB : AC = BD : CD\\) が成り立ちます。<br>" +
                                        "2. <strong>値を代入して比例式を解く</strong>：<br>" +
                                        eqStep;

                return {
                    problem: problemText + "<br>" + problemSvg,
                    explanation: explanationText
                };
            }
        },
        "角の二等分線と平行線": {
            category: "平面図形",
            level: "公立",
            formula: "角の二等分線が平行線に出会うと<strong>二等辺三角形</strong>ができる。<br>" +
                     "これを利用して、折り返し図形の角度・長さや、台形における線分比を求めることができる。<br><br>" +
                     "<strong>【基本性質の証明】</strong><br>" +
                     "平行な2直線 \\(m\\) と \\(n\\) がある。\\(m\\) と \\(n\\) のそれぞれに点 \\(A\\) と点 \\(B\\) をとる。<br>" +
                     "\\(\\angle B\\) の二等分線と \\(m\\) の交点を \\(D\\) とする。<br>" +
                     "仮定（角の二等分線）より、\\(\\angle ABD = \\angle CBD\\) …①<br>" +
                     "\\(m // n\\) より、平行線の錯角は等しいので \\(\\angle ADB = \\angle CBD\\) …②<br>" +
                     "①、②より、\\(\\angle ABD = \\angle ADB\\) となり、\\(\\triangle ABD\\) は二等辺三角形である。<br><br>" +
                     '<div style="text-align:center; margin: 8px 0;">' +
                     '<svg viewBox="0 0 240 155" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:220px; height:142px; display:inline-block;">' +
                     '<polygon points="85,40 45,120 174.4,40" fill="rgba(41, 128, 185, 0.14)" stroke="none"/>' +
                     '<line x1="20" y1="40" x2="215" y2="40" stroke="#334155" stroke-width="1.5"/>' +
                     '<line x1="20" y1="120" x2="215" y2="120" stroke="#334155" stroke-width="1.5"/>' +
                     '<polyline points="200,36 205,40 200,44" fill="none" stroke="#334155" stroke-width="1.3"/>' +
                     '<polyline points="200,116 205,120 200,124" fill="none" stroke="#334155" stroke-width="1.3"/>' +
                     '<line x1="85" y1="40" x2="45" y2="120" stroke="#334155" stroke-width="1.5"/>' +
                     '<line x1="45" y1="120" x2="174.4" y2="40" stroke="#2980b9" stroke-width="1.7"/>' +
                     '<line x1="61" y1="78" x2="69" y2="82" stroke="#e11d48" stroke-width="1.5"/>' +
                     '<line x1="130" y1="36" x2="130" y2="44" stroke="#e11d48" stroke-width="1.5"/>' +
                     '<circle cx="62" cy="99" r="2.1" fill="#2980b9"/>' +
                     '<circle cx="71" cy="112" r="2.1" fill="#2980b9"/>' +
                     '<circle cx="147" cy="48" r="2.1" fill="#e11d48"/>' +
                     '<text x="12" y="43" font-size="10" font-style="italic" font-weight="bold" fill="#334155">m</text>' +
                     '<text x="12" y="123" font-size="10" font-style="italic" font-weight="bold" fill="#334155">n</text>' +
                     '<text x="81" y="31" font-size="10" font-weight="bold" fill="#1e293b">A</text>' +
                     '<text x="38" y="133" font-size="10" font-weight="bold" fill="#1e293b">B</text>' +
                     '<text x="180" y="133" font-size="10" font-weight="bold" fill="#1e293b">C</text>' +
                     '<text x="171" y="31" font-size="10" font-weight="bold" fill="#2980b9">D</text>' +
                     '</svg>' +
                     '</div>',
            generateRandom: function() {
                function gcd(x, y) { return y === 0 ? x : gcd(y, x % y); }
                function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

                const qType = randInt(0, 2);
                let problemText = "";
                let explanationText = "";
                let problemSvg = "";

                if (qType === 0) {
                    // --- パターン0: 平行線と角の二等分線 ---
                    const subType = randInt(0, 1);
                    const abLenVal = randInt(5, 12);
                    const angleB_deg = randInt(25, 38) * 2;
                    const halfB_deg = angleB_deg / 2;
                    const angleA_ans = 180 - angleB_deg;

                    if (subType === 0) {
                        problemText = "右図のように、平行な2直線 \\(m, n\\) があり、それぞれの上に点 \\(A, B\\) をとる。<br>" +
                                      "\\(\\angle ABC\\) の二等分線と直線 \\(m\\) との交点を \\(D\\) とする。<br>" +
                                      "\\(AB = " + abLenVal + "\\text{ cm}\\) のとき、線分 \\(AD\\) の長さを求めなさい。";
                        explanationText = "【解説】<br>" +
                                          "1. <strong>二等辺三角形を見つける</strong>：<br>" +
                                          "　平行線の錯角と角の二等分線の性質より \\(\\angle ABD = \\angle ADB\\) となるため、\\(\\triangle ABD\\) は \\(AB = AD\\) の二等辺三角形である。<br>" +
                                          "2. <strong>長さを求める</strong>：<br>" +
                                          "　\\(AD = AB = \\mathbf{" + abLenVal + "\\text{ cm}}\\)";
                    } else {
                        problemText = "右図のように、平行な2直線 \\(m, n\\) があり、それぞれの上に点 \\(A, B\\) をとる。<br>" +
                                      "\\(\\angle ABC\\) の二等分線と直線 \\(m\\) との交点を \\(D\\) とする。<br>" +
                                      "\\(\\angle ADB = " + halfB_deg + "^\\circ\\) のとき、\\(\\angle BAD\\) の大きさを求めなさい。";
                        explanationText = "【解説】<br>" +
                                          "1. <strong>二等辺三角形の底角</strong>：<br>" +
                                          "　\\(\\triangle ABD\\) は二等辺三角形なので、\\(\\angle ABD = \\angle ADB = " + halfB_deg + "^\\circ\\)<br>" +
                                          "2. <strong>内角の和から求める</strong>：<br>" +
                                          "　\\(\\angle BAD = 180^\\circ - (" + halfB_deg + "^\\circ + " + halfB_deg + "^\\circ) = \\mathbf{" + angleA_ans + "^\\circ}\\)";
                    }

                    const h = 76, yTop = 42, yBot = yTop + h;
                    const angleB_rad = angleB_deg * Math.PI / 180;
                    const xB = 50, yB = yBot;
                    const lenAB = h / Math.sin(angleB_rad);
                    const xA = xB + lenAB * Math.cos(angleB_rad);
                    const xD = xA + lenAB;
                    const lineLeft = Math.min(xB, xA) - 25;
                    const lineRight = Math.max(xD + 30, xB + 140);

                    const mark1X = xB + 22 * Math.cos(angleB_rad * 0.75);
                    const mark1Y = yB - 22 * Math.sin(angleB_rad * 0.75);
                    const mark2X = xB + 22 * Math.cos(angleB_rad * 0.25);
                    const mark2Y = yB - 22 * Math.sin(angleB_rad * 0.25);

                    const rot = Math.floor(Math.random() * 360);
                    const cx = (lineLeft + lineRight) / 2, cy = (yTop + yBot) / 2;

                    function rotPt(px, py) {
                        const rad = rot * Math.PI / 180;
                        const dx = px - cx, dy = py - cy;
                        return { x: cx + dx * Math.cos(rad) - dy * Math.sin(rad), y: cy + dx * Math.sin(rad) + dy * Math.cos(rad) };
                    }

                    const pA = rotPt(xA, yTop), pB = rotPt(xB, yBot), pD = rotPt(xD, yTop), pC = rotPt(lineRight - 15, yBot);
                    const pM = rotPt(lineLeft - 8, yTop), pN = rotPt(lineLeft - 8, yBot);
                    const pts = [pA, pB, pD, pC, pM, pN];
                    const minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x));
                    const minY = Math.min(...pts.map(p => p.y)), maxY = Math.max(...pts.map(p => p.y));
                    const vbX = minX - 35, vbY = minY - 35, vbW = (maxX - minX) + 70, vbH = (maxY - minY) + 70;

                    const up = rotPt(cx, cy - 1), down = rotPt(cx, cy + 1);
                    const labA = { x: pA.x + (up.x - cx) * 13, y: pA.y + (up.y - cy) * 13 };
                    const labD = { x: pD.x + (up.x - cx) * 13, y: pD.y + (up.y - cy) * 13 };
                    const labB = { x: pB.x + (down.x - cx) * 13, y: pB.y + (down.y - cy) * 13 };
                    const labC = { x: pC.x + (down.x - cx) * 13, y: pC.y + (down.y - cy) * 13 };

                    problemSvg = '<div style="text-align:center; margin: 8px 0;"><svg viewBox="' + vbX + ' ' + vbY + ' ' + vbW + ' ' + vbH + '" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:220px; height:150px; display:inline-block;">' +
                                 '<g transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')">' +
                                 '<line x1="' + lineLeft + '" y1="' + yTop + '" x2="' + lineRight + '" y2="' + yTop + '" stroke="#334155" stroke-width="1.5"/>' +
                                 '<line x1="' + lineLeft + '" y1="' + yBot + '" x2="' + lineRight + '" y2="' + yBot + '" stroke="#334155" stroke-width="1.5"/>' +
                                 '<line x1="' + xB + '" y1="' + yBot + '" x2="' + xA + '" y2="' + yTop + '" stroke="#334155" stroke-width="1.5"/>' +
                                 '<line x1="' + xB + '" y1="' + yBot + '" x2="' + xD + '" y2="' + yTop + '" stroke="#2980b9" stroke-width="1.7"/>' +
                                 '<circle cx="' + mark1X + '" cy="' + mark1Y + '" r="2.1" fill="#2980b9"/>' +
                                 '<circle cx="' + mark2X + '" cy="' + mark2Y + '" r="2.1" fill="#2980b9"/>' +
                                 '</g>' +
                                 '<text x="' + labA.x + '" y="' + labA.y + '" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle" dominant-baseline="central">A</text>' +
                                 '<text x="' + labB.x + '" y="' + labB.y + '" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle" dominant-baseline="central">B</text>' +
                                 '<text x="' + labC.x + '" y="' + labC.y + '" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle" dominant-baseline="central">C</text>' +
                                 '<text x="' + labD.x + '" y="' + labD.y + '" font-size="10" font-weight="bold" fill="#2980b9" text-anchor="middle" dominant-baseline="central">D</text>' +
                                 '<text x="' + pM.x + '" y="' + pM.y + '" font-size="10" font-style="italic" font-weight="bold" fill="#334155" text-anchor="middle" dominant-baseline="central">m</text>' +
                                 '<text x="' + pN.x + '" y="' + pN.y + '" font-size="10" font-style="italic" font-weight="bold" fill="#334155" text-anchor="middle" dominant-baseline="central">n</text>' +
                                 '</svg></div>';

                } else if (qType === 1) {
                    // --- パターン1: 長方形の対角線折り返し ---
                    const useDiagonalBD = Math.random() < 0.5;

                    function reflectPoint(px, py, x1, y1, x2, y2) {
                        const dx = x2 - x1, dy = y2 - y1;
                        const lenSq = dx * dx + dy * dy;
                        const t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
                        const projX = x1 + t * dx;
                        const projY = y1 + t * dy;
                        return { x: 2 * projX - px, y: 2 * projY - py };
                    }

                    function intersectLine(x1, y1, x2, y2, x3, y3, x4, y4) {
                        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
                        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
                        return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
                    }

                    const Ax = 40, Ay = 20;
                    const Bx = 40, By = 100;
                    const Cx = 160, Cy = 100;
                    const Dx = 160, Dy = 20;

                    if (useDiagonalBD) {
                        const E = reflectPoint(Cx, Cy, Bx, By, Dx, Dy);
                        const F = intersectLine(Bx, By, E.x, E.y, Ax, Ay, Dx, Dy);

                        problemText = "縦 \\(8\\text{ cm}\\)、横 \\(12\\text{ cm}\\) の長方形 \\(ABCD\\) を、対角線 \\(BD\\) を折り目として折り返した。<br>" +
                                      "点 \\(C\\) が \\(BD\\) に対して対称移動した点を \\(E\\) とし、線分 \\(BE\\) と \\(AD\\) の交点を \\(F\\) とするとき、<br>" +
                                      "重なってできた三角形 \\(\\triangle FBD\\) の面積を求めなさい。";

                        explanationText = "【解説】<br>" +
                                          "1. <strong>二等辺三角形の発見</strong>：<br>" +
                                          "　折り返しの図形より \\(\\angle FBD = \\angle CBD\\)、平行線の錯角より \\(\\angle FDB = \\angle CBD\\) となるため、<br>" +
                                          "　\\(\\angle FBD = \\angle FDB\\) となり、\\(\\triangle FBD\\) は \\(FB = FD\\) の二等辺三角形である。<br>" +
                                          "2. <strong>長さを求める</strong>：<br>" +
                                          "　\\(FD = x\\text{ cm}\\) とすると \\(AF = (12 - x)\\text{ cm}\\)、\\(FB = x\\text{ cm}\\)。<br>" +
                                          "　直角三角形 \\(\\triangle ABF\\) で三平方の定理より \\(x^2 = (12 - x)^2 + 8^2 \\to 24x = 208 \\to x = \\frac{26}{3}\\text{ cm}\\)。<br>" +
                                          "3. <strong>面積を求める</strong>：<br>" +
                                          "　\\(\\triangle FBD = \\frac{1}{2} \\times FD \\times AB = \\frac{1}{2} \\times \\frac{26}{3} \\times 8 = \\mathbf{\\frac{104}{3}\\text{ cm}^2}\\)";

                        const allX = [Ax, Bx, Cx, Dx, E.x, F.x];
                        const allY = [Ay, By, Cy, Dy, E.y, F.y];
                        const vbX = Math.min(...allX) - 28;
                        const vbY = Math.min(...allY) - 28;
                        const vbW = (Math.max(...allX) - Math.min(...allX)) + 56;
                        const vbH = (Math.max(...allY) - Math.min(...allY)) + 56;

                        problemSvg = '<div style="text-align:center; margin: 8px 0;"><svg viewBox="' + vbX + ' ' + vbY + ' ' + vbW + ' ' + vbH + '" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:220px; height:150px; display:inline-block;">' +
                                     '<polygon points="' + Ax + ',' + Ay + ' ' + Dx + ',' + Dy + ' ' + Cx + ',' + Cy + ' ' + Bx + ',' + By + '" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>' +
                                     '<polygon points="' + Bx + ',' + By + ' ' + Dx + ',' + Dy + ' ' + E.x.toFixed(1) + ',' + E.y.toFixed(1) + '" fill="rgba(148, 163, 184, 0.12)" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3,3"/>' +
                                     '<polygon points="' + Bx + ',' + By + ' ' + Dx + ',' + Dy + ' ' + F.x.toFixed(1) + ',' + F.y.toFixed(1) + '" fill="rgba(41, 128, 185, 0.25)" stroke="#2980b9" stroke-width="1.5"/>' +
                                     '<line x1="' + Bx + '" y1="' + By + '" x2="' + Dx + '" y2="' + Dy + '" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="4,2"/>' +
                                     '<circle cx="' + F.x.toFixed(1) + '" cy="' + F.y.toFixed(1) + '" r="2.2" fill="#2980b9"/>' +
                                     '<text x="' + (Ax - 10) + '" y="' + (Ay - 4) + '" font-size="10" font-weight="bold" fill="#1e293b">A</text>' +
                                     '<text x="' + (F.x - 3).toFixed(1) + '" y="' + (F.y - 7).toFixed(1) + '" font-size="10" font-weight="bold" fill="#2980b9">F</text>' +
                                     '<text x="' + (E.x - 4).toFixed(1) + '" y="' + (E.y - 7).toFixed(1) + '" font-size="10" font-weight="bold" fill="#64748b">E</text>' +
                                     '<text x="' + (Dx + 5) + '" y="' + (Dy - 4) + '" font-size="10" font-weight="bold" fill="#1e293b">D</text>' +
                                     '<text x="' + (Cx + 5) + '" y="' + (Cy + 9) + '" font-size="10" font-weight="bold" fill="#1e293b">C</text>' +
                                     '<text x="' + (Bx - 11) + '" y="' + (By + 9) + '" font-size="10" font-weight="bold" fill="#1e293b">B</text>' +
                                     '</svg></div>';
                    } else {
                        const E = reflectPoint(Bx, By, Ax, Ay, Cx, Cy);
                        const F = intersectLine(Cx, Cy, E.x, E.y, Ax, Ay, Dx, Dy);

                        problemText = "縦 \\(8\\text{ cm}\\)、横 \\(12\\text{ cm}\\) の長方形 \\(ABCD\\) を、対角線 \\(AC\\) を折り目として折り返した。<br>" +
                                      "点 \\(B\\) が \\(AC\\) に対して対称移動した点を \\(E\\) とし、線分 \\(CE\\) と \\(AD\\) の交点を \\(F\\) とするとき、<br>" +
                                      "重なってできた三角形 \\(\\triangle FAC\\) の面積を求めなさい。";

                        explanationText = "【解説】<br>" +
                                          "1. <strong>二等辺三角形の発見</strong>：<br>" +
                                          "　折り返しの図形より \\(\\angle FCA = \\angle BCA\\)、平行線の錯角より \\(\\angle FAC = \\angle BCA\\) となるため、<br>" +
                                          "　\\(\\angle FCA = \\angle FAC\\) となり、\\(\\triangle FAC\\) は \\(FA = FC\\) の二等辺三角形である。<br>" +
                                          "2. <strong>長さを求める</strong>：<br>" +
                                          "　\\(FA = x\\text{ cm}\\) とすると \\(FD = (12 - x)\\text{ cm}\\)、\\(FC = x\\text{ cm}\\)。<br>" +
                                          "　直角三角形 \\(\\triangle FDC\\) で三平方の定理より \\(x^2 = (12 - x)^2 + 8^2 \\to 24x = 208 \\to x = \\frac{26}{3}\\text{ cm}\\)。<br>" +
                                          "3. <strong>面積を求める</strong>：<br>" +
                                          "　\\(\\triangle FAC = \\frac{1}{2} \\times FA \\times CD = \\frac{1}{2} \\times \\frac{26}{3} \\times 8 = \\mathbf{\\frac{104}{3}\\text{ cm}^2}\\)";

                        const allX = [Ax, Bx, Cx, Dx, E.x, F.x];
                        const allY = [Ay, By, Cy, Dy, E.y, F.y];
                        const vbX = Math.min(...allX) - 28;
                        const vbY = Math.min(...allY) - 28;
                        const vbW = (Math.max(...allX) - Math.min(...allX)) + 56;
                        const vbH = (Math.max(...allY) - Math.min(...allY)) + 56;

                        problemSvg = '<div style="text-align:center; margin: 8px 0;"><svg viewBox="' + vbX + ' ' + vbY + ' ' + vbW + ' ' + vbH + '" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:220px; height:150px; display:inline-block;">' +
                                     '<polygon points="' + Ax + ',' + Ay + ' ' + Dx + ',' + Dy + ' ' + Cx + ',' + Cy + ' ' + Bx + ',' + By + '" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>' +
                                     '<polygon points="' + Ax + ',' + Ay + ' ' + Cx + ',' + Cy + ' ' + E.x.toFixed(1) + ',' + E.y.toFixed(1) + '" fill="rgba(148, 163, 184, 0.12)" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3,3"/>' +
                                     '<polygon points="' + Ax + ',' + Ay + ' ' + Cx + ',' + Cy + ' ' + F.x.toFixed(1) + ',' + F.y.toFixed(1) + '" fill="rgba(41, 128, 185, 0.25)" stroke="#2980b9" stroke-width="1.5"/>' +
                                     '<line x1="' + Ax + '" y1="' + Ay + '" x2="' + Cx + '" y2="' + Cy + '" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="4,2"/>' +
                                     '<circle cx="' + F.x.toFixed(1) + '" cy="' + F.y.toFixed(1) + '" r="2.2" fill="#2980b9"/>' +
                                     '<text x="' + (Ax - 10) + '" y="' + (Ay - 4) + '" font-size="10" font-weight="bold" fill="#1e293b">A</text>' +
                                     '<text x="' + (F.x - 3).toFixed(1) + '" y="' + (F.y - 7).toFixed(1) + '" font-size="10" font-weight="bold" fill="#2980b9">F</text>' +
                                     '<text x="' + (E.x - 3).toFixed(1) + '" y="' + (E.y - 7).toFixed(1) + '" font-size="10" font-weight="bold" fill="#64748b">E</text>' +
                                     '<text x="' + (Dx + 5) + '" y="' + (Dy - 4) + '" font-size="10" font-weight="bold" fill="#1e293b">D</text>' +
                                     '<text x="' + (Cx + 5) + '" y="' + (Cy + 9) + '" font-size="10" font-weight="bold" fill="#1e293b">C</text>' +
                                     '<text x="' + (Bx - 11) + '" y="' + (By + 9) + '" font-size="10" font-weight="bold" fill="#1e293b">B</text>' +
                                     '</svg></div>';
                    }

                } else {
                    // --- パターン2: 台形の角の二等分線（頂点Bから引く）と線分比 (DE : EC) ---
                    let a, b, c;
                    while (true) {
                        c = randInt(5, 8);          // 腰 AB
                        a = randInt(4, c - 1);      // 上底 AD (a < c かつ b > c とすることで、二等分線BEが必ず辺DCと交わる)
                        b = c + randInt(3, 6);      // 下底 BC (b > c > a で等脚でない台形)
                        if (a !== b && (c - a) !== b) break;
                    }

                    const numDE = c - a;
                    const denEC = b;
                    const g = gcd(numDE, denEC);
                    const ansDE = numDE / g;
                    const ansEC = denEC / g;

                    problemText = "右図のような台形 \\(ABCD\\)（\\(AD // BC\\)）において、<br>" +
                                  "\\(AB = " + c + "\\text{ cm}\\)、\\(AD = " + a + "\\text{ cm}\\)、\\(BC = " + b + "\\text{ cm}\\) である。<br>" +
                                  "\\(\\angle B\\) の二等分線と辺 \\(DC\\) との交点を \\(E\\) とするとき、線分比 \\(DE : EC\\) を最も簡単な整数比で求めなさい。";

                    // --- 幾何学的に正確な台形と、Eが必ず辺DC上に来る高さ・角度の計算 ---
                    const scale = 13;
                    const lenBC = b * scale;
                    const lenAD = a * scale;
                    const lenAB = c * scale;

                    const targetH = 62;
                    const sinB = Math.max(0.74, Math.min(0.92, targetH / lenAB));
                    const angleB = Math.asin(sinB);

                    const Bx = 30, By = 115;
                    const Cx = Bx + lenBC, Cy = By;
                    const Ax = Bx + lenAB * Math.cos(angleB);
                    const Ay = By - lenAB * Math.sin(angleB);
                    const Dx = Ax + lenAD, Dy = Ay;

                    // 頂点Bからの角の二等分線の方向（角度 angleB / 2）
                    const halfB = angleB / 2;
                    const dirX = Math.cos(halfB);
                    const dirY = -Math.sin(halfB);

                    // 半直線 B + t*(dirX, dirY) と線分 DC (Dx,Dy)-(Cx,Cy) の正確な交点 E を求める
                    const cdX = Cx - Dx, cdY = Cy - Dy;
                    const denom = dirX * cdY - dirY * cdX;
                    const t = ((Dx - Bx) * cdY - (Dy - By) * cdX) / denom;
                    const Ex = Bx + t * dirX;
                    const Ey = By + t * dirY;

                    // 延長したときの交点 P（半直線 BE と直線 AD の交点: y = Ay となる点）
                    const tP = (Ay - By) / dirY;
                    const Px = Bx + tP * dirX;
                    const Py = Ay;

                    // 等角マーク（●）の座標
                    const mark1X = Bx + 20 * Math.cos(angleB * 0.75);
                    const mark1Y = By - 20 * Math.sin(angleB * 0.75);
                    const mark2X = Bx + 20 * Math.cos(angleB * 0.25);
                    const mark2Y = By - 20 * Math.sin(angleB * 0.25);

                    // 問題図用 viewBox（台形 ABCD + 線分 BE）
                    const allX = [Ax, Bx, Cx, Dx, Ex];
                    const allY = [Ay, By, Cy, Dy, Ey];
                    const vbX = Math.min(...allX) - 24;
                    const vbY = Math.min(...allY) - 24;
                    const vbW = (Math.max(...allX) - Math.min(...allX)) + 48;
                    const vbH = (Math.max(...allY) - Math.min(...allY)) + 48;

                    problemSvg = '<div style="text-align:center; margin: 8px 0;"><svg viewBox="' + vbX.toFixed(1) + ' ' + vbY.toFixed(1) + ' ' + vbW.toFixed(1) + ' ' + vbH.toFixed(1) + '" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:220px; height:150px; display:inline-block;">' +
                                 '<polygon points="' + Ax.toFixed(1) + ',' + Ay.toFixed(1) + ' ' + Dx.toFixed(1) + ',' + Dy.toFixed(1) + ' ' + Cx.toFixed(1) + ',' + Cy.toFixed(1) + ' ' + Bx.toFixed(1) + ',' + By.toFixed(1) + '" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>' +
                                 '<line x1="' + Bx.toFixed(1) + '" y1="' + By.toFixed(1) + '" x2="' + Ex.toFixed(1) + '" y2="' + Ey.toFixed(1) + '" stroke="#2980b9" stroke-width="1.7"/>' +
                                 '<circle cx="' + Ex.toFixed(1) + '" cy="' + Ey.toFixed(1) + '" r="2.2" fill="#2980b9"/>' +
                                 '<circle cx="' + mark1X.toFixed(1) + '" cy="' + mark1Y.toFixed(1) + '" r="2.1" fill="#2980b9"/>' +
                                 '<circle cx="' + mark2X.toFixed(1) + '" cy="' + mark2Y.toFixed(1) + '" r="2.1" fill="#2980b9"/>' +
                                 '<text x="' + (Ax - 8).toFixed(1) + '" y="' + (Ay - 6).toFixed(1) + '" font-size="10" font-weight="bold" fill="#1e293b">A</text>' +
                                 '<text x="' + (Dx + 4).toFixed(1) + '" y="' + (Dy - 6).toFixed(1) + '" font-size="10" font-weight="bold" fill="#1e293b">D</text>' +
                                 '<text x="' + (Cx + 5).toFixed(1) + '" y="' + (Cy + 11).toFixed(1) + '" font-size="10" font-weight="bold" fill="#1e293b">C</text>' +
                                 '<text x="' + (Bx - 11).toFixed(1) + '" y="' + (By + 11).toFixed(1) + '" font-size="10" font-weight="bold" fill="#1e293b">B</text>' +
                                 '<text x="' + (Ex + 6).toFixed(1) + '" y="' + (Ey + 2).toFixed(1) + '" font-size="10" font-weight="bold" fill="#2980b9">E</text>' +
                                 '</svg></div>';

                    // 解説図用 viewBox（延長線 DP, EP とチョウチョ型の相似 △EDP ∽ △ECB を強調表示）
                    const expAllX = [Ax, Bx, Cx, Dx, Ex, Px];
                    const expAllY = [Ay, By, Cy, Dy, Ey, Py];
                    const expVbX = Math.min(...expAllX) - 24;
                    const expVbY = Math.min(...expAllY) - 26;
                    const expVbW = (Math.max(...expAllX) - Math.min(...expAllX)) + 48;
                    const expVbH = (Math.max(...expAllY) - Math.min(...expAllY)) + 50;

                    const expSvg = '<div style="text-align:center; margin: 8px 0;"><svg viewBox="' + expVbX.toFixed(1) + ' ' + expVbY.toFixed(1) + ' ' + expVbW.toFixed(1) + ' ' + expVbH.toFixed(1) + '" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:230px; height:150px; display:inline-block;">' +
                                 // チョウチョ型の相似 2三角形の塗り分け（△EDP: 赤系, △ECB: 青系）
                                 '<polygon points="' + Ex.toFixed(1) + ',' + Ey.toFixed(1) + ' ' + Dx.toFixed(1) + ',' + Dy.toFixed(1) + ' ' + Px.toFixed(1) + ',' + Py.toFixed(1) + '" fill="rgba(239, 68, 68, 0.22)" stroke="none"/>' +
                                 '<polygon points="' + Ex.toFixed(1) + ',' + Ey.toFixed(1) + ' ' + Cx.toFixed(1) + ',' + Cy.toFixed(1) + ' ' + Bx.toFixed(1) + ',' + By.toFixed(1) + '" fill="rgba(41, 128, 185, 0.16)" stroke="none"/>' +
                                 // 台形本体
                                 '<polygon points="' + Ax.toFixed(1) + ',' + Ay.toFixed(1) + ' ' + Dx.toFixed(1) + ',' + Dy.toFixed(1) + ' ' + Cx.toFixed(1) + ',' + Cy.toFixed(1) + ' ' + Bx.toFixed(1) + ',' + By.toFixed(1) + '" fill="none" stroke="#334155" stroke-width="1.5"/>' +
                                 // 角の二等分線 BE
                                 '<line x1="' + Bx.toFixed(1) + '" y1="' + By.toFixed(1) + '" x2="' + Ex.toFixed(1) + '" y2="' + Ey.toFixed(1) + '" stroke="#2980b9" stroke-width="1.7"/>' +
                                 // 延長線 DP, EP（破線）
                                 '<line x1="' + Dx.toFixed(1) + '" y1="' + Dy.toFixed(1) + '" x2="' + Px.toFixed(1) + '" y2="' + Py.toFixed(1) + '" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="3,2"/>' +
                                 '<line x1="' + Ex.toFixed(1) + '" y1="' + Ey.toFixed(1) + '" x2="' + Px.toFixed(1) + '" y2="' + Py.toFixed(1) + '" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="3,2"/>' +
                                 // 等角マーク（●）と錯角マーク（●）
                                 '<circle cx="' + mark1X.toFixed(1) + '" cy="' + mark1Y.toFixed(1) + '" r="2.1" fill="#2980b9"/>' +
                                 '<circle cx="' + mark2X.toFixed(1) + '" cy="' + mark2Y.toFixed(1) + '" r="2.1" fill="#2980b9"/>' +
                                 '<circle cx="' + (Px - 18 * Math.cos(halfB)).toFixed(1) + '" cy="' + (Py + 18 * Math.sin(halfB)).toFixed(1) + '" r="2.1" fill="#e11d48"/>' +
                                 // 交点E・Pのドット
                                 '<circle cx="' + Ex.toFixed(1) + '" cy="' + Ey.toFixed(1) + '" r="2.2" fill="#2980b9"/>' +
                                 '<circle cx="' + Px.toFixed(1) + '" cy="' + Py.toFixed(1) + '" r="2.4" fill="#e11d48"/>' +
                                 // ラベル
                                 '<text x="' + (Ax - 8).toFixed(1) + '" y="' + (Ay - 6).toFixed(1) + '" font-size="10" font-weight="bold" fill="#1e293b">A</text>' +
                                 '<text x="' + (Dx - 2).toFixed(1) + '" y="' + (Dy - 6).toFixed(1) + '" font-size="10" font-weight="bold" fill="#1e293b">D</text>' +
                                 '<text x="' + (Px + 5).toFixed(1) + '" y="' + (Py - 5).toFixed(1) + '" font-size="10" font-weight="bold" fill="#e11d48">P</text>' +
                                 '<text x="' + (Cx + 5).toFixed(1) + '" y="' + (Cy + 11).toFixed(1) + '" font-size="10" font-weight="bold" fill="#1e293b">C</text>' +
                                 '<text x="' + (Bx - 11).toFixed(1) + '" y="' + (By + 11).toFixed(1) + '" font-size="10" font-weight="bold" fill="#1e293b">B</text>' +
                                 '<text x="' + (Ex - 11).toFixed(1) + '" y="' + (Ey + 2).toFixed(1) + '" font-size="10" font-weight="bold" fill="#2980b9">E</text>' +
                                 '</svg></div>';

                    explanationText = "【解説】<br>" +
                                      expSvg +
                                      "1. <strong>延長して二等辺三角形を作る</strong>：<br>" +
                                      "　図のように、半直線 \\(BE\\) と辺 \\(AD\\) を延長した交点を \\(P\\) とする。<br>" +
                                      "　\\(AD // BC\\) の錯角と角の二等分線の性質より \\(\\angle ABP = \\angle APB\\) となるため、\\(\\triangle ABP\\) は \\(AB = AP = " + c + "\\text{ cm}\\) の二等辺三角形である。<br>" +
                                      "2. <strong>延長部分の長さ \\(DP\\) を求める</strong>：<br>" +
                                      "　\\(DP = AP - AD = " + c + " - " + a + " = " + numDE + "\\text{ cm}\\)<br>" +
                                      "3. <strong>チョウチョ型の相似（\\(\\triangle EDP \\sim \\triangle ECB\\)）の利用</strong>：<br>" +
                                      "　\\(AD // BC\\) よりチョウチョ型の相似 \\(\\triangle EDP \\sim \\triangle ECB\\) が成り立つので、<br>" +
                                      "　\\(DE : EC = DP : BC = " + numDE + " : " + denEC + " = \\mathbf{" + ansDE + " : " + ansEC + "}\\)";
                }

                return {
                    problem: problemText + "<br>" + problemSvg,
                    explanation: explanationText
                };
            }
        },
        "角の二等分線と円と接線": {
            category: "平面図形",
            level: "公立",
            formula: "円の外側の点から引いた接線と角の二等分線があると二等辺三角形ができる。<br><br>" +
                     '<div style="text-align:center; margin: 8px 0;"><svg viewBox="20 20 240 170" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:220px; height:160px; display:inline-block;">' +
                     // 円の描画 (中心: 175, 105 / 半径: 52)
                     '<circle cx="175" cy="105" r="52" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>' +
                     // AQの下側（赤）: △CAQ（二等分線より下側）
                     '<polygon points="45,165 226.8,110.5 172.0,84.9" fill="#fecdd3" fill-opacity="0.55"/>' +
                     // AQの上側（青）: △DAP（二等分線より上側）
                     '<polygon points="137.5,68.8 45,165 136.4,109.2" fill="#bae6fd" fill-opacity="0.6"/>' +
                     // △DPQ の薄い緑色の塗りつぶし
                     '<polygon points="137.5,68.8 136.4,109.2 172.0,84.9" fill="#bbf7d0" fill-opacity="0.65"/>' +
                     // 割線 ABC のベース線（延長部分用）
                     '<line x1="40" y1="166.5" x2="238" y2="107.1" stroke="#334155" stroke-width="1.5"/>' +
                     // 線分 AC を赤色で強調
                     '<line x1="45" y1="165" x2="226.8" y2="110.5" stroke="#e11d48" stroke-width="1.6"/>' +
                     // 接線 AD (延長) - 青色
                     '<line x1="45" y1="165" x2="152.0" y2="53.8" stroke="#2563eb" stroke-width="1.6"/>' +
                     // 辺 DB（DP部分を青、PB部分をダークグレーに分割）
                     '<line x1="137.5" y1="68.8" x2="136.4" y2="109.2" stroke="#2563eb" stroke-width="1.6"/>' +
                     '<line x1="136.4" y1="109.2" x2="134.8" y2="138.1" stroke="#334155" stroke-width="1.3"/>' +
                     // 辺 DC（D, Q, C が完全に一直線になるよう DQ と CQ に分割）
                     '<line x1="137.5" y1="68.8" x2="172.0" y2="84.9" stroke="#334155" stroke-width="1.3"/>' +
                     '<line x1="172.0" y1="84.9" x2="226.8" y2="110.5" stroke="#e11d48" stroke-width="1.6"/>' +
                     // 角CADの二等分線 AQ（線の太さの上半分を青、下半分を赤に分割）
                     '<line x1="44.6" y1="164.3" x2="189.6" y2="73.3" stroke="#2563eb" stroke-width="1.5"/>' +
                     '<line x1="45.4" y1="165.7" x2="190.4" y2="74.7" stroke="#e11d48" stroke-width="1.5"/>' +
                     // 等角を示すマーク（・） - 角DAQと角CAQ
                     '<circle cx="71.5" cy="143.7" r="1.8" fill="#2563eb"/>' +
                     '<circle cx="76.0" cy="151.1" r="1.8" fill="#e11d48"/>' +
                     // 等角を示すマーク（×） - 角ADPと角ACQ
                     '<text x="132.1" y="81.7" font-size="8.5" font-weight="bold" fill="#2563eb" text-anchor="middle" dominant-baseline="central">×</text>' +
                     '<text x="206.9" y="109.1" font-size="8.5" font-weight="bold" fill="#e11d48" text-anchor="middle" dominant-baseline="central">×</text>' +
                     // 等角を示すマーク（・×） - 角DPQ（青）と角DQP（赤）
                     '<text x="143.1" y="96.9" font-size="7.5" font-weight="bold" fill="#2563eb" text-anchor="middle" dominant-baseline="central">・×</text>' +
                     '<text x="157.5" y="86.3" font-size="7.5" font-weight="bold" fill="#e11d48" text-anchor="middle" dominant-baseline="central">・×</text>' +
                     // 点A
                     '<circle cx="45" cy="165" r="2.2" fill="#334155"/>' +
                     '<text x="30" y="174" font-size="10" font-weight="bold" fill="#1e293b">A</text>' +
                     // 交点B
                     '<circle cx="134.8" cy="138.1" r="2.2" fill="#334155"/>' +
                     '<text x="124" y="156" font-size="10" font-weight="bold" fill="#1e293b">B</text>' +
                     // 交点C
                     '<circle cx="226.8" cy="110.5" r="2.2" fill="#334155"/>' +
                     '<text x="233" y="124" font-size="10" font-weight="bold" fill="#1e293b">C</text>' +
                     // 接点D
                     '<circle cx="137.5" cy="68.8" r="2.2" fill="#2563eb"/>' +
                     '<text x="122" y="65" font-size="10" font-weight="bold" fill="#2563eb">D</text>' +
                     // 交点P
                     '<circle cx="136.4" cy="109.2" r="2.2" fill="#334155"/>' +
                     '<text x="123" y="112" font-size="10" font-weight="bold" fill="#334155">P</text>' +
                     // 交点Q
                     '<circle cx="172.0" cy="84.9" r="2.2" fill="#334155"/>' +
                     '<text x="174" y="79" font-size="10" font-weight="bold" fill="#334155">Q</text>' +
                     '</svg></div><br>' +
                     '<strong>【証明】</strong><br>' +
                     '角の二等分線より<br>' +
                     '∠DAP＝∠CAQ（・）<br>' +
                     '接弦定理により<br>' +
                     '∠ADP＝∠ACQ（×）<br>' +
                     '△ADPの外角の定理より<br>' +
                     '∠DPQ＝∠DAP＋∠ADP（<span style="color:#2563eb; font-weight:bold;">・×</span>）<br>' +
                     '△ACQの外角の定理より<br>' +
                     '∠DQP＝∠CAQ＋∠ACQ（<span style="color:#e11d48; font-weight:bold;">・×</span>）<br>' +
                     'よって、∠DPQ＝∠DQPなので<strong>△DPQは二等辺三角形</strong>',
            generateRandom: function() {
                const presets = [
                    { ad: 16, cd: 9,  ab: 20, ac: 25, bc: 15 },
                    { ad: 9,  cd: 16, ab: 15, ac: 25, bc: 20 },
                    { ad: 5,  cd: 20, ab: 10, ac: 25, bc: 22.36, bcStr: "5√21" },
                    { ad: 4,  cd: 5,  ab: 6,  ac: 9,  bc: 6.71,  bcStr: "3√5" },
                    { ad: 12, cd: 15, ab: 18, ac: 27, bc: 20.12, bcStr: "9√5" },
                    { ad: 8,  cd: 10, ab: 12, ac: 18, bc: 13.42, bcStr: "6√5" }
                ];
                const p = presets[Math.floor(Math.random() * presets.length)];
                const ad = p.ad;
                const cd = p.cd;
                const ab = p.ab;
                const ac = p.ac;
                const bcVal = p.bc;
                const bcDisplay = p.bcStr ? p.bcStr : String(p.bc);

                const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);

                // --- 分数を綺麗に出力するためのヘルパー関数 ---
                const frac = (num, den) => 
                    `<span style="display:inline-block; vertical-align:middle; text-align:center; font-size:0.9em; margin:0 2px;">` +
                    `<span style="display:block; border-bottom:1px solid #334155; padding-bottom:1px; line-height:1.1;">${num}</span>` +
                    `<span style="display:block; padding-top:1px; line-height:1.1;">${den}</span>` +
                    `</span>`;

                // ② BE (= BF) の計算と美しい分数表現
                let beAnswer = "";
                let beFormula = "";
                const sumAbAc = ab + ac;
                if (!p.bcStr) {
                    const num = bcVal * ab;
                    const den = sumAbAc;
                    const g = gcd(num, den);
                    const n2 = num / g;
                    const d2 = den / g;
                    beAnswer = (d2 === 1) ? `${n2}` : frac(n2, d2);
                    beFormula = `${bcDisplay} × ${frac(ab, ab + ac)}`;
                } else {
                    const parts = p.bcStr.split("√");
                    const k = parseInt(parts[0], 10);
                    const r = parts[1];
                    const num = k * ab;
                    const den = sumAbAc;
                    const g = gcd(num, den);
                    const n2 = num / g;
                    const d2 = den / g;
                    beAnswer = (d2 === 1) ? `${n2}√${r}` : `${frac(n2 + "√" + r, d2)}`;
                    beFormula = `${bcDisplay} × ${frac(ab, ab + ac)}`;
                }

                // ③ AE : EF の計算
                const diffAcAb = ac - ab;
                const gRatio = gcd(ab, diffAcAb);
                const ratioAnswer = `${ab / gRatio} : ${diffAcAb / gRatio}`;

                // --- 幾何学的かつ正確なSVG座標の自動計算 ---
                const targetACpx = 135;
                const S = targetACpx / ac;

                const ABpx = ab * S;
                const BCpx = bcVal * S;
                const Rpx = BCpx / 2;

                const localO = { x: 0, y: 0 };
                const localB = { x: 0, y: -Rpx };
                const localC = { x: 0, y: Rpx };
                const localA = { x: -ABpx, y: -Rpx };

                const dxAC = localC.x - localA.x;
                const dyAC = localC.y - localA.y;
                const aCoef = dxAC * dxAC + dyAC * dyAC;
                const bCoef = 2 * (localA.x * dxAC + localA.y * dyAC);
                const cCoef = localA.x * localA.x + localA.y * localA.y - Rpx * Rpx;
                const disc = Math.sqrt(bCoef * bCoef - 4 * aCoef * cCoef);
                const t1 = (-bCoef - disc) / (2 * aCoef);
                const t2 = (-bCoef + disc) / (2 * aCoef);
                const tD = Math.abs(t1 - 1) > 0.01 ? t1 : t2;
                const localD = {
                    x: localA.x + tD * dxAC,
                    y: localA.y + tD * dyAC
                };

                const ratioBF = ABpx / (ABpx + ac * S);
                const localF = {
                    x: localB.x + (localC.x - localB.x) * ratioBF,
                    y: localB.y + (localC.y - localB.y) * ratioBF
                };

                const x1 = localA.x, y1 = localA.y, x2 = localF.x, y2 = localF.y;
                const x3 = localB.x, y3 = localB.y, x4 = localD.x, y4 = localD.y;
                const denom = (x1 - x2)*(y3 - y4) - (y1 - y2)*(x3 - x4);
                const localE = {
                    x: ((x1*y2 - y1*x2)*(x3 - x4) - (x1 - x2)*(x3*y4 - y3*x4)) / denom,
                    y: ((x1*y2 - y1*x2)*(y3 - y4) - (y1 - y2)*(x3*y4 - y3*x4)) / denom
                };

                const baseAngles = [0, Math.PI/6, Math.PI/3, Math.PI/2, Math.PI, 3*Math.PI/2];
                const rot = baseAngles[Math.floor(Math.random() * baseAngles.length)] + (Math.random() - 0.5) * 0.2;
                const flip = Math.random() < 0.5 ? 1 : -1;

                const cx = 130, cy = 95;
                const cosR = Math.cos(rot), sinR = Math.sin(rot);
                const transform = (pt) => {
                    const px = pt.x * flip;
                    const py = pt.y;
                    return {
                        x: cx + px * cosR - py * sinR,
                        y: cy + px * sinR + py * cosR
                    };
                };

                const P = {
                    O: transform(localO),
                    B: transform(localB),
                    C: transform(localC),
                    A: transform(localA),
                    D: transform(localD),
                    E: transform(localE),
                    F: transform(localF)
                };

                const labelPos = (target, ref, dist) => {
                    const vx = target.x - ref.x;
                    const vy = target.y - ref.y;
                    const l = Math.hypot(vx, vy) || 1;
                    return {
                        x: target.x + (vx / l) * dist,
                        y: target.y + (vy / l) * dist
                    };
                };

                const lblA = labelPos(P.A, P.O, 12);
                const lblB = labelPos(P.B, P.C, 12);
                const lblC = labelPos(P.C, P.B, 12);
                const lblD = labelPos(P.D, P.O, 11);
                const bisDir = { x: P.F.x - P.A.x, y: P.F.y - P.A.y };
                const bisLen = Math.hypot(bisDir.x, bisDir.y) || 1;
                const perp = { x: -bisDir.y / bisLen, y: bisDir.x / bisLen };
                const lblE = { x: P.E.x - perp.x * 10, y: P.E.y - perp.y * 10 };
                const lblF = { x: P.F.x + (bisDir.x / bisLen) * 10, y: P.F.y + (bisDir.y / bisLen) * 10 };

                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                const addPt = (pt) => {
                    if (pt.x < minX) minX = pt.x;
                    if (pt.x > maxX) maxX = pt.x;
                    if (pt.y < minY) minY = pt.y;
                    if (pt.y > maxY) maxY = pt.y;
                };
                [P.O, P.B, P.C, P.A, P.D, P.E, P.F, lblA, lblB, lblC, lblD, lblE, lblF].forEach(addPt);
                addPt({ x: P.O.x - Rpx, y: P.O.y - Rpx });
                addPt({ x: P.O.x + Rpx, y: P.O.y + Rpx });

                const margin = 20;
                const vbX = minX - margin;
                const vbY = minY - margin;
                const vbW = (maxX - minX) + margin * 2;
                const vbH = (maxY - minY) + margin * 2;

                const uBA = { x: (P.A.x - P.B.x) / ABpx, y: (P.A.y - P.B.y) / ABpx };
                const uBC = { x: (P.C.x - P.B.x) / BCpx, y: (P.C.y - P.B.y) / BCpx };
                const sz = 7;
                const r1 = `${(P.B.x + uBA.x * sz).toFixed(1)},${(P.B.y + uBA.y * sz).toFixed(1)}`;
                const r2 = `${(P.B.x + (uBA.x + uBC.x) * sz).toFixed(1)},${(P.B.y + (uBA.y + uBC.y) * sz).toFixed(1)}`;
                const r3 = `${(P.B.x + uBC.x * sz).toFixed(1)},${(P.B.y + uBC.y * sz).toFixed(1)}`;

                const polyBEF = `${P.B.x.toFixed(1)},${P.B.y.toFixed(1)} ${P.E.x.toFixed(1)},${P.E.y.toFixed(1)} ${P.F.x.toFixed(1)},${P.F.y.toFixed(1)}`;

                const svgDiagram =
                    '<div style="text-align:center; margin: 10px 0;">' +
                    `<svg viewBox="${vbX.toFixed(1)} ${vbY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:240px; height:175px; display:inline-block;">` +
                    `<circle cx="${P.O.x.toFixed(1)}" cy="${P.O.y.toFixed(1)}" r="${Rpx.toFixed(1)}" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>` +
                    `<polygon points="${polyBEF}" fill="#bbf7d0" fill-opacity="0.65"/>` +
                    `<polyline points="${r1} ${r2} ${r3}" fill="none" stroke="#64748b" stroke-width="1.1"/>` +
                    `<line x1="${P.A.x.toFixed(1)}" y1="${P.A.y.toFixed(1)}" x2="${P.B.x.toFixed(1)}" y2="${P.B.y.toFixed(1)}" stroke="#2563eb" stroke-width="1.6"/>` +
                    `<line x1="${P.B.x.toFixed(1)}" y1="${P.B.y.toFixed(1)}" x2="${P.C.x.toFixed(1)}" y2="${P.C.y.toFixed(1)}" stroke="#334155" stroke-width="1.5"/>` +
                    `<line x1="${P.A.x.toFixed(1)}" y1="${P.A.y.toFixed(1)}" x2="${P.C.x.toFixed(1)}" y2="${P.C.y.toFixed(1)}" stroke="#334155" stroke-width="1.5"/>` +
                    `<line x1="${P.B.x.toFixed(1)}" y1="${P.B.y.toFixed(1)}" x2="${P.D.x.toFixed(1)}" y2="${P.D.y.toFixed(1)}" stroke="#334155" stroke-width="1.3"/>` +
                    `<line x1="${P.A.x.toFixed(1)}" y1="${P.A.y.toFixed(1)}" x2="${P.F.x.toFixed(1)}" y2="${P.F.y.toFixed(1)}" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="3,2"/>` +
                    `<circle cx="${P.A.x.toFixed(1)}" cy="${P.A.y.toFixed(1)}" r="2.2" fill="#334155"/>` +
                    `<text x="${lblA.x.toFixed(1)}" y="${lblA.y.toFixed(1)}" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle" dominant-baseline="central">A</text>` +
                    `<circle cx="${P.B.x.toFixed(1)}" cy="${P.B.y.toFixed(1)}" r="2.2" fill="#2563eb"/>` +
                    `<text x="${lblB.x.toFixed(1)}" y="${lblB.y.toFixed(1)}" font-size="10" font-weight="bold" fill="#2563eb" text-anchor="middle" dominant-baseline="central">B</text>` +
                    `<circle cx="${P.C.x.toFixed(1)}" cy="${P.C.y.toFixed(1)}" r="2.2" fill="#334155"/>` +
                    `<text x="${lblC.x.toFixed(1)}" y="${lblC.y.toFixed(1)}" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle" dominant-baseline="central">C</text>` +
                    `<circle cx="${P.D.x.toFixed(1)}" cy="${P.D.y.toFixed(1)}" r="2.2" fill="#334155"/>` +
                    `<text x="${lblD.x.toFixed(1)}" y="${lblD.y.toFixed(1)}" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle" dominant-baseline="central">D</text>` +
                    `<circle cx="${P.E.x.toFixed(1)}" cy="${P.E.y.toFixed(1)}" r="2.2" fill="#e11d48"/>` +
                    `<text x="${lblE.x.toFixed(1)}" y="${lblE.y.toFixed(1)}" font-size="10" font-weight="bold" fill="#e11d48" text-anchor="middle" dominant-baseline="central">E</text>` +
                    `<circle cx="${P.F.x.toFixed(1)}" cy="${P.F.y.toFixed(1)}" r="2.2" fill="#e11d48"/>` +
                    `<text x="${lblF.x.toFixed(1)}" y="${lblF.y.toFixed(1)}" font-size="10" font-weight="bold" fill="#e11d48" text-anchor="middle" dominant-baseline="central">F</text>` +
                    '</svg></div>';

                const problem =
                    "図のように円の外部の点Aから接線を引き接点をBとし、Bを通る直径をBCとする。" +
                    "直線ACと円の交点をDとし、∠BADの二等分線が線分BD、BCと交わる点をそれぞれE, Fとする。<br>" +
                    `AD = ${ad}、CD = ${cd} のとき次の問いに答えよ。<br>` +
                    svgDiagram +
                    "① AB<br>" +
                    "② BE<br>" +
                    "③ AE : EF";

                const explanation =
                    `<strong>① AB = ${ab}</strong><br>` +
                    `AC = AD + CD = ${ad} + ${cd} = ${ac}<br>` +
                    `方べきの定理より、AB² = AD × AC = ${ad} × ${ac} = ${ad * ac}<br>` +
                    `AB &gt; 0 より、<strong>AB = ${ab}</strong><br><br>` +
                    `<strong>② BE = ${beAnswer}</strong><br>` +
                    `BCは直径なので ∠ABC = 90°。△ABCで三平方の定理より、<br>` +
                    `BC = √(${ac}² − ${ab}²) = ${bcDisplay}<br>` +
                    `接弦定理と角の二等分線の性質より、<strong>△BEFは BE = BF の二等辺三角形</strong>になる。<br>` +
                    `また、△ABCでAFは∠BACの二等分線なので、<br>` +
                    `BF : FC = AB : AC = ${frac(ab, ac)}<br>` +
                    `よって、BE = BF = ${beFormula} = <strong>${beAnswer}</strong><br><br>` +
                    `<strong>③ AE : EF = ${ratioAnswer}</strong><br>` +
                    `△ABEと△ACFにおいて、<br>` +
                    `角の二等分線より ∠BAE = ∠CAF、接弦定理より ∠ABE = ∠ACF なので、<br>` +
                    `△ABE ∽ △ACF（2組の角がそれぞれ等しい）<br>` +
                    `よって、AE : AF = AB : AC = ${frac(ab, ac)}<br>` +
                    `したがって、AE : EF = ${ab} : (${ac} − ${ab}) = <strong>${ratioAnswer}</strong>`;

                return {
                    problem: problem,
                    explanation: explanation
                };
            }
        },
         "メネラウスの定理": {
            category: "平面図形",
            level: "公立",
            selfCheck: (() => {
                const frac = (num, den) =>
                    `<span style="display:inline-block; vertical-align:middle; text-align:center; font-size:0.88em; margin:4px 2px;">` +
                    `<span style="display:block; border-bottom:1px solid #334155; padding:0 2px 1px; line-height:1.1;">${num}</span>` +
                    `<span style="display:block; padding:1px 2px 0; line-height:1.1;">${den}</span>` +
                    `</span>`;

                return [
                    "3辺が比や長さ、x, y で埋まっている <strong>基準の三角形</strong> を正しく選べたか？",
                    "基準の三角形の頂点（●）と残りの点（○）を分け、<strong>● → ○ → ● → ○</strong> と一筆書きの順に式を立てられたか？",
                    `${frac("BD", "DA")} × ${frac("AF", "FE")} × ${frac("EC", "CB")} ＝ 1 のような分数の向き・全体（足し算）・逆数・求める線分比の「順番」を間違えていないか？`
                ];
            })(),
            formula: (() => {
                const frac = (num, den) =>
                    `<span style="display:inline-block; vertical-align:middle; text-align:center; font-size:0.9em; margin:0 2px;">` +
                    `<span style="display:block; border-bottom:1px solid #334155; padding-bottom:1px; line-height:1.1;">${num}</span>` +
                    `<span style="display:block; padding-top:1px; line-height:1.1;">${den}</span>` +
                    `</span>`;

                return "線分比を求める方法として三角形2枚が重なっているとき、メネラウスの定理を利用しよう。<br>" +
                       "【例題】<br>" +
                       "AD:DB=3:4、BE:EC=5:6の時、AF:FEを求めなさい。<br><br>" +
                       '<div style="text-align:center; margin: 8px 0;"><svg viewBox="12 12 225 162" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:235px; height:172px; display:inline-block;">' +
                       '<polygon points="65,32 35,142 104.8,133.0" fill="#fecdd3" fill-opacity="0.55" stroke="#0f172a" stroke-width="1.5"/>' +
                       '<polygon points="35,142 190,122 51.5,81.5" fill="none" stroke="#0f172a" stroke-width="1.5"/>' +
                       '<line x1="51.5" y1="81.5" x2="190" y2="122" stroke="#0f172a" stroke-width="1.5"/>' +
                       '<line x1="65" y1="32" x2="104.8" y2="133.0" stroke="#0f172a" stroke-width="1.5"/>' +
                       '<circle cx="51.5" cy="81.5" r="2.5" fill="#0f172a"/>' +
                       '<text x="39" y="79" font-size="10" font-weight="bold" fill="#0f172a">D</text>' +
                       '<circle cx="104.8" cy="133.0" r="2.5" fill="#0f172a"/>' +
                       '<text x="108" y="126" font-size="10" font-weight="bold" fill="#0f172a">E</text>' +
                       '<circle cx="88.8" cy="92.4" r="2.5" fill="#0f172a"/>' +
                       '<text x="93" y="88" font-size="10" font-weight="bold" fill="#0f172a">F</text>' +
                       '<circle cx="65" cy="32" r="2.5" fill="#0f172a"/>' +
                       '<text x="61" y="25" font-size="10" font-weight="bold" fill="#0f172a">A</text>' +
                       '<circle cx="35" cy="142" r="2.5" fill="#0f172a"/>' +
                       '<text x="21" y="146" font-size="10" font-weight="bold" fill="#0f172a">B</text>' +
                       '<circle cx="190" cy="122" r="2.5" fill="#0f172a"/>' +
                       '<text x="196" y="125" font-size="10" font-weight="bold" fill="#0f172a">C</text>' +
                       '<text x="45" y="58" font-size="9.5" font-weight="bold" fill="#0f172a">③</text>' +
                       '<text x="28" y="114" font-size="9.5" font-weight="bold" fill="#0f172a">④</text>' +
                       '<rect x="64" y="141" width="11" height="11" fill="#fff" stroke="#0f172a" stroke-width="1.1"/>' +
                       '<text x="69.5" y="147" font-size="8.5" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="central">5</text>' +
                       '<rect x="142" y="134" width="11" height="11" fill="#fff" stroke="#0f172a" stroke-width="1.1"/>' +
                       '<text x="147.5" y="140" font-size="8.5" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="central">6</text>' +
                       '<text x="84" y="63" font-size="9.5" font-weight="bold" font-style="italic" fill="#0f172a">x</text>' +
                       '<text x="101" y="114" font-size="9.5" font-weight="bold" font-style="italic" fill="#0f172a">y</text>' +
                       '</svg></div><br>' +
                       'まず分かっている辺の長さや比と求めたい線分にx：yと書きこむ。<br>' +
                       '（AD:DB=3:4、BE:EC=5:6とAF:FE=x:yを辺に書き込む）<br>' +
                       '① <strong>基準の三角形</strong>をさがす<br>' +
                       '　→ 三辺が長さや比、xやyで埋まっている三角形になることが多い。<br>' +
                       '　(今回なら△ABE)<br>' +
                       '② 基準の三角形の頂点に<strong>●</strong>、のこりの点に<strong>○</strong>をつける<br>' +
                       '　→ ○が一直線上に並べば条件OK！<br>' +
                       '③ <strong>● → ○ → ● → ○ → …</strong> と一筆書きで結びながら以下のような式に比やx、yを代入しよう。<br>' +
                       '<div style="text-align:center; margin: 10px 0;">' +
                       '<span style="display:inline-block; vertical-align:middle; text-align:center; font-size:0.95em;">' +
                       `${frac("BD", "DA")} × ${frac("AF", "FE")} × ${frac("EC", "CB")} ＝ 1` +
                       '</span></div>' +
                       '<div style="text-align:center; margin: 8px 0;">' +
                       `<span style="display:inline-block; vertical-align:middle; text-align:center; font-size:0.95em;">${frac("4", "3")}×${frac("x", "y")}×${frac("6", "6+5")}=1</span>` +
                       '</div>' +
                       'よってx:y=11:8<br>' +
                       '※かけて1になることから逆数で答えを出す！<br>' +
                       '※見た目で比の順番をチェック！';
            })(),
            generateRandom: function() {
                const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
                const frac = (num, den) =>
                    `<span style="display:inline-block; vertical-align:middle; text-align:center; font-size:0.9em; margin:0 2px;">` +
                    `<span style="display:block; border-bottom:1px solid #334155; padding-bottom:1px; line-height:1.1;">${num}</span>` +
                    `<span style="display:block; padding-top:1px; line-height:1.1;">${den}</span>` +
                    `</span>`;

                const ratioPairs = [
                    [2, 3], [3, 2], [3, 4], [4, 3],
                    [2, 5], [5, 2], [3, 5], [5, 3],
                    [4, 5], [5, 4], [5, 6], [6, 5]
                ];
                const pickPair = (exclude) => {
                    const candidates = ratioPairs.filter(
                        ([a, b]) => !(exclude && a === exclude[0] && b === exclude[1])
                    );
                    return candidates[Math.floor(Math.random() * candidates.length)];
                };

                const [ad, db] = pickPair(null);
                const [be, ec] = pickPair([ad, db]);
                const pattern = Math.floor(Math.random() * 9);

                const tD = ad / (ad + db);
                const tE = be / (be + ec);

                const baseA = { x: 75, y: 42 };
                const baseB = { x: 42, y: 142 };
                const baseC = { x: 168, y: 125 };
                const baseD = { x: baseA.x + (baseB.x - baseA.x) * tD, y: baseA.y + (baseB.y - baseA.y) * tD };
                const baseE = { x: baseB.x + (baseC.x - baseB.x) * tE, y: baseB.y + (baseC.y - baseB.y) * tE };

                const lineIntersect = (p1, p2, p3, p4) => {
                    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
                    if (Math.abs(denom) < 1e-6) return { x: (p1.x + p4.x) / 2, y: (p1.y + p4.y) / 2 };
                    return {
                        x: ((p1.x * p2.y - p1.y * p2.x) * (p3.x - p4.x) - (p1.x - p2.x) * (p3.x * p4.y - p3.y * p4.x)) / denom,
                        y: ((p1.x * p2.y - p1.y * p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x * p4.y - p3.y * p4.x)) / denom
                    };
                };
                const baseF = lineIntersect(baseD, baseC, baseA, baseE);

                const deg = Math.floor(Math.random() * 360);
                const rad = (deg * Math.PI) / 180;
                const cosA = Math.cos(rad);
                const sinA = Math.sin(rad);
                const pivot = {
                    x: (baseA.x + baseB.x + baseC.x) / 3,
                    y: (baseA.y + baseB.y + baseC.y) / 3
                };
                const rotatePt = (pt) => {
                    const dx = pt.x - pivot.x;
                    const dy = pt.y - pivot.y;
                    return {
                        x: pivot.x + dx * cosA - dy * sinA,
                        y: pivot.y + dx * sinA + dy * cosA
                    };
                };

                const A = rotatePt(baseA);
                const B = rotatePt(baseB);
                const C = rotatePt(baseC);
                const D = rotatePt(baseD);
                const E = rotatePt(baseE);
                const F = rotatePt(baseF);

                const offsetFrom = (target, ref, dist) => {
                    const vx = target.x - ref.x;
                    const vy = target.y - ref.y;
                    const len = Math.hypot(vx, vy) || 1;
                    return { x: target.x + (vx / len) * dist, y: target.y + (vy / len) * dist };
                };
                const lblA = offsetFrom(A, pivot, 12);
                const lblB = offsetFrom(B, pivot, 12);
                const lblC = offsetFrom(C, pivot, 12);
                const lblD = offsetFrom(D, pivot, 11);
                const lblE = offsetFrom(E, pivot, 11);
                const lblF = offsetFrom(F, pivot, 10);

                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                [A, B, C, D, E, F, lblA, lblB, lblC, lblD, lblE, lblF].forEach(p => {
                    if (p.x < minX) minX = p.x;
                    if (p.x > maxX) maxX = p.x;
                    if (p.y < minY) minY = p.y;
                    if (p.y > maxY) maxY = p.y;
                });
                const pad = 16;
                const vbX = minX - pad;
                const vbY = minY - pad;
                const vbW = (maxX - minX) + pad * 2;
                const vbH = (maxY - minY) + pad * 2;

                const svgProblem =
                    '<div style="text-align:center; margin: 10px 0;">' +
                    `<svg viewBox="${vbX.toFixed(1)} ${vbY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:235px; height:172px; display:inline-block;">` +
                    `<polygon points="${A.x.toFixed(1)},${A.y.toFixed(1)} ${B.x.toFixed(1)},${B.y.toFixed(1)} ${E.x.toFixed(1)},${E.y.toFixed(1)}" fill="none" stroke="#0f172a" stroke-width="1.5"/>` +
                    `<polygon points="${B.x.toFixed(1)},${B.y.toFixed(1)} ${C.x.toFixed(1)},${C.y.toFixed(1)} ${D.x.toFixed(1)},${D.y.toFixed(1)}" fill="none" stroke="#0f172a" stroke-width="1.5"/>` +
                    `<line x1="${D.x.toFixed(1)}" y1="${D.y.toFixed(1)}" x2="${C.x.toFixed(1)}" y2="${C.y.toFixed(1)}" stroke="#0f172a" stroke-width="1.5"/>` +
                    `<line x1="${A.x.toFixed(1)}" y1="${A.y.toFixed(1)}" x2="${E.x.toFixed(1)}" y2="${E.y.toFixed(1)}" stroke="#0f172a" stroke-width="1.5"/>` +
                    `<circle cx="${A.x.toFixed(1)}" cy="${A.y.toFixed(1)}" r="2.4" fill="#0f172a"/>` +
                    `<text x="${lblA.x.toFixed(1)}" y="${lblA.y.toFixed(1)}" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="central">A</text>` +
                    `<circle cx="${B.x.toFixed(1)}" cy="${B.y.toFixed(1)}" r="2.4" fill="#0f172a"/>` +
                    `<text x="${lblB.x.toFixed(1)}" y="${lblB.y.toFixed(1)}" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="central">B</text>` +
                    `<circle cx="${C.x.toFixed(1)}" cy="${C.y.toFixed(1)}" r="2.4" fill="#0f172a"/>` +
                    `<text x="${lblC.x.toFixed(1)}" y="${lblC.y.toFixed(1)}" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="central">C</text>` +
                    `<circle cx="${D.x.toFixed(1)}" cy="${D.y.toFixed(1)}" r="2.4" fill="#0f172a"/>` +
                    `<text x="${lblD.x.toFixed(1)}" y="${lblD.y.toFixed(1)}" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="central">D</text>` +
                    `<circle cx="${E.x.toFixed(1)}" cy="${E.y.toFixed(1)}" r="2.4" fill="#0f172a"/>` +
                    `<text x="${lblE.x.toFixed(1)}" y="${lblE.y.toFixed(1)}" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="central">E</text>` +
                    `<circle cx="${F.x.toFixed(1)}" cy="${F.y.toFixed(1)}" r="2.4" fill="#0f172a"/>` +
                    `<text x="${lblF.x.toFixed(1)}" y="${lblF.y.toFixed(1)}" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="central">F</text>` +
                    '</svg></div>';

                const intro =
                    "図のように、△ABEと△BCDが重なっており、点Dは辺AB上、点Eは辺BC上にある。" +
                    "線分DCと線分AEの交点をFとする。<br>";

                const cb = be + ec;
                const ba = ad + db;

                const pRaw = ad * cb;
                const qRaw = db * ec;
                const gFE = gcd(pRaw, qRaw);
                const pFE = pRaw / gFE;
                const qFE = qRaw / gFE;

                const uRaw = ad * be;
                const vRaw = ba * ec;
                const gFC = gcd(uRaw, vRaw);
                const uFC = uRaw / gFC;
                const vFC = vRaw / gFC;

                let targetLabel = "";
                let ansStr = "";
                let explanation = "";

                if (pattern <= 2) {
                    if (pattern === 0) {
                        targetLabel = "AF : FE";
                        ansStr = `${pFE} : ${qFE}`;
                    } else if (pattern === 1) {
                        targetLabel = "AF : AE";
                        const gSum = gcd(pFE, pFE + qFE);
                        ansStr = `${pFE / gSum} : ${(pFE + qFE) / gSum}`;
                    } else {
                        targetLabel = "FE : AE";
                        const gSum = gcd(qFE, pFE + qFE);
                        ansStr = `${qFE / gSum} : ${(pFE + qFE) / gSum}`;
                    }

                    explanation =
                        `AF : FE ＝ x : y とおく。<br>` +
                        `① 基準の三角形は <strong>△ABE</strong><br>` +
                        `② △ABEの頂点A, B, Eに●、残りの点D, F, Cに○をつけると、3点D, F, Cは一直線上にある。<br>` +
                        `③ メネラウスの定理より：<br>` +
                        '<div style="text-align:center; margin: 8px 0;">' +
                        `${frac("BD", "DA")} × ${frac("AF", "FE")} × ${frac("EC", "CB")} ＝ 1` +
                        '</div>' +
                        '<div style="text-align:center; margin: 8px 0;">' +
                        `${frac(db, ad)} × ${frac("x", "y")} × ${frac(ec, `${be}+${ec}`)} ＝ 1` +
                        '</div>' +
                        '<div style="text-align:center; margin: 8px 0;">' +
                        `${frac(db * ec, ad * cb)} × ${frac("x", "y")} ＝ 1` +
                        '</div>' +
                        (pattern === 0 ? "" : `AF : FE ＝ ${pFE} : ${qFE} より、${targetLabel} を求めよう。`);
                } else if (pattern <= 5) {
                    if (pattern === 3) {
                        targetLabel = "DF : FC";
                        ansStr = `${uFC} : ${vFC}`;
                    } else if (pattern === 4) {
                        targetLabel = "DF : DC";
                        const gSum = gcd(uFC, uFC + vFC);
                        ansStr = `${uFC / gSum} : ${(uFC + vFC) / gSum}`;
                    } else {
                        targetLabel = "FC : DC";
                        const gSum = gcd(vFC, uFC + vFC);
                        ansStr = `${vFC / gSum} : ${(uFC + vFC) / gSum}`;
                    }

                    explanation =
                        `DF : FC ＝ x : y とおく。<br>` +
                        `① 基準の三角形は <strong>△BCD</strong><br>` +
                        `② △BCDの頂点B, C, Dに●、残りの点E, F, Aに○をつけると、3点E, F, Aは一直線上にある。<br>` +
                        `③ メネラウスの定理より：<br>` +
                        '<div style="text-align:center; margin: 8px 0;">' +
                        `${frac("BA", "AD")} × ${frac("DF", "FC")} × ${frac("CE", "EB")} ＝ 1` +
                        '</div>' +
                        '<div style="text-align:center; margin: 8px 0;">' +
                        `${frac(`${ad}+${db}`, ad)} × ${frac("x", "y")} × ${frac(ec, be)} ＝ 1` +
                        '</div>' +
                        '<div style="text-align:center; margin: 8px 0;">' +
                        `${frac(ba * ec, ad * be)} × ${frac("x", "y")} ＝ 1` +
                        '</div>' +
                        (pattern === 3 ? "" : `DF : FC ＝ ${uFC} : ${vFC} より、${targetLabel} を求めよう。`);
                } else {
                    if (pattern === 6) {
                        targetLabel = "DF : FC";
                        ansStr = `${uFC} : ${vFC}`;
                    } else if (pattern === 7) {
                        targetLabel = "DF : DC";
                        const gSum = gcd(uFC, uFC + vFC);
                        ansStr = `${uFC / gSum} : ${(uFC + vFC) / gSum}`;
                    } else {
                        targetLabel = "FC : DC";
                        const gSum = gcd(vFC, uFC + vFC);
                        ansStr = `${vFC / gSum} : ${(uFC + vFC) / gSum}`;
                    }

                    const aeNum = pFE + qFE;
                    explanation =
                        `DF : FC ＝ x : y とおく。<br>` +
                        `① 基準の三角形は <strong>△ADF</strong><br>` +
                        `② △ADFの頂点A, D, Fに●、残りの点B, E, Cに○をつけると、3点B, E, Cは一直線上にある。<br>` +
                        `③ メネラウスの定理より：<br>` +
                        '<div style="text-align:center; margin: 8px 0;">' +
                        `${frac("DB", "BA")} × ${frac("AE", "EF")} × ${frac("FC", "CD")} ＝ 1` +
                        '</div>' +
                        '<div style="text-align:center; margin: 8px 0;">' +
                        `${frac(db, `${ad}+${db}`)} × ${frac(aeNum, qFE)} × ${frac("y", "x+y")} ＝ 1` +
                        '</div>' +
                        '<div style="text-align:center; margin: 8px 0;">' +
                        `${frac("x", "y")} ＝ ${frac(uFC, vFC)}` +
                        '</div>' +
                        (pattern === 6 ? "" : `DF : FC ＝ ${uFC} : ${vFC} より、${targetLabel} を求めよう。`);
                }

                const problem =
                    intro +
                    `AD : DB ＝ ${ad} : ${db}、BE : EC ＝ ${be} : ${ec} のとき、<strong>${targetLabel}</strong> を求めなさい。` +
                    svgProblem;

                return {
                    problem,
                    answer: `${targetLabel} ＝ ${ansStr}`,
                    explanation
                };
            }
        },

        "チェバの定理": {
            category: "平面図形",
            level: "難関私立",
            selfCheck: (() => {
                const frac = (num, den) =>
                    `<span style="display:inline-block; vertical-align:middle; text-align:center; font-size:0.88em; margin:4px 2px;">` +
                    `<span style="display:block; border-bottom:1px solid #334155; padding:0 2px 1px; line-height:1.1;">${num}</span>` +
                    `<span style="display:block; padding:1px 2px 0; line-height:1.1;">${den}</span>` +
                    `</span>`;

                return [
                    "3直線（AD, BE, CF）が <strong>1点で交わる</strong> ことを確認してから式を立てたか？",
                    `${frac("AF", "FB")} × ${frac("BD", "DC")} × ${frac("CE", "EA")} ＝ 1 の分母・分子の向き（頂点→交点→もう一方の頂点）を間違えていないか？`,
                    "積が 1 になる関係から逆数・約分を正確に計算し、求める線分比の「順番」を逆にしていないか？"
                ];
            })(),
            formula: (() => {
                const frac = (num, den) =>
                    `<span style="display:inline-block; vertical-align:middle; text-align:center; font-size:0.9em; margin:0 2px;">` +
                    `<span style="display:block; border-bottom:1px solid #334155; padding-bottom:1px; line-height:1.1;">${num}</span>` +
                    `<span style="display:block; padding-top:1px; line-height:1.1;">${den}</span>` +
                    `</span>`;

                return "三角形の各頂点から向かいの辺に引いた 3 つの直線が，1 点で交わるとき，次の式で線分比を求めることができる。<br><br>" +
                       '<div style="text-align:center; margin: 8px 0;"><svg viewBox="15 12 200 152" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:235px; height:172px; display:inline-block;">' +
                       '<polygon points="95,28 35,145 195,132" fill="none" stroke="#0f172a" stroke-width="1.5"/>' +
                       '<line x1="95" y1="28" x2="103.6" y2="139.4" stroke="#0f172a" stroke-width="1.4"/>' +
                       '<line x1="35" y1="145" x2="128.3" y2="62.7" stroke="#0f172a" stroke-width="1.4"/>' +
                       '<line x1="195" y1="132" x2="71.0" y2="74.8" stroke="#0f172a" stroke-width="1.4"/>' +
                       '<circle cx="95" cy="28" r="2.5" fill="#0f172a"/>' +
                       '<text x="95" y="19" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">A</text>' +
                       '<circle cx="35" cy="145" r="2.5" fill="#0f172a"/>' +
                       '<text x="24" y="150" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">B</text>' +
                       '<circle cx="195" cy="132" r="2.5" fill="#0f172a"/>' +
                       '<text x="205" y="136" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">C</text>' +
                       '<circle cx="103.6" cy="139.4" r="2.4" fill="#0f172a"/>' +
                       '<text x="104" y="152" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">D</text>' +
                       '<circle cx="128.3" cy="62.7" r="2.4" fill="#0f172a"/>' +
                       '<text x="139" y="59" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">E</text>' +
                       '<circle cx="71.0" cy="74.8" r="2.4" fill="#0f172a"/>' +
                       '<text x="59" y="72" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">F</text>' +
                       '<circle cx="99.6" cy="88.0" r="2.2" fill="#0f172a"/>' +
                       '</svg></div><br>' +
                       '<div style="text-align:center; margin: 10px 0;">' +
                       '<span style="display:inline-block; vertical-align:middle; text-align:center; font-size:0.95em;">' +
                       `${frac("AF", "FB")} × ${frac("BD", "DC")} × ${frac("CE", "EA")} ＝ 1` +
                       '</span></div>';
            })(),
            generateRandom: function() {
                const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
                const frac = (num, den) =>
                    `<span style="display:inline-block; vertical-align:middle; text-align:center; font-size:0.9em; margin:0 2px;">` +
                    `<span style="display:block; border-bottom:1px solid #334155; padding-bottom:1px; line-height:1.1;">${num}</span>` +
                    `<span style="display:block; padding-top:1px; line-height:1.1;">${den}</span>` +
                    `</span>`;

                const ratioPairs = [
                    [1, 2], [2, 1], [1, 3], [3, 1],
                    [2, 3], [3, 2], [3, 4], [4, 3],
                    [2, 5], [5, 2], [3, 5], [5, 3]
                ];
                const pickPair = (exclude) => {
                    const candidates = ratioPairs.filter(
                        ([a, b]) => !(exclude && a === exclude[0] && b === exclude[1])
                    );
                    return candidates[Math.floor(Math.random() * candidates.length)];
                };

                const askType = Math.floor(Math.random() * 3);

                let af, fb, bd, dc, ce, ea;
                if (askType === 0) {
                    [af, fb] = pickPair(null);
                    [bd, dc] = pickPair([af, fb]);
                    const num = fb * dc;
                    const den = af * bd;
                    const g = gcd(num, den);
                    ce = num / g;
                    ea = den / g;
                } else if (askType === 1) {
                    [af, fb] = pickPair(null);
                    [ce, ea] = pickPair([af, fb]);
                    const num = fb * ea;
                    const den = af * ce;
                    const g = gcd(num, den);
                    bd = num / g;
                    dc = den / g;
                } else {
                    [bd, dc] = pickPair(null);
                    [ce, ea] = pickPair([bd, dc]);
                    const num = dc * ea;
                    const den = bd * ce;
                    const g = gcd(num, den);
                    af = num / g;
                    fb = den / g;
                }

                const baseA = { x: 95, y: 28 };
                const baseB = { x: 35, y: 145 };
                const baseC = { x: 195, y: 132 };

                const tF = af / (af + fb);
                const tD = bd / (bd + dc);
                const tE = ce / (ce + ea);

                const baseF = { x: baseA.x + (baseB.x - baseA.x) * tF, y: baseA.y + (baseB.y - baseA.y) * tF };
                const baseD = { x: baseB.x + (baseC.x - baseB.x) * tD, y: baseB.y + (baseC.y - baseB.y) * tD };
                const baseE = { x: baseC.x + (baseA.x - baseC.x) * tE, y: baseC.y + (baseA.y - baseC.y) * tE };

                const lineIntersect = (p1, p2, p3, p4) => {
                    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
                    return {
                        x: ((p1.x * p2.y - p1.y * p2.x) * (p3.x - p4.x) - (p1.x - p2.x) * (p3.x * p4.y - p3.y * p4.x)) / denom,
                        y: ((p1.x * p2.y - p1.y * p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x * p4.y - p3.y * p4.x)) / denom
                    };
                };
                const baseP = lineIntersect(baseA, baseD, baseB, baseE);

                const deg = Math.floor(Math.random() * 360);
                const rad = (deg * Math.PI) / 180;
                const cosA = Math.cos(rad);
                const sinA = Math.sin(rad);
                const pivot = {
                    x: (baseA.x + baseB.x + baseC.x) / 3,
                    y: (baseA.y + baseB.y + baseC.y) / 3
                };
                const rotatePt = (pt) => {
                    const dx = pt.x - pivot.x;
                    const dy = pt.y - pivot.y;
                    return {
                        x: pivot.x + dx * cosA - dy * sinA,
                        y: pivot.y + dx * sinA + dy * cosA
                    };
                };

                const A = rotatePt(baseA);
                const B = rotatePt(baseB);
                const C = rotatePt(baseC);
                const D = rotatePt(baseD);
                const E = rotatePt(baseE);
                const F = rotatePt(baseF);
                const P = rotatePt(baseP);

                const offsetFrom = (target, ref, dist) => {
                    const vx = target.x - ref.x;
                    const vy = target.y - ref.y;
                    const len = Math.hypot(vx, vy) || 1;
                    return { x: target.x + (vx / len) * dist, y: target.y + (vy / len) * dist };
                };

                const lblA = offsetFrom(A, pivot, 12);
                const lblB = offsetFrom(B, pivot, 12);
                const lblC = offsetFrom(C, pivot, 12);
                const lblD = offsetFrom(D, A, 11);
                const lblE = offsetFrom(E, B, 11);
                const lblF = offsetFrom(F, C, 11);

                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                [A, B, C, D, E, F, P, lblA, lblB, lblC, lblD, lblE, lblF].forEach(p => {
                    if (p.x < minX) minX = p.x;
                    if (p.x > maxX) maxX = p.x;
                    if (p.y < minY) minY = p.y;
                    if (p.y > maxY) maxY = p.y;
                });
                const pad = 16;
                const vbX = minX - pad;
                const vbY = minY - pad;
                const vbW = (maxX - minX) + pad * 2;
                const vbH = (maxY - minY) + pad * 2;

                const svgProblem =
                    '<div style="text-align:center; margin: 10px 0;">' +
                    `<svg viewBox="${vbX.toFixed(1)} ${vbY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; width:235px; height:172px; display:inline-block;">` +
                    `<polygon points="${A.x.toFixed(1)},${A.y.toFixed(1)} ${B.x.toFixed(1)},${B.y.toFixed(1)} ${C.x.toFixed(1)},${C.y.toFixed(1)}" fill="none" stroke="#0f172a" stroke-width="1.5"/>` +
                    `<line x1="${A.x.toFixed(1)}" y1="${A.y.toFixed(1)}" x2="${D.x.toFixed(1)}" y2="${D.y.toFixed(1)}" stroke="#0f172a" stroke-width="1.4"/>` +
                    `<line x1="${B.x.toFixed(1)}" y1="${B.y.toFixed(1)}" x2="${E.x.toFixed(1)}" y2="${E.y.toFixed(1)}" stroke="#0f172a" stroke-width="1.4"/>` +
                    `<line x1="${C.x.toFixed(1)}" y1="${C.y.toFixed(1)}" x2="${F.x.toFixed(1)}" y2="${F.y.toFixed(1)}" stroke="#0f172a" stroke-width="1.4"/>` +
                    `<circle cx="${A.x.toFixed(1)}" cy="${A.y.toFixed(1)}" r="2.4" fill="#0f172a"/>` +
                    `<text x="${lblA.x.toFixed(1)}" y="${lblA.y.toFixed(1)}" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="central">A</text>` +
                    `<circle cx="${B.x.toFixed(1)}" cy="${B.y.toFixed(1)}" r="2.4" fill="#0f172a"/>` +
                    `<text x="${lblB.x.toFixed(1)}" y="${lblB.y.toFixed(1)}" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="central">B</text>` +
                    `<circle cx="${C.x.toFixed(1)}" cy="${C.y.toFixed(1)}" r="2.4" fill="#0f172a"/>` +
                    `<text x="${lblC.x.toFixed(1)}" y="${lblC.y.toFixed(1)}" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="central">C</text>` +
                    `<circle cx="${D.x.toFixed(1)}" cy="${D.y.toFixed(1)}" r="2.3" fill="#0f172a"/>` +
                    `<text x="${lblD.x.toFixed(1)}" y="${lblD.y.toFixed(1)}" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="central">D</text>` +
                    `<circle cx="${E.x.toFixed(1)}" cy="${E.y.toFixed(1)}" r="2.3" fill="#0f172a"/>` +
                    `<text x="${lblE.x.toFixed(1)}" y="${lblE.y.toFixed(1)}" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="central">E</text>` +
                    `<circle cx="${F.x.toFixed(1)}" cy="${F.y.toFixed(1)}" r="2.3" fill="#0f172a"/>` +
                    `<text x="${lblF.x.toFixed(1)}" y="${lblF.y.toFixed(1)}" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="central">F</text>` +
                    `<circle cx="${P.x.toFixed(1)}" cy="${P.y.toFixed(1)}" r="2.1" fill="#0f172a"/>` +
                    '</svg></div>';

                const intro =
                    "図のように、△ABCの頂点A, B, Cから向かいの辺BC, CA, ABに引いた線分AD, BE, CFが1点で交わっている。<br>";

                let condText = "";
                let targetText = "";
                let subFormula = "";
                let ansText = "";

                if (askType === 0) {
                    condText = `AF : FB ＝ ${af} : ${fb}、BD : DC ＝ ${bd} : ${dc}`;
                    targetText = "CE : EA";
                    subFormula = `${frac(af, fb)} × ${frac(bd, dc)} × ${frac("CE", "EA")} ＝ 1`;
                    ansText = `CE : EA ＝ ${ce} : ${ea}`;
                } else if (askType === 1) {
                    condText = `AF : FB ＝ ${af} : ${fb}、CE : EA ＝ ${ce} : ${ea}`;
                    targetText = "BD : DC";
                    subFormula = `${frac(af, fb)} × ${frac("BD", "DC")} × ${frac(ce, ea)} ＝ 1`;
                    ansText = `BD : DC ＝ ${bd} : ${dc}`;
                } else {
                    condText = `BD : DC ＝ ${bd} : ${dc}、CE : EA ＝ ${ce} : ${ea}`;
                    targetText = "AF : FB";
                    subFormula = `${frac("AF", "FB")} × ${frac(bd, dc)} × ${frac(ce, ea)} ＝ 1`;
                    ansText = `AF : FB ＝ ${af} : ${fb}`;
                }

                const problem =
                    intro +
                    `${condText} のとき、<strong>${targetText}</strong> を求めなさい。` +
                    svgProblem;

                const explanation =
                    `チェバの定理より：<br>` +
                    '<div style="text-align:center; margin: 8px 0;">' +
                    `${frac("AF", "FB")} × ${frac("BD", "DC")} × ${frac("CE", "EA")} ＝ 1` +
                    '</div>' +
                    '<div style="text-align:center; margin: 8px 0;">' +
                    subFormula +
                    '</div>';

                return {
                    problem,
                    answer: ansText,
                    explanation
                };
            }
        },
"中点連結定理": {
    level: "公立",
    formula: `
        <div>三角形において以下の条件を満たす<strong>中点連結定理</strong>が成立する。</div>
        <ul style="margin: 6px 0 10px 18px; padding: 0;">
            <li>① 2辺に中点があり、中点同士を結ぶ線分がある</li>
            <li>② 中点から平行線が引かれている</li>
        </ul>
        <div style="font-weight: bold; color: #1e40af; margin-bottom: 10px;">3等分されているときは2個ずつ考えよう！</div>

        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
            <div><strong>【図形1】</strong>不等辺三角形 $\\triangle \\mathrm{ABC}$ があり、辺 $\\mathrm{AB}$ と辺 $\\mathrm{AC}$ 上に中点があり、それぞれ $\\mathrm{D}$、$\\mathrm{E}$ とする。</div>
            <div style="margin: 8px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
                <svg viewBox="0 0 260 150" width="240" height="140" style="max-width: 100%; height: auto;">
                    <polygon points="95,18 30,126 225,126" fill="#f8fafc" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
                    <line x1="62.5" y1="72" x2="160" y2="72" stroke="#2563eb" stroke-width="2.2"/>
                    <circle cx="62.5" cy="72" r="3.5" fill="#2563eb"/>
                    <circle cx="160" cy="72" r="3.5" fill="#2563eb"/>
                    <text x="95" y="13" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">A</text>
                    <text x="20" y="136" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">B</text>
                    <text x="235" y="136" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">C</text>
                    <text x="48" y="75" font-size="13" font-weight="bold" text-anchor="end" fill="#2563eb">D</text>
                    <text x="174" y="75" font-size="13" font-weight="bold" text-anchor="start" fill="#2563eb">E</text>
                </svg>
            </div>
            <div style="margin-top: 4px;">
                <strong>【中点連結定理】</strong><br>
                ・DE／／BC<br>
                ・$$\\mathrm{DE} = \\frac{1}{2}\\mathrm{BC}$$
            </div>
        </div>

        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
            <div><strong>【図形2】</strong>台形 $\\mathrm{ABCD}$（AD／／BC）があり、辺 $\\mathrm{AB}$ と辺 $\\mathrm{CD}$ 上に中点 $\\mathrm{E}$、$\\mathrm{F}$ がある。</div>
            <div style="margin: 8px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
                <svg viewBox="0 0 260 150" width="240" height="140" style="max-width: 100%; height: auto;">
                    <polygon points="75,24 185,24 232,124 28,124" fill="#f8fafc" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
                    <line x1="51.5" y1="74" x2="208.5" y2="74" stroke="#059669" stroke-width="2.2"/>
                    <circle cx="51.5" cy="74" r="3.5" fill="#059669"/>
                    <circle cx="208.5" cy="74" r="3.5" fill="#059669"/>
                    <text x="75" y="17" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">A</text>
                    <text x="185" y="17" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">D</text>
                    <text x="20" y="136" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">B</text>
                    <text x="240" y="136" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">C</text>
                    <text x="38" y="78" font-size="13" font-weight="bold" text-anchor="end" fill="#059669">E</text>
                    <text x="222" y="78" font-size="13" font-weight="bold" text-anchor="start" fill="#059669">F</text>
                </svg>
            </div>
            <div style="margin-top: 4px;">
                <strong>【中点連結定理】</strong><br>
                ・AD／／EF／／BC<br>
                ・$$\\mathrm{EF} = \\frac{\\mathrm{AD} + \\mathrm{BC}}{2}$$
            </div>
        </div>
    `,
    selfCheck: [
        "三角形の中点連結定理で、底辺の「2倍」と「2分の1（半分）」を取り違えていないか？（中点同士を結ぶ線分は底辺の $\\frac{1}{2}$）",
        "台形の中点連結線分 $\\mathrm{EF}$ を求めるとき、上底と下底の「和の半分」になっているか？（$\\frac{\\mathrm{AD}+\\mathrm{BC}}{2}$）",
        "3等分点がある図形で、中点になる2個分の組み合わせ（$\\mathrm{E}$ は $\\mathrm{AF}$ の中点など）を見つけて適用できているか？",
        "交点 $\\mathrm{Q}$ 周辺の相似な三角形（$\\triangle \\mathrm{QPE} \\sim \\triangle \\mathrm{QCF}$ など）の対応する辺の比を正しく取れているか？"
    ],
    generateRandom: function () {
        const CX = 160;
        const CY = 130;
        const getRandomAngle = () => Math.floor(Math.random() * 360);

        const rotatePoint = (x, y, angleDeg) => {
            const rad = (angleDeg * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const dx = x - CX;
            const dy = y - CY;
            return {
                x: Number((CX + dx * cos - dy * sin).toFixed(2)),
                y: Number((CY + dx * sin + dy * cos).toFixed(2))
            };
        };

        const normalLabel = (x, y, angleDeg, text, opts = {}) => {
            const pt = rotatePoint(x, y, angleDeg);
            const fill = opts.fill || "#0f172a";
            const anchor = opts.anchor || "middle";
            const fontSize = opts.fontSize || 13;
            return `<text x="${pt.x}" y="${pt.y}" font-size="${fontSize}" font-weight="bold" text-anchor="${anchor}" dominant-baseline="central" fill="${fill}">${text}</text>`;
        };

        const computeDynamicViewBox = (basePoints, angleDeg, pad = 22) => {
            const rotated = basePoints.map(([x, y]) => rotatePoint(x, y, angleDeg));
            let minX = Infinity;
            let maxX = -Infinity;
            let minY = Infinity;
            let maxY = -Infinity;
            rotated.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            });
            const x = Math.floor(minX - pad);
            const y = Math.floor(minY - pad);
            const w = Math.ceil((maxX - minX) + pad * 2);
            const h = Math.ceil((maxY - minY) + pad * 2);
            return `${x} ${y} ${w} ${h}`;
        };

        // 線分上の点 (mx, my) を通り、線分方向 (dx, dy) に垂直な等長マークを生成
        const buildSegmentTicks = (x1, y1, x2, y2, ratio, count, halfLen = 5, gap = 3.5) => {
            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.hypot(dx, dy) || 1;
            const tx = dx / len;
            const ty = dy / len;
            // 法線ベクトル
            const nx = -ty;
            const ny = tx;

            const mx = x1 + dx * ratio;
            const my = y1 + dy * ratio;

            const lines = [];
            for (let i = 0; i < count; i++) {
                const shift = (i - (count - 1) / 2) * gap;
                const cx = mx + tx * shift;
                const cy = my + ty * shift;
                const sx = (cx - nx * halfLen).toFixed(2);
                const sy = (cy - ny * halfLen).toFixed(2);
                const ex = (cx + nx * halfLen).toFixed(2);
                const ey = (cy + ny * halfLen).toFixed(2);
                lines.push(`<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="#475569" stroke-width="1.5"/>`);
            }
            return lines.join("");
        };

        const buildTriangleProblemSvg = (deLabel, bcLabel, deIsTarget) => {
            const angle = getRandomAngle();
            const viewBox = computeDynamicViewBox([
                [120, 34], [38, 182], [276, 182], [70, 105], [208, 105]
            ], angle, 20);
            return `
                <div style="margin: 10px 0 4px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
                    <svg viewBox="${viewBox}" style="width: 100%; max-width: 300px; height: auto;">
                        <g transform="rotate(${angle} ${CX} ${CY})">
                            <polygon points="120,48 52,162 262,162" fill="#f8fafc" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
                            <line x1="86" y1="105" x2="191" y2="105" stroke="${deIsTarget ? '#dc2626' : '#2563eb'}" stroke-width="2.2"/>
                            <circle cx="86" cy="105" r="3.5" fill="#2563eb"/>
                            <circle cx="191" cy="105" r="3.5" fill="#2563eb"/>
                            ${buildSegmentTicks(120, 48, 52, 162, 0.25, 1)}
                            ${buildSegmentTicks(120, 48, 52, 162, 0.75, 1)}
                            ${buildSegmentTicks(120, 48, 262, 162, 0.25, 2)}
                            ${buildSegmentTicks(120, 48, 262, 162, 0.75, 2)}
                        </g>
                        ${normalLabel(120, 36, angle, "A", { fill: "#0f172a", anchor: "middle" })}
                        ${normalLabel(40, 172, angle, "B", { fill: "#0f172a", anchor: "middle" })}
                        ${normalLabel(274, 172, angle, "C", { fill: "#0f172a", anchor: "middle" })}
                        ${normalLabel(71, 105, angle, "D", { fill: "#2563eb", anchor: "end" })}
                        ${normalLabel(206, 105, angle, "E", { fill: "#2563eb", anchor: "start" })}
                        ${normalLabel(138.5, 93, angle, deLabel, { fill: deIsTarget ? "#dc2626" : "#1e40af", anchor: "middle" })}
                        ${normalLabel(157, 178, angle, bcLabel, { fill: !deIsTarget ? "#dc2626" : "#0f172a", anchor: "middle" })}
                    </svg>
                </div>
            `;
        };

        const buildTrapezoidProblemSvg = (adLabel, efLabel, bcLabel, efIsTarget) => {
            const angle = getRandomAngle();
            const viewBox = computeDynamicViewBox([
                [90, 44], [230, 44], [40, 182], [280, 182], [62, 110], [258, 110]
            ], angle, 20);
            return `
                <div style="margin: 10px 0 4px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
                    <svg viewBox="${viewBox}" style="width: 100%; max-width: 300px; height: auto;">
                        <g transform="rotate(${angle} ${CX} ${CY})">
                            <polygon points="102,58 218,58 266,162 54,162" fill="#f8fafc" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
                            <line x1="78" y1="110" x2="242" y2="110" stroke="${efIsTarget ? '#dc2626' : '#059669'}" stroke-width="2.2"/>
                            <circle cx="78" cy="110" r="3.5" fill="#059669"/>
                            <circle cx="242" cy="110" r="3.5" fill="#059669"/>
                            ${buildSegmentTicks(102, 58, 54, 162, 0.25, 1)}
                            ${buildSegmentTicks(102, 58, 54, 162, 0.75, 1)}
                            ${buildSegmentTicks(218, 58, 266, 162, 0.25, 2)}
                            ${buildSegmentTicks(218, 58, 266, 162, 0.75, 2)}
                        </g>
                        ${normalLabel(92, 46, angle, "A", { fill: "#0f172a", anchor: "end" })}
                        ${normalLabel(228, 46, angle, "D", { fill: "#0f172a", anchor: "start" })}
                        ${normalLabel(42, 174, angle, "B", { fill: "#0f172a", anchor: "middle" })}
                        ${normalLabel(278, 174, angle, "C", { fill: "#0f172a", anchor: "middle" })}
                        ${normalLabel(63, 110, angle, "E", { fill: "#059669", anchor: "end" })}
                        ${normalLabel(257, 110, angle, "F", { fill: "#059669", anchor: "start" })}
                        ${normalLabel(160, 44, angle, adLabel, { fill: "#0f172a", anchor: "middle" })}
                        ${normalLabel(160, 98, angle, efLabel, { fill: efIsTarget ? "#dc2626" : "#047857", anchor: "middle" })}
                        ${normalLabel(160, 179, angle, bcLabel, { fill: "#0f172a", anchor: "middle" })}
                    </svg>
                </div>
            `;
        };

        const buildTrisectPcProblemSvg = () => {
            const angle = getRandomAngle();
            const viewBox = computeDynamicViewBox([
                [120, 32], [36, 183], [280, 183], [68, 109], [169, 73], [233, 130], [175, 158]
            ], angle, 24);
            return `
                <div style="margin: 10px 0 4px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
                    <svg viewBox="${viewBox}" style="width: 100%; max-width: 300px; height: auto;">
                        <g transform="rotate(${angle} ${CX} ${CY})">
                            <polygon points="120,46 50,172 266,172" fill="#f8fafc" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
                            <line x1="50" y1="172" x2="217.3" y2="130" stroke="#0f172a" stroke-width="1.8"/>
                            <line x1="85" y1="109" x2="266" y2="172" stroke="#2563eb" stroke-width="1.8"/>
                            <line x1="85" y1="109" x2="168.7" y2="88" stroke="#059669" stroke-width="2.2"/>
                            <circle cx="175.5" cy="140.5" r="3.8" fill="#dc2626"/>
                            <circle cx="85" cy="109" r="3.5" fill="#2563eb"/>
                            <circle cx="168.7" cy="88" r="3.5" fill="#059669"/>
                            <circle cx="217.3" cy="130" r="3.2" fill="#475569"/>
                            <!-- AB中点等長記号（AP・PB の各中点上に正確に配置） -->
                            ${buildSegmentTicks(120, 46, 50, 172, 0.25, 1)}
                            ${buildSegmentTicks(120, 46, 50, 172, 0.75, 1)}
                            <!-- AC3等分（AE = EF = FC）の等長記号：各2本線を各中点上に正確に配置 -->
                            ${buildSegmentTicks(120, 46, 266, 172, 1 / 6, 2)}
                            ${buildSegmentTicks(120, 46, 266, 172, 3 / 6, 2)}
                            ${buildSegmentTicks(120, 46, 266, 172, 5 / 6, 2)}
                        </g>
                        ${normalLabel(120, 34, angle, "A", { fill: "#0f172a", anchor: "middle" })}
                        ${normalLabel(38, 181, angle, "B", { fill: "#0f172a", anchor: "middle" })}
                        ${normalLabel(278, 181, angle, "C", { fill: "#0f172a", anchor: "middle" })}
                        ${normalLabel(70, 109, angle, "P", { fill: "#2563eb", anchor: "end" })}
                        ${normalLabel(169, 75, angle, "E", { fill: "#059669", anchor: "middle" })}
                        ${normalLabel(231, 130, angle, "F", { fill: "#475569", anchor: "start" })}
                        ${normalLabel(175, 156, angle, "Q", { fill: "#dc2626", anchor: "middle" })}
                    </svg>
                </div>
            `;
        };

        const patterns = [
            () => {
                const de = (Math.floor(Math.random() * 6) + 3) * 2;
                const bc = de * 2;
                return {
                    problem: `
                        <div>下の図で、辺 $\\mathrm{AB}$、$\\mathrm{AC}$ の中点をそれぞれ $\\mathrm{D}$、$\\mathrm{E}$ とするとき、$x$ の値を求めなさい。</div>
                        ${buildTriangleProblemSvg(`${de} cm`, `x cm`, false)}
                    `,
                    answer: `$x = ${bc}$`,
                    explanation: `
                        $\\triangle \\mathrm{ABC}$ で $\\mathrm{D}$、$\\mathrm{E}$ はそれぞれ $\\mathrm{AB}$、$\\mathrm{AC}$ の中点なので、中点連結定理より<br>
                        $$\\mathrm{DE} = \\frac{1}{2}\\mathrm{BC}$$<br>
                        よって $x = 2 \\times ${de} = ${bc}$ です。<br>
                        <strong>$x = ${bc}$</strong>
                    `
                };
            },
            () => {
                const de = Math.floor(Math.random() * 8) + 4;
                const bc = de * 2;
                return {
                    problem: `
                        <div>下の図で、辺 $\\mathrm{AB}$、$\\mathrm{AC}$ の中点をそれぞれ $\\mathrm{D}$、$\\mathrm{E}$ とするとき、$x$ の値を求めなさい。</div>
                        ${buildTriangleProblemSvg(`x cm`, `${bc} cm`, true)}
                    `,
                    answer: `$x = ${de}$`,
                    explanation: `
                        中点連結定理より $\\mathrm{DE} = \\frac{1}{2}\\mathrm{BC}$ なので、<br>
                        $$x = \\frac{1}{2} \\times ${bc} = ${de}$$<br>
                        <strong>$x = ${de}$</strong>
                    `
                };
            },
            () => {
                const ad = (Math.floor(Math.random() * 5) + 2) * 2;
                const bc = ad + (Math.floor(Math.random() * 4) + 2) * 2;
                const ef = (ad + bc) / 2;
                return {
                    problem: `
                        <div>下の台形 $\\mathrm{ABCD}$（AD／／BC）で、辺 $\\mathrm{AB}$、$\\mathrm{CD}$ の中点をそれぞれ $\\mathrm{E}$、$\\mathrm{F}$ とするとき、$x$ の値を求めなさい。</div>
                        ${buildTrapezoidProblemSvg(`${ad} cm`, `x cm`, `${bc} cm`, true)}
                    `,
                    answer: `$x = ${ef}$`,
                    explanation: `
                        台形の中点連結定理より、$\\mathrm{EF}$ は $\\mathrm{AD}$ と $\\mathrm{BC}$ の平均（和の半分）になる。<br>
                        $$x = \\frac{${ad} + ${bc}}{2} = ${ef}$$<br>
                        <strong>$x = ${ef}$</strong>
                    `
                };
            },
            () => {
                const qf = Math.floor(Math.random() * 4) + 2;
                const bq = qf * 3;
                const bf = qf + bq;
                return {
                    problem: `
                        <div>下の不等辺三角形 $\\triangle \\mathrm{ABC}$ で、点 $\\mathrm{P}$ は辺 $\\mathrm{AB}$ の中点、点 $\\mathrm{E}$、$\\mathrm{F}$ は辺 $\\mathrm{AC}$ を3等分する点（$\\mathrm{AE}=\\mathrm{EF}=\\mathrm{FC}$）である。$\\mathrm{PC}$ と $\\mathrm{BF}$ の交点を $\\mathrm{Q}$ とし、$\\mathrm{BF} = ${bf}\\text{ cm}$ のとき、$\\mathrm{BQ}$ の長さ $x$ を求めなさい。</div>
                        ${buildTrisectPcProblemSvg()}
                    `,
                    answer: `$x = ${bq}$`,
                    explanation: `
                        $\\triangle \\mathrm{ABF}$ で $\\mathrm{P}$ は $\\mathrm{AB}$ の中点、$\\mathrm{E}$ は $\\mathrm{AF}$ の中点なので、中点連結定理より $\\mathrm{PE} = \\frac{1}{2}\\mathrm{BF}$ かつ PE／／FC。<br>
                        $\\triangle \\mathrm{QPE} \\sim \\triangle \\mathrm{QCF}$ であり、$\\mathrm{PE} = \\frac{1}{2}\\mathrm{BF}$ かつ $\\mathrm{FC} = \\frac{1}{3}\\mathrm{AC}$ より、比を整理すると $\\mathrm{BQ} : \\mathrm{QF} = 3 : 1$ となる。<br>
                        よって $x = \\mathrm{BQ} = \\frac{3}{4}\\mathrm{BF} = \\frac{3}{4} \\times ${bf} = ${bq}$ です。<br>
                        <strong>$x = ${bq}$</strong>
                    `
                };
            },
            () => {
                return {
                    problem: `
                        <div>下の不等辺三角形 $\\triangle \\mathrm{ABC}$ で、点 $\\mathrm{P}$ は辺 $\\mathrm{AB}$ の中点、点 $\\mathrm{E}$、$\\mathrm{F}$ は辺 $\\mathrm{AC}$ を3等分する点（$\\mathrm{AE}=\\mathrm{EF}=\\mathrm{FC}$）である。$\\mathrm{PC}$ と $\\mathrm{BF}$ の交点を $\\mathrm{Q}$ とするとき、線分の比 $\\mathrm{PE} : \\mathrm{BQ}$ を最も簡単な整数の比で表しなさい。</div>
                        ${buildTrisectPcProblemSvg()}
                    `,
                    answer: `$\\mathrm{PE} : \\mathrm{BQ} = 2 : 3$`,
                    explanation: `
                        $\\triangle \\mathrm{ABF}$ において $\\mathrm{P}$ は $\\mathrm{AB}$ の中点、$\\mathrm{E}$ は $\\mathrm{AF}$ の中点なので、中点連結定理より $\\mathrm{PE} = \\frac{1}{2}\\mathrm{BF}$。<br>
                        また、PE／／FC より $\\triangle \\mathrm{QPE} \\sim \\triangle \\mathrm{QCF}$ で、$\\mathrm{BQ} : \\mathrm{QF} = 3 : 1$ なので $\\mathrm{BQ} = \\frac{3}{4}\\mathrm{BF}$。<br>
                        したがって $\\mathrm{PE} : \\mathrm{BQ} = \\frac{1}{2}\\mathrm{BF} : \\frac{3}{4}\\mathrm{BF} = 2 : 3$ です。<br>
                        <strong>$\\mathrm{PE} : \\mathrm{BQ} = 2 : 3$</strong>
                    `
                };
            }
        ];

        const pick = patterns[Math.floor(Math.random() * patterns.length)];
        return pick();
    }
},
// formulaData["平面図形"] の中に以下の単元を追加してください
"三角形の重心": {
    level: "公立",
    formula: `
        <div>三角形の1つの頂点から反対の辺の中点を結ぶ線分を<strong>中線</strong>と呼ぶ。中線同士の交点は1点で交わり、その点を<strong>重心</strong>という。</div>

        <div style="margin: 10px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
            <svg viewBox="0 0 280 175" width="260" height="162" style="max-width: 100%; height: auto;">
                <!-- △AGE を薄く赤く塗る -->
                <polygon points="105,22 127,106 174.5,85" fill="#fecaca" fill-opacity="0.7" stroke="none"/>
                <!-- 外枠 △ABC -->
                <polygon points="105,22 32,148 244,148" fill="none" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
                <!-- 3本の中線 AD, BE, CF -->
                <line x1="105" y1="22" x2="138" y2="148" stroke="#2563eb" stroke-width="1.8"/>
                <line x1="32" y1="148" x2="174.5" y2="85" stroke="#2563eb" stroke-width="1.8"/>
                <line x1="244" y1="148" x2="68.5" y2="85" stroke="#2563eb" stroke-width="1.8"/>
                <!-- 中点 D, E, F -->
                <circle cx="138" cy="148" r="3.2" fill="#0f172a"/>
                <circle cx="174.5" cy="85" r="3.2" fill="#0f172a"/>
                <circle cx="68.5" cy="85" r="3.2" fill="#0f172a"/>
                <!-- 重心 G -->
                <circle cx="127" cy="106" r="4" fill="#dc2626"/>
                <!-- 頂点・中点・重心ラベル -->
                <text x="105" y="14" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">A</text>
                <text x="21" y="156" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">B</text>
                <text x="255" y="156" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">C</text>
                <text x="138" y="163" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">D</text>
                <text x="186" y="83" font-size="13" font-weight="bold" text-anchor="start" fill="#0f172a">E</text>
                <text x="56" y="83" font-size="13" font-weight="bold" text-anchor="end" fill="#0f172a">F</text>
                <text x="115" y="114" font-size="13" font-weight="bold" text-anchor="end" fill="#dc2626">G</text>
            </svg>
        </div>

        <div style="margin-top: 6px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
            <div><strong>【重心の性質】</strong></div>
            <div style="margin-top: 4px;">
                <strong>① 重心 $\\mathrm{G}$ は中線を $2 : 1$ に内分する。</strong><br>
                $$\\mathrm{AG} : \\mathrm{GD} = \\mathrm{BG} : \\mathrm{GE} = \\mathrm{CG} : \\mathrm{GF} = 2 : 1$$
            </div>
            <div style="margin-top: 4px;">
                <strong>② 6つに分けた三角形は面積が全て等しい。</strong><br>
                $$\\triangle \\mathrm{AGE} = \\frac{1}{6}\\triangle \\mathrm{ABC}$$
            </div>
            <div style="margin-top: 8px; font-weight: bold; color: #1e40af;">
                ※問題の中に中点があったら重心が使えるかもしれない。
            </div>
        </div>
    `,
    selfCheck: [
        "重心 $\\mathrm{G}$ が中線を分ける比 $2 : 1$ について、「頂点側が $2$、辺（中点）側が $1$」を逆にしていないか？（例：$\\mathrm{CG}$ は中線 $\\mathrm{CF}$ 全体の $\\frac{2}{3}$）",
        "中点 $\\mathrm{D}$ が辺 $\\mathrm{AB}$ の中点であることから、$\\mathrm{AD} = \\frac{1}{2}\\mathrm{AB}$ と正しく半分にできているか？",
        "面積比を求めるとき、重心と3つの中線で分けられた6個の小三角形の面積がすべて等しい（各 $\\frac{1}{6}\\triangle \\mathrm{ABC}$）ことを使えているか？（$\\triangle \\mathrm{GBD}$ は $1$ 個分、$\\triangle \\mathrm{ACD}$ は $3$ 個分なので $1 : 3$）"
    ],
    generateRandom: function () {
        const CX = 160;
        const CY = 130;
        const getRandomAngle = () => Math.floor(Math.random() * 360);

        const rotatePoint = (x, y, angleDeg) => {
            const rad = (angleDeg * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const dx = x - CX;
            const dy = y - CY;
            return {
                x: Number((CX + dx * cos - dy * sin).toFixed(2)),
                y: Number((CY + dx * sin + dy * cos).toFixed(2))
            };
        };

        const normalLabel = (x, y, angleDeg, text, opts = {}) => {
            const pt = rotatePoint(x, y, angleDeg);
            const fill = opts.fill || "#0f172a";
            const anchor = opts.anchor || "middle";
            const fontSize = opts.fontSize || 13;
            return `<text x="${pt.x}" y="${pt.y}" font-size="${fontSize}" font-weight="bold" text-anchor="${anchor}" dominant-baseline="central" fill="${fill}">${text}</text>`;
        };

        const computeDynamicViewBox = (basePoints, angleDeg, pad = 22) => {
            const rotated = basePoints.map(([x, y]) => rotatePoint(x, y, angleDeg));
            let minX = Infinity;
            let maxX = -Infinity;
            let minY = Infinity;
            let maxY = -Infinity;
            rotated.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            });
            const x = Math.floor(minX - pad);
            const y = Math.floor(minY - pad);
            const w = Math.ceil((maxX - minX) + pad * 2);
            const h = Math.ceil((maxY - minY) + pad * 2);
            return `${x} ${y} ${w} ${h}`;
        };

        const buildSegmentTicks = (x1, y1, x2, y2, ratio, count, halfLen = 5, gap = 3.5) => {
            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.hypot(dx, dy) || 1;
            const tx = dx / len;
            const ty = dy / len;
            const nx = -ty;
            const ny = tx;

            const mx = x1 + dx * ratio;
            const my = y1 + dy * ratio;

            const lines = [];
            for (let i = 0; i < count; i++) {
                const shift = (i - (count - 1) / 2) * gap;
                const cx = mx + tx * shift;
                const cy = my + ty * shift;
                const sx = (cx - nx * halfLen).toFixed(2);
                const sy = (cy - ny * halfLen).toFixed(2);
                const ex = (cx + nx * halfLen).toFixed(2);
                const ey = (cy + ny * halfLen).toFixed(2);
                lines.push(`<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="#475569" stroke-width="1.5"/>`);
            }
            return lines.join("");
        };

        const buildCentroidProblemSvg = () => {
            const angle = getRandomAngle();
            const viewBox = computeDynamicViewBox([
                [105, 22], [32, 174], [274, 174], [61, 96], [153, 180], [143, 108]
            ], angle, 22);

            return `
                <div style="margin: 10px 0 4px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
                    <svg viewBox="${viewBox}" style="width: 100%; max-width: 300px; height: auto;">
                        <g transform="rotate(${angle} ${CX} ${CY})">
                            <polygon points="105,34 44,166 262,166" fill="#f8fafc" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
                            <line x1="262" y1="166" x2="74.5" y2="100" stroke="#2563eb" stroke-width="1.9"/>
                            <line x1="105" y1="34" x2="153" y2="166" stroke="#64748b" stroke-width="1.6" stroke-dasharray="4,3"/>
                            <line x1="137" y1="122" x2="44" y2="166" stroke="#059669" stroke-width="1.6" stroke-dasharray="4,3"/>
                            ${buildSegmentTicks(105, 34, 44, 166, 0.25, 1)}
                            ${buildSegmentTicks(105, 34, 44, 166, 0.75, 1)}
                            ${buildSegmentTicks(44, 166, 262, 166, 0.25, 2)}
                            ${buildSegmentTicks(44, 166, 262, 166, 0.75, 2)}
                            <circle cx="74.5" cy="100" r="3.4" fill="#2563eb"/>
                            <circle cx="153" cy="166" r="3.2" fill="#475569"/>
                            <circle cx="137" cy="122" r="4" fill="#dc2626"/>
                        </g>
                        ${normalLabel(105, 22, angle, "A", { fill: "#0f172a", anchor: "middle" })}
                        ${normalLabel(32, 174, angle, "B", { fill: "#0f172a", anchor: "middle" })}
                        ${normalLabel(274, 174, angle, "C", { fill: "#0f172a", anchor: "middle" })}
                        ${normalLabel(61, 96, angle, "D", { fill: "#2563eb", anchor: "end" })}
                        ${normalLabel(153, 180, angle, "E", { fill: "#475569", anchor: "middle" })}
                        ${normalLabel(143, 108, angle, "G", { fill: "#dc2626", anchor: "start" })}
                    </svg>
                </div>
            `;
        };

        const cases = [
            { ab: 8, cd: 7 },
            { ab: 10, cd: 9 },
            { ab: 12, cd: 8 },
            { ab: 6, cd: 10 },
            { ab: 14, cd: 11 }
        ];

        const chosen = cases[Math.floor(Math.random() * cases.length)];
        const ab = chosen.ab;
        const cd = chosen.cd;
        const ad = ab / 2;
        const cgNum = cd * 2;
        const cgText = (cgNum % 3 === 0) ? `${cgNum / 3}` : `\\frac{${cgNum}}{3}`;

        return {
            problem: `
                <div>$\\triangle \\mathrm{ABC}$ において，$\\mathrm{AB}=${ab}$，$\\mathrm{CD}=${cd}$，$\\mathrm{G}$ が重心であるとき，次の問いに答えなさい。</div>
                <div style="margin-top: 4px;">
                    (1) 次の線分の長さを求めなさい。<br>
                    ① $\\mathrm{AD}$　　② $\\mathrm{CG}$<br>
                    (2) 面積の比 $\\triangle \\mathrm{GBD} : \\triangle \\mathrm{ACD}$ を最も簡単な整数の比で表しなさい。
                </div>
                ${buildCentroidProblemSvg()}
            `,
            answer: `(1) ① $\\mathrm{AD} = ${ad}$　② $\\mathrm{CG} = ${cgText}$　　(2) $\\triangle \\mathrm{GBD} : \\triangle \\mathrm{ACD} = 1 : 3$`,
            explanation: `
                <strong>(1)</strong><br>
                ① $\\mathrm{G}$ は $\\triangle \\mathrm{ABC}$ の重心なので，中線 $\\mathrm{CD}$ と辺 $\\mathrm{AB}$ の交点 $\\mathrm{D}$ は $\\mathrm{AB}$ の中点である。<br>
                よって $$\\mathrm{AD} = \\frac{1}{2}\\mathrm{AB} = \\frac{1}{2} \\times ${ab} = ${ad}$$<br>
                ② 重心 $\\mathrm{G}$ は中線 $\\mathrm{CD}$ を $2 : 1$ に内分するので，$\\mathrm{CG} : \\mathrm{GD} = 2 : 1$ より $\\mathrm{CG} = \\frac{2}{3}\\mathrm{CD}$。<br>
                よって $$\\mathrm{CG} = \\frac{2}{3} \\times ${cd} = ${cgText}$$<br><br>
                <strong>(2)</strong><br>
                重心と3つの中線によって分けられる6つの三角形の面積はすべて等しく，それぞれ $\\frac{1}{6}\\triangle \\mathrm{ABC}$ である。<br>
                ・$\\triangle \\mathrm{GBD}$ はそのうちの $1$ つ分なので $\\triangle \\mathrm{GBD} = \\frac{1}{6}\\triangle \\mathrm{ABC}$<br>
                ・$\\triangle \\mathrm{ACD}$ は $\\triangle \\mathrm{ABC}$ の半分（$3$ つ分）なので $\\triangle \\mathrm{ACD} = \\frac{3}{6}\\triangle \\mathrm{ABC} = \\frac{1}{2}\\triangle \\mathrm{ABC}$<br>
                したがって $$\\triangle \\mathrm{GBD} : \\triangle \\mathrm{ACD} = \\frac{1}{6} : \\frac{3}{6} = 1 : 3$$<br>
                <strong>答え：(1) ① $${ad}$　② $${cgText}$　(2) $1 : 3$</strong>
            `
        };
    }
},
"三角形の垂心": {
    level: "難関私立",
    formula: `
        <div>三角形の頂点から引いた垂線は1点で交わり、その交点を<strong>垂心(点G)</strong>という。<br>
        垂心があると<strong>パッタンパターンの相似</strong>ができるので長さや面積比を求めることができる。</div>

        <div style="margin: 10px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
            <svg viewBox="0 0 280 184" width="280" height="184" style="max-width: 100%; height: auto;">
                <!-- 垂心 G が少し下に来る三角形: A(95,22), B(35,154), C(245,154) -->
                <!-- D(95,154), E(126.65,49.85), F(70.96,74.89), G(95,85.82) -->
                <polygon points="95,22 35,154 245,154" fill="#f8fafc" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
                <!-- 垂線 AD, BE, CF -->
                <line x1="95" y1="22" x2="95" y2="154" stroke="#2563eb" stroke-width="1.8"/>
                <line x1="35" y1="154" x2="126.65" y2="49.85" stroke="#2563eb" stroke-width="1.8"/>
                <line x1="245" y1="154" x2="70.96" y2="74.89" stroke="#2563eb" stroke-width="1.8"/>
                <!-- 直角マーク D, E, F -->
                <polyline points="95,145.5 103.5,145.5 103.5,154" fill="none" stroke="#0f172a" stroke-width="1.3"/>
                <polyline points="121.03,56.23 127.41,61.85 133.03,55.47" fill="none" stroke="#0f172a" stroke-width="1.3"/>
                <polyline points="67.44,82.63 75.18,86.15 78.70,78.41" fill="none" stroke="#0f172a" stroke-width="1.3"/>

                <!-- 等角マーク ○（角の二等分線上にフィット配置） -->
                <!-- ∠AGE 付近 -->
                <circle cx="99.1" cy="75.1" r="2.3" fill="none" stroke="#dc2626" stroke-width="1.35"/>
                <!-- ∠BGD 付近 -->
                <circle cx="90.9" cy="96.6" r="2.3" fill="none" stroke="#dc2626" stroke-width="1.35"/>
                <!-- ∠BAD 付近 -->
                <circle cx="92.3" cy="34.7" r="2.3" fill="none" stroke="#dc2626" stroke-width="1.35"/>
                <!-- ∠BCG 付近（左へ移動して角の内側にフィット） -->
                <circle cx="224.5" cy="148.0" r="2.3" fill="none" stroke="#dc2626" stroke-width="1.35"/>

                <!-- 等角マーク ×（角の二等分線上にフィット配置） -->
                <!-- ∠AGF 付近 -->
                <g stroke="#2563eb" stroke-width="1.35">
                    <line x1="87.0" y1="74.4" x2="90.6" y2="78.0"/>
                    <line x1="90.6" y1="74.4" x2="87.0" y2="78.0"/>
                </g>
                <!-- ∠CGD 付近 -->
                <g stroke="#2563eb" stroke-width="1.35">
                    <line x1="105.0" y1="99.4" x2="108.6" y2="103.0"/>
                    <line x1="108.6" y1="99.4" x2="105.0" y2="103.0"/>
                </g>
                <!-- ∠ABD 付近 -->
                <g stroke="#2563eb" stroke-width="1.35">
                    <line x1="45.8" y1="144.1" x2="49.4" y2="147.7"/>
                    <line x1="49.4" y1="144.1" x2="45.8" y2="147.7"/>
                </g>
                <!-- ∠ACF 付近 -->
                <g stroke="#2563eb" stroke-width="1.35">
                    <line x1="224.7" y1="140.3" x2="228.3" y2="143.9"/>
                    <line x1="228.3" y1="140.3" x2="224.7" y2="143.9"/>
                </g>

                <!-- 垂線の足 D, E, F -->
                <circle cx="95" cy="154" r="3" fill="#0f172a"/>
                <circle cx="126.65" cy="49.85" r="3" fill="#0f172a"/>
                <circle cx="70.96" cy="74.89" r="3" fill="#0f172a"/>
                <!-- 垂心 G -->
                <circle cx="95" cy="85.82" r="4" fill="#dc2626"/>
                <!-- ラベル -->
                <text x="95" y="12" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">A</text>
                <text x="24" y="164" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">B</text>
                <text x="256" y="164" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">C</text>
                <text x="95" y="170" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">D</text>
                <text x="136" y="45" font-size="13" font-weight="bold" text-anchor="start" fill="#0f172a">E</text>
                <text x="60" y="72" font-size="13" font-weight="bold" text-anchor="end" fill="#0f172a">F</text>
                <text x="104" y="101" font-size="13" font-weight="bold" text-anchor="start" fill="#dc2626">G</text>
            </svg>
        </div>

        <div style="margin-top: 6px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
            <div><strong>【垂心と相似のポイント】</strong></div>
            <div style="margin-top: 4px;">
                ・3本の垂線が交わる点（垂心 $\\mathrm{G}$）の周りには、直角三角形どうしの相似（パッタンパターンの相似）がいくつも生まれる。<br>
                ・たとえば $\\triangle \\mathrm{BDG} \\sim \\triangle \\mathrm{ADC}$ や $\\triangle \\mathrm{AEG} \\sim \\triangle \\mathrm{ADC}$ などを利用して、線分の長さや面積比を求める。
            </div>
        </div>
    `,
    selfCheck: [
        "「パッタンパターンの相似」で、対応する頂点・辺の順序を逆にしていないか？",
        "垂心 $\\mathrm{G}$ は中線（$2 : 1$）ではなく「垂線の交点」であることに注意し、重心と混同していないか？",
        "四角形の面積を求めるとき、全体の三角形から周りの直角三角形を引く（例：$\\text{四角形}\\mathrm{GDCE} = \\triangle \\mathrm{ADC} - \\triangle \\mathrm{AGE}$）工夫ができているか？",
        "相似な三角形の面積比は「相似比の2乗」、高さや底辺が共通な三角形の面積比は「底辺や高さの比」と使い分けられているか？"
    ],
    generateRandom: function () {
        const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
        const fmtFrac = (num, den) => {
            if (num === 0) return "0";
            const g = gcd(Math.abs(num), Math.abs(den));
            const n = num / g;
            const d = den / g;
            return d === 1 ? `${n}` : `\\frac{${n}}{${d}}`;
        };

        const datasets = [
            { bd: 3, dc: 6, ad: 6 },
            { bd: 4, dc: 8, ad: 8 },
            { bd: 2, dc: 6, ad: 4 },
            { bd: 3, dc: 8, ad: 6 },
            { bd: 6, dc: 12, ad: 12 }
        ];

        const { bd, dc, ad } = datasets[Math.floor(Math.random() * datasets.length)];

        const buildExactOrthocenterSvg = (options = {}) => {
            const { showCF = false, highlightPoly = null } = options;
            const bc = bd + dc;
            const gd = (bd * dc) / ad;

            const acLen2 = dc * dc + ad * ad;
            const tE = (-bd * dc + ad * ad) / acLen2;
            const exMath = bd + tE * dc;
            const eyMath = ad - tE * ad;

            const abLen2 = bd * bd + ad * ad;
            const tF = ((bc - bd) * (-bd) + (0 - ad) * (-ad)) / abLen2;
            const fxMath = bd - tF * bd;
            const fyMath = ad - tF * ad;

            const scale = Math.min(210 / bc, 130 / ad);
            const padX = (320 - bc * scale) / 2;
            const padY = (260 - ad * scale) / 2 + ad * scale;

            const toSvg = (mx, my) => ({
                x: Number((padX + mx * scale).toFixed(2)),
                y: Number((padY - my * scale).toFixed(2))
            });

            const pA = toSvg(bd, ad);
            const pB = toSvg(0, 0);
            const pC = toSvg(bc, 0);
            const pD = toSvg(bd, 0);
            const pE = toSvg(exMath, eyMath);
            const pF = toSvg(fxMath, fyMath);
            const pG = toSvg(bd, gd);

            const rightAngleMark = (vertex, dir1Pt, dir2Pt, size = 8.5) => {
                const v1x = dir1Pt.x - vertex.x;
                const v1y = dir1Pt.y - vertex.y;
                const l1 = Math.hypot(v1x, v1y) || 1;
                const u1x = (v1x / l1) * size;
                const u1y = (v1y / l1) * size;

                const v2x = dir2Pt.x - vertex.x;
                const v2y = dir2Pt.y - vertex.y;
                const l2 = Math.hypot(v2x, v2y) || 1;
                const u2x = (v2x / l2) * size;
                const u2y = (v2y / l2) * size;

                const q1 = `${(vertex.x + u1x).toFixed(2)},${(vertex.y + u1y).toFixed(2)}`;
                const q2 = `${(vertex.x + u1x + u2x).toFixed(2)},${(vertex.y + u1y + u2y).toFixed(2)}`;
                const q3 = `${(vertex.x + u2x).toFixed(2)},${(vertex.y + u2y).toFixed(2)}`;
                return `<polyline points="${q1} ${q2} ${q3}" fill="none" stroke="#0f172a" stroke-width="1.3"/>`;
            };

            const CX = 160;
            const CY = 130;
            const angle = Math.floor(Math.random() * 360);

            const rotatePt = (x, y) => {
                const rad = (angle * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                const dx = x - CX;
                const dy = y - CY;
                return {
                    x: Number((CX + dx * cos - dy * sin).toFixed(2)),
                    y: Number((CY + dx * sin + dy * cos).toFixed(2))
                };
            };

            const triCenter = {
                x: (pA.x + pB.x + pC.x) / 3,
                y: (pA.y + pB.y + pC.y) / 3
            };
            const pushOut = (pt, dist) => {
                const vx = pt.x - triCenter.x;
                const vy = pt.y - triCenter.y;
                const l = Math.hypot(vx, vy) || 1;
                return { x: pt.x + (vx / l) * dist, y: pt.y + (vy / l) * dist };
            };

            const lblA = pushOut(pA, 15);
            const lblB = pushOut(pB, 16);
            const lblC = pushOut(pC, 16);
            const lblD = { x: pD.x, y: pD.y + 15 };
            const lblE = pushOut(pE, 14);
            const lblF = pushOut(pF, 14);
            const lblG = { x: pG.x + 11, y: pG.y + 12 };

            const allPoints = [lblA, lblB, lblC, lblD, lblE, lblG];
            if (showCF) allPoints.push(lblF);

            const rotatedAll = allPoints.map(p => rotatePt(p.x, p.y));
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            rotatedAll.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            });
            const pad = 20;
            const viewBox = `${Math.floor(minX - pad)} ${Math.floor(minY - pad)} ${Math.ceil(maxX - minX + pad * 2)} ${Math.ceil(maxY - minY + pad * 2)}`;

            const makeLabel = (pt, text, color = "#0f172a") => {
                const r = rotatePt(pt.x, pt.y);
                return `<text x="${r.x}" y="${r.y}" font-size="13" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="${color}">${text}</text>`;
            };

            let highlightSvg = "";
            if (highlightPoly === "GBD_ACD") {
                highlightSvg = `
                    <polygon points="${pG.x},${pG.y} ${pB.x},${pB.y} ${pD.x},${pD.y}" fill="#bbf7d0" fill-opacity="0.65"/>
                    <polygon points="${pA.x},${pA.y} ${pC.x},${pC.y} ${pD.x},${pD.y}" fill="#dbeafe" fill-opacity="0.5"/>
                `;
            } else if (highlightPoly === "GDCE") {
                highlightSvg = `
                    <polygon points="${pG.x},${pG.y} ${pD.x},${pD.y} ${pC.x},${pC.y} ${pE.x},${pE.y}" fill="#fde68a" fill-opacity="0.6"/>
                `;
            } else if (highlightPoly === "AGE_BGD") {
                highlightSvg = `
                    <polygon points="${pA.x},${pA.y} ${pG.x},${pG.y} ${pE.x},${pE.y}" fill="#fecaca" fill-opacity="0.65"/>
                    <polygon points="${pG.x},${pG.y} ${pB.x},${pB.y} ${pD.x},${pD.y}" fill="#bbf7d0" fill-opacity="0.65"/>
                `;
            } else if (highlightPoly === "AGF_ABC") {
                highlightSvg = `
                    <polygon points="${pA.x},${pA.y} ${pG.x},${pG.y} ${pF.x},${pF.y}" fill="#ddd6fe" fill-opacity="0.7"/>
                `;
            }

            return `
                <div style="margin: 10px 0 4px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
                    <svg viewBox="${viewBox}" style="width: 100%; max-width: 300px; height: auto;">
                        <g transform="rotate(${angle} ${CX} ${CY})">
                            ${highlightSvg}
                            <polygon points="${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y}" fill="none" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
                            <line x1="${pA.x}" y1="${pA.y}" x2="${pD.x}" y2="${pD.y}" stroke="#2563eb" stroke-width="1.8"/>
                            <line x1="${pB.x}" y1="${pB.y}" x2="${pE.x}" y2="${pE.y}" stroke="#2563eb" stroke-width="1.8"/>
                            ${showCF ? `<line x1="${pC.x}" y1="${pC.y}" x2="${pF.x}" y2="${pF.y}" stroke="#2563eb" stroke-width="1.8"/>` : ""}
                            ${rightAngleMark(pD, pA, pC)}
                            ${rightAngleMark(pE, pB, pC)}
                            ${showCF ? rightAngleMark(pF, pC, pB) : ""}
                            <circle cx="${pD.x}" cy="${pD.y}" r="3" fill="#0f172a"/>
                            <circle cx="${pE.x}" cy="${pE.y}" r="3" fill="#0f172a"/>
                            ${showCF ? `<circle cx="${pF.x}" cy="${pF.y}" r="3" fill="#0f172a"/>` : ""}
                            <circle cx="${pG.x}" cy="${pG.y}" r="4" fill="#dc2626"/>
                        </g>
                        ${makeLabel(lblA, "A")}
                        ${makeLabel(lblB, "B")}
                        ${makeLabel(lblC, "C")}
                        ${makeLabel(lblD, "D")}
                        ${makeLabel(lblE, "E")}
                        ${showCF ? makeLabel(lblF, "F") : ""}
                        ${makeLabel(lblG, "G", "#dc2626")}
                    </svg>
                </div>
            `;
        };

        const questionPatterns = [
            () => {
                const gdLatex = fmtFrac(bd * dc, ad);
                const rLeft = bd * bd;
                const rRight = ad * ad;
                const gR = gcd(rLeft, rRight);
                return {
                    problem: `
                        <div>不等辺三角形 $\\triangle \\mathrm{ABC}$ において、頂点 $\\mathrm{A}$ から辺 $\\mathrm{BC}$ に引いた垂線を $\\mathrm{AD}$、頂点 $\\mathrm{B}$ から辺 $\\mathrm{AC}$ に引いた垂線を $\\mathrm{BE}$ とし、$\\mathrm{AD}$ と $\\mathrm{BE}$ の交点を垂心 $\\mathrm{G}$ とする。<br>
                        $\\mathrm{BD} = ${bd}$、$\\mathrm{DC} = ${dc}$、$\\mathrm{AD} = ${ad}$ のとき、次の問いに答えなさい。</div>
                        <div style="margin-top: 4px;">
                            (1) 線分 $\\mathrm{GD}$ の長さを求めなさい。<br>
                            (2) 面積の比 $\\triangle \\mathrm{GBD} : \\triangle \\mathrm{ACD}$ を最も簡単な整数の比で表しなさい。
                        </div>
                        ${buildExactOrthocenterSvg({ showCF: false, highlightPoly: "GBD_ACD" })}
                    `,
                    answer: `(1) $\\mathrm{GD} = ${gdLatex}$<br>(2) $\\triangle \\mathrm{GBD} : \\triangle \\mathrm{ACD} = ${rLeft / gR} : ${rRight / gR}$`,
                    explanation: `
                        <strong>(1)</strong><br>
                        $\\triangle \\mathrm{BDG} \\sim \\triangle \\mathrm{ADC}$ より $\\mathrm{BD} : \\mathrm{AD} = \\mathrm{GD} : \\mathrm{CD}$ なので、<br>
                        $$${bd} : ${ad} = \\mathrm{GD} : ${dc} \\implies \\mathrm{GD} = ${gdLatex}$$<br>
                        <strong>(2)</strong><br>
                        $\\triangle \\mathrm{GBD} = \\frac{1}{2} \\times \\mathrm{BD} \\times \\mathrm{GD} = \\frac{1}{2} \\times ${bd} \\times ${gdLatex}$、$\\triangle \\mathrm{ACD} = \\frac{1}{2} \\times ${dc} \\times ${ad}$。<br>
                        比をとると $\\mathrm{BD}^2 : \\mathrm{AD}^2 = ${bd}^2 : ${ad}^2 = ${rLeft / gR} : ${rRight / gR}$ です。<br>
                        <strong>答え：(1) $${gdLatex}$<br>(2) $${rLeft / gR} : ${rRight / gR}$</strong>
                    `
                };
            },

            () => {
                const agNum = ad * ad - bd * dc;
                const agLatex = fmtFrac(agNum, ad);
                const ac2 = dc * dc + ad * ad;
                const qNum = dc * (ad * ad * ac2 - agNum * agNum);
                const tDen = (bd + dc) * ad * ad * ac2;
                const gQ = gcd(qNum, tDen);
                return {
                    problem: `
                        <div>不等辺三角形 $\\triangle \\mathrm{ABC}$ において、頂点 $\\mathrm{A}$ から辺 $\\mathrm{BC}$ に引いた垂線を $\\mathrm{AD}$、頂点 $\\mathrm{B}$ から辺 $\\mathrm{AC}$ に引いた垂線を $\\mathrm{BE}$ とし、$\\mathrm{AD}$ と $\\mathrm{BE}$ の交点を垂心 $\\mathrm{G}$ とする。<br>
                        $\\mathrm{BD} = ${bd}$、$\\mathrm{DC} = ${dc}$、$\\mathrm{AD} = ${ad}$ のとき、次の問いに答えなさい。</div>
                        <div style="margin-top: 4px;">
                            (1) 線分 $\\mathrm{AG}$ の長さを求めなさい。<br>
                            (2) 四角形 $\\mathrm{GDCE}$ と $\\triangle \\mathrm{ABC}$ の面積の比 $\\text{四角形}\\mathrm{GDCE} : \\triangle \\mathrm{ABC}$ を最も簡単な整数の比で表しなさい。
                        </div>
                        ${buildExactOrthocenterSvg({ showCF: false, highlightPoly: "GDCE" })}
                    `,
                    answer: `(1) $\\mathrm{AG} = ${agLatex}$<br>(2) $\\text{四角形}\\mathrm{GDCE} : \\triangle \\mathrm{ABC} = ${qNum / gQ} : ${tDen / gQ}$`,
                    explanation: `
                        <strong>(1)</strong><br>
                        $\\triangle \\mathrm{BDG} \\sim \\triangle \\mathrm{ADC}$ より $\\mathrm{GD} = \\frac{${bd} \\times ${dc}}{${ad}} = ${fmtFrac(bd * dc, ad)}$。<br>
                        よって $\\mathrm{AG} = \\mathrm{AD} - \\mathrm{GD} = ${ad} - ${fmtFrac(bd * dc, ad)} = ${agLatex}$。<br><br>
                        <strong>(2)</strong><br>
                        $\\triangle \\mathrm{AEG} \\sim \\triangle \\mathrm{ADC}$ より、面積比は $\\triangle \\mathrm{AEG} : \\triangle \\mathrm{ADC} = \\mathrm{AG}^2 : \\mathrm{AC}^2$。<br>
                        三平方の定理より $\\mathrm{AC}^2 = ${dc}^2 + ${ad}^2 = ${ac2}$ なので、$\\text{四角形}\\mathrm{GDCE} = \\triangle \\mathrm{ADC} - \\triangle \\mathrm{AEG}$ と $\\triangle \\mathrm{ABC} = \\frac{${bd + dc}}{${dc}}\\triangle \\mathrm{ADC}$ を比較すると、<br>
                        $$\\text{四角形}\\mathrm{GDCE} : \\triangle \\mathrm{ABC} = ${qNum / gQ} : ${tDen / gQ}$$<br>
                        <strong>答え：(1) $${agLatex}$<br>(2) $${qNum / gQ} : ${tDen / gQ}$</strong>
                    `
                };
            },

            () => {
                const gdLatex = fmtFrac(bd * dc, ad);
                const agNum = ad * ad - bd * dc;
                const ac2 = ad * ad + dc * dc;
                const left = agNum * agNum;
                const right = bd * bd * ac2;
                const gR = gcd(left, right);
                return {
                    problem: `
                        <div>不等辺三角形 $\\triangle \\mathrm{ABC}$ において、3つの頂点 $\\mathrm{A}$、$\\mathrm{B}$、$\\mathrm{C}$ から対辺に引いた垂線の足をそれぞれ $\\mathrm{D}$、$\\mathrm{E}$、$\\mathrm{F}$ とし、垂心を $\\mathrm{G}$ とする。<br>
                        $\\mathrm{BD} = ${bd}$、$\\mathrm{DC} = ${dc}$、$\\mathrm{AD} = ${ad}$ のとき、次の問いに答えなさい。</div>
                        <div style="margin-top: 4px;">
                            (1) 線分 $\\mathrm{GD}$ の長さを求めなさい。<br>
                            (2) 面積の比 $\\triangle \\mathrm{AGE} : \\triangle \\mathrm{BGD}$ を最も簡単な整数の比で表しなさい。
                        </div>
                        ${buildExactOrthocenterSvg({ showCF: true, highlightPoly: "AGE_BGD" })}
                    `,
                    answer: `(1) $\\mathrm{GD} = ${gdLatex}$<br>(2) $\\triangle \\mathrm{AGE} : \\triangle \\mathrm{BGD} = ${left / gR} : ${right / gR}$`,
                    explanation: `
                        <strong>(1)</strong><br>
                        $\\triangle \\mathrm{BDG} \\sim \\triangle \\mathrm{ADC}$ より $\\mathrm{BD} : \\mathrm{AD} = \\mathrm{GD} : \\mathrm{CD}$ なので $\\mathrm{GD} = \\frac{${bd} \\times ${dc}}{${ad}} = ${gdLatex}$。<br><br>
                        <strong>(2)</strong><br>
                        対頂角と直角が等しいので $\\triangle \\mathrm{AGE} \\sim \\triangle \\mathrm{BGD}$。相似比は斜辺の比 $\\mathrm{AG} : \\mathrm{BG}$ に等しい。<br>
                        $\\mathrm{AG} = ${ad} - ${gdLatex} = ${fmtFrac(agNum, ad)}$、三平方の定理より $\\mathrm{BG}^2 = ${bd}^2 + \\left(${gdLatex}\\right)^2 = ${fmtFrac(right, ad * ad)}$。<br>
                        面積比は相似比の2乗なので $\\mathrm{AG}^2 : \\mathrm{BG}^2 = ${left / gR} : ${right / gR}$ です。<br>
                        <strong>答え：(1) $${gdLatex}$<br>(2) $${left / gR} : ${right / gR}$</strong>
                    `
                };
            },

            () => {
                const agNum = ad * ad - bd * dc;
                const agLatex = fmtFrac(agNum, ad);
                const ab2 = bd * bd + ad * ad;
                const left = bd * agNum * agNum;
                const right = (bd + dc) * ad * ad * ab2;
                const gR = gcd(left, right);
                return {
                    problem: `
                        <div>不等辺三角形 $\\triangle \\mathrm{ABC}$ において、3つの頂点 $\\mathrm{A}$、$\\mathrm{B}$、$\\mathrm{C}$ から対辺に引いた垂線の足をそれぞれ $\\mathrm{D}$、$\\mathrm{E}$、$\\mathrm{F}$ とし、垂心を $\\mathrm{G}$ とする。<br>
                        $\\mathrm{BD} = ${bd}$、$\\mathrm{DC} = ${dc}$、$\\mathrm{AD} = ${ad}$ のとき、次の問いに答えなさい。</div>
                        <div style="margin-top: 4px;">
                            (1) 線分 $\\mathrm{AG}$ の長さを求めなさい。<br>
                            (2) 面積の比 $\\triangle \\mathrm{AGF} : \\triangle \\mathrm{ABC}$ を最も簡単な整数の比で表しなさい。
                        </div>
                        ${buildExactOrthocenterSvg({ showCF: true, highlightPoly: "AGF_ABC" })}
                    `,
                    answer: `(1) $\\mathrm{AG} = ${agLatex}$<br>(2) $\\triangle \\mathrm{AGF} : \\triangle \\mathrm{ABC} = ${left / gR} : ${right / gR}$`,
                    explanation: `
                        <strong>(1)</strong><br>
                        $\\triangle \\mathrm{BDG} \\sim \\triangle \\mathrm{ADC}$ より $\\mathrm{GD} = ${fmtFrac(bd * dc, ad)}$ なので、$\\mathrm{AG} = ${ad} - ${fmtFrac(bd * dc, ad)} = ${agLatex}$。<br><br>
                        <strong>(2)</strong><br>
                        $\\triangle \\mathrm{AGF} \\sim \\triangle \\mathrm{ABD}$ より、面積比は $\\triangle \\mathrm{AGF} : \\triangle \\mathrm{ABD} = \\mathrm{AG}^2 : \\mathrm{AB}^2$。<br>
                        三平方の定理より $\\mathrm{AB}^2 = ${bd}^2 + ${ad}^2 = ${ab2}$ なので、$\\triangle \\mathrm{ABD} : \\triangle \\mathrm{ABC} = ${bd} : ${bd + dc}$ と合わせると、<br>
                        $$\\triangle \\mathrm{AGF} : \\triangle \\mathrm{ABC} = ${left / gR} : ${right / gR}$$<br>
                        <strong>答え：(1) $${agLatex}$<br>(2) $${left / gR} : ${right / gR}$</strong>
                    `
                };
            }
        ];

        const pick = questionPatterns[Math.floor(Math.random() * questionPatterns.length)];
        return pick();
    }
},
"三角形の内心": {
    level: "公立",
    formula: `
        <div>三角形のそれぞれの頂点から引いた角の二等分線は1点に交わる。その点を<strong>内心</strong>と呼ぶ。<br>
        内心はその三角形の<strong>内接円の中心</strong>である。</div>

        <div style="margin: 10px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
            <svg viewBox="0 0 280 202" width="280" height="202" style="max-width: 100%; height: auto;">
                <!-- 座標: A(118,22), B(36,154), C(244,154), 内心 I(126.46,103.70), 内接円半径 r=50.30 -->
                <!-- 交点: D(80.36,82.59) on AB, E(131.66,154) on BC, F(171.88,78.45) on AC -->
                <!-- ADの中点: (99.18, 52.30) -->
                <polygon points="118,22 36,154 244,154" fill="#f8fafc" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
                <!-- 内接円 -->
                <circle cx="126.46" cy="103.70" r="50.30" fill="#ecfdf5" fill-opacity="0.45" stroke="#059669" stroke-width="1.4" stroke-dasharray="4,3"/>

                <!-- 3本の角の二等分線（AE, BF, CD） -->
                <line x1="118" y1="22" x2="131.66" y2="154" stroke="#2563eb" stroke-width="1.5"/>
                <line x1="36" y1="154" x2="171.88" y2="78.45" stroke="#2563eb" stroke-width="1.5"/>
                <line x1="244" y1="154" x2="80.36" y2="82.59" stroke="#2563eb" stroke-width="1.5"/>

                <!-- 内心 I から辺 BC への垂線と直角マーク -->
                <line x1="126.46" y1="103.70" x2="126.46" y2="154" stroke="#059669" stroke-width="1.3" stroke-dasharray="2,2"/>
                <polyline points="126.46,146.5 133.96,146.5 133.96,154" fill="none" stroke="#0f172a" stroke-width="1.2"/>

                <!-- 等角マーク ○（∠A の二等分線の両側の半角にフィット） -->
                <circle cx="114.4" cy="37.6" r="2.2" fill="none" stroke="#dc2626" stroke-width="1.35"/>
                <circle cx="124.7" cy="36.5" r="2.2" fill="none" stroke="#dc2626" stroke-width="1.35"/>

                <!-- 等角マーク ×（∠B の二等分線の両側の半角にフィット） -->
                <g stroke="#2563eb" stroke-width="1.35">
                    <line x1="51.7" y1="147.8" x2="55.1" y2="151.2"/>
                    <line x1="55.1" y1="147.8" x2="51.7" y2="151.2"/>
                    <line x1="47.3" y1="139.9" x2="50.7" y2="143.3"/>
                    <line x1="50.7" y1="139.9" x2="47.3" y2="143.3"/>
                </g>

                <!-- 等角マーク △（∠C の各半角の二等分線上にフィット配置） -->
                <polygon points="211.7,145.6 209.9,148.8 213.5,148.8" fill="none" stroke="#d97706" stroke-width="1.3" stroke-linejoin="round"/>
                <polygon points="216.3,134.7 214.5,137.9 218.1,137.9" fill="none" stroke="#d97706" stroke-width="1.3" stroke-linejoin="round"/>

                <!-- 交点 D, E, F -->
                <circle cx="80.36" cy="82.59" r="3" fill="#0f172a"/>
                <circle cx="131.66" cy="154" r="3" fill="#0f172a"/>
                <circle cx="171.88" cy="78.45" r="3" fill="#0f172a"/>

                <!-- 内心 I -->
                <circle cx="126.46" cy="103.70" r="4" fill="#dc2626"/>

                <!-- 頂点・交点・内心ラベル -->
                <text x="118" y="11" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">A</text>
                <text x="25" y="164" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">B</text>
                <text x="255" y="164" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">C</text>
                <text x="69" y="78" font-size="13" font-weight="bold" text-anchor="end" fill="#0f172a">D</text>
                <text x="131" y="169" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">E</text>
                <text x="182" y="74" font-size="13" font-weight="bold" text-anchor="start" fill="#0f172a">F</text>
                <text x="137" y="101" font-size="13" font-weight="bold" text-anchor="start" fill="#dc2626">I</text>

                <!-- 辺の中央からさらに外側に a, b, c、ADの中点の左上に x -->
                <text x="52" y="92" font-size="13" font-style="italic" font-weight="bold" text-anchor="end" fill="#0f172a">a</text>
                <text x="204" y="88" font-size="13" font-style="italic" font-weight="bold" text-anchor="start" fill="#0f172a">b</text>
                <text x="140" y="182" font-size="13" font-style="italic" font-weight="bold" text-anchor="middle" fill="#0f172a">c</text>
                <text x="91" y="45" font-size="13" font-style="italic" font-weight="bold" text-anchor="end" fill="#2563eb">x</text>
            </svg>
        </div>

        <div style="margin-top: 6px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
            <div><strong>【内心の性質のポイント】</strong></div>
            <div style="margin-top: 4px;">
                ・3つの<strong>角の二等分線</strong>が交わる点なので、内心から三角形の3辺までの距離はすべて等しい（内接円の半径になる）。<br>
                ・$\\triangle \\mathrm{ABC}$ の内心を $\\mathrm{I}$ とすると、$\\angle \\mathrm{BIC} = 90^\\circ + \\frac{1}{2}\\angle \\mathrm{A}$ が成り立つ。<br>
                ・接線の長さ $x = \\frac{a + b - c}{2}$<br>
                ・三角形 $\\mathrm{ABC}$ の面積を $S$ とすると、次が成り立つ。<br>
                $$\\frac{1}{2}r(a + b + c) = S$$<br>
                ※各辺を底辺、内接円の半径が高さとした三角形を3つ合わせると $\\triangle \\mathrm{ABC}$ になる。
            </div>
        </div>
    `,
    selfCheck: [
        "内心は「角の二等分線の交点（内接円の中心）」であり、垂直二等分線の交点（外心）や中線の交点（重心）と混同していないか？",
        "角の二等分線によって角が半分になっていることを正しく使い、$\\angle \\mathrm{BIC} = 90^\\circ + \\frac{1}{2}\\angle \\mathrm{A}$ や内角の和（$180^\\circ$）から正確に角度を求められているか？",
        "円の外部の1点から引いた2本の接線の長さは等しいことを使い、頂点から接点までの長さを $x, y, z$ とおいて連立・整理できているか？",
        "直角三角形の直角の頂点付近では、2本の接線と2本の半径が作る四角形が「正方形」になるため、接線の長さがそのまま内接円の半径 $r$ に一致することを活かせているか？",
        "$\\frac{1}{2}r(a + b + c) = S$ で、3辺の和 $(a + b + c)$ と面積 $S$ の関係から内接円の半径 $r$ を正確に計算できているか？"
    ],
    generateRandom: function () {
        const CX = 160;
        const CY = 130;
        const angle = Math.floor(Math.random() * 360);

        const rotatePt = (x, y) => {
            const rad = (angle * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const dx = x - CX;
            const dy = y - CY;
            return {
                x: Number((CX + dx * cos - dy * sin).toFixed(2)),
                y: Number((CY + dx * sin + dy * cos).toFixed(2))
            };
        };

        const makeLabel = (pt, text, color = "#0f172a") => {
            const r = rotatePt(pt.x, pt.y);
            return `<text x="${r.x}" y="${r.y}" font-size="13" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="${color}">${text}</text>`;
        };

        const rightAngleMark = (vertex, dir1Pt, dir2Pt, size = 7.5) => {
            const v1x = dir1Pt.x - vertex.x;
            const v1y = dir1Pt.y - vertex.y;
            const l1 = Math.hypot(v1x, v1y) || 1;
            const u1x = (v1x / l1) * size;
            const u1y = (v1y / l1) * size;

            const v2x = dir2Pt.x - vertex.x;
            const v2y = dir2Pt.y - vertex.y;
            const l2 = Math.hypot(v2x, v2y) || 1;
            const u2x = (v2x / l2) * size;
            const u2y = (v2y / l2) * size;

            const q1 = `${(vertex.x + u1x).toFixed(2)},${(vertex.y + u1y).toFixed(2)}`;
            const q2 = `${(vertex.x + u1x + u2x).toFixed(2)},${(vertex.y + u1y + u2y).toFixed(2)}`;
            const q3 = `${(vertex.x + u2x).toFixed(2)},${(vertex.y + u2y).toFixed(2)}`;
            return `<polyline points="${q1} ${q2} ${q3}" fill="none" stroke="#0f172a" stroke-width="1.2"/>`;
        };

        const buildTriangleSvg = (bcLen, caLen, abLen, sNum, isRightC) => {
            const cosC = (bcLen * bcLen + caLen * caLen - abLen * abLen) / (2 * bcLen * caLen);
            const sinC = Math.sqrt(Math.max(0, 1 - cosC * cosC));
            const axMath = caLen * cosC;
            const ayMath = caLen * sinC;

            const perim = bcLen + caLen + abLen;
            const rMath = (2 * sNum) / perim;

            const ixMath = (bcLen * axMath + caLen * bcLen + abLen * 0) / perim;
            const iyMath = (bcLen * ayMath + caLen * 0 + abLen * 0) / perim;

            const zLen = (caLen + bcLen - abLen) / 2;
            const pMath = { x: zLen, y: 0 };
            const qMath = { x: zLen * cosC, y: zLen * sinC };

            const xLen = (abLen + caLen - bcLen) / 2;
            const abDx = (bcLen - axMath) / abLen;
            const abDy = (0 - ayMath) / abLen;
            const rMathPt = {
                x: axMath + xLen * abDx,
                y: ayMath + xLen * abDy
            };

            const minXMath = Math.min(0, axMath, bcLen);
            const maxXMath = Math.max(0, axMath, bcLen);
            const minYMath = Math.min(0, ayMath);
            const maxYMath = Math.max(0, ayMath);
            const wMath = Math.max(maxXMath - minXMath, 1);
            const hMath = Math.max(maxYMath - minYMath, 1);

            const scale = Math.min(180 / wMath, 130 / hMath);
            const drawW = wMath * scale;
            const drawH = hMath * scale;
            const padX = (320 - drawW) / 2 - minXMath * scale;
            const padY = (260 - drawH) / 2 + maxYMath * scale;

            const toSvg = (mx, my) => ({
                x: Number((padX + mx * scale).toFixed(2)),
                y: Number((padY - my * scale).toFixed(2))
            });

            const pC = toSvg(0, 0);
            const pB = toSvg(bcLen, 0);
            const pA = toSvg(axMath, ayMath);
            const pI = toSvg(ixMath, iyMath);
            const pP = toSvg(pMath.x, pMath.y);
            const pQ = toSvg(qMath.x, qMath.y);
            const pR = toSvg(rMathPt.x, rMathPt.y);
            const rSvg = Number((rMath * scale).toFixed(2));

            const triCenter = { x: (pA.x + pB.x + pC.x) / 3, y: (pA.y + pB.y + pC.y) / 3 };
            const pushOut = (pt, dist) => {
                const vx = pt.x - triCenter.x;
                const vy = pt.y - triCenter.y;
                const l = Math.hypot(vx, vy) || 1;
                return { x: pt.x + (vx / l) * dist, y: pt.y + (vy / l) * dist };
            };

            const lblA = pushOut(pA, 15);
            const lblB = pushOut(pB, 16);
            const lblC = pushOut(pC, 16);
            const lblP = pushOut(pP, 12);
            const lblQ = pushOut(pQ, 12);
            const lblR = pushOut(pR, 12);
            const lblI = { x: pI.x + 10, y: pI.y - 8 };

            const rotatedAll = [lblA, lblB, lblC, lblP, lblQ, lblR, lblI].map(p => rotatePt(p.x, p.y));
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            rotatedAll.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            });
            const pad = 22;
            const viewBox = `${Math.floor(minX - pad)} ${Math.floor(minY - pad)} ${Math.ceil(maxX - minX + pad * 2)} ${Math.ceil(maxY - minY + pad * 2)}`;

            return `
                <div style="margin: 10px 0 8px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
                    <svg viewBox="${viewBox}" style="width: 100%; max-width: 300px; height: auto;">
                        <g transform="rotate(${angle} ${CX} ${CY})">
                            <polygon points="${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y}" fill="#f8fafc" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
                            <circle cx="${pI.x}" cy="${pI.y}" r="${rSvg}" fill="#ecfdf5" fill-opacity="0.5" stroke="#059669" stroke-width="1.4"/>
                            <line x1="${pA.x}" y1="${pA.y}" x2="${pI.x}" y2="${pI.y}" stroke="#2563eb" stroke-width="1.35"/>
                            <line x1="${pB.x}" y1="${pB.y}" x2="${pI.x}" y2="${pI.y}" stroke="#2563eb" stroke-width="1.35"/>
                            <line x1="${pC.x}" y1="${pC.y}" x2="${pI.x}" y2="${pI.y}" stroke="#2563eb" stroke-width="1.35"/>
                            <line x1="${pI.x}" y1="${pI.y}" x2="${pP.x}" y2="${pP.y}" stroke="#059669" stroke-width="1.2" stroke-dasharray="3,2"/>
                            <line x1="${pI.x}" y1="${pI.y}" x2="${pQ.x}" y2="${pQ.y}" stroke="#059669" stroke-width="1.2" stroke-dasharray="3,2"/>
                            <line x1="${pI.x}" y1="${pI.y}" x2="${pR.x}" y2="${pR.y}" stroke="#059669" stroke-width="1.2" stroke-dasharray="3,2"/>
                            ${isRightC ? rightAngleMark(pC, pA, pB, 7) : ""}
                            ${rightAngleMark(pP, pI, pB, 6.5)}
                            ${rightAngleMark(pQ, pI, pA, 6.5)}
                            ${rightAngleMark(pR, pI, pB, 6.5)}
                            <circle cx="${pP.x}" cy="${pP.y}" r="2.8" fill="#0f172a"/>
                            <circle cx="${pQ.x}" cy="${pQ.y}" r="2.8" fill="#0f172a"/>
                            <circle cx="${pR.x}" cy="${pR.y}" r="2.8" fill="#0f172a"/>
                            <circle cx="${pI.x}" cy="${pI.y}" r="3.8" fill="#dc2626"/>
                        </g>
                        ${makeLabel(lblA, "A")}
                        ${makeLabel(lblB, "B")}
                        ${makeLabel(lblC, "C")}
                        ${makeLabel(lblP, "P")}
                        ${makeLabel(lblQ, "Q")}
                        ${makeLabel(lblR, "R")}
                        ${makeLabel(lblI, "I", "#dc2626")}
                    </svg>
                </div>
            `;
        };

        const rightTriCases = [
            { bc: 3, ca: 4, ab: 5 },
            { bc: 6, ca: 8, ab: 10 },
            { bc: 5, ca: 12, ab: 13 },
            { bc: 9, ca: 12, ab: 15 }
        ];

        const nonRightTriCases = [
            { bc: 13, ca: 14, ab: 15, sNum: 84, areaTex: "84", rTex: "4" },
            { bc: 7, ca: 15, ab: 20, sNum: 42, areaTex: "42", rTex: "2" },
            { bc: 11, ca: 13, ab: 20, sNum: 66, areaTex: "66", rTex: "3" },
            { bc: 25, ca: 29, ab: 36, sNum: 360, areaTex: "360", rTex: "8" }
        ];

        const angleCases = [
            { angA: 50, angB: 70 },
            { angA: 60, angB: 68 },
            { angA: 40, angB: 80 },
            { angA: 70, angB: 54 },
            { angA: 80, angB: 50 }
        ];

        const { angA, angB } = angleCases[Math.floor(Math.random() * angleCases.length)];
        const angC = 180 - angA - angB;
        const angIBC = angB / 2;
        const angICB = angC / 2;
        const angBIC = 90 + angA / 2;

        const useNonRight = Math.random() < 0.5;

        if (!useNonRight) {
            const { bc, ca, ab } = rightTriCases[Math.floor(Math.random() * rightTriCases.length)];
            const s = (bc + ca + ab) / 2;
            const lenA = s - bc;
            const rVal = s - ab;
            const areaS = (bc * ca) / 2;

            return {
                problem: `
                    <div>
                        図は $\\angle \\mathrm{C} = 90^\\circ$ の三角形 $\\triangle \\mathrm{ABC}$ であり、$\\angle \\mathrm{A} = ${angA}^\\circ$、$\\angle \\mathrm{B} = ${angB}^\\circ$、$\\mathrm{BC} = ${bc}$、$\\mathrm{CA} = ${ca}$、$\\mathrm{AB} = ${ab}$ とする。$\\triangle \\mathrm{ABC}$ の内心を $\\mathrm{I}$、内接円と辺 $\\mathrm{BC}$、$\\mathrm{CA}$、$\\mathrm{AB}$ との接点をそれぞれ $\\mathrm{P}$、$\\mathrm{Q}$、$\\mathrm{R}$ とするとき、次の問いに答えなさい。
                    </div>
                    ${buildTriangleSvg(bc, ca, ab, areaS, true)}
                    <div style="margin-top: 4px;">
                        (1) $\\angle \\mathrm{IBC}$ の大きさを求めなさい。<br>
                        (2) $\\angle \\mathrm{BIC}$ の大きさを求めなさい。<br>
                        (3) 頂点 $\\mathrm{A}$ から接点までの長さ（$\\mathrm{AQ}$、$\\mathrm{AR}$ の長さ）を求めなさい。<br>
                        (4) 内接円の半径を求めなさい。
                    </div>
                `,
                answer: `(1) $\\angle \\mathrm{IBC} = ${angIBC}^\\circ$<br>(2) $\\angle \\mathrm{BIC} = ${angBIC}^\\circ$<br>(3) $\\mathrm{AQ} = \\mathrm{AR} = ${lenA}$<br>(4) 内接円の半径 $= ${rVal}$`,
                explanation: `
                    <strong>(1)</strong><br>
                    内心 $\\mathrm{I}$ は $\\angle \\mathrm{B}$ の二等分線上にあるので、<br>
                    $$\\angle \\mathrm{IBC} = \\frac{1}{2}\\angle \\mathrm{B} = \\frac{1}{2} \\times ${angB}^\\circ = ${angIBC}^\\circ$$<br><br>

                    <strong>(2)</strong><br>
                    $\\angle \\mathrm{C} = 180^\\circ - (${angA}^\\circ + ${angB}^\\circ) = ${angC}^\\circ$ より、$\\angle \\mathrm{ICB} = \\frac{1}{2}\\angle \\mathrm{C} = ${angICB}^\\circ$。<br>
                    $\\triangle \\mathrm{IBC}$ の内角の和は $180^\\circ$ なので、<br>
                    $$\\angle \\mathrm{BIC} = 180^\\circ - (${angIBC}^\\circ + ${angICB}^\\circ) = ${angBIC}^\\circ$$<br><br>

                    <strong>(3)</strong><br>
                    頂点 $\\mathrm{A}$、$\\mathrm{B}$、$\\mathrm{C}$ から内接円に引いた接線の長さをそれぞれ $x = \\mathrm{AQ} = \\mathrm{AR}$、$y = \\mathrm{BP} = \\mathrm{BR}$、$z = \\mathrm{CP} = \\mathrm{CQ}$ とすると、<br>
                    $x + y = ${ab}$、$y + z = ${bc}$、$z + x = ${ca}$。<br>
                    3式をたすと $2(x + y + z) = ${ab + bc + ca}$ より $x + y + z = ${s}$。<br>
                    よって $x = ${s} - ${bc} = ${lenA}$ なので、$\\mathrm{AQ} = \\mathrm{AR} = ${lenA}$ です。<br><br>

                    <strong>(4)</strong><br>
                    $\\triangle \\mathrm{ABC}$ の面積は $S = \\frac{1}{2} \\times ${bc} \\times ${ca} = ${areaS}$。<br>
                    $\\frac{1}{2}r(${bc} + ${ca} + ${ab}) = ${areaS}$ より、$\\frac{1}{2}r \\times ${bc + ca + ab} = ${areaS}$ なので、<br>
                    $$r = ${rVal}$$<br>
                    <strong>答え：(1) $${angIBC}^\\circ$　(2) $${angBIC}^\\circ$　(3) $${lenA}$　(4) ${rVal}</strong>
                `
            };
        }

        const { bc, ca, ab, sNum, areaTex, rTex } = nonRightTriCases[Math.floor(Math.random() * nonRightTriCases.length)];
        const s = (bc + ca + ab) / 2;
        const lenA = s - bc;
        const perim = bc + ca + ab;

        return {
            problem: `
                <div>
                    図は三角形 $\\triangle \\mathrm{ABC}$ であり、$\\angle \\mathrm{A} = ${angA}^\\circ$、$\\angle \\mathrm{B} = ${angB}^\\circ$、$\\mathrm{BC} = ${bc}$、$\\mathrm{CA} = ${ca}$、$\\mathrm{AB} = ${ab}$、面積 $S = ${areaTex}$ とする。$\\triangle \\mathrm{ABC}$ の内心を $\\mathrm{I}$、内接円と辺 $\\mathrm{BC}$、$\\mathrm{CA}$、$\\mathrm{AB}$ との接点をそれぞれ $\\mathrm{P}$、$\\mathrm{Q}$、$\\mathrm{R}$ とするとき、次の問いに答えなさい。
                </div>
                ${buildTriangleSvg(bc, ca, ab, sNum, false)}
                <div style="margin-top: 4px;">
                    (1) $\\angle \\mathrm{IBC}$ の大きさを求めなさい。<br>
                    (2) $\\angle \\mathrm{BIC}$ の大きさを求めなさい。<br>
                    (3) 頂点 $\\mathrm{A}$ から接点までの長さ（$\\mathrm{AQ}$、$\\mathrm{AR}$ の長さ）を求めなさい。<br>
                    (4) 内接円の半径を求めなさい。
                </div>
            `,
            answer: `(1) $\\angle \\mathrm{IBC} = ${angIBC}^\\circ$<br>(2) $\\angle \\mathrm{BIC} = ${angBIC}^\\circ$<br>(3) $\\mathrm{AQ} = \\mathrm{AR} = ${lenA}$<br>(4) 内接円の半径 $= ${rTex}$`,
            explanation: `
                <strong>(1)</strong><br>
                内心 $\\mathrm{I}$ は $\\angle \\mathrm{B}$ の二等分線上にあるので、<br>
                $$\\angle \\mathrm{IBC} = \\frac{1}{2}\\angle \\mathrm{B} = \\frac{1}{2} \\times ${angB}^\\circ = ${angIBC}^\\circ$$<br><br>

                <strong>(2)</strong><br>
                $\\angle \\mathrm{C} = 180^\\circ - (${angA}^\\circ + ${angB}^\\circ) = ${angC}^\\circ$ より、$\\angle \\mathrm{ICB} = \\frac{1}{2}\\angle \\mathrm{C} = ${angICB}^\\circ$。<br>
                $\\triangle \\mathrm{IBC}$ の内角の和は $180^\\circ$ なので、<br>
                $$\\angle \\mathrm{BIC} = 180^\\circ - (${angIBC}^\\circ + ${angICB}^\\circ) = ${angBIC}^\\circ$$<br><br>

                <strong>(3)</strong><br>
                頂点 $\\mathrm{A}$、$\\mathrm{B}$、$\\mathrm{C}$ から内接円に引いた接線の長さをそれぞれ $x = \\mathrm{AQ} = \\mathrm{AR}$、$y = \\mathrm{BP} = \\mathrm{BR}$、$z = \\mathrm{CP} = \\mathrm{CQ}$ とすると、<br>
                $x + y = ${ab}$、$y + z = ${bc}$、$z + x = ${ca}$。<br>
                3式をたすと $2(x + y + z) = ${perim}$ より $x + y + z = ${s}$。<br>
                よって $x = ${s} - ${bc} = ${lenA}$ なので、$\\mathrm{AQ} = \\mathrm{AR} = ${lenA}$ です。<br><br>

                <strong>(4)</strong><br>
                $\\triangle \\mathrm{ABC}$ の面積は $S = ${areaTex}$ であり、$\\frac{1}{2}r(${bc} + ${ca} + ${ab}) = S$ が成り立つので、<br>
                $$\\frac{1}{2}r \\times ${perim} = ${areaTex}$$<br>
                よって $r = ${rTex}$ です。<br>
                <strong>答え：(1) $${angIBC}^\\circ$　(2) $${angBIC}^\\circ$　(3) $${lenA}$　(4) ${rTex}</strong>
            `
        };
    }
},
"三角形の外心": {
    level: "難関私立",
    formula: `
        <div>三角形の3つの辺の<strong>垂直二等分線</strong>は1点に交わる。その点を<strong>外心</strong>と呼ぶ。<br>
        外心はその三角形の<strong>外接円の中心</strong>であり、3つの頂点までの距離がすべて等しい。</div>

        <div style="margin: 10px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
            <svg viewBox="0 0 280 206" width="280" height="206" style="max-width: 100%; height: auto;">
                <!--
                    厳密座標（O=(140, 106), 外接円半径 R=82）:
                    A = (111.95, 28.95)
                    B = (65.68, 140.65)
                    C = (214.32, 140.65)
                    中点:
                    D (BC中点) = (140.00, 140.65)
                    E (AC中点) = (163.14, 84.80)
                    F (AB中点) = (88.82, 84.80)
                -->
                <circle cx="140" cy="106" r="82" fill="#eff6ff" fill-opacity="0.35" stroke="#2563eb" stroke-width="1.4" stroke-dasharray="4,3"/>
                <polygon points="111.95,28.95 65.68,140.65 214.32,140.65" fill="#f8fafc" fill-opacity="0.85" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>

                <!-- 外心 O から各頂点 A, B, C への線分（外接円の半径 R） -->
                <line x1="140" y1="106" x2="111.95" y2="28.95" stroke="#059669" stroke-width="1.3" stroke-dasharray="3,2"/>
                <line x1="140" y1="106" x2="65.68" y2="140.65" stroke="#059669" stroke-width="1.3" stroke-dasharray="3,2"/>
                <line x1="140" y1="106" x2="214.32" y2="140.65" stroke="#059669" stroke-width="1.3" stroke-dasharray="3,2"/>

                <!-- 3本の垂直二等分線（各辺の中点 D, E, F を通り、各辺に直交して外心 O で交わる） -->
                <line x1="140" y1="162" x2="140" y2="82" stroke="#2563eb" stroke-width="1.5"/>
                <line x1="181.65" y1="67.84" x2="121.48" y2="122.96" stroke="#2563eb" stroke-width="1.5"/>
                <line x1="68.34" y1="76.32" x2="160.47" y2="114.48" stroke="#2563eb" stroke-width="1.5"/>

                <!-- 中点 D, E, F での直角マーク -->
                <polyline points="140,133.65 147,133.65 147,140.65" fill="none" stroke="#0f172a" stroke-width="1.2"/>
                <polyline points="158.41,79.64 153.25,84.37 157.98,89.53" fill="none" stroke="#0f172a" stroke-width="1.2"/>
                <polyline points="95.29,87.48 97.97,81.01 91.50,78.33" fill="none" stroke="#0f172a" stroke-width="1.2"/>

                <!-- 外心 O -->
                <circle cx="140" cy="106" r="4" fill="#dc2626"/>

                <!-- ラベル -->
                <text x="109" y="18" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">A</text>
                <text x="53" y="147" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">B</text>
                <text x="227" y="147" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">C</text>
                <text x="148" y="103" font-size="13" font-weight="bold" text-anchor="start" fill="#dc2626">O</text>
                <text x="119" y="68" font-size="12" font-style="italic" font-weight="bold" text-anchor="end" fill="#059669">R</text>
            </svg>
        </div>

        <div style="margin-top: 6px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
            <div><strong>【外心の性質のポイント】</strong></div>
            <div style="margin-top: 4px;">
                ・外心 $\\mathrm{O}$ から3つの頂点までの距離はすべて等しい（$\\mathrm{OA} = \\mathrm{OB} = \\mathrm{OC} = R$：外接円の半径）。<br>
                ・$\\triangle \\mathrm{OAB}$、$\\triangle \\mathrm{OBC}$、$\\triangle \\mathrm{OCA}$ はすべて<strong>二等辺三角形</strong>になる。<br>
                ・外接円の中心角と円周角の関係より、鋭角三角形では $\\angle \\mathrm{BOC} = 2\\angle \\mathrm{BAC}$ が成り立つ（$\\angle \\mathrm{BAC}$ が鈍角のときは、小さい方の $\\angle \\mathrm{BOC}$ を求め、$360^\\circ$ から引いた大きい方の中心角の $\\frac{1}{2}$ が $\\angle \\mathrm{BAC}$ になる）。<br>
                ・<strong>三角形の種類と外心の位置</strong>：<br>
                　鋭角三角形：三角形の<strong>内部</strong> ／ 直角三角形：<strong>斜辺の中点</strong> ／ 鈍角三角形：三角形の<strong>外部</strong><br>
                ・外接円の半径 $R$ の求め方：$R = \\frac{a \\times b}{2h}$（※$h$ は三角形の高さ、$a, b$ は高さを挟む2辺の長さ）
            </div>
        </div>
    `,
    selfCheck: [
        "外心は「辺の垂直二等分線の交点（外接円の中心）」であり、角の二等分線の交点（内心）や中線の交点（重心）と混同していないか？",
        "OB = OC（外接円の半径）から、△OBC が二等辺三角形になることを使って ∠OCB = ∠OBC とできているか？",
        "△OBC の内角の和から中心角 ∠BOC を求め、円周角の定理（∠A が鋭角なら ∠BAC = 1/2∠BOC、鈍角なら 360° から小さい方の ∠BOC を引いた大きい方の中心角の 1/2）を正しく適用できているか？",
        "外接円の半径 R = (a × b) / 2h を計算するとき、2辺の積を高さ h の2倍（2h）で正しく割れているか？",
        "直角三角形の外心は「斜辺の中点」にあり、外接円の半径 R が斜辺の半分になることを理解しているか？"
    ],
    generateRandom: function () {
        const CX = 160;
        const CY = 130;
        const angle = Math.floor(Math.random() * 360);

        const rotatePt = (x, y) => {
            const rad = (angle * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const dx = x - CX;
            const dy = y - CY;
            return {
                x: Number((CX + dx * cos - dy * sin).toFixed(2)),
                y: Number((CY + dx * sin + dy * cos).toFixed(2))
            };
        };

        const makeLabel = (pt, text, color = "#0f172a", italic = false) => {
            const r = rotatePt(pt.x, pt.y);
            const styleAttr = italic ? 'font-style="italic"' : "";
            return `<text x="${r.x}" y="${r.y}" font-size="13" ${styleAttr} font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="${color}">${text}</text>`;
        };

        const rightAngleMark = (vertex, dir1Pt, dir2Pt, size = 6.5) => {
            const v1x = dir1Pt.x - vertex.x;
            const v1y = dir1Pt.y - vertex.y;
            const l1 = Math.hypot(v1x, v1y) || 1;
            const u1x = (v1x / l1) * size;
            const u1y = (v1y / l1) * size;

            const v2x = dir2Pt.x - vertex.x;
            const v2y = dir2Pt.y - vertex.y;
            const l2 = Math.hypot(v2x, v2y) || 1;
            const u2x = (v2x / l2) * size;
            const u2y = (v2y / l2) * size;

            const q1 = `${(vertex.x + u1x).toFixed(2)},${(vertex.y + u1y).toFixed(2)}`;
            const q2 = `${(vertex.x + u1x + u2x).toFixed(2)},${(vertex.y + u1y + u2y).toFixed(2)}`;
            const q3 = `${(vertex.x + u2x).toFixed(2)},${(vertex.y + u2y).toFixed(2)}`;
            return `<polyline points="${q1} ${q2} ${q3}" fill="none" stroke="#0f172a" stroke-width="1.2"/>`;
        };

        // 小さい方の ∠BOC < 150°（angOBC > 15°）、1〜2辺が整数・残りが √ の単項式、BC が直径にならない条件
        // 外心 O が辺 BC に近づきすぎてほぼ直線（180°）に見えすぎないケースを収録
        const cases = [
            {
                isObtuseA: false,
                angOBC: 28,
                sideATex: "2\\sqrt{10}",
                sideBTex: "6\\sqrt{2}",
                bcTex: "8",
                sideANum: 2 * Math.sqrt(10),
                sideBNum: 6 * Math.sqrt(2),
                bcNum: 8,
                xTex: "6",
                chTex: "2",
                chExprTex: "8 - x",
                bSqTex: "(6\\sqrt{2})^2",
                aSqTex: "(2\\sqrt{10})^2",
                chSqTex: "2^2",
                hSqValTex: "36",
                hTex: "6",
                rCalc: "\\frac{2\\sqrt{10} \\times 6\\sqrt{2}}{2 \\times 6} = \\frac{12\\sqrt{20}}{12} = 2\\sqrt{5}",
                rTex: "2\\sqrt{5}"
            },
            {
                isObtuseA: false,
                angOBC: 35,
                sideATex: "10",
                sideBTex: "4\\sqrt{5}",
                bcTex: "10",
                sideANum: 10,
                sideBNum: 4 * Math.sqrt(5),
                bcNum: 10,
                xTex: "4",
                chTex: "6",
                chExprTex: "10 - x",
                bSqTex: "(4\\sqrt{5})^2",
                aSqTex: "10^2",
                chSqTex: "6^2",
                hSqValTex: "64",
                hTex: "8",
                rCalc: "\\frac{10 \\times 4\\sqrt{5}}{2 \\times 8} = \\frac{40\\sqrt{5}}{16} = \\frac{5\\sqrt{5}}{2}",
                rTex: "\\frac{5\\sqrt{5}}{2}"
            },
            {
                isObtuseA: false,
                angOBC: 30,
                sideATex: "2\\sqrt{13}",
                sideBTex: "2\\sqrt{10}",
                bcTex: "6",
                sideANum: 2 * Math.sqrt(13),
                sideBNum: 2 * Math.sqrt(10),
                bcNum: 6,
                xTex: "2",
                chTex: "4",
                chExprTex: "6 - x",
                bSqTex: "(2\\sqrt{10})^2",
                aSqTex: "(2\\sqrt{13})^2",
                chSqTex: "4^2",
                hSqValTex: "36",
                hTex: "6",
                rCalc: "\\frac{2\\sqrt{13} \\times 2\\sqrt{10}}{2 \\times 6} = \\frac{4\\sqrt{130}}{12} = \\frac{\\sqrt{130}}{3}",
                rTex: "\\frac{\\sqrt{130}}{3}"
            },
            {
                // 角Aが鈍角（∠BAC > 90°）: C=(0,0), B=(6,0), A=(2,1) -> AC=√5, AB=√17, BC=6
                isObtuseA: true,
                angOBC: 20,
                sideATex: "\\sqrt{5}",
                sideBTex: "\\sqrt{17}",
                bcTex: "6",
                sideANum: Math.sqrt(5),
                sideBNum: Math.sqrt(17),
                bcNum: 6,
                xTex: "4",
                chTex: "2",
                chExprTex: "6 - x",
                bSqTex: "(\\sqrt{17})^2",
                aSqTex: "(\\sqrt{5})^2",
                chSqTex: "2^2",
                hSqValTex: "1",
                hTex: "1",
                rCalc: "\\frac{\\sqrt{5} \\times \\sqrt{17}}{2 \\times 1} = \\frac{\\sqrt{85}}{2}",
                rTex: "\\frac{\\sqrt{85}}{2}"
            },
            {
                // 角Aが鈍角（∠BAC > 90°）: C=(0,0), B=(8,0), A=(2,2) -> AC=2√2, AB=2√10, BC=8
                isObtuseA: true,
                angOBC: 25,
                sideATex: "2\\sqrt{2}",
                sideBTex: "2\\sqrt{10}",
                bcTex: "8",
                sideANum: 2 * Math.sqrt(2),
                sideBNum: 2 * Math.sqrt(10),
                bcNum: 8,
                xTex: "6",
                chTex: "2",
                chExprTex: "8 - x",
                bSqTex: "(2\\sqrt{10})^2",
                aSqTex: "(2\\sqrt{2})^2",
                chSqTex: "2^2",
                hSqValTex: "4",
                hTex: "2",
                rCalc: "\\frac{2\\sqrt{2} \\times 2\\sqrt{10}}{2 \\times 2} = \\frac{4\\sqrt{20}}{4} = 2\\sqrt{5}",
                rTex: "2\\sqrt{5}"
            }
        ].filter(c => (180 - 2 * c.angOBC) < 150);

        const chosen = cases[Math.floor(Math.random() * cases.length)];
        const {
            isObtuseA, angOBC, sideATex, sideBTex, bcTex,
            sideANum, sideBNum, bcNum,
            xTex, chTex, chExprTex, bSqTex, aSqTex, chSqTex, hSqValTex, hTex,
            rCalc, rTex
        } = chosen;

        const smallBOC = 180 - 2 * angOBC;
        const largeBOC = 360 - smallBOC;
        const angBAC = isObtuseA ? (largeBOC / 2) : (smallBOC / 2);

        const cosC = (bcNum * bcNum + sideANum * sideANum - sideBNum * sideBNum) / (2 * bcNum * sideANum);
        const clampedCosC = Math.max(-0.99, Math.min(0.99, cosC));
        const sinC = Math.sqrt(Math.max(0.01, 1 - clampedCosC * clampedCosC));
        const axMath = sideANum * clampedCosC;
        const ayMath = sideANum * sinC;

        const oxMath = bcNum / 2;
        const oyMath = (axMath * axMath + ayMath * ayMath - bcNum * axMath) / (2 * ayMath);
        const rMath = Math.hypot(oxMath - axMath, oyMath - ayMath);

        const rSvg = 74;
        const scale = rSvg / (rMath || 1);
        const toSvg = (mx, my) => ({
            x: Number((CX + (mx - oxMath) * scale).toFixed(2)),
            y: Number((CY - (my - oyMath) * scale).toFixed(2))
        });

        const pO = { x: CX, y: CY };
        const pC = toSvg(0, 0);
        const pB = toSvg(bcNum, 0);
        const pA = toSvg(axMath, ayMath);
        const pH = toSvg(axMath, 0);

        const dirSidePt = axMath >= bcNum / 2 ? pB : pC;

        const pushOut = (pt, dist) => {
            const vx = pt.x - CX;
            const vy = pt.y - CY;
            const l = Math.hypot(vx, vy) || 1;
            return { x: pt.x + (vx / l) * dist, y: pt.y + (vy / l) * dist };
        };

        const lblA = pushOut(pA, 16);
        const lblB = pushOut(pB, 17);
        const lblC = pushOut(pC, 17);
        const lblO = { x: pO.x + 12, y: pO.y + (isObtuseA ? 8 : -6) };
        const lblH = { x: (pA.x + pH.x) / 2 - 10, y: (pA.y + pH.y) / 2 };

        const circleSamplePts = [];
        for (let deg = 0; deg < 360; deg += 22.5) {
            const rad = (deg * Math.PI) / 180;
            circleSamplePts.push({
                x: Number((CX + rSvg * Math.cos(rad)).toFixed(2)),
                y: Number((CY + rSvg * Math.sin(rad)).toFixed(2))
            });
        }

        const rotatedAll = [lblA, lblB, lblC, lblO, lblH, pH, ...circleSamplePts].map(p => rotatePt(p.x, p.y));
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        rotatedAll.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        });
        const pad = 24;
        const viewBox = `${Math.floor(minX - pad)} ${Math.floor(minY - pad)} ${Math.ceil(maxX - minX + pad * 2)} ${Math.ceil(maxY - minY + pad * 2)}`;

        const extLineSvg = (axMath < 0 || axMath > bcNum)
            ? `<line x1="${axMath < 0 ? pH.x : pB.x}" y1="${axMath < 0 ? pH.y : pB.y}" x2="${axMath < 0 ? pC.x : pH.x}" y2="${axMath < 0 ? pC.y : pH.y}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="2,2"/>`
            : "";

        const step1Html = isObtuseA
            ? `
                <strong>(1)</strong><br>
                $\\mathrm{OB} = \\mathrm{OC}$（外接円の半径）より、$\\triangle \\mathrm{OBC}$ は $\\mathrm{OB} = \\mathrm{OC}$ の二等辺三角形なので $\\angle \\mathrm{OCB} = \\angle \\mathrm{OBC} = ${angOBC}^\\circ$。<br>
                よって、$\\triangle \\mathrm{OBC}$ の内角の和より、小さい方の $\\angle \\mathrm{BOC}$ は、<br>
                $$180^\\circ - 2 \\times ${angOBC}^\\circ = ${smallBOC}^\\circ$$<br>
                したがって、大きい方の $\\angle \\mathrm{BOC}$ は $360^\\circ$ から引いて、<br>
                $$360^\\circ - ${smallBOC}^\\circ = ${largeBOC}^\\circ$$<br>
                円周角の定理より、円周角 $\\angle \\mathrm{BAC}$ は中心角（大きい方の $\\angle \\mathrm{BOC} = ${largeBOC}^\\circ$）の $\\frac{1}{2}$ なので、<br>
                $$\\angle \\mathrm{BAC} = \\frac{1}{2} \\times ${largeBOC}^\\circ = ${angBAC}^\\circ$$<br><br>
            `
            : `
                <strong>(1)</strong><br>
                $\\mathrm{OB} = \\mathrm{OC}$（外接円の半径）より、$\\triangle \\mathrm{OBC}$ は $\\mathrm{OB} = \\mathrm{OC}$ の二等辺三角形なので $\\angle \\mathrm{OCB} = \\angle \\mathrm{OBC} = ${angOBC}^\\circ$。<br>
                よって、$\\triangle \\mathrm{OBC}$ の内角の和より、<br>
                $$\\angle \\mathrm{BOC} = 180^\\circ - 2 \\times ${angOBC}^\\circ = ${smallBOC}^\\circ$$<br>
                外接円の中心角と円周角の関係（円周角の定理）より $\\angle \\mathrm{BOC} = 2\\angle \\mathrm{BAC}$ なので、<br>
                $$\\angle \\mathrm{BAC} = \\frac{1}{2}\\angle \\mathrm{BOC} = \\frac{1}{2} \\times ${smallBOC}^\\circ = ${angBAC}^\\circ$$<br><br>
            `;

        return {
            problem: `
                <div>
                    図は三角形 $\\triangle \\mathrm{ABC}$ とその外心 $\\mathrm{O}$ であり、$\\angle \\mathrm{OBC} = ${angOBC}^\\circ$、$\\mathrm{AB} = ${sideBTex}$、$\\mathrm{AC} = ${sideATex}$、$\\mathrm{BC} = ${bcTex}$ とする。このとき、次の問いに答えなさい。
                </div>
                <div style="margin: 10px 0 8px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
                    <svg viewBox="${viewBox}" style="width: 100%; max-width: 300px; height: auto;">
                        <g transform="rotate(${angle} ${CX} ${CY})">
                            <circle cx="${pO.x}" cy="${pO.y}" r="${rSvg}" fill="#eff6ff" fill-opacity="0.35" stroke="#2563eb" stroke-width="1.3" stroke-dasharray="4,3"/>
                            ${extLineSvg}
                            <polygon points="${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y}" fill="#f8fafc" fill-opacity="0.85" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
                            <line x1="${pA.x}" y1="${pA.y}" x2="${pH.x}" y2="${pH.y}" stroke="#d97706" stroke-width="1.3" stroke-dasharray="3,2"/>
                            ${rightAngleMark(pH, pA, dirSidePt, 6.5)}
                            <line x1="${pO.x}" y1="${pO.y}" x2="${pB.x}" y2="${pB.y}" stroke="#059669" stroke-width="1.3" stroke-dasharray="3,2"/>
                            <line x1="${pO.x}" y1="${pO.y}" x2="${pC.x}" y2="${pC.y}" stroke="#059669" stroke-width="1.3" stroke-dasharray="3,2"/>
                            <circle cx="${pO.x}" cy="${pO.y}" r="3.8" fill="#dc2626"/>
                        </g>
                        ${makeLabel(lblA, "A")}
                        ${makeLabel(lblB, "B")}
                        ${makeLabel(lblC, "C")}
                        ${makeLabel(lblO, "O", "#dc2626")}
                        ${makeLabel(lblH, "h", "#d97706", true)}
                    </svg>
                </div>
                <div style="margin-top: 4px;">
                    (1) $\\angle \\mathrm{BAC}$ の大きさを求めなさい。<br>
                    (2) $\\triangle \\mathrm{ABC}$ の外接円の半径 $R$ を求めなさい。
                </div>
            `,
            answer: `(1) $\\angle \\mathrm{BAC} = ${angBAC}^\\circ$<br>(2) $R = ${rTex}$`,
            explanation: `
                ${step1Html}

                <strong>(2)</strong><br>
                頂点 $\\mathrm{A}$ から辺 $\\mathrm{BC}$ に下ろした垂線の足を $\\mathrm{H}$、高さを $h = \\mathrm{AH}$ とする。<br>
                $\\mathrm{BH} = x$ とおくと $\\mathrm{CH} = ${chExprTex}$。<br>
                左側の直角三角形と右側の直角三角形それぞれで三平方の定理より $h^2$ を表すと、<br>
                ・左側：$h^2 = ${bSqTex} - x^2$<br>
                ・右側：$h^2 = ${aSqTex} - (${chExprTex})^2$<br>
                $h^2$ が等しいので、<br>
                $$${bSqTex} - x^2 = ${aSqTex} - (${chExprTex})^2$$<br>
                これを解くと $x = ${xTex}$。よって、$\\mathrm{BH} = ${xTex}$、$\\mathrm{CH} = ${chTex}$ となり、<br>
                $$h^2 = ${aSqTex} - ${chSqTex} = ${hSqValTex}$$<br>
                $h > 0$ より $h = ${hTex}$。<br><br>
                したがって、外接円の半径の公式 $R = \\frac{a \\times b}{2h}$（$a = \\mathrm{AC} = ${sideATex}$、$b = \\mathrm{AB} = ${sideBTex}$、$h = ${hTex}$）に代入すると、<br>
                $$R = ${rCalc}$$<br>
                <strong>答え：(1) $${angBAC}^\\circ$　(2) $${rTex}$</strong>
            `
        };
    }
},
"三角形の傍心": {
    level: "難関私立",
    formula: `
        <div>三角形の1つの<strong>内角の二等分線</strong>と、他の2つの<strong>外角の二等分線</strong>は1点に交わる。その点を<strong>傍心</strong>と呼ぶ。<br>
        傍心はその三角形の1辺と他の2辺の延長線に接する<strong>傍接円の中心</strong>である。</div>

        <div style="margin: 10px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
            <svg viewBox="0 -116 385 296" width="385" height="296" style="max-width: 100%; height: auto;">
                <!--
                    厳密SVG座標（y軸下向き正）:
                    A = (100, 36), B = (50, 146), C = (182, 146)
                    内接円: 中心 I = (107.81, 108.77), 半径 r = 37.23, BC上の垂線の足 P = (107.81, 146)
                    辺 AC に接する傍接円: 中心 Ib = (245.03, 20.43), 半径 rb = 125.57, BC延長線上の垂線の足 Q = (245.03, 146)
                -->
                <!-- 辺 BC とその延長線 -->
                <line x1="28" y1="146" x2="360" y2="146" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="3,2"/>

                <!-- 辺 BA の延長線 -->
                <line x1="50" y1="146" x2="155" y2="-85" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="2,2"/>

                <!-- 角の二等分線（すべて黒の破線；角 A の外角の二等分線は頂点 A からの半直線） -->
                <line x1="50" y1="146" x2="270" y2="4.35" stroke="#0f172a" stroke-width="1.2" stroke-dasharray="4,3"/>
                <line x1="100" y1="36" x2="275" y2="17.21" stroke="#0f172a" stroke-width="1.2" stroke-dasharray="4,3"/>
                <line x1="182" y1="146" x2="260" y2="-9.38" stroke="#0f172a" stroke-width="1.2" stroke-dasharray="4,3"/>

                <!-- 内接円（濃い青の実線） -->
                <circle cx="107.81" cy="108.77" r="37.23" fill="#dbeafe" fill-opacity="0.35" stroke="#1e3a8a" stroke-width="2.2"/>

                <!-- 傍接円（赤の実線） -->
                <circle cx="245.03" cy="20.43" r="125.57" fill="#fef2f2" fill-opacity="0.35" stroke="#dc2626" stroke-width="1.4"/>

                <!-- 不等辺三角形 ABC -->
                <polygon points="100,36 50,146 182,146" fill="#f8fafc" fill-opacity="0.7" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>

                <!-- 垂線 IP（足 P）と垂線 IbQ（足 Q） -->
                <line x1="107.81" y1="108.77" x2="107.81" y2="146" stroke="#1e3a8a" stroke-width="1.4"/>
                <polyline points="107.81,139.5 114.31,139.5 114.31,146" fill="none" stroke="#1e3a8a" stroke-width="1.2"/>

                <line x1="245.03" y1="20.43" x2="245.03" y2="146" stroke="#dc2626" stroke-width="1.3"/>
                <polyline points="245.03,139.5 251.53,139.5 251.53,146" fill="none" stroke="#dc2626" stroke-width="1.1"/>

                <!-- 等角マーク：角 B の二等分線（・マーク） -->
                <circle cx="61.77" cy="132.38" r="2" fill="#0f172a"/>
                <circle cx="67.27" cy="140.92" r="2" fill="#0f172a"/>

                <!-- 等角マーク：角 A の外角の二等分線（×マーク：上下それぞれの角の二等分線上に配置） -->
                <g transform="translate(117.83, 23.12)" stroke="#0f172a" stroke-width="1.2">
                    <line x1="-2.2" y1="-2.2" x2="2.2" y2="2.2"/>
                    <line x1="2.2" y1="-2.2" x2="-2.2" y2="2.2"/>
                </g>
                <g transform="translate(120.16, 44.81)" stroke="#0f172a" stroke-width="1.2">
                    <line x1="-2.2" y1="-2.2" x2="2.2" y2="2.2"/>
                    <line x1="2.2" y1="-2.2" x2="-2.2" y2="2.2"/>
                </g>

                <!-- 等角マーク：角 C の外角の二等分線（△マーク） -->
                <polygon points="195.62,135.35 193.02,139.85 198.22,139.85" fill="none" stroke="#0f172a" stroke-width="1.1"/>
                <polygon points="180.60,127.81 178.00,132.31 183.20,132.31" fill="none" stroke="#0f172a" stroke-width="1.1"/>

                <!-- 点 I, Ib, P, Q -->
                <circle cx="107.81" cy="108.77" r="3" fill="#1e3a8a"/>
                <circle cx="245.03" cy="20.43" r="3.5" fill="#dc2626"/>
                <circle cx="107.81" cy="146" r="2.6" fill="#1e3a8a"/>
                <circle cx="245.03" cy="146" r="2.6" fill="#dc2626"/>

                <!-- ラベル -->
                <text x="88" y="32" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">A</text>
                <text x="38" y="142" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">B</text>
                <text x="182" y="162" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">C</text>
                <text x="99" y="106" font-size="12" font-weight="bold" text-anchor="end" fill="#1e3a8a">I</text>
                <text x="107.81" y="159" font-size="12" font-weight="bold" text-anchor="middle" fill="#1e3a8a">P</text>
                <text x="254" y="18" font-size="12" font-weight="bold" text-anchor="start" fill="#dc2626">I<tspan dy="3" font-size="9">b</tspan></text>
                <text x="245.03" y="159" font-size="12" font-weight="bold" text-anchor="middle" fill="#dc2626">Q</text>
            </svg>
        </div>

        <div style="margin-top: 6px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
            <div><strong>【傍心の性質と半径の求め方のポイント】</strong></div>
            <div style="margin-top: 4px;">
                ・円の外部の1点から円に引いた2本の接線の長さは等しいので $\\mathrm{AB}=a$、$\\mathrm{BC}=b$、$\\mathrm{AC}=c$ とすると $\\mathrm{BQ}=\\frac{a+b+c}{2}$ となる。<br>
                ・傍接円半径 $R$ は $\\triangle \\mathrm{ABC}+\\triangle \\mathrm{I}_b\\mathrm{AC}=\\triangle \\mathrm{I}_b\\mathrm{AB}+\\triangle \\mathrm{I}_b\\mathrm{BC}$ より<br>
                　$\\frac{1}{2}R(a+b-c)=\\triangle \\mathrm{ABC}$ で求めることができる。<br>
                また内接円の中心 $\\mathrm{I}$ から下ろした垂線と傍接円の中心 $\\mathrm{I}_b$ から下ろした垂線との相似から、内接円半径 $r$ と傍接円半径 $R$ を結びつけられる。<br>
                よって内接円半径を $r$ とすると $\\triangle \\mathrm{BIP}\\sim\\triangle \\mathrm{BI}_b\\mathrm{Q}$ と接線の公式より $r:R=\\mathrm{BP}:\\mathrm{BQ}=\\frac{a+b-c}{2}:\\frac{a+b+c}{2}$
            </div>
        </div>
    `,
    selfCheck: [
        '内接円の接線の公式 AF = (AB + AC - BC) / 2 を使って、頂点 A からの接線の長さ AF を素早く求められているか？',
        '内接円までの接線の長さの公式において、頂点 A をはさむ2辺を足して向かい合う対辺 BC を引く対応を正しく覚えられているか？',
        '傍接円の接線の公式（傍接円と接しない頂点から傍接円の接点までの長さ AQ / BP / CP が半周長 (AB + BC + CA) / 2 と一致すること）を使えているか？',
        '相似な直角三角形（△AIF ∽ △AI_aQ、△BIF ∽ △BI_bP、△CID ∽ △CI_cP）の相似比を最も簡単な整数の比にして、内接円半径 r から傍接円半径 R を計算できているか？'
    ],
    generateRandom: function () {
        const fracHtml = (num, den) =>
            `<span style="display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; line-height: 1.05; margin: 0 2px; font-size: 0.9em;"><span style="padding: 0 2px;">${num}</span><span style="border-top: 1px solid currentColor; width: 100%; text-align: center; padding: 1px 2px 0;">${den}</span></span>`;

        // 最大公約数と分数の約分ヘルパー
        const gcd = (x, y) => {
            x = Math.abs(x);
            y = Math.abs(y);
            while (y) {
                const t = y;
                y = x % y;
                x = t;
            }
            return x || 1;
        };

        const formatReducedFraction = (coeffNum, radPart, denNum) => {
            const g = gcd(coeffNum, denNum);
            const n = coeffNum / g;
            const d = denNum / g;
            const numStr = radPart ? (n === 1 ? radPart : `${n}${radPart}`) : `${n}`;
            if (d === 1) return numStr;
            return fracHtml(numStr, `${d}`);
        };

        // 相似比を最も簡単な整数の比で表すヘルパー
        const formatRatioSteps = (leftVal, rightVal) => {
            const g = gcd(leftVal, rightVal);
            const simpLeft = leftVal / g;
            const simpRight = rightVal / g;
            const text = g > 1
                ? `${leftVal} : ${rightVal} = ${simpLeft} : ${simpRight}`
                : `${leftVal} : ${rightVal}`;
            return { simpLeft, simpRight, text };
        };

        const triCases = [
            {
                aNum: 5, bNum: 12, cNum: 13, sVal: 15, areaStr: "30",
                rCoeff: 2, rDen: 1, radStr: "",
                areaCalcHtml: `5² + 12² = 13² より ∠C = 90° の直角三角形なので、辺 BC を底辺、辺 AC を高さとして<br>S = 5 × 12 × ${fracHtml("1", "2")} = <strong>30</strong>`
            },
            {
                aNum: 8, bNum: 15, cNum: 17, sVal: 20, areaStr: "60",
                rCoeff: 3, rDen: 1, radStr: "",
                areaCalcHtml: `8² + 15² = 17² より ∠C = 90° の直角三角形なので、辺 BC を底辺、辺 AC を高さとして<br>S = 8 × 15 × ${fracHtml("1", "2")} = <strong>60</strong>`
            },
            {
                aNum: 10, bNum: 17, cNum: 21, sVal: 24, areaStr: "84",
                rCoeff: 7, rDen: 2, radStr: "",
                areaCalcHtml: `頂点 A から辺 BC に垂線 AH を下ろし、BH = x とすると CH = 10 - x。<br>21² - x² = 17² - (10 - x)² より 441 - x² = 289 - (100 - 20x + x²) → 20x = 252 → x = ${fracHtml("63", "5")}<br>直角三角形 ABH において BH : AB = ${fracHtml("63", "5")} : 21 = 3 : 5 なので、三平方の定理より AH の比は √(5² - 3²) = 4（BH : AH : AB = 3 : 4 : 5）。<br>よって、AH = 21 × ${fracHtml("4", "5")} = ${fracHtml("84", "5")} となり、S = 10 × ${fracHtml("84", "5")} × ${fracHtml("1", "2")} = <strong>84</strong>`
            },
            {
                aNum: 6, bNum: 25, cNum: 29, sVal: 30, areaStr: "60",
                rCoeff: 2, rDen: 1, radStr: "",
                areaCalcHtml: `頂点 A から辺 BC の延長線上に垂線 AH を下ろし、CH = x とすると BH = 6 + x。<br>25² - x² = 29² - (6 + x)² より 625 - x² = 841 - (36 + 12x + x²) → 12x = 180 → x = 15<br>直角三角形 ACH において CH : AC = 15 : 25 = 3 : 5 なので、三平方の定理より AH の比は √(5² - 3²) = 4（CH : AH : AC = 3 : 4 : 5）。<br>よって、AH = 25 × ${fracHtml("4", "5")} = 20 となり、S = 6 × 20 × ${fracHtml("1", "2")} = <strong>60</strong>`
            },
            {
                aNum: 7, bNum: 8, cNum: 9, sVal: 12, areaStr: "12√5",
                rCoeff: 1, rDen: 1, radStr: "√5",
                areaCalcHtml: `頂点 A から辺 BC に垂線 AH を下ろし、BH = x とすると CH = 7 - x。<br>9² - x² = 8² - (7 - x)² より 81 - x² = 64 - (49 - 14x + x²) → 14x = 66 → x = ${fracHtml("33", "7")}<br>直角三角形 ABH において BH : AB = ${fracHtml("33", "7")} : 9 = 11 : 21 なので、三平方の定理より AH の比は √(21² - 11²) = √(441 - 121) = 8√5（BH : AH : AB = 11 : 8√5 : 21）。<br>よって、AH = 9 × ${fracHtml("8√5", "21")} = ${fracHtml("24√5", "7")} となり、S = 7 × ${fracHtml("24√5", "7")} × ${fracHtml("1", "2")} = <strong>12√5</strong>`
            }
        ];

        // 傍接円が接する辺の3パターン（BC / AC / AB）
        // それぞれ「傍接円と接しない頂点（A / B / C）から傍接円の接点（Q / P / P）までの長さ」を求める
        const touchModes = ["BC", "AC", "AB"];
        const touchSide = touchModes[Math.floor(Math.random() * touchModes.length)];
        const tri = triCases[Math.floor(Math.random() * triCases.length)];
        const { aNum, bNum, cNum, sVal, areaStr, rCoeff, rDen, radStr, areaCalcHtml } = tri;

        const aTex = `${aNum}`;
        const bTex = `${bNum}`;
        const cTex = `${cNum}`;
        const rStr = formatReducedFraction(rCoeff, radStr, rDen);

        // 数学座標: C=(0,0), B=(aNum,0), A=(axMath, ayMath) (ayMath > 0)
        const cosC = (aNum * aNum + bNum * bNum - cNum * cNum) / (2 * aNum * bNum);
        const clampedCosC = Math.max(-0.95, Math.min(0.95, cosC));
        const sinC = Math.sqrt(Math.max(0.05, 1 - clampedCosC * clampedCosC));
        const axMath = bNum * clampedCosC;
        const ayMath = bNum * sinC;

        const pAMath = { x: axMath, y: ayMath };
        const pBMath = { x: aNum, y: 0 };
        const pCMath = { x: 0, y: 0 };

        // 内心 I と半径 r
        const perimeter = aNum + bNum + cNum;
        const ixMath = (aNum * axMath + bNum * aNum + cNum * 0) / perimeter;
        const iyMath = (aNum * ayMath) / perimeter;
        const rMath = iyMath;

        // 点から直線への正射影（垂線の足）
        const projectOntoLine = (pt, lineP1, lineP2) => {
            const dx = lineP2.x - lineP1.x;
            const dy = lineP2.y - lineP1.y;
            const lenSq = dx * dx + dy * dy || 1;
            const t = ((pt.x - lineP1.x) * dx + (pt.y - lineP1.y) * dy) / lenSq;
            return {
                x: lineP1.x + t * dx,
                y: lineP1.y + t * dy
            };
        };

        // 内接円と辺 AB の接点 F、および辺 BC の接点 D
        const fMath = projectOntoLine({ x: ixMath, y: iyMath }, pAMath, pBMath);
        const dMath = projectOntoLine({ x: ixMath, y: iyMath }, pBMath, pCMath);
        const afVal = sVal - aNum; // (AB + AC - BC) / 2
        const bfVal = sVal - bNum; // (AB + BC - AC) / 2
        const cdVal = sVal - cNum; // (BC + CA - AB) / 2

        // 傍接円ごとの中心・半径・接点設定
        let exSub = "a";
        let rExSymbol = "r_a";
        let iExSubHtml = `I<tspan dy="3" font-size="9">a</tspan>`;
        let iExTextHtml = `I<sub>a</sub>`;
        let rExTextHtml = `r<sub>a</sub>`;
        let iaxMath = 0;
        let iayMath = 0;
        let raMath = 0;

        // (3) で求める接線名（AQ / BP / CP）とその値（いずれも半周長 sVal）
        let targetSegName = "AQ";
        const targetSegVal = sVal;
        let q3QuestionHtml = "";
        let q3ExplainHtml = "";
        let q4ExplainHtml = "";
        let raFinalStr = "";
        let raCalcHtml = "";
        let showIncenterD = false;

        if (touchSide === "BC") {
            exSub = "a";
            rExSymbol = "r_a";
            iExSubHtml = `I<tspan dy="3" font-size="9">a</tspan>`;
            iExTextHtml = `I<sub>a</sub>`;
            rExTextHtml = `r<sub>a</sub>`;

            const denom = -aNum + bNum + cNum;
            iaxMath = (-aNum * axMath + bNum * aNum + cNum * 0) / denom;
            iayMath = (-aNum * ayMath) / denom;
            raMath = Math.abs(iayMath);

            targetSegName = "AQ";
            const ratioInfo = formatRatioSteps(afVal, targetSegVal);
            raFinalStr = formatReducedFraction(rCoeff * ratioInfo.simpRight, radStr, rDen * ratioInfo.simpLeft);
            const simpFrac = fracHtml(`${ratioInfo.simpRight}`, `${ratioInfo.simpLeft}`);
            raCalcHtml = `${rStr} × ${simpFrac} = ${raFinalStr}`;

            q3QuestionHtml = `(3) 辺 $\\mathrm{BC}$ に接する傍接円と辺 $\\mathrm{AB}$ の延長線との接点を $\\mathrm{Q}$ とするとき、$\\mathrm{AQ}$ の長さを求めなさい。`;
            q3ExplainHtml = `
                傍接円の接線の公式より、辺 BC に接する傍接円において、傍接円と接しない頂点 A から接点 Q までの長さ AQ は半周長と等しくなる。<br>
                AQ = ${fracHtml("AB + BC + CA", "2")} = ${fracHtml(`${cTex} + ${aTex} + ${bTex}`, "2")} = ${fracHtml(`${2 * sVal}`, "2")} = <strong>${targetSegVal}</strong>。
            `;
            q4ExplainHtml = `
                内接円の中心 I から辺 AB に下ろした垂線の足を F（IF = r = ${rStr}）、傍接円の中心 ${iExTextHtml} から辺 AB の延長線に下ろした垂線の足を Q（${iExTextHtml}Q = ${rExTextHtml}）とすると、<br>
                △AIF ∽ △A${iExTextHtml}Q であり、相似比は接線の長さより<br>
                AF : AQ = ${ratioInfo.text}<br>
                よって、r : ${rExTextHtml} = ${ratioInfo.simpLeft} : ${ratioInfo.simpRight} となるので、<br>
                ${rExTextHtml} = ${raCalcHtml}
            `;
        } else if (touchSide === "AC") {
            exSub = "b";
            rExSymbol = "r_b";
            iExSubHtml = `I<tspan dy="3" font-size="9">b</tspan>`;
            iExTextHtml = `I<sub>b</sub>`;
            rExTextHtml = `r<sub>b</sub>`;

            const denom = aNum - bNum + cNum;
            iaxMath = (aNum * axMath - bNum * aNum + cNum * 0) / denom;
            iayMath = (aNum * ayMath) / denom;
            raMath = Math.abs(iayMath);

            targetSegName = "BP";
            showIncenterD = true;
            const ratioInfo = formatRatioSteps(bfVal, targetSegVal);
            raFinalStr = formatReducedFraction(rCoeff * ratioInfo.simpRight, radStr, rDen * ratioInfo.simpLeft);
            const simpFrac = fracHtml(`${ratioInfo.simpRight}`, `${ratioInfo.simpLeft}`);
            raCalcHtml = `${rStr} × ${simpFrac} = ${raFinalStr}`;

            q3QuestionHtml = `(3) 辺 $\\mathrm{AC}$ に接する傍接円と辺 $\\mathrm{BC}$ の延長線との接点を $\\mathrm{P}$ とするとき、$\\mathrm{BP}$ の長さを求めなさい。`;
            q3ExplainHtml = `
                傍接円の接線の公式より、辺 AC に接する傍接円において、傍接円と接しない頂点 B から接点 P までの長さ BP は半周長と等しくなる。<br>
                BP = ${fracHtml("AB + BC + CA", "2")} = ${fracHtml(`${cTex} + ${aTex} + ${bTex}`, "2")} = ${fracHtml(`${2 * sVal}`, "2")} = <strong>${targetSegVal}</strong>。
            `;
            q4ExplainHtml = `
                内接円の接線の公式より、頂点 B から辺 BC 上の接点 D までの長さは BD = ${fracHtml("AB + BC - AC", "2")} = ${fracHtml(`${cTex} + ${aTex} - ${bTex}`, "2")} = ${bfVal}（または BD = BF = AB - AF = ${cTex} - ${afVal} = ${bfVal}）。<br>
                内接円の中心 I から辺 BC に下ろした垂線の足を D（ID = r = ${rStr}）、傍接円の中心 ${iExTextHtml} から辺 BC の延長線に下ろした垂線の足を P（${iExTextHtml}P = ${rExTextHtml}）とすると、<br>
                △BID ∽ △B${iExTextHtml}P であり、相似比は接線の長さより<br>
                BD : BP = ${ratioInfo.text}<br>
                よって、r : ${rExTextHtml} = ${ratioInfo.simpLeft} : ${ratioInfo.simpRight} となるので、<br>
                ${rExTextHtml} = ${raCalcHtml}
            `;
        } else {
            exSub = "c";
            rExSymbol = "r_c";
            iExSubHtml = `I<tspan dy="3" font-size="9">c</tspan>`;
            iExTextHtml = `I<sub>c</sub>`;
            rExTextHtml = `r<sub>c</sub>`;

            const denom = aNum + bNum - cNum;
            iaxMath = (aNum * axMath + bNum * aNum - cNum * 0) / denom;
            iayMath = (aNum * ayMath) / denom;
            raMath = Math.abs(iayMath);

            targetSegName = "CP";
            showIncenterD = true;
            const ratioInfo = formatRatioSteps(cdVal, targetSegVal);
            raFinalStr = formatReducedFraction(rCoeff * ratioInfo.simpRight, radStr, rDen * ratioInfo.simpLeft);
            const simpFrac = fracHtml(`${ratioInfo.simpRight}`, `${ratioInfo.simpLeft}`);
            raCalcHtml = `${rStr} × ${simpFrac} = ${raFinalStr}`;

            q3QuestionHtml = `(3) 辺 $\\mathrm{AB}$ に接する傍接円と辺 $\\mathrm{BC}$ の延長線との接点を $\\mathrm{P}$ とするとき、$\\mathrm{CP}$ の長さを求めなさい。`;
            q3ExplainHtml = `
                傍接円の接線の公式より、辺 AB に接する傍接円において、傍接円と接しない頂点 C から接点 P までの長さ CP は半周長と等しくなる。<br>
                CP = ${fracHtml("AB + BC + CA", "2")} = ${fracHtml(`${cTex} + ${aTex} + ${bTex}`, "2")} = ${fracHtml(`${2 * sVal}`, "2")} = <strong>${targetSegVal}</strong>。
            `;
            q4ExplainHtml = `
                内接円の接線の公式より、頂点 C から辺 BC 上の接点 D までの長さは CD = ${fracHtml("BC + CA - AB", "2")} = ${fracHtml(`${aTex} + ${bTex} - ${cTex}`, "2")} = ${cdVal}。<br>
                内接円の中心 I から辺 BC に下ろした垂線の足を D（ID = r = ${rStr}）、傍接円の中心 ${iExTextHtml} から辺 BC の延長線に下ろした垂線の足を P（${iExTextHtml}P = ${rExTextHtml}）とすると、<br>
                △CID ∽ △C${iExTextHtml}P であり、相似比は接線の長さより<br>
                CD : CP = ${ratioInfo.text}<br>
                よって、r : ${rExTextHtml} = ${ratioInfo.simpLeft} : ${ratioInfo.simpRight} となるので、<br>
                ${rExTextHtml} = ${raCalcHtml}
            `;
        }

        // 傍接円の各辺（またはその延長）との接点
        const pContactMath = projectOntoLine({ x: iaxMath, y: iayMath }, pBMath, pCMath);
        const qContactMath = projectOntoLine({ x: iaxMath, y: iayMath }, pAMath, pBMath);
        const rContactMath = projectOntoLine({ x: iaxMath, y: iayMath }, pAMath, pCMath);

        // 三角形 ABC をしっかり大きく表示するため、スケールは三角形＋接点・傍心を中心に算出
        const focusPtsMath = [
            pAMath, pBMath, pCMath,
            fMath, dMath, pContactMath, qContactMath, rContactMath,
            { x: ixMath, y: iyMath },
            { x: iaxMath, y: iayMath }
        ];
        let minMX = Infinity, maxMX = -Infinity, minMY = Infinity, maxMY = -Infinity;
        focusPtsMath.forEach(p => {
            if (p.x < minMX) minMX = p.x;
            if (p.x > maxMX) maxMX = p.x;
            if (p.y < minMY) minMY = p.y;
            if (p.y > maxMY) maxMY = p.y;
        });

        const triMinX = Math.min(pAMath.x, pBMath.x, pCMath.x);
        const triMaxX = Math.max(pAMath.x, pBMath.x, pCMath.x);
        const triMinY = Math.min(pAMath.y, pBMath.y, pCMath.y);
        const triMaxY = Math.max(pAMath.y, pBMath.y, pCMath.y);
        const triSpanX = Math.max(1, triMaxX - triMinX);
        const triSpanY = Math.max(1, triMaxY - triMinY);

        const spanX = Math.max(1, maxMX - minMX);
        const spanY = Math.max(1, maxMY - minMY);

        const scaleFromTri = Math.min(220 / triSpanX, 165 / triSpanY);
        const scaleFromAll = Math.min(280 / spanX, 200 / spanY);
        const scale = Math.max(scaleFromAll, scaleFromTri * 0.85);

        const centerMX = (minMX + maxMX) / 2;
        const centerMY = (minMY + maxMY) / 2;
        const SVG_CX = 190;
        const SVG_CY = 140;

        const toSvg = (mx, my) => ({
            x: Number((SVG_CX + (mx - centerMX) * scale).toFixed(2)),
            y: Number((SVG_CY - (my - centerMY) * scale).toFixed(2))
        });

        const pA = toSvg(axMath, ayMath);
        const pB = toSvg(aNum, 0);
        const pC = toSvg(0, 0);
        const pI = toSvg(ixMath, iyMath);
        const pIa = toSvg(iaxMath, iayMath);
        const pF = toSvg(fMath.x, fMath.y);
        const pD = toSvg(dMath.x, dMath.y);
        const pP = toSvg(pContactMath.x, pContactMath.y);
        const pQ = toSvg(qContactMath.x, qContactMath.y);
        const pR = toSvg(rContactMath.x, rContactMath.y);

        const rSvg = Number((rMath * scale).toFixed(2));
        const raSvg = Number((raMath * scale).toFixed(2));

        // 直線 AB・直線 AC の延長線
        const buildLineSegment = (ptsOnLine, extraPx = 14) => {
            let pMin = ptsOnLine[0];
            let pMax = ptsOnLine[0];
            let maxDist = -1;
            for (let i = 0; i < ptsOnLine.length; i++) {
                for (let j = i + 1; j < ptsOnLine.length; j++) {
                    const d = Math.hypot(ptsOnLine[j].x - ptsOnLine[i].x, ptsOnLine[j].y - ptsOnLine[i].y);
                    if (d > maxDist) {
                        maxDist = d;
                        pMin = ptsOnLine[i];
                        pMax = ptsOnLine[j];
                    }
                }
            }
            const dx = pMax.x - pMin.x;
            const dy = pMax.y - pMin.y;
            const len = Math.hypot(dx, dy) || 1;
            return {
                x1: Number((pMin.x - (dx / len) * extraPx).toFixed(2)),
                y1: Number((pMin.y - (dy / len) * extraPx).toFixed(2)),
                x2: Number((pMax.x + (dx / len) * extraPx).toFixed(2)),
                y2: Number((pMax.y + (dy / len) * extraPx).toFixed(2))
            };
        };

        const lineABSeg = buildLineSegment([pA, pB, pQ], 14);
        const lineACSeg = buildLineSegment([pA, pC, pR], 14);
        const minBcX = Math.min(pB.x, pC.x, pP.x) - 16;
        const maxBcX = Math.max(pB.x, pC.x, pP.x) + 16;

        // 直角マーク生成ヘルパー
        const rightAngleMark = (vertex, pt1, pt2, size = 5.5, color = "#0f172a") => {
            const v1x = pt1.x - vertex.x;
            const v1y = pt1.y - vertex.y;
            const l1 = Math.hypot(v1x, v1y) || 1;
            const u1x = (v1x / l1) * size;
            const u1y = (v1y / l1) * size;

            const v2x = pt2.x - vertex.x;
            const v2y = pt2.y - vertex.y;
            const l2 = Math.hypot(v2x, v2y) || 1;
            const u2x = (v2x / l2) * size;
            const u2y = (v2y / l2) * size;

            const q1 = `${(vertex.x + u1x).toFixed(2)},${(vertex.y + u1y).toFixed(2)}`;
            const q2 = `${(vertex.x + u1x + u2x).toFixed(2)},${(vertex.y + u1y + u2y).toFixed(2)}`;
            const q3 = `${(vertex.x + u2x).toFixed(2)},${(vertex.y + u2y).toFixed(2)}`;
            return `<polyline points="${q1} ${q2} ${q3}" fill="none" stroke="${color}" stroke-width="1.1"/>`;
        };

        // ラベルを直線 AB / AC / BC の外側にずらすヘルパー
        const offsetFromLine = (pt, lineStart, lineEnd, dist = 11) => {
            const lx = lineEnd.x - lineStart.x;
            const ly = lineEnd.y - lineStart.y;
            const llen = Math.hypot(lx, ly) || 1;
            let nx = -ly / llen;
            let ny = lx / llen;
            const gx = (pA.x + pB.x + pC.x) / 3;
            const gy = (pA.y + pB.y + pC.y) / 3;
            const dotToG = (pt.x + nx * 5 - gx) * nx + (pt.y + ny * 5 - gy) * ny;
            if (dotToG > 0) {
                nx = -nx;
                ny = -ny;
            }
            return {
                x: Number((pt.x + nx * dist).toFixed(2)),
                y: Number((pt.y + ny * dist).toFixed(2))
            };
        };

        const lblF = offsetFromLine(pF, pA, pB, 10);
        const lblD = { x: pD.x, y: Number((pD.y + 11).toFixed(2)) };
        const lblQ = offsetFromLine(pQ, pA, pB, 11);
        const lblR = offsetFromLine(pR, pA, pC, 11);
        const lblP = { x: pP.x, y: Number((pP.y + (touchSide === "BC" ? -11 : 12)).toFixed(2)) };

        // 傍心ラベル位置（円の中心から外側寄り）
        const lblIa = {
            x: pIa.x,
            y: Number((pIa.y + (touchSide === "BC" ? 13 : -12)).toFixed(2))
        };

        // viewBox を全描画要素・円周・ラベルから動的に算出して見切れを防止
        const viewBoxPts = [
            { x: minBcX, y: pB.y },
            { x: maxBcX, y: pB.y },
            { x: lineABSeg.x1, y: lineABSeg.y1 },
            { x: lineABSeg.x2, y: lineABSeg.y2 },
            { x: lineACSeg.x1, y: lineACSeg.y1 },
            { x: lineACSeg.x2, y: lineACSeg.y2 },
            pA, pB, pC, pI, pIa, pF, pD, pP, pQ, pR,
            lblF, lblD, lblQ, lblR, lblP, lblIa,
            { x: pI.x - rSvg, y: pI.y - rSvg },
            { x: pI.x + rSvg, y: pI.y + rSvg },
            { x: pIa.x - raSvg, y: pIa.y - raSvg },
            { x: pIa.x + raSvg, y: pIa.y + raSvg },
            { x: pA.x, y: pA.y - 18 },
            { x: pB.x + 18, y: pB.y + 16 },
            { x: pC.x - 18, y: pC.y + 16 }
        ];
        let minVX = Infinity, maxVX = -Infinity, minVY = Infinity, maxVY = -Infinity;
        viewBoxPts.forEach(p => {
            if (p.x < minVX) minVX = p.x;
            if (p.x > maxVX) maxVX = p.x;
            if (p.y < minVY) minVY = p.y;
            if (p.y > maxVY) maxVY = p.y;
        });
        const pad = 16;
        const viewBox = `${Math.floor(minVX - pad)} ${Math.floor(minVY - pad)} ${Math.ceil(maxVX - minVX + pad * 2)} ${Math.ceil(maxVY - minVY + pad * 2)}`;

        // 相似の基準頂点（接しない頂点 A / B / C）への補助線
        const simVertex = touchSide === "BC" ? pA : (touchSide === "AC" ? pB : pC);
        const aRefForQ = Math.hypot(pQ.x - pA.x, pQ.y - pA.y) > 4 ? pA : pB;
        const bRefForP = Math.hypot(pP.x - pB.x, pP.y - pB.y) > 4 ? pB : pC;

        const incenterDElements = showIncenterD
            ? `
                <line x1="${pI.x}" y1="${pI.y}" x2="${pD.x}" y2="${pD.y}" stroke="#2563eb" stroke-width="1.3"/>
                ${rightAngleMark(pD, pI, pB, 5, "#2563eb")}
                <circle cx="${pD.x}" cy="${pD.y}" r="2.8" fill="#2563eb"/>
                <text x="${lblD.x}" y="${lblD.y}" font-size="11" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#2563eb">D</text>
            `
            : "";

        return {
            problem: `
                <div>
                    図は $\\triangle \\mathrm{ABC}$ と、その内接円（中心 $\\mathrm{I}$、半径 $r$）および辺 $\\mathrm{${touchSide}}$ に接する傍接円（中心 $\\mathrm{I}_${exSub}$、半径 $${rExSymbol}$）である。<br>
                    $\\mathrm{BC} = ${aTex}$、$\\mathrm{AC} = ${bTex}$、$\\mathrm{AB} = ${cTex}$ とするとき、次の問いに答えなさい。
                </div>
                <div style="margin: 10px 0 8px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
                    <svg viewBox="${viewBox}" style="width: 100%; max-width: 380px; height: auto;">
                        <!-- 辺 BC とその延長線 -->
                        <line x1="${minBcX}" y1="${pB.y}" x2="${maxBcX}" y2="${pB.y}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="3,2"/>

                        <!-- 直線 AB, AC とその延長線 -->
                        <line x1="${lineABSeg.x1}" y1="${lineABSeg.y1}" x2="${lineABSeg.x2}" y2="${lineABSeg.y2}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="2,2"/>
                        <line x1="${lineACSeg.x1}" y1="${lineACSeg.y1}" x2="${lineACSeg.x2}" y2="${lineACSeg.y2}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="2,2"/>

                        <!-- 内接円 -->
                        <circle cx="${pI.x}" cy="${pI.y}" r="${rSvg}" fill="#eff6ff" fill-opacity="0.4" stroke="#2563eb" stroke-width="1.4"/>

                        <!-- 傍接円 -->
                        <circle cx="${pIa.x}" cy="${pIa.y}" r="${raSvg}" fill="#fef2f2" fill-opacity="0.35" stroke="#dc2626" stroke-width="1.4" stroke-dasharray="4,3"/>

                        <!-- 相似三角形の補助線（接しない頂点から中心 I, I_ex へ） -->
                        <line x1="${simVertex.x}" y1="${simVertex.y}" x2="${pI.x}" y2="${pI.y}" stroke="#2563eb" stroke-width="1.1" stroke-dasharray="2,2"/>
                        <line x1="${simVertex.x}" y1="${simVertex.y}" x2="${pIa.x}" y2="${pIa.y}" stroke="#dc2626" stroke-width="1.1" stroke-dasharray="2,2"/>
                        <line x1="${pI.x}" y1="${pI.y}" x2="${pF.x}" y2="${pF.y}" stroke="#2563eb" stroke-width="1.3"/>
                        ${incenterDElements}
                        <line x1="${pIa.x}" y1="${pIa.y}" x2="${pQ.x}" y2="${pQ.y}" stroke="#dc2626" stroke-width="${touchSide === "BC" ? "1.3" : "1.2"}" ${touchSide === "BC" ? "" : 'stroke-dasharray="2,2"'}/>
                        <line x1="${pIa.x}" y1="${pIa.y}" x2="${pP.x}" y2="${pP.y}" stroke="#dc2626" stroke-width="${touchSide === "BC" ? "1.2" : "1.3"}" ${touchSide === "BC" ? 'stroke-dasharray="2,2"' : ""}/>
                        <line x1="${pIa.x}" y1="${pIa.y}" x2="${pR.x}" y2="${pR.y}" stroke="#dc2626" stroke-width="1.2" stroke-dasharray="2,2"/>

                        <!-- 直角マーク（F, Q, P） -->
                        ${rightAngleMark(pF, pI, pA, 5, "#2563eb")}
                        ${rightAngleMark(pQ, pIa, aRefForQ, 5.5, "#dc2626")}
                        ${rightAngleMark(pP, pIa, bRefForP, 5, "#dc2626")}

                        <!-- 三角形 ABC -->
                        <polygon points="${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y}" fill="#f8fafc" fill-opacity="0.75" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>

                        <!-- 接点 P, Q, R, F と中心 I, I_ex -->
                        <circle cx="${pF.x}" cy="${pF.y}" r="2.8" fill="#2563eb"/>
                        <circle cx="${pP.x}" cy="${pP.y}" r="2.8" fill="#dc2626"/>
                        <circle cx="${pQ.x}" cy="${pQ.y}" r="2.8" fill="#dc2626"/>
                        <circle cx="${pR.x}" cy="${pR.y}" r="2.8" fill="#dc2626"/>
                        <circle cx="${pI.x}" cy="${pI.y}" r="3.2" fill="#2563eb"/>
                        <circle cx="${pIa.x}" cy="${pIa.y}" r="3.5" fill="#dc2626"/>

                        <!-- 頂点・中心ラベル -->
                        <text x="${pA.x}" y="${pA.y - 11}" font-size="13" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">A</text>
                        <text x="${pB.x + 10}" y="${pB.y + 10}" font-size="13" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">B</text>
                        <text x="${pC.x - 10}" y="${pC.y + 10}" font-size="13" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">C</text>
                        <text x="${pI.x - 7}" y="${pI.y - 6}" font-size="12" font-weight="bold" text-anchor="end" dominant-baseline="central" fill="#2563eb">I</text>
                        <text x="${lblIa.x}" y="${lblIa.y}" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#dc2626">${iExSubHtml}</text>

                        <!-- 接点ラベル F, P, Q, R -->
                        <text x="${lblF.x}" y="${lblF.y}" font-size="11" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#2563eb">F</text>
                        <text x="${lblP.x}" y="${lblP.y}" font-size="11" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#dc2626">P</text>
                        <text x="${lblQ.x}" y="${lblQ.y}" font-size="11" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#dc2626">Q</text>
                        <text x="${lblR.x}" y="${lblR.y}" font-size="11" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#dc2626">R</text>
                    </svg>
                </div>
                <div style="margin-top: 4px;">
                    (1) 内接円と辺 $\\mathrm{AB}$ の接点を $\\mathrm{F}$ とするとき、$\\mathrm{AF}$ の長さを求めなさい。<br>
                    (2) 内接円の半径 $r$ を求めなさい。<br>
                    ${q3QuestionHtml}<br>
                    (4) 辺 $\\mathrm{${touchSide}}$ に接する傍接円の半径 $${rExSymbol}$ を求めなさい。
                </div>
            `,
            answer: `(1) AF = ${afVal}<br>(2) r = ${rStr}<br>(3) ${targetSegName} = ${targetSegVal}<br>(4) ${rExTextHtml} = ${raFinalStr}`,
            explanation: `
                <strong>(1)</strong><br>
                内接円の接線の公式より、頂点 A から接点 F までの長さ AF は「頂点 A をはさむ2辺の和から向かい合う辺 BC を引いて 2 で割った値」になる。<br>
                AF = ${fracHtml("AB + AC - BC", "2")} = ${fracHtml(`${cTex} + ${bTex} - ${aTex}`, "2")} = ${fracHtml(`${2 * afVal}`, "2")} = <strong>${afVal}</strong>。<br><br>

                <strong>(2)</strong><br>
                ${areaCalcHtml}。<br>
                △ABC の面積を S とすると、内接円の中心 I から各辺への垂線の長さ（＝半径 r）を用いて<br>
                S = ${fracHtml("1", "2")} × r × (AB + BC + CA) = ${fracHtml("1", "2")} × r × (${cTex} + ${aTex} + ${bTex}) = ${sVal}r<br>
                S = ${areaStr} なので、${sVal}r = ${areaStr} より <strong>r = ${rStr}</strong>。<br><br>

                <strong>(3)</strong><br>
                ${q3ExplainHtml}<br><br>

                <strong>(4)</strong><br>
                内接円の中心 I から下ろした垂線と傍接円の中心 ${iExTextHtml} から下ろした垂線との相似から、内接円半径 r と傍接円半径 ${rExTextHtml} を結びつけることができる。<br>
                ${q4ExplainHtml}<br>
                <strong>答え：(1) AF = ${afVal}　(2) r = ${rStr}　(3) ${targetSegName} = ${targetSegVal}　(4) ${rExTextHtml} = ${raFinalStr}</strong>
            `
        };
    }
},
"自己相似（フラクタル）": {
    level: "公立",
    formula: `
        <div>④ <strong>連なる図形や複数の円での相似比</strong>：二等辺三角形の中に相似な円が順に並ぶ場合など、相似な図形が連なるときは、隣り合う図形（または三角形と円）の<strong>相似比 $1 : r$</strong> を見つけて、半径・長さ・面積を順に求める（相似比が $1 : r$ のとき、面積比は <strong>$1 : r^2$</strong> になる）。</div>
    `,
    selfCheck: [
        '直角三角形 ABM の辺の比から三平方の定理を使って高さ AM を求め、内接円の公式から円 O1 の半径を出せているか？',
        '円 O1 の高さ（直径）を使って残りの高さを求め、全体の高さとの比から相似比を正しく導けているか？',
        '求めた相似比（倍率）を使って、円 O2 → 円 O3 と順に半径を計算できているか？'
    ],
    generateRandom: function () {
        const fracHtml = (num, den) =>
            `<span style="display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; line-height: 1.05; margin: 0 2px; font-size: 0.9em;"><span style="padding: 0 2px;">${num}</span><span style="border-top: 1px solid currentColor; width: 100%; text-align: center; padding: 1px 2px 0;">${den}</span></span>`;

        const gcd = (a, b) => {
            a = Math.abs(a); b = Math.abs(b);
            while (b) { const t = b; b = a % b; a = t; }
            return a || 1;
        };

        // 平方根 n * sqrt(rad) を簡約する（rad >= 1, rad は平方因子を持たない形に正規化）
        const simplifySqrt = (coeff, rad) => {
            let c = coeff;
            let r = rad;
            for (let d = Math.floor(Math.sqrt(r)); d >= 2; d--) {
                if (r % (d * d) === 0) {
                    c *= d;
                    r /= (d * d);
                    break;
                }
            }
            return { c, r };
        };

        // (coeff * sqrt(rad)) / den を約分して HTML 文字列を作る
        const formatSqrtFrac = (coeff, rad, den) => {
            const s = simplifySqrt(coeff, rad);
            if (s.c === 0) return { html: "0", s: { c: 0, r: 1 }, den: 1 };
            const g = gcd(Math.abs(s.c), Math.abs(den));
            const n = s.c / g;
            const d = den / g;
            const rootPart = s.r === 1 ? "" : `√${s.r}`;
            const numStr = (s.r > 1 && Math.abs(n) === 1)
                ? `${n < 0 ? "−" : ""}${rootPart}`
                : `${n}${rootPart}`;
            const html = d === 1 ? `${numStr}` : `${fracHtml(`${numStr}`, `${d}`)}`;
            return { html, s: { c: n, r: s.r }, den: d };
        };

        // 2つの同じ平方根を持つ項の差を計算
        const addSubSameRootFrac = (a, da, b, db, rad, sign) => {
            const lcmD = (da * db) / gcd(da, db);
            const numA = a * (lcmD / da);
            const numB = b * (lcmD / db);
            const resNum = sign === "+" ? numA + numB : numA - numB;
            return formatSqrtFrac(resNum, rad, lcmD);
        };

        // 2つの同じ平方根を持つ項の比を整数比 m : n に直す
        const ratioSameRootFrac = (a, da, b, db) => {
            const lcmD = (da * db) / gcd(da, db);
            const left = Math.abs(a * (lcmD / da));
            const right = Math.abs(b * (lcmD / db));
            const g = gcd(left, right);
            return { m: left / g, n: right / g };
        };

        // AB = AC = side, BC = base, 高さ h = hCoeff * sqrt(hRad)
        // ratioBase, ratioSide は直角三角形 ABM における BM : AB の比（または三辺の比の基準）
        const cases = [
            // 整数高さ（ピタゴラス数）
            { side: 5,  base: 6,  hCoeff: 4,  hRad: 1, rBm: 3, rSide: 5, rHStr: "4" },
            { side: 10, base: 12, hCoeff: 8,  hRad: 1, rBm: 3, rSide: 5, rHStr: "4" },
            { side: 15, base: 18, hCoeff: 12, hRad: 1, rBm: 3, rSide: 5, rHStr: "4" },
            { side: 13, base: 10, hCoeff: 12, hRad: 1, rBm: 5, rSide: 13, rHStr: "12" },
            { side: 17, base: 16, hCoeff: 15, hRad: 1, rBm: 8, rSide: 17, rHStr: "15" },
            { side: 17, base: 30, hCoeff: 8,  hRad: 1, rBm: 15, rSide: 17, rHStr: "8" },
            // 正三角形ベース（高さが √3）
            { side: 6,  base: 6,  hCoeff: 3,  hRad: 3, rBm: 1, rSide: 2, rHStr: "√3" },
            { side: 8,  base: 8,  hCoeff: 4,  hRad: 3, rBm: 1, rSide: 2, rHStr: "√3" },
            { side: 10, base: 10, hCoeff: 5,  hRad: 3, rBm: 1, rSide: 2, rHStr: "√3" },
            { side: 12, base: 12, hCoeff: 6,  hRad: 3, rBm: 1, rSide: 2, rHStr: "√3" },
            // √2 や √5 を含むバリエーション
            { side: 3,  base: 4,  hCoeff: 1,  hRad: 5, rBm: 2, rSide: 3, rHStr: "√5" },
            { side: 6,  base: 8,  hCoeff: 2,  hRad: 5, rBm: 2, rSide: 3, rHStr: "√5" },
            { side: 6,  base: 4,  hCoeff: 4,  hRad: 2, rBm: 1, rSide: 3, rHStr: "2√2" },
            { side: 9,  base: 6,  hCoeff: 6,  hRad: 2, rBm: 1, rSide: 3, rHStr: "2√2" }
        ];
        const c = cases[Math.floor(Math.random() * cases.length)];
        const { side, base, hCoeff, hRad, rBm, rSide, rHStr } = c;

        const halfBase = base / 2;
        const hNorm = simplifySqrt(hCoeff, hRad);
        const hStr = formatSqrtFrac(hNorm.c, hNorm.r, 1).html;

        // 比の1あたりを求める倍率（例：AB = 10 で比が 5 なら 2倍）
        const unitMul = side / rSide;
        const unitMulStr = Number.isInteger(unitMul) ? `${unitMul}` : formatSqrtFrac(unitMul, 1, 1).html;

        // △ABC の面積 = (1/2) * base * h
        const areaInfo = formatSqrtFrac(halfBase * hNorm.c, hNorm.r, 1);
        const perimAbc = side + side + base;

        // 内接円の公式: area = (1/2) * r1 * perimAbc => r1 = (2 * area) / perimAbc
        const r1Info = formatSqrtFrac(2 * areaInfo.s.c, areaInfo.s.r, perimAbc);

        // 直径 2 * r1
        const diam1Info = formatSqrtFrac(2 * r1Info.s.c, r1Info.s.r, r1Info.den);

        // 上側残余の二等辺三角形の高さ h2 = h - 2*r1
        const h2Info = (diam1Info.s.r === hNorm.r)
            ? addSubSameRootFrac(hNorm.c, 1, diam1Info.s.c, diam1Info.den, hNorm.r, "-")
            : formatSqrtFrac(hNorm.c * diam1Info.den - diam1Info.s.c, hNorm.r, diam1Info.den);

        // 全体の高さ h と上側の高さ h2 の比（相似比 simM : simN）
        const simRatio = ratioSameRootFrac(hNorm.c, 1, h2Info.s.c, h2Info.den);
        const simM = simRatio.m;
        const simN = simRatio.n;

        // (2) 円 O2 の半径 r2 = r1 * (simN / simM)
        const r2Info = formatSqrtFrac(r1Info.s.c * simN, r1Info.s.r, r1Info.den * simM);

        // (3) 円 O3 の半径 r3 = r2 * (simN / simM)
        const r3Info = formatSqrtFrac(r2Info.s.c * simN, r2Info.s.r, r2Info.den * simM);

        // SVG描画：実際の (side, base, h) の比率に合わせて二等辺三角形 ABC と垂線 AM、内接円 O1, O2, O3 を厳密配置
        const actualH = hNorm.c * Math.sqrt(hNorm.r);
        const actualHalfBase = base / 2;
        const actualSlant = Math.hypot(actualHalfBase, actualH);
        // sin(半頂角 α) = (BC/2) / AB
        const sinAlpha = actualHalfBase / actualSlant;

        // viewBox [0, 0, 300, 210] 内に収まるように底辺幅と高さをスケーリング
        const maxWidth = 190;
        const maxHeight = 152;
        const scale = Math.min(maxWidth / (2 * actualHalfBase), maxHeight / actualH);

        const cxMid = 150;
        const yBase = 182;
        const halfBaseSvg = actualHalfBase * scale;
        const heightSvg = actualH * scale;
        const yTop = yBase - heightSvg;

        const A = { x: cxMid, y: Number(yTop.toFixed(2)) };
        const B = { x: Number((cxMid - halfBaseSvg).toFixed(2)), y: yBase };
        const C = { x: Number((cxMid + halfBaseSvg).toFixed(2)), y: yBase };
        const M = { x: cxMid, y: yBase };

        // 垂線 AM 上で辺 AB, AC からの垂直距離が r となる点の y 座標：
        // 頂点 A からの距離 d = r / sin(α) なので、y = yTop + r / sin(α)
        // 底辺 BC に接する円 O1 の半径：r1 + r1 / sin(α) = heightSvg  =>  r1 = heightSvg * sin(α) / (1 + sin(α))
        const r1Svg = Number(((heightSvg * sinAlpha) / (1 + sinAlpha)).toFixed(2));
        const cy1Svg = Number((yBase - r1Svg).toFixed(2));

        // 隣り合う円が辺 AB, AC および直前の円と外接するときの半径比 k = (1 - sinα) / (1 + sinα)
        const kSvg = (1 - sinAlpha) / (1 + sinAlpha);
        const r2Svg = Number((r1Svg * kSvg).toFixed(2));
        const cy2Svg = Number((cy1Svg - (r1Svg + r2Svg)).toFixed(2));

        const r3Svg = Number((r2Svg * kSvg).toFixed(2));
        const cy3Svg = Number((cy2Svg - (r2Svg + r3Svg)).toFixed(2));

        // 直角記号（点 M 付近、三角形の向き・大きさに合わせて調整）
        const sq = Math.min(7, Math.max(4.5, halfBaseSvg * 0.08, heightSvg * 0.06));
        const rightAngleMark = `<polyline points="${(M.x - sq).toFixed(2)},${M.y} ${(M.x - sq).toFixed(2)},${(M.y - sq).toFixed(2)} ${M.x},${(M.y - sq).toFixed(2)}" fill="none" stroke="#64748b" stroke-width="1.2"/>`;

        // ラベル O2, O3 は円の右外側（辺 AC との間に十分な余白がある場合）または円内に配置
        const labelO2X = Math.min(C.x - 14, cxMid + r2Svg + 11);
        const labelO3X = Math.min(C.x - 14, cxMid + r3Svg + 11);

        const svgHtml = `
            <div style="margin: 10px 0 8px 0; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
                <svg viewBox="0 0 300 210" style="width: 100%; max-width: 300px; height: auto;">
                    <polygon points="${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}" fill="#f8fafc" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
                    <line x1="${A.x}" y1="${A.y}" x2="${M.x}" y2="${M.y}" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3,3"/>
                    ${rightAngleMark}
                    <circle cx="${cxMid}" cy="${cy1Svg}" r="${r1Svg}" fill="#dbeafe" fill-opacity="0.7" stroke="#2563eb" stroke-width="1.6"/>
                    <circle cx="${cxMid}" cy="${cy2Svg}" r="${r2Svg}" fill="#fef3c7" fill-opacity="0.85" stroke="#d97706" stroke-width="1.5"/>
                    <circle cx="${cxMid}" cy="${cy3Svg}" r="${r3Svg}" fill="#dcfce7" fill-opacity="0.85" stroke="#16a34a" stroke-width="1.4"/>
                    <text x="${A.x}" y="${(A.y - 11).toFixed(2)}" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">A</text>
                    <text x="${(B.x - 11).toFixed(2)}" y="${(B.y + 8).toFixed(2)}" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">B</text>
                    <text x="${(C.x + 11).toFixed(2)}" y="${(C.y + 8).toFixed(2)}" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#0f172a">C</text>
                    <text x="${M.x}" y="${(M.y + 11).toFixed(2)}" font-size="11" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#64748b">M</text>
                    <text x="${cxMid}" y="${cy1Svg}" font-size="11" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#1e3a8a">O<tspan dy="3" font-size="8.5">1</tspan></text>
                    <text x="${labelO2X.toFixed(2)}" y="${cy2Svg}" font-size="10" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#92400e">O<tspan dy="3" font-size="8">2</tspan></text>
                    <text x="${labelO3X.toFixed(2)}" y="${cy3Svg}" font-size="9.5" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#166534">O<tspan dy="3" font-size="7.5">3</tspan></text>
                </svg>
            </div>
        `;

        return {
            problem: `
                <div>
                    AB = ${side} cm、AC = ${side} cm、BC = ${base} cm の二等辺三角形 ABC がある。<br>
                    図のように、二等辺三角形 ABC の辺 AB、AC に接しながら順に小さくなる相似な円を並べ、中心をそれぞれ O<sub>1</sub>、O<sub>2</sub>、O<sub>3</sub> とする。<br>
                    次の問いに答えなさい。
                </div>
                ${svgHtml}
                <div style="margin-top: 4px;">
                    (1) 円 O<sub>1</sub> の半径を求めなさい。<br>
                    (2) 円 O<sub>2</sub> の半径を求めなさい。<br>
                    (3) 円 O<sub>3</sub> の半径を求めなさい。
                </div>
            `,
            answer: `(1) ${r1Info.html} cm<br>(2) ${r2Info.html} cm<br>(3) ${r3Info.html} cm`,
            explanation: `
                <strong>(1)</strong><br>
                頂点 A から底辺 BC へ垂線 AM を引くと、BM = MC = ${halfBase} cm となる。<br>
                直角三角形 ABM において、BM : AB = ${halfBase} : ${side} = <strong>${rBm} : ${rSide}</strong> なので、三辺の比（BM : AM : AB）を考え、三平方の定理より高さの比は <strong>${rHStr}</strong> となる。<br>
                比の1あたりは ${side} ÷ ${rSide} = ${unitMulStr} 倍なので、高さ AM は<br>
                AM = ${rHStr} × ${unitMulStr} = <strong>${hStr} cm</strong><br>
                △ABC の面積は ${fracHtml("1", "2")} × ${base} × ${hStr} = ${areaInfo.html} cm<sup>2</sup>、周りの長さは ${side} + ${side} + ${base} = ${perimAbc} cm。<br>
                円 O<sub>1</sub> の半径を r<sub>1</sub> とすると、内接円の公式（面積 = ${fracHtml("1", "2")} × r<sub>1</sub> × 周りの長さ）より、<br>
                ${areaInfo.html} = ${fracHtml("1", "2")} × r<sub>1</sub> × ${perimAbc} &nbsp;⇒&nbsp; r<sub>1</sub> = <strong>${r1Info.html} cm</strong><br><br>

                <strong>(2)</strong><br>
                円 O<sub>1</sub> は底辺 BC に接しているので、底辺 BC から円 O<sub>1</sub> の頂点 A 側の端までの高さは 2r<sub>1</sub> = ${diam1Info.html} cm。<br>
                よって、その上側の小さな二等辺三角形の高さは<br>
                ${hStr} − ${diam1Info.html} = ${h2Info.html} cm<br>
                全体の高さ ${hStr} cm と上側の高さ ${h2Info.html} cm の比から、相似比は <strong>${simM} : ${simN}</strong> となる。<br>
                公式④より、円 O<sub>2</sub> の半径は円 O<sub>1</sub> の半径の ${fracHtml(`${simN}`, `${simM}`)} 倍なので、<br>
                ${r1Info.html} × ${fracHtml(`${simN}`, `${simM}`)} = <strong>${r2Info.html} cm</strong><br><br>

                <strong>(3)</strong><br>
                隣り合う円の相似比は ${simM} : ${simN} なので、円 O<sub>3</sub> の半径は円 O<sub>2</sub> の半径の ${fracHtml(`${simN}`, `${simM}`)} 倍となる。<br>
                よって、<br>
                ${r2Info.html} × ${fracHtml(`${simN}`, `${simM}`)} = <strong>${r3Info.html} cm</strong>
            `
        };
    }
},
 "三平方の定理": {
    category: "図形",
    level: "公立",
    formula: "<strong>【三平方の定理】</strong><br>" +
             "直角三角形の直角をはさむ2辺の長さを \\(a, b\\)、斜辺の長さを \\(c\\) とすると、<br>" +
             "\\(a^2 + b^2 = c^2\\) が成り立ちます。<br>" +
             "・斜辺を求めるとき：\\(c = \\sqrt{a^2 + b^2}\\)<br>" +
             "・その他の1辺を求めるとき：\\(a = \\sqrt{c^2 - b^2}\\)、\\(b = \\sqrt{c^2 - a^2}\\)<br>" +
             "・2辺以上に文字が含まれるとき：\\(a^2 + b^2 = c^2\\) をそのまま用いて方程式を立てます。",
    generateRandom: function() {
        // 求める対象をランダム選択 ("a", "b", "c")
        const targetSide = ["a", "b", "c"][Math.floor(Math.random() * 3)];
        
        let a, b, c;
        let insideVal = 0;

        // ルートを簡約化するヘルパー関数 (例: 20 -> {coef: 2, inside: 5})
        const simplifyRoot = (n) => {
            let coef = 1;
            let inside = n;
            for (let i = 2; i * i <= inside; i++) {
                while (inside % (i * i) === 0) {
                    coef *= i;
                    inside /= (i * i);
                }
            }
            return { coef, inside };
        };

        const formatRoot = (coef, inside) => {
            if (inside === 1) return `${coef}`;
            if (coef === 1) return `\\sqrt{${inside}}`;
            return `${coef}\\sqrt{${inside}}`;
        };
        
        if (targetSide === "c") {
            // 斜辺 c を求める（整数にならない組み合わせ）
            do {
                a = Math.floor(Math.random() * 6) + 2; // 2〜7
                b = Math.floor(Math.random() * 6) + 2; // 2〜7
                insideVal = a * a + b * b;
            } while (Number.isInteger(Math.sqrt(insideVal)));
        } else if (targetSide === "a") {
            // 辺 a を求める
            do {
                c = Math.floor(Math.random() * 7) + 5; // 5〜11
                b = Math.floor(Math.random() * (c - 2)) + 2; // 2〜c-2
                insideVal = c * c - b * b;
            } while (Number.isInteger(Math.sqrt(insideVal)) || insideVal <= 0);
        } else {
            // 辺 b を求める
            do {
                c = Math.floor(Math.random() * 7) + 5; // 5〜11
                a = Math.floor(Math.random() * (c - 2)) + 2; // 2〜c-2
                insideVal = c * c - a * a;
            } while (Number.isInteger(Math.sqrt(insideVal)) || insideVal <= 0);
        }

        const simplified = simplifyRoot(insideVal);
        const finalAnsText = formatRoot(simplified.coef, simplified.inside);
        const expansionStep = simplified.coef > 1 ? ` = ${finalAnsText}` : "";

        // --- 1°単位の精密ランダム回転 ＆ 外側ラベル配置 ---
        const angleDeg = Math.floor(Math.random() * 360); // 0〜359度
        const angleRad = (angleDeg * Math.PI) / 180;

        const baseC = { x: 0, y: 0 };
        const baseA = { x: 0, y: 60 }; // 縦辺
        const baseB = { x: 80, y: 0 }; // 横辺

        const rotatePoint = (pt, rad) => ({
            x: pt.x * Math.cos(rad) - pt.y * Math.sin(rad),
            y: pt.x * Math.sin(rad) + pt.y * Math.cos(rad)
        });

        const rC = rotatePoint(baseC, angleRad);
        const rA = rotatePoint(baseA, angleRad);
        const rB = rotatePoint(baseB, angleRad);

        const svgW = 220, svgH = 180;
        const allX = [rC.x, rA.x, rB.x];
        const allY = [rC.y, rA.y, rB.y];
        const minX = Math.min(...allX), maxX = Math.max(...allX);
        const minY = Math.min(...allY), maxY = Math.max(...allY);
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const offsetX = svgW / 2 - centerX;
        const offsetY = svgH / 2 - centerY;

        const tx = (pt) => ({ x: pt.x + offsetX, y: pt.y + offsetY });

        const pC = tx(rC);
        const pA = tx(rA);
        const pB = tx(rB);

        const gX = (pC.x + pA.x + pB.x) / 3;
        const gY = (pC.y + pA.y + pB.y) / 3;

        const getOuterLabelPos = (p1, p2, dist) => {
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            let vx = midX - gX;
            let vy = midY - gY;
            const len = Math.hypot(vx, vy) || 1;
            return {
                x: midX + (vx / len) * dist,
                y: midY + (vy / len) * dist + 4
            };
        };

        const posA = getOuterLabelPos(pC, pA, 16);
        const posB = getOuterLabelPos(pC, pB, 16);
        const posC = getOuterLabelPos(pA, pB, 18);

        const vCAx = (pA.x - pC.x) / Math.hypot(pA.x - pC.x, pA.y - pC.y);
        const vCAy = (pA.y - pC.y) / Math.hypot(pA.x - pC.x, pA.y - pC.y);
        const vCBx = (pB.x - pC.x) / Math.hypot(pB.x - pC.x, pB.y - pC.y);
        const vCBy = (pB.y - pC.y) / Math.hypot(pB.x - pC.x, pB.y - pC.y);
        const rLen = 10;

        const q1 = { x: pC.x + vCAx * rLen, y: pC.y + vCAy * rLen };
        const q2 = { x: q1.x + vCBx * rLen, y: q1.y + vCBy * rLen };
        const q3 = { x: pC.x + vCBx * rLen, y: pC.y + vCBy * rLen };

        // 表示用ラベル用（ダミーとして値を入れる。実際のルート表示は問題文と解説で組み立てる）
        let labelA_val, labelB_val, labelC_val;
        if (targetSide === "a") {
            labelA_val = "x";
            labelB_val = `${b}`;
            labelC_val = targetSide === "c" ? "x" : `${c}`; // cは数値
        } else if (targetSide === "b") {
            labelA_val = `${a}`;
            labelB_val = "x";
            labelC_val = `${c}`;
        } else {
            labelA_val = `${a}`;
            labelB_val = `${b}`;
            labelC_val = "x";
        }

        // 三角形上の表示が数値になる部分はそのまま、未知数は "x"
        let svgGraph = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background: #fff; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 10px auto; width: 100%; max-width: 220px;">` +
                       `<style>.svg-text { font-family: sans-serif; font-size: 12px; fill: #000; font-weight: bold; }</style>` +
                       `<polygon points="${pC.x},${pC.y} ${pB.x},${pB.y} ${pA.x},${pA.y}" fill="#eef2f7" stroke="#333" stroke-width="2" />` +
                       `<path d="M ${q1.x} ${q1.y} L ${q2.x} ${q2.y} L ${q3.x} ${q3.y}" fill="none" stroke="#e74c3c" stroke-width="1.5" />` +
                       `<text x="${posA.x}" y="${posA.y}" class="svg-text" text-anchor="middle">${targetSide === "a" ? "x" : a}</text>` +
                       `<text x="${posB.x}" y="${posB.y}" class="svg-text" text-anchor="middle">${targetSide === "b" ? "x" : b}</text>` +
                       `<text x="${posC.x}" y="${posC.y}" class="svg-text" text-anchor="middle" fill="#27ae60">${targetSide === "c" ? "x" : c}</text>` +
                       `</svg>`;

        let problemText = "";
        let explanationText = "";

        if (targetSide === "c") {
            problemText = `直角をはさむ2辺の長さが \\(${a}\\text{cm}\\) と \\(${b}\\text{cm}\\) である直角三角形の斜辺の長さ \\(x\\) を求めなさい。<br>` + svgGraph;
            explanationText = `【解説】<br>` +
                              `1. <strong>斜辺 \\(c\\) を求める公式 \\(c = \\sqrt{a^2 + b^2}\\) にあてはめます。</strong><br>` +
                              `　\\(x = \\sqrt{${a}^2 + ${b}^2}\\)<br>` +
                              `2. <strong>根号の中を計算し、できるだけ簡単な形に変形します。</strong><br>` +
                              `　\\(x = \\sqrt{${a*a} + ${b*b}} = \\sqrt{${insideVal}}${expansionStep}\\)<br>` +
                              `3. <strong>したがって、求める斜辺の長さは \\(\\mathbf{${finalAnsText}\\text{cm}}\\) です。</strong>`;
        } else if (targetSide === "a") {
            problemText = `斜辺の長さが \\(${c}\\text{cm}\\)、直角をはさむ1辺の長さが \\(${b}\\text{cm}\\) である直角三角形の、もう1つの直角をはさむ辺の長さ \\(x\\) を求めなさい。<br>` + svgGraph;
            explanationText = `【解説】<br>` +
                              `1. <strong>直角をはさむ辺 \\(a\\) を求める公式 \\(a = \\sqrt{c^2 - b^2}\\) にあてはめます。</strong><br>` +
                              `　\\(x = \\sqrt{${c}^2 - ${b}^2}\\)<br>` +
                              `2. <strong>根号の中を計算し、できるだけ簡単な形に変形します。</strong><br>` +
                              `　\\(x = \\sqrt{${c*c} - ${b*b}} = \\sqrt{${insideVal}}${expansionStep}\\)<br>` +
                              `3. <strong>したがって、求める辺 \\(a\\) の長さは \\(\\mathbf{${finalAnsText}\\text{cm}}\\) です。</strong>`;
        } else {
            problemText = `斜辺の長さが \\(${c}\\text{cm}\\)、直角をはさむ1辺の長さが \\(${a}\\text{cm}\\) である直角三角形の、もう1つの直角をはさむ辺の長さ \\(x\\) を求めなさい。<br>` + svgGraph;
            explanationText = `【解説】<br>` +
                              `1. <strong>直角をはさむ辺 \\(b\\) を求める公式 \\(b = \\sqrt{c^2 - a^2}\\) にあてはめます。</strong><br>` +
                              `　\\(x = \\sqrt{${c}^2 - ${a}^2}\\)<br>` +
                              `2. <strong>根号の中を計算し、できるだけ簡単な形に変形します。</strong><br>` +
                              `　\\(x = \\sqrt{${c*c} - ${a*a}} = \\sqrt{${insideVal}}${expansionStep}\\)<br>` +
                              `3. <strong>したがって、求める辺 \\(b\\) の長さは \\(\\mathbf{${finalAnsText}\\text{cm}}\\) です。</strong>`;
        }

        return {
            problem: problemText,
            explanation: explanationText
        };
    }
},



    },
    "立体図形": {
        "球の体積と表面積": {
            level: "公立",
            formula: "体積：\\( V = \\frac{4}{3}\\pi r^3 \\)<br>表面積：\\( S = 4\\pi r^2 \\)",
            generateRandom: function() {
                const r = Math.floor(Math.random() * 4) + 1;
                const vNum = (4 * r * r * r);
                return {
                    problem: `半径が \\(${r}\\text{cm} \\) の球の体積を求めなさい。`,
                    explanation: `【解説】<br>1. 公式 \\( V = \\frac{4}{3}\\pi r^3 \\) に代入します。<br>2. 計算します。<br>　\\( V = \\frac{4}{3} \\pi \\times ${r}^3 = ${vNum % 3 === 0 ? vNum/3 + "\\pi" : "\\frac{" + vNum + "}{3}\\pi"}\\text{cm}^3 \\) です。`
                };
            },
            problem: "半径が \\(3\\text{cm} \\) の球の体積を求めなさい。",
            explanation: "【解説】<br>1. 公式 \\( V = \\frac{4}{3}\\pi r^3 \\) に代入します。<br>" +
                         "2. 計算します。<br>" +
                         "　\\( V = \\frac{4}{3} \\pi \\times 3^3 = 36\\pi\\text{cm}^3 \\) です。"
        }
    },
    "その他": {
        "確率の基本": {
            level: "確率",
            formula: "確率 = \\frac{\\text{ある事象が起こる場合の数}}{\\text{すべての起こりうる場合の数}}",
            generateRandom: function() {
                return {
                    problem: "サイコロを1回投げるとき、 \\(3\\) 以下の目が出る確率を求めなさい。",
                    explanation: "【解説】<br>1. すべての起こりうる場合の数は6通りです。<br>2. \\(3\\) 以下の目が出る場合の数は3通りです。<br>3. したがって、\\(\\frac{3}{6} = \\frac{1}{2} \\) です。"
                };
            },
            problem: "サイコロを1回投げるとき、偶数の目が出る確率を求めなさい。",
            explanation: "【解説】<br>1. すべての起こりうる場合の数は6通りです。<br>" +
                         "2. 偶数の目が出る場合の数は3通りです。<br>" +
                         "3. したがって、\\(\\frac{3}{6} = \\frac{1}{2} \\) です。"
        }
    }
};

/**
 * 指定したレベルとカテゴリに基づいて、該当する小単元からランダムに1問の問題データを取得する関数
 */
function generatePracticeProblem(selectedLevel, selectedCategory) {
    if (!formulaData[selectedCategory]) {
        return { error: "指定されたカテゴリが存在しません。" };
    }

    const subCategories = formulaData[selectedCategory];
    let subKeys = Object.keys(subCategories);

    if (selectedLevel) {
        let filteredKeys = subKeys.filter(subKey => {
            const levelStr = subCategories[subKey].level;
            return levelStr.includes(selectedLevel) || levelStr.includes("基礎") || levelStr.includes("公立");
        });
        if (filteredKeys.length > 0) subKeys = filteredKeys;
    }

    const randomSubKey = subKeys[Math.floor(Math.random() * subKeys.length)];
    const targetItem = subCategories[randomSubKey];

    let problemContent = {
        problem: targetItem.problem,
        explanation: targetItem.explanation,
        level: targetItem.level
    };

    if (typeof targetItem.generateRandom === 'function') {
        const generated = targetItem.generateRandom();
        problemContent.problem = generated.problem;
        problemContent.explanation = generated.explanation;
        if (generated.level) problemContent.level = generated.level;
    }

    return {
        category: selectedCategory,
        subCategory: randomSubKey,
        level: problemContent.level,
        formula: targetItem.formula,
        problem: problemContent.problem,
        explanation: problemContent.explanation
    };
}
