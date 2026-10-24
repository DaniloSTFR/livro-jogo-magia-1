"""Spec 02 — correções pontuais no book.json (mortes falsas, saídas perdidas, CRLF).

Executado uma vez em 2026-10-24. Guardado como registro; não precisa ser rodado de novo
(ele recusa rodar se o book.json já estiver corrigido).
Uso: python3 scripts/fixes/2026-10-24-spec02.py
"""
import json

PATH = "src/game/book.json"
data = json.load(open(PATH, encoding="utf-8"))
B = data["paragraphs"]
P = lambda n: B[str(n)]

assert P(190).get("end") == "death", "book.json já parece corrigido pela Spec 02"

# 1. CRLF -> LF em todos os textos
def lf(x):
    if isinstance(x, str): return x.replace("\r\n", "\n").replace("\r", "\n")
    if isinstance(x, list): return [lf(v) for v in x]
    if isinstance(x, dict): return {k: lf(v) for k, v in x.items()}
    return x
data = lf(data); B = data["paragraphs"]

def unend(n): P(n).pop("end", None)
def add(n, *choices, first=False):
    cs = [dict(c) for c in choices]
    P(n)["choices"] = cs + P(n)["choices"] if first else P(n)["choices"] + cs
def effect(n, amount, text, repeatable=False):
    e = {"stat": "stamina", "amount": amount, "auto": False, "text": text}
    if repeatable: e["repeatable"] = True
    P(n)["effects"].append(e)
DEATH = 0  # DEATH_ID em src/game/book.ts

# 2. Finais falsos
unend(165)
add(165, {"to": 206, "label": "Conseguiu três testes de SORTE seguidos: as cobras estão mortas"})
effect(165, -3, "Cada vez que tiver Azar, uma cobra o morde (3 pontos de ENERGIA).", repeatable=True)

unend(190); add(190, {"to": 126, "label": "Volte para 126 levando os dentes que quiser"})
unend(305); add(305, {"to": 117, "label": "Volte para 117 e lute contra o assassino"})
unend(328); add(328, {"to": 47, "label": "Volte para 47 e lute contra o Goblin"})
effect(328, -3, "Sem cera de abelha: o Goblin o ataca (3 pontos adicionais de ENERGIA).")
unend(346); add(346, {"to": 420, "label": "Vá para 420 para terminar de derrotá-la"})
unend(431); add(431, {"to": 79, "label": "Vá para 79, protegido pelo campo de força"})

# 3. Saídas perdidas
add(299, {"to": 158, "label": "Volte para 158 e escolha novamente (sem suco de Blimberry)"}, first=True)
add(303, {"to": 63, "label": "Volte para 63 e escolha novamente, depressa (sem pedrinhas)"}, first=True)
add(388,
    {"to": 227, "label": "Sem dente de Gigante, ou se a Mantícora vencer o Gigante: lute com sua arma"},
    {"to": 420, "label": "Se a Mantícora vencer o Gigante: lance outra magia"})
add(420, {"to": 227, "label": "Sem ENERGIA para lançar magia: lute contra a criatura com sua arma"}, first=True)

# 4. §390: teste de sorte com duas saídas para o resultado sortudo
P(390)["choices"] = [
    {"to": 64, "label": "Se tiver Azar: perde a mochila e precisa tentar outro método de fuga"},
    {"to": 151, "label": "Se tiver SORTE: volte à bifurcação e siga pelo outro caminho"},
    {"to": 3, "label": "Se tiver SORTE: retorne à câmara principal e pegue a outra passagem"},
]

# 5. Sem saída quando Libra já foi usada: o texto encerra a jornada
for n, label in [
    (206, "Libra já foi invocada: você morre preso no fosso"),
    (228, "Libra já foi invocada: você fica preso na caverna desmoronada"),
    (303, "Libra já foi invocada: sua jornada termina aqui"),
    (433, "Libra já foi invocada: sua jornada termina aqui"),
]:
    add(n, {"to": DEATH, "label": label, "libraUsedOnly": True})

with open(PATH, "w", encoding="utf-8", newline="\n") as f:
    json.dump(data, f, ensure_ascii=False)
print("Spec 02 aplicada.")
