import { useMemo, useState } from "react";

const INITIAL_PLAYER = {
  hp: 30,
  maxHp: 30,
  sanity: 24,
  maxSanity: 24,
  curse: 0,
  food: 6,
  gold: 0,
  fragments: 0,
  floor: 1,
  weapon: "녹슨 단검",
  relics: [],
};

const MONSTERS = [
  {
    name: "종탑의 시체종",
    hp: 14,
    attack: [3, 6],
    rewardGold: [1, 4],
    text: "목이 꺾인 시체가 종소리를 흉내 내며 다가온다.",
  },
  {
    name: "검은 사제",
    hp: 18,
    attack: [4, 7],
    rewardGold: [3, 7],
    text: "얼굴 없는 사제가 피 묻은 향로를 흔든다.",
  },
  {
    name: "우는 갑옷",
    hp: 22,
    attack: [5, 8],
    rewardGold: [5, 10],
    text: "속이 빈 갑옷 안에서 아이의 울음소리가 새어 나온다.",
  },
];

const EVENTS = [
  {
    id: "market",
    title: "고기 시장",
    text: "지하 골목 끝에서 불 꺼진 시장이 열린다. 상인들은 사람의 얼굴을 하고 있지만, 눈동자가 없다.",
    choices: [
      {
        label: "식량을 산다 · 금화 3",
        condition: (p) => p.gold >= 3,
        effect: (p) => ({ ...p, gold: p.gold - 3, food: p.food + 3 }),
        result: "무언가의 고기를 샀다. 맛은 묻지 않는 편이 낫다.",
      },
      {
        label: "상인을 협박한다 · 정신력 -3, 식량 +1, 저주 +1",
        effect: (p) => ({
          ...p,
          sanity: p.sanity - 3,
          food: p.food + 1,
          curse: p.curse + 1,
        }),
        result: "상인은 웃으며 식량을 내주었다. 대신 네 이름을 알고 있었다.",
      },
      {
        label: "그냥 지나간다",
        effect: (p) => p,
        result: "굶주림은 남았지만, 불길한 거래는 피했다.",
      },
    ],
  },
  {
    id: "child",
    title: "우는 아이",
    text: "무너진 성당 의자 밑에서 아이가 울고 있다. 하지만 그림자는 아이의 것이 아니다.",
    choices: [
      {
        label: "아이를 일으킨다 · 체력 -4, 기억 +1",
        effect: (p) => ({ ...p, hp: p.hp - 4, fragments: p.fragments + 1 }),
        result: "아이의 손은 차가웠다. 네 손바닥에는 오래된 이름 하나가 새겨졌다.",
      },
      {
        label: "기도문을 읽는다 · 정신력 -2, 저주 -1",
        effect: (p) => ({
          ...p,
          sanity: p.sanity - 2,
          curse: Math.max(0, p.curse - 1),
        }),
        result: "아이는 사라졌다. 의자 밑에는 검은 재만 남았다.",
      },
      {
        label: "못 본 척한다 · 정신력 -1",
        effect: (p) => ({ ...p, sanity: p.sanity - 1 }),
        result: "울음소리는 한동안 네 뒤를 따라왔다.",
      },
    ],
  },
  {
    id: "relic",
    title: "지하 서고",
    text: "물에 잠긴 서고에서 말라붙은 양피지 한 장이 떠오른다. 글자는 아직 살아 있다.",
    choices: [
      {
        label: "금서를 읽는다 · 저주 +3, 유물 획득",
        effect: (p) => ({
          ...p,
          curse: p.curse + 3,
          relics: p.relics.includes("속삭이는 양피지")
            ? p.relics
            : [...p.relics, "속삭이는 양피지"],
        }),
        result: "글자가 눈 속으로 파고들었다. 이제 적의 약점이 조금 더 잘 보인다.",
      },
      {
        label: "찢어 불태운다 · 정신력 +3",
        effect: (p) => ({
          ...p,
          sanity: Math.min(p.maxSanity, p.sanity + 3),
        }),
        result: "불꽃 속에서 누군가가 네 이름을 불렀다. 하지만 대답하지 않았다.",
      },
      {
        label: "덮어둔다",
        effect: (p) => p,
        result: "모르는 것은 때로 가장 안전한 지식이다.",
      },
    ],
  },
  {
    id: "shrine",
    title: "금 간 제단",
    text: "피로 굳은 제단 위에 오래된 잔이 놓여 있다. 잔 안의 물은 아직 따뜻하다.",
    choices: [
      {
        label: "마신다 · 체력 +8, 저주 +2",
        effect: (p) => ({
          ...p,
          hp: Math.min(p.maxHp, p.hp + 8),
          curse: p.curse + 2,
        }),
        result: "상처는 아물었다. 대신 심장 박동 사이에 종소리가 끼어들었다.",
      },
      {
        label: "제단을 부순다 · 체력 -3, 금화 +6",
        effect: (p) => ({ ...p, hp: p.hp - 3, gold: p.gold + 6 }),
        result: "제단 아래에서 낡은 은화가 쏟아졌다. 누군가 바치는 것을 멈춘 적이 없었던 듯하다.",
      },
      {
        label: "무릎 꿇고 쉰다 · 식량 -1, 정신력 +4",
        condition: (p) => p.food > 0,
        effect: (p) => ({
          ...p,
          food: p.food - 1,
          sanity: Math.min(p.maxSanity, p.sanity + 4),
        }),
        result: "잠깐의 침묵이 너를 다시 사람처럼 만들었다.",
      },
    ],
  },
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function Stat({ label, value, max, danger = false }) {
  const percent = clamp((value / max) * 100, 0, 100);

  return (
    <div className="stat">
      <div className="stat-row">
        <span>{label}</span>
        <strong>{value} / {max}</strong>
      </div>
      <div className="bar">
        <div
          className={danger ? "bar-fill danger" : "bar-fill"}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="mini">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function App() {
  const [player, setPlayer] = useState(INITIAL_PLAYER);
  const [monster, setMonster] = useState(null);

  const [scene, setScene] = useState({
    type: "intro",
    title: "검은 종탑 아래",
    text: "당신은 무너진 수도원의 지하에서 깨어났다. 머리 위에서는 검은 종탑이 울리고, 도시는 한 층씩 아래로 가라앉고 있다.",
  });

  const [log, setLog] = useState([
    "당신은 녹슨 단검 하나를 들고 깨어났다.",
    "첫 번째 종이 울렸다. 도시는 아직 완전히 죽지 않았다.",
  ]);

  const status = useMemo(() => {
    if (player.hp <= 0) return "dead";
    if (player.sanity <= 0) return "mad";
    if (player.curse >= 12) return "cursed";
    if (player.floor >= 7) return "ending";
    return "alive";
  }, [player]);

  function addLog(message) {
    setLog((prev) => [message, ...prev].slice(0, 12));
  }

  function updatePlayer(nextPlayer, message) {
    const fixed = {
      ...nextPlayer,
      hp: clamp(nextPlayer.hp, -99, nextPlayer.maxHp),
      sanity: clamp(nextPlayer.sanity, -99, nextPlayer.maxSanity),
      food: Math.max(0, nextPlayer.food),
      curse: Math.max(0, nextPlayer.curse),
    };

    setPlayer(fixed);

    if (message) addLog(message);

    if (fixed.hp <= 0) {
      setScene({
        type: "death",
        title: "죽음",
        text: "당신은 차가운 돌바닥 위에 쓰러졌다. 마지막으로 들은 것은 종소리가 아니라, 누군가 책장을 넘기는 소리였다.",
      });
    } else if (fixed.sanity <= 0) {
      setScene({
        type: "death",
        title: "광기",
        text: "당신은 더 이상 길을 걷지 않는다. 길이 당신을 걷는다. 검은 종탑은 이제 당신의 머리 안에서 울린다.",
      });
    } else if (fixed.curse >= 12) {
      setScene({
        type: "death",
        title: "타락",
        text: "저주는 더 이상 당신을 갉아먹지 않는다. 당신이 저주가 되었다. 다음 순례자는 당신을 괴물이라 부를 것이다.",
      });
    } else if (fixed.floor >= 7) {
      setScene({
        type: "ending",
        title: "종탑의 심장",
        text: "마침내 당신은 검은 종탑의 가장 낮은 방에 도착했다. 그곳에는 종이 없었다. 대신 당신의 심장이 매달려 있었다.",
      });
    }
  }

  function explore() {
    if (status !== "alive") return;

    let nextPlayer = { ...player, food: player.food - 1 };

    if (nextPlayer.food < 0) {
      nextPlayer = { ...nextPlayer, food: 0, hp: nextPlayer.hp - 4 };
      addLog("식량이 떨어졌다. 굶주림이 체력을 갉아먹는다.");
    }

    const roll = Math.random();

    if (roll < 0.4) {
      const baseMonster = pick(MONSTERS);
      const scaledMonster = {
        ...baseMonster,
        hp: baseMonster.hp + player.floor * 2,
        maxHp: baseMonster.hp + player.floor * 2,
      };

      setMonster(scaledMonster);
      setScene({
        type: "combat",
        title: scaledMonster.name,
        text: scaledMonster.text,
      });

      updatePlayer(
        nextPlayer,
        `${player.floor}층의 어둠 속에서 ${scaledMonster.name}을 만났다.`
      );

      return;
    }

    const event = pick(EVENTS);

    setScene({ type: "event", ...event });
    updatePlayer(nextPlayer, `${player.floor}층을 탐험했다. ${event.title}에 도착했다.`);
  }

  function choose(choice) {
    if (choice.condition && !choice.condition(player)) return;

    const nextPlayer = choice.effect(player);
    updatePlayer(nextPlayer, choice.result);

    setScene({
      type: "location",
      title: `${player.floor}층의 갈림길`,
      text: "선택의 여운이 아직 손끝에 남아 있다. 아래로 향하는 계단은 더 깊고 차갑다.",
    });
  }

  function attack() {
    if (!monster || status !== "alive") return;

    const relicBonus = player.relics.includes("속삭이는 양피지") ? 2 : 0;
    const playerDamage = randInt(5, 9) + relicBonus;
    const monsterHp = monster.hp - playerDamage;

    if (monsterHp <= 0) {
      const gold = randInt(monster.rewardGold[0], monster.rewardGold[1]);

      setMonster(null);

      setScene({
        type: "location",
        title: "전투 이후",
        text: `${monster.name}은 무너졌다. 그러나 죽은 것들이 정말 죽는지는 알 수 없다.`,
      });

      updatePlayer(
        {
          ...player,
          gold: player.gold + gold,
          sanity: player.sanity - 1,
        },
        `${monster.name}을 쓰러뜨렸다. 금화 ${gold}개를 얻었다.`
      );

      return;
    }

    const monsterDamage = randInt(monster.attack[0], monster.attack[1]);

    setMonster({ ...monster, hp: monsterHp });

    updatePlayer(
      { ...player, hp: player.hp - monsterDamage },
      `${monster.name}에게 ${playerDamage} 피해를 주고, ${monsterDamage} 피해를 받았다.`
    );
  }

  function flee() {
    if (!monster || status !== "alive") return;

    const damage = randInt(2, 5);
    setMonster(null);

    setScene({
      type: "location",
      title: "도망",
      text: "당신은 뒤돌아 뛰었다. 살아남았지만, 어둠 속에 무언가를 두고 온 기분이다.",
    });

    updatePlayer(
      {
        ...player,
        hp: player.hp - damage,
        sanity: player.sanity - 2,
      },
      `도망쳤다. 체력 ${damage}, 정신력 2를 잃었다.`
    );
  }

  function descend() {
    if (status !== "alive") return;

    const nextFloor = player.floor + 1;

    setScene({
      type: "location",
      title: `${nextFloor}층`,
      text: "계단은 아래로 이어진다. 벽에는 오래된 기도문이 손톱으로 새겨져 있다.",
    });

    updatePlayer(
      {
        ...player,
        floor: nextFloor,
        sanity: player.sanity - 1,
        curse: player.curse + (Math.random() < 0.35 ? 1 : 0),
      },
      `${nextFloor}층으로 내려갔다.`
    );
  }

  function rest() {
    if (status !== "alive" || player.food <= 0) return;

    updatePlayer(
      {
        ...player,
        food: player.food - 1,
        hp: Math.min(player.maxHp, player.hp + 5),
        sanity: Math.min(player.maxSanity, player.sanity + 2),
      },
      "식량을 소비해 잠시 쉬었다. 체력과 정신력이 조금 회복되었다."
    );
  }

  function restart() {
    setPlayer(INITIAL_PLAYER);
    setMonster(null);
    setScene({
      type: "intro",
      title: "검은 종탑 아래",
      text: "당신은 무너진 수도원의 지하에서 다시 깨어났다. 이번에는 더 오래 버틸 수 있을까.",
    });
    setLog(["새 회차가 시작되었다.", "검은 종탑은 다시 울린다."]);
  }

  const visibleChoices =
    scene.choices?.filter((choice) => !choice.condition || choice.condition(player)) ?? [];

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">TEXT ROGUELIKE PROTOTYPE</p>
          <h1>검은 종탑 아래</h1>
          <p className="subtitle">
            저주받은 도시의 지하로 내려가는 다크판타지 텍스트 로그라이크
          </p>
        </div>

        <button className="button secondary" onClick={restart}>
          새 회차
        </button>
      </header>

      <div className="layout">
        <main className="main">
          <section className="scene-card">
            <p className="section-label">현재 장면</p>
            <h2>{scene.title}</h2>
            <p className="scene-text">{scene.text}</p>

            {monster && scene.type === "combat" && (
              <div className="monster-box">
                <div className="bar-row">
                  <span>{monster.name}</span>
                  <span>
                    {monster.hp} / {monster.maxHp}
                  </span>
                </div>
                <div className="bar">
                  <div
                    className="bar-fill monster"
                    style={{
                      width: `${Math.max(0, (monster.hp / monster.maxHp) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="actions">
              {status === "alive" && scene.type !== "combat" && (
                <>
                  <button className="button" onClick={explore}>
                    탐험한다
                  </button>
                  <button className="button secondary" onClick={descend}>
                    아래층으로 내려간다
                  </button>
                  <button
                    className="button outline"
                    onClick={rest}
                    disabled={player.food <= 0}
                  >
                    쉰다 · 식량 1
                  </button>
                </>
              )}

              {scene.type === "event" &&
                visibleChoices.map((choice) => (
                  <button
                    className="button secondary"
                    key={choice.label}
                    onClick={() => choose(choice)}
                  >
                    {choice.label}
                  </button>
                ))}

              {status === "alive" && scene.type === "combat" && (
                <>
                  <button className="button danger" onClick={attack}>
                    공격한다
                  </button>
                  <button className="button outline" onClick={flee}>
                    도망친다
                  </button>
                </>
              )}

              {status !== "alive" && (
                <button className="button" onClick={restart}>
                  다시 시작한다
                </button>
              )}
            </div>
          </section>

          <section className="log-card">
            <p className="section-label">탐험 기록</p>
            <div className="log-list">
              {log.map((entry, index) => (
                <p key={`${entry}-${index}`}>{entry}</p>
              ))}
            </div>
          </section>
        </main>

        <aside className="side">
          <section className="status-card">
            <h3>상태</h3>

            <Stat label="체력" value={player.hp} max={player.maxHp} />
            <Stat label="정신력" value={player.sanity} max={player.maxSanity} />
            <Stat label="저주" value={player.curse} max={12} danger />

            <div className="mini-grid">
              <Mini label="층" value={`${player.floor}층`} />
              <Mini label="식량" value={player.food} />
              <Mini label="금화" value={player.gold} />
              <Mini label="기억" value={player.fragments} />
            </div>
          </section>

          <section className="status-card">
            <h3>장비와 유물</h3>

            <div className="info-box">
              <p className="small-label">무기</p>
              <p>{player.weapon}</p>
            </div>

            <div className="info-box">
              <p className="small-label">유물</p>
              {player.relics.length === 0 ? (
                <p className="muted">아직 없음</p>
              ) : (
                <ul>
                  {player.relics.map((relic) => (
                    <li key={relic}>{relic}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="status-card">
            <h3>코드 읽는 순서</h3>
            <ol className="guide">
              <li>INITIAL_PLAYER: 기본 능력치</li>
              <li>MONSTERS: 몬스터 데이터</li>
              <li>EVENTS: 선택지 사건 데이터</li>
              <li>explore(): 탐험과 랜덤 조우</li>
              <li>attack(): 전투 계산</li>
              <li>updatePlayer(): 사망·엔딩 판정</li>
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
