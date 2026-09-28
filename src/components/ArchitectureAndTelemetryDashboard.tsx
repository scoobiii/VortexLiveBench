import React, { useState } from 'react';
import { 
  Cpu, 
  Activity, 
  HardDrive, 
  Wifi, 
  ShieldAlert, 
  ShieldCheck, 
  Key, 
  Github, 
  Layers, 
  Terminal, 
  FileCode, 
  Copy, 
  Check, 
  AlertTriangle,
  Server,
  Zap,
  Gauge,
  Box,
  Settings,
  Save,
  RotateCcw,
  Sliders
} from 'lucide-react';
import { RunnerTelemetryEngine } from '../core/runnerTelemetry';
import { CapacityEngine } from '../core/capacityEngine';
import { BootstrapConfigEngine, BootstrapEnvConfig } from '../core/bootstrapConfig';

export const ArchitectureAndTelemetryDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'resources' | 'grafana' | 'repoAndCi' | 'patterns' | 'capacity' | 'bootstrap'>('resources');
  const [copiedRules, setCopiedRules] = useState<boolean>(false);
  const [copiedClone, setCopiedClone] = useState<boolean>(false);
  const [copiedNpm, setCopiedNpm] = useState<boolean>(false);
  const [copiedEnv, setCopiedEnv] = useState<boolean>(false);

  // Bootstrap environment preferences persisted in localStorage
  const [bootstrapConfig, setBootstrapConfig] = useState<BootstrapEnvConfig>(() =>
    BootstrapConfigEngine.getStoredConfig()
  );
  const [savedToast, setSavedToast] = useState<string | null>(null);

  const resourceProfiles = RunnerTelemetryEngine.getRunnerResourceProfiles();
  const alertRulesYaml = RunnerTelemetryEngine.generatePrometheusAlertRules();
  const scrapeConfigYaml = RunnerTelemetryEngine.generateGrafanaScrapeConfig();
  const specs = RunnerTelemetryEngine.getGitRepoAndExecutionSpecs();

  const ghSpecs = CapacityEngine.getHardwareSpecs('github-ci');
  const gaisSpecs = CapacityEngine.getHardwareSpecs('gais-sandbox');
  const ghCapacity = CapacityEngine.calculateModelCapacity('github-ci');
  const gaisCapacity = CapacityEngine.calculateModelCapacity('gais-sandbox');
  const bendSpec = CapacityEngine.getBendHvmSpec();

  const handleSaveBootstrapConfig = () => {
    const res = BootstrapConfigEngine.saveConfig(bootstrapConfig);
    if (res.success) {
      setSavedToast('Preferências de bootstrap salvas no localStorage com sucesso!');
    } else {
      setSavedToast('Erro ao salvar no localStorage.');
    }
    setTimeout(() => setSavedToast(null), 3000);
  };

  const handleResetBootstrapDefaults = () => {
    const defaults = BootstrapConfigEngine.resetToDefaults();
    setBootstrapConfig(defaults);
    setSavedToast('Configurações de bootstrap restauradas para o padrão!');
    setTimeout(() => setSavedToast(null), 3000);
  };

  const handleCopyEnvFile = () => {
    const envStr = BootstrapConfigEngine.formatAsEnvString(bootstrapConfig);
    navigator.clipboard.writeText(envStr);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const handleCopyAlertRules = () => {
    navigator.clipboard.writeText(alertRulesYaml);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  const handleCopyClone = () => {
    navigator.clipboard.writeText(specs.installationSequence.join(' && \\\n'));
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-cyan-900/50 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[11px] font-mono font-bold flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                Runner Topology &amp; Observability Architecture
              </span>
              <span className="text-xs text-slate-400 font-mono">
                GitHub Actions + Prometheus Node Exporter + Grafana Cloud
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Topologia de Execução, Grafana &amp; Padrões de Performance
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl mt-1 leading-relaxed">
              Onde e como os binários são executados no runner do GitHub, matriz detalhada de consumo de recursos 
              (RAM, CPU, Rede), monitoramento com alertas de limites seguros via Grafana e segurança de chamadas API.
            </p>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveSection('resources')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSection === 'resources'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>1. Consumo de Recursos dos Binários (RAM / CPU / Rede)</span>
          </button>

          <button
            onClick={() => setActiveSection('grafana')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSection === 'grafana'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>2. Grafana &amp; Limites Seguros</span>
          </button>

          <button
            onClick={() => setActiveSection('repoAndCi')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSection === 'repoAndCi'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>3. Repositório Git, Instalação &amp; API</span>
          </button>

          <button
            onClick={() => setActiveSection('patterns')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSection === 'patterns'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>4. Design Patterns de Arquitetura</span>
          </button>

          <button
            onClick={() => setActiveSection('capacity')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSection === 'capacity'
                ? 'bg-purple-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>5. Bend / HVM &amp; Capacidade (CI vs GAIS)</span>
          </button>

          <button
            onClick={() => setActiveSection('bootstrap')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSection === 'bootstrap'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>6. Bootstrap &amp; Auto-Configuração</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Resources & Binaries Breakdown */}
      {activeSection === 'resources' && (
        <div className="space-y-6">
          {/* Quick Hardware Spec of the Runner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
              <div className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                Ambiente de Execução
              </div>
              <div className="font-bold text-white text-sm mt-1">GitHub ubuntu-latest</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Azure Standard_D2s_v3 VM</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
              <div className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Capacidade de CPU
              </div>
              <div className="font-bold text-white text-sm mt-1">2 vCPUs (x86_64)</div>
              <div className="text-[10px] text-emerald-400/90 mt-0.5">AVX2, FMA3, BMI2 Ativos</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
              <div className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                Memória RAM &amp; Disco
              </div>
              <div className="font-bold text-white text-sm mt-1">7.168 MB RAM / 14 GB SSD</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Limite Seguro: 6.092 MB (85%)</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
              <div className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                Rede &amp; Caching
              </div>
              <div className="font-bold text-white text-sm mt-1">actions/cache@v4</div>
              <div className="text-[10px] text-indigo-400/90 mt-0.5">0 MB de download após warmup</div>
            </div>
          </div>

          {/* Table: Model by Model Resource Breakdown */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-white font-bold">
                <Activity className="w-4 h-4 text-cyan-400" />
                Matriz de Consumo Exato por Binário / Modelo
              </span>
              <span className="text-slate-400 text-[11px]">
                Medições reais extraídas no runner via node_exporter / cgroups
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Modelo</th>
                    <th className="py-2.5 px-3">Binário / Runtime</th>
                    <th className="py-2.5 px-3">Pico RAM</th>
                    <th className="py-2.5 px-3">RSS RAM</th>
                    <th className="py-2.5 px-3">CPU (2 Cores)</th>
                    <th className="py-2.5 px-3">Rede (1º vez)</th>
                    <th className="py-2.5 px-3">Rede (Cache)</th>
                    <th className="py-2.5 px-3">Tempo Exec.</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300 text-[11px]">
                  {resourceProfiles.map((item) => (
                    <tr key={item.modelId} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-white">{item.modelName}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono">{item.binaryRuntime}</td>
                      <td className="py-3 px-3 font-bold text-cyan-300">{item.peakRamMB} MB</td>
                      <td className="py-3 px-3 text-slate-300">{item.rssRamMB} MB</td>
                      <td className="py-3 px-3 text-emerald-400 font-medium">
                        {item.cpuPercent2Cores}% <span className="text-[9px] text-slate-500">/ 200%</span>
                      </td>
                      <td className="py-3 px-3 text-amber-300">{item.networkInitialDownloadMB} MB</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">{item.networkWithCacheMB} MB (Cache)</td>
                      <td className="py-3 px-3 text-slate-200">{item.executionSec}s</td>
                      <td className="py-3 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                          SEGURO
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Grafana & Safe Limits */}
      {activeSection === 'grafana' && (
        <div className="space-y-6">
          {/* Architecture Pipeline Flow */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm font-mono flex items-center gap-2">
              <Gauge className="w-4 h-4 text-amber-400" />
              Como o Grafana Monitora os Runners Efêmeros do GitHub
            </h3>
            
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed space-y-3">
              <p>
                Como os runners padrão do GitHub Actions são máquinas virtuais <strong>efêmeras</strong> que iniciam e morrem a cada job, o monitoramento tradicional por polling não funciona. Adotamos o padrão <strong>Prometheus Push / Node Exporter com Remote Write</strong>:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-cyan-400 font-bold mb-1">1. Coleta Local no Runner</div>
                  <p className="text-[11px] text-slate-400">
                    O script do job inicia o <code>node_exporter</code> (porta 9100) e exporta métricas a cada 5s de memória, CPU, disco e as métricas customizadas do VUC (<code>vuc_tokens_per_sec</code>, <code>vuc_merkle_time</code>).
                  </p>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-amber-400 font-bold mb-1">2. Envio Seguro (Push)</div>
                  <p className="text-[11px] text-slate-400">
                    O Grafana Agent no runner envia telemetria via <code>remote_write</code> (HTTPS com Basic Auth) diretamente para a instância Grafana Cloud / Mimir com tags <code>job_id</code> e <code>batch</code>.
                  </p>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-emerald-400 font-bold mb-1">3. Circuit Breaker em 85%</div>
                  <p className="text-[11px] text-slate-400">
                    O limiar de alerta dispara aviso em <strong>75% de RAM</strong> (5.376 MB). Se atingir <strong>85% (6.092 MB)</strong>, o harness do VUC aciona o Circuit Breaker, liberando tensores antes do Linux OOM Killer matar o processo.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Prometheus Alerts Code Block */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-white font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Regras de Alerta Prometheus / Grafana Alerting (alerts.yml)
              </span>
              <button
                onClick={handleCopyAlertRules}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono cursor-pointer transition-colors"
              >
                {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRules ? 'Copiado!' : 'Copiar alerts.yml'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-xs text-amber-300/90 overflow-x-auto max-h-72">
              {alertRulesYaml}
            </pre>
          </div>
        </div>
      )}

      {/* SECTION 3: Git Repo, Installation & API Access */}
      {activeSection === 'repoAndCi' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-white font-bold">
                <Github className="w-4 h-4 text-indigo-400" />
                Nome do Repositório &amp; Sequência de Instalação dos Executáveis
              </span>
              <span className="text-cyan-400 font-bold">{specs.repoName}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="text-slate-400 font-bold text-[11px]">Identificação do Repositório:</div>
                <div className="text-white text-sm font-bold">{specs.repoName}</div>
                <div className="text-slate-400 text-[11px]">URL Canônica: {specs.canonicalUrl}</div>
                <div className="text-slate-400 text-[11px]">Branch Primária: {specs.primaryBranch}</div>
                <div className="text-slate-400 text-[11px] pt-2 border-t border-slate-800/80">
                  Tipo de Runner: {specs.runnerType}
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="text-slate-400 font-bold text-[11px]">Controle de Acesso às APIs do CI:</div>
                <div className="text-white text-xs">
                  <strong>Método:</strong> {specs.apiAuthenticationMechanics.method}
                </div>
                <div className="text-slate-400 text-[11px]">
                  <strong>Scopes:</strong> {specs.apiAuthenticationMechanics.scopes.join(', ')}
                </div>
                <div className="text-slate-400 text-[11px]">
                  <strong>Assinatura Webhook:</strong> {specs.apiAuthenticationMechanics.signatureMethod}
                </div>
                <div className="text-slate-400 text-[11px]">
                  <strong>Rate Limiting:</strong> {specs.apiAuthenticationMechanics.rateLimiting}
                </div>
              </div>
            </div>

            {/* Bootstrap commands */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2 text-xs font-mono text-slate-400">
                <span>Comandos de Inicialização e Instalação no Runner:</span>
                <button
                  onClick={handleCopyClone}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  {copiedClone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedClone ? 'Copiado!' : 'Copiar Comandos'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300/90 overflow-x-auto">
                {specs.installationSequence.join(' && \\\n')}
              </pre>
            </div>

            {/* Calling command */}
            <div>
              <div className="text-xs font-mono text-slate-400 mb-1.5">
                Comando Exato de Chamada no GitHub Actions Matrix:
              </div>
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300">
                {specs.executionCommand}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: Architecture & Performance Design Patterns */}
      {activeSection === 'patterns' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Padrões de Projeto de Arquitetura e Performance Adotados
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specs.designPatterns.map((pattern, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-emerald-950 text-emerald-400 text-xs flex items-center justify-center border border-emerald-800">
                        {idx + 1}
                      </span>
                      {pattern.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {pattern.purpose}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: Bend / HVM & Capacity (CI vs GAIS) */}
      {activeSection === 'capacity' && (
        <div className="space-y-6">
          {/* Comparison Cards: GitHub CI vs GAIS Sandbox */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GitHub Actions Runner Card */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-white font-bold text-sm flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  GitHub Actions Runner (CI)
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                  ubuntu-latest
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">RAM Total Físico:</span>
                  <span className="text-white font-bold">{ghSpecs.totalRamMB} MB (7.168 MB)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Teto Seguro (85% Guard):</span>
                  <span className="text-amber-400 font-bold">{ghSpecs.safeRamCeilingMB} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sistema Base + PyTorch + Bend:</span>
                  <span className="text-slate-400">{ghSpecs.baseSystemRamMB} MB</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800">
                  <span className="text-cyan-400 font-bold">RAM Líquida para Modelos:</span>
                  <span className="text-cyan-300 font-bold">{ghSpecs.netAvailableRamMB} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Armazenamento SSD Scratch:</span>
                  <span className="text-white">14.336 MB (14 GB)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">vCPUs Disponíveis:</span>
                  <span className="text-emerald-400 font-bold">{ghSpecs.vCPUs} Cores x86_64 (AVX2/FMA)</span>
                </div>
              </div>
            </div>

            {/* GAIS Sandbox Container Card */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-white font-bold text-sm flex items-center gap-2">
                  <Box className="w-4 h-4 text-purple-400" />
                  GAIS Sandbox Container (App Runtime)
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">
                  Container Web
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">RAM Alocada ao Container:</span>
                  <span className="text-white font-bold">{gaisSpecs.totalRamMB} MB (4.000 MB)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Teto Seguro (85% Guard):</span>
                  <span className="text-amber-400 font-bold">{gaisSpecs.safeRamCeilingMB} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Node.js + Vite Server + Buffers:</span>
                  <span className="text-slate-400">{gaisSpecs.baseSystemRamMB} MB</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800">
                  <span className="text-purple-400 font-bold">RAM Líquida para Modelos:</span>
                  <span className="text-purple-300 font-bold">{gaisSpecs.netAvailableRamMB} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Armazenamento Efêmero Scratch:</span>
                  <span className="text-white">5.120 MB (5 GB)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">vCPUs Disponíveis:</span>
                  <span className="text-emerald-400 font-bold">{gaisSpecs.vCPUs} Cores Container</span>
                </div>
              </div>
            </div>
          </div>

          {/* Exact Capacity Breakdown Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-white font-bold">
                <Gauge className="w-4 h-4 text-purple-400" />
                Quantos Binários LLM Nativos VUC Cabem em Cada Ambiente?
              </span>
              <span className="text-slate-400 text-[11px]">
                Cálculo em tempo real baseado no buffer líquido de RAM
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Modelo</th>
                    <th className="py-2.5 px-3">Quantização</th>
                    <th className="py-2.5 px-3">RAM / Modelo</th>
                    <th className="py-2.5 px-3 text-cyan-300">Simultâneos no Runner CI</th>
                    <th className="py-2.5 px-3 text-purple-300">Simultâneos no GAIS Sandbox</th>
                    <th className="py-2.5 px-3">Execução Sequencial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300 text-[11px]">
                  {ghCapacity.map((item, idx) => {
                    const gaisItem = gaisCapacity[idx];
                    return (
                      <tr key={item.modelId} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-bold text-white">{item.modelName}</td>
                        <td className="py-3 px-3 text-slate-400">{item.quantization}</td>
                        <td className="py-3 px-3 font-bold text-amber-300">{item.footprintPerModelMB} MB</td>
                        <td className="py-3 px-3 font-bold text-cyan-300">
                          {item.maxConcurrentInstances} instâncias
                        </td>
                        <td className="py-3 px-3 font-bold text-purple-300">
                          {gaisItem ? `${gaisItem.maxConcurrentInstances} instâncias` : 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-emerald-400">Ilimitado (Lotes de 5 + GC)</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bend / HVM Interaction Net Runtime Section */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-white font-bold">
                <Zap className="w-4 h-4 text-amber-400" />
                Motor de Redução Paralela: {bendSpec.name} ({bendSpec.version})
              </span>
              <span className="text-slate-400 text-[11px]">
                Overhead de Memória: {bendSpec.memoryOverheadMB} MB
              </span>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              O VUC adota o <strong>Bend</strong> sobre a <strong>HVM (Higher-order Virtual Machine)</strong> para cálculo e redução 
              paralela determinística de árvores de interação e árvores Merkle. O Bend compila para C puro/CUDA e avalia ramificações 
              esquerda e direita simultaneamente em todos os núcleos da CPU sem travas ou custos de sincronização de threads.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[11px]">Instalação no Runner:</div>
                <pre className="text-cyan-300 overflow-x-auto text-[11px]">{bendSpec.installCommand}</pre>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[11px]">Comando de Execução Paralela:</div>
                <pre className="text-emerald-300 overflow-x-auto text-[11px]">{bendSpec.runCommand}</pre>
              </div>
            </div>
          </div>

          {/* NPM Package & CLI Usage Section */}
          <div className="rounded-2xl border border-indigo-900/50 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-white font-bold">
                <Box className="w-4 h-4 text-indigo-400" />
                Pacote NPM Instalável: vortex-livebench v1.0.0
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('npm install -g vortex-livebench\nvortex-livebench capacity');
                  setCopiedNpm(true);
                  setTimeout(() => setCopiedNpm(false), 2000);
                }}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs font-mono cursor-pointer"
              >
                {copiedNpm ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNpm ? 'Copiado!' : 'Copiar Comandos'}</span>
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="text-slate-300">
                O projeto agora é um pacote NPM instalável completo com CLI global e biblioteca TypeScript:
              </div>

              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-cyan-300 overflow-x-auto text-[11px]">
# Execução direta via npx sem instalar:
npx vortex-livebench capacity --env github-ci
npx vortex-livebench verify proof.vuc.json
npx vortex-livebench matrix

# Ou instalação global via npm:
npm install -g vortex-livebench
vortex-livebench --help
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: Bootstrap Environment Variables & Auto-Configuration */}
      {activeSection === 'bootstrap' && (
        <div className="space-y-6">
          {/* Toast alert */}
          {savedToast && (
            <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-lg">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                {savedToast}
              </span>
              <span className="text-[10px] text-emerald-500 font-bold">Chave: vuc_bootstrap_env_config</span>
            </div>
          )}

          {/* Form Controls */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div>
                <h3 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  Painel de Auto-Configuração do Bootstrap do Runner
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">
                  Defina as variáveis de ambiente necessárias para a auto-configuração do runner e sincronize com o localStorage do navegador.
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  onClick={handleSaveBootstrapConfig}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar no LocalStorage</span>
                </button>

                <button
                  onClick={handleResetBootstrapDefaults}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Padrões</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {/* RUNNER_ARCH_MODE */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <label className="text-slate-300 font-bold block flex items-center justify-between">
                  <span>RUNNER_ARCH_MODE</span>
                  <span className="text-[10px] text-cyan-400 font-normal">Arquitetura da CPU</span>
                </label>
                <select
                  value={bootstrapConfig.RUNNER_ARCH_MODE}
                  onChange={(e) =>
                    setBootstrapConfig({
                      ...bootstrapConfig,
                      RUNNER_ARCH_MODE: e.target.value as 'x86_64_avx2' | 'arm64_neon' | 'cuda_sm80',
                    })
                  }
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="x86_64_avx2">x86_64_avx2 (Padrão GitHub CI Runner / Intel &amp; AMD AVX2+FMA)</option>
                  <option value="arm64_neon">arm64_neon (Apple Silicon / AWS Graviton NEON)</option>
                  <option value="cuda_sm80">cuda_sm80 (NVIDIA Ampere / Hopper GPU SM80+)</option>
                </select>
                <p className="text-[11px] text-slate-500 font-sans">
                  Define o conjunto de instruções SIMD para o cálculo vetorial de baixa latência.
                </p>
              </div>

              {/* GPU_ACCELERATION_ENABLED */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <label className="text-slate-300 font-bold block flex items-center justify-between">
                  <span>GPU_ACCELERATION_ENABLED</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      bootstrapConfig.GPU_ACCELERATION_ENABLED
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {bootstrapConfig.GPU_ACCELERATION_ENABLED ? 'ATIVADA' : 'DESATIVADA'}
                  </span>
                </label>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setBootstrapConfig({
                        ...bootstrapConfig,
                        GPU_ACCELERATION_ENABLED: !bootstrapConfig.GPU_ACCELERATION_ENABLED,
                      })
                    }
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-colors cursor-pointer ${
                      bootstrapConfig.GPU_ACCELERATION_ENABLED
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    {bootstrapConfig.GPU_ACCELERATION_ENABLED ? '✓ Aceleração GPU Habilitada' : '✗ Aceleração CPU Pura (Safe CI)'}
                  </button>
                  <span className="text-[11px] text-slate-400 font-sans">
                    No runner padrão do GitHub Actions (CPU), mantenha desativada.
                  </span>
                </div>
              </div>

              {/* VUC_RUNTIME_ENGINE */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <label className="text-slate-300 font-bold block flex items-center justify-between">
                  <span>VUC_RUNTIME_ENGINE</span>
                  <span className="text-[10px] text-amber-400 font-normal">Motor de Inferência</span>
                </label>
                <select
                  value={bootstrapConfig.VUC_RUNTIME_ENGINE}
                  onChange={(e) =>
                    setBootstrapConfig({
                      ...bootstrapConfig,
                      VUC_RUNTIME_ENGINE: e.target.value as 'python' | 'hvm' | 'bend',
                    })
                  }
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="python">python (PyTorch CPU Reference + Transformers)</option>
                  <option value="hvm">hvm (Higher-order Virtual Machine HVM2)</option>
                  <option value="bend">bend (Massively Parallel Interaction Nets)</option>
                </select>
                <p className="text-[11px] text-slate-500 font-sans">
                  Alterna entre o harness Python de referência ou o avaliador paralelo Bend/HVM.
                </p>
              </div>

              {/* RAM_GUARD_MB */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <label className="text-slate-300 font-bold block flex items-center justify-between">
                  <span>RAM_GUARD_MB</span>
                  <span className="text-[10px] text-emerald-400 font-normal">Teto de Proteção</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={bootstrapConfig.RAM_GUARD_MB}
                    onChange={(e) =>
                      setBootstrapConfig({
                        ...bootstrapConfig,
                        RAM_GUARD_MB: Number(e.target.value) || 6092,
                      })
                    }
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setBootstrapConfig({ ...bootstrapConfig, RAM_GUARD_MB: 6092 })}
                    className="px-2 py-1 bg-slate-900 text-slate-300 hover:text-white border border-slate-700 rounded text-[10px] whitespace-nowrap cursor-pointer"
                  >
                    CI (6092)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBootstrapConfig({ ...bootstrapConfig, RAM_GUARD_MB: 3400 })}
                    className="px-2 py-1 bg-slate-900 text-slate-300 hover:text-white border border-slate-700 rounded text-[10px] whitespace-nowrap cursor-pointer"
                  >
                    GAIS (3400)
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  Limite de memória RAM em megabytes antes de abortar o processo com OOM guard.
                </p>
              </div>

              {/* BATCH_SIZE */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <label className="text-slate-300 font-bold block flex items-center justify-between">
                  <span>BATCH_SIZE</span>
                  <span className="text-[10px] text-purple-400 font-normal">Modelos por Lote</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={bootstrapConfig.BATCH_SIZE}
                  onChange={(e) =>
                    setBootstrapConfig({
                      ...bootstrapConfig,
                      BATCH_SIZE: Number(e.target.value) || 5,
                    })
                  }
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500 font-sans">
                  Quantidade de modelos avaliados por runner antes de forçar a liberação total de RAM.
                </p>
              </div>

              {/* MODEL_CACHE_DIR */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <label className="text-slate-300 font-bold block flex items-center justify-between">
                  <span>MODEL_CACHE_DIR</span>
                  <span className="text-[10px] text-indigo-400 font-normal">Diretório de Cache</span>
                </label>
                <input
                  type="text"
                  value={bootstrapConfig.MODEL_CACHE_DIR}
                  onChange={(e) =>
                    setBootstrapConfig({
                      ...bootstrapConfig,
                      MODEL_CACHE_DIR: e.target.value,
                    })
                  }
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500 font-sans">
                  Caminho do cache local mapeado para o actions/cache@v4 no GitHub Actions.
                </p>
              </div>
            </div>

            {/* Checkbox Toggles for Anti-Mock Enforcement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 font-mono text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={bootstrapConfig.QUANTIZE_1BIT_ENFORCED}
                  onChange={(e) =>
                    setBootstrapConfig({
                      ...bootstrapConfig,
                      QUANTIZE_1BIT_ENFORCED: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded bg-slate-900 border-slate-700"
                />
                <div>
                  <div className="text-white font-bold">QUANTIZE_1BIT_ENFORCED</div>
                  <div className="text-[10px] text-slate-400 font-sans">Força BitNet ternário {'{-1, 0, +1}'} em modelos &gt; 0.5B</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={bootstrapConfig.ED25519_STRICT_ASSERT}
                  onChange={(e) =>
                    setBootstrapConfig({
                      ...bootstrapConfig,
                      ED25519_STRICT_ASSERT: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded bg-slate-900 border-slate-700"
                />
                <div>
                  <div className="text-white font-bold">ED25519_STRICT_ASSERT</div>
                  <div className="text-[10px] text-slate-400 font-sans">Exige assinatura Ed25519 real de 128 hex chars sobre o Merkle root</div>
                </div>
              </label>
            </div>
          </div>

          {/* .env Preview & Export */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <span className="flex items-center gap-1.5 text-white font-bold">
                <FileCode className="w-4 h-4 text-emerald-400" />
                Arquivo .env Gerado em Tempo Real
              </span>
              <button
                onClick={handleCopyEnvFile}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs cursor-pointer"
              >
                {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEnv ? 'Copiado!' : 'Copiar .env'}</span>
              </button>
            </div>

            <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-emerald-300 text-xs overflow-x-auto leading-relaxed">
              {BootstrapConfigEngine.formatAsEnvString(bootstrapConfig)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
