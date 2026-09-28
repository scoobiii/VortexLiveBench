# AGENTS.md

## Objetivo
Modelo com VUC nativo: toda geração emite um proof verificável.

## Regras do agente
1. Determinismo: seed fixo e temperature 0 nas verificações. Mesma entrada => mesmo trace, mesmo merkle_root.
2. Trace encadeado: parentHash do passo 1 = prompt_hash; cada passo hasheia parentHash + token + tokenId. O merkle_root cobre todos os passos.
3. Validade não é correção: integridade do trace e qualidade da saída são checagens separadas. Nunca reportar sucesso só porque o status é VERIFIED_VALID.
4. Sem simulação: tokenId do vocabulário real do tokenizer e assinatura Ed25519 real sobre o merkle_root. String legível tipo "..._VALID" não é assinatura.
5. Registrar o modelo: weights_sha256, tensor_merkle_root, quantização, runner_env.
6. Ler código, workflows e schemas antes de propor. Não chutar formatos. Entregar com teste.
7. Respostas curtas e diretas.

## Comandos

### Desenvolvimento e Testes Locais (package.json)
- `npm run dev`: Inicia o servidor de desenvolvimento Vite em `http://localhost:3000` (`vite --port=3000 --host=0.0.0.0`).
- `npm run build`: Compila a aplicação para produção (`vite build`).
- `npm run preview`: Executa o servidor de pré-visualização do bundle de produção (`vite preview`).
- `npm run lint`: Checagem estrita de tipos TypeScript sem emissão de arquivos (`tsc --noEmit`).
- `npm test`: Executa os testes unitários e de integração com Vitest (`vitest run`).
- `npm run test:coverage`: Executa os testes exigindo 100% de cobertura (Stmts, Branch, Funcs, Lines) via engine V8 (`vitest run --coverage`).
- `npm run clean`: Remove artefatos de build (`rm -rf dist server.js`).

### Workflows de CI no GitHub Actions (.github/workflows/vuc-livebench.yml)
- **Instalação das dependências e PyTorch CPU**:
  ```bash
  pip install --upgrade pip
  pip install torch --index-url https://download.pytorch.org/whl/cpu
  pip install transformers accelerate huggingface_hub cryptography blake3 requests
  ```
- **Verificação de Cobertura 100% no Runner**:
  ```bash
  npm ci || npm install
  npm run test:coverage
  ```
- **Execução do Harness VUC LiveBench**:
  ```bash
  python vuc_harness.py \
    --batch "${{ matrix.batch }}" \
    --max-sub-half-b 0.5 \
    --quantize-1bit \
    --verify-merkle \
    --ram-guard-mb 7000 \
    --output-report "vuc_report_${{ matrix.batch }}.json"
  ```
- **Checagem de Limite de Memória RAM no Runner (7 GB)**:
  ```bash
  AVAILABLE_RAM_MB=$(free -m | awk '/^Mem:/{print $7}')
  ```

## Estrutura do proof
model, execution (prompt, prompt_hash, seed, temperature, output_text, merkle_root, assinatura), trace[], status.

## Definição de pronto
- Trace recomputado bate com merkle_root e proof_id
- Assinatura Ed25519 verifica com a chave pública
- Dois runs com mesma seed: tudo igual, exceto created_at e tempos
- Saída satisfaz a tarefa (ex.: contém YES/NO quando o prompt exige)
- Teste cobrindo cada item acima

## Proibido
- Vocabulário sintético ou tokenIds fixos fora do tokenizer
- Marcar VERIFIED_VALID sem checar a correção da saída
- Mudar o schema sem atualizar testes e CI

## Antes de codar
Ler o schema real e os workflows do repo.
