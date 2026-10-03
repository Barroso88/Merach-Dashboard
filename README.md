# 🚴 Merach Bike Dashboard

Aplicação web full-stack moderna, de alta performance e responsiva dedicada à monitorização de treinos de ciclismo indoor com bicicletas **Merach** (ex: Merach S02, MR-S15, MR-667) e gestão avançada de histórico desportivo.

---

## ✨ Funcionalidades Principais

### 1. ⚡ Dashboard em Tempo Real ("Live Workout")
- **Potência Atual (Watts)**:
  - Tacómetro gráfico circular SVG animado com efeito neon glow.
  - Zonas de potência FTP dinâmicas (Z1 Recuperação, Z2 Endurance, Z3 Tempo, Z4 Limiar FTP, Z5 VO2 Max, Z6 Sprint Anaeróbico).
  - % do FTP em tempo real.
- **Métricas em Destaque**:
  - **Cadência (RPM)** com identificação de cadência ideal (80-95 RPM).
  - **Velocidade (km/h)** instantânea e média.
  - **Distância Percorrida (km)**.
  - **Energia / Calorias Ativas (kcal e kJ)**.
  - **Frequência Cardíaca (BPM)** estimada ou por sensor.
- **Controlos de Treino Interativos**:
  - Ações rápidas: `Start`, `Pause`, `Resume` e `Stop`.
  - Cronómetro digital ativo formatado em estilo display de corrida (`mm:ss` / `hh:mm:ss`).
  - Modal de celebração pós-treino com confetes animados, estatísticas consolidadas e atribuição de título e notas personalizadas.
- **Controlo de Resistência Magnética**:
  - Slider deslizante de 1 a 32 níveis com feedback tátil de cores dinâmicas (verde suave para plano, âmbar para força, vermelho neon para sprint).
  - Botões de ajuste rápido (`-` e `+`).
  - Predefinições de terreno: *Plano (6)*, *Endurance (12)*, *Subida (20)*, *Sprint Max (28)*.
- **Gráfico de Linha Dinâmico em Tempo Real**:
  - Construído com Recharts, visualizando a evolução da Potência e Cadência nos últimos minutos.
  - Filtro para exibir Potência isolada, Cadência isolada ou ambos com escala dupla de eixos Y.

### 2. 📊 Secção de Relatórios e Histórico ("Analytics & Logs")
- **Filtros de Período**:
  - Alternância imediata entre visualizações: **Diário**, **Semanal**, **Mensal** ou **Todos**.
- **Cartões de Resumo Estatístico**:
  - Total de treinos realizados no período selecionado.
  - Tempo acumulado total.
  - Distância total percorrida (km).
  - Calorias totais gastas (kcal).
  - Potência média geral e pico máximo registado.
- **Gráficos de Desempenho Histórico**:
  - Gráfico de barras neon comparativo de potência média e pico por sessão.
  - Alternador para comparar evolução de Distância e Calorias.
- **Tabela de Histórico Detalhada**:
  - Lista completa com data/hora, duração, watts médios/máx, cadência média/máx, distância e calorias.
  - Ações: **Ver Detalhes** (abre modal com curva de telemetria da sessão e notas), **Eliminar Registo** e **Exportar Histórico em CSV**.

### 3. 🔌 Arquitetura de Sensores & Home Assistant
- **Modo Simulação**:
  - Motor físico de bicicleta magnética com relação torque-cadência, inércia da roda de inércia e variações realistas do pedalar humano.
  - Presets de terreno de simulação: *Ritmo Constante*, *HIIT Sprints* e *Subida Alta*.
- **Modo Home Assistant (API Real)**:
  - Suporte a chamadas REST API e WebSocket para integração com instâncias do Home Assistant.
  - Campos configuráveis de URL, Token de Acesso de Longa Duração e Entity IDs customizados:
    - Potência: `sensor.merach_bike_power`
    - Cadência: `sensor.merach_bike_cadence`
    - Velocidade: `sensor.merach_bike_speed`
    - Resistência: `number.merach_bike_resistance`
    - Frequência Cardíaca: `sensor.merach_bike_heart_rate`
  - Ferramenta de teste de ping/conexão integrada com feedback visual.

---

## 🛠️ Tecnologias Utilizadas

- **React 19**
- **Vite**
- **Tailwind CSS v4** (com design Dark Mode desportivo e cartões glassmorphism)
- **Recharts**
- **Lucide React** (ícones minimalistas e modernos)
- **Canvas-Confetti** (efeito de celebração ao finalizar treino)
- **LocalStorage API** (persistência offline de treinos e configurações)

---

## 🚀 Como Executar o Projeto

1. Instalar as dependências:
   ```bash
   npm install
   ```

2. Iniciar o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Abrir o navegador no endereço exibido (geralmente `http://localhost:5173`).

4. Para compilar a versão de produção otimizada:
   ```bash
   npm run build
   ```
