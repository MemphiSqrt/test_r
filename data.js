// ================================================================================
// ★★★ data.js (DATA) ★★★
// ================================================================================

/* 工具函数：判定系统 */
function checkAttribute(charName, attrName, val, threshold) {
    const roll = val > 0 ? Math.floor(Math.random() * val) : 0;
    const success = roll >= threshold;
    const colorClass = success ? 'check-success' : 'check-fail';
    const resultText = success ? '【成功】' : '【失败】';
    
    const log = `<div class="check-result ${colorClass}">
        [${attrName}判定] ${charName} (属性:${val})<br>
        🎲 掷骰: ${roll} (目标 >= ${threshold}) -> ${resultText}
    </div>`;
    
    return { success, roll, log };
}

// 对抗判定：valA vs valB
function contestAttribute(nameA, valA, nameB, valB) {
    const rollA = valA > 0 ? Math.floor(Math.random() * valA) : 0;
    const rollB = valB > 0 ? Math.floor(Math.random() * valB) : 0;
    const userWin = rollA >= rollB;
    
    const colorClass = userWin ? 'check-success' : 'check-fail';
    const resultText = userWin ? `【${nameA} 胜】` : `【${nameB} 胜】`;
    
    const log = `<div class="check-result ${colorClass}">
        [力量对抗]<br>
        ${nameA}: 🎲 ${rollA} / ${valA}<br>
        ${nameB}: 🎲 ${rollB} / ${valB}<br>
        结果 -> ${resultText}
    </div>`;
    
    return { userWin, rollA, rollB, log };
}

