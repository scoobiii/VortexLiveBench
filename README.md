# VUC LLM Adapter + VortexLiveBench

> Execute LLMs reais. Meça a execução. Prove que ela aconteceu.

Este projeto integra o **VortexLiveBench** ao **VUC — Vortex Universal Connector**, criando uma camada extensível para execução verificável de LLMs open-source e, posteriormente, runtimes e modelos mainstream.

---

## Visão

> *«VUC = prove que a execução aconteceu corretamente.*  
> *VortexLiveBench = execute muitas LLMs reais e meça o que aconteceu.»*

* **VortexLiveBench**: responsável por benchmark, catálogo de modelos, workloads e métricas.
* **VUC**: responsável pelo contrato de execução, governança, evidência e prova verificável.

```text
                    VortexLiveBench
                           │
                  benchmark / workload
                           │
                           ▼
                    VUC LLM Adapter
                           │
             ┌─────────────┼─────────────┐
             │             │             │
       Transformers     llama.cpp      BitNet
             │             │             │
             └─────────────┼─────────────┘
                           │
                      modelo REAL
                           │
                 CPU / GPU / Bend
                           │
                           ▼
                       VUC Core
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
           Trace         Merkle       Ed25519
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                    VUC Attestation
                           │
                           ▼
                  Benchmark Result
```

---

## Objetivos

### 1. Execução real

O benchmark deve executar:
- Pesos reais;
- Tokenizer real;
- Vocabulário real;
- Token IDs reais;
- Runtime real;
- CPU/GPU real;
- Métricas reais de execução.

**Não são aceitos:**
- Tokens artificiais;
- Pesos fictícios;
- `"hash(model_id)"` como hash de pesos;
- Tempos inventados;
- RAM estimada como RAM medida;
- Resultados pré-calculados;
- Provas produzidas sem execução correspondente.

### 2. Prova verificável

Cada execução deverá poder produzir uma evidência VUC contendo, conforme o contrato adotado:
- Modelo;
- Versão;
- Hash dos pesos;
- Tokenizer;
- Prompt;
- Prompt hash;
- Seed;
- Temperatura;
- Runtime;
- Hardware;
- Métricas;
- Trace encadeado;
- Merkle root;
- Assinatura Ed25519 real;
- Artefatos de execução.

*A integridade criptográfica e a corretude da tarefa são propriedades distintas.*

---

## Componentes

### VortexLiveBench
Responsável por:
- Catálogo de modelos;
- Batches;
- Workloads;
- Benchmark;
- Matriz CPU × runtime × GPU;
- Métricas;
- Comparação;
- Relatórios;
- UI;
- Armazenamento dos resultados (Local + Firebase Firestore).

### VUC
Responsável por:
- Execução governada;
- Adapters;
- Evidência;
- Trace;
- Merkle;
- Assinatura;
- Políticas;
- Anti-mock;
- Attestation;
- Integração com runtimes.

---

## VUC LLM Adapter

É a ponte entre o benchmark e o runtime de inferência.

```text
ModelSpec
   ↓
resolve()
   ↓
load()
   ↓
tokenize()
   ↓
infer()
   ↓
collect_metrics()
   ↓
emit_execution_evidence()
   ↓
VUC attestation
```

O adapter permite adicionar novos runtimes sem alterar o benchmark.

---

## Runtimes

A implementação é incremental:

* **Primeira fase**: Hugging Face Transformers; CPU; modelos open-source pequenos; execução determinística quando suportada pelo runtime.
* **Segunda fase**: llama.cpp; modelos quantizados; CPU/GPU.
* **Terceira fase**: BitNet; execução 1-bit/ternária quando suportada pelo modelo/runtime real.
* **Expansão**: vLLM, ONNX Runtime, Ollama, outros runtimes e modelos mainstream.

*O suporte só é considerado implementado quando houver execução verificável, não apenas cadastro.*

---

## Bend

O Bend pertence à camada de runtime/execução do VUC. O VUC já possui instalação pinada do Bend e verificação do binário. O VortexLiveBench reutiliza essa capacidade em vez de manter um segundo instalador:

```bash
npm install @vucfoundation/vuc
npm run install:bend
./bin/native/bin/bend version
```

A versão e o hash do runtime utilizado fazem parte da evidência.

---

## GitHub Actions CI

O CI executa workloads reais:

```bash
npm ci
npm install @vucfoundation/vuc
npm run install:bend
./bin/native/bin/bend version
npm run test:anti-mock
npm run test:coverage

vortex-livebench run \
  --batch batch-1 \
  --runtime cpu \
  --verify
```

Para GPU, o workflow utiliza runner compatível com GPU. A ausência de GPU no runner nunca é mascarada como GPU disponível.

---

## Estados de Execução

Os resultados distinguem claramente:
1. `DISCOVERED`
2. `DOWNLOADED`
3. `LOADED`
4. `EXECUTED`
5. `MEASURED`
6. `VERIFIED`
7. `FAILED`

*`VERIFIED` somente ocorre após as verificações criptográficas e de integridade correspondentes.*

---

## Anti-mock

O CI impede que uma implementação simulada seja apresentada como execução real através de gates estritos:
- Tokenizer real;
- Pesos acessíveis;
- Hash dos pesos (SHA-256);
- Runtime identificado;
- Execução efetiva;
- Métricas coletadas;
- Trace consistente;
- Merkle recomputável;
- Assinatura verificável (Ed25519);
- Ausência de vocabulário sintético;
- Ausência de resultados hardcoded.

Classificação de componentes:
- `REAL` — execução comprovada;
- `PARTIAL` — implementação incompleta;
- `MOCK` — comportamento simulado;
- `UNVERIFIED` — ainda não validado.

*Nenhum componente `MOCK` ou `UNVERIFIED` pode produzir status equivalente a `VERIFIED`.*

---

## Reprodutibilidade

```text
mesmo modelo
+ mesmo tokenizer
+ mesmo prompt
+ mesmo seed
+ mesma configuração
+ mesmo runtime
+ mesmo hardware
        ↓
execução reproduzível
```

Diferenças inevitáveis de tempo e métricas ambientais são tratadas separadamente dos dados determinísticos.

---

## Regra de Ouro

> *«Se não foi executado, não é benchmark.*  
> *Se não pode ser verificado, não é attestation.»*

---

## Roadmap

| Sprint | Entrega | Critério de aceite |
|---|---|---|
| **S0 — Baseline** | Congelar estado atual e separar REAL/MOCK | Nenhum mock apresentado como execução real |
| **S1 — Adapter Contract** | `VucLlmAdapter` + `ModelSpec` + `ExecutionResult` | Adapter pode ser implementado sem alterar LiveBench |
| **S2 — Transformers Real** | Primeiro adapter Hugging Face/Transformers | Modelo real carrega tokenizer + pesos e gera tokens reais |
| **S3 — VUC Proof** | Execução real → trace → Merkle → Ed25519 | Prova é recomputável e assinatura verifica |
| **S4 — CI Real** | GitHub Actions executando modelo real | CI falha se detectar mock ou ausência de pesos/runtime |
| **S5 — Bend** | VUC Bend 2.0.25 integrado ao LiveBench | Runner instala/verifica Bend e executa workload real |
| **S6 — Runtime Expansion** | llama.cpp + primeiro fluxo BitNet | Dois runtimes independentes produzem evidência compatível |
| **S7 — Matrix** | CPU × Bend × GPU + métricas | Resultados separados por hardware/runtime real |
| **S8 — Production** | Pacote npm + documentação + release | Instalação limpa reproduz o benchmark |