const GameData = {
    initialState: {
        day: 1,
        money: 100,
        flags: {}, // 存储剧情 flag
        inventory: ["旧手枪", "故障卡：未来的废墟", "防弹衣"] 
    },

    characters: [
        { id: 'x', name: '审计官 X', role: '主角', stats: { int: 8, str: 4, sta: 5 }, equipment: { clothes: null, weapon: null, accessory: null } },
        { id: 'y', name: '助手 Y', role: '战术支援', stats: { int: 4, str: 5, sta: 2 }, equipment: { clothes: null, weapon: null, accessory: null } }
    ],

    hiddenCharacters: {
        'ghost': { id: 'ghost', name: '老鬼', role: '爆破专家', stats: { int: 3, str: 10, sta: 1 }, equipment: { clothes: null, weapon: '机械引爆器', accessory: null } }
    },

    itemDefinitions: {
        "防弹衣": { slot: "clothes", bonus: "力+1", desc: "标准的凯夫拉纤维轻型护甲。" },
        "旧手枪": { slot: "weapon", bonus: "力+2", desc: "一把磨损严重的半自动手枪。" },
        "故障卡：未来的废墟": { slot: "misc", bonus: "无", desc: "【关键道具】一段存储着不可逆熵增数据的芯片。" },
        "机械引爆器": { slot: "weapon", bonus: "力+5", desc: "粗糙，残暴，有效的旧时代引爆器。" }
    },

    /* ★ 事件库 (Event Library) ★ */
    eventLibrary: [
        {
            id: 'daily_report',
            title: '每日述职',
            desc: '向中央AI提交报告。日常例行公事。',
            type: 'daily',
            trigger: () => true, // 总是触发
            logic: {
                assigned: (char, items) => {
                    return { text: `【述职完成】\n${char.name} 完成了今日的汇报。`, moneyChange: 10 };
                }
            }
        },
        
        // --- 商场大停电 事件链 ---

        // 事件 1: 初始调查
        {
            id: 'mall_blackout_1',
            title: '商场大停电 (I)',
            desc: 'A区发生爆炸。需要在现场进行【智力判定】以追踪嫌疑人。',
            type: 'story',
            ttl: 1,
            trigger: (state) => state.day === 1, // 第一天触发
            logic: {
                assigned: (char, items, state) => {
                    // 智力判定，目标 3
                    const check = checkAttribute(char.name, '智力', char.stats.int, 3);
                    let resultText = check.log;
                    
                    if (check.success) {
                        state.flags['flag_shopping_mall_0'] = true;
                        resultText += `\n你成功在混乱的数据流中捕捉到了异常信号，锁定了老鬼的位置。`;
                    } else {
                        state.flags['flag_shopping_mall_0'] = false;
                        resultText += `\n现场过于混乱，你跟丢了信号。线索中断了。`;
                    }
                    
                    return { text: resultText };
                },
                unassigned: (state) => {
                    state.flags['flag_shopping_mall_0'] = false;
                    return { text: "【无人响应】你错过了最佳调查时间，线索中断。", moneyChange: -10, eventOver: true };
                }
            }
        },

        // 事件 2: 找到老鬼 (前提: flag_0 = true)
        {
            id: 'mall_blackout_2',
            title: '商场大停电 (II)',
            desc: '已锁定老鬼位置。需要决定如何与他对峙。建议携带【故障卡】。',
            type: 'story',
            ttl: 1,
            // 触发条件：前置Flag为真，且本事件没触发过
            trigger: (state, triggeredIds) => state.flags['flag_shopping_mall_0'] === true && !triggeredIds.includes('mall_blackout_2'),
            logic: {
                assigned: (char, items, state) => {
                    const hasCard = items.includes("故障卡：未来的废墟");
                    let text = `你在基站核心找到了老鬼。他正准备引爆。\n`;
                    
                    if (hasCard) {
                        state.flags['flag_shopping_mall_1'] = true;
                        text += `你拿出了【故障卡】，向他展示了那个没有元宇宙的废墟未来。\n老鬼的眼神动摇了。`;
                    } else {
                        state.flags['flag_shopping_mall_1'] = false;
                        text += `你两手空空地试图说服他，但他根本听不进去。\n"伪善者！" 他怒吼道。`;
                    }
                    return { text: text };
                },
                unassigned: (state) => {
                    // 无人处理，老鬼自爆
                    state.flags['flag_shopping_mall_1'] = false; // 视为谈判失败
                    return { text: "【行动失败】你没有前往对峙，老鬼引爆了基站。", moneyChange: -50, eventOver: true };
                }
            }
        },

        // 结局 1: 真结局 (招募)
        {
            id: 'mall_end_1',
            title: '大停电：抉择',
            desc: '老鬼已经被真相动摇。是时候做出决定了。',
            type: 'story',
            trigger: (state, triggeredIds) => state.flags['flag_shopping_mall_1'] === true && !triggeredIds.includes('mall_end_1'),
            logic: {
                assigned: (char, items, state) => {
                    return {
                        text: `老鬼放下了引爆器。"如果未来注定是废墟，那我宁愿做那个点火的人...但在那之前，我会帮你。"`,
                        options: [
                            { text: "伸出手 (招募老鬼)", action: "recruit_ghost" }
                        ]
                    };
                }
            }
        },

        // 结局 2: 坏结局 (线索中断)
        {
            id: 'mall_end_2',
            title: '大停电：迷雾',
            desc: '由于之前的调查失败，你只能处理善后工作。',
            type: 'story',
            // 注意：因为 mall_1 是在 Day 1 结算时发生，所以 Day 2 开始时 flag_0 为 false，此事件触发
            trigger: (state, triggeredIds) => state.flags['flag_shopping_mall_0'] === false && !triggeredIds.includes('mall_end_2') && !triggeredIds.includes('mall_end_3'),
            logic: {
                assigned: (char, items, state) => {
                    return { text: `虽然基站没有爆炸，但老鬼已经逃之夭夭。你只在现场找到了一些无用的零件。` };
                },
                unassigned: () => ({ text: "这里没什么好做的了。", eventOver: true })
            }
        },

        // 结局 3: 惨烈结局 (力量对抗)
        {
            id: 'mall_end_3',
            title: '大停电：死斗',
            desc: '谈判破裂。老鬼准备引爆，必须立刻制止他！(力量对抗)',
            type: 'story',
            trigger: (state, triggeredIds) => state.flags['flag_shopping_mall_0'] === true && state.flags['flag_shopping_mall_1'] === false && !triggeredIds.includes('mall_end_3'),
            logic: {
                assigned: (char, items, state) => {
                    // 力量对抗：角色 vs 老鬼(10)
                    const contest = contestAttribute(char.name, char.stats.str, '老鬼', 10);
                    let resultText = contest.log;

                    if (contest.userWin) {
                        resultText += `\n你冲上去，在引爆前一秒折断了老鬼的手腕。他痛苦地倒在地上，被随后赶来的特警击毙。`;
                    } else {
                        // 玩家输了：扣减力量，老鬼自杀
                        char.stats.str = Math.max(0, char.stats.str - 1); // 永久扣属性
                        resultText += `\n老鬼的力量超乎想象！他把你甩飞出去（力量 -1）。\n随后他大笑着引爆了身上的手雷，把自己炸成了碎片。`;
                    }
                    
                    return { text: resultText };
                },
                unassigned: () => {
                    return { text: "【悲剧】无人制止，基站被彻底炸毁。", moneyChange: -100, eventOver: true };
                }
            }
        }
    ]
};
